export function fmtPct(value: number | null | undefined, digits = 1): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  const pct = value * 100;
  const sign = pct > 0 ? "+" : "";
  return `${sign}${pct.toFixed(digits)}%`;
}

export function fmtPp(value: number | null | undefined, digits = 1): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  const pct = value * 100;
  const sign = pct > 0 ? "+" : "";
  return `${sign}${pct.toFixed(digits)}pp`;
}

export function fmtScore(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  return value.toFixed(1);
}

export function fmtNum(value: number | null | undefined, digits = 0): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  return value.toFixed(digits);
}

export function fmtCap(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value) || value <= 0) {
    return "—";
  }
  if (value >= 1_000_000_000_000) return `$${(value / 1_000_000_000_000).toFixed(1)}T`;
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(1)}B`;
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(0)}M`;
  return `$${value.toFixed(0)}`;
}

export function signedClass(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value) || value === 0) {
    return "num";
  }
  return value > 0 ? "num up" : "num down";
}

export function verdictLabel(verdict: string | undefined): string {
  switch (verdict) {
    case "beat":
      return "Beat market";
    case "lag":
      return "Lagged";
    case "mixed":
      return "Mixed";
    case "too_early":
      return "Too early";
    case "insufficient":
      return "Thin sample";
    default:
      return "Unscored";
  }
}

export function categoryLabel(value: string): string {
  const map: Record<string, string> = {
    ai: "AI",
    biotech: "Biotech",
    energy: "Energy",
    hardware: "Hardware",
    consumer: "Consumer",
    space: "Space",
    industrial: "Industrial",
    other: "Other",
  };
  return map[value] ?? value;
}
