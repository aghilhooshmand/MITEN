const DATA = "./data";
const LINE = {
  cohort: "#d4a84b",
  spy: "#7f8ea3",
  sector: "#6ea0ff",
  nasdaq: "#a78bfa",
  gold: "#e6c35c",
  oil: "#ef8a5d",
};
const CAT = {
  ai: "AI",
  biotech: "Biotech",
  energy: "Energy",
  hardware: "Hardware",
  consumer: "Consumer",
  space: "Space",
  industrial: "Industrial",
  other: "Other",
};
const VERDICT = {
  beat: "Beat market",
  lag: "Lagged",
  mixed: "Mixed",
  too_early: "Too early",
  insufficient: "Thin sample",
};

const TIPS = {
  year: "Which MIT Technology Review 10 Breakthrough Technologies edition to read. 2002 was unpublished.",
  breakthrough: "The named technology from that year’s list, in MIT’s order. Pick one to load its chart and mapped companies.",
  mappedOnly: "When checked, the ledger hides technologies with no public-company map. MIT still named them; we just have no cohort yet.",
  universeAll: "Score using every mapped name: direct (this essentially is their business) and exposed (partial / indirect).",
  universeDirect: "Score using only direct mappings. Exposed names are dropped so a loose link cannot carry the average.",
  panelMit: "MIT’s named list for the selected year, in publication order. Click a name to open its market chart below.",
  panelPulse: "Archive-wide counts for the current mapping universe (all mappings or direct only), not just this year.",
  panelLedger: "One row per MIT-named technology in this year. Click a row to load the chart. Click a column title to sort.",
  panelChart: "Equal-weight mapped companies versus market indexes, all rebased to 100 on the list date (or IPO). The prediction score uses SPY only.",
  panelNames: "The editorial map from this technology to listed companies, with each name’s return versus SPY. Click a column title to sort.",
  panelRank: "Every scored technology in the archive, not just this year. Default order is prediction score. Click a column title to sort.",
  panelWatch: "2026 names and hand-picked historical analogs. Analog excess is history, not a forecast, and not a buy list.",
  panelGuide: "Plain-language tour of the project: the idea, the keywords (cohort, mapped only, all mappings, direct), and every measure on the page.",
  kpiTechnologies: "How many MIT TR10 names are in this archive across all years, including list-only items.",
  kpiMapped: "How many of those names have at least one mapped public company in the current universe (all mappings or direct only).",
  kpiBeatSpy: "Among scored categories (at least two names with prices), how many beat SPY: excess above +5pp and hit rate at least 50%.",
  kpiMedianExcess: "Median of category-level average excess versus SPY. Half the scored technologies did better than this, half worse.",
  kpiListed: "Distinct public companies in the mapping tables, including later delistings kept at exit.",
  colYear: "The MIT TR10 edition year.",
  colTechnology: "MIT’s TR10 name — a technology, not a ticker. Hover the name for MIT’s description.",
  colCategory: "Our editorial bucket (AI, biotech, energy, hardware, and so on). It chooses the sector ETF on the chart. It is not MIT’s taxonomy.",
  colNames: "How many mapped companies have a usable price history for this score.",
  colCohort: "Equal-weight average total return of the mapped companies from the list date (or IPO) to the last price or delisting.",
  colExcess: "Average of (company return − SPY) over the same dates, in percentage points. This is what the prediction score is based on. +20pp means twenty points more than SPY, not a 20% return.",
  colHit: "Share of mapped companies that beat SPY. A high excess with a low hit rate usually means one name carried the average.",
  colScore: "50 = in line with SPY. Higher beat the market after shrinking for small samples and disagreement among names. Lower lagged.",
  colVerdict: "Beat market: excess above +5pp and hit rate at least 50%. Lagged: excess below −5pp. Mixed: in between. Thin sample or too early if there is not enough history.",
  colRank: "Rank by prediction score, highest first. This number stays put if you sort other columns.",
  colSigma: "Dispersion: standard deviation of the companies’ total returns. High σ means the names disagreed, so the average is less trustworthy and the score is pulled toward 50.",
  colTicker: "Yahoo Finance listing ticker used for prices.",
  colCompany: "Legal or trading name. Delisted names stay in at their last or acquisition exit.",
  colMap: "direct = this essentially is their business. exposed = partial or indirect exposure to the named technology.",
  colReturn: "Total return from the MIT list date (or IPO if later) to the latest price, or to delisting. Not annualized.",
  colVsSpy: "That company’s total return minus SPY over the exact same dates, in percentage points.",
  colWhy: "Why this ticker was mapped to the MIT technology. Editorial, timestamped, auditable.",
  predScore: "Prediction score for this technology. 50 means the mapped companies matched SPY over the same dates. Always versus SPY, never versus Nasdaq, gold, or oil.",
  chartExcess: "Average excess versus SPY for this cohort, and how many years of overlapping prices that window covers.",
  dispersion: "σ of company total returns. High dispersion means the mapped names disagreed, so the average is less reliable.",
  withPrices: "Mapped companies that have a usable Yahoo price history versus names in the mapping table.",
  shortWindow: "Fewer than three years of overlapping prices, so the score is less trustworthy.",
  analogExcess: "Average excess versus SPY of the hand-picked analog technologies, after their own list dates. History, not a forecast.",
  indexBase: "Every chart line is rebased to 100 on the MIT list date, or IPO if later. 150 means +50% from that start. The score still uses SPY only.",
  indexCohort: "Equal-weight basket of mapped public companies, rebased to 100 at the start. This is the MIT technology as a market series — not an MIT stock. Always shown.",
  indexSpy: "SPDR S&P 500 ETF (SPY). The prediction score is always versus this line on the same dates. Extra indexes are context only.",
  indexSector: "Sector ETF for this technology’s editorial category. Context only — it does not change the prediction score, which is always versus SPY.",
  indexNasdaq: "Invesco QQQ — Nasdaq-100. A growth/tech-heavy index for context. It does not change the prediction score.",
  indexGold: "SPDR Gold Shares (GLD). Listed gold proxy for context. It does not change the prediction score.",
  indexOil: "United States Oil Fund (USO). WTI crude oil proxy for context. It does not change the prediction score.",
  listOnly: "MIT named this technology, but we have no mapped public company with prices in the current universe.",
  mitSource: "MIT Technology Review page for this named technology.",
};

const VERDICT_TIPS = {
  beat: "Beat market: average excess versus SPY above +5 percentage points, and at least half the mapped names beat SPY.",
  lag: "Lagged: average excess versus SPY below −5 percentage points.",
  mixed: "Mixed: the cohort neither clearly beat nor lagged SPY on the excess and hit-rate rules.",
  too_early: "Too early: the list is too recent for a fair hold-to-now score.",
  insufficient: "Thin sample: fewer than two mapped companies with a usable price history.",
  none: "Unscored: no cohort result in this universe yet.",
};

const CONFIDENCE_TIPS = {
  direct: "direct: this essentially is their business, not a side bet on the named technology.",
  exposed: "exposed: partial or indirect exposure. Included in All mappings; dropped in Direct only.",
};

const VERIFY_TIPS = {
  verified: "verified: the ten titles for this year were checked against MIT’s published list.",
  secondary: "secondary: taken from a secondary compilation, not re-read against the MIT page.",
  partial: "partial: some titles for this year are confirmed; others are not.",
  gap: "gap: MIT published a list, but we did not independently verify the ten titles here.",
  none: "none: MIT Technology Review did not publish a 10 Breakthrough Technologies list this year.",
};

const CATEGORY_TIPS = {
  ai: "AI: models, chips, and software around machine intelligence. Chart sector line is usually XLK.",
  biotech: "Biotech: drugs, genomics, and tools. Chart sector line is usually XBI or XLV.",
  energy: "Energy: generation, storage, climate tech. Chart sector line is usually XLE or ICLN.",
  hardware: "Hardware: devices, robotics, semiconductors beyond a pure AI map.",
  consumer: "Consumer: products and platforms sold to people rather than labs or plants.",
  space: "Space: launch, satellites, and related listed names.",
  industrial: "Industrial: manufacturing, logistics, and capital equipment.",
  other: "Other: did not fit a tighter editorial bucket.",
};

const VERDICT_ORDER = { beat: 5, mixed: 3, too_early: 2, insufficient: 1, lag: 0, none: -1 };
const MAP_ORDER = { direct: 2, exposed: 1 };

const state = {
  universe: "all",
  year: "2026",
  mappedOnly: true,
  selectedId: null,
  compareOn: { cohort: true, spy: true, sector: true, nasdaq: false, gold: false, oil: false },
  menuOpen: false,
  db: null,
  sort: {
    ledger: { key: "list_index", dir: "asc" },
    ranking: { key: "score", dir: "desc" },
    names: { key: "ticker", dir: "asc" },
  },
};

function parseCsv(text) {
  const rows = [];
  let i = 0;
  const n = text.length;
  const row = [];
  let field = "";
  let quoted = false;
  while (i < n) {
    const c = text[i];
    if (quoted) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 2;
          continue;
        }
        quoted = false;
        i += 1;
        continue;
      }
      field += c;
      i += 1;
      continue;
    }
    if (c === '"') {
      quoted = true;
      i += 1;
      continue;
    }
    if (c === ",") {
      row.push(field);
      field = "";
      i += 1;
      continue;
    }
    if (c === "\n" || (c === "\r" && text[i + 1] === "\n")) {
      row.push(field);
      if (row.some((x) => x !== "")) rows.push(row.slice());
      row.length = 0;
      field = "";
      i += c === "\r" ? 2 : 1;
      continue;
    }
    field += c;
    i += 1;
  }
  if (field || row.length) {
    row.push(field);
    rows.push(row);
  }
  if (!rows.length) return [];
  const headers = rows[0];
  return rows.slice(1).map((cells) => {
    const obj = {};
    headers.forEach((h, idx) => {
      obj[h] = cells[idx] ?? "";
    });
    return obj;
  });
}

function num(v) {
  if (v === "" || v == null) return null;
  const n = Number(v);
  return Number.isNaN(n) ? null : n;
}

function fmtPct(v, digits = 1) {
  if (v == null || Number.isNaN(v)) return "—";
  const pct = v * 100;
  return `${pct > 0 ? "+" : ""}${pct.toFixed(digits)}%`;
}

function fmtPp(v, digits = 1) {
  if (v == null || Number.isNaN(v)) return "—";
  const pct = v * 100;
  return `${pct > 0 ? "+" : ""}${pct.toFixed(digits)}pp`;
}

function fmtScore(v) {
  return v == null || Number.isNaN(v) ? "—" : v.toFixed(1);
}

function fmtNum(v, digits = 0) {
  return v == null || Number.isNaN(v) ? "—" : v.toFixed(digits);
}

function signed(v) {
  if (v == null || Number.isNaN(v) || v === 0) return "num";
  return v > 0 ? "num up" : "num down";
}

function catLabel(v) {
  return CAT[v] || v || "";
}

function verdictLabel(v) {
  return VERDICT[v] || "Unscored";
}

function esc(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function tipAttr(text) {
  if (!text) return "";
  return ` data-tip="${esc(text)}"`;
}

function verdictTip(v) {
  return VERDICT_TIPS[v || "none"] || VERDICT_TIPS.none;
}

function confidenceTip(v) {
  return CONFIDENCE_TIPS[v] || TIPS.colMap;
}

function verifyTip(v) {
  return VERIFY_TIPS[v] || "How completely this year’s MIT list was checked.";
}

function categoryTip(v) {
  return CATEGORY_TIPS[v] || TIPS.colCategory;
}

function indexTip(key, ticker) {
  if (key === "cohort") return TIPS.indexCohort;
  if (key === "spy") return TIPS.indexSpy;
  if (key === "nasdaq") return TIPS.indexNasdaq;
  if (key === "gold") return TIPS.indexGold;
  if (key === "oil") return TIPS.indexOil;
  if (key === "sector") {
    return ticker ? `${TIPS.indexSector} This row uses ${ticker}.` : TIPS.indexSector;
  }
  return TIPS.indexBase;
}

function cmpNum(a, b, dir) {
  const aMissing = a == null || Number.isNaN(a);
  const bMissing = b == null || Number.isNaN(b);
  if (aMissing && bMissing) return 0;
  if (aMissing) return 1;
  if (bMissing) return -1;
  return dir === "asc" ? a - b : b - a;
}

function cmpStr(a, b, dir) {
  const cmp = String(a ?? "").localeCompare(String(b ?? ""), undefined, {
    numeric: true,
    sensitivity: "base",
  });
  return dir === "asc" ? cmp : -cmp;
}

function cmpVerdict(a, b, dir) {
  return cmpNum(VERDICT_ORDER[a || "none"] ?? -1, VERDICT_ORDER[b || "none"] ?? -1, dir);
}

function cmpMap(a, b, dir) {
  return cmpNum(MAP_ORDER[a] ?? 0, MAP_ORDER[b] ?? 0, dir);
}

function sortMark(table, key) {
  const spec = state.sort[table];
  if (!spec || spec.key !== key) return "";
  return spec.dir === "asc" ? " ↑" : " ↓";
}

async function loadDb() {
  const names = [
    "meta",
    "years",
    "technologies",
    "companies",
    "mappings",
    "scores",
    "score_companies",
    "analogies",
    "charts",
  ];
  const texts = await Promise.all(
    names.map(async (name) => {
      const res = await fetch(`${DATA}/${name}.csv`);
      if (!res.ok) throw new Error(`Missing ${name}.csv (${res.status})`);
      return res.text();
    }),
  );
  const parsed = Object.fromEntries(names.map((name, i) => [name, parseCsv(texts[i])]));
  const meta = Object.fromEntries(parsed.meta.map((r) => [r.key, r.value]));
  const companies = Object.fromEntries(parsed.companies.map((c) => [c.ticker, c]));
  const techs = parsed.technologies.map((t) => ({
    ...t,
    id: Number(t.id),
    year: Number(t.year),
    list_index: Number(t.list_index),
  }));
  const techById = Object.fromEntries(techs.map((t) => [t.id, t]));
  const scores = parsed.scores.map((s) => ({
    ...s,
    technology_id: Number(s.technology_id),
    n_companies: Number(s.n_companies),
    n_with_prices: Number(s.n_with_prices),
    cohort_mean_return: num(s.cohort_mean_return),
    mean_excess_return: num(s.mean_excess_return),
    dispersion: num(s.dispersion),
    hit_rate: num(s.hit_rate),
    window_years: num(s.window_years),
    window_short: s.window_short === "1",
    prediction_score: num(s.prediction_score),
  }));
  const scoreIx = {};
  for (const s of scores) scoreIx[`${s.technology_id}:${s.universe}`] = s;
  const mappings = parsed.mappings.map((m) => ({
    ...m,
    technology_id: Number(m.technology_id),
    company_id: Number(m.company_id),
  }));
  const scoreCompanies = parsed.score_companies.map((r) => ({
    ...r,
    technology_id: Number(r.technology_id),
    total_return: num(r.total_return),
    spy_return: num(r.spy_return),
    excess_return: num(r.excess_return),
  }));
  const analogies = parsed.analogies.map((a) => ({
    technology_id: Number(a.technology_id),
    analogous_technology_id: Number(a.analogous_technology_id),
    note: a.note,
  }));
  const charts = {};
  for (const row of parsed.charts) {
    const key = `${row.technology_id}:${row.universe}`;
    if (!charts[key]) charts[key] = [];
    charts[key].push({
      date: row.date,
      cohort: num(row.cohort),
      spy: num(row.spy),
      sector: num(row.sector),
      nasdaq: num(row.nasdaq),
      gold: num(row.gold),
      oil: num(row.oil),
    });
  }
  return {
    meta,
    years: parsed.years.map((y) => ({ ...y, year: Number(y.year) })),
    techs,
    techById,
    companies,
    mappings,
    scores,
    scoreIx,
    scoreCompanies,
    analogies,
    charts,
  };
}

function scoreOf(techId, universe) {
  return state.db.scoreIx[`${techId}:${universe}`] || null;
}

function isMapped(techId, universe) {
  const s = scoreOf(techId, universe);
  return Boolean(s && s.n_companies > 0);
}

function overview() {
  const { techs, companies, meta } = state.db;
  const universe = state.universe;
  const scored = techs
    .map((t) => scoreOf(t.id, universe))
    .filter((s) => s && s.n_with_prices >= 2 && s.mean_excess_return != null);
  const beat = scored.filter((s) => s.verdict === "beat");
  const lag = scored.filter((s) => s.verdict === "lag");
  const excesses = scored.map((s) => s.mean_excess_return).sort((a, b) => a - b);
  const mid = excesses.length
    ? excesses[Math.floor((excesses.length - 1) / 2)]
    : null;
  return {
    as_of: meta.as_of,
    disclaimer: meta.disclaimer,
    n_technologies: techs.length,
    n_mapped_technologies: techs.filter((t) => isMapped(t.id, universe)).length,
    n_scored: scored.length,
    n_companies: Object.keys(companies).length,
    beat_count: beat.length,
    lag_count: lag.length,
    beat_rate: scored.length ? beat.length / scored.length : null,
    median_excess_return: mid,
  };
}

function panelOpen(id, fallback) {
  try {
    const stored = JSON.parse(localStorage.getItem("static-ledger-panels") || "{}");
    if (id in stored) return stored[id];
  } catch {
    /* ignore */
  }
  return fallback;
}

function setPanel(id, open) {
  const stored = JSON.parse(localStorage.getItem("static-ledger-panels") || "{}");
  stored[id] = open;
  localStorage.setItem("static-ledger-panels", JSON.stringify(stored));
}

function panel(id, title, subtitle, body, defaultOpen = true, titleTip) {
  const open = panelOpen(id, defaultOpen);
  return `<section class="panel ${open ? "open" : "closed"}" id="panel-${id}" data-panel="${id}">
    <button class="panel-head" type="button" data-toggle-panel="${id}">
      <span class="panel-chevron">${open ? "▾" : "▸"}</span>
      <span class="panel-title"${tipAttr(titleTip)}>${esc(title)}</span>
      ${subtitle ? `<span class="panel-sub">${esc(subtitle)}</span>` : ""}
      <span class="panel-action">${open ? "Hide" : "Show"}</span>
    </button>
    ${open ? `<div class="panel-body">${body}</div>` : ""}
  </section>`;
}

function mitPicks() {
  const year = Number(state.year);
  return state.db.techs
    .filter((t) => t.year === year)
    .sort((a, b) => a.list_index - b.list_index);
}

function ledgerRows() {
  const year = Number(state.year);
  return state.db.techs.filter((t) => {
    if (t.year !== year) return false;
    if (state.mappedOnly && !isMapped(t.id, state.universe)) return false;
    return true;
  });
}

function ranking() {
  const rows = state.db.techs
    .map((t) => {
      const s = scoreOf(t.id, state.universe);
      if (!s || s.n_with_prices < 2 || s.prediction_score == null) return null;
      return { tech: t, score: s };
    })
    .filter(Boolean)
    .sort((a, b) => b.score.prediction_score - a.score.prediction_score);
  return rows.map((r, i) => ({ ...r, rank: i + 1 }));
}

function detailOf(id) {
  const tech = state.db.techById[id];
  if (!tech) return null;
  const universe = state.universe;
  const score = scoreOf(id, universe);
  const maps = state.db.mappings.filter((m) => m.technology_id === id);
  const filtered = universe === "direct" ? maps.filter((m) => m.confidence === "direct") : maps;
  const returns = state.db.scoreCompanies.filter(
    (r) => r.technology_id === id && r.universe === universe,
  );
  const byTicker = Object.fromEntries(returns.map((r) => [r.ticker, r]));
  const companies = filtered
    .map((m) => {
      const co = state.db.companies[m.ticker] || {};
      const ret = byTicker[m.ticker] || {};
      return {
        ticker: m.ticker,
        name: co.name || ret.name || m.ticker,
        confidence: m.confidence,
        role_note: m.role_note,
        added_at: m.added_at,
        delisted_date: co.delisted_date,
        delisted_reason: co.delisted_reason,
        total_return: ret.total_return,
        excess_return: ret.excess_return,
      };
    })
    .sort((a, b) => a.ticker.localeCompare(b.ticker));
  const analogs = state.db.analogies
    .filter((a) => a.technology_id === id)
    .map((a) => {
      const other = state.db.techById[a.analogous_technology_id];
      return {
        id: a.analogous_technology_id,
        year: other?.year,
        name: other?.name,
        note: a.note,
        score: scoreOf(a.analogous_technology_id, universe),
      };
    });
  return {
    tech,
    score,
    companies,
    analogs,
    points: state.db.charts[`${id}:${universe}`] || [],
  };
}

function watchItems() {
  const items = state.db.techs.filter((t) => t.year === 2026);
  return items.map((t) => {
    const maps = state.db.mappings.filter((m) => m.technology_id === t.id);
    const filtered =
      state.universe === "direct" ? maps.filter((m) => m.confidence === "direct") : maps;
    const analogs = state.db.analogies
      .filter((a) => a.technology_id === t.id)
      .map((a) => {
        const other = state.db.techById[a.analogous_technology_id];
        return {
          id: a.analogous_technology_id,
          year: other?.year,
          name: other?.name,
          score: scoreOf(a.analogous_technology_id, state.universe),
        };
      });
    const analogScores = analogs
      .map((a) => a.score)
      .filter((s) => s && s.mean_excess_return != null);
    const hist =
      analogScores.length === 0
        ? null
        : analogScores.reduce((a, s) => a + s.mean_excess_return, 0) / analogScores.length;
    return {
      ...t,
      score: scoreOf(t.id, state.universe),
      companies: filtered,
      analogs,
      historical_analog_excess: hist,
    };
  });
}

function chartBox(width) {
  const w = Math.max(260, Math.round(width || 0));
  const h = w < 480 ? 220 : w < 800 ? 260 : 320;
  return {
    w,
    h,
    pad: {
      l: w < 480 ? 30 : 44,
      r: w < 480 ? 8 : 12,
      t: 12,
      b: 28,
    },
  };
}

function chartHostWidth(host) {
  const measured = host && host.clientWidth;
  if (measured > 40) return measured;
  const gutter = window.innerWidth < 900 ? 48 : 72;
  return Math.max(260, window.innerWidth - gutter);
}

function chartGeometry(points, keys, width) {
  if (!points || points.length < 2) {
    return {
      empty: true,
      html: `<p class="empty">No overlapping price history for this cohort.</p>`,
    };
  }
  const { w, h, pad } = chartBox(width);
  const vals = [];
  for (const p of points) {
    for (const k of keys) {
      if (p[k] != null) vals.push(p[k]);
    }
  }
  if (!vals.length) {
    return {
      empty: true,
      html: `<p class="empty">No overlapping price history for this cohort.</p>`,
    };
  }
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const span = max - min || 1;
  return {
    empty: false,
    w,
    h,
    pad,
    min,
    max,
    span,
    xAt: (i) => pad.l + (i / (points.length - 1)) * (w - pad.l - pad.r),
    yAt: (v) => pad.t + (1 - (v - min) / span) * (h - pad.t - pad.b),
  };
}

function yearTicks(years, x, minGap) {
  if (years.length <= 2) return years;
  const last = years[years.length - 1];
  const picked = [years[0]];
  for (const item of years.slice(1, -1)) {
    const prev = picked[picked.length - 1];
    if (x(item.i) - x(prev.i) >= minGap && x(last.i) - x(item.i) >= minGap) {
      picked.push(item);
    }
  }
  picked.push(last);
  return picked;
}

function seriesHoverLabel(key, detail) {
  if (key === "cohort") return "MIT cohort";
  if (key === "spy") return "S&P 500 (SPY)";
  if (key === "nasdaq") return "Nasdaq-100 (QQQ)";
  if (key === "gold") return "Gold (GLD)";
  if (key === "oil") return "Oil (USO)";
  if (key === "sector") {
    const ticker = detail?.tech?.benchmark_ticker;
    return ticker ? `Sector (${ticker})` : "Sector";
  }
  return key;
}

function fmtChartVal(v) {
  return v == null || Number.isNaN(v) ? "—" : Number(v).toFixed(1);
}

function chartTipHtml(point, keys, detail) {
  const rows = keys
    .map(
      (k) => `<div class="chart-tip-row">
        <span class="chart-tip-name"><i style="background:${LINE[k]}"></i>${esc(seriesHoverLabel(k, detail))}</span>
        <span class="chart-tip-val">${fmtChartVal(point[k])}</span>
      </div>`,
    )
    .join("");
  return `<div class="chart-tip-date">${esc(point.date)}</div>${rows}`;
}

function placeChartTip(host, tip, event) {
  const rect = host.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;
  const tw = tip.offsetWidth;
  const th = tip.offsetHeight;
  let left = x + 16;
  let top = y - th - 10;
  if (left + tw > rect.width - 4) left = x - tw - 16;
  if (left < 4) left = 4;
  if (top < 4) top = y + 16;
  if (top + th > rect.height - 4) top = Math.max(4, rect.height - th - 4);
  tip.style.left = `${left}px`;
  tip.style.top = `${top}px`;
}

function drawChart(points, keys, width) {
  const geo = chartGeometry(points, keys, width);
  if (geo.empty) return geo.html;
  const { w, h, pad, xAt, yAt } = geo;
  const stroke = w < 480 ? { cohort: 1.8, other: 1.3 } : { cohort: 2.2, other: 1.5 };
  const paths = keys
    .map((k) => {
      let d = "";
      let drawing = false;
      points.forEach((p, i) => {
        if (p[k] == null) {
          drawing = false;
          return;
        }
        d += `${drawing ? "L" : "M"}${xAt(i).toFixed(1)},${yAt(p[k]).toFixed(1)} `;
        drawing = true;
      });
      const sw = k === "cohort" ? stroke.cohort : stroke.other;
      return `<path d="${d}" fill="none" stroke="${LINE[k]}" stroke-width="${sw}" />`;
    })
    .join("");
  const ticks = [geo.min, geo.min + geo.span / 2, geo.max];
  const axis = ticks
    .map((v) => {
      const yy = yAt(v);
      return `<text class="chart-axis" x="2" y="${yy + 3}">${v.toFixed(0)}</text>
        <line x1="${pad.l}" x2="${w - pad.r}" y1="${yy}" y2="${yy}" stroke="#1c2430" />`;
    })
    .join("");
  const years = [];
  points.forEach((p, i) => {
    const yr = p.date.slice(0, 4);
    if (years.length === 0 || years[years.length - 1].yr !== yr) years.push({ yr, i });
  });
  const labeled = yearTicks(years, xAt, w < 480 ? 56 : 48);
  const xlabels = labeled
    .map(({ yr, i }, idx) => {
      const anchor = idx === 0 ? "start" : idx === labeled.length - 1 ? "end" : "middle";
      return `<text class="chart-axis" text-anchor="${anchor}" x="${xAt(i)}" y="${h - 6}">${yr}</text>`;
    })
    .join("");
  return `<svg class="chart-svg" viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Cohort versus market">${axis}${paths}${xlabels}<g class="chart-hover"></g><rect class="chart-hit" x="0" y="0" width="${w}" height="${h}" fill="transparent" /></svg>`;
}

function bindChartHover(host, detail, width) {
  const svg = host.querySelector(".chart-svg");
  if (!svg || !detail) return;
  const points = detail.points;
  const keys = chartKeys();
  const geo = chartGeometry(points, keys, width);
  if (geo.empty) return;
  const hover = svg.querySelector(".chart-hover");
  const tip = document.createElement("div");
  tip.className = "chart-tip";
  tip.hidden = true;
  host.appendChild(tip);

  const show = (event) => {
    const rect = svg.getBoundingClientRect();
    if (!rect.width || points.length < 2) return;
    const px = ((event.clientX - rect.left) / rect.width) * geo.w;
    const inner = geo.w - geo.pad.l - geo.pad.r;
    const t = inner <= 0 ? 0 : (px - geo.pad.l) / inner;
    const i = Math.max(0, Math.min(points.length - 1, Math.round(t * (points.length - 1))));
    const point = points[i];
    const xx = geo.xAt(i).toFixed(1);
    const dots = keys
      .filter((k) => point[k] != null)
      .map(
        (k) =>
          `<circle cx="${xx}" cy="${geo.yAt(point[k]).toFixed(1)}" r="4" fill="${LINE[k]}" stroke="#080a0e" stroke-width="1.5" />`,
      )
      .join("");
    hover.innerHTML = `<line x1="${xx}" x2="${xx}" y1="${geo.pad.t}" y2="${geo.h - geo.pad.b}" stroke="#8b93a7" stroke-width="1" stroke-dasharray="3 3" opacity="0.75" />${dots}`;
    hover.classList.add("on");
    tip.hidden = false;
    tip.innerHTML = chartTipHtml(point, keys, detail);
    placeChartTip(host, tip, event);
  };
  const hide = () => {
    tip.hidden = true;
    hover.classList.remove("on");
    hover.innerHTML = "";
  };
  svg.addEventListener("pointermove", show);
  svg.addEventListener("pointerleave", hide);
}

function paintResponsiveChart() {
  const host = document.getElementById("chart-host");
  if (!host || !state.db || state.selectedId == null) return;
  const detail = detailOf(state.selectedId);
  if (!detail) return;
  const width = chartHostWidth(host);
  if (width === lastChartWidth && host.querySelector("svg, .empty")) return;
  lastChartWidth = width;
  host.innerHTML = drawChart(detail.points, chartKeys(), width);
  bindChartHover(host, detail, width);
}

let chartObserver = null;
let lastChartWidth = -1;

function chartKeys() {
  return ["cohort", "spy", "sector", "nasdaq", "gold", "oil"].filter((k) =>
    k === "cohort" ? true : state.compareOn[k],
  );
}

function observeChart() {
  const host = document.getElementById("chart-host");
  if (chartObserver) {
    chartObserver.disconnect();
    chartObserver = null;
  }
  lastChartWidth = -1;
  if (!host) return;
  paintResponsiveChart();
  if (typeof ResizeObserver === "undefined") return;
  chartObserver = new ResizeObserver(() => paintResponsiveChart());
  chartObserver.observe(host);
}

function render() {
  const ov = overview();
  const picks = mitPicks();
  const edition = state.db.years.find((y) => y.year === Number(state.year));
  const rows = ledgerRows();
  if (state.selectedId == null || !picks.some((t) => t.id === state.selectedId)) {
    const first = picks[0] || rows[0];
    state.selectedId = first ? first.id : null;
  }
  const detail = state.selectedId ? detailOf(state.selectedId) : null;
  const selected = picks.find((t) => t.id === state.selectedId);
  const years = [...state.db.years].sort((a, b) => b.year - a.year);

  const yearOpts = years
    .map((y) => `<option value="${y.year}" ${String(y.year) === state.year ? "selected" : ""}>${y.year}</option>`)
    .join("");

  const emptyLabel =
    state.year === "2002" ? "No list published" : "No verified list this year";
  const trigger = selected
    ? `${String(selected.list_index).padStart(2, "0")} · ${selected.name}`
    : emptyLabel;
  const menu = picks
    .map((item) => {
      const on = item.id === state.selectedId ? "on" : "";
      return `<li>
        <button type="button" class="break-option ${on}" data-select="${item.id}"${tipAttr(item.description)}>
          <span class="mono muted">${String(item.list_index).padStart(2, "0")}</span>
          ${esc(item.name)}
        </button>
      </li>`;
    })
    .join("");

  const mitBody = !edition
    ? `<p class="empty">Pick a year to see MIT’s list.</p>`
    : `${editionMeta(edition)}${mitList(picks, edition)}`;

  const app = document.getElementById("app");
  app.innerHTML = `
    <header class="top">
      <div>
        <p class="eyebrow">MIT TR10 × public markets</p>
        <div class="brand">
          <img src="./miten-logo.png" alt="MITEN" width="48" height="48" />
          <h1>MITEN</h1>
        </div>
        <p class="static-tag">Static CSV snapshot · no server</p>
      </div>
      <p class="lede">
        MIT Technology Review’s annual 10 Breakthrough Technologies, then whether
        mapped public companies beat SPY after the call. This copy reads only
        CSV files in <code>data/</code>.
        <a class="guide-jump" href="#panel-guide">How to read MITEN</a>
      </p>
    </header>
    <div class="filters">
      <label><span class="tip-label"${tipAttr(TIPS.year)}>Year</span>
        <select id="year">${yearOpts}</select>
      </label>
      <label class="grow"><span class="tip-label"${tipAttr(TIPS.breakthrough)}>MIT breakthrough</span>
        <div class="break-select" id="break-select">
          <button type="button" class="break-trigger" id="break-trigger" ${picks.length ? "" : "disabled"}>
            ${esc(trigger)}
          </button>
          ${state.menuOpen && picks.length ? `<ul class="break-menu">${menu}</ul>` : ""}
        </div>
      </label>
      <label class="check">
        <input type="checkbox" id="mapped-only" ${state.mappedOnly ? "checked" : ""} />
        <span class="tip-label"${tipAttr(TIPS.mappedOnly)}>Mapped only</span>
      </label>
      <div class="segment">
        <button type="button" class="${state.universe === "all" ? "on" : ""}" data-universe="all"${tipAttr(TIPS.universeAll)}>All mappings</button>
        <button type="button" class="${state.universe === "direct" ? "on" : ""}" data-universe="direct"${tipAttr(TIPS.universeDirect)}>Direct only</button>
      </div>
    </div>
    <div class="banner">${esc(ov.disclaimer)}</div>
    ${panel("mit-list", "MIT 10 Breakthrough Technologies", edition ? `${edition.year} · ${picks.length} named` : "Year-by-year TR10 lists", mitBody, true, TIPS.panelMit)}
    ${panel("pulse", "Market pulse", `as of ${ov.as_of}`, kpis(ov), true, TIPS.panelPulse)}
    ${panel("ledger", "Technology ledger", `${rows.length} rows · click a name · click a column to sort`, ledgerTable(rows), true, TIPS.panelLedger)}
    ${panel("chart", "Cohort vs market", detail ? `${detail.tech.year} ${detail.tech.name} · equal-weight vs SPY` : "Select a technology", chartPanel(detail), true, TIPS.panelChart)}
    ${panel("names", "Mapped companies", detail ? `${detail.companies.length} names · click a column to sort` : "", namesTable(detail), true, TIPS.panelNames)}
    ${panel("ranking", "Prediction ranking", "Click a column to sort · 50 means the mapped names matched SPY", rankTable(), false, TIPS.panelRank)}
    ${panel("watch", "2026 watchlist", "Live book · analog history, not a forecast", watchGrid(), true, TIPS.panelWatch)}
    ${panel("method", "How the score is computed", "", methodBody(), false)}
    ${panel("guide", "How to read MITEN", "Idea, keywords, measures · start here if a word is unclear", guideBody(), true, TIPS.panelGuide)}
    <footer class="contact">
      <span>Aghil Hooshmand</span>
      <a href="https://www.linkedin.com/in/aghilhooshmand" target="_blank" rel="noreferrer">LinkedIn</a>
      <a href="mailto:aghil.hooshmand@gmail.com">aghil.hooshmand@gmail.com</a>
    </footer>
  `;
  observeChart();
}

function editionMeta(edition) {
  return `<div class="edition-meta">
    <span class="pill ${esc(edition.verification_status)}"${tipAttr(verifyTip(edition.verification_status))}>${esc(edition.verification_status)}</span>
    <p>${esc(edition.note)}</p>
    ${edition.source_url ? `<a href="${esc(edition.source_url)}" target="_blank" rel="noreferrer">MIT archive</a>` : ""}
  </div>`;
}

function mitList(picks, edition) {
  if (!picks.length) {
    const msg =
      edition.verification_status === "none"
        ? "MIT Technology Review did not publish a list this year."
        : "No names in the CSV snapshot for this year.";
    return `<p class="empty">${msg}</p>`;
  }
  return `<ol class="mit-list">${picks
    .map((item) => {
      const s = scoreOf(item.id, state.universe);
      const mapped = isMapped(item.id, state.universe);
      return `<li>
        <button type="button" class="mit-item ${item.id === state.selectedId ? "selected" : ""}" data-select="${item.id}">
          <span class="mit-num mono">${String(item.list_index).padStart(2, "0")}</span>
          <span class="mit-body"><span class="name"${tipAttr(item.description)}>${esc(item.name)}</span></span>
          <span class="mit-side">
            <span class="muted"${tipAttr(categoryTip(item.category))}>${esc(catLabel(item.category))}</span>
            ${
              mapped
                ? `<span class="pill ${esc(s?.verdict || "mixed")}"${tipAttr(verdictTip(s?.verdict))}>${esc(verdictLabel(s?.verdict))}</span>`
                : `<span class="pill none"${tipAttr(TIPS.listOnly)}>List only</span>`
            }
          </span>
        </button>
      </li>`;
    })
    .join("")}</ol>`;
}

function kpis(ov) {
  const beatTone = ov.beat_count > (ov.lag_count || 0) ? "up" : "down";
  const exTone =
    (ov.median_excess_return || 0) > 0 ? "up" : (ov.median_excess_return || 0) < 0 ? "down" : "";
  const beatVal = ov.beat_rate == null ? "—" : `${ov.beat_count}/${ov.n_scored}`;
  return `<div class="kpis">
    <div class="kpi"${tipAttr(TIPS.kpiTechnologies)}><span class="k tip-label">Technologies</span><span class="v">${fmtNum(ov.n_technologies)}</span><span class="h">in the archive</span></div>
    <div class="kpi"${tipAttr(TIPS.kpiMapped)}><span class="k tip-label">Mapped</span><span class="v">${fmtNum(ov.n_mapped_technologies)}</span><span class="h">have a cohort</span></div>
    <div class="kpi"${tipAttr(TIPS.kpiBeatSpy)}><span class="k tip-label">Beat SPY</span><span class="v ${beatTone}">${beatVal}</span><span class="h">${fmtPct(ov.beat_rate, 0)} of scored</span></div>
    <div class="kpi"${tipAttr(TIPS.kpiMedianExcess)}><span class="k tip-label">Median excess</span><span class="v ${exTone}">${fmtPp(ov.median_excess_return)}</span><span class="h">vs SPY, scored categories</span></div>
    <div class="kpi"${tipAttr(TIPS.kpiListed)}><span class="k tip-label">Listed names</span><span class="v">${fmtNum(ov.n_companies)}</span><span class="h">in CSV snapshot</span></div>
  </div>`;
}

function col(label, explain, align, table, key, defaultDir = "desc") {
  const on = state.sort[table]?.key === key;
  const cls = [align === "r" ? "r" : "", on ? "sorted" : ""].filter(Boolean).join(" ");
  return `<th class="${cls}" data-sort="${esc(key)}" data-sort-table="${esc(table)}" data-sort-default="${esc(defaultDir)}">
    <button type="button" class="col-head sortable ${on ? "on" : ""}"${tipAttr(`${explain} Click to sort.`)}>${esc(label)}${sortMark(table, key)}</button>
  </th>`;
}

function ledgerTable(rows) {
  const spec = state.sort.ledger;
  const sorted = [...rows].sort((a, b) => {
    const sa = scoreOf(a.id, state.universe);
    const sb = scoreOf(b.id, state.universe);
    const { key, dir } = spec;
    if (key === "year") return cmpNum(a.year, b.year, dir);
    if (key === "name") return cmpStr(a.name, b.name, dir);
    if (key === "category") return cmpStr(catLabel(a.category), catLabel(b.category), dir);
    if (key === "names") return cmpNum(sa?.n_with_prices, sb?.n_with_prices, dir);
    if (key === "cohort") return cmpNum(sa?.cohort_mean_return, sb?.cohort_mean_return, dir);
    if (key === "excess") return cmpNum(sa?.mean_excess_return, sb?.mean_excess_return, dir);
    if (key === "hit") return cmpNum(sa?.hit_rate, sb?.hit_rate, dir);
    if (key === "score") return cmpNum(sa?.prediction_score, sb?.prediction_score, dir);
    if (key === "verdict") return cmpVerdict(sa?.verdict, sb?.verdict, dir);
    return cmpNum(a.list_index ?? a.id, b.list_index ?? b.id, dir);
  });
  const body = sorted
    .map((t) => {
      const s = scoreOf(t.id, state.universe);
      return `<tr class="${t.id === state.selectedId ? "selected" : ""}" data-select="${t.id}">
        <td class="mono">${t.year}</td>
        <td><div class="name"${tipAttr(t.description)}>${esc(t.name)}</div>${s?.window_short ? `<div class="hint"${tipAttr(TIPS.shortWindow)}>short window</div>` : ""}</td>
        <td class="muted"><span${tipAttr(categoryTip(t.category))}>${esc(catLabel(t.category))}</span></td>
        <td class="r mono">${s?.n_with_prices ?? 0}</td>
        <td class="r ${signed(s?.cohort_mean_return)}">${fmtPct(s?.cohort_mean_return)}</td>
        <td class="r ${signed(s?.mean_excess_return)}">${fmtPp(s?.mean_excess_return)}</td>
        <td class="r mono">${fmtPct(s?.hit_rate, 0)}</td>
        <td class="r mono gold">${fmtScore(s?.prediction_score)}</td>
        <td><span class="pill ${esc(s?.verdict || "none")}"${tipAttr(verdictTip(s?.verdict))}>${esc(verdictLabel(s?.verdict))}</span></td>
      </tr>`;
    })
    .join("");
  return `<div class="table-wrap"><table>
    <thead><tr>
      ${col("Year", TIPS.colYear, "", "ledger", "year", "desc")}
      ${col("Technology", TIPS.colTechnology, "", "ledger", "name", "asc")}
      ${col("Cat.", TIPS.colCategory, "", "ledger", "category", "asc")}
      ${col("Names", TIPS.colNames, "r", "ledger", "names")}
      ${col("Cohort", TIPS.colCohort, "r", "ledger", "cohort")}
      ${col("Excess vs SPY", TIPS.colExcess, "r", "ledger", "excess")}
      ${col("Hit", TIPS.colHit, "r", "ledger", "hit")}
      ${col("Score", TIPS.colScore, "r", "ledger", "score")}
      ${col("Verdict", TIPS.colVerdict, "", "ledger", "verdict")}
    </tr></thead>
    <tbody>${body || `<tr><td colspan="9" class="empty">No rows for these filters.</td></tr>`}</tbody>
  </table></div>`;
}

function chartPanel(detail) {
  if (!detail) return `<p class="empty">Pick a row in the ledger.</p>`;
  const s = detail.score;
  const keys = ["cohort", "spy", "sector", "nasdaq", "gold", "oil"].filter((k) =>
    k === "cohort" ? true : state.compareOn[k],
  );
  const chips = [
    { key: "cohort", label: "MIT cohort", ticker: null },
    { key: "spy", label: "S&P 500", ticker: "SPY" },
    { key: "sector", label: detail.tech.benchmark_ticker || "Sector", ticker: detail.tech.benchmark_ticker },
    { key: "nasdaq", label: "Nasdaq-100", ticker: "QQQ" },
    { key: "gold", label: "Gold", ticker: "GLD" },
    { key: "oil", label: "Oil", ticker: "USO" },
  ]
    .map((c) => {
      const on = c.key === "cohort" || state.compareOn[c.key];
      return `<button type="button" class="compare-chip ${on ? "on" : ""}" data-series="${c.key}" ${c.key === "cohort" ? "disabled" : ""} style="--chip:${LINE[c.key]}"${tipAttr(indexTip(c.key, detail.tech.benchmark_ticker))}>
        ${esc(c.label)}${c.ticker ? ` (${c.ticker})` : ""}
      </button>`;
    })
    .join("");
  return `
    <div class="detail-head">
      <div>
        <h2${tipAttr(detail.tech.description)}>${detail.tech.year} ${esc(detail.tech.name)}</h2>
        <p>${esc(detail.tech.description)}</p>
      </div>
      <div class="score-box">
        <span class="k tip-label"${tipAttr(TIPS.predScore)}>Prediction score</span>
        <span class="v">${fmtScore(s?.prediction_score)}</span>
        <span class="pill ${esc(s?.verdict || "none")}"${tipAttr(verdictTip(s?.verdict))}>${esc(verdictLabel(s?.verdict))}</span>
      </div>
    </div>
    <div class="chart-meta">
      <span class="tip-label"${tipAttr(TIPS.chartExcess)}>Excess ${fmtPp(s?.mean_excess_return)} vs SPY over ${fmtNum(s?.window_years, 1)}y</span>
      <span class="tip-label"${tipAttr(TIPS.dispersion)}>Dispersion ${fmtPct(s?.dispersion)}</span>
      <span class="tip-label"${tipAttr(TIPS.withPrices)}>${s?.n_with_prices ?? 0}/${s?.n_companies ?? 0} with prices</span>
      ${detail.tech.mit_source_url ? `<a href="${esc(detail.tech.mit_source_url)}" target="_blank" rel="noreferrer"${tipAttr(TIPS.mitSource)}>MIT source</a>` : ""}
    </div>
    <p class="chart-note"><span class="tip-label"${tipAttr(TIPS.indexBase)}>Indexed to 100 at the list date.</span> The score is always versus the S&amp;P 500. Toggle extra lines for context — sector ETF, Nasdaq, gold, and oil. Series come from charts.csv (weekly snapshot).</p>
    <div class="compare-toggles">${chips}</div>
    <div class="chart" id="chart-host">${drawChart(detail.points, keys, chartHostWidth(null))}</div>
  `;
}

function namesTable(detail) {
  if (!detail) return `<p class="empty">Pick a technology to see the mapping audit trail.</p>`;
  const spec = state.sort.names;
  const sorted = [...detail.companies].sort((a, b) => {
    const { key, dir } = spec;
    if (key === "ticker") return cmpStr(a.ticker, b.ticker, dir);
    if (key === "name") return cmpStr(a.name, b.name, dir);
    if (key === "map") return cmpMap(a.confidence, b.confidence, dir);
    if (key === "return") return cmpNum(a.total_return, b.total_return, dir);
    if (key === "excess") return cmpNum(a.excess_return, b.excess_return, dir);
    if (key === "why") return cmpStr(a.role_note, b.role_note, dir);
    return cmpStr(a.ticker, b.ticker, dir);
  });
  const body = sorted
    .map(
      (c) => `<tr>
        <td class="mono">${esc(c.ticker)}</td>
        <td>
          <div class="name">${esc(c.name)}</div>
          ${c.delisted_date ? `<div class="hint">Delisted ${esc(c.delisted_date)}${c.delisted_reason ? ` · ${esc(c.delisted_reason)}` : ""}</div>` : ""}
        </td>
        <td><span class="pill ${esc(c.confidence)}"${tipAttr(confidenceTip(c.confidence))}>${esc(c.confidence)}</span></td>
        <td class="r ${signed(c.total_return)}">${fmtPct(c.total_return)}</td>
        <td class="r ${signed(c.excess_return)}">${fmtPp(c.excess_return)}</td>
        <td class="note">${esc(c.role_note)}</td>
      </tr>`,
    )
    .join("");
  return `<div class="table-wrap"><table>
    <thead><tr>
      ${col("Ticker", TIPS.colTicker, "", "names", "ticker", "asc")}
      ${col("Company", TIPS.colCompany, "", "names", "name", "asc")}
      ${col("Map", TIPS.colMap, "", "names", "map")}
      ${col("Return", TIPS.colReturn, "r", "names", "return")}
      ${col("vs SPY", TIPS.colVsSpy, "r", "names", "excess")}
      ${col("Why it is here", TIPS.colWhy, "", "names", "why", "asc")}
    </tr></thead>
    <tbody>${body || `<tr><td colspan="6" class="empty">No mapped names in this universe.</td></tr>`}</tbody>
  </table></div>`;
}

function rankTable() {
  const spec = state.sort.ranking;
  const sorted = [...ranking()].sort((a, b) => {
    const { key, dir } = spec;
    if (key === "rank") return cmpNum(a.rank, b.rank, dir);
    if (key === "name") return cmpStr(`${a.tech.year} ${a.tech.name}`, `${b.tech.year} ${b.tech.name}`, dir);
    if (key === "category") return cmpStr(catLabel(a.tech.category), catLabel(b.tech.category), dir);
    if (key === "score") return cmpNum(a.score.prediction_score, b.score.prediction_score, dir);
    if (key === "excess") return cmpNum(a.score.mean_excess_return, b.score.mean_excess_return, dir);
    if (key === "hit") return cmpNum(a.score.hit_rate, b.score.hit_rate, dir);
    if (key === "sigma") return cmpNum(a.score.dispersion, b.score.dispersion, dir);
    if (key === "verdict") return cmpVerdict(a.score.verdict, b.score.verdict, dir);
    return cmpNum(a.score.prediction_score, b.score.prediction_score, dir);
  });
  const rows = sorted
    .map(
      (r) => `<tr class="${r.tech.id === state.selectedId ? "selected" : ""}" data-select="${r.tech.id}">
        <td class="mono muted">${r.rank}</td>
        <td><div class="name"${tipAttr(r.tech.description)}>${r.tech.year} ${esc(r.tech.name)}</div></td>
        <td class="muted"><span${tipAttr(categoryTip(r.tech.category))}>${esc(catLabel(r.tech.category))}</span></td>
        <td class="r mono gold">${fmtScore(r.score.prediction_score)}</td>
        <td class="r ${signed(r.score.mean_excess_return)}">${fmtPp(r.score.mean_excess_return)}</td>
        <td class="r mono">${fmtPct(r.score.hit_rate, 0)}</td>
        <td class="r mono">${fmtPct(r.score.dispersion)}</td>
        <td><span class="pill ${esc(r.score.verdict)}"${tipAttr(verdictTip(r.score.verdict))}>${esc(verdictLabel(r.score.verdict))}</span></td>
      </tr>`,
    )
    .join("");
  return `<div class="table-wrap"><table>
    <thead><tr>
      ${col("#", TIPS.colRank, "", "ranking", "rank", "asc")}
      ${col("Technology", TIPS.colTechnology, "", "ranking", "name", "asc")}
      ${col("Cat.", TIPS.colCategory, "", "ranking", "category", "asc")}
      ${col("Score", TIPS.colScore, "r", "ranking", "score")}
      ${col("Excess", TIPS.colExcess, "r", "ranking", "excess")}
      ${col("Hit", TIPS.colHit, "r", "ranking", "hit")}
      ${col("σ", TIPS.colSigma, "r", "ranking", "sigma")}
      ${col("Verdict", TIPS.colVerdict, "", "ranking", "verdict")}
    </tr></thead>
    <tbody>${rows}</tbody>
  </table></div>`;
}

function watchGrid() {
  const note = state.db.meta.watch_note || "";
  const cards = watchItems()
    .map((item) => {
      const tickers = item.companies
        .map((c) => `<span class="mono">${esc(c.ticker)}</span>`)
        .join("");
      const analogs = item.analogs
        .slice(0, 2)
        .map((a) => `<div class="hint">${a.year} ${esc(a.name)}</div>`)
        .join("");
      return `<button type="button" class="watch-card ${item.id === state.selectedId ? "selected" : ""}" data-select="${item.id}">
        <div class="watch-top">
          <span class="muted"${tipAttr(categoryTip(item.category))}>${esc(catLabel(item.category))}</span>
          <span class="pill ${esc(item.verification_status)}"${tipAttr(verifyTip(item.verification_status))}>${esc(item.verification_status)}</span>
        </div>
        <h3>${esc(item.name)}</h3>
        <p>${esc(item.description)}</p>
        <div class="tickers">${tickers}</div>
        <div class="watch-analog"><span class="tip-label"${tipAttr(TIPS.analogExcess)}>Analog excess</span> <span class="${signed(item.historical_analog_excess)}">${fmtPp(item.historical_analog_excess)}</span></div>
        ${analogs}
      </button>`;
    })
    .join("");
  return `<p class="note-block">${esc(note)}</p><div class="watch-grid">${cards}</div>`;
}

function methodBody() {
  return `<ol class="method">
    <li>MIT names a <em>technology</em>, not a ticker. Mappings are editorial, stored with confidence (<code>direct</code> vs <code>exposed</code>), author, and timestamp.</li>
    <li>Each mapped company is held from the list date (or IPO if later) to the latest price, or to delisting.</li>
    <li>Excess return is company total return minus SPY over the <em>same dates</em>. Gold, oil, Nasdaq, and the sector ETF are extra chart lines; they do not change the prediction score.</li>
    <li>Dispersion (σ) and hit rate punish one-name miracles. Prediction score is 50 when in line with SPY.</li>
    <li>This GitHub copy is a snapshot. Edit the CSV files in <code>data/</code>; they are the database. It does not fetch live prices.</li>
  </ol>`;
}

function guideBody() {
  return `<div class="guide">
    <h3>The idea</h3>
    <p>Every year MIT Technology Review names <em>10 Breakthrough Technologies</em>. Each name is a technology — CRISPR, tiny AI, hyperscale data centers — not a stock ticker. MITEN asks a historical question: after that call, did the public companies we linked to that technology beat the S&amp;P 500?</p>
    <p>The unit of analysis is a <em>technology versus the market</em>, not “which stock to buy.” Mappings from a technology to tickers are editorial, dated, and shown on the page so they can be argued with.</p>
    <h3>The name</h3>
    <p>MITEN comes from <em>MIT Ten</em> — the annual ten. The two T’s collapsed into one T. The mark is meant to read history, focus on the present list, and only then think about the future. The 2026 list is a watchlist, not a scorecard.</p>
    <h3>How to use this page</h3>
    <ol class="method">
      <li>Choose a <em>Year</em> — that is one MIT edition (2001–2026; 2002 was unpublished).</li>
      <li>Choose an <em>MIT breakthrough</em> — one named technology from that year’s ten.</li>
      <li>Read the gold <em>cohort</em> line against <em>SPY</em> on the chart. Extra indexes (sector ETF, Nasdaq, gold, oil) are context only.</li>
      <li>Open <em>Mapped companies</em> to see which tickers we used and why.</li>
      <li>Use <em>Prediction ranking</em> to compare technologies across years. Click any column title to sort.</li>
    </ol>
    <h3>Keywords</h3>
    <dl>
      <dt>Cohort</dt>
      <dd>The group of public companies mapped to one MIT technology, treated as one basket. Each name has equal weight (NVIDIA does not get a bigger vote than a smaller peer). The gold chart line is this basket, rebased to 100 on the list date. A cohort is not “the MIT stock” — MIT does not list a stock.</dd>
      <dt>Mapped / mapping</dt>
      <dd>A stored link from a named technology to a listed company. Example: “Tiny AI” (2020) is mapped to NVIDIA, Apple, and AMD. The link includes a written reason, a confidence label, an author, and a date. If there is no mapping, MIT still named the technology; we just have no US-listed cohort to score.</dd>
      <dt>Mapped only</dt>
      <dd>A filter at the top of the page. When it is checked, the ledger hides technologies that have no company map. Turn it off to see the full MIT list for that year, including names that are “list only.”</dd>
      <dt>All mappings</dt>
      <dd>Score using every mapped company for that technology: both <em>direct</em> and <em>exposed</em>. This is the broader read. A conglomerate with a relevant division still counts.</dd>
      <dt>Direct only / direct mapping</dt>
      <dd>Score using only companies whose core business <em>is</em> that technology. Exposed names are dropped. Use this when you do not want a loose link to pull the average around.</dd>
      <dt>Exposed</dt>
      <dd>Partial or indirect exposure. The company is in the neighborhood of the technology, not the thing itself. Included under All mappings; excluded under Direct only.</dd>
      <dt>List only</dt>
      <dd>MIT named it. We have no mapped public company with prices in the current universe, so there is no score and no cohort line.</dd>
      <dt>SPY</dt>
      <dd>The SPDR S&amp;P 500 ETF — a stand-in for the US large-cap market. Every prediction score is versus SPY on the <em>same dates</em> as the company. If both the cohort and the market went up, beating SPY still means the cohort went up more.</dd>
      <dt>Equal-weight</dt>
      <dd>In the cohort, a $10 billion company and a $2 trillion company each count as one name. That is deliberate: the question is about the mapped set, not about market-cap indexes.</dd>
      <dt>List date</dt>
      <dd>The day we treat as MIT’s call for that year. Returns start there, or at IPO if the company listed later.</dd>
      <dt>Universe</dt>
      <dd>All mappings or Direct only — which set of companies is allowed into the score. It is not a stock-market “universe” in the professional sense; it is this toggle.</dd>
    </dl>
    <h3>Measures</h3>
    <dl>
      <dt>Return</dt>
      <dd>Total price change from the list date (or IPO) to the latest price, or to delisting. Not annualized. +80% means the holding grew 80% over that whole window.</dd>
      <dt>Cohort (column)</dt>
      <dd>Average of those company returns, equal-weight. One number for the basket.</dd>
      <dt>Excess vs SPY</dt>
      <dd>Company return minus SPY return over the same dates, then averaged across the cohort. The unit is percentage points (pp), not “percent.” +20pp means twenty points more than SPY, not a 20% gain.</dd>
      <dt>Hit</dt>
      <dd>Share of mapped companies that beat SPY. High excess with a low hit rate usually means one winner carried the average.</dd>
      <dt>σ (dispersion)</dt>
      <dd>How much the companies’ returns disagreed. High σ means the average is a less trustworthy summary, so the prediction score is pulled toward 50.</dd>
      <dt>Prediction score</dt>
      <dd>Centered at 50: in line with SPY. Higher means the mapped names beat SPY after shrinking for small samples and disagreement. Lower means they lagged. Always versus SPY, never versus Nasdaq, gold, or oil.</dd>
      <dt>Verdict</dt>
      <dd>A plain-language label from the excess and hit rules: Beat market (excess above +5pp and hit rate at least 50%), Lagged (excess below −5pp), Mixed (in between), Thin sample (fewer than two names with prices), Too early (the list is too recent).</dd>
      <dt>Indexed to 100</dt>
      <dd>Every chart line starts at 100 on the list date (or IPO). 150 means +50% from that start. This lets you compare growth, not dollar prices.</dd>
      <dt>pp</dt>
      <dd>Percentage points. The gap between two percentages. 12% minus 7% is 5pp, not 5%.</dd>
      <dt>Names (column)</dt>
      <dd>How many mapped companies have a usable price history for this score.</dd>
      <dt>Short window</dt>
      <dd>Fewer than three years of overlapping prices. The score exists but is less trustworthy.</dd>
      <dt>Analog excess</dt>
      <dd>On the 2026 watchlist: average excess of hand-picked older technologies that resemble this year’s name. History, not a forecast, and not a buy list.</dd>
    </dl>
    <h3>Indexes on the chart</h3>
    <dl>
      <dt>MIT cohort (gold)</dt>
      <dd>The mapped basket. Always shown. This is the series the question is about.</dd>
      <dt>S&amp;P 500 (SPY)</dt>
      <dd>The benchmark the score uses. Toggle it only to hide the line; the score still uses it.</dd>
      <dt>Sector ETF</dt>
      <dd>A sector fund matched to our editorial category (for example XLK for AI). Context only. It does not change the score.</dd>
      <dt>Nasdaq-100 (QQQ)</dt>
      <dd>Growth/tech-heavy index. Context only.</dd>
      <dt>Gold (GLD) and oil (USO)</dt>
      <dd>Macro proxies. Context only. Useful when a MIT theme is energy or a real asset.</dd>
    </dl>
    <h3>Pills and labels</h3>
    <dl>
      <dt>verified / secondary / partial / gap / none</dt>
      <dd>How completely that year’s ten titles were checked against MIT’s published list. none means MIT did not publish a list that year (2002).</dd>
      <dt>Cat. (category)</dt>
      <dd>Our editorial bucket — AI, biotech, energy, and so on. It chooses the sector ETF. It is not MIT’s taxonomy.</dd>
    </dl>
    <h3>What this is not</h3>
    <p>Not investment advice. Not a claim that MIT “picks stocks.” Not a live trading system. The mappings were written with hindsight (dated seed-v1 / 2026-09-01); that bias is visible on purpose. Prices are US-listed Yahoo Finance history. Many MIT names have no public cohort here (private firms, China listings, unverified years).</p>
  </div>`;
}

function onAppClick(e) {
  const sortHead = e.target.closest("[data-sort]");
  if (sortHead) {
    e.stopPropagation();
    const table = sortHead.getAttribute("data-sort-table");
    const key = sortHead.getAttribute("data-sort");
    const fallback = sortHead.getAttribute("data-sort-default") || "desc";
    const cur = state.sort[table] || { key: "", dir: "desc" };
    state.sort[table] =
      cur.key === key
        ? { key, dir: cur.dir === "asc" ? "desc" : "asc" }
        : { key, dir: fallback };
    render();
    return;
  }
  const toggle = e.target.closest("[data-toggle-panel]");
  if (toggle) {
    const id = toggle.getAttribute("data-toggle-panel");
    setPanel(id, !panelOpen(id, true));
    render();
    return;
  }
  const uni = e.target.closest("[data-universe]");
  if (uni) {
    state.universe = uni.getAttribute("data-universe");
    render();
    return;
  }
  const series = e.target.closest("[data-series]");
  if (series) {
    const key = series.getAttribute("data-series");
    if (key !== "cohort") state.compareOn[key] = !state.compareOn[key];
    render();
    return;
  }
  if (e.target.closest("#break-trigger")) {
    e.stopPropagation();
    state.menuOpen = !state.menuOpen;
    render();
    return;
  }
  const select = e.target.closest("[data-select]");
  if (select) {
    e.stopPropagation();
    state.selectedId = Number(select.getAttribute("data-select"));
    state.menuOpen = false;
    const tech = state.db.techById[state.selectedId];
    if (tech) state.year = String(tech.year);
    render();
  }
}

function onAppChange(e) {
  if (e.target.id === "year") {
    state.year = e.target.value;
    state.selectedId = null;
    state.menuOpen = false;
    render();
    return;
  }
  if (e.target.id === "mapped-only") {
    state.mappedOnly = e.target.checked;
    render();
  }
}

function onDocClick(e) {
  if (!state.menuOpen) return;
  if (e.target.closest("#break-select")) return;
  state.menuOpen = false;
  render();
}

const tipEl = () => document.getElementById("tip");

document.addEventListener("mouseover", (e) => {
  const node = e.target.closest("[data-tip]");
  const tip = tipEl();
  if (!node || !tip) {
    if (tip) tip.hidden = true;
    return;
  }
  tip.textContent = node.getAttribute("data-tip");
  tip.hidden = false;
  const rect = node.getBoundingClientRect();
  const width = Math.min(380, window.innerWidth - 16);
  tip.style.width = `${width}px`;
  let left = rect.left;
  if (left + width > window.innerWidth - 8) left = window.innerWidth - width - 8;
  const height = tip.offsetHeight || 120;
  let top = rect.bottom + 8;
  if (top + height > window.innerHeight - 8 && rect.top > height + 16) {
    top = rect.top - height - 8;
  }
  tip.style.left = `${Math.max(8, left)}px`;
  tip.style.top = `${Math.max(8, top)}px`;
});
document.addEventListener("mouseout", (e) => {
  if (e.target.closest("[data-tip]") && !e.relatedTarget?.closest("[data-tip]")) {
    const tip = tipEl();
    if (tip) tip.hidden = true;
  }
});

loadDb()
  .then((db) => {
    state.db = db;
    const app = document.getElementById("app");
    app.addEventListener("click", onAppClick);
    app.addEventListener("change", onAppChange);
    document.addEventListener("mousedown", onDocClick);
    render();
  })
  .catch((err) => {
    document.getElementById("app").innerHTML = `<div class="banner error">${esc(err.message)}. Serve this folder over HTTP (GitHub Pages or <code>python3 -m http.server</code>). Opening the file directly will not load CSV.</div>`;
  });
