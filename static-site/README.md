# MITEN — static site

Public snapshot of MITEN (CSV files, no server). For the full app on your
machine, see the [Docker tutorial](../docs/DOCKER.md) or the root README.

A no-server copy of the dashboard. All tables, scores, mappings, and chart series
are CSV files in `data/`. GitHub Pages can host this folder as-is.

It does **not** fetch live prices. Refresh the snapshot from MySQL when you want
newer numbers:

```bash
cd backend
PYTHONPATH=. .venv/bin/python seed/export_static.py
```

## Run locally

Do not open `index.html` as a file. The browser blocks `fetch()` of CSV that way.

```bash
cd static-site
python3 -m http.server 8080
```

Open http://localhost:8080

## GitHub Pages

1. Push this repository.
2. Settings → Pages → Source: **GitHub Actions**.
3. The workflow `.github/workflows/static-pages.yml` publishes the `static-site/` folder.

If you prefer the built-in “branch /docs” option, copy this folder’s contents into `docs/` on `main`.

Base paths are relative (`./data/…`), so the site also works at
`https://aghilhooshmand.github.io/MITEN/` after the Action runs.

## CSV files

| File | What it is |
| --- | --- |
| `meta.csv` | Snapshot date, disclaimer, 2026 watchlist note |
| `years.csv` | One row per MIT year (2002 has no list) |
| `technologies.csv` | All 250 TR10 names |
| `companies.csv` | Listed names used in mappings |
| `mappings.csv` | Technology → company, with `direct` / `exposed` notes |
| `scores.csv` | Precomputed cohort stats vs SPY (`all` and `direct`) |
| `score_companies.csv` | Per-name returns inside each score |
| `analogies.csv` | 2026 analog links |
| `charts.csv` | Weekly equal-weight index (100 at list date) |

Edit a CSV, reload the page. That is the database.
