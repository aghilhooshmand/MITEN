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

const state = {
  universe: "all",
  year: "2026",
  mappedOnly: true,
  selectedId: null,
  compareOn: { cohort: true, spy: true, sector: true, nasdaq: false, gold: false, oil: false },
  menuOpen: false,
  db: null,
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

function panel(id, title, subtitle, body, defaultOpen = true) {
  const open = panelOpen(id, defaultOpen);
  return `<section class="panel ${open ? "open" : "closed"}" data-panel="${id}">
    <button class="panel-head" type="button" data-toggle-panel="${id}">
      <span class="panel-chevron">${open ? "▾" : "▸"}</span>
      <span class="panel-title">${esc(title)}</span>
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
      </p>
    </header>
    <div class="filters">
      <label>Year
        <select id="year">${yearOpts}</select>
      </label>
      <label class="grow">MIT breakthrough
        <div class="break-select" id="break-select">
          <button type="button" class="break-trigger" id="break-trigger" ${picks.length ? "" : "disabled"}>
            ${esc(trigger)}
          </button>
          ${state.menuOpen && picks.length ? `<ul class="break-menu">${menu}</ul>` : ""}
        </div>
      </label>
      <label class="check">
        <input type="checkbox" id="mapped-only" ${state.mappedOnly ? "checked" : ""} />
        Mapped only
      </label>
      <div class="segment">
        <button type="button" class="${state.universe === "all" ? "on" : ""}" data-universe="all">All mappings</button>
        <button type="button" class="${state.universe === "direct" ? "on" : ""}" data-universe="direct">Direct only</button>
      </div>
    </div>
    <div class="banner">${esc(ov.disclaimer)}</div>
    ${panel("mit-list", "MIT 10 Breakthrough Technologies", edition ? `${edition.year} · ${picks.length} named` : "Year-by-year TR10 lists", mitBody)}
    ${panel("pulse", "Market pulse", `as of ${ov.as_of}`, kpis(ov))}
    ${panel("ledger", "Technology ledger", `${rows.length} rows · click a name`, ledgerTable(rows))}
    ${panel("chart", "Cohort vs market", detail ? `${detail.tech.year} ${detail.tech.name} · equal-weight vs SPY` : "Select a technology", chartPanel(detail), true)}
    ${panel("names", "Mapped companies", detail ? `${detail.companies.length} names` : "", namesTable(detail))}
    ${panel("ranking", "Prediction ranking", "Sorted by score · 50 means the mapped names matched SPY", rankTable(), false)}
    ${panel("watch", "2026 watchlist", "Live book · analog history, not a forecast", watchGrid())}
    ${panel("method", "How the score is computed", "", methodBody(), false)}
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
    <span class="pill ${esc(edition.verification_status)}">${esc(edition.verification_status)}</span>
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
        <button type="button" class="mit-item ${item.id === state.selectedId ? "selected" : ""}" data-select="${item.id}"${tipAttr(item.description)}>
          <span class="mit-num mono">${String(item.list_index).padStart(2, "0")}</span>
          <span class="mit-body"><span class="name">${esc(item.name)}</span></span>
          <span class="mit-side">
            <span class="muted">${esc(catLabel(item.category))}</span>
            ${
              mapped
                ? `<span class="pill ${esc(s?.verdict || "mixed")}">${esc(verdictLabel(s?.verdict))}</span>`
                : `<span class="pill none">List only</span>`
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
    <div class="kpi"><span class="k">Technologies</span><span class="v">${fmtNum(ov.n_technologies)}</span><span class="h">in the archive</span></div>
    <div class="kpi"><span class="k">Mapped</span><span class="v">${fmtNum(ov.n_mapped_technologies)}</span><span class="h">have a cohort</span></div>
    <div class="kpi"><span class="k">Beat SPY</span><span class="v ${beatTone}">${beatVal}</span><span class="h">${fmtPct(ov.beat_rate, 0)} of scored</span></div>
    <div class="kpi"><span class="k">Median excess</span><span class="v ${exTone}">${fmtPp(ov.median_excess_return)}</span><span class="h">vs SPY, scored categories</span></div>
    <div class="kpi"><span class="k">Listed names</span><span class="v">${fmtNum(ov.n_companies)}</span><span class="h">in CSV snapshot</span></div>
  </div>`;
}

function col(label, explain, align) {
  return `<th class="${align === "r" ? "r" : ""}"><span class="col-head"${tipAttr(explain)}>${esc(label)}</span></th>`;
}

function ledgerTable(rows) {
  const body = rows
    .map((t) => {
      const s = scoreOf(t.id, state.universe);
      return `<tr class="${t.id === state.selectedId ? "selected" : ""}" data-select="${t.id}">
        <td class="mono">${t.year}</td>
        <td><div class="name"${tipAttr(t.description)}>${esc(t.name)}</div>${s?.window_short ? `<div class="hint">short window</div>` : ""}</td>
        <td class="muted">${esc(catLabel(t.category))}</td>
        <td class="r mono">${s?.n_with_prices ?? 0}</td>
        <td class="r ${signed(s?.cohort_mean_return)}">${fmtPct(s?.cohort_mean_return)}</td>
        <td class="r ${signed(s?.mean_excess_return)}">${fmtPp(s?.mean_excess_return)}</td>
        <td class="r mono">${fmtPct(s?.hit_rate, 0)}</td>
        <td class="r mono gold">${fmtScore(s?.prediction_score)}</td>
        <td><span class="pill ${esc(s?.verdict || "none")}">${esc(verdictLabel(s?.verdict))}</span></td>
      </tr>`;
    })
    .join("");
  return `<div class="table-wrap"><table>
    <thead><tr>
      <th>Year</th>
      ${col("Technology", "MIT’s TR10 name — a technology, not a ticker.")}
      ${col("Cat.", "Editorial bucket used to pick a sector ETF on the chart.")}
      ${col("Names", "Mapped companies with a usable price history.", "r")}
      ${col("Cohort", "Equal-weight average total return of mapped companies.", "r")}
      ${col("Excess vs SPY", "Average of (company return − SPY) on the same dates.", "r")}
      ${col("Hit", "Share of mapped companies that beat SPY.", "r")}
      ${col("Score", "50 = in line with SPY.", "r")}
      ${col("Verdict", "Beat market: excess above +5pp and hit rate at least 50%.")}
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
      return `<button type="button" class="compare-chip ${on ? "on" : ""}" data-series="${c.key}" ${c.key === "cohort" ? "disabled" : ""} style="--chip:${LINE[c.key]}">
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
        <span class="k">Prediction score</span>
        <span class="v">${fmtScore(s?.prediction_score)}</span>
        <span class="pill ${esc(s?.verdict || "none")}">${esc(verdictLabel(s?.verdict))}</span>
      </div>
    </div>
    <div class="chart-meta">
      <span>Excess ${fmtPp(s?.mean_excess_return)} vs SPY over ${fmtNum(s?.window_years, 1)}y</span>
      <span>Dispersion ${fmtPct(s?.dispersion)}</span>
      <span>${s?.n_with_prices ?? 0}/${s?.n_companies ?? 0} with prices</span>
      ${detail.tech.mit_source_url ? `<a href="${esc(detail.tech.mit_source_url)}" target="_blank" rel="noreferrer">MIT source</a>` : ""}
    </div>
    <p class="chart-note">The score is always versus the S&amp;P 500. Toggle extra lines for context — sector ETF, Nasdaq, gold, and oil. Series come from charts.csv (weekly snapshot).</p>
    <div class="compare-toggles">${chips}</div>
    <div class="chart" id="chart-host">${drawChart(detail.points, keys, chartHostWidth(null))}</div>
  `;
}

function namesTable(detail) {
  if (!detail) return `<p class="empty">Pick a technology to see the mapping audit trail.</p>`;
  const body = detail.companies
    .map(
      (c) => `<tr>
        <td class="mono">${esc(c.ticker)}</td>
        <td>
          <div class="name">${esc(c.name)}</div>
          ${c.delisted_date ? `<div class="hint">Delisted ${esc(c.delisted_date)}${c.delisted_reason ? ` · ${esc(c.delisted_reason)}` : ""}</div>` : ""}
        </td>
        <td><span class="pill ${esc(c.confidence)}">${esc(c.confidence)}</span></td>
        <td class="r ${signed(c.total_return)}">${fmtPct(c.total_return)}</td>
        <td class="r ${signed(c.excess_return)}">${fmtPp(c.excess_return)}</td>
        <td class="note">${esc(c.role_note)}</td>
      </tr>`,
    )
    .join("");
  return `<div class="table-wrap"><table>
    <thead><tr><th>Ticker</th><th>Company</th><th>Map</th><th class="r">Return</th><th class="r">vs SPY</th><th>Why it is here</th></tr></thead>
    <tbody>${body || `<tr><td colspan="6" class="empty">No mapped names in this universe.</td></tr>`}</tbody>
  </table></div>`;
}

function rankTable() {
  const rows = ranking()
    .map(
      (r) => `<tr class="${r.tech.id === state.selectedId ? "selected" : ""}" data-select="${r.tech.id}">
        <td class="mono muted">${r.rank}</td>
        <td><div class="name"${tipAttr(r.tech.description)}>${r.tech.year} ${esc(r.tech.name)}</div></td>
        <td class="muted">${esc(catLabel(r.tech.category))}</td>
        <td class="r mono gold">${fmtScore(r.score.prediction_score)}</td>
        <td class="r ${signed(r.score.mean_excess_return)}">${fmtPp(r.score.mean_excess_return)}</td>
        <td class="r mono">${fmtPct(r.score.hit_rate, 0)}</td>
        <td class="r mono">${fmtPct(r.score.dispersion)}</td>
        <td><span class="pill ${esc(r.score.verdict)}">${esc(verdictLabel(r.score.verdict))}</span></td>
      </tr>`,
    )
    .join("");
  return `<div class="table-wrap"><table>
    <thead><tr>
      ${col("#", "Rank by prediction score, highest first.")}
      ${col("Technology", "MIT’s TR10 name and year.")}
      ${col("Cat.", "Editorial bucket.")}
      ${col("Score", "50 = mapped companies matched SPY.", "r")}
      ${col("Excess", "Average excess vs SPY in percentage points.", "r")}
      ${col("Hit", "Share of mapped companies that beat SPY.", "r")}
      ${col("σ", "Standard deviation of company total returns.", "r")}
      ${col("Verdict", "Beat / lagged / mixed from excess and hit rate.")}
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
          <span class="muted">${esc(catLabel(item.category))}</span>
          <span class="pill ${esc(item.verification_status)}">${esc(item.verification_status)}</span>
        </div>
        <h3>${esc(item.name)}</h3>
        <p>${esc(item.description)}</p>
        <div class="tickers">${tickers}</div>
        <div class="watch-analog">Analog excess <span class="${signed(item.historical_analog_excess)}">${fmtPp(item.historical_analog_excess)}</span></div>
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

function onAppClick(e) {
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
  let left = rect.left;
  if (left + width > window.innerWidth - 8) left = window.innerWidth - width - 8;
  let top = rect.bottom + 8;
  if (top + 120 > window.innerHeight) top = Math.max(8, rect.top - 128);
  tip.style.left = `${Math.max(8, left)}px`;
  tip.style.top = `${top}px`;
  tip.style.width = `${width}px`;
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
