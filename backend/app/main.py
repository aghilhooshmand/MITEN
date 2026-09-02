from datetime import date

from fastapi import Depends, FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session, joinedload

from app.database import get_db, ensure_schema
from app.models import (
    Company,
    Technology,
    TechnologyAnalogy,
    TechnologyCompanyMap,
    TechnologyScore,
    YearMeta,
)
from app.scoring import cohort_chart_payload

app = FastAPI(title="MITEN", version="1.0.0")

ensure_schema()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:8080",
        "http://127.0.0.1:8080",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def _score_dict(score: TechnologyScore | None) -> dict | None:
    if score is None:
        return None
    return {
        "universe": score.universe,
        "as_of": score.as_of.isoformat(),
        "n_companies": score.n_companies,
        "n_with_prices": score.n_with_prices,
        "cohort_mean_return": score.cohort_mean_return,
        "cohort_median_return": score.cohort_median_return,
        "mean_benchmark_return": score.mean_benchmark_return,
        "mean_excess_return": score.mean_excess_return,
        "median_excess_return": score.median_excess_return,
        "dispersion": score.dispersion,
        "hit_rate": score.hit_rate,
        "window_years": score.window_years,
        "window_short": score.window_short,
        "verdict": score.verdict,
        "prediction_score": score.prediction_score,
    }


def _pick_score(tech: Technology, universe: str) -> TechnologyScore | None:
    for s in tech.scores:
        if s.universe == universe:
            return s
    return None


def _size_band(market_cap: float | None) -> str:
    if market_cap is None:
        return "unknown"
    if market_cap >= 100_000_000_000:
        return "mega"
    if market_cap >= 20_000_000_000:
        return "large"
    if market_cap >= 2_000_000_000:
        return "mid"
    return "small"


@app.get("/api/health")
def health():
    return {"ok": True}


@app.get("/api/overview")
def overview(
    universe: str = Query("all", pattern="^(all|direct)$"),
    db: Session = Depends(get_db),
):
    years = db.query(YearMeta).order_by(YearMeta.year).all()
    techs = db.query(Technology).options(joinedload(Technology.scores)).all()
    scores = [_pick_score(t, universe) for t in techs]
    scored = [s for s in scores if s and s.n_with_prices >= 2 and s.mean_excess_return is not None]
    beat = [s for s in scored if s.verdict == "beat"]
    lag = [s for s in scored if s.verdict == "lag"]
    mapped = sum(1 for t in techs if any(s and s.n_companies > 0 for s in [_pick_score(t, universe)]))
    companies = db.query(Company).count()
    excesses = [s.mean_excess_return for s in scored]
    median_excess = None
    if excesses:
        ordered = sorted(excesses)
        mid = len(ordered) // 2
        median_excess = ordered[mid] if len(ordered) % 2 else (ordered[mid - 1] + ordered[mid]) / 2

    return {
        "universe": universe,
        "as_of": date.today().isoformat(),
        "n_technologies": len(techs),
        "n_mapped_technologies": mapped,
        "n_scored": len(scored),
        "n_companies": companies,
        "beat_count": len(beat),
        "lag_count": len(lag),
        "beat_rate": (len(beat) / len(scored)) if scored else None,
        "median_excess_return": median_excess,
        "mean_excess_return": (sum(excesses) / len(excesses)) if excesses else None,
        "years": [
            {
                "year": y.year,
                "verification_status": y.verification_status,
                "note": y.note,
                "source_url": y.source_url,
            }
            for y in years
        ],
        "disclaimer": (
            "This ranks historical MIT Technology Review categories against mapped "
            "public companies versus SPY. It is not a forecast and not investment advice. "
            "Company mappings are retrospective editorial judgments recorded on seed."
        ),
    }


@app.get("/api/technologies")
def list_technologies(
    year: int | None = None,
    q: str | None = None,
    category: str | None = None,
    universe: str = Query("all", pattern="^(all|direct)$"),
    mapped_only: bool = False,
    db: Session = Depends(get_db),
):
    query = db.query(Technology).options(
        joinedload(Technology.scores),
        joinedload(Technology.benchmark),
    )
    if year:
        query = query.filter(Technology.year == year)
    if category:
        query = query.filter(Technology.category == category)
    if q:
        like = f"%{q}%"
        query = query.filter(Technology.name.ilike(like))
    rows = query.order_by(Technology.year.desc(), Technology.list_index.asc(), Technology.name.asc()).all()
    out = []
    for t in rows:
        score = _pick_score(t, universe)
        if mapped_only and (score is None or score.n_companies == 0):
            continue
        out.append(
            {
                "id": t.id,
                "year": t.year,
                "name": t.name,
                "slug": t.slug,
                "category": t.category,
                "list_index": t.list_index,
                "description": t.description,
                "verification_status": t.verification_status,
                "published_on": t.published_on.isoformat(),
                "benchmark_ticker": t.benchmark.ticker if t.benchmark else "SPY",
                "score": _score_dict(score),
            }
        )
    return out


@app.get("/api/archive")
def archive(
    universe: str = Query("all", pattern="^(all|direct)$"),
    db: Session = Depends(get_db),
):
    years = db.query(YearMeta).order_by(YearMeta.year.desc()).all()
    techs = (
        db.query(Technology)
        .options(
            joinedload(Technology.scores),
            joinedload(Technology.mappings).joinedload(TechnologyCompanyMap.company),
        )
        .order_by(Technology.year.desc(), Technology.list_index.asc())
        .all()
    )
    by_year: dict[int, list] = {}
    for t in techs:
        score = _pick_score(t, universe)
        mapped = bool(score and score.n_companies > 0)
        maps = t.mappings
        if universe == "direct":
            maps = [m for m in maps if m.mapping_confidence == "direct"]
        by_year.setdefault(t.year, []).append(
            {
                "id": t.id,
                "list_index": t.list_index,
                "name": t.name,
                "description": t.description,
                "category": t.category,
                "verification_status": t.verification_status,
                "mapped": mapped,
                "score": _score_dict(score) if mapped else None,
                "tickers": [m.company.ticker for m in maps],
            }
        )
    return {
        "source": "https://www.technologyreview.com/supertopic/tr10-archive/",
        "years": [
            {
                "year": y.year,
                "verification_status": y.verification_status,
                "note": y.note,
                "source_url": y.source_url,
                "technologies": by_year.get(y.year, []),
            }
            for y in years
        ],
    }


@app.get("/api/technologies/{tech_id}")
def technology_detail(
    tech_id: int,
    universe: str = Query("all", pattern="^(all|direct)$"),
    db: Session = Depends(get_db),
):
    tech = (
        db.query(Technology)
        .options(
            joinedload(Technology.scores),
            joinedload(Technology.benchmark),
            joinedload(Technology.mappings).joinedload(TechnologyCompanyMap.company),
        )
        .filter(Technology.id == tech_id)
        .one_or_none()
    )
    if tech is None:
        raise HTTPException(404, "Technology not found")
    score = _pick_score(tech, universe)
    mappings = tech.mappings
    if universe == "direct":
        mappings = [m for m in mappings if m.mapping_confidence == "direct"]
    details = (score.details_json or {}).get("companies", []) if score else []
    by_ticker = {c["ticker"]: c for c in details}
    companies = []
    for m in sorted(mappings, key=lambda x: x.company.ticker):
        row = by_ticker.get(m.company.ticker, {})
        companies.append(
            {
                "id": m.company.id,
                "name": m.company.name,
                "ticker": m.company.ticker,
                "sector": m.company.sector,
                "confidence": m.mapping_confidence,
                "role_note": m.role_note,
                "added_by": m.added_by,
                "added_at": m.added_at.isoformat(),
                "ipo_date": m.company.ipo_date.isoformat() if m.company.ipo_date else None,
                "delisted_date": m.company.delisted_date.isoformat()
                if m.company.delisted_date
                else None,
                "delisted_reason": m.company.delisted_reason,
                "total_return": row.get("total_return"),
                "spy_return": row.get("spy_return"),
                "excess_return": row.get("excess_return"),
                "start_date": row.get("start_date"),
                "end_date": row.get("end_date"),
            }
        )
    chart = cohort_chart_payload(db, tech, universe, date.today())
    analogies = (
        db.query(TechnologyAnalogy)
        .options(joinedload(TechnologyAnalogy.analogous).joinedload(Technology.scores))
        .filter(TechnologyAnalogy.technology_id == tech.id)
        .all()
    )
    return {
        "id": tech.id,
        "year": tech.year,
        "name": tech.name,
        "slug": tech.slug,
        "description": tech.description,
        "category": tech.category,
        "verification_status": tech.verification_status,
        "published_on": tech.published_on.isoformat(),
        "mit_source_url": tech.mit_source_url,
        "benchmark_ticker": tech.benchmark.ticker if tech.benchmark else "SPY",
        "score": _score_dict(score),
        "companies": companies,
        "chart": chart,
        "analogies": [
            {
                "id": a.analogous.id,
                "year": a.analogous.year,
                "name": a.analogous.name,
                "note": a.note,
                "score": _score_dict(_pick_score(a.analogous, universe)),
            }
            for a in analogies
        ],
    }


@app.get("/api/scores")
def scores(
    universe: str = Query("all", pattern="^(all|direct)$"),
    db: Session = Depends(get_db),
):
    rows = (
        db.query(TechnologyScore)
        .options(joinedload(TechnologyScore.technology))
        .filter(TechnologyScore.universe == universe)
        .all()
    )
    ranked = []
    for s in rows:
        if s.n_with_prices < 2 or s.prediction_score is None:
            continue
        ranked.append(
            {
                "technology_id": s.technology_id,
                "year": s.technology.year,
                "name": s.technology.name,
                "description": s.technology.description,
                "category": s.technology.category,
                **_score_dict(s),
            }
        )
    ranked.sort(key=lambda r: r["prediction_score"], reverse=True)
    for i, row in enumerate(ranked, start=1):
        row["rank"] = i
    return ranked


@app.get("/api/watchlist")
def watchlist(
    universe: str = Query("all", pattern="^(all|direct)$"),
    db: Session = Depends(get_db),
):
    techs = (
        db.query(Technology)
        .options(
            joinedload(Technology.scores),
            joinedload(Technology.mappings).joinedload(TechnologyCompanyMap.company),
        )
        .filter(Technology.year == 2026)
        .order_by(Technology.list_index.asc())
        .all()
    )
    items = []
    for t in techs:
        analogies = (
            db.query(TechnologyAnalogy)
            .options(joinedload(TechnologyAnalogy.analogous).joinedload(Technology.scores))
            .filter(TechnologyAnalogy.technology_id == t.id)
            .all()
        )
        mappings = t.mappings
        if universe == "direct":
            mappings = [m for m in mappings if m.mapping_confidence == "direct"]
        analog_scores = [
            _pick_score(a.analogous, universe) for a in analogies
        ]
        analog_scores = [s for s in analog_scores if s and s.mean_excess_return is not None]
        hist_excess = (
            sum(s.mean_excess_return for s in analog_scores) / len(analog_scores)
            if analog_scores
            else None
        )
        items.append(
            {
                "id": t.id,
                "name": t.name,
                "slug": t.slug,
                "description": t.description,
                "category": t.category,
                "verification_status": t.verification_status,
                "published_on": t.published_on.isoformat(),
                "score": _score_dict(_pick_score(t, universe)),
                "companies": [
                    {
                        "ticker": m.company.ticker,
                        "name": m.company.name,
                        "confidence": m.mapping_confidence,
                        "role_note": m.role_note,
                    }
                    for m in mappings
                ],
                "analogies": [
                    {
                        "id": a.analogous.id,
                        "year": a.analogous.year,
                        "name": a.analogous.name,
                        "note": a.note,
                        "score": _score_dict(_pick_score(a.analogous, universe)),
                    }
                    for a in analogies
                ],
                "historical_analog_excess": hist_excess,
            }
        )
    return {
        "year": 2026,
        "note": (
            "2026 names are a live watchlist. Analog rows show how similar past MIT "
            "categories performed versus SPY — resemblance is editorial, not a model."
        ),
        "items": items,
    }


@app.get("/api/categories")
def categories(db: Session = Depends(get_db)):
    rows = db.query(Technology.category).distinct().order_by(Technology.category).all()
    return [r[0] for r in rows]


@app.get("/api/company-map")
def company_map(
    universe: str = Query("all", pattern="^(all|direct)$"),
    db: Session = Depends(get_db),
):
    """One bubble per mapping: company follow-through vs the MIT category score."""
    scores = (
        db.query(TechnologyScore)
        .options(joinedload(TechnologyScore.technology))
        .filter(TechnologyScore.universe == universe)
        .all()
    )
    companies = {c.id: c for c in db.query(Company).all()}
    points = []
    cap_dates = [c.market_cap_as_of for c in companies.values() if c.market_cap_as_of]
    for score in scores:
        tech = score.technology
        details = (score.details_json or {}).get("companies") or []
        for row in details:
            company = companies.get(row.get("company_id"))
            market_cap = company.market_cap if company else None
            points.append(
                {
                    "technology_id": tech.id,
                    "year": tech.year,
                    "technology": tech.name,
                    "category": tech.category,
                    "prediction_score": score.prediction_score,
                    "cohort_excess": score.mean_excess_return,
                    "window_years": score.window_years,
                    "verdict": score.verdict,
                    "company_id": row.get("company_id"),
                    "ticker": row.get("ticker"),
                    "name": row.get("name"),
                    "confidence": row.get("confidence"),
                    "total_return": row.get("total_return"),
                    "spy_return": row.get("spy_return"),
                    "excess_return": row.get("excess_return"),
                    "market_cap": market_cap,
                    "size_band": _size_band(market_cap),
                    "delisted": bool(row.get("delisted")),
                }
            )
    return {
        "universe": universe,
        "as_of": max((s.as_of for s in scores), default=date.today()).isoformat(),
        "market_cap_as_of": max(cap_dates).isoformat() if cap_dates else None,
        "n_points": len(points),
        "points": points,
    }
