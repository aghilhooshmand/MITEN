import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { ExplainTip } from "./ExplainTip";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  fetchArchive,
  fetchOverview,
  fetchScores,
  fetchTechnologies,
  fetchTechnology,
  fetchWatchlist,
} from "./api";
import { Panel } from "./Panel";
import {
  categoryLabel,
  fmtNum,
  fmtPct,
  fmtPp,
  fmtScore,
  signedClass,
  verdictLabel,
} from "./format";
import type {
  Archive,
  ArchiveItem,
  ChartSeries,
  Overview,
  RankedScore,
  TechDetail,
  TechListItem,
  Universe,
  Watchlist,
} from "./types";

export default function App() {
  const [universe, setUniverse] = useState<Universe>("all");
  const [year, setYear] = useState("2026");
  const [mappedOnly, setMappedOnly] = useState(true);
  const [overview, setOverview] = useState<Overview | null>(null);
  const [techs, setTechs] = useState<TechListItem[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [detail, setDetail] = useState<TechDetail | null>(null);
  const [ranking, setRanking] = useState<RankedScore[]>([]);
  const [watch, setWatch] = useState<Watchlist | null>(null);
  const [archive, setArchive] = useState<Archive | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [compareOn, setCompareOn] = useState<Record<string, boolean>>({
    cohort: true,
    spy: true,
    sector: true,
    nasdaq: false,
    gold: false,
    oil: false,
  });

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetchOverview(universe),
      fetchTechnologies({
        universe,
        year,
        mappedOnly,
      }),
      fetchScores(universe),
      fetchWatchlist(universe),
      fetchArchive(universe),
    ])
      .then(([ov, list, scores, wl, arch]) => {
        setOverview(ov);
        setTechs(list);
        setRanking(scores);
        setWatch(wl);
        setArchive(arch);
        setError(null);
        const edition = arch.years.find((y) => String(y.year) === year);
        const picks = edition?.technologies ?? [];
        setSelectedId((current) => {
          if (current && picks.some((t) => t.id === current)) return current;
          if (current && list.some((t) => t.id === current)) return current;
          return picks[0]?.id ?? list[0]?.id ?? null;
        });
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [universe, year, mappedOnly]);

  useEffect(() => {
    if (!selectedId) {
      setDetail(null);
      return;
    }
    fetchTechnology(selectedId, universe)
      .then(setDetail)
      .catch((err: Error) => setError(err.message));
  }, [selectedId, universe]);

  const years = useMemo(() => {
    const fromMeta = overview?.years.map((y) => y.year) ?? [];
    return Array.from(new Set(fromMeta)).sort((a, b) => b - a);
  }, [overview]);

  const archiveEdition =
    archive?.years.find((y) => String(y.year) === year) ??
    archive?.years.find((y) => y.technologies.length > 0) ??
    null;
  const mitPicks = archiveEdition?.technologies ?? [];
  const selectedScore = detail?.score;

  return (
    <div className="app">
      <header className="top">
        <div>
          <p className="eyebrow">MIT TR10 × public markets</p>
          <h1>Breakthrough Ledger</h1>
        </div>
        <p className="lede">
          MIT Technology Review’s annual 10 Breakthrough Technologies, then whether
          mapped public companies beat SPY after the call.
        </p>
      </header>

      <div className="filters">
        <label>
          Year
          <select value={year} onChange={(e) => setYear(e.target.value)}>
            {years.length === 0 ? <option value={year}>{year}</option> : null}
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </label>
        <label className="grow">
          MIT breakthrough
          <BreakthroughSelect
            key={year}
            items={mitPicks}
            selectedId={selectedId}
            emptyLabel={year === "2002" ? "No list published" : "No verified list this year"}
            onChange={setSelectedId}
          />
        </label>
        <label className="check">
          <input
            type="checkbox"
            checked={mappedOnly}
            onChange={(e) => setMappedOnly(e.target.checked)}
          />
          Mapped only
        </label>
        <div className="segment">
          <button
            className={universe === "all" ? "on" : ""}
            type="button"
            onClick={() => setUniverse("all")}
          >
            All mappings
          </button>
          <button
            className={universe === "direct" ? "on" : ""}
            type="button"
            onClick={() => setUniverse("direct")}
          >
            Direct only
          </button>
        </div>
      </div>

      {error ? <div className="banner error">{error}</div> : null}
      {overview ? <div className="banner">{overview.disclaimer}</div> : null}

      <Panel
        id="mit-list"
        title="MIT 10 Breakthrough Technologies"
        subtitle={
          archiveEdition
            ? `${archiveEdition.year} · ${archiveEdition.technologies.length} named`
            : "Year-by-year TR10 lists"
        }
      >
        {archiveEdition ? (
          <>
            <div className="edition-meta">
              <span className={`pill ${archiveEdition.verification_status}`}>
                {archiveEdition.verification_status}
              </span>
              <p>{archiveEdition.note}</p>
              {archiveEdition.source_url ? (
                <a href={archiveEdition.source_url} target="_blank" rel="noreferrer">
                  MIT archive
                </a>
              ) : null}
            </div>
                {archiveEdition.technologies.length === 0 ? (
                  <p className="empty">
                    {archiveEdition.verification_status === "none"
                      ? "MIT Technology Review did not publish a list this year."
                      : "MIT published a list this year, but the ten names were not independently verified in our source compilation — so they are not shown here."}
                  </p>
                ) : (
              <ol className="mit-list">
                {archiveEdition.technologies.map((item) => (
                  <li key={item.id}>
                    <ExplainTip text={item.description} className="tip-fill">
                      <button
                        type="button"
                        className={`mit-item ${item.id === selectedId ? "selected" : ""}`}
                        onClick={() => setSelectedId(item.id)}
                      >
                        <span className="mit-num mono">
                          {String(item.list_index).padStart(2, "0")}
                        </span>
                        <span className="mit-body">
                          <span className="name">{item.name}</span>
                        </span>
                      <span className="mit-side">
                        <span className="muted">{categoryLabel(item.category)}</span>
                        {item.mapped ? (
                          <span className={`pill ${item.score?.verdict || "mixed"}`}>
                            {verdictLabel(item.score?.verdict)}
                          </span>
                        ) : (
                          <span className="pill none">List only</span>
                        )}
                      </span>
                    </button>
                    </ExplainTip>
                  </li>
                ))}
              </ol>
            )}
          </>
        ) : (
          <p className="empty">Pick a year to see MIT’s list.</p>
        )}
      </Panel>

      <Panel
        id="pulse"
        title="Market pulse"
        subtitle={loading ? "Loading" : overview ? `as of ${overview.as_of}` : ""}
      >
        <div className="kpis">
          <Kpi label="Technologies" value={fmtNum(overview?.n_technologies)} hint="in the archive" />
          <Kpi label="Mapped" value={fmtNum(overview?.n_mapped_technologies)} hint="have a cohort" />
          <Kpi
            label="Beat SPY"
            value={
              overview?.beat_rate == null
                ? "—"
                : `${overview.beat_count}/${overview.n_scored}`
            }
            hint={fmtPct(overview?.beat_rate, 0) + " of scored"}
            tone={overview && overview.beat_count > (overview.lag_count || 0) ? "up" : "down"}
          />
          <Kpi
            label="Median excess"
            value={fmtPp(overview?.median_excess_return)}
            hint="vs SPY, scored categories"
            tone={
              (overview?.median_excess_return || 0) > 0
                ? "up"
                : (overview?.median_excess_return || 0) < 0
                  ? "down"
                  : ""
            }
          />
          <Kpi label="Listed names" value={fmtNum(overview?.n_companies)} hint="in MySQL" />
        </div>
      </Panel>

      <Panel
        id="ledger"
        title="Technology ledger"
        subtitle={`${techs.length} rows · click a name`}
      >
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Year</th>
                <ColHead
                  label="Technology"
                  explain="MIT’s TR10 name — a technology, not a ticker. Hover the name for the description."
                />
                <ColHead
                  label="Cat."
                  explain="Our editorial bucket. It chooses the sector ETF on the chart, not a GICS code from MIT."
                />
                <ColHead
                  label="Names"
                  align="r"
                  explain="How many mapped companies have a usable price history for this score."
                />
                <ColHead
                  label="Cohort"
                  align="r"
                  explain="Equal-weight average total return of the mapped companies from the list date (or IPO) to the last price or delisting."
                />
                <ColHead
                  label="Excess vs SPY"
                  align="r"
                  explain="Average of (company return − SPY) over the same dates, in percentage points. This is what the prediction score is based on."
                />
                <ColHead
                  label="Hit"
                  align="r"
                  explain="Share of mapped companies that beat SPY. A high excess with a low hit rate usually means one name carried the average."
                />
                <ColHead
                  label="Score"
                  align="r"
                  explain="50 = in line with SPY. Higher beat the market after shrinking for small samples and disagreement among names. Lower lagged."
                />
                <ColHead
                  label="Verdict"
                  explain="Beat market: excess above +5pp and hit rate at least 50%. Lagged: excess below −5pp. Mixed: in between. Thin sample or too early if there is not enough history."
                />
              </tr>
            </thead>
            <tbody>
              {techs.map((t) => {
                const s = t.score;
                return (
                  <tr
                    key={t.id}
                    className={t.id === selectedId ? "selected" : ""}
                    onClick={() => setSelectedId(t.id)}
                  >
                    <td className="mono">{t.year}</td>
                    <td>
                      <ExplainTip text={t.description}>
                        <div className="name">{t.name}</div>
                      </ExplainTip>
                      {s?.window_short ? <div className="hint">short window</div> : null}
                    </td>
                    <td className="muted">{categoryLabel(t.category)}</td>
                    <td className="r mono">{s?.n_with_prices ?? 0}</td>
                    <td className={`r ${signedClass(s?.cohort_mean_return)}`}>
                      {fmtPct(s?.cohort_mean_return)}
                    </td>
                    <td className={`r ${signedClass(s?.mean_excess_return)}`}>
                      {fmtPp(s?.mean_excess_return)}
                    </td>
                    <td className="r mono">{fmtPct(s?.hit_rate, 0)}</td>
                    <td className="r mono gold">{fmtScore(s?.prediction_score)}</td>
                    <td>
                      <span className={`pill ${s?.verdict || "none"}`}>
                        {verdictLabel(s?.verdict)}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {techs.length === 0 ? (
                <tr>
                  <td colSpan={9} className="empty">
                    No rows for these filters.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </Panel>

      <Panel
        id="chart"
        title="Cohort vs market"
        subtitle={
          detail
            ? `${detail.year} ${detail.name} · equal-weight vs ${detail.chart.benchmark_ticker}`
            : "Select a technology"
        }
        defaultOpen
      >
        {detail ? (
          <>
            <div className="detail-head">
              <div>
                <h2>
                  <ExplainTip text={detail.description}>
                    {detail.year} {detail.name}
                  </ExplainTip>
                </h2>
                <p>{detail.description}</p>
              </div>
              <div className="score-box">
                <span className="k">Prediction score</span>
                <span className="v">{fmtScore(selectedScore?.prediction_score)}</span>
                <span className={`pill ${selectedScore?.verdict || "none"}`}>
                  {verdictLabel(selectedScore?.verdict)}
                </span>
              </div>
            </div>
            <div className="chart-meta">
              <span>
                Excess {fmtPp(selectedScore?.mean_excess_return)} vs SPY over{" "}
                {fmtNum(selectedScore?.window_years, 1)}y
              </span>
              <span>Dispersion {fmtPct(selectedScore?.dispersion)}</span>
              <span>
                {selectedScore?.n_with_prices}/{selectedScore?.n_companies} with prices
              </span>
              {detail.mit_source_url ? (
                <a href={detail.mit_source_url} target="_blank" rel="noreferrer">
                  MIT source
                </a>
              ) : null}
            </div>
            <p className="chart-note">
              The score is always versus the S&P 500. Toggle extra lines for context
              — sector ETF, Nasdaq, gold, and oil.
            </p>
            <div className="compare-toggles">
              {(detail.chart.series ?? defaultChartSeries(detail.chart.sector_ticker)).map(
                (s) => {
                  const on = s.key === "cohort" ? true : compareOn[s.key] !== false;
                  return (
                    <button
                      key={s.key}
                      type="button"
                      className={`compare-chip ${on ? "on" : ""}`}
                      style={{ "--chip": LINE_COLORS[s.key] || "#8b93a7" } as CSSProperties}
                      disabled={s.key === "cohort"}
                      onClick={() =>
                        setCompareOn((prev) => ({ ...prev, [s.key]: !on }))
                      }
                    >
                      {s.label}
                      {s.ticker ? ` (${s.ticker})` : ""}
                    </button>
                  );
                },
              )}
            </div>
            <div className="chart">
              {detail.chart.points.length > 1 ? (
                <ResponsiveContainer width="100%" height={320}>
                  <LineChart data={detail.chart.points} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                    <CartesianGrid stroke="#1c2430" vertical={false} />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(v) => String(v).slice(0, 4)}
                      stroke="#8b93a7"
                      tick={{ fontSize: 11, fontFamily: "IBM Plex Mono" }}
                      minTickGap={40}
                    />
                    <YAxis
                      stroke="#8b93a7"
                      tick={{ fontSize: 11, fontFamily: "IBM Plex Mono" }}
                      domain={["auto", "auto"]}
                    />
                    <Tooltip
                      contentStyle={{
                        background: "#10141c",
                        border: "1px solid #1c2430",
                        fontFamily: "IBM Plex Mono",
                        fontSize: 12,
                      }}
                      formatter={(value: number | string, name: string) => [
                        value == null || value === "" ? "—" : Number(value).toFixed(1),
                        name,
                      ]}
                    />
                    <Legend />
                    {(detail.chart.series ?? defaultChartSeries(detail.chart.sector_ticker))
                      .filter((s) => (s.key === "cohort" ? true : compareOn[s.key] !== false))
                      .map((s) => (
                        <Line
                          key={s.key}
                          type="monotone"
                          dataKey={s.key}
                          name={seriesLegend(s)}
                          stroke={LINE_COLORS[s.key] || "#8b93a7"}
                          dot={false}
                          strokeWidth={s.key === "cohort" ? 2 : 1.5}
                          connectNulls
                        />
                      ))}
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <p className="empty">No overlapping price history for this cohort.</p>
              )}
            </div>
          </>
        ) : (
          <p className="empty">Pick a row in the ledger.</p>
        )}
      </Panel>

      <Panel
        id="names"
        title="Mapped companies"
        subtitle={
          detail
            ? `${detail.companies.length} names · mappings dated ${detail.companies[0]?.added_at?.slice(0, 10) ?? "—"}`
            : ""
        }
      >
        {detail ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Ticker</th>
                  <th>Company</th>
                  <th>Map</th>
                  <th className="r">Return</th>
                  <th className="r">vs SPY</th>
                  <th>Why it is here</th>
                </tr>
              </thead>
              <tbody>
                {detail.companies.map((c) => (
                  <tr key={c.ticker}>
                    <td className="mono">{c.ticker}</td>
                    <td>
                      <div className="name">{c.name}</div>
                      {c.delisted_date ? (
                        <div className="hint">
                          Delisted {c.delisted_date}
                          {c.delisted_reason ? ` · ${c.delisted_reason}` : ""}
                        </div>
                      ) : null}
                    </td>
                    <td>
                      <span className={`pill ${c.confidence}`}>{c.confidence}</span>
                    </td>
                    <td className={`r ${signedClass(c.total_return)}`}>
                      {fmtPct(c.total_return)}
                    </td>
                    <td className={`r ${signedClass(c.excess_return)}`}>
                      {fmtPp(c.excess_return)}
                    </td>
                    <td className="note">{c.role_note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="empty">Pick a technology to see the mapping audit trail.</p>
        )}
      </Panel>

      <Panel
        id="ranking"
        title="Prediction ranking"
        subtitle="Sorted by score · 50 means the mapped names matched SPY · hover a column title"
        defaultOpen={false}
      >
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <ColHead label="#" explain="Rank by prediction score, highest first." />
                <ColHead
                  label="Technology"
                  explain="MIT’s TR10 name and year — a technology, not a ticker. Hover the name for the description."
                />
                <ColHead
                  label="Cat."
                  explain="Our editorial bucket (AI, biotech, energy, hardware, and so on). It chooses the sector ETF on the chart. It is not MIT’s taxonomy."
                />
                <ColHead
                  label="Score"
                  align="r"
                  explain="Prediction score. 50 = mapped companies matched SPY over the same dates. Higher beat SPY; lower lagged. Small samples, disagreement among names (σ), and a low hit rate all pull the score toward 50 so one winner cannot dominate."
                />
                <ColHead
                  label="Excess"
                  align="r"
                  explain="Average excess vs SPY, in percentage points. For each mapped company: its total return from the list date (or IPO) to the last price or delisting, minus SPY on those same dates. Then the mean. +20pp means twenty points more than SPY, not a 20% return."
                />
                <ColHead
                  label="Hit"
                  align="r"
                  explain="Share of mapped companies that beat SPY. 50% means half the names outperformed. A high score with a low hit rate usually means one name (often a later winner) carried the average."
                />
                <ColHead
                  label="σ"
                  align="r"
                  explain="Dispersion: standard deviation of the companies’ total returns. High σ means the names disagreed, so the average is less trustworthy and the score is pulled toward 50."
                />
                <ColHead
                  label="Verdict"
                  explain="Beat market: average excess above +5pp and at least half the names beat SPY. Lagged: average excess below −5pp. Mixed: in between. Thin sample: fewer than two names with prices. Too early: the list is too recent."
                />
              </tr>
            </thead>
            <tbody>
              {ranking.map((r) => (
                <tr
                  key={r.technology_id}
                  className={r.technology_id === selectedId ? "selected" : ""}
                  onClick={() => setSelectedId(r.technology_id)}
                >
                  <td className="mono muted">{r.rank}</td>
                  <td>
                    <ExplainTip text={r.description}>
                      <div className="name">
                        {r.year} {r.name}
                      </div>
                    </ExplainTip>
                  </td>
                  <td className="muted">{categoryLabel(r.category)}</td>
                  <td className="r mono gold">{fmtScore(r.prediction_score)}</td>
                  <td className={`r ${signedClass(r.mean_excess_return)}`}>
                    {fmtPp(r.mean_excess_return)}
                  </td>
                  <td className="r mono">{fmtPct(r.hit_rate, 0)}</td>
                  <td className="r mono">{fmtPct(r.dispersion)}</td>
                  <td>
                    <span className={`pill ${r.verdict}`}>{verdictLabel(r.verdict)}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <Panel id="watch" title="2026 watchlist" subtitle="Live book · analog history, not a forecast">
        {watch ? (
          <>
            <p className="note-block">{watch.note}</p>
            <div className="watch-grid">
              {watch.items.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={`watch-card ${item.id === selectedId ? "selected" : ""}`}
                  onClick={() => setSelectedId(item.id)}
                >
                  <div className="watch-top">
                    <span className="muted">{categoryLabel(item.category)}</span>
                    <span className={`pill ${item.verification_status}`}>
                      {item.verification_status}
                    </span>
                  </div>
                  <h3>{item.name}</h3>
                  <p>{item.description}</p>
                  <div className="tickers">
                    {item.companies.map((c) => (
                      <span key={c.ticker} className="mono">
                        {c.ticker}
                      </span>
                    ))}
                  </div>
                  <div className="watch-analog">
                    Analog excess{" "}
                    <span className={signedClass(item.historical_analog_excess)}>
                      {fmtPp(item.historical_analog_excess)}
                    </span>
                  </div>
                  {item.analogies.slice(0, 2).map((a) => (
                    <div key={a.id} className="hint">
                      {a.year} {a.name}
                    </div>
                  ))}
                </button>
              ))}
            </div>
          </>
        ) : (
          <p className="empty">No 2026 items seeded.</p>
        )}
      </Panel>

      <Panel id="method" title="How the score is computed" defaultOpen={false}>
        <ol className="method">
          <li>
            MIT names a <em>technology</em>, not a ticker. Mappings are editorial, stored with
            confidence (<code>direct</code> vs <code>exposed</code>), author, and timestamp so
            they cannot be silently rewritten after looking at the chart.
          </li>
          <li>
            Each mapped company is held from the list date (or IPO if later) to the latest
            price, or to delisting. Slack and Fitbit stay in at their acquisition exits.
          </li>
          <li>
            Excess return is company total return minus SPY over the <em>same dates</em>. The
            category number is the average of those excesses — not “NVIDIA went up.” Gold,
            oil, Nasdaq, and the sector ETF are extra chart lines for context; they do not
            change the prediction score.
          </li>
          <li>
            Dispersion (σ of company returns) and hit rate (% that beat SPY) punish one-name
            miracles. Prediction score is 50 when in line with SPY, then squeezed by sample
            size and dispersion.
          </li>
          <li>
            2026 is a watchlist. Analog rows are hand-picked resemblances, not a similarity
            model. This does not tell you which ticker to buy.
          </li>
        </ol>
      </Panel>
    </div>
  );
}

const LINE_COLORS: Record<string, string> = {
  cohort: "#d4a84b",
  spy: "#7f8ea3",
  sector: "#6ea0ff",
  nasdaq: "#a78bfa",
  gold: "#e6c35c",
  oil: "#ef8a5d",
};

function seriesLegend(s: ChartSeries): string {
  return s.ticker ? `${s.label} (${s.ticker})` : s.label;
}

function defaultChartSeries(sectorTicker: string | null): ChartSeries[] {
  const rows: ChartSeries[] = [
    { key: "cohort", label: "MIT cohort", ticker: null },
    { key: "spy", label: "S&P 500", ticker: "SPY" },
  ];
  if (sectorTicker && sectorTicker !== "SPY") {
    rows.push({ key: "sector", label: sectorTicker, ticker: sectorTicker });
  }
  rows.push(
    { key: "nasdaq", label: "Nasdaq-100", ticker: "QQQ" },
    { key: "gold", label: "Gold", ticker: "GLD" },
    { key: "oil", label: "Oil", ticker: "USO" },
  );
  return rows;
}

function ColHead({
  label,
  explain,
  align,
}: {
  label: string;
  explain: string;
  align?: "r";
}) {
  return (
    <th className={align === "r" ? "r" : undefined}>
      <ExplainTip text={explain}>
        <span className="col-head">{label}</span>
      </ExplainTip>
    </th>
  );
}

function Kpi({
  label,
  value,
  hint,
  tone,
}: {
  label: string;
  value: string;
  hint: string;
  tone?: string;
}) {
  return (
    <div className="kpi">
      <span className="k">{label}</span>
      <span className={`v ${tone || ""}`}>{value}</span>
      <span className="h">{hint}</span>
    </div>
  );
}

function BreakthroughSelect({
  items,
  selectedId,
  emptyLabel,
  onChange,
}: {
  items: ArchiveItem[];
  selectedId: number | null;
  emptyLabel: string;
  onChange: (id: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const selected = items.find((item) => item.id === selectedId);

  useEffect(() => {
    if (!open) return;
    const onDoc = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="break-select" ref={rootRef}>
      <button
        type="button"
        className="break-trigger"
        disabled={items.length === 0}
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        {selected
          ? `${String(selected.list_index).padStart(2, "0")} · ${selected.name}`
          : emptyLabel}
      </button>
      {open ? (
        <ul className="break-menu">
          {items.map((item) => (
            <li key={item.id}>
              <ExplainTip text={item.description} className="tip-fill" side="right">
                <button
                  type="button"
                  className={`break-option ${item.id === selectedId ? "on" : ""}`}
                  onClick={() => {
                    onChange(item.id);
                    setOpen(false);
                  }}
                >
                  <span className="mono muted">
                    {String(item.list_index).padStart(2, "0")}
                  </span>
                  {item.name}
                </button>
              </ExplainTip>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
