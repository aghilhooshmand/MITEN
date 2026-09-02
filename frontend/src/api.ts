import type {
  Archive,
  CompanyMap,
  Overview,
  RankedScore,
  TechDetail,
  TechListItem,
  Universe,
  Watchlist,
} from "./types";

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(path);
  if (!res.ok) {
    throw new Error(`${path} failed (${res.status})`);
  }
  return res.json() as Promise<T>;
}

export function fetchOverview(universe: Universe) {
  return getJson<Overview>(`/api/overview?universe=${universe}`);
}

export function fetchTechnologies(params: {
  universe: Universe;
  year?: string;
  q?: string;
  category?: string;
  mappedOnly?: boolean;
}) {
  const qs = new URLSearchParams({ universe: params.universe });
  if (params.year) qs.set("year", params.year);
  if (params.q) qs.set("q", params.q);
  if (params.category) qs.set("category", params.category);
  if (params.mappedOnly) qs.set("mapped_only", "true");
  return getJson<TechListItem[]>(`/api/technologies?${qs}`);
}

export function fetchTechnology(id: number, universe: Universe) {
  return getJson<TechDetail>(`/api/technologies/${id}?universe=${universe}`);
}

export function fetchScores(universe: Universe) {
  return getJson<RankedScore[]>(`/api/scores?universe=${universe}`);
}

export function fetchWatchlist(universe: Universe) {
  return getJson<Watchlist>(`/api/watchlist?universe=${universe}`);
}

export function fetchArchive(universe: Universe) {
  return getJson<Archive>(`/api/archive?universe=${universe}`);
}

export function fetchCompanyMap(universe: Universe) {
  return getJson<CompanyMap>(`/api/company-map?universe=${universe}`);
}

export function fetchCategories() {
  return getJson<string[]>("/api/categories");
}
