import { useEffect, useState, type ReactNode } from "react";

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
  defaultOpen?: boolean;
  children: ReactNode;
};

export function Panel({ id, title, subtitle, defaultOpen = true, children }: Props) {
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
    <section className={`panel ${open ? "open" : "closed"}`}>
      <button className="panel-head" onClick={() => setOpen((v) => !v)} type="button">
        <span className="panel-chevron">{open ? "▾" : "▸"}</span>
        <span className="panel-title">{title}</span>
        {subtitle ? <span className="panel-sub">{subtitle}</span> : null}
        <span className="panel-action">{open ? "Hide" : "Show"}</span>
      </button>
      {open ? <div className="panel-body">{children}</div> : null}
    </section>
  );
}
