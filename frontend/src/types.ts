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
  verification_status: string;
  published_on: string;
  benchmark_ticker: string;
  score: Score | null;
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
  benchmark: number | null;
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
    sector_points: ChartPoint[];
    benchmark_ticker: string;
    sector_ticker: string | null;
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
  years: { year: number; verification_status: string; note: string }[];
  disclaimer: string;
};

export type RankedScore = Score & {
  technology_id: number;
  year: number;
  name: string;
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
