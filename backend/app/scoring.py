from __future__ import annotations

from datetime import date
from math import tanh
from statistics import mean, median, pstdev

from sqlalchemy.orm import Session

from app.models import (
    Benchmark,
    BenchmarkPrice,
    Company,
    StockPrice,
    Technology,
    TechnologyCompanyMap,
    TechnologyScore,
)


SPY_TICKER = "SPY"
SHORT_WINDOW_YEARS = 2.0


def _adj(value) -> float:
    return float(value)


def _first_on_or_after(rows: list[tuple[date, float]], start: date) -> tuple[date, float] | None:
    for d, px in rows:
        if d >= start:
            return d, px
    return None


def _last_on_or_before(rows: list[tuple[date, float]], end: date) -> tuple[date, float] | None:
    hit = None
    for d, px in rows:
        if d <= end:
            hit = (d, px)
        else:
            break
    return hit


def _load_company_series(db: Session, company_id: int) -> list[tuple[date, float]]:
    rows = (
        db.query(StockPrice.date, StockPrice.adj_close)
        .filter(StockPrice.company_id == company_id)
        .order_by(StockPrice.date.asc())
        .all()
    )
    return [(r[0], _adj(r[1])) for r in rows]


def _load_benchmark_series(db: Session, benchmark_id: int) -> list[tuple[date, float]]:
    rows = (
        db.query(BenchmarkPrice.date, BenchmarkPrice.adj_close)
        .filter(BenchmarkPrice.benchmark_id == benchmark_id)
        .order_by(BenchmarkPrice.date.asc())
        .all()
    )
    return [(r[0], _adj(r[1])) for r in rows]


def _total_return(start_px: float, end_px: float) -> float | None:
    if start_px is None or end_px is None or start_px <= 0:
        return None
    return (end_px / start_px) - 1.0


def _prediction_score(
    mean_excess: float,
    n: int,
    dispersion: float | None,
    hit_rate: float | None,
) -> float:
    """50 = in line with the matched benchmark. Reliability shrinks extreme scores."""
    reliability = 0.35 + 0.40 * min(1.0, n / 5.0)
    if dispersion is not None:
        reliability += 0.25 * (1.0 / (1.0 + max(dispersion, 0.0)))
    else:
        reliability += 0.12
    if hit_rate is not None:
        reliability *= 0.7 + 0.3 * hit_rate
    reliability = min(1.0, reliability)
    return round(50.0 + 45.0 * tanh(mean_excess / 1.2) * reliability, 1)


def _verdict(
    n: int,
    mean_excess: float | None,
    hit_rate: float | None,
    window_years: float | None,
    published_on: date,
    as_of: date,
) -> str:
    if published_on > as_of:
        return "too_early"
    if n < 2 or mean_excess is None:
        return "insufficient"
    if window_years is not None and window_years < 0.4:
        return "too_early"
    if mean_excess > 0.05 and (hit_rate or 0) >= 0.5:
        return "beat"
    if mean_excess < -0.05:
        return "lag"
    return "mixed"


def build_cohort_path(
    company_series: list[list[tuple[date, float]]],
    bench_series: list[tuple[date, float]],
    start: date,
    end: date,
) -> list[dict]:
    """Equal-weight index, 100 at first date. Delisted names hold last price (exit locked)."""
    if not company_series or not bench_series:
        return []

    by_date: dict[date, list[float]] = {}
    for series in company_series:
        first = _first_on_or_after(series, start)
        if first is None:
            continue
        first_d, first_px = first
        if first_px <= 0:
            continue
        last_ratio = None
        for d, px in series:
            if d < first_d or d > end:
                continue
            last_ratio = px / first_px
            by_date.setdefault(d, []).append(last_ratio)
        if last_ratio is None:
            continue
        # Carry last ratio forward is handled at join time via last-known.

    bench_first = _first_on_or_after(bench_series, start)
    if bench_first is None:
        return []
    _, bench_px0 = bench_first
    bench_map = {d: px / bench_px0 for d, px in bench_series if start <= d <= end}

    all_dates = sorted(set(by_date) | set(bench_map))
    if not all_dates:
        return []

    indexed: list[list[tuple[date, float]]] = []
    for series in company_series:
        first = _first_on_or_after(series, start)
        if first is None or first[1] <= 0:
            continue
        px_map = {d: px / first[1] for d, px in series if d >= first[0]}
        indexed.append(sorted(px_map.items()))

    last_vals = [None] * len(indexed)
    pointers = [0] * len(indexed)
    points = []
    for d in all_dates:
        ratios = []
        for i, series in enumerate(indexed):
            while pointers[i] < len(series) and series[pointers[i]][0] <= d:
                last_vals[i] = series[pointers[i]][1]
                pointers[i] += 1
            if last_vals[i] is not None:
                ratios.append(last_vals[i])
        if not ratios:
            continue
        cohort = 100.0 * mean(ratios)
        bench = 100.0 * bench_map[d] if d in bench_map else None
        points.append({"date": d.isoformat(), "cohort": round(cohort, 2), "benchmark": round(bench, 2) if bench else None})

    return _downsample_weekly_points(points)


def _downsample_weekly_points(points: list[dict]) -> list[dict]:
    if not points:
        return []
    out = []
    last = None
    for p in points:
        d = date.fromisoformat(p["date"])
        if last is None or (d - last).days >= 7:
            out.append(p)
            last = d
    if out[-1]["date"] != points[-1]["date"]:
        out.append(points[-1])
    return out


def score_technology(
    db: Session,
    tech: Technology,
    universe: str,
    spy: Benchmark,
    as_of: date,
) -> TechnologyScore:
    q = db.query(TechnologyCompanyMap).filter(
        TechnologyCompanyMap.technology_id == tech.id
    )
    if universe == "direct":
        q = q.filter(TechnologyCompanyMap.mapping_confidence == "direct")
    mappings = q.all()

    spy_series = _load_benchmark_series(db, spy.id)
    sector_series = (
        _load_benchmark_series(db, tech.default_benchmark_id)
        if tech.default_benchmark_id
        else []
    )

    company_details = []
    company_series_for_path = []
    returns = []
    excesses = []
    sector_excesses = []

    end = as_of
    for mapping in mappings:
        company: Company = mapping.company
        series = _load_company_series(db, company.id)
        start = tech.published_on
        if company.ipo_date and company.ipo_date > start:
            start = company.ipo_date
        company_end = end
        if company.delisted_date and company.delisted_date < company_end:
            company_end = company.delisted_date

        first = _first_on_or_after(series, start)
        last = _last_on_or_before(series, company_end)
        ret = _total_return(first[1], last[1]) if first and last else None

        spy_first = _first_on_or_after(spy_series, first[0] if first else start)
        spy_last = _last_on_or_before(spy_series, last[0] if last else company_end)
        spy_ret = (
            _total_return(spy_first[1], spy_last[1]) if spy_first and spy_last else None
        )
        excess = (ret - spy_ret) if ret is not None and spy_ret is not None else None

        sec_ret = None
        if sector_series and first and last:
            s_first = _first_on_or_after(sector_series, first[0])
            s_last = _last_on_or_before(sector_series, last[0])
            sec_ret = (
                _total_return(s_first[1], s_last[1]) if s_first and s_last else None
            )
        sec_excess = (ret - sec_ret) if ret is not None and sec_ret is not None else None

        if series:
            company_series_for_path.append(series)
        if ret is not None:
            returns.append(ret)
        if excess is not None:
            excesses.append(excess)
        if sec_excess is not None:
            sector_excesses.append(sec_excess)

        company_details.append(
            {
                "company_id": company.id,
                "ticker": company.ticker,
                "name": company.name,
                "confidence": mapping.mapping_confidence,
                "start_date": first[0].isoformat() if first else None,
                "end_date": last[0].isoformat() if last else None,
                "start_price": round(first[1], 4) if first else None,
                "end_price": round(last[1], 4) if last else None,
                "total_return": None if ret is None else round(ret, 6),
                "spy_return": None if spy_ret is None else round(spy_ret, 6),
                "excess_return": None if excess is None else round(excess, 6),
                "sector_return": None if sec_ret is None else round(sec_ret, 6),
                "delisted": company.delisted_date is not None,
            }
        )

    n = len(returns)
    mean_ret = mean(returns) if returns else None
    med_ret = median(returns) if returns else None
    mean_ex = mean(excesses) if excesses else None
    med_ex = median(excesses) if excesses else None
    disp = pstdev(returns) if n >= 2 else None
    hit = (sum(1 for e in excesses if e > 0) / len(excesses)) if excesses else None
    mean_bench = mean([d["spy_return"] for d in company_details if d["spy_return"] is not None]) if any(
        d["spy_return"] is not None for d in company_details
    ) else None
    window_years = max(0.0, (as_of - tech.published_on).days / 365.25)
    window_short = window_years < SHORT_WINDOW_YEARS
    verdict = _verdict(n, mean_ex, hit, window_years, tech.published_on, as_of)
    pred = _prediction_score(mean_ex, n, disp, hit) if mean_ex is not None and n >= 2 else None

    existing = (
        db.query(TechnologyScore)
        .filter(
            TechnologyScore.technology_id == tech.id,
            TechnologyScore.universe == universe,
        )
        .one_or_none()
    )
    score = existing or TechnologyScore(technology_id=tech.id, universe=universe)
    score.as_of = as_of
    score.n_companies = len(mappings)
    score.n_with_prices = n
    score.cohort_mean_return = mean_ret
    score.cohort_median_return = med_ret
    score.mean_benchmark_return = mean_bench
    score.mean_excess_return = mean_ex
    score.median_excess_return = med_ex
    score.dispersion = disp
    score.hit_rate = hit
    score.window_years = round(window_years, 2)
    score.window_short = window_short
    score.verdict = verdict
    score.prediction_score = pred
    score.details_json = {
        "companies": company_details,
        "mean_sector_excess": mean(sector_excesses) if sector_excesses else None,
        "methodology": {
            "holding_start": "MIT published_on, or IPO if later",
            "holding_end": "latest price, or delisting date",
            "excess": "company total return minus SPY over the same dates",
            "survivorship": "delisted names kept at exit price",
        },
    }
    if existing is None:
        db.add(score)
    return score


def rescore_all(db: Session, as_of: date | None = None) -> int:
    as_of = as_of or date.today()
    spy = db.query(Benchmark).filter(Benchmark.ticker == SPY_TICKER).one()
    techs = db.query(Technology).all()
    count = 0
    for tech in techs:
        for universe in ("all", "direct"):
            score_technology(db, tech, universe, spy, as_of)
            count += 1
    db.commit()
    return count


def cohort_chart_payload(db: Session, tech: Technology, universe: str, as_of: date) -> dict:
    spy = db.query(Benchmark).filter(Benchmark.ticker == SPY_TICKER).one()
    q = (
        db.query(TechnologyCompanyMap)
        .filter(TechnologyCompanyMap.technology_id == tech.id)
    )
    if universe == "direct":
        q = q.filter(TechnologyCompanyMap.mapping_confidence == "direct")
    mappings = q.all()
    company_series = [_load_company_series(db, m.company_id) for m in mappings]
    bench = _load_benchmark_series(db, spy.id)
    points = build_cohort_path(company_series, bench, tech.published_on, as_of)
    sector_points = []
    if tech.default_benchmark_id:
        sector = _load_benchmark_series(db, tech.default_benchmark_id)
        mixed = build_cohort_path(company_series, sector, tech.published_on, as_of)
        sector_points = mixed
    return {
        "points": points,
        "sector_points": sector_points,
        "benchmark_ticker": "SPY",
        "sector_ticker": tech.benchmark.ticker if tech.benchmark else None,
    }
