/** Hover copy for measures, indexes, and controls. Keep in sync with static-site/app.js TIPS. */

export const TIPS = {
  year: "Which MIT Technology Review 10 Breakthrough Technologies edition to read. 2002 was unpublished.",
  breakthrough:
    "The named technology from that year’s list, in MIT’s order. Pick one to load its chart and mapped companies.",
  mappedOnly:
    "When checked, the ledger hides technologies with no public-company map. MIT still named them; we just have no cohort yet.",
  universeAll:
    "Score using every mapped name: direct (this essentially is their business) and exposed (partial / indirect).",
  universeDirect:
    "Score using only direct mappings. Exposed names are dropped so a loose link cannot carry the average.",
  panelMit:
    "MIT’s named list for the selected year, in publication order. Click a name to open its market chart below.",
  panelPulse:
    "Archive-wide counts for the current mapping universe (all mappings or direct only), not just this year.",
  panelLedger:
    "One row per MIT-named technology in this year. Click a row to load the chart. Click a column title to sort.",
  panelChart:
    "Equal-weight mapped companies versus market indexes, all rebased to 100 on the list date (or IPO). The prediction score uses SPY only.",
  panelNames:
    "The editorial map from this technology to listed companies, with each name’s return versus SPY. Click a column title to sort.",
  panelRank:
    "Every scored technology in the archive, not just this year. Default order is prediction score. Click a column title to sort.",
  panelWatch:
    "2026 names and hand-picked historical analogs. Analog excess is history, not a forecast, and not a buy list.",
  panelGuide:
    "Plain-language tour of the project: the idea, the keywords (cohort, mapped only, all mappings, direct), and every measure on the page.",
  kpiTechnologies: "How many MIT TR10 names are in this archive across all years, including list-only items.",
  kpiMapped:
    "How many of those names have at least one mapped public company in the current universe (all mappings or direct only).",
  kpiBeatSpy:
    "Among scored categories (at least two names with prices), how many beat SPY: excess above +5pp and hit rate at least 50%.",
  kpiMedianExcess:
    "Median of category-level average excess versus SPY. Half the scored technologies did better than this, half worse.",
  kpiListed: "Distinct public companies in the mapping tables, including later delistings kept at exit.",
  colYear: "The MIT TR10 edition year.",
  colTechnology:
    "MIT’s TR10 name — a technology, not a ticker. Hover the name for MIT’s description.",
  colCategory:
    "Our editorial bucket (AI, biotech, energy, hardware, and so on). It chooses the sector ETF on the chart. It is not MIT’s taxonomy.",
  colNames: "How many mapped companies have a usable price history for this score.",
  colCohort:
    "Equal-weight average total return of the mapped companies from the list date (or IPO) to the last price or delisting.",
  colExcess:
    "Average of (company return − SPY) over the same dates, in percentage points. This is what the prediction score is based on. +20pp means twenty points more than SPY, not a 20% return.",
  colHit:
    "Share of mapped companies that beat SPY. A high excess with a low hit rate usually means one name carried the average.",
  colScore:
    "50 = in line with SPY. Higher beat the market after shrinking for small samples and disagreement among names. Lower lagged.",
  colVerdict:
    "Beat market: excess above +5pp and hit rate at least 50%. Lagged: excess below −5pp. Mixed: in between. Thin sample or too early if there is not enough history.",
  colRank: "Rank by prediction score, highest first. This number stays put if you sort other columns.",
  colSigma:
    "Dispersion: standard deviation of the companies’ total returns. High σ means the names disagreed, so the average is less trustworthy and the score is pulled toward 50.",
  colTicker: "Yahoo Finance listing ticker used for prices.",
  colCompany: "Legal or trading name. Delisted names stay in at their last or acquisition exit.",
  colMap:
    "direct = this essentially is their business. exposed = partial or indirect exposure to the named technology.",
  colReturn:
    "Total return from the MIT list date (or IPO if later) to the latest price, or to delisting. Not annualized.",
  colVsSpy:
    "That company’s total return minus SPY over the exact same dates, in percentage points.",
  colWhy: "Why this ticker was mapped to the MIT technology. Editorial, timestamped, auditable.",
  predScore:
    "Prediction score for this technology. 50 means the mapped companies matched SPY over the same dates. Always versus SPY, never versus Nasdaq, gold, or oil.",
  chartExcess:
    "Average excess versus SPY for this cohort, and how many years of overlapping prices that window covers.",
  dispersion:
    "σ of company total returns. High dispersion means the mapped names disagreed, so the average is less reliable.",
  withPrices: "Mapped companies that have a usable Yahoo price history versus names in the mapping table.",
  shortWindow: "Fewer than three years of overlapping prices, so the score is less trustworthy.",
  analogExcess:
    "Average excess versus SPY of the hand-picked analog technologies, after their own list dates. History, not a forecast.",
  indexBase:
    "Every chart line is rebased to 100 on the MIT list date, or IPO if later. 150 means +50% from that start. The score still uses SPY only.",
  indexCohort:
    "Equal-weight basket of mapped public companies, rebased to 100 at the start. This is the MIT technology as a market series — not an MIT stock. Always shown.",
  indexSpy:
    "SPDR S&P 500 ETF (SPY). The prediction score is always versus this line on the same dates. Extra indexes are context only.",
  indexSector:
    "Sector ETF for this technology’s editorial category. Context only — it does not change the prediction score, which is always versus SPY.",
  indexNasdaq:
    "Invesco QQQ — Nasdaq-100. A growth/tech-heavy index for context. It does not change the prediction score.",
  indexGold:
    "SPDR Gold Shares (GLD). Listed gold proxy for context. It does not change the prediction score.",
  indexOil:
    "United States Oil Fund (USO). WTI crude oil proxy for context. It does not change the prediction score.",
  listOnly: "MIT named this technology, but we have no mapped public company with prices in the current universe.",
  mitSource: "MIT Technology Review page for this named technology.",
} as const;

export const VERDICT_TIPS: Record<string, string> = {
  beat: "Beat market: average excess versus SPY above +5 percentage points, and at least half the mapped names beat SPY.",
  lag: "Lagged: average excess versus SPY below −5 percentage points.",
  mixed: "Mixed: the cohort neither clearly beat nor lagged SPY on the excess and hit-rate rules.",
  too_early: "Too early: the list is too recent for a fair hold-to-now score.",
  insufficient: "Thin sample: fewer than two mapped companies with a usable price history.",
  none: "Unscored: no cohort result in this universe yet.",
};

export const CONFIDENCE_TIPS: Record<string, string> = {
  direct: "direct: this essentially is their business, not a side bet on the named technology.",
  exposed: "exposed: partial or indirect exposure. Included in All mappings; dropped in Direct only.",
};

export const VERIFY_TIPS: Record<string, string> = {
  verified: "verified: the ten titles for this year were checked against MIT’s published list.",
  secondary: "secondary: taken from a secondary compilation, not re-read against the MIT page.",
  partial: "partial: some titles for this year are confirmed; others are not.",
  gap: "gap: MIT published a list, but we did not independently verify the ten titles here.",
  none: "none: MIT Technology Review did not publish a 10 Breakthrough Technologies list this year.",
};

export const CATEGORY_TIPS: Record<string, string> = {
  ai: "AI: models, chips, and software around machine intelligence. Chart sector line is usually XLK.",
  biotech: "Biotech: drugs, genomics, and tools. Chart sector line is usually XBI or XLV.",
  energy: "Energy: generation, storage, climate tech. Chart sector line is usually XLE or ICLN.",
  hardware: "Hardware: devices, robotics, semiconductors beyond a pure AI map.",
  consumer: "Consumer: products and platforms sold to people rather than labs or plants.",
  space: "Space: launch, satellites, and related listed names.",
  industrial: "Industrial: manufacturing, logistics, and capital equipment.",
  other: "Other: did not fit a tighter editorial bucket.",
};

export function verdictTip(verdict?: string | null): string {
  return VERDICT_TIPS[verdict || "none"] || VERDICT_TIPS.none;
}

export function confidenceTip(value?: string | null): string {
  return CONFIDENCE_TIPS[value || ""] || TIPS.colMap;
}

export function verifyTip(value?: string | null): string {
  return VERIFY_TIPS[value || ""] || "How completely this year’s MIT list was checked.";
}

export function categoryTip(value?: string | null): string {
  if (value && CATEGORY_TIPS[value]) return CATEGORY_TIPS[value];
  return TIPS.colCategory;
}

export function indexTip(key: string, sectorTicker?: string | null): string {
  if (key === "cohort") return TIPS.indexCohort;
  if (key === "spy") return TIPS.indexSpy;
  if (key === "nasdaq") return TIPS.indexNasdaq;
  if (key === "gold") return TIPS.indexGold;
  if (key === "oil") return TIPS.indexOil;
  if (key === "sector") {
    return sectorTicker
      ? `${TIPS.indexSector} This row uses ${sectorTicker}.`
      : TIPS.indexSector;
  }
  return TIPS.indexBase;
}
