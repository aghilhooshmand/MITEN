export type SortDir = "asc" | "desc";
export type SortSpec = { key: string; dir: SortDir };

const VERDICT_ORDER: Record<string, number> = {
  beat: 5,
  mixed: 3,
  too_early: 2,
  insufficient: 1,
  lag: 0,
  none: -1,
};

const MAP_ORDER: Record<string, number> = {
  direct: 2,
  exposed: 1,
};

export function nextSort(current: SortSpec, key: string, defaultDir: SortDir = "desc"): SortSpec {
  if (current.key === key) {
    return { key, dir: current.dir === "asc" ? "desc" : "asc" };
  }
  return { key, dir: defaultDir };
}

export function cmpNum(
  a: number | null | undefined,
  b: number | null | undefined,
  dir: SortDir,
): number {
  const aMissing = a == null || Number.isNaN(a);
  const bMissing = b == null || Number.isNaN(b);
  if (aMissing && bMissing) return 0;
  if (aMissing) return 1;
  if (bMissing) return -1;
  return dir === "asc" ? a - b : b - a;
}

export function cmpStr(a: string | null | undefined, b: string | null | undefined, dir: SortDir): number {
  const cmp = String(a ?? "").localeCompare(String(b ?? ""), undefined, {
    numeric: true,
    sensitivity: "base",
  });
  return dir === "asc" ? cmp : -cmp;
}

export function cmpVerdict(a: string | null | undefined, b: string | null | undefined, dir: SortDir): number {
  return cmpNum(VERDICT_ORDER[a || "none"] ?? -1, VERDICT_ORDER[b || "none"] ?? -1, dir);
}

export function cmpMap(a: string | null | undefined, b: string | null | undefined, dir: SortDir): number {
  return cmpNum(MAP_ORDER[a || ""] ?? 0, MAP_ORDER[b || ""] ?? 0, dir);
}

export function sortMark(spec: SortSpec, key: string): string {
  if (spec.key !== key) return "";
  return spec.dir === "asc" ? " ↑" : " ↓";
}
