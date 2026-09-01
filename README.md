# MITEN

MIT’s 10 Breakthrough Technologies versus mapped public companies. Did the named
categories later beat SPY?

Not a stock-picker. The unit of analysis is a **technology cohort versus SPY**, with
company mappings stored so they can be audited.

## Stack

- React (Vite) — one page, panels hide/show
- FastAPI — scoring and read APIs
- MySQL 8 — every entity and every daily price
- `static-site/` — CSV snapshot for GitHub Pages (no server)

## Run

```bash
# 1. MySQL
docker compose up -d mysql

# 2. Backend
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
PYTHONPATH=. python seed/seed.py          # archive + mappings + Yahoo prices + scores
PYTHONPATH=. uvicorn app.main:app --reload --port 8000

# 3. Frontend
cd frontend
npm install
npm run dev
```

Open http://localhost:5173

## Static copy (GitHub Pages, no server)

`static-site/` is the same dashboard with **no FastAPI and no MySQL**. It reads CSV files in `static-site/data/`.

```bash
cd static-site
python3 -m http.server 8080
```

Open http://localhost:8080. See `static-site/README.md` to publish on GitHub Pages. Refresh CSVs from MySQL with `PYTHONPATH=. python seed/export_static.py` from `backend/`.

Re-fetch prices and recompute scores later with `PYTHONPATH=. python seed/seed.py`.

## What the score means

For each mapped company, total return is measured from the MIT list date (or IPO if later) to the latest price, or to delisting. Excess = that return minus SPY over the **same dates**. The category number is the average excess, not one famous winner.

- `direct` = this essentially is their business
- `exposed` = partial / indirect
- Delisted names (Slack, Fitbit) stay in at exit value

Prediction score is centered at 50 (in line with SPY) and shrunk when the sample is small or one stock dominates.

Mappings in `backend/seed/data.py` are retrospective editorial judgments, timestamped `seed-v1` / 2026-09-01. That is the bias the proposal warned about — the UI shows the rationale instead of hiding it.

## Data limits

US-listed Yahoo Finance history only. CATL, BYD, SpaceX, Magic Leap, Waymo-as-a-standalone, and most 2005–2012 MIT names are absent or unverified. Free price data is for this app, not for redistribution.
