/**
 * Player Stats Transformer
 *
 * Converts raw Cricbuzz batting stats API response into clean, frontend-friendly
 * structures. Also generates pre-computed chart data for all visualizations.
 *
 * Components should NEVER consume raw API responses — always go through this layer.
 */

import type {
  CricbuzzBattingStatsResponse,
  PlayerBattingFormat,
  PlayerBattingStats,
  PlayerChartData,
  FormatBarDataPoint,
  GroupedBarDataPoint,
  BoundaryPieDataPoint,
  RadarDataPoint,
  BattingFormatKey,
} from '@/types/playerBattingTypes';

// ─── Format name normalization ───────────────────────────────────────────────

const FORMAT_MAP: Record<string, BattingFormatKey> = {
  'test': 'test',
  'tests': 'test',
  'odi': 'odi',
  'odis': 'odi',
  't20i': 't20',
  't20is': 't20',
  't20': 't20',
  'ipl': 'ipl',
};

const FORMAT_COLORS: Record<BattingFormatKey, string> = {
  all: '#8b5cf6',    // Purple
  test: '#ef4444',   // Red
  odi: '#3b82f6',    // Blue
  t20: '#10b981',    // Emerald
  ipl: '#f59e0b',    // Amber
};

const FORMAT_LABELS: Record<BattingFormatKey, string> = {
  all: 'ALL',
  test: 'Test',
  odi: 'ODI',
  t20: 'T20I',
  ipl: 'IPL',
};

// ─── Core Transformer ────────────────────────────────────────────────────────

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

/**
 * Parse a single row of format stats into a typed PlayerBattingFormat object.
 *
 * The Cricbuzz API typically returns headers like:
 * ["", "Mat", "Inns", "NO", "Runs", "HS", "Avg", "BF", "SR", "100s", "200s", "50s", "4s", "6s", "0"]
 * And values rows where index 0 = format name.
 */
function parseFormatRow(
  values: string[],
  headers: string[]
): PlayerBattingFormat {
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
    notOuts: safeParseInt(getVal('no', 'not outs', 'notouts')),
    runs: safeParseInt(getVal('runs', 'run', 'r')),
    balls: safeParseInt(getVal('bf', 'balls', 'balls faced')),
    highestScore: getVal('hs', 'highest', 'highest score') || '0',
    average: safeParseFloat(getVal('avg', 'average', 'bat avg')),
    strikeRate: safeParseFloat(getVal('sr', 'strike rate', 'str rate')),
    hundreds: safeParseInt(getVal('100s', '100', 'hundreds', 'cent')),
    twoHundreds: safeParseInt(getVal('200s', '200', 'double hundreds')),
    fifties: safeParseInt(getVal('50s', '50', 'fifties', 'half cent')),
    fours: safeParseInt(getVal('4s', 'fours', '4')),
    sixes: safeParseInt(getVal('6s', 'sixes', '6')),
    ducks: safeParseInt(getVal('0', 'ducks', '0s')),
  };
}

/**
 * Transform raw Cricbuzz batting stats response into clean PlayerBattingStats.
 */
export function transformBattingStats(
  raw: CricbuzzBattingStatsResponse
): PlayerBattingStats {
  const result: PlayerBattingStats = {
    all: null,
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
  
  // Aggregate 'all' format
  let matches = 0, innings = 0, notOuts = 0, runs = 0, balls = 0;
  let hundreds = 0, twoHundreds = 0, fifties = 0, fours = 0, sixes = 0, ducks = 0;
  let highestScoreNum = 0;
  let highestScoreStr = '0';
  let hasAnyFormat = false;

  (['test', 'odi', 't20'] as BattingFormatKey[]).forEach(fmt => {
    const data = result[fmt];
    if (data) {
        hasAnyFormat = true;
        matches += data.matches;
        innings += data.innings;
        notOuts += data.notOuts;
        runs += data.runs;
        balls += data.balls;
        hundreds += data.hundreds;
        twoHundreds += data.twoHundreds;
        fifties += data.fifties;
        fours += data.fours;
        sixes += data.sixes;
        ducks += data.ducks;
        const hsNum = parseInt(data.highestScore.replace(/[^0-9]/g, '') || '0', 10);
        if (hsNum > highestScoreNum) {
            highestScoreNum = hsNum;
            highestScoreStr = data.highestScore;
        }
    }
  });

  if (hasAnyFormat) {
      result.all = {
          matches, innings, notOuts, runs, balls, highestScore: highestScoreStr,
          average: innings - notOuts > 0 ? parseFloat((runs / (innings - notOuts)).toFixed(2)) : 0,
          strikeRate: balls > 0 ? parseFloat(((runs / balls) * 100).toFixed(2)) : 0,
          hundreds, twoHundreds, fifties, fours, sixes, ducks
      };
  }

  return result;
}

// ─── Chart Data Generators ───────────────────────────────────────────────────

/**
 * Get all available formats with their data, in display order.
 */
function getAvailableFormats(
  stats: PlayerBattingStats
): { key: BattingFormatKey; data: PlayerBattingFormat }[] {
  const order: BattingFormatKey[] = ['test', 'odi', 't20', 'ipl'];
  return order
    .filter((k) => stats[k] !== null)
    .map((k) => ({ key: k, data: stats[k]! }));
}

/**
 * Generate all chart datasets from transformed batting stats.
 */
export function generateChartData(stats: PlayerBattingStats): PlayerChartData {
  const formats = getAvailableFormats(stats);

  // 1. Runs by Format (Bar Chart)
  const runsByFormat: FormatBarDataPoint[] = formats.map((f) => ({
    format: FORMAT_LABELS[f.key],
    value: f.data.runs,
    fill: FORMAT_COLORS[f.key],
  }));

  // 2. Average by Format (Bar Chart)
  const averageByFormat: FormatBarDataPoint[] = formats.map((f) => ({
    format: FORMAT_LABELS[f.key],
    value: f.data.average,
    fill: FORMAT_COLORS[f.key],
  }));

  // 3. Strike Rate Comparison (Area Chart)
  const strikeRateByFormat: FormatBarDataPoint[] = formats.map((f) => ({
    format: FORMAT_LABELS[f.key],
    value: f.data.strikeRate,
    fill: FORMAT_COLORS[f.key],
  }));

  // 4. Fifty vs Hundred Comparison (Grouped Bar Chart)
  const fiftyVsHundred: GroupedBarDataPoint[] = formats.map((f) => ({
    format: FORMAT_LABELS[f.key],
    fifties: f.data.fifties,
    hundreds: f.data.hundreds,
  }));

  // 5. Boundary Analysis (Pie Chart)
  // Aggregate across all formats
  let totalFours = 0;
  let totalSixes = 0;
  let totalRuns = 0;
  formats.forEach((f) => {
    totalFours += f.data.fours;
    totalSixes += f.data.sixes;
    totalRuns += f.data.runs;
  });
  const boundaryRuns = totalFours * 4 + totalSixes * 6;
  const nonBoundaryRuns = Math.max(0, totalRuns - boundaryRuns);

  const boundaryAnalysis: BoundaryPieDataPoint[] = [
    { name: 'Boundary Runs', value: boundaryRuns, fill: '#f59e0b' },
    { name: 'Non-Boundary Runs', value: nonBoundaryRuns, fill: '#6366f1' },
  ];

  // 6. Performance Radar (normalized 0-100 across formats)
  // We pick the "best" values across all formats for normalization
  const maxRuns = Math.max(...formats.map((f) => f.data.runs), 1);
  const maxAvg = Math.max(...formats.map((f) => f.data.average), 1);
  const maxSR = Math.max(...formats.map((f) => f.data.strikeRate), 1);
  const maxHundreds = Math.max(...formats.map((f) => f.data.hundreds), 1);
  const maxFifties = Math.max(...formats.map((f) => f.data.fifties), 1);

  // Use the format with the most runs for the radar
  const bestFormat = formats.reduce(
    (best, f) => (f.data.runs > best.data.runs ? f : best),
    formats[0]
  );

  const performanceRadar: RadarDataPoint[] = bestFormat
    ? [
        {
          metric: 'Runs',
          value: Math.round((bestFormat.data.runs / maxRuns) * 100),
          fullMark: 100,
        },
        {
          metric: 'Average',
          value: Math.min(100, Math.round((bestFormat.data.average / 60) * 100)),
          fullMark: 100,
        },
        {
          metric: 'Strike Rate',
          value: Math.min(
            100,
            Math.round((bestFormat.data.strikeRate / 180) * 100)
          ),
          fullMark: 100,
        },
        {
          metric: 'Hundreds',
          value: Math.min(
            100,
            Math.round((bestFormat.data.hundreds / Math.max(maxHundreds, 1)) * 100)
          ),
          fullMark: 100,
        },
        {
          metric: 'Fifties',
          value: Math.min(
            100,
            Math.round((bestFormat.data.fifties / Math.max(maxFifties, 1)) * 100)
          ),
          fullMark: 100,
        },
        {
          metric: 'Boundaries',
          value: Math.min(
            100,
            Math.round(
              ((bestFormat.data.fours + bestFormat.data.sixes) /
                Math.max(
                  ...formats.map((f) => f.data.fours + f.data.sixes),
                  1
                )) *
                100
            )
          ),
          fullMark: 100,
        },
      ]
    : [];

  return {
    runsByFormat,
    averageByFormat,
    strikeRateByFormat,
    fiftyVsHundred,
    boundaryAnalysis,
    performanceRadar,
  };
}

/**
 * Generate boundary analysis for a SINGLE selected format.
 */
export function generateFormatBoundaryData(
  format: PlayerBattingFormat
): BoundaryPieDataPoint[] {
  const boundaryRuns = format.fours * 4 + format.sixes * 6;
  const nonBoundaryRuns = Math.max(0, format.runs - boundaryRuns);

  return [
    { name: 'Boundary Runs', value: boundaryRuns, fill: '#f59e0b' },
    { name: 'Non-Boundary Runs', value: nonBoundaryRuns, fill: '#6366f1' },
  ];
}

/**
 * Generate radar data for a SINGLE selected format.
 * Normalizes against sensible baselines per format.
 */
export function generateFormatRadarData(
  format: PlayerBattingFormat,
  formatKey: BattingFormatKey
): RadarDataPoint[] {
  // Sensible max baselines per format for normalization
  const baselines: Record<BattingFormatKey, { runs: number; avg: number; sr: number }> = {
    all: { runs: 25000, avg: 50, sr: 100 },
    test: { runs: 15000, avg: 60, sr: 70 },
    odi: { runs: 14000, avg: 55, sr: 110 },
    t20: { runs: 4000, avg: 50, sr: 160 },
    ipl: { runs: 7000, avg: 45, sr: 150 },
  };

  const b = baselines[formatKey];

  return [
    { metric: 'Runs', value: Math.min(100, Math.round((format.runs / b.runs) * 100)), fullMark: 100 },
    { metric: 'Average', value: Math.min(100, Math.round((format.average / b.avg) * 100)), fullMark: 100 },
    { metric: 'Strike Rate', value: Math.min(100, Math.round((format.strikeRate / b.sr) * 100)), fullMark: 100 },
    { metric: 'Hundreds', value: Math.min(100, format.hundreds * 3), fullMark: 100 },
    { metric: 'Fifties', value: Math.min(100, format.fifties * 2), fullMark: 100 },
    { metric: 'Boundaries', value: Math.min(100, Math.round(((format.fours + format.sixes) / Math.max(format.innings, 1)) * 10)), fullMark: 100 },
  ];
}

// Re-export constants for use in components
export { FORMAT_COLORS, FORMAT_LABELS, FORMAT_MAP };
export type { BattingFormatKey };
