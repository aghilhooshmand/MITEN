# Project Proposal: MITEN
### Formerly “The Breakthrough Ledger”
### Tracking whether MIT Technology Review's annual predictions actually paid off for investors

---

## 1. The core question, restated

You're not just asking for a dashboard. You're asking: **"When a trusted publication says a technology is
about to break through, is that a usable signal for picking stocks — and how would I know?"**

That reframes this from "build a dashboard" into "build a small research instrument." The architecture
below is designed around answering that question rigorously, not just displaying data.

---

## 2. The hard part isn't the code — it's these three things

Worth agreeing on these before writing a line of code, because they shape everything downstream.

**a) You can't freely "download all public data."**
Real-time and historical stock data is licensed. Free tiers exist (see §4) but have rate limits and
usage restrictions — most forbid redistributing raw data even if you can display it in your own app.
Company fundamentals (revenue, market cap) are more freely available via SEC EDGAR (US-listed companies
only). Non-US companies (CATL, BYD) are harder and often need a paid data vendor.

**b) The MIT list → company mapping is inherently subjective, and that subjectivity is the biggest
source of bias in the whole project.**
MIT names a *technology* ("Deep Learning"), not a stock list. Deciding which companies "count" as
related is an editorial judgment call — and if you cherry-pick winners into the "related companies"
bucket after the fact, the whole analysis is meaningless (this is called survivorship/hindsight bias).
§6 proposes a concrete way to keep this honest.

**c) "Did it work" needs a benchmark, or it's not a real answer.**
NVIDIA being up 100x since 2013 sounds like proof deep learning was a great call. But the S&P 500 was
also up a lot since 2013. The only meaningful question is: *did the cohort of related companies beat a
fair benchmark (the market, or their own sector) over the period?* Without that comparison, you're just
noting that some stocks went up — which stocks almost always do, over a long enough window.

---

## 3. System architecture

```
 ┌────────────────┐    ┌──────────────────┐    ┌───────────────────┐
 │  MIT TR10 data  │    │  Company mapping  │    │  Market data APIs  │
 │  (scraped once, │───▶│  (curated table,  │───▶│  (prices, funda-   │
 │  ~25 years)     │    │   versioned)      │    │   mentals, splits) │
 └────────────────┘    └──────────────────┘    └───────────────────┘
                                  │                        │
                                  ▼                        ▼
                        ┌───────────────────────────────────────┐
                        │        PostgreSQL + TimescaleDB         │
                        │  technologies · companies · mappings ·  │
                        │  prices (time-series) · benchmarks      │
                        └───────────────────────────────────────┘
                                  │
                                  ▼
                        ┌───────────────────────────────────────┐
                        │     Backend API (FastAPI / Node)        │
                        │  - filter by year/subject                │
                        │  - compute cohort vs. benchmark return    │
                        │  - "prediction score" per subject          │
                        └───────────────────────────────────────┘
                                  │
                                  ▼
                        ┌───────────────────────────────────────┐
                        │   Frontend (React + a charting lib)      │
                        │  filters → table → stock chart → verdict │
                        └───────────────────────────────────────┘
```

---

## 4. Data sources (and their real limits)

| Data | Source | Cost | Notes |
|---|---|---|---|
| MIT TR10 lists, 2001–present | technologyreview.com archive | Free (scrape once, cache) | Static once scraped — doesn't need refreshing |
| Company mapping | Curated by you/me, stored as a DB table | Free | The most important table in the whole system — see §6 |
| US stock prices (historical, daily) | Alpha Vantage, Tiingo, or Polygon.io | Free tier (rate-limited) → paid for production | Polygon/Tiingo are cleaner for backtesting than Alpha Vantage's free tier |
| Company fundamentals (US) | SEC EDGAR (`data.sec.gov`) | Free | No coverage for non-US tickers (CATL, BYD, etc.) |
| Non-US stock data | A paid vendor (e.g. Financial Modeling Prep, EOD Historical Data) | Paid | Needed for global companies like CATL |
| Benchmark index data | S&P 500 (SPY), sector ETFs (e.g. SOXX for chips, XBI for biotech) | Same vendor as above | Essential for §6 scoring |
| Delisted/acquired company history | Vendor-dependent — many free APIs silently drop delisted tickers | Paid vendors handle this better | Needed to avoid survivorship bias (Nuance, Translate Bio, etc.) |

**Realistic cost:** a free-tier build can get you a working prototype covering current, actively-traded
US large caps. Doing this properly — including delisted companies and non-US names — likely needs a paid
data plan, roughly $50–250/month depending on vendor and query volume.

---

## 5. Database schema (simplified)

```sql
technologies (id, year, name, mit_source_url, description)

companies (id, name, ticker, exchange, website, sector, is_public, ipo_date, delisted_date, delisted_reason)

technology_company_map (technology_id, company_id, role_note, mapping_confidence, added_by, added_at)
  -- mapping_confidence: 'direct' (this IS their business) vs 'exposed' (partial/indirect exposure)
  -- added_by/added_at: keeps the mapping auditable, not silently edited after the fact

stock_prices (company_id, date, open, high, low, close, adj_close, volume)

benchmarks (id, name, ticker)  -- e.g. S&P 500, sector ETFs
benchmark_prices (benchmark_id, date, close)
```

The `mapping_confidence` and `added_at` fields matter more than they look — they're what let you prove
later that you didn't quietly add "gainer" companies after seeing the stock chart.

---

## 6. The "trust score" methodology — how to actually answer your question

For each `technology_id`, compute:

1. **Cohort return**: average and median total return of all mapped companies from
   (MIT publish date) → (today, or delisting date if earlier).
2. **Benchmark return** over the same window: S&P 500, and ideally a relevant sector ETF.
3. **Excess return** = cohort return − benchmark return. This is the real answer to "was it a good call."
4. **Dispersion**: how spread out the outcomes were (a technology where every company won differently
   from one where 2 stocks drove the entire result). A high-dispersion "win" is a much weaker signal.
5. **Survivorship-adjusted return**: include delisted/acquired/bankrupt companies at their actual exit
   value, not by dropping them from the average (this is the single most common way this kind of analysis
   gets falsely rosy).

Roll this up into a **Prediction Score** per technology (e.g., "beat the market by +34pp over 5 years,
across 12 companies, low dispersion" vs. "beat the market by +2pp, entirely driven by one company").
This is the number that actually tells you whether the *category* of "MIT breakthrough picks" is a
usable signal — not any single flashy example like NVIDIA.

---

## 7. Frontend (extends what you already have)

- Same filter-by-year/subject UX as the prototype I built, now backed by a real database and live
  computed scores instead of static text.
- Real stock chart (line chart, cohort average vs. benchmark, over the holding period) — using actual
  price history instead of the gainer/medium/loser bar chart.
- A **"Prediction Score" page**: rank all 25 years / ~250 technologies by excess return, so you can see
  at a glance which categories (energy? AI? biotech?) have historically been the most reliable signal —
  this is the direct answer to "how can we trust breakthrough technologies."
- A 2026 "watchlist" view: shows current mapped companies for this year's list, with the same
  methodology applied retroactively to *past* categories they resemble (e.g., "AI infrastructure in 2026
  resembles deep learning in 2013 — here's how that cohort performed").

---

## 8. Suggested phases

| Phase | Scope | Rough effort |
|---|---|---|
| 1 — Data foundation | Scrape MIT archive, build company-mapping table for ~10-15 subjects (start with what we already have), set up Postgres schema | Small |
| 2 — Market data pipeline | Connect one data vendor, backfill historical prices + benchmarks for mapped companies | Small–Medium |
| 3 — Scoring engine | Implement the trust-score methodology in §6 | Medium |
| 4 — Full app | Backend API + React frontend, replacing the static prototype | Medium |
| 5 — Expand coverage | Add remaining years/subjects, add non-US companies via paid vendor | Ongoing |

---

## 9. Honest caveat on the end goal

Even done well, this system tells you how a *category* of prediction has performed historically — it
does not predict which specific 2026 companies will win. Sector-level "was MIT usually right" analysis
is legitimate research. Turning that into "therefore buy company X" is a leap this system can describe
the risk of, but can't close for you.

---

## 10. Where to build this

This is a multi-week engineering project (database, backend, scheduled data jobs, a real frontend) —
too large for a single chat artifact. The natural place to build it is **Claude Code** or **Cowork**,
where I can scaffold the repo, write the ETL scripts, stand up the database, and iterate with you over
multiple sessions with persistent files instead of one-shot artifacts.
