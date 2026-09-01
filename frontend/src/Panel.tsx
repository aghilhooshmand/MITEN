import { useEffect, useState, type ReactNode } from "react";
import { ExplainTip } from "./ExplainTip";

const STORAGE_KEY = "ledger-panels";

function readState(): Record<string, boolean> {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}") as Record<string, boolean>;
  } catch {
    return {};
  }
}

type Props = {
  id: string;
  title: string;
  subtitle?: string;
  titleTip?: string;
  defaultOpen?: boolean;
  children: ReactNode;
};

export function Panel({ id, title, subtitle, titleTip, defaultOpen = true, children }: Props) {
  const [open, setOpen] = useState(() => {
    const stored = readState();
    return stored[id] ?? defaultOpen;
  });

  useEffect(() => {
    const stored = readState();
    stored[id] = open;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
  }, [id, open]);

  return (
    <section id={`panel-${id}`} className={`panel ${open ? "open" : "closed"}`}>
      <button className="panel-head" onClick={() => setOpen((v) => !v)} type="button">
        <span className="panel-chevron">{open ? "▾" : "▸"}</span>
        <ExplainTip text={titleTip}>
          <span className="panel-title">{title}</span>
        </ExplainTip>
        {subtitle ? <span className="panel-sub">{subtitle}</span> : null}
        <span className="panel-action">{open ? "Hide" : "Show"}</span>
      </button>
      {open ? <div className="panel-body">{children}</div> : null}
    </section>
  );
}
