// ─── Raw Cricbuzz API Response Types ─────────────────────────────────────────
// The batting stats endpoint returns headers + value rows grouped by format.
// Endpoint: GET /stats/v1/player/{playerId}/batting

export interface CricbuzzBattingStatsResponse {
  headers: string[];
  values: CricbuzzFormatRow[];
}

export interface CricbuzzFormatRow {
  values: string[];
}

// ─── Transformed Frontend Types ──────────────────────────────────────────────
// Clean, typed representation for UI consumption.

export type BattingFormatKey = 'test' | 'odi' | 't20' | 'ipl';

export interface PlayerBattingFormat {
  matches: number;
  innings: number;
  notOuts: number;
  runs: number;
  balls: number;
  highestScore: string;
  average: number;
  strikeRate: number;
  hundreds: number;
  twoHundreds: number;
  fifties: number;
  fours: number;
  sixes: number;
  ducks: number;
}

export interface PlayerBattingStats {
  test: PlayerBattingFormat | null;
  odi: PlayerBattingFormat | null;
  t20: PlayerBattingFormat | null;
  ipl: PlayerBattingFormat | null;
}

// ─── Chart Data Types ────────────────────────────────────────────────────────

export interface FormatBarDataPoint {
  format: string;
  value: number;
  fill: string;
}

export interface GroupedBarDataPoint {
  format: string;
  fifties: number;
  hundreds: number;
}

export interface BoundaryPieDataPoint {
  name: string;
  value: number;
  fill: string;
}

export interface RadarDataPoint {
  metric: string;
  value: number;
  fullMark: number;
}

export interface PlayerChartData {
  runsByFormat: FormatBarDataPoint[];
  averageByFormat: FormatBarDataPoint[];
  strikeRateByFormat: FormatBarDataPoint[];
  fiftyVsHundred: GroupedBarDataPoint[];
  boundaryAnalysis: BoundaryPieDataPoint[];
  performanceRadar: RadarDataPoint[];
}
