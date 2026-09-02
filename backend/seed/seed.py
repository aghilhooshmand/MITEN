from __future__ import annotations

import sys
import time
from datetime import date, datetime
from pathlib import Path

import pandas as pd
import yfinance as yf
from sqlalchemy.orm import Session

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from app.database import Base, SessionLocal, engine, ensure_schema  # noqa: E402
from app.models import (  # noqa: E402
    Benchmark,
    BenchmarkPrice,
    Company,
    StockPrice,
    Technology,
    TechnologyAnalogy,
    TechnologyCompanyMap,
    TechnologyScore,
    YearMeta,
)
from app.scoring import rescore_all  # noqa: E402
from seed.data import (  # noqa: E402
    ADDED_BY,
    ANALOGIES,
    ARCHIVE,
    BENCHMARKS,
    COMPANIES,
    MAPPINGS,
    SEEDED_AT,
    SLUG_ALIASES,
    TECHNOLOGIES,
    YEAR_META,
    slug_for,
)

TICKER_ALIASES = {"XYZ": ["XYZ", "SQ"]}


def upsert_static(db: Session) -> None:
    for year, status, note, url in YEAR_META:
        row = db.get(YearMeta, year)
        if row is None:
            row = YearMeta(year=year)
            db.add(row)
        row.verification_status = status
        row.note = note
        row.source_url = url

    bench_by_ticker: dict[str, Benchmark] = {}
    for item in BENCHMARKS:
        row = db.query(Benchmark).filter(Benchmark.ticker == item["ticker"]).one_or_none()
        if row is None:
            row = Benchmark(ticker=item["ticker"])
            db.add(row)
        row.name = item["name"]
        row.description = item["description"]
        db.flush()
        bench_by_ticker[row.ticker] = row

    spy = bench_by_ticker["SPY"]
    olds_for_new: dict[str, list[str]] = {}
    for old, new in SLUG_ALIASES.items():
        olds_for_new.setdefault(new, []).append(old)

    keep_slugs: set[str] = set()
    index_by_year: dict[int, int] = {}
    for item in TECHNOLOGIES:
        slug = slug_for(item["year"], item["name"])
        keep_slugs.add(slug)
        row = db.query(Technology).filter(Technology.slug == slug).one_or_none()
        if row is None:
            for old in olds_for_new.get(slug, []):
                row = db.query(Technology).filter(Technology.slug == old).one_or_none()
                if row is not None:
                    break
        if row is None:
            row = Technology(slug=slug)
            db.add(row)
        index_by_year[item["year"]] = index_by_year.get(item["year"], 0) + 1
        row.slug = slug
        row.year = item["year"]
        row.name = item["name"]
        row.description = item["desc"]
        row.verification_status = item["status"]
        row.category = item["category"]
        row.list_index = index_by_year[item["year"]]
        row.mit_source_url = item.get("url", ARCHIVE)
        published = item.get("published_on") or f"{item['year']}-02-01"
        row.published_on = date.fromisoformat(published)
        bench_ticker = item.get("benchmark", "SPY")
        row.default_benchmark_id = bench_by_ticker.get(bench_ticker, spy).id

    db.flush()
    orphans = db.query(Technology).filter(~Technology.slug.in_(keep_slugs)).all()
    for tech in orphans:
        print(f"  prune {tech.slug}")
        db.query(TechnologyScore).filter(TechnologyScore.technology_id == tech.id).delete()
        db.query(TechnologyCompanyMap).filter(
            TechnologyCompanyMap.technology_id == tech.id
        ).delete()
        db.query(TechnologyAnalogy).filter(
            (TechnologyAnalogy.technology_id == tech.id)
            | (TechnologyAnalogy.analogous_technology_id == tech.id)
        ).delete()
        db.delete(tech)
    db.flush()
    for item in COMPANIES:
        row = db.query(Company).filter(Company.ticker == item["ticker"]).one_or_none()
        if row is None:
            row = Company(ticker=item["ticker"])
            db.add(row)
        row.name = item["name"]
        row.sector = item.get("sector", "")
        row.exchange = item.get("exchange", "US")
        row.country = item.get("country", "US")
        row.is_public = item.get("delisted_date") is None
        if item.get("delisted_date"):
            row.delisted_date = date.fromisoformat(item["delisted_date"])
            row.delisted_reason = item.get("delisted_reason")
            row.is_public = False

    db.flush()
    tech_by_slug = {t.slug: t for t in db.query(Technology).all()}
    company_by_ticker = {c.ticker: c for c in db.query(Company).all()}
    added_at = datetime.fromisoformat(SEEDED_AT)

    for slug, confidence, ticker, note in MAPPINGS:
        tech = tech_by_slug.get(slug)
        company = company_by_ticker.get(ticker)
        if tech is None:
            print(f"  skip mapping, unknown tech {slug}")
            continue
        if company is None:
            print(f"  skip mapping, unknown ticker {ticker}")
            continue
        row = (
            db.query(TechnologyCompanyMap)
            .filter(
                TechnologyCompanyMap.technology_id == tech.id,
                TechnologyCompanyMap.company_id == company.id,
            )
            .one_or_none()
        )
        if row is None:
            row = TechnologyCompanyMap(
                technology_id=tech.id,
                company_id=company.id,
                added_by=ADDED_BY,
                added_at=added_at,
            )
            db.add(row)
        row.role_note = note
        row.mapping_confidence = confidence

    db.flush()
    for src_slug, dst_slug, note in ANALOGIES:
        src = tech_by_slug.get(src_slug)
        dst = tech_by_slug.get(dst_slug)
        if not src or not dst:
            print(f"  skip analogy {src_slug} -> {dst_slug}")
            continue
        row = (
            db.query(TechnologyAnalogy)
            .filter(
                TechnologyAnalogy.technology_id == src.id,
                TechnologyAnalogy.analogous_technology_id == dst.id,
            )
            .one_or_none()
        )
        if row is None:
            row = TechnologyAnalogy(
                technology_id=src.id,
                analogous_technology_id=dst.id,
            )
            db.add(row)
        row.note = note
    db.commit()
    print("Static tables upserted.")


def _normalize_download(raw: pd.DataFrame, tickers: list[str]) -> dict[str, pd.DataFrame]:
    out: dict[str, pd.DataFrame] = {}
    if raw is None or raw.empty:
        return out
    if isinstance(raw.columns, pd.MultiIndex):
        level0 = set(raw.columns.get_level_values(0))
        # yfinance may use (ticker, field) or (field, ticker)
        if "Adj Close" in level0 or "Close" in level0:
            fields_first = True
        else:
            fields_first = False
        for ticker in tickers:
            try:
                if fields_first:
                    frame = raw.xs(ticker, axis=1, level=1).copy()
                else:
                    frame = raw.xs(ticker, axis=1, level=0).copy()
            except KeyError:
                continue
            frame.columns = [str(c) for c in frame.columns]
            out[ticker] = frame.dropna(how="all")
    else:
        # single ticker
        frame = raw.copy()
        frame.columns = [str(c) for c in frame.columns]
        if tickers:
            out[tickers[0]] = frame.dropna(how="all")
    return out


def download_prices(tickers: list[str]) -> dict[str, pd.DataFrame]:
    unique = sorted(set(tickers))
    print(f"Downloading {len(unique)} tickers from Yahoo Finance…")
    # yfinance can reject huge batches; chunk them.
    combined: dict[str, pd.DataFrame] = {}
    chunk_size = 20
    for i in range(0, len(unique), chunk_size):
        chunk = unique[i : i + chunk_size]
        print(f"  chunk {i // chunk_size + 1}: {', '.join(chunk)}")
        try:
            raw = yf.download(
                chunk,
                start="2001-01-01",
                auto_adjust=False,
                progress=False,
                threads=True,
                group_by="ticker",
            )
            parsed = _normalize_download(raw, chunk)
            combined.update(parsed)
        except Exception as exc:
            print(f"  batch failed ({exc}); falling back per ticker")
            for ticker in chunk:
                try:
                    raw = yf.download(
                        ticker,
                        start="2001-01-01",
                        auto_adjust=False,
                        progress=False,
                        threads=False,
                    )
                    parsed = _normalize_download(raw, [ticker])
                    combined.update(parsed)
                    time.sleep(0.4)
                except Exception as inner:
                    print(f"    {ticker}: {inner}")
        time.sleep(0.8)
    return combined


def persist_equity_prices(db: Session, frames: dict[str, pd.DataFrame]) -> int:
    companies = {c.ticker: c for c in db.query(Company).all()}
    written = 0
    for ticker, frame in frames.items():
        company = companies.get(ticker)
        if company is None:
            continue
        adj_col = "Adj Close" if "Adj Close" in frame.columns else "Close"
        if adj_col not in frame.columns:
            print(f"  no close column for {ticker}: {list(frame.columns)}")
            continue
        db.query(StockPrice).filter(StockPrice.company_id == company.id).delete()
        rows = []
        for idx, rec in frame.iterrows():
            adj = rec.get(adj_col)
            if pd.isna(adj):
                continue
            d = idx.date() if hasattr(idx, "date") else pd.Timestamp(idx).date()
            rows.append(
                StockPrice(
                    company_id=company.id,
                    date=d,
                    open=None if pd.isna(rec.get("Open")) else float(rec.get("Open")),
                    high=None if pd.isna(rec.get("High")) else float(rec.get("High")),
                    low=None if pd.isna(rec.get("Low")) else float(rec.get("Low")),
                    close=None if pd.isna(rec.get("Close")) else float(rec.get("Close")),
                    adj_close=float(adj),
                    volume=None if pd.isna(rec.get("Volume")) else int(rec.get("Volume")),
                )
            )
        db.bulk_save_objects(rows)
        db.commit()
        written += len(rows)
        print(f"  {ticker}: {len(rows)} days")
    return written


def persist_benchmark_prices(db: Session, frames: dict[str, pd.DataFrame]) -> int:
    benches = {b.ticker: b for b in db.query(Benchmark).all()}
    written = 0
    for ticker, frame in frames.items():
        bench = benches.get(ticker)
        if bench is None:
            continue
        adj_col = "Adj Close" if "Adj Close" in frame.columns else "Close"
        if adj_col not in frame.columns:
            continue
        db.query(BenchmarkPrice).filter(BenchmarkPrice.benchmark_id == bench.id).delete()
        rows = []
        for idx, rec in frame.iterrows():
            adj = rec.get(adj_col)
            if pd.isna(adj):
                continue
            d = idx.date() if hasattr(idx, "date") else pd.Timestamp(idx).date()
            rows.append(
                BenchmarkPrice(
                    benchmark_id=bench.id,
                    date=d,
                    close=None if pd.isna(rec.get("Close")) else float(rec.get("Close")),
                    adj_close=float(adj),
                )
            )
        db.bulk_save_objects(rows)
        db.commit()
        written += len(rows)
        print(f"  benchmark {ticker}: {len(rows)} days")
    return written


def resolve_aliases(frames: dict[str, pd.DataFrame]) -> dict[str, pd.DataFrame]:
    """If XYZ is empty, accept SQ as Block."""
    out = dict(frames)
    for canonical, aliases in TICKER_ALIASES.items():
        if canonical in out and not out[canonical].empty:
            continue
        for alias in aliases:
            if alias in frames and not frames[alias].empty:
                out[canonical] = frames[alias]
                print(f"  using {alias} history for {canonical}")
                break
    return out


def tickers_missing_prices(db: Session) -> list[str]:
    priced = {
        ticker
        for (ticker,) in db.query(Company.ticker)
        .join(StockPrice, StockPrice.company_id == Company.id)
        .distinct()
        .all()
    }
    return [c.ticker for c in db.query(Company).all() if c.ticker not in priced]


def fetch_market_caps(db: Session) -> int:
    """Latest Yahoo market cap for listed names. Delisted names stay empty."""
    today = date.today()
    updated = 0
    companies = db.query(Company).all()
    print(f"Fetching market caps for {len(companies)} companies…")
    for company in companies:
        if company.delisted_date is not None:
            continue
        cap = None
        try:
            ticker = yf.Ticker(company.ticker)
            fast = getattr(ticker, "fast_info", None)
            if fast is not None:
                cap = getattr(fast, "market_cap", None)
            if cap is None:
                info = ticker.info or {}
                cap = info.get("marketCap")
        except Exception as exc:
            print(f"  {company.ticker}: {exc}")
            continue
        if cap is None:
            print(f"  {company.ticker}: no market cap")
            continue
        company.market_cap = float(cap)
        company.market_cap_as_of = today
        updated += 1
        print(f"  {company.ticker}: {company.market_cap:,.0f}")
        time.sleep(0.12)
    db.commit()
    print(f"Wrote market cap for {updated} companies.")
    return updated


def main() -> None:
    print("Creating tables…")
    Base.metadata.create_all(bind=engine)
    ensure_schema()
    db = SessionLocal()
    try:
        upsert_static(db)
        if "--static-only" in sys.argv:
            n_scores = rescore_all(db)
            print(f"Static-only seed complete. {n_scores} score rows.")
            return
        if "--caps-only" in sys.argv:
            fetch_market_caps(db)
            return
        if "--benchmarks" in sys.argv:
            tickers = [b.ticker for b in db.query(Benchmark).all()]
            frames = download_prices(tickers)
            n_bm = persist_benchmark_prices(db, frames)
            print(f"Wrote {n_bm} benchmark rows.")
            return
        if "--update" in sys.argv:
            missing = tickers_missing_prices(db)
            if missing:
                print(f"Downloading {len(missing)} tickers with no prices…")
                frames = download_prices(missing)
                persist_equity_prices(db, frames)
            else:
                print("All mapped tickers already have prices.")
            fetch_market_caps(db)
            n_scores = rescore_all(db)
            print(f"Update complete. {n_scores} score rows.")
            return
        equity_tickers = [c.ticker for c in db.query(Company).all()]
        bench_tickers = [b.ticker for b in db.query(Benchmark).all()]
        extra_aliases = [a for aliases in TICKER_ALIASES.values() for a in aliases]
        frames = download_prices(equity_tickers + bench_tickers + extra_aliases)
        frames = resolve_aliases(frames)
        n_eq = persist_equity_prices(db, frames)
        n_bm = persist_benchmark_prices(db, frames)
        print(f"Wrote {n_eq} equity rows and {n_bm} benchmark rows.")
        fetch_market_caps(db)
        n_scores = rescore_all(db)
        print(f"Wrote {n_scores} score rows.")
    finally:
        db.close()
    print("Seed complete.")


if __name__ == "__main__":
    main()
