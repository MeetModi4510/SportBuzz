/**
 * Player Bowling Stats Transformer
 *
 * Converts raw Cricbuzz bowling stats API response into clean, frontend-friendly
 * structures. Also generates pre-computed chart data for all bowling visualizations
 * and derived analytics beyond the raw Cricbuzz data.
 *
 * Components should NEVER consume raw API responses — always go through this layer.
 */

import type {
  CricbuzzBowlingStatsResponse,
  PlayerBowlingFormat,
  PlayerBowlingStats,
  BowlingChartData,
  BowlingFormatBarDataPoint,
  BowlingGroupedBarDataPoint,
  BowlingRadarDataPoint,
  BowlingFormatKey,
  DerivedBowlingStats,
} from '@/types/playerBowlingTypes';

// ─── Format name normalization (shared with batting) ─────────────────────────

const FORMAT_MAP: Record<string, BowlingFormatKey> = {
  'test': 'test',
  'tests': 'test',
  'odi': 'odi',
  'odis': 'odi',
  't20i': 't20',
  't20is': 't20',
  't20': 't20',
  'ipl': 'ipl',
};

const FORMAT_COLORS: Record<BowlingFormatKey, string> = {
  test: '#ef4444',   // Red
  odi: '#3b82f6',    // Blue
  t20: '#10b981',    // Emerald
  ipl: '#f59e0b',    // Amber
};

const FORMAT_LABELS: Record<BowlingFormatKey, string> = {
  test: 'Test',
  odi: 'ODI',
  t20: 'T20I',
  ipl: 'IPL',
};

// ─── Safe Parsers ────────────────────────────────────────────────────────────

function safeParseInt(val: string | undefined): number {
  if (!val || val === '-' || val === 'N/A') return 0;
  const cleaned = val.replace(/[^0-9.-]/g, '');
  const parsed = parseInt(cleaned, 10);
  return isNaN(parsed) ? 0 : parsed;
}

function safeParseFloat(val: string | undefined): number {
  if (!val || val === '-' || val === 'N/A') return 0;
  const cleaned = val.replace(/[^0-9.-]/g, '');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

function safeParseString(val: string | undefined): string {
  if (!val || val === '-' || val === 'N/A') return '-';
  return val.trim();
}

// ─── Core Transformer ────────────────────────────────────────────────────────

/**
 * Parse a single row of format bowling stats into a typed PlayerBowlingFormat object.
 *
 * The Cricbuzz bowling API typically returns headers like:
 * ["", "Mat", "Inns", "Balls", "Runs", "Mdns", "Wkts", "Avg", "Econ", "SR", "BBI", "BBM", "4w", "5w", "10w"]
 * And values rows where index 0 = format name.
 */
function parseFormatRow(
  values: string[],
  headers: string[]
): PlayerBowlingFormat {
  // Build a header → index lookup for flexible parsing
  const headerIndex: Record<string, number> = {};
  headers.forEach((h, i) => {
    headerIndex[h.toLowerCase().trim()] = i;
  });

  // Helper to get value by header name (case-insensitive, with fallbacks)
  const getVal = (...names: string[]): string => {
    for (const name of names) {
      const idx = headerIndex[name.toLowerCase()];
      if (idx !== undefined && values[idx] !== undefined) {
        return values[idx];
      }
    }
    return '0';
  };

  return {
    matches: safeParseInt(getVal('mat', 'matches', 'm')),
    innings: safeParseInt(getVal('inns', 'innings', 'inn', 'i')),
    balls: safeParseInt(getVal('balls', 'ball', 'b')),
    runs: safeParseInt(getVal('runs', 'run', 'r')),
    maidens: safeParseInt(getVal('mdns', 'maidens', 'maiden', 'mdn')),
    wickets: safeParseInt(getVal('wkts', 'wickets', 'wicket', 'w')),
    average: safeParseFloat(getVal('avg', 'average', 'bowl avg')),
    economy: safeParseFloat(getVal('econ', 'economy', 'eco')),
    strikeRate: safeParseFloat(getVal('sr', 'strike rate', 'str rate')),
    bbi: safeParseString(getVal('bbi', 'best bowling innings', 'best innings')),
    bbm: safeParseString(getVal('bbm', 'best bowling match', 'best match')),
    fourWickets: safeParseInt(getVal('4w', '4wi', '4wkts', 'four wickets')),
    fiveWickets: safeParseInt(getVal('5w', '5wi', '5wkts', 'five wickets')),
    tenWickets: safeParseInt(getVal('10w', '10wi', '10wkts', 'ten wickets')),
  };
}

/**
 * Transform raw Cricbuzz bowling stats response into clean PlayerBowlingStats.
 */
export function transformBowlingStats(
  raw: CricbuzzBowlingStatsResponse
): PlayerBowlingStats {
  const result: PlayerBowlingStats = {
    test: null,
    odi: null,
    t20: null,
    ipl: null,
  };

  if (!raw || !raw.values || !raw.headers) {
    return result;
  }

  const headers = raw.headers;

  // Detect if the API response is transposed (formats are in the headers instead of first column)
  const isTransposed = headers.some(h => FORMAT_MAP[h.toLowerCase().trim()] !== undefined);

  if (isTransposed) {
    // Extract the stat names from the first column of each row
    const statNames = raw.values.map(row => (row.values[0] || '').trim());

    for (let colIndex = 1; colIndex < headers.length; colIndex++) {
      const formatRaw = (headers[colIndex] || '').toLowerCase().trim();
      const formatKey = FORMAT_MAP[formatRaw];

      if (formatKey) {
        // Build an array of values for this specific format column
        const statValues = raw.values.map(row => row.values[colIndex] || '0');
        result[formatKey] = parseFormatRow(statValues, statNames);
      }
    }
  } else {
    // Standard format processing
    for (const row of raw.values) {
      if (!row.values || row.values.length === 0) continue;

      const formatRaw = (row.values[0] || '').toLowerCase().trim();
      const formatKey = FORMAT_MAP[formatRaw];

      if (formatKey) {
        result[formatKey] = parseFormatRow(row.values, headers);
      }
    }
  }

  return result;
}

// ─── Chart Data Generators ───────────────────────────────────────────────────

/**
 * Get all available formats with their data, in display order.
 */
function getAvailableFormats(
  stats: PlayerBowlingStats
): { key: BowlingFormatKey; data: PlayerBowlingFormat }[] {
  const order: BowlingFormatKey[] = ['test', 'odi', 't20', 'ipl'];
  return order
    .filter((k) => stats[k] !== null)
    .map((k) => ({ key: k, data: stats[k]! }));
}

/**
 * Generate all chart datasets from transformed bowling stats.
 */
export function generateBowlingChartData(stats: PlayerBowlingStats): BowlingChartData {
  const formats = getAvailableFormats(stats);

  // 1. Wickets by Format (Bar Chart)
  const wicketsByFormat: BowlingFormatBarDataPoint[] = formats.map((f) => ({
    format: FORMAT_LABELS[f.key],
    value: f.data.wickets,
    fill: FORMAT_COLORS[f.key],
  }));

  // 2. Economy Rate by Format (Bar Chart)
  const economyByFormat: BowlingFormatBarDataPoint[] = formats.map((f) => ({
    format: FORMAT_LABELS[f.key],
    value: f.data.economy,
    fill: FORMAT_COLORS[f.key],
  }));

  // 3. Bowling Average by Format (Bar Chart)
  const averageByFormat: BowlingFormatBarDataPoint[] = formats.map((f) => ({
    format: FORMAT_LABELS[f.key],
    value: f.data.average,
    fill: FORMAT_COLORS[f.key],
  }));

  // 4. Strike Rate by Format (Area Chart)
  const strikeRateByFormat: BowlingFormatBarDataPoint[] = formats.map((f) => ({
    format: FORMAT_LABELS[f.key],
    value: f.data.strikeRate,
    fill: FORMAT_COLORS[f.key],
  }));

  // 5. Maidens by Format (Bar Chart)
  const maidensByFormat: BowlingFormatBarDataPoint[] = formats.map((f) => ({
    format: FORMAT_LABELS[f.key],
    value: f.data.maidens,
    fill: FORMAT_COLORS[f.key],
  }));

  // 6. Wicket Hauls Comparison (Grouped Bar Chart)
  const wicketHauls: BowlingGroupedBarDataPoint[] = formats.map((f) => ({
    format: FORMAT_LABELS[f.key],
    fourWickets: f.data.fourWickets,
    fiveWickets: f.data.fiveWickets,
    tenWickets: f.data.tenWickets,
  }));

  // 7. Performance Radar (normalized 0-100 — best format)
  const maxWickets = Math.max(...formats.map((f) => f.data.wickets), 1);
  const maxMaidens = Math.max(...formats.map((f) => f.data.maidens), 1);
  const maxHauls = Math.max(
    ...formats.map((f) => f.data.fourWickets + f.data.fiveWickets + f.data.tenWickets),
    1
  );

  // Use the format with the most wickets for the radar
  const bestFormat = formats.length > 0
    ? formats.reduce(
        (best, f) => (f.data.wickets > best.data.wickets ? f : best),
        formats[0]
      )
    : null;

  const performanceRadar: BowlingRadarDataPoint[] = bestFormat
    ? [
        {
          metric: 'Wickets',
          value: Math.round((bestFormat.data.wickets / maxWickets) * 100),
          fullMark: 100,
        },
        {
          metric: 'Average',
          // Lower average is better — invert the scale
          value: Math.min(100, Math.round((1 - Math.min(bestFormat.data.average, 60) / 60) * 100)),
          fullMark: 100,
        },
        {
          metric: 'Economy',
          // Lower economy is better — invert the scale
          value: Math.min(100, Math.round((1 - Math.min(bestFormat.data.economy, 12) / 12) * 100)),
          fullMark: 100,
        },
        {
          metric: 'Strike Rate',
          // Lower strike rate is better — invert the scale
          value: Math.min(100, Math.round((1 - Math.min(bestFormat.data.strikeRate, 100) / 100) * 100)),
          fullMark: 100,
        },
        {
          metric: 'Maidens',
          value: Math.round((bestFormat.data.maidens / Math.max(maxMaidens, 1)) * 100),
          fullMark: 100,
        },
        {
          metric: 'Wicket Hauls',
          value: Math.round(
            ((bestFormat.data.fourWickets + bestFormat.data.fiveWickets + bestFormat.data.tenWickets) /
              Math.max(maxHauls, 1)) *
              100
          ),
          fullMark: 100,
        },
      ]
    : [];

  return {
    wicketsByFormat,
    economyByFormat,
    averageByFormat,
    strikeRateByFormat,
    maidensByFormat,
    wicketHauls,
    performanceRadar,
  };
}

// ─── Derived Analytics ───────────────────────────────────────────────────────

/**
 * Generate derived bowling analytics beyond raw Cricbuzz data.
 */
export function generateBowlingDerivedStats(
  format: PlayerBowlingFormat
): DerivedBowlingStats {
  const wicketsPerMatch =
    format.matches > 0
      ? Math.round((format.wickets / format.matches) * 100) / 100
      : 0;

  const wicketsPerInnings =
    format.innings > 0
      ? Math.round((format.wickets / format.innings) * 100) / 100
      : 0;

  // Impact Score formula:
  // (wickets × 20) - (economy × 5) - (average × 2) + (fiveWickets × 10)
  const bowlingImpactScore = Math.round(
    (format.wickets * 20) -
    (format.economy * 5) -
    (format.average * 2) +
    (format.fiveWickets * 10)
  );

  // Wicket-Haul Efficiency: (4w + 5w + 10w) / innings × 100
  const wicketHaulEfficiency =
    format.innings > 0
      ? Math.round(
          ((format.fourWickets + format.fiveWickets + format.tenWickets) /
            format.innings) *
            10000
        ) / 100
      : 0;

  return {
    wicketsPerMatch,
    wicketsPerInnings,
    bowlingImpactScore,
    wicketHaulEfficiency,
  };
}

// ─── Single-Format Generators ────────────────────────────────────────────────

/**
 * Generate radar data for a SINGLE selected bowling format.
 * Normalizes against sensible baselines per format.
 */
export function generateBowlingFormatRadarData(
  format: PlayerBowlingFormat,
  formatKey: BowlingFormatKey
): BowlingRadarDataPoint[] {
  // Sensible max baselines per format for normalization
  // (lower avg/econ/sr is better → invert)
  const baselines: Record<BowlingFormatKey, { wickets: number; avg: number; econ: number; sr: number }> = {
    test: { wickets: 400, avg: 20, econ: 2.5, sr: 40 },
    odi: { wickets: 300, avg: 25, econ: 4.0, sr: 30 },
    t20: { wickets: 100, avg: 18, econ: 6.0, sr: 15 },
    ipl: { wickets: 150, avg: 22, econ: 7.0, sr: 18 },
  };

  const b = baselines[formatKey];

  return [
    {
      metric: 'Wickets',
      value: Math.min(100, Math.round((format.wickets / b.wickets) * 100)),
      fullMark: 100,
    },
    {
      metric: 'Average',
      // Lower is better
      value: format.average > 0
        ? Math.min(100, Math.round((b.avg / format.average) * 100))
        : 0,
      fullMark: 100,
    },
    {
      metric: 'Economy',
      // Lower is better
      value: format.economy > 0
        ? Math.min(100, Math.round((b.econ / format.economy) * 100))
        : 0,
      fullMark: 100,
    },
    {
      metric: 'Strike Rate',
      // Lower is better
      value: format.strikeRate > 0
        ? Math.min(100, Math.round((b.sr / format.strikeRate) * 100))
        : 0,
      fullMark: 100,
    },
    {
      metric: 'Maidens',
      value: Math.min(100, format.maidens * 2),
      fullMark: 100,
    },
    {
      metric: 'Wicket Hauls',
      value: Math.min(
        100,
        (format.fourWickets + format.fiveWickets + format.tenWickets) * 5
      ),
      fullMark: 100,
    },
  ];
}

// Re-export constants for use in components
export { FORMAT_COLORS as BOWLING_FORMAT_COLORS, FORMAT_LABELS as BOWLING_FORMAT_LABELS, FORMAT_MAP as BOWLING_FORMAT_MAP };
export type { BowlingFormatKey };
