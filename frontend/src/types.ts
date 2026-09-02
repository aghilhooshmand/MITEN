export type Universe = "all" | "direct";

export type Score = {
  universe: string;
  as_of: string;
  n_companies: number;
  n_with_prices: number;
  cohort_mean_return: number | null;
  cohort_median_return: number | null;
  mean_benchmark_return: number | null;
  mean_excess_return: number | null;
  median_excess_return: number | null;
  dispersion: number | null;
  hit_rate: number | null;
  window_years: number | null;
  window_short: boolean;
  verdict: string;
  prediction_score: number | null;
};

export type TechListItem = {
  id: number;
  year: number;
  name: string;
  slug: string;
  category: string;
  list_index?: number;
  description?: string;
  verification_status: string;
  published_on: string;
  benchmark_ticker: string;
  score: Score | null;
};

export type ArchiveItem = {
  id: number;
  list_index: number;
  name: string;
  description: string;
  category: string;
  verification_status: string;
  mapped: boolean;
  score: Score | null;
  tickers?: string[];
};

export type ArchiveYear = {
  year: number;
  verification_status: string;
  note: string;
  source_url: string | null;
  technologies: ArchiveItem[];
};

export type Archive = {
  source: string;
  years: ArchiveYear[];
};

export type CompanyRow = {
  id?: number;
  name: string;
  ticker: string;
  sector?: string;
  confidence: string;
  role_note: string;
  added_by?: string;
  added_at?: string;
  ipo_date?: string | null;
  delisted_date?: string | null;
  delisted_reason?: string | null;
  total_return?: number | null;
  spy_return?: number | null;
  excess_return?: number | null;
  start_date?: string | null;
  end_date?: string | null;
};

export type Analogy = {
  id: number;
  year: number;
  name: string;
  note: string;
  score: Score | null;
};

export type ChartPoint = {
  date: string;
  cohort: number;
  spy?: number | null;
  sector?: number | null;
  nasdaq?: number | null;
  gold?: number | null;
  oil?: number | null;
  benchmark?: number | null;
};

export type ChartSeries = {
  key: keyof ChartPoint | string;
  label: string;
  ticker: string | null;
};

export type TechDetail = {
  id: number;
  year: number;
  name: string;
  slug: string;
  description: string;
  category: string;
  verification_status: string;
  published_on: string;
  mit_source_url: string | null;
  benchmark_ticker: string;
  score: Score | null;
  companies: CompanyRow[];
  chart: {
    points: ChartPoint[];
    series: ChartSeries[];
    benchmark_ticker: string;
    sector_ticker: string | null;
    score_vs?: string;
  };
  analogies: Analogy[];
};

export type Overview = {
  universe: string;
  as_of: string;
  n_technologies: number;
  n_mapped_technologies: number;
  n_scored: number;
  n_companies: number;
  beat_count: number;
  lag_count: number;
  beat_rate: number | null;
  median_excess_return: number | null;
  mean_excess_return: number | null;
  years: { year: number; verification_status: string; note: string; source_url?: string | null }[];
  disclaimer: string;
};

export type RankedScore = Score & {
  technology_id: number;
  year: number;
  name: string;
  description?: string;
  category: string;
  rank: number;
};

export type WatchItem = {
  id: number;
  name: string;
  slug: string;
  description: string;
  category: string;
  verification_status: string;
  published_on: string;
  score: Score | null;
  companies: CompanyRow[];
  analogies: Analogy[];
  historical_analog_excess: number | null;
};

export type Watchlist = {
  year: number;
  note: string;
  items: WatchItem[];
};

export type CompanyMapPoint = {
  technology_id: number;
  year: number;
  technology: string;
  category: string;
  prediction_score: number | null;
  cohort_excess: number | null;
  window_years: number | null;
  verdict: string;
  company_id: number | null;
  ticker: string;
  name: string;
  confidence: string;
  total_return: number | null;
  spy_return: number | null;
  excess_return: number | null;
  market_cap: number | null;
  size_band: "mega" | "large" | "mid" | "small" | "unknown";
  delisted: boolean;
};

export type CompanyMap = {
  universe: string;
  as_of: string;
  market_cap_as_of: string | null;
  n_points: number;
  points: CompanyMapPoint[];
};
