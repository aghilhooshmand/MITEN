# MITEN

MIT’s 10 Breakthrough Technologies versus mapped public companies. Did the named
categories later beat SPY?

Not a stock-picker. The unit of analysis is a **technology cohort versus SPY**, with
company mappings stored so they can be audited.

## Use it in one of two ways

**1. Public website — no install**

Open **https://aghilhooshmand.github.io/MITEN/**

This is the static snapshot (CSV files, no server). Anyone can use it in a
browser. Scores and charts are whatever was last exported.

**2. Install on your computer with Docker**

Run the full app (website + API + MySQL) locally. You control the data. Follow
the step-by-step tutorial:

**[Install with Docker](docs/DOCKER.md)**

Short version, if you already have Docker:

```bash
git clone https://github.com/aghilhooshmand/MITEN.git
cd MITEN
docker compose up --build
```

Then open **http://localhost:8080**

---

## What the score means

For each mapped company, total return is measured from the MIT list date (or IPO if later) to the latest price, or to delisting. Excess = that return minus SPY over the **same dates**. The category number is the average excess, not one famous winner.

- `direct` = this essentially is their business
- `exposed` = partial / indirect
- Delisted names (Slack, Fitbit) stay in at exit value

Prediction score is centered at 50 (in line with SPY) and shrunk when the sample is small or one stock dominates.

Mappings in `backend/seed/data.py` are retrospective editorial judgments, timestamped `seed-v1` / 2026-09-01. That is the bias the proposal warned about — the UI shows the rationale instead of hiding it.

## Data limits

US-listed Yahoo Finance history only. CATL, BYD, SpaceX, Magic Leap, Waymo-as-a-standalone, and most 2005–2012 MIT names are absent or unverified. Free price data is for this app, not for redistribution.

## Stack (for developers)

- React (Vite) — one page, panels hide/show
- FastAPI — scoring and read APIs
- MySQL 8 — every entity and every daily price
- Docker Compose — `web` (nginx) + `backend` + `mysql`
- `static-site/` — CSV snapshot for GitHub Pages

Developer loop without Docker: MySQL via `docker compose up mysql`, then the venv/uvicorn and `npm run dev` flow. Prefer [Docker install](docs/DOCKER.md) unless you are changing code.
