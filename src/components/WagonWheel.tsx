import React, { useMemo } from "react";

/**
 * Reusable Wagon Wheel SVG component.
 * Renders a cricket ground with shot lines from the pitch to the zone edge.
 */

type ShotBall = { runs: number; direction: string };

const ZONE_ANGLES: Record<string, number> = {
    "straight":    270,
    "mid-off":     300,
    "cover":       330,
    "point":        10,
    "third-man":    40,
    "fine-leg":    140,
    "square-leg":  170,
    "midwicket":   210,
    "mid-on":      240,
};

const ZONE_LABELS: Record<string, string> = {
    "straight": "Straight",
    "mid-off": "Mid Off",
    "cover": "Cover",
    "point": "Point",
    "third-man": "3rd Man",
    "fine-leg": "Fine Leg",
    "square-leg": "Sq. Leg",
    "midwicket": "Mid Wkt",
    "mid-on": "Mid On",
};

const RUN_COLORS: Record<number, string> = {
    0: "#64748b",
    1: "#22d3ee",
    2: "#facc15",
    3: "#fb923c",
    4: "#3b82f6",
    5: "#f97316",
    6: "#ff2e63",
};

const getRunColor = (runs: number) => RUN_COLORS[runs] || "#e2e8f0";

const getLineWidth = (runs: number) => {
    if (runs >= 6) return 5;
    if (runs >= 4) return 4;
    if (runs >= 3) return 3.5;
    if (runs >= 2) return 3;
    return 2.5;
};

// Deterministic "random" offset based on index for line variation
const pseudoRandom = (i: number) => {
    const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
    return x - Math.floor(x);
};

export const WagonWheel: React.FC<{
    balls: ShotBall[];
    size?: number;
    playerName?: string;
    compact?: boolean;
}> = ({ balls, size = 320, playerName, compact = false }) => {
    const center = size / 2;
    const radius = size * 0.42;

    // Count shots per zone for summary
    const zoneSummary = useMemo(() => {
        const summary: Record<string, { count: number; runs: number; fours: number; sixes: number }> = {};
        balls.forEach(b => {
            if (!b.direction) return;
            if (!summary[b.direction]) summary[b.direction] = { count: 0, runs: 0, fours: 0, sixes: 0 };
            summary[b.direction].count++;
            summary[b.direction].runs += b.runs;
            if (b.runs === 4) summary[b.direction].fours++;
            if (b.runs === 6) summary[b.direction].sixes++;
        });
        return summary;
    }, [balls]);

    const dirBalls = balls.filter(b => b.direction);

    // Total stats
    const totalRuns = dirBalls.reduce((s, b) => s + b.runs, 0);
    const totalBoundaries = dirBalls.filter(b => b.runs >= 4).length;

    return (
        <div className="flex flex-col items-center">
            {playerName && !compact && (
                <div className="flex items-center gap-2 mb-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em]">{playerName} — Wagon Wheel</p>
                </div>
            )}
            <svg
                viewBox={`0 0 ${size} ${size}`}
                width={compact ? 220 : size}
                height={compact ? 220 : size}
                className="drop-shadow-2xl"
            >
                {/* Outer glow */}
                <defs>
                    <radialGradient id="fieldGrad" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor="#1a3a18" />
                        <stop offset="100%" stopColor="#0f2510" />
                    </radialGradient>
                    <filter id="glow">
                        <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                        <feMerge>
                            <feMergeNode in="coloredBlur"/>
                            <feMergeNode in="SourceGraphic"/>
                        </feMerge>
                    </filter>
                </defs>

                {/* Ground */}
                <ellipse
                    cx={center} cy={center}
                    rx={radius + 4} ry={radius + 4}
                    fill="none"
                    stroke="#2d5a27"
                    strokeWidth={1}
                    opacity={0.3}
                />
                <ellipse
                    cx={center} cy={center}
                    rx={radius} ry={radius}
                    fill="url(#fieldGrad)"
                    stroke="#2d5a27"
                    strokeWidth={2}
                />

                {/* Inner circle (30-yard) */}
                <ellipse
                    cx={center} cy={center}
                    rx={radius * 0.5} ry={radius * 0.5}
                    fill="none"
                    stroke="#2d5a27"
                    strokeWidth={1}
                    strokeDasharray="6 4"
                    opacity={0.4}
                />

                {/* Pitch */}
                <rect
                    x={center - 5} y={center - radius * 0.12}
                    width={10} height={radius * 0.24}
                    fill="#c4a46c"
                    rx={3}
                    opacity={0.6}
                />

                {/* Zone sector lines (faint) */}
                {Object.entries(ZONE_ANGLES).map(([zone, angle]) => {
                    const rad = (angle * Math.PI) / 180;
                    const x2 = center + radius * Math.cos(rad);
                    const y2 = center + radius * Math.sin(rad);
                    return (
                        <line key={`sector-${zone}`} x1={center} y1={center} x2={x2} y2={y2}
                            stroke="#2d5a27" strokeWidth={0.5} opacity={0.2} strokeDasharray="2 6" />
                    );
                })}

                {/* Zone labels */}
                {Object.entries(ZONE_ANGLES).map(([zone, angle]) => {
                    const rad = (angle * Math.PI) / 180;
                    const labelDist = compact ? radius * 0.85 : radius * 0.82;
                    const lx = center + labelDist * Math.cos(rad);
                    const ly = center + labelDist * Math.sin(rad);
                    const zoneData = zoneSummary[zone];
                    return (
                        <g key={zone}>
                            <text
                                x={lx} y={ly - (zoneData && !compact ? 5 : 0)}
                                textAnchor="middle"
                                dominantBaseline="middle"
                                fill={zoneData ? '#d1d5db' : '#4b5563'}
                                fontSize={compact ? 6 : 7.5}
                                fontWeight="bold"
                                className="uppercase select-none"
                            >
                                {ZONE_LABELS[zone] || zone}
                            </text>
                            {zoneData && !compact && (
                                <text
                                    x={lx} y={ly + 8}
                                    textAnchor="middle"
                                    dominantBaseline="middle"
                                    fill="#60a5fa"
                                    fontSize={6.5}
                                    fontWeight="bold"
                                >
                                    {zoneData.runs}r ({zoneData.count})
                                </text>
                            )}
                        </g>
                    );
                })}

                {/* Shot lines */}
                {dirBalls.map((b, i) => {
                    const angle = ZONE_ANGLES[b.direction];
                    if (angle === undefined) return null;
                    const rad = (angle * Math.PI) / 180;
                    // Vary the length and angle slightly for visual variety
                    const lengthFactor = 0.45 + pseudoRandom(i) * 0.4;
                    const angleOffset = (pseudoRandom(i + 50) - 0.5) * 0.3;
                    const adjRad = rad + angleOffset;
                    const x2 = center + (radius * lengthFactor) * Math.cos(adjRad);
                    const y2 = center + (radius * lengthFactor) * Math.sin(adjRad);
                    const color = getRunColor(b.runs);
                    return (
                        <line
                            key={i}
                            x1={center} y1={center}
                            x2={x2} y2={y2}
                            stroke={color}
                            strokeWidth={getLineWidth(b.runs)}
                            strokeLinecap="round"
                            opacity={b.runs >= 4 ? 0.9 : 0.65}
                            filter={b.runs >= 4 ? "url(#glow)" : undefined}
                        />
                    );
                })}

                {/* Batting crease dot */}
                <circle cx={center} cy={center} r={4} fill="#fff" opacity={0.95} />
                <circle cx={center} cy={center} r={2} fill="#1e293b" opacity={0.8} />
            </svg>

            {/* Legend */}
            {!compact && dirBalls.length > 0 && (
                <div className="flex flex-wrap gap-4 mt-4 justify-center">
                    {[
                        { r: 1, label: "Singles", col: RUN_COLORS[1] },
                        { r: 2, label: "Doubles", col: RUN_COLORS[2] },
                        { r: 3, label: "Triples", col: RUN_COLORS[3] },
                        { r: 4, label: "Fours", col: RUN_COLORS[4] },
                        { r: 6, label: "Sixes", col: RUN_COLORS[6] },
                    ].map(l => {
                        const count = dirBalls.filter(b => b.runs === l.r).length;
                        if (count === 0) return null;
                        return (
                            <div key={l.r} className="flex items-center gap-1.5">
                                <div className="w-4 h-1.5 rounded-full" style={{ backgroundColor: l.col }} />
                                <span className="text-[10px] text-slate-400 font-bold">{l.label} <span className="text-white">{count}</span></span>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Summary stat line */}
            {!compact && dirBalls.length > 0 && (
                <div className="flex gap-6 mt-3 text-[10px] font-bold text-slate-500">
                    <span>Total: <span className="text-white text-xs">{totalRuns}</span> runs</span>
                    <span>Boundaries: <span className="text-blue-400 text-xs">{totalBoundaries}</span></span>
                    <span>Shots: <span className="text-slate-300 text-xs">{dirBalls.length}</span></span>
                </div>
            )}

            {dirBalls.length === 0 && (
                <p className="text-xs text-slate-500 mt-3 italic">No wagon wheel data available</p>
            )}
        </div>
    );
};

export default WagonWheel;
