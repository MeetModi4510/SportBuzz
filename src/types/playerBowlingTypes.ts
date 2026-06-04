// ─── Raw Cricbuzz API Response Types ─────────────────────────────────────────
// The bowling stats endpoint returns headers + value rows grouped by format.
// Endpoint: GET /stats/v1/player/{playerId}/bowling

export interface CricbuzzBowlingStatsResponse {
  headers: string[];
  values: CricbuzzBowlingFormatRow[];
}

export interface CricbuzzBowlingFormatRow {
  values: string[];
}

// ─── Transformed Frontend Types ──────────────────────────────────────────────
// Clean, typed representation for UI consumption.

export type BowlingFormatKey = 'test' | 'odi' | 't20' | 'ipl';

export interface PlayerBowlingFormat {
  matches: number;
  innings: number;
  balls: number;
  runs: number;
  maidens: number;
  wickets: number;
  average: number;
  economy: number;
  strikeRate: number;
  bbi: string;       // Best Bowling in Innings (e.g., "6/19")
  bbm: string;       // Best Bowling in Match  (e.g., "10/87")
  fourWickets: number;
  fiveWickets: number;
  tenWickets: number;
}

export interface PlayerBowlingStats {
  test: PlayerBowlingFormat | null;
  odi: PlayerBowlingFormat | null;
  t20: PlayerBowlingFormat | null;
  ipl: PlayerBowlingFormat | null;
}

// ─── Chart Data Types ────────────────────────────────────────────────────────

export interface BowlingFormatBarDataPoint {
  format: string;
  value: number;
  fill: string;
}

export interface BowlingGroupedBarDataPoint {
  format: string;
  fourWickets: number;
  fiveWickets: number;
  tenWickets: number;
}

export interface BowlingRadarDataPoint {
  metric: string;
  value: number;
  fullMark: number;
}

export interface BowlingChartData {
  wicketsByFormat: BowlingFormatBarDataPoint[];
  economyByFormat: BowlingFormatBarDataPoint[];
  averageByFormat: BowlingFormatBarDataPoint[];
  strikeRateByFormat: BowlingFormatBarDataPoint[];
  maidensByFormat: BowlingFormatBarDataPoint[];
  wicketHauls: BowlingGroupedBarDataPoint[];
  performanceRadar: BowlingRadarDataPoint[];
}

// ─── Derived Analytics Types ─────────────────────────────────────────────────

export interface DerivedBowlingStats {
  wicketsPerMatch: number;
  wicketsPerInnings: number;
  bowlingImpactScore: number;
  wicketHaulEfficiency: number;
}
