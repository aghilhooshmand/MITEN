import { useMemo } from "react";
import { ExplainTip } from "./ExplainTip";
import { categoryLabel, fmtScore, verdictLabel } from "./format";
import { categoryTip } from "./copy";
import type { Archive, ArchiveItem } from "./types";

const SUBJECTS = ["ai", "biotech", "energy", "hardware", "consumer", "space", "industrial"];

type Props = {
  archive: Archive | null;
  selectedId: number | null;
  onOpen: (id: number, year: number) => void;
};

type Thread = {
  ticker: string;
  years: number[];
  techs: { id: number; year: number; name: string }[];
};

function markClass(item: ArchiveItem): string {
  if (!item.mapped || !item.score) return "none";
  return item.score.verdict || "none";
}

function markTip(item: ArchiveItem): string {
  const tickers = item.tickers?.length ? ` · ${item.tickers.join(", ")}` : "";
  if (!item.mapped || !item.score) {
    return `${item.name}${tickers || " · list only, no mapped public companies"}`;
  }
  return `${item.name} · ${verdictLabel(item.score.verdict)} · score ${fmtScore(item.score.prediction_score)}${tickers}`;
}

export function Picture({ archive, selectedId, onOpen }: Props) {
  const years = useMemo(
    () => [...(archive?.years ?? [])].map((y) => y.year).sort((a, b) => a - b),
    [archive],
  );

  const byCell = useMemo(() => {
    const map = new Map<string, ArchiveItem[]>();
    for (const edition of archive?.years ?? []) {
      for (const item of edition.technologies) {
        const key = `${edition.year}:${item.category}`;
        const rows = map.get(key);
        if (rows) rows.push(item);
        else map.set(key, [item]);
      }
    }
    return map;
  }, [archive]);

  const selectedTickers = useMemo(() => {
    for (const edition of archive?.years ?? []) {
      const hit = edition.technologies.find((t) => t.id === selectedId);
      if (hit) return new Set(hit.tickers ?? []);
    }
    return new Set<string>();
  }, [archive, selectedId]);

  const threads = useMemo(() => {
    const bag = new Map<string, Thread>();
    for (const edition of archive?.years ?? []) {
      for (const item of edition.technologies) {
        for (const ticker of item.tickers ?? []) {
          const row = bag.get(ticker) ?? { ticker, years: [], techs: [] };
          if (!row.years.includes(edition.year)) row.years.push(edition.year);
          row.techs.push({ id: item.id, year: edition.year, name: item.name });
          bag.set(ticker, row);
        }
      }
    }
    return [...bag.values()]
      .map((row) => ({ ...row, years: [...row.years].sort((a, b) => a - b) }))
      .sort((a, b) => b.years.length - a.years.length || a.ticker.localeCompare(b.ticker))
      .filter((row) => row.years.length >= 2)
      .slice(0, 16);
  }, [archive]);

  if (!archive) {
    return <p className="empty">Loading the archive…</p>;
  }

  return (
    <div className="picture">
      <div className="page-head">
        <h2>Big picture</h2>
        <p>
          Years run left to right. Subjects are rows. Each square is one MIT-named technology.
          Color is that cohort versus SPY after the list date. Grey means list-only — MIT named it,
          we have no mapped public companies. Click a square to open it on the Dashboard. The strip
          below shows tickers that keep showing up across years.
        </p>
      </div>
      <div className="mosaic-legend">
        <span>
          <i className="mosaic-mark beat" /> Beat SPY
        </span>
        <span>
          <i className="mosaic-mark mixed" /> Mixed
        </span>
        <span>
          <i className="mosaic-mark lag" /> Lagged
        </span>
        <span>
          <i className="mosaic-mark too_early" /> Too early
        </span>
        <span>
          <i className="mosaic-mark none" /> List only
        </span>
      </div>
      <div className="mosaic-wrap">
        <table className="mosaic">
          <thead>
            <tr>
              <th>Subject</th>
              {years.map((y) => (
                <th key={y}>{String(y).slice(2)}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {SUBJECTS.map((cat) => (
              <tr key={cat}>
                <th>
                  <ExplainTip text={categoryTip(cat)}>
                    <span className="tip-label">{categoryLabel(cat)}</span>
                  </ExplainTip>
                </th>
                {years.map((y) => (
                  <td key={y}>
                    <div className="mosaic-cell">
                      {(byCell.get(`${y}:${cat}`) ?? []).map((item) => (
                        <ExplainTip key={item.id} text={markTip(item)}>
                          <button
                            type="button"
                            className={`mosaic-mark ${markClass(item)} ${item.id === selectedId ? "on" : ""}`}
                            aria-label={item.name}
                            onClick={() => onOpen(item.id, y)}
                          />
                        </ExplainTip>
                      ))}
                    </div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <h3 className="picture-h">Companies that keep showing up</h3>
      <p className="note-block">
        Same listed name, different MIT technologies. A repeat is not automatically a winner — it
        often means the mapping reused a platform company. Click a year to open that edition.
      </p>
      <div className="threads">
        {threads.map((row) => (
          <div
            key={row.ticker}
            className={`thread ${selectedTickers.has(row.ticker) ? "hot" : ""}`}
          >
            <span className="thread-ticker mono">{row.ticker}</span>
            <span className="thread-n muted">{row.years.length} years</span>
            <div className="thread-years">
              {row.years.map((y) => {
                const hit = row.techs.find((t) => t.year === y);
                return (
                  <button
                    key={y}
                    type="button"
                    className="thread-year"
                    title={hit ? `${y} ${hit.name}` : String(y)}
                    onClick={() => hit && onOpen(hit.id, y)}
                  >
                    {y}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
