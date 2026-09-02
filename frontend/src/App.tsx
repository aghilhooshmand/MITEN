import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { Guide } from "./Guide";
import { Picture } from "./Picture";
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
import {
  TIPS,
  categoryTip,
  confidenceTip,
  indexTip,
  verdictTip,
  verifyTip,
} from "./copy";
import { cmpMap, cmpNum, cmpStr, cmpVerdict, nextSort, sortMark, type SortSpec } from "./sort";
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

type Tab = "watch" | "ledger" | "picture" | "knowledge";

function readTab(): Tab {
  const raw = window.location.hash.replace("#", "");
  if (raw === "dashboard") return "ledger";
  if (raw === "watch" || raw === "ledger" || raw === "picture" || raw === "knowledge") return raw;
  return "watch";
}

const NAV: { id: Tab; label: string; hint: string }[] = [
  { id: "watch", label: "Watchlist", hint: "2026 live book" },
  { id: "ledger", label: "Dashboard", hint: "One year, scores, chart" },
  { id: "picture", label: "Big picture", hint: "Time × subject × market" },
  { id: "knowledge", label: "Knowledge", hint: "Keywords and measures" },
];

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
  const [ledgerSort, setLedgerSort] = useState<SortSpec>({ key: "list_index", dir: "asc" });
  const [rankSort, setRankSort] = useState<SortSpec>({ key: "score", dir: "desc" });
  const [namesSort, setNamesSort] = useState<SortSpec>({ key: "ticker", dir: "asc" });
  const [tab, setTab] = useState<Tab>(() => readTab());

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

  useEffect(() => {
    const onHash = () => setTab(readTab());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  function goTab(next: Tab) {
    setTab(next);
    if (window.location.hash !== `#${next}`) {
      window.location.hash = next;
    }
  }

  function openOnDashboard(id: number, yearNum: number) {
    setYear(String(yearNum));
    setSelectedId(id);
    goTab("ledger");
  }

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

  const sortedTechs = useMemo(() => {
    const rows = [...techs];
    const { key, dir } = ledgerSort;
    rows.sort((a, b) => {
      const sa = a.score;
      const sb = b.score;
      if (key === "year") return cmpNum(a.year, b.year, dir);
      if (key === "name") return cmpStr(a.name, b.name, dir);
      if (key === "category") return cmpStr(categoryLabel(a.category), categoryLabel(b.category), dir);
      if (key === "names") return cmpNum(sa?.n_with_prices, sb?.n_with_prices, dir);
      if (key === "cohort") return cmpNum(sa?.cohort_mean_return, sb?.cohort_mean_return, dir);
      if (key === "excess") return cmpNum(sa?.mean_excess_return, sb?.mean_excess_return, dir);
      if (key === "hit") return cmpNum(sa?.hit_rate, sb?.hit_rate, dir);
      if (key === "score") return cmpNum(sa?.prediction_score, sb?.prediction_score, dir);
      if (key === "verdict") return cmpVerdict(sa?.verdict, sb?.verdict, dir);
      return cmpNum(a.list_index ?? a.id, b.list_index ?? b.id, dir);
    });
    return rows;
  }, [techs, ledgerSort]);

  const sortedRanking = useMemo(() => {
    const rows = [...ranking];
    const { key, dir } = rankSort;
    rows.sort((a, b) => {
      if (key === "rank") return cmpNum(a.rank, b.rank, dir);
      if (key === "name") return cmpStr(`${a.year} ${a.name}`, `${b.year} ${b.name}`, dir);
      if (key === "category") return cmpStr(categoryLabel(a.category), categoryLabel(b.category), dir);
      if (key === "score") return cmpNum(a.prediction_score, b.prediction_score, dir);
      if (key === "excess") return cmpNum(a.mean_excess_return, b.mean_excess_return, dir);
      if (key === "hit") return cmpNum(a.hit_rate, b.hit_rate, dir);
      if (key === "sigma") return cmpNum(a.dispersion, b.dispersion, dir);
      if (key === "verdict") return cmpVerdict(a.verdict, b.verdict, dir);
      return cmpNum(a.prediction_score, b.prediction_score, dir);
    });
    return rows;
  }, [ranking, rankSort]);

  const sortedCompanies = useMemo(() => {
    const rows = [...(detail?.companies ?? [])];
    const { key, dir } = namesSort;
    rows.sort((a, b) => {
      if (key === "ticker") return cmpStr(a.ticker, b.ticker, dir);
      if (key === "name") return cmpStr(a.name, b.name, dir);
      if (key === "map") return cmpMap(a.confidence, b.confidence, dir);
      if (key === "return") return cmpNum(a.total_return, b.total_return, dir);
      if (key === "excess") return cmpNum(a.excess_return, b.excess_return, dir);
      if (key === "why") return cmpStr(a.role_note, b.role_note, dir);
      return cmpStr(a.ticker, b.ticker, dir);
    });
    return rows;
  }, [detail, namesSort]);

  return (
    <div className="app">
      <header className="top">
        <div>
          <p className="eyebrow">MIT TR10 × public markets</p>
          <div className="brand">
            <img src="/miten-logo.png" alt="MITEN" width={48} height={48} />
            <h1>MITEN</h1>
          </div>
        </div>
        <p className="lede">
          MIT Technology Review’s annual 10 Breakthrough Technologies, then whether
          mapped public companies beat SPY after the call.{" "}
          <button type="button" className="guide-jump" onClick={() => goTab("knowledge")}>
            How to read MITEN
          </button>
        </p>
      </header>

      <nav className="nav" aria-label="MITEN sections">
        {NAV.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`nav-btn ${tab === item.id ? "on" : ""}`}
            onClick={() => goTab(item.id)}
          >
            <span className="nav-k">{item.label}</span>
            <span className="nav-h">{item.hint}</span>
          </button>
        ))}
      </nav>

      {tab !== "knowledge" ? (
        <div className="filters">
          {tab === "ledger" ? (
            <>
              <label>
                <ExplainTip text={TIPS.year}>
                  <span className="tip-label">Year</span>
                </ExplainTip>
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
                <ExplainTip text={TIPS.breakthrough}>
                  <span className="tip-label">MIT breakthrough</span>
                </ExplainTip>
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
                <ExplainTip text={TIPS.mappedOnly}>
                  <span className="tip-label">Mapped only</span>
                </ExplainTip>
              </label>
            </>
          ) : null}
          <div className="segment">
            <ExplainTip text={TIPS.universeAll}>
              <button
                className={universe === "all" ? "on" : ""}
                type="button"
                onClick={() => setUniverse("all")}
              >
                All mappings
              </button>
            </ExplainTip>
            <ExplainTip text={TIPS.universeDirect}>
              <button
                className={universe === "direct" ? "on" : ""}
                type="button"
                onClick={() => setUniverse("direct")}
              >
                Direct only
              </button>
            </ExplainTip>
          </div>
        </div>
      ) : null}

      {error ? <div className="banner error">{error}</div> : null}
      {overview && tab !== "knowledge" ? <div className="banner">{overview.disclaimer}</div> : null}

      {tab === "ledger" ? (
        <>
      <Panel
        id="mit-list"
        title="MIT 10 Breakthrough Technologies"
        titleTip={TIPS.panelMit}
        subtitle={
          archiveEdition
            ? `${archiveEdition.year} · ${archiveEdition.technologies.length} named`
            : "Year-by-year TR10 lists"
        }
      >
        {archiveEdition ? (
          <>
            <div className="edition-meta">
              <ExplainTip text={verifyTip(archiveEdition.verification_status)}>
                <span className={`pill ${archiveEdition.verification_status}`}>
                  {archiveEdition.verification_status}
                </span>
              </ExplainTip>
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
                    <button
                      type="button"
                      className={`mit-item ${item.id === selectedId ? "selected" : ""}`}
                      onClick={() => setSelectedId(item.id)}
                    >
                      <span className="mit-num mono">
                        {String(item.list_index).padStart(2, "0")}
                      </span>
                      <span className="mit-body">
                        <ExplainTip text={item.description}>
                          <span className="name">{item.name}</span>
                        </ExplainTip>
                      </span>
                      <span className="mit-side">
                        <ExplainTip text={categoryTip(item.category)}>
                          <span className="muted">{categoryLabel(item.category)}</span>
                        </ExplainTip>
                        {item.mapped ? (
                          <ExplainTip text={verdictTip(item.score?.verdict)}>
                            <span className={`pill ${item.score?.verdict || "mixed"}`}>
                              {verdictLabel(item.score?.verdict)}
                            </span>
                          </ExplainTip>
                        ) : (
                          <ExplainTip text={TIPS.listOnly}>
                            <span className="pill none">List only</span>
                          </ExplainTip>
                        )}
                      </span>
                    </button>
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
        titleTip={TIPS.panelPulse}
        subtitle={loading ? "Loading" : overview ? `as of ${overview.as_of}` : ""}
      >
        <div className="kpis">
          <Kpi
            label="Technologies"
            value={fmtNum(overview?.n_technologies)}
            hint="in the archive"
            explain={TIPS.kpiTechnologies}
          />
          <Kpi
            label="Mapped"
            value={fmtNum(overview?.n_mapped_technologies)}
            hint="have a cohort"
            explain={TIPS.kpiMapped}
          />
          <Kpi
            label="Beat SPY"
            value={
              overview?.beat_rate == null
                ? "—"
                : `${overview.beat_count}/${overview.n_scored}`
            }
            hint={fmtPct(overview?.beat_rate, 0) + " of scored"}
            tone={overview && overview.beat_count > (overview.lag_count || 0) ? "up" : "down"}
            explain={TIPS.kpiBeatSpy}
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
            explain={TIPS.kpiMedianExcess}
          />
          <Kpi
            label="Listed names"
            value={fmtNum(overview?.n_companies)}
            hint="in MySQL"
            explain={TIPS.kpiListed}
          />
        </div>
      </Panel>

      <Panel
        id="ledger"
        title="Technology ledger"
        titleTip={TIPS.panelLedger}
        subtitle={`${sortedTechs.length} rows · click a name · click a column to sort`}
      >
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <ColHead
                  label="Year"
                  explain={TIPS.colYear}
                  sortKey="year"
                  sort={ledgerSort}
                  onSort={(key) => setLedgerSort((s) => nextSort(s, key, "desc"))}
                />
                <ColHead
                  label="Technology"
                  explain={TIPS.colTechnology}
                  sortKey="name"
                  sort={ledgerSort}
                  onSort={(key) => setLedgerSort((s) => nextSort(s, key, "asc"))}
                />
                <ColHead
                  label="Cat."
                  explain={TIPS.colCategory}
                  sortKey="category"
                  sort={ledgerSort}
                  onSort={(key) => setLedgerSort((s) => nextSort(s, key, "asc"))}
                />
                <ColHead
                  label="Names"
                  align="r"
                  explain={TIPS.colNames}
                  sortKey="names"
                  sort={ledgerSort}
                  onSort={(key) => setLedgerSort((s) => nextSort(s, key))}
                />
                <ColHead
                  label="Cohort"
                  align="r"
                  explain={TIPS.colCohort}
                  sortKey="cohort"
                  sort={ledgerSort}
                  onSort={(key) => setLedgerSort((s) => nextSort(s, key))}
                />
                <ColHead
                  label="Excess vs SPY"
                  align="r"
                  explain={TIPS.colExcess}
                  sortKey="excess"
                  sort={ledgerSort}
                  onSort={(key) => setLedgerSort((s) => nextSort(s, key))}
                />
                <ColHead
                  label="Hit"
                  align="r"
                  explain={TIPS.colHit}
                  sortKey="hit"
                  sort={ledgerSort}
                  onSort={(key) => setLedgerSort((s) => nextSort(s, key))}
                />
                <ColHead
                  label="Score"
                  align="r"
                  explain={TIPS.colScore}
                  sortKey="score"
                  sort={ledgerSort}
                  onSort={(key) => setLedgerSort((s) => nextSort(s, key))}
                />
                <ColHead
                  label="Verdict"
                  explain={TIPS.colVerdict}
                  sortKey="verdict"
                  sort={ledgerSort}
                  onSort={(key) => setLedgerSort((s) => nextSort(s, key))}
                />
              </tr>
            </thead>
            <tbody>
              {sortedTechs.map((t) => {
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
                      {s?.window_short ? (
                        <ExplainTip text={TIPS.shortWindow}>
                          <div className="hint">short window</div>
                        </ExplainTip>
                      ) : null}
                    </td>
                    <td className="muted">
                      <ExplainTip text={categoryTip(t.category)}>
                        <span>{categoryLabel(t.category)}</span>
                      </ExplainTip>
                    </td>
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
                      <ExplainTip text={verdictTip(s?.verdict)}>
                        <span className={`pill ${s?.verdict || "none"}`}>
                          {verdictLabel(s?.verdict)}
                        </span>
                      </ExplainTip>
                    </td>
                  </tr>
                );
              })}
              {sortedTechs.length === 0 ? (
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
        titleTip={TIPS.panelChart}
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
                <ExplainTip text={TIPS.predScore}>
                  <span className="k tip-label">Prediction score</span>
                </ExplainTip>
                <span className="v">{fmtScore(selectedScore?.prediction_score)}</span>
                <ExplainTip text={verdictTip(selectedScore?.verdict)}>
                  <span className={`pill ${selectedScore?.verdict || "none"}`}>
                    {verdictLabel(selectedScore?.verdict)}
                  </span>
                </ExplainTip>
              </div>
            </div>
            <div className="chart-meta">
              <ExplainTip text={TIPS.chartExcess}>
                <span className="tip-label">
                  Excess {fmtPp(selectedScore?.mean_excess_return)} vs SPY over{" "}
                  {fmtNum(selectedScore?.window_years, 1)}y
                </span>
              </ExplainTip>
              <ExplainTip text={TIPS.dispersion}>
                <span className="tip-label">Dispersion {fmtPct(selectedScore?.dispersion)}</span>
              </ExplainTip>
              <ExplainTip text={TIPS.withPrices}>
                <span className="tip-label">
                  {selectedScore?.n_with_prices}/{selectedScore?.n_companies} with prices
                </span>
              </ExplainTip>
              {detail.mit_source_url ? (
                <ExplainTip text={TIPS.mitSource}>
                  <a href={detail.mit_source_url} target="_blank" rel="noreferrer">
                    MIT source
                  </a>
                </ExplainTip>
              ) : null}
            </div>
            <p className="chart-note">
              <ExplainTip text={TIPS.indexBase}>
                <span className="tip-label">Indexed to 100 at the list date.</span>
              </ExplainTip>{" "}
              The score is always versus the S&P 500. Toggle extra lines for context
              — sector ETF, Nasdaq, gold, and oil.
            </p>
            <div className="compare-toggles">
              {(detail.chart.series ?? defaultChartSeries(detail.chart.sector_ticker)).map(
                (s) => {
                  const on = s.key === "cohort" ? true : compareOn[s.key] !== false;
                  return (
                    <ExplainTip key={s.key} text={indexTip(s.key, detail.chart.sector_ticker)}>
                      <button
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
                    </ExplainTip>
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
        titleTip={TIPS.panelNames}
        subtitle={
          detail
            ? `${detail.companies.length} names · mappings dated ${detail.companies[0]?.added_at?.slice(0, 10) ?? "—"} · click a column to sort`
            : ""
        }
      >
        {detail ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <ColHead
                    label="Ticker"
                    explain={TIPS.colTicker}
                    sortKey="ticker"
                    sort={namesSort}
                    onSort={(key) => setNamesSort((s) => nextSort(s, key, "asc"))}
                  />
                  <ColHead
                    label="Company"
                    explain={TIPS.colCompany}
                    sortKey="name"
                    sort={namesSort}
                    onSort={(key) => setNamesSort((s) => nextSort(s, key, "asc"))}
                  />
                  <ColHead
                    label="Map"
                    explain={TIPS.colMap}
                    sortKey="map"
                    sort={namesSort}
                    onSort={(key) => setNamesSort((s) => nextSort(s, key))}
                  />
                  <ColHead
                    label="Return"
                    align="r"
                    explain={TIPS.colReturn}
                    sortKey="return"
                    sort={namesSort}
                    onSort={(key) => setNamesSort((s) => nextSort(s, key))}
                  />
                  <ColHead
                    label="vs SPY"
                    align="r"
                    explain={TIPS.colVsSpy}
                    sortKey="excess"
                    sort={namesSort}
                    onSort={(key) => setNamesSort((s) => nextSort(s, key))}
                  />
                  <ColHead
                    label="Why it is here"
                    explain={TIPS.colWhy}
                    sortKey="why"
                    sort={namesSort}
                    onSort={(key) => setNamesSort((s) => nextSort(s, key, "asc"))}
                  />
                </tr>
              </thead>
              <tbody>
                {sortedCompanies.map((c) => (
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
                      <ExplainTip text={confidenceTip(c.confidence)}>
                        <span className={`pill ${c.confidence}`}>{c.confidence}</span>
                      </ExplainTip>
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
        titleTip={TIPS.panelRank}
        subtitle="Click a column to sort · 50 means the mapped names matched SPY"
        defaultOpen={false}
      >
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <ColHead
                  label="#"
                  explain={TIPS.colRank}
                  sortKey="rank"
                  sort={rankSort}
                  onSort={(key) => setRankSort((s) => nextSort(s, key, "asc"))}
                />
                <ColHead
                  label="Technology"
                  explain={TIPS.colTechnology}
                  sortKey="name"
                  sort={rankSort}
                  onSort={(key) => setRankSort((s) => nextSort(s, key, "asc"))}
                />
                <ColHead
                  label="Cat."
                  explain={TIPS.colCategory}
                  sortKey="category"
                  sort={rankSort}
                  onSort={(key) => setRankSort((s) => nextSort(s, key, "asc"))}
                />
                <ColHead
                  label="Score"
                  align="r"
                  explain={TIPS.colScore}
                  sortKey="score"
                  sort={rankSort}
                  onSort={(key) => setRankSort((s) => nextSort(s, key))}
                />
                <ColHead
                  label="Excess"
                  align="r"
                  explain={TIPS.colExcess}
                  sortKey="excess"
                  sort={rankSort}
                  onSort={(key) => setRankSort((s) => nextSort(s, key))}
                />
                <ColHead
                  label="Hit"
                  align="r"
                  explain={TIPS.colHit}
                  sortKey="hit"
                  sort={rankSort}
                  onSort={(key) => setRankSort((s) => nextSort(s, key))}
                />
                <ColHead
                  label="σ"
                  align="r"
                  explain={TIPS.colSigma}
                  sortKey="sigma"
                  sort={rankSort}
                  onSort={(key) => setRankSort((s) => nextSort(s, key))}
                />
                <ColHead
                  label="Verdict"
                  explain={TIPS.colVerdict}
                  sortKey="verdict"
                  sort={rankSort}
                  onSort={(key) => setRankSort((s) => nextSort(s, key))}
                />
              </tr>
            </thead>
            <tbody>
              {sortedRanking.map((r) => (
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
                  <td className="muted">
                    <ExplainTip text={categoryTip(r.category)}>
                      <span>{categoryLabel(r.category)}</span>
                    </ExplainTip>
                  </td>
                  <td className="r mono gold">{fmtScore(r.prediction_score)}</td>
                  <td className={`r ${signedClass(r.mean_excess_return)}`}>
                    {fmtPp(r.mean_excess_return)}
                  </td>
                  <td className="r mono">{fmtPct(r.hit_rate, 0)}</td>
                  <td className="r mono">{fmtPct(r.dispersion)}</td>
                  <td>
                    <ExplainTip text={verdictTip(r.verdict)}>
                      <span className={`pill ${r.verdict}`}>{verdictLabel(r.verdict)}</span>
                    </ExplainTip>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
        </>
      ) : null}

      {tab === "watch" ? (
        <div>
          <div className="page-head">
            <h2>2026 watchlist</h2>
            <p>
              Live book for this year’s MIT names. Analog excess is history, not a forecast.
              Click a card to open it on the Dashboard.
            </p>
          </div>
          {watch ? (
            <>
              <p className="note-block">{watch.note}</p>
              <div className="watch-grid">
                {watch.items.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className={`watch-card ${item.id === selectedId ? "selected" : ""}`}
                    onClick={() => openOnDashboard(item.id, 2026)}
                  >
                    <div className="watch-top">
                      <ExplainTip text={categoryTip(item.category)}>
                        <span className="muted">{categoryLabel(item.category)}</span>
                      </ExplainTip>
                      <ExplainTip text={verifyTip(item.verification_status)}>
                        <span className={`pill ${item.verification_status}`}>
                          {item.verification_status}
                        </span>
                      </ExplainTip>
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
                      <ExplainTip text={TIPS.analogExcess}>
                        <span className="tip-label">Analog excess</span>
                      </ExplainTip>{" "}
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
        </div>
      ) : null}

      {tab === "picture" ? (
        <Picture archive={archive} selectedId={selectedId} onOpen={openOnDashboard} />
      ) : null}

      {tab === "knowledge" ? (
        <div>
          <div className="page-head">
            <h2>Knowledge</h2>
            <p>The idea, the keywords, the measures, and how the score is computed.</p>
          </div>
          <Guide />
          <Panel id="method" title="How the score is computed" defaultOpen>
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
      ) : null}

      <footer className="contact">
        <span>Aghil Hooshmand</span>
        <a href="https://www.linkedin.com/in/aghilhooshmand" target="_blank" rel="noreferrer">
          LinkedIn
        </a>
        <a href="mailto:aghil.hooshmand@gmail.com">aghil.hooshmand@gmail.com</a>
      </footer>
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
  sortKey,
  sort,
  onSort,
}: {
  label: string;
  explain: string;
  align?: "r";
  sortKey: string;
  sort: SortSpec;
  onSort: (key: string) => void;
}) {
  return (
    <th className={align === "r" ? "r" : undefined}>
      <ExplainTip text={`${explain} Click to sort.`}>
        <button
          type="button"
          className={`col-head sortable ${sort.key === sortKey ? "on" : ""}`}
          onClick={(event) => {
            event.stopPropagation();
            onSort(sortKey);
          }}
        >
          {label}
          {sortMark(sort, sortKey)}
        </button>
      </ExplainTip>
    </th>
  );
}

function Kpi({
  label,
  value,
  hint,
  tone,
  explain,
}: {
  label: string;
  value: string;
  hint: string;
  tone?: string;
  explain: string;
}) {
  return (
    <ExplainTip text={explain} className="kpi-wrap">
      <div className="kpi">
        <span className="k tip-label">{label}</span>
        <span className={`v ${tone || ""}`}>{value}</span>
        <span className="h">{hint}</span>
      </div>
    </ExplainTip>
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
