import { useMemo, useState } from "react";
import {
  CartesianGrid,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from "recharts";
import { ExplainTip } from "./ExplainTip";
import { TIPS } from "./copy";
import { categoryLabel, fmtCap, fmtPp, fmtPct, fmtScore } from "./format";
import type { CompanyMap, CompanyMapPoint } from "./types";

const SUBJECTS = ["ai", "biotech", "energy", "hardware", "consumer", "space", "industrial"];

const SUBJECT_COLOR: Record<string, string> = {
  ai: "#d4a84b",
  biotech: "#3dcf8a",
  energy: "#6ea0ff",
  hardware: "#c084fc",
  consumer: "#f0a36b",
  space: "#7dd3fc",
  industrial: "#94a3b8",
  other: "#8b93a7",
};

type AxisKey =
  | "excess_return"
  | "total_return"
  | "spy_return"
  | "prediction_score"
  | "cohort_excess"
  | "window_years"
  | "market_cap";

const AXES: { key: AxisKey; label: string; kind: "return" | "score" | "years" | "cap" }[] = [
  { key: "excess_return", label: "Company vs SPY", kind: "return" },
  { key: "total_return", label: "Company return", kind: "return" },
  { key: "spy_return", label: "SPY over same dates", kind: "return" },
  { key: "prediction_score", label: "MIT prediction score", kind: "score" },
  { key: "cohort_excess", label: "Category vs SPY", kind: "return" },
  { key: "window_years", label: "Years since MIT list", kind: "years" },
  { key: "market_cap", label: "Market cap", kind: "cap" },
];

type SizeFilter = "all" | "smaller" | "small" | "mega";

type Props = {
  data: CompanyMap | null;
  selectedId: number | null;
  onOpen: (id: number, year: number) => void;
};

type PlotPoint = CompanyMapPoint & { x: number; y: number; z: number };

function axisMeta(key: AxisKey) {
  return AXES.find((a) => a.key === key) ?? AXES[0];
}

function readValue(row: CompanyMapPoint, key: AxisKey): number | null {
  const raw = row[key];
  if (raw === null || raw === undefined || Number.isNaN(Number(raw))) return null;
  return Number(raw);
}

function formatAxis(key: AxisKey, value: number): string {
  const kind = axisMeta(key).kind;
  if (kind === "return") return fmtPp(value);
  if (kind === "score") return fmtScore(value);
  if (kind === "years") return `${value.toFixed(1)}y`;
  return fmtCap(value);
}

function tickFormat(key: AxisKey) {
  return (value: number) => {
    const kind = axisMeta(key).kind;
    if (kind === "return") return `${Math.round(value * 100)}%`;
    if (kind === "score") return String(Math.round(value));
    if (kind === "years") return `${value.toFixed(0)}y`;
    if (value >= 1_000_000_000_000) return `$${(value / 1_000_000_000_000).toFixed(0)}T`;
    if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(0)}B`;
    return fmtCap(value);
  };
}

function MapTooltip({
  active,
  payload,
  xKey,
  yKey,
}: {
  active?: boolean;
  payload?: { payload: PlotPoint }[];
  xKey: AxisKey;
  yKey: AxisKey;
}) {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload;
  return (
    <div className="map-tip">
      <div className="map-tip-kicker">
        {row.year} · {categoryLabel(row.category)} · {row.confidence}
      </div>
      <div className="map-tip-name">
        {row.ticker} · {row.name}
      </div>
      <div className="muted">{row.technology}</div>
      <dl>
        <div>
          <dt>{axisMeta(xKey).label}</dt>
          <dd>{formatAxis(xKey, row.x)}</dd>
        </div>
        <div>
          <dt>{axisMeta(yKey).label}</dt>
          <dd>{formatAxis(yKey, row.y)}</dd>
        </div>
        <div>
          <dt>Market cap</dt>
          <dd>{row.delisted ? "Delisted" : fmtCap(row.market_cap)}</dd>
        </div>
        <div>
          <dt>Return</dt>
          <dd>
            {fmtPct(row.total_return)} · {fmtPp(row.excess_return)} vs SPY
          </dd>
        </div>
      </dl>
      <p className="hint">Click to open this MIT name on the dashboard.</p>
    </div>
  );
}

export function CompanyMap({ data, selectedId, onOpen }: Props) {
  const [subject, setSubject] = useState("all");
  const [year, setYear] = useState("all");
  const [techId, setTechId] = useState("all");
  const [size, setSize] = useState<SizeFilter>("all");
  const [xKey, setXKey] = useState<AxisKey>("excess_return");
  const [yKey, setYKey] = useState<AxisKey>("prediction_score");

  const years = useMemo(() => {
    const set = new Set((data?.points ?? []).map((p) => p.year));
    return [...set].sort((a, b) => a - b);
  }, [data]);

  const techs = useMemo(() => {
    const map = new Map<number, { id: number; year: number; name: string; category: string }>();
    for (const row of data?.points ?? []) {
      if (subject !== "all" && row.category !== subject) continue;
      if (year !== "all" && String(row.year) !== year) continue;
      map.set(row.technology_id, {
        id: row.technology_id,
        year: row.year,
        name: row.technology,
        category: row.category,
      });
    }
    return [...map.values()].sort((a, b) => a.year - b.year || a.name.localeCompare(b.name));
  }, [data, subject, year]);

  const points = useMemo(() => {
    const out: PlotPoint[] = [];
    for (const row of data?.points ?? []) {
      if (subject !== "all" && row.category !== subject) continue;
      if (year !== "all" && String(row.year) !== year) continue;
      if (techId !== "all" && String(row.technology_id) !== techId) continue;
      if (size === "smaller" && row.size_band !== "mid" && row.size_band !== "small") continue;
      if (size === "small" && row.size_band !== "small") continue;
      if (size === "mega" && row.size_band !== "mega") continue;
      const x = readValue(row, xKey);
      const y = readValue(row, yKey);
      if (x === null || y === null) continue;
      const cap = row.market_cap && row.market_cap > 0 ? row.market_cap : 500_000_000;
      out.push({ ...row, x, y, z: Math.sqrt(cap) });
    }
    return out;
  }, [data, subject, year, techId, size, xKey, yKey]);

  const showQuadrants = xKey === "excess_return" && yKey === "prediction_score";
  const xRef = axisMeta(xKey).kind === "score" ? 50 : axisMeta(xKey).kind === "return" ? 0 : null;
  const yRef = axisMeta(yKey).kind === "score" ? 50 : axisMeta(yKey).kind === "return" ? 0 : null;

  return (
    <div className="company-map">
      <div className="map-filters">
        <label>
          <ExplainTip text={TIPS.mapSubject}>
            <span className="tip-label">Subject</span>
          </ExplainTip>
          <select
            value={subject}
            onChange={(e) => {
              setSubject(e.target.value);
              setTechId("all");
            }}
          >
            <option value="all">All</option>
            {SUBJECTS.map((key) => (
              <option key={key} value={key}>
                {categoryLabel(key)}
              </option>
            ))}
          </select>
        </label>
        <label>
          <ExplainTip text={TIPS.mapYear}>
            <span className="tip-label">Year</span>
          </ExplainTip>
          <select
            value={year}
            onChange={(e) => {
              setYear(e.target.value);
              setTechId("all");
            }}
          >
            <option value="all">All</option>
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </label>
        <label className="grow">
          <ExplainTip text={TIPS.mapTech}>
            <span className="tip-label">MIT tech</span>
          </ExplainTip>
          <select value={techId} onChange={(e) => setTechId(e.target.value)}>
            <option value="all">All</option>
            {techs.map((tech) => (
              <option key={tech.id} value={tech.id}>
                {tech.year} · {tech.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          <ExplainTip text={TIPS.mapSize}>
            <span className="tip-label">Size</span>
          </ExplainTip>
          <select value={size} onChange={(e) => setSize(e.target.value as SizeFilter)}>
            <option value="all">All caps</option>
            <option value="smaller">Under $20B</option>
            <option value="small">Under $2B</option>
            <option value="mega">$100B+</option>
          </select>
        </label>
        <label>
          <ExplainTip text={TIPS.mapX}>
            <span className="tip-label">X</span>
          </ExplainTip>
          <select value={xKey} onChange={(e) => setXKey(e.target.value as AxisKey)}>
            {AXES.map((axis) => (
              <option key={axis.key} value={axis.key}>
                {axis.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          <ExplainTip text={TIPS.mapY}>
            <span className="tip-label">Y</span>
          </ExplainTip>
          <select value={yKey} onChange={(e) => setYKey(e.target.value as AxisKey)}>
            {AXES.map((axis) => (
              <option key={axis.key} value={axis.key}>
                {axis.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <p className="chart-note">
        <ExplainTip text={TIPS.mapBubble}>
          <span className="tip-label">Default view:</span>
        </ExplainTip>{" "}
        right = this name beat SPY after MIT named the category; up = the MIT category itself beat
        SPY. Area is latest market cap. Click a bubble to open that technology.
      </p>

      {showQuadrants ? (
        <div className="map-quads" aria-hidden="true">
          <span>Category beat · this name lagged</span>
          <span>Aligned: both beat SPY</span>
          <span>Both lagged</span>
          <span>This name beat · category lagged</span>
        </div>
      ) : null}

      {points.length ? (
        <div className="map-plot">
          <ResponsiveContainer width="100%" height={440}>
            <ScatterChart margin={{ top: 12, right: 16, bottom: 28, left: 8 }}>
              <CartesianGrid stroke="var(--line)" strokeDasharray="3 3" />
              <XAxis
                type="number"
                dataKey="x"
                name={axisMeta(xKey).label}
                tickFormatter={tickFormat(xKey)}
                tick={{ fill: "#8b93a7", fontSize: 11 }}
                label={{
                  value: axisMeta(xKey).label,
                  position: "bottom",
                  offset: 8,
                  fill: "#8b93a7",
                  fontSize: 12,
                }}
                scale={xKey === "market_cap" ? "log" : "auto"}
                domain={xKey === "market_cap" ? ["auto", "auto"] : ["auto", "auto"]}
              />
              <YAxis
                type="number"
                dataKey="y"
                name={axisMeta(yKey).label}
                tickFormatter={tickFormat(yKey)}
                tick={{ fill: "#8b93a7", fontSize: 11 }}
                width={64}
                label={{
                  value: axisMeta(yKey).label,
                  angle: -90,
                  position: "insideLeft",
                  fill: "#8b93a7",
                  fontSize: 12,
                }}
                scale={yKey === "market_cap" ? "log" : "auto"}
              />
              <ZAxis type="number" dataKey="z" range={[28, 260]} />
              {xRef !== null ? (
                <ReferenceLine x={xRef} stroke="#8b93a7" strokeDasharray="4 4" />
              ) : null}
              {yRef !== null ? (
                <ReferenceLine y={yRef} stroke="#8b93a7" strokeDasharray="4 4" />
              ) : null}
              <Tooltip
                cursor={{ strokeDasharray: "3 3" }}
                content={<MapTooltip xKey={xKey} yKey={yKey} />}
              />
              <Scatter
                data={points}
                fill="#d4a84b"
                onClick={(item) => {
                  const row = (item as { payload?: PlotPoint } | PlotPoint | undefined);
                  const payload = row && "payload" in row && row.payload ? row.payload : (row as PlotPoint | undefined);
                  if (payload?.technology_id) onOpen(payload.technology_id, payload.year);
                }}
              >
                {points.map((row) => (
                  <Cell
                    key={`${row.technology_id}-${row.ticker}`}
                    fill={SUBJECT_COLOR[row.category] || SUBJECT_COLOR.other}
                    fillOpacity={row.technology_id === selectedId ? 0.95 : 0.55}
                    stroke={row.technology_id === selectedId ? "#e7ecf3" : "transparent"}
                    strokeWidth={row.technology_id === selectedId ? 1.5 : 0}
                  />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <p className="empty">No mapped companies with both measures after these filters.</p>
      )}

      <div className="map-legend">
        <div className="map-swatches">
          {SUBJECTS.map((key) => (
            <span key={key}>
              <i style={{ background: SUBJECT_COLOR[key] }} />
              {categoryLabel(key)}
            </span>
          ))}
        </div>
        <div className="map-size-key" title="Bubble area tracks market cap">
          <span className="muted">Cap</span>
          <i className="map-dot sm" />
          <span>$2B</span>
          <i className="map-dot md" />
          <span>$20B</span>
          <i className="map-dot lg" />
          <span>$100B+</span>
        </div>
        <span className="muted">
          {points.length} bubbles
          {data?.market_cap_as_of ? ` · caps as of ${data.market_cap_as_of}` : ""}
        </span>
      </div>
    </div>
  );
}
