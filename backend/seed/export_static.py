"""Dump MySQL snapshot to static-site/data/*.csv for the GitHub Pages app."""

from __future__ import annotations

import csv
import sys
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from sqlalchemy.orm import Session, joinedload  # noqa: E402

from app.database import SessionLocal  # noqa: E402
from app.models import (  # noqa: E402
    Company,
    Technology,
    TechnologyAnalogy,
    TechnologyCompanyMap,
    TechnologyScore,
    YearMeta,
)
from app.scoring import cohort_chart_payload  # noqa: E402

OUT = ROOT.parent / "static-site" / "data"
DISCLAIMER = (
    "This ranks historical MIT Technology Review categories against mapped "
    "public companies versus SPY. It is not a forecast and not investment advice. "
    "Company mappings are retrospective editorial judgments recorded on seed. "
    "Prices are a snapshot; this static copy does not fetch live markets."
)


def _write(name: str, headers: list[str], rows: list[dict]) -> None:
    path = OUT / name
    with path.open("w", newline="", encoding="utf-8") as fh:
        writer = csv.DictWriter(fh, fieldnames=headers, extrasaction="ignore")
        writer.writeheader()
        for row in rows:
            writer.writerow({k: "" if row.get(k) is None else row[k] for k in headers})
    print(f"  {name}: {len(rows)} rows")


def export(db: Session) -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    years = db.query(YearMeta).order_by(YearMeta.year).all()
    techs = (
        db.query(Technology)
        .options(joinedload(Technology.benchmark), joinedload(Technology.scores))
        .order_by(Technology.year, Technology.list_index)
        .all()
    )
    companies = db.query(Company).order_by(Company.ticker).all()
    mappings = (
        db.query(TechnologyCompanyMap)
        .options(joinedload(TechnologyCompanyMap.company))
        .all()
    )
    scores = db.query(TechnologyScore).all()
    analogies = db.query(TechnologyAnalogy).all()

    as_of = max((s.as_of for s in scores), default=date.today())

    _write(
        "meta.csv",
        ["key", "value"],
        [
            {"key": "as_of", "value": as_of.isoformat()},
            {"key": "disclaimer", "value": DISCLAIMER},
            {"key": "source", "value": "https://www.technologyreview.com/supertopic/tr10-archive/"},
            {"key": "watch_year", "value": "2026"},
            {
                "key": "watch_note",
                "value": (
                    "2026 names are a live watchlist. Analog rows show how similar past MIT "
                    "categories performed versus SPY — resemblance is editorial, not a model."
                ),
            },
        ],
    )
    _write(
        "years.csv",
        ["year", "verification_status", "note", "source_url"],
        [
            {
                "year": y.year,
                "verification_status": y.verification_status,
                "note": y.note,
                "source_url": y.source_url,
            }
            for y in years
        ],
    )
    _write(
        "technologies.csv",
        [
            "id",
            "year",
            "list_index",
            "name",
            "slug",
            "description",
            "category",
            "verification_status",
            "published_on",
            "mit_source_url",
            "benchmark_ticker",
        ],
        [
            {
                "id": t.id,
                "year": t.year,
                "list_index": t.list_index,
                "name": t.name,
                "slug": t.slug,
                "description": t.description,
                "category": t.category,
                "verification_status": t.verification_status,
                "published_on": t.published_on.isoformat(),
                "mit_source_url": t.mit_source_url,
                "benchmark_ticker": t.benchmark.ticker if t.benchmark else "SPY",
            }
            for t in techs
        ],
    )
    _write(
        "companies.csv",
        [
            "id",
            "ticker",
            "name",
            "sector",
            "exchange",
            "country",
            "ipo_date",
            "delisted_date",
            "delisted_reason",
        ],
        [
            {
                "id": c.id,
                "ticker": c.ticker,
                "name": c.name,
                "sector": c.sector,
                "exchange": c.exchange,
                "country": c.country,
                "ipo_date": c.ipo_date.isoformat() if c.ipo_date else "",
                "delisted_date": c.delisted_date.isoformat() if c.delisted_date else "",
                "delisted_reason": c.delisted_reason,
            }
            for c in companies
        ],
    )
    _write(
        "mappings.csv",
        [
            "technology_id",
            "company_id",
            "ticker",
            "confidence",
            "role_note",
            "added_by",
            "added_at",
        ],
        [
            {
                "technology_id": m.technology_id,
                "company_id": m.company_id,
                "ticker": m.company.ticker,
                "confidence": m.mapping_confidence,
                "role_note": m.role_note,
                "added_by": m.added_by,
                "added_at": m.added_at.isoformat(),
            }
            for m in mappings
        ],
    )
    _write(
        "scores.csv",
        [
            "technology_id",
            "universe",
            "as_of",
            "n_companies",
            "n_with_prices",
            "cohort_mean_return",
            "cohort_median_return",
            "mean_benchmark_return",
            "mean_excess_return",
            "median_excess_return",
            "dispersion",
            "hit_rate",
            "window_years",
            "window_short",
            "verdict",
            "prediction_score",
        ],
        [
            {
                "technology_id": s.technology_id,
                "universe": s.universe,
                "as_of": s.as_of.isoformat(),
                "n_companies": s.n_companies,
                "n_with_prices": s.n_with_prices,
                "cohort_mean_return": s.cohort_mean_return,
                "cohort_median_return": s.cohort_median_return,
                "mean_benchmark_return": s.mean_benchmark_return,
                "mean_excess_return": s.mean_excess_return,
                "median_excess_return": s.median_excess_return,
                "dispersion": s.dispersion,
                "hit_rate": s.hit_rate,
                "window_years": s.window_years,
                "window_short": int(s.window_short),
                "verdict": s.verdict,
                "prediction_score": s.prediction_score,
            }
            for s in scores
        ],
    )

    company_rows = []
    for s in scores:
        for row in (s.details_json or {}).get("companies") or []:
            company_rows.append(
                {
                    "technology_id": s.technology_id,
                    "universe": s.universe,
                    "ticker": row.get("ticker"),
                    "name": row.get("name"),
                    "confidence": row.get("confidence"),
                    "total_return": row.get("total_return"),
                    "spy_return": row.get("spy_return"),
                    "excess_return": row.get("excess_return"),
                    "start_date": row.get("start_date"),
                    "end_date": row.get("end_date"),
                    "delisted": int(bool(row.get("delisted"))),
                }
            )
    _write(
        "score_companies.csv",
        [
            "technology_id",
            "universe",
            "ticker",
            "name",
            "confidence",
            "total_return",
            "spy_return",
            "excess_return",
            "start_date",
            "end_date",
            "delisted",
        ],
        company_rows,
    )
    _write(
        "analogies.csv",
        ["technology_id", "analogous_technology_id", "note"],
        [
            {
                "technology_id": a.technology_id,
                "analogous_technology_id": a.analogous_technology_id,
                "note": a.note,
            }
            for a in analogies
        ],
    )

    chart_rows = []
    mapped_ids = {m.technology_id for m in mappings}
    for tech in techs:
        if tech.id not in mapped_ids:
            continue
        for universe in ("all", "direct"):
            payload = cohort_chart_payload(db, tech, universe, as_of)
            for point in payload["points"]:
                chart_rows.append(
                    {
                        "technology_id": tech.id,
                        "universe": universe,
                        "date": point["date"],
                        "cohort": point.get("cohort"),
                        "spy": point.get("spy"),
                        "sector": point.get("sector"),
                        "nasdaq": point.get("nasdaq"),
                        "gold": point.get("gold"),
                        "oil": point.get("oil"),
                    }
                )
    _write(
        "charts.csv",
        [
            "technology_id",
            "universe",
            "date",
            "cohort",
            "spy",
            "sector",
            "nasdaq",
            "gold",
            "oil",
        ],
        chart_rows,
    )


if __name__ == "__main__":
    print("Exporting MySQL snapshot to", OUT)
    db = SessionLocal()
    try:
        export(db)
    finally:
        db.close()
    print("Done.")
