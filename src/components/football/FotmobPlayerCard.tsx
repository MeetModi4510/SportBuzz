import React, { useState, useMemo } from 'react';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts';
import { ChevronDown, Info, Activity, Star, Calendar, Loader2, Trophy } from 'lucide-react';
import { usePlayerRecentMatches } from '../../hooks/football/usePlayerRecentMatches';
import { useFotmobPlayerTournamentStats } from '../../hooks/useFootballSquads';

const StatRow = ({ label, value, subValue, tooltip }: any) => (
  <div className="group/row flex justify-between items-center py-2 px-3 text-[13px] transition-all duration-300 rounded-xl hover:dark:bg-white/5 hover:bg-slate-200 hover:shadow-md cursor-default border border-transparent hover:dark:border-white/5 border-slate-200">
    <span className="dark:text-gray-400 text-slate-500 font-medium flex items-center gap-2 transition-colors group-hover/row:text-gray-200">
      {label}
      {tooltip && <Info className="w-3.5 h-3.5 text-blue-400 opacity-50 group-hover/row:opacity-100 transition-opacity" />}
    </span>
    <div className="text-right flex items-center gap-2 relative">
      <div className="absolute inset-0 dark:bg-white/5 bg-slate-200 rounded-md opacity-0 group-hover/row:opacity-100 transition-opacity duration-300 scale-110" />
      <span className="dark:text-white text-slate-900 font-black font-mono text-[14px] relative z-10 transition-transform duration-300 group-hover/row:scale-110 group-hover/row:dark:text-[#34D399] text-emerald-600">
        {value !== undefined && value !== null ? value : '-'}
      </span>
      {subValue && <span className="dark:text-gray-500 text-slate-600 text-[10px] font-bold relative z-10">({subValue})</span>}
    </div>
  </div>
);

const getTeamColor = (id: number) => {
  if (id === 8634) return '#e11d48'; // Bright Red/Pink for Barca
  if (id === 9847) return '#2563eb'; // Bright Blue for PSG
  if (id === 960720) return '#f472b6'; // Light Pink for Inter Miami
  const colors = ['#34D399', '#FBBF24', '#A78BFA', '#F87171', '#60A5FA'];
  return colors[(id || 0) % colors.length];
};

const COUNTRY_CODES: Record<string, string> = {
  "England": "gb-eng", "Norway": "no", "Brazil": "br", "Ghana": "gh",
  "France": "fr", "Spain": "es", "Germany": "de", "Italy": "it",
  "Portugal": "pt", "Netherlands": "nl", "Argentina": "ar", "Belgium": "be",
  "Senegal": "sn", "Egypt": "eg", "South Korea": "kr", "Japan": "jp",
  "Uruguay": "uy", "Colombia": "co", "Croatia": "hr", "Morocco": "ma",
  "Switzerland": "ch", "Denmark": "dk", "Serbia": "rs", "Poland": "pl",
  "Sweden": "se", "Wales": "gb-wls", "Scotland": "gb-sct", "USA": "us",
  "Ivory Coast": "ci", "Nigeria": "ng", "Algeria": "dz", "Cameroon": "cm",
  "Chile": "cl", "Mexico": "mx", "Canada": "ca", "Australia": "au",
  "Turkey": "tr", "Austria": "at", "Czech Republic": "cz", "Hungary": "hu", "Ukraine": "ua"
};

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const value = payload[0].value;
    const teamColor = data.teamColor || '#fff';

    if (data.isTransferPoint) {
      return (
        <div className="flex flex-col gap-3 dark:bg-[#1a1c21] bg-white/95 border border-[#34D399]/40 rounded-xl p-4 shadow-[0_8px_30px_rgba(0,0,0,0.5)] backdrop-blur-md min-w-[260px]">
          <div className="flex justify-between items-center border-b dark:border-white/10 border-slate-300 pb-2">
            <span className="text-[10px] font-bold dark:text-gray-400 text-slate-500 uppercase tracking-widest">Player Transfer</span>
            <span className="text-xs font-bold dark:text-white text-slate-900">
              {new Date(data.timestamp).toLocaleDateString('default', { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
          </div>
          <div className="flex items-center justify-between py-1">
            <div className="flex flex-col items-center gap-2">
              <div className="w-10 h-10 rounded-full dark:bg-white/5 bg-slate-200 flex items-center justify-center p-1">
                <img src={`https://images.fotmob.com/image_resources/logo/teamlogo/${data.fromTeamId}_xsmall.png`} className="w-full h-full object-contain" alt={data.fromTeamName} />
              </div>
              <span className="text-[10px] font-bold dark:text-gray-400 text-slate-500 text-center w-24 truncate">{data.fromTeamName}</span>
            </div>
            <div className="flex flex-col items-center justify-center">
              <span className="text-sm font-black dark:text-[#34D399] text-emerald-600 bg-[#34D399]/10 rounded-full p-1.5 px-3">➔</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="w-10 h-10 rounded-full dark:bg-white/5 bg-slate-200 flex items-center justify-center p-1">
                <img src={`https://images.fotmob.com/image_resources/logo/teamlogo/${data.toTeamId}_xsmall.png`} className="w-full h-full object-contain" alt={data.toTeamName} />
              </div>
              <span className="text-[10px] font-bold dark:text-white text-slate-900 text-center w-24 truncate">{data.toTeamName}</span>
            </div>
          </div>
          <div className="mt-1 flex justify-center bg-[#34D399]/10 border border-[#34D399]/20 rounded-lg py-2">
            <span className="text-sm font-black dark:text-[#34D399] text-emerald-600 tracking-wide">
              Value: €{(value / 1000000).toFixed(1)}M
            </span>
          </div>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-3 dark:bg-[#1a1c21] bg-white border dark:border-white/10 border-slate-300 rounded-full py-1.5 pl-2 pr-1.5 shadow-2xl">
        <div className="flex items-center gap-2">
          <img
            src={`https://images.fotmob.com/image_resources/logo/teamlogo/${data.teamId}_xsmall.png`}
            className="w-6 h-6 rounded-full"
            alt={data.teamName}
          />
          <div className="flex flex-col justify-center">
            <span className="text-xs font-bold leading-none" style={{ color: teamColor }}>{data.teamName}</span>
            <span className="dark:text-gray-400 text-slate-500 text-[10px] font-medium leading-none mt-1">
              {new Date(data.timestamp).toLocaleDateString('default', { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
          </div>
        </div>
        <div className="rounded-full px-3 py-1 ml-2" style={{ backgroundColor: teamColor }}>
          <span className="dark:text-white text-slate-900 font-bold text-xs shadow-sm">
            €{(value / 1000000).toFixed(1)}M
          </span>
        </div>
      </div>
    );
  }
  return null;
};

const StatColumn = ({ title, children }: any) => {
  let gradient = 'from-[#34D399]/20 to-[#3B82F6]/20';
  let accent = 'bg-[#34D399]';
  if (title === 'Shooting') { gradient = 'from-[#F87171]/20 to-[#EF4444]/5'; accent = 'bg-[#F87171]'; }
  if (title === 'Passing') { gradient = 'from-[#60A5FA]/20 to-[#3B82F6]/5'; accent = 'bg-[#60A5FA]'; }
  if (title === 'Defending') { gradient = 'from-[#A78BFA]/20 to-[#8B5CF6]/5'; accent = 'bg-[#A78BFA]'; }
  if (title === 'Possession & Discipline') { gradient = 'from-[#FBBF24]/20 to-[#F59E0B]/5'; accent = 'bg-[#FBBF24]'; }

  return (
    <div className="relative flex flex-col h-full dark:bg-[#121316] bg-slate-50 rounded-2xl border dark:border-white/5 border-slate-200 p-5 shadow-2xl transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.5)] group overflow-hidden">
      <div className={`absolute -top-24 -right-24 w-48 h-48 bg-gradient-to-br ${gradient} rounded-full blur-[50px] opacity-30 group-hover:opacity-60 transition-opacity duration-500 pointer-events-none`} />
      
      <div className="flex items-center gap-3 mb-6 pb-4 border-b dark:border-white/5 border-slate-200 relative z-10">
        <div className={`w-1.5 h-6 rounded-full ${accent} shadow-[0_0_10px_rgba(255,255,255,0.2)]`} />
        <h3 className="dark:text-white text-slate-900 font-black text-base tracking-wide uppercase">{title}</h3>
      </div>
      <div className="space-y-1.5 flex-1 relative z-10">
        {children}
      </div>
    </div>
  );
};

// Advanced 2D Shotmap Pitch Renderer
const ShotMapPitch = ({ playerId, position, totalGoals = 1, realShotmap = [] }: any) => {
  const shots = useMemo(() => {
    if (realShotmap && realShotmap.length > 0) {
      return realShotmap.map((s: any) => {
        // Fotmob uses 105x68. Always attacking x=105.
        // We draw a half-pitch (attacking bottom):
        // Top is midfield (x=52.5), Bottom is goal (x=105).
        // X maps to Top (0% to 100%)
        // Y maps to Left (0% to 100%)
        
        let rawX = s.x;
        let rawY = s.y;

        // Normalize
        const top = ((rawX - 52.5) / 52.5) * 100;
        const left = (rawY / 68) * 100;

        return {
          left,
          top,
          isGoal: s.eventType === 'Goal',
          eventType: s.eventType,
          expectedGoals: s.expectedGoals
        };
      });
    }

    const generated = [];
    const seedBase = parseInt(String(playerId).slice(0, 5)) || 12345;
    const numShots = Math.max(totalGoals * 5, 10);

    for (let i = 0; i < numShots; i++) {
      const seed = seedBase + i * 13;
      const isGoal = i < totalGoals;
      let left = 20 + (seed % 60);
      let top = 40 + ((seed * 7) % 50); // Attacking bottom
      if (!isGoal && seed % 3 === 0) left += (seed % 2 === 0 ? 15 : -15);
      left = Math.max(5, Math.min(left, 95));
      top = Math.max(5, Math.min(top, 95));
      generated.push({ left, top, isGoal });
    }
    return generated;
  }, [playerId, totalGoals, position, realShotmap]);

  return (
    <div className="relative w-full max-w-[360px] aspect-[68/52.5] bg-[#2E3C2E] border-4 border-black/80 rounded-t-xl mx-auto overflow-hidden shadow-2xl">
      {/* Grass Pattern */}
      <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 10%, rgba(255,255,255,0.15) 10%, rgba(255,255,255,0.15) 20%)' }} />

      {/* Halfway Line (Top) */}
      <div className="absolute top-0 left-0 right-0 border-t-[3px] border-white/40 pointer-events-none" />
      {/* Center Circle (Top Half) */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[26.9%] aspect-square border-[3px] border-white/40 rounded-full pointer-events-none" />

      {/* D-Arc Wrapper */}
      <div 
        className="absolute left-1/2 -translate-x-1/2 w-[26.9%] overflow-hidden pointer-events-none"
        style={{ bottom: '31.4%', height: '6.95%' }}
      >
        <div 
          className="absolute top-0 left-0 w-full border-[3px] border-white/40 rounded-full pointer-events-none"
          style={{ height: '500%' }}
        />
      </div>

      {/* Penalty Box (Bottom) - 59.3% width, 31.4% height (16.5m/52.5m) */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[59.3%] h-[31.4%] border-[3px] border-white/40 border-b-0 pointer-events-none" />

      {/* Goal Box (Bottom) - 26.9% width, 10.5% height (5.5m/52.5m) */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[26.9%] h-[10.5%] border-[3px] border-white/40 border-b-0 pointer-events-none" />

      {/* Penalty Spot - 11m from bottom -> 20.95% */}
      <div className="absolute left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-white/60 rounded-full pointer-events-none" style={{ bottom: '20.95%' }} />

      {/* Goal Posts */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[10.7%] h-[3%] bg-black/40 border-x-2 border-t-2 border-white pointer-events-none" />

      {/* Render Shots */}
      {shots.map((shot: any, idx: number) => {
        // Only render shots in attacking half
        if (shot.top < 0 || shot.top > 100) return null;

        let sizeClass = 'w-3 h-3';
        if (shot.expectedGoals && shot.expectedGoals > 0.3) sizeClass = 'w-4 h-4';
        
        return (
          <div
            key={idx}
            className={`absolute -translate-x-1/2 -translate-y-1/2 transition-transform duration-300 hover:scale-[1.8] cursor-pointer shadow-md ${
              shot.isGoal
                ? 'w-5 h-5 z-20 flex items-center justify-center bg-white rounded-full ring-2 ring-black/20'
                : `${sizeClass} rounded-full ${shot.eventType === 'AttemptSaved' ? 'bg-[#3B82F6]' : 'bg-[#EF4444]'} border-[1.5px] border-white z-10`
            }`}
            style={{ left: `${shot.left}%`, top: `${shot.top}%` }}
            title={shot.isGoal ? 'Goal' : shot.eventType || 'Miss/Saved'}
          >
            {shot.isGoal && <span className="text-[13px] leading-none drop-shadow-sm pointer-events-none">⚽</span>}
          </div>
        );
      })}
    </div>
  );
};

// --- Custom Polar Area Chart ---
const PolarAreaChart = ({ data }: { data: any[] }) => {
  const cx = 250;
  const cy = 200;
  const maxRadius = 120;
  const n = data.length || 6;
  const angleOffset = -Math.PI / 2 - Math.PI / n;

  return (
    <div className="w-full h-full flex items-center justify-center">
      <svg viewBox="0 0 500 400" className="w-full h-full overflow-visible">
        {/* Background Hexagon Grids */}
        {[0.2, 0.4, 0.6, 0.8, 1].map((scale, i) => {
          const r = maxRadius * scale;
          const points = data.map((_, j) => {
            const angle = (Math.PI * 2 * j) / n + angleOffset;
            return `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`;
          }).join(' ');
          return <polygon key={`grid-${i}`} points={points} fill="none" stroke="currentColor" className="dark:text-white/5 text-slate-200" strokeWidth={1} />;
        })}

        {/* Spokes */}
        {data.map((_, j) => {
          const angle = (Math.PI * 2 * j) / n + angleOffset;
          const x2 = cx + maxRadius * Math.cos(angle);
          const y2 = cy + maxRadius * Math.sin(angle);
          return <line key={`spoke-${j}`} x1={cx} y1={cy} x2={x2} y2={y2} stroke="currentColor" className="dark:text-white/5 text-slate-200" strokeWidth={1} />;
        })}

        {/* Value Wedges (Triangles) */}
        {data.map((d, j) => {
          const valScale = Math.max(0, Math.min(d.A / 100, 1));
          if (valScale === 0) return null; // don't draw empty wedges

          const r = maxRadius * valScale;

          const angle1 = (Math.PI * 2 * j) / n + angleOffset;
          const angle2 = (Math.PI * 2 * (j + 1)) / n + angleOffset;

          const x1 = cx + r * Math.cos(angle1);
          const y1 = cy + r * Math.sin(angle1);
          const x2 = cx + r * Math.cos(angle2);
          const y2 = cy + r * Math.sin(angle2);

          return (
            <polygon
              key={`wedge-${j}`}
              points={`${cx},${cy} ${x1},${y1} ${x2},${y2}`}
              fill="#34D399"
              fillOpacity={0.4}
              stroke="#34D399"
              strokeWidth={1.5}
              className="transition-all duration-700 ease-in-out hover:fill-opacity-60"
            />
          );
        })}

        {/* Labels in the middle of each wedge */}
        {data.map((d, j) => {
          const angleMid = (Math.PI * 2 * (j + 0.5)) / n + angleOffset;
          const labelR = maxRadius + 30;
          const lx = cx + labelR * Math.cos(angleMid);
          const ly = cy + labelR * Math.sin(angleMid);

          const isLeft = Math.cos(angleMid) < -0.1;
          const isRight = Math.cos(angleMid) > 0.1;
          const anchor = isLeft ? 'end' : isRight ? 'start' : 'middle';

          return (
            <g key={`label-${j}`} transform={`translate(${lx}, ${ly})`}>
              <text textAnchor={anchor} fill="currentColor" fontSize="24" fontWeight="900" className="dark:text-white text-slate-800 drop-shadow-md">
                <tspan x="0" dy="-0.2em">{d.A}%</tspan>
                <tspan x="0" dy="1.4em" fill="currentColor" className="dark:text-white/75 text-slate-500" fontSize="14" fontWeight="700">{d.subject}</tspan>
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};

const JerseyIcon = ({ number, color: initialColor, name, teamName }: { number: string | number, color: string, name?: string, teamName?: string }) => {
  let color = initialColor;
  if (teamName) {
    const tLower = teamName.toLowerCase();
    // Force white home kits for specific teams
    if (tLower.includes('real madrid') || tLower.includes('tottenham') || tLower === 'spurs' || tLower.includes('leeds') || tLower.includes('valencia')) {
      color = '#ffffff';
    }
  }

  const pattern = useMemo(() => {
    if (!teamName) return null;
    const t = teamName.toLowerCase();
    if (['barcelona', 'barca', 'barça'].some(x => t.includes(x))) return { id: 'v-stripes', c1: '#a50044', c2: '#004170' };
    if (['atletico', 'atlético'].some(x => t.includes(x))) return { id: 'v-stripes', c1: color, c2: '#ffffff' };
    if (t.includes('ac milan') || t === 'milan') return { id: 'v-stripes', c1: color, c2: '#000000' };
    if (t === 'inter' || t === 'inter milan' || t === 'internazionale') return { id: 'v-stripes', c1: color, c2: '#000000' };
    if (t.includes('juventus') || t.includes('newcastle')) return { id: 'v-stripes', c1: color, c2: '#ffffff' };
    if (t.includes('celtic') || t.includes('sporting')) return { id: 'h-hoops', c1: color, c2: '#ffffff' };
    if (t.includes('river plate')) return { id: 'sash', c1: '#ffffff', c2: '#da291c' };
    if (t.includes('boca juniors')) return { id: 'h-band', c1: color, c2: '#cab628' };
    if (t.includes('ajax')) return { id: 'center-band', c1: '#ffffff', c2: color };
    if (t.includes('psg') || t.includes('paris')) return { id: 'center-band', c1: color, c2: '#da291c' };
    if (t.includes('peru')) return { id: 'sash', c1: '#ffffff', c2: color };
    return null;
  }, [teamName, color]);

  const fillUrl = pattern ? `url(#pattern-${pattern.id}-${color.replace('#', '')})` : color;
  const baseColor = pattern?.id === 'sash' || pattern?.id === 'center-band' ? pattern.c1 : color;

  const getLuminance = (hexStr: string) => {
    let hex = hexStr.replace('#', '');
    if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
    if (hex.length !== 6) return 0;
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };

  const isDarkText = getLuminance(baseColor) > 160;
  const textColor = isDarkText ? '#111827' : '#ffffff';
  const textShadow = isDarkText
    ? '0px 1px 4px rgba(255,255,255,0.9), 0px 0px 3px rgba(255,255,255,0.8)'
    : '0px 1px 4px rgba(0,0,0,0.9), 0px 0px 3px rgba(0,0,0,0.8)';

  const renderDefs = () => {
    if (!pattern) return null;
    const pid = `pattern-${pattern.id}-${color.replace('#', '')}`;
    return (
      <defs>
        {pattern.id === 'v-stripes' && (
          <pattern id={pid} patternUnits="userSpaceOnUse" width="4" height="24" patternTransform="rotate(0)">
            <rect width="2" height="24" fill={pattern.c1} />
            <rect x="2" width="2" height="24" fill={pattern.c2} />
          </pattern>
        )}
        {pattern.id === 'h-hoops' && (
          <pattern id={pid} patternUnits="userSpaceOnUse" width="24" height="4" patternTransform="rotate(0)">
            <rect width="24" height="2" fill={pattern.c1} />
            <rect y="2" width="24" height="2" fill={pattern.c2} />
          </pattern>
        )}
        {pattern.id === 'sash' && (
          <pattern id={pid} patternUnits="userSpaceOnUse" width="24" height="24" patternTransform="rotate(0)">
            <rect width="24" height="24" fill={pattern.c1} />
            <polygon points="0,0 4,0 24,20 24,24" fill={pattern.c2} />
            <polygon points="0,20 4,24 0,24" fill={pattern.c2} />
            <polygon points="20,0 24,0 24,4" fill={pattern.c2} />
          </pattern>
        )}
        {pattern.id === 'h-band' && (
          <pattern id={pid} patternUnits="userSpaceOnUse" width="24" height="24">
            <rect width="24" height="24" fill={pattern.c1} />
            <rect y="10" width="24" height="4" fill={pattern.c2} />
          </pattern>
        )}
        {pattern.id === 'center-band' && (
          <pattern id={pid} patternUnits="userSpaceOnUse" width="24" height="24">
            <rect width="24" height="24" fill={pattern.c1} />
            <rect x="8" width="8" height="24" fill={pattern.c2} />
          </pattern>
        )}
      </defs>
    );
  };

  const lastName = name ? name.split(' ').pop()?.toUpperCase() : '';

  return (
    <div className="relative w-28 h-28 flex items-center justify-center transform transition-transform hover:scale-105 group">
      <div className="absolute inset-0 blur-2xl opacity-40 group-hover:opacity-60 transition-opacity" style={{ backgroundColor: baseColor }}></div>

      <svg viewBox="0 0 24 24" className="w-full h-full relative z-10 drop-shadow-2xl" fill={fillUrl}>
        {renderDefs()}
        <path d="M21.72 6.55L16.27 3.1A3.89 3.89 0 0014.17 2.5h-4.34A3.89 3.89 0 007.73 3.1L2.28 6.55A1.85 1.85 0 001.3 9.07l1 1.58c.4.63 1.25.82 1.88.42l1.62-1.02v10.45A1.5 1.5 0 007.3 22h9.4a1.5 1.5 0 001.5-1.5V10.05l1.62 1.02c.63.4 1.48.21 1.88-.42l1-1.58a1.85 1.85 0 00-.98-2.52z" />
        <path d="M12 2.5c1.1 0 2 .9 2 2h-4c0-1.1.9-2 2-2z" fill="rgba(0,0,0,0.3)" />
        <path d="M7.3 22h1.5V10.05l-3.1 1.95v8.5c0 .83.67 1.5 1.5 1.5z" fill="rgba(0,0,0,0.15)" />
        <path d="M16.7 22h-1.5V10.05l3.1 1.95v8.5c0 .83-.67 1.5-1.5 1.5z" fill="rgba(0,0,0,0.15)" />
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center z-20 pt-2 pb-1" style={{ color: textColor }}>
        {lastName && (
          <span className="font-bold text-[8px] tracking-widest uppercase opacity-90 mb-[-2px]" style={{ textShadow }}>
            {lastName}
          </span>
        )}
        <span className="font-black text-4xl tracking-tighter" style={{ textShadow }}>
          {number}
        </span>
      </div>
    </div>
  );
};

const CustomTeamLogoDot = (props: any) => {
  const { cx, cy, payload } = props;
  if (!payload.isTeamMax || !payload.teamId) return null;
  return (
    <g transform={`translate(${cx - 12}, ${cy - 28})`} className="z-50 pointer-events-none">
      <circle cx="12" cy="12" r="14" fill="#1a1c21" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
      <image
        href={`https://images.fotmob.com/image_resources/logo/teamlogo/${payload.teamId}_xsmall.png`}
        x="4" y="4" width="16" height="16"
      />
    </g>
  );
};

const getRatingStr = (ratingObj: any) => {
  if (!ratingObj) return '-';
  if (typeof ratingObj === 'number' || typeof ratingObj === 'string') return typeof ratingObj === 'number' ? ratingObj.toFixed(2) : ratingObj;
  if (ratingObj.rating && (typeof ratingObj.rating === 'number' || typeof ratingObj.rating === 'string')) {
    return typeof ratingObj.rating === 'number' ? ratingObj.rating.toFixed(2) : ratingObj.rating;
  }
  return '-';
};

const getRatingBadgeClass = (rating: string | number) => {
  const r = parseFloat(rating as string);
  if (isNaN(r)) return 'dark:text-gray-500 text-slate-600 dark:bg-white/5 bg-slate-200';
  if (r >= 8.0) return 'text-[#10b981] bg-[#10b981]/10 border border-[#10b981]/20';
  if (r >= 7.0) return 'text-[#34d399] bg-[#34d399]/10 border border-[#34d399]/20';
  if (r >= 6.0) return 'text-[#fbbf24] bg-[#fbbf24]/10 border border-[#fbbf24]/20';
  return 'text-[#f87171] bg-[#f87171]/10 border border-[#f87171]/20';
};

const SeasonCareerRow = ({ season }: { season: any }) => {
  const [expanded, setExpanded] = useState(false);
  const displayRating = getRatingStr(season.rating);

  return (
    <div className="flex flex-col border-b border-white/[0.02] last:border-0 transition-all duration-300 relative group/season">
      {/* Season Summary (Clickable) */}
      <div
        onClick={() => season.tournamentStats?.length > 0 && setExpanded(!expanded)}
        className={`flex items-center justify-between py-2.5 px-4 ${season.tournamentStats?.length > 0 ? 'cursor-pointer hover:bg-white/[0.02]' : ''}`}
      >
        <span className="dark:text-white text-slate-900 text-[13px] font-bold tracking-wide">{season.seasonName}</span>
        <div className="flex items-center justify-end w-[220px] sm:w-[380px] tabular-nums">
          <div className="w-[35px] sm:w-[50px] text-center text-gray-200 text-[13px] font-semibold">{season.appearances || '-'}</div>
          <div className="w-[35px] sm:w-[50px] text-center text-gray-200 text-[13px] font-semibold">{season.goals || '-'}</div>
          <div className="w-[35px] sm:w-[50px] text-center text-gray-200 text-[13px] font-semibold">{season.assists || '-'}</div>
          <div className="w-[50px] text-center hidden sm:flex justify-center items-center">
            {season.yellowCards > 0 ? (
              <div className="flex items-center gap-1.5"><div className="w-2.5 h-3.5 bg-yellow-400 rounded-sm shadow-sm" /><span className="dark:text-gray-300 text-slate-700 text-[13px] font-bold">{season.yellowCards}</span></div>
            ) : <span className="dark:text-gray-500 text-slate-600">-</span>}
          </div>
          <div className="w-[50px] text-center hidden sm:flex justify-center items-center">
            {season.redCards > 0 ? (
              <div className="flex items-center gap-1.5"><div className="w-2.5 h-3.5 bg-red-500 rounded-sm shadow-sm" /><span className="dark:text-gray-300 text-slate-700 text-[13px] font-bold">{season.redCards}</span></div>
            ) : <span className="dark:text-gray-500 text-slate-600">-</span>}
          </div>
          <div className="w-[50px] sm:w-[60px] flex justify-center">
            <span className={`px-2 py-0.5 rounded-md text-[12px] font-bold ${getRatingBadgeClass(displayRating)}`}>{displayRating}</span>
          </div>
          {season.tournamentStats?.length > 0 ? (
            <ChevronDown className={`w-4 h-4 dark:text-gray-500 text-slate-600 transition-transform ${expanded ? 'rotate-180' : ''} absolute right-2 opacity-0 group-hover/season:opacity-100`} />
          ) : (
            <div className="w-4 h-4 absolute right-2"></div>
          )}
        </div>
      </div>

      {/* Tournaments for this Season */}
      {expanded && season.tournamentStats && season.tournamentStats.length > 0 && (
        <div className="flex flex-col pb-2 space-y-0 animate-in slide-in-from-top-2 fade-in duration-200 border-t border-white/[0.02]">
          {season.tournamentStats.map((tourney: any, tidx: number) => {
            const tourneyAssists = tourney.assists === 'undefined' || tourney.assists === undefined || tourney.assists === null ? '-' : tourney.assists;
            const displayTourneyRating = getRatingStr(tourney.rating);
            return (
              <div key={tidx} className="flex items-center justify-between py-2 px-4 pl-8 hover:bg-white/[0.01] transition-colors group relative">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 flex items-center justify-center opacity-60 group-hover:opacity-100 transition-opacity">
                    <img src={`https://images.fotmob.com/image_resources/logo/leaguelogo/${tourney.leagueId}.png`} className="w-full h-full object-contain" alt={tourney.leagueName} onError={(e: any) => e.target.style.display = 'none'} />
                  </div>
                  <span className="dark:text-gray-400 text-slate-500 text-[12px] font-medium group-hover:text-gray-200 transition-colors">{tourney.leagueName}</span>
                </div>
                <div className="flex items-center justify-end w-[220px] sm:w-[380px] tabular-nums">
                  <div className="w-[35px] sm:w-[50px] text-center dark:text-gray-500 text-slate-600 text-[12px] font-medium">{tourney.appearances || '-'}</div>
                  <div className="w-[35px] sm:w-[50px] text-center dark:text-gray-500 text-slate-600 text-[12px] font-medium">{tourney.goals || '-'}</div>
                  <div className="w-[35px] sm:w-[50px] text-center dark:text-gray-500 text-slate-600 text-[12px] font-medium">{tourneyAssists}</div>
                  <div className="w-[50px] text-center hidden sm:flex justify-center items-center">
                    {tourney.yellowCards > 0 ? (
                      <div className="flex items-center gap-1.5"><div className="w-2 h-2.5 bg-yellow-400 rounded-sm shadow-sm opacity-80" /><span className="dark:text-gray-500 text-slate-600 text-[12px] font-bold">{tourney.yellowCards}</span></div>
                    ) : <span className="text-gray-600">-</span>}
                  </div>
                  <div className="w-[50px] text-center hidden sm:flex justify-center items-center">
                    {tourney.redCards > 0 ? (
                      <div className="flex items-center gap-1.5"><div className="w-2 h-2.5 bg-red-500 rounded-sm shadow-sm opacity-80" /><span className="dark:text-gray-500 text-slate-600 text-[12px] font-bold">{tourney.redCards}</span></div>
                    ) : <span className="text-gray-600">-</span>}
                  </div>
                  <div className="w-[50px] sm:w-[60px] flex justify-center">
                    <span className={`px-1.5 py-0.5 rounded-md text-[11px] font-bold ${getRatingBadgeClass(displayTourneyRating)}`}>{displayTourneyRating}</span>
                  </div>
                  <div className="w-4 h-4 absolute right-2 invisible"></div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

const TeamCareerRow = ({ entry, seasonEntries }: { entry: any; seasonEntries?: any[] }) => {
  const [expanded, setExpanded] = useState(false);
  const startYear = entry.startDate ? new Date(entry.startDate).getFullYear() : '';
  const endYear = entry.endDate ? new Date(entry.endDate).getFullYear() : 'now';
  const dateStr = startYear ? `${startYear} ${endYear ? `- ${endYear}` : ''}` : '';

  const teamSeasons = seasonEntries?.filter(s => s.teamId === entry.teamId) || [];

  return (
    <div className="flex flex-col border-b border-white/[0.02] last:border-0 relative">
      <div
        onClick={() => teamSeasons.length > 0 && setExpanded(!expanded)}
        className={`flex items-center justify-between py-4 px-2 sm:px-4 hover:bg-white/[0.02] transition-colors rounded-xl group ${teamSeasons.length > 0 ? 'cursor-pointer' : ''}`}
      >
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full dark:bg-white/5 bg-slate-200 flex items-center justify-center p-1.5 shadow-sm group-hover:scale-105 transition-transform">
            <img
              src={`https://images.fotmob.com/image_resources/logo/teamlogo/${entry.teamId}_xsmall.png`}
              className="w-full h-full object-contain"
              alt={entry.team}
              onError={(e: any) => e.target.style.display = 'none'}
            />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="dark:text-white text-slate-900 font-bold text-base">{entry.team}</span>
              {entry.transferType?.text && (
                <span className="hidden sm:inline-block px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider dark:bg-white/10 bg-slate-300 dark:text-gray-300 text-slate-700 ml-2">
                  {entry.transferType.text}
                </span>
              )}
            </div>
            <span className="dark:text-gray-500 text-slate-600 text-sm">{dateStr}</span>
          </div>
        </div>
        <div className="flex items-center justify-end w-[105px] sm:w-[150px] tabular-nums">
          <div className="w-[35px] sm:w-[50px] text-center dark:text-white text-slate-900 font-bold text-[15px]">{entry.appearances || '-'}</div>
          <div className="w-[35px] sm:w-[50px] text-center dark:text-white text-slate-900 font-bold text-[15px]">{entry.goals || '-'}</div>
          <div className="w-[35px] sm:w-[50px] text-center dark:text-white text-slate-900 font-bold text-[15px]">{entry.assists || '-'}</div>
          {teamSeasons.length > 0 ? (
            <ChevronDown className={`w-4 h-4 dark:text-gray-500 text-slate-600 transition-transform ${expanded ? 'rotate-180' : ''} absolute right-2 opacity-0 group-hover:opacity-100`} />
          ) : (
            <div className="w-4 h-4 absolute right-2"></div>
          )}
        </div>
      </div>

      {expanded && teamSeasons.length > 0 && (
        <div className="pl-[56px] pr-2 sm:pr-4 pb-4 animate-in fade-in slide-in-from-top-2 duration-300 mt-2">
          {/* Header for Season columns */}
          <div className="flex items-center justify-end px-4 mb-2">
            <div className="flex items-center justify-end w-[220px] sm:w-[380px] text-[10px] font-bold dark:text-gray-500 text-slate-600 uppercase tracking-widest">
              <div className="w-[35px] sm:w-[50px] text-center">App</div>
              <div className="w-[35px] sm:w-[50px] text-center">Gls</div>
              <div className="w-[35px] sm:w-[50px] text-center">Ast</div>
              <div className="w-[50px] text-center hidden sm:block">Yel</div>
              <div className="w-[50px] text-center hidden sm:block">Red</div>
              <div className="w-[50px] sm:w-[60px] text-center">Rat</div>
            </div>
          </div>
          <div className="flex flex-col border-t border-white/[0.02]">
            {teamSeasons.map((season: any, idx: number) => (
              <SeasonCareerRow key={idx} season={season} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export const FotmobPlayerCard = ({ profile, player }: { profile: any, player?: any }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'detailed' | 'career'>('overview');
  const [activeTrophyTeam, setActiveTrophyTeam] = useState<number | 'all'>('all');

  if (!profile) return null;

  // --- Extract Player Identity ---
  const { id, name, primaryTeam, mainLeague, playerInformation, traits, recentMatches: espnRecentMatches, careerHistory, statSeasons, firstSeasonStats } = profile;

  const { data: fetchedMatches, isLoading: isMatchesLoading } = usePlayerRecentMatches(name);
  const recentMatches = fetchedMatches && fetchedMatches.length > 0 ? fetchedMatches : espnRecentMatches;

  const extractInfo = (title: string) => {
    const item = playerInformation?.find((p: any) => p?.title?.toLowerCase() === title.toLowerCase());
    const val = item?.value?.fallback;
    if (val && typeof val === 'object') {
      if (val.utcTime) {
        const d = new Date(val.utcTime);
        return `${d.toLocaleString('default', { month: 'short' })} ${d.getDate()}, ${d.getFullYear()}`;
      }
      return '-';
    }
    return val || '-';
  };

  const age = extractInfo('Age');
  const height = extractInfo('Height');
  const foot = extractInfo('Preferred foot');
  const position = extractInfo('Position');
  const shirt = extractInfo('Shirt');
  const country = extractInfo('Country');
  const contractEnd = extractInfo('Contract end');

  // Market Value
  const marketValuesArray = profile.marketValues?.values || [];
  const valueObj = marketValuesArray[marketValuesArray.length - 1];
  const formattedValue = valueObj ? `€${(valueObj.value / 1000000).toFixed(1)}M` : '-';
  const transferValue = extractInfo('Market value') !== '-' ? extractInfo('Market value') : formattedValue;

  const teamColorMap = useMemo(() => {
    const map: any = {};
    if (profile.careerHistory?.careerItems?.teams) {
      profile.careerHistory.careerItems.teams.forEach((t: any) => {
        if (t.teamId) {
          map[t.teamId] = t.teamColors?.color || t.teamColors?.darkMode || t.color;
        }
      });
    }
    if (primaryTeam?.id) {
      map[primaryTeam.id] = primaryTeam.teamColors?.color || map[primaryTeam.id];
    }
    map[8634] = map[8634] || '#a50044'; // Barca
    map[9847] = map[9847] || '#004170'; // PSG
    map[960720] = map[960720] || '#f472b6'; // Inter Miami
    return map;
  }, [profile, primaryTeam]);

  const KNOWN_TEAM_COLORS: Record<string, string> = {
    'barcelona': '#a50044', 'real madrid': '#d4af37', 'atletico madrid': '#cb3524', 'atlético madrid': '#cb3524',
    'sevilla': '#d1112b', 'valencia': '#000000', 'real betis': '#008d3e', 'villarreal': '#ffc200',
    'manchester city': '#6cabdd', 'man city': '#6cabdd', 'manchester united': '#da291c', 'man united': '#da291c',
    'arsenal': '#ef0107', 'chelsea': '#034694', 'liverpool': '#c8102E', 'tottenham': '#132257',
    'newcastle': '#241f20', 'aston villa': '#95bfe5', 'psg': '#004170', 'paris saint-germain': '#004170',
    'lyon': '#da291c', 'marseille': '#00aae6', 'monaco': '#e3001b', 'lille': '#e01e22',
    'juventus': '#000000', 'inter': '#010e80', 'ac milan': '#fb090b', 'milan': '#fb090b',
    'napoli': '#12a0d7', 'roma': '#f3a536', 'lazio': '#87cefa', 'bayern': '#dc052d',
    'bayern munich': '#dc052d', 'bayern münchen': '#dc052d', 'dortmund': '#fde100', 'borussia dortmund': '#fde100',
    'leverkusen': '#e32221', 'bayer leverkusen': '#e32221', 'rb leipzig': '#dd013f', 'inter miami': '#f472b6',
    'inter miami cf': '#f472b6', 'river plate': '#da291c', 'boca juniors': '#003a78', 'ajax': '#d2122b',
    'psv': '#f00000', 'feyenoord': '#e32219', 'benfica': '#ed1c24', 'porto': '#001489',
    'sporting': '#008047', 'al nassr': '#fedf00', 'al hilal': '#0033a0', 'al ittihad': '#fcc010'
  };

  const getDynamicTeamColor = (id: number, teamName?: string) => {
    if (teamColorMap[id]) return teamColorMap[id];
    if (teamName) {
      const nameLower = teamName.toLowerCase();
      for (const [key, color] of Object.entries(KNOWN_TEAM_COLORS)) {
        if (nameLower.includes(key)) return color;
      }
    }
    const fallbackColors = ['#34D399', '#FBBF24', '#A78BFA', '#F87171', '#60A5FA', '#38BDF8', '#FB923C', '#E879F9'];
    // Use a prime multiplier to reduce collision for adjacent teams
    return fallbackColors[(id * 17) % fallbackColors.length];
  };

  const { marketValueData, gradientStops } = useMemo(() => {
    if (!marketValuesArray || marketValuesArray.length === 0) return { marketValueData: [], gradientStops: [] };

    const processed = marketValuesArray.map((mv: any) => ({
      ...mv,
      timestamp: new Date(mv.date).getTime(),
      teamColor: getDynamicTeamColor(mv.teamId, mv.teamName)
    }));

    let currentSegmentId = 0;
    let lastTeamId = processed[0].teamId;
    processed.forEach((mv: any) => {
      if (mv.teamId !== lastTeamId) {
        currentSegmentId++;
        lastTeamId = mv.teamId;
      }
      mv.segmentId = currentSegmentId;
    });

    const segmentMaxes: any = {};
    processed.forEach((mv: any) => {
      if (!segmentMaxes[mv.segmentId] || mv.value > segmentMaxes[mv.segmentId].value) {
        segmentMaxes[mv.segmentId] = mv;
      }
    });

    processed.forEach((mv: any) => {
      if (segmentMaxes[mv.segmentId] === mv) {
        mv.isTeamMax = true;
      }
    });

    const minT = processed[0].timestamp;
    const maxT = processed[processed.length - 1].timestamp;
    const total = maxT - minT;

    const stops = [];
    let currentTeamId = processed[0].teamId;
    let currentTeamName = processed[0].teamName;

    stops.push({ offset: '0%', color: getDynamicTeamColor(currentTeamId, currentTeamName) });

    const finalProcessed: any[] = [];
    finalProcessed.push(processed[0]);

    for (let i = 1; i < processed.length; i++) {
      if (processed[i].teamId !== currentTeamId) {
        const prevT = processed[i - 1].timestamp;
        const currT = processed[i].timestamp;
        const midT = (prevT + currT) / 2;
        const midValue = (processed[i - 1].value + processed[i].value) / 2;

        const pct = total > 0 ? ((midT - minT) / total) * 100 : 0;

        stops.push({ offset: `${pct}%`, color: getDynamicTeamColor(currentTeamId, currentTeamName) });
        currentTeamId = processed[i].teamId;
        currentTeamName = processed[i].teamName;
        stops.push({ offset: `${pct}%`, color: getDynamicTeamColor(currentTeamId, currentTeamName) });

        // Insert artificial data point at exact midpoint for tooltip snapping
        finalProcessed.push({
          timestamp: midT,
          value: midValue,
          teamId: currentTeamId,
          fromTeamId: processed[i - 1].teamId,
          fromTeamName: processed[i - 1].teamName,
          toTeamId: processed[i].teamId,
          toTeamName: processed[i].teamName,
          teamName: 'Transfer',
          teamColor: getDynamicTeamColor(currentTeamId, currentTeamName),
          segmentId: processed[i].segmentId,
          isTransferPoint: true,
          date: new Date(midT).toISOString()
        });
      }
      finalProcessed.push(processed[i]);
    }
    stops.push({ offset: '100%', color: getDynamicTeamColor(currentTeamId, currentTeamName) });

    return { marketValueData: finalProcessed, gradientStops: stops };
  }, [marketValuesArray, getDynamicTeamColor]);

  const highestMarketValue = useMemo(() => {
    if (!marketValueData.length) return null;
    return marketValueData.reduce((prev: any, current: any) => (prev.value > current.value) ? prev : current);
  }, [marketValueData]);

  const highestValueFormatted = highestMarketValue ? `€${(highestMarketValue.value / 1000000).toFixed(1)}M` : '-';
  const highestValueDate = highestMarketValue?.date ? new Date(highestMarketValue.date).toLocaleDateString('default', { month: 'short', day: 'numeric', year: 'numeric' }) : '-';

  // Positions Data
  const primaryPos = profile.positionDescription?.primaryPosition?.label || position;
  const otherPos = profile.positionDescription?.nonPrimaryPositions?.map((p: any) => p.label).join(', ') || '-';
  const pitchPositions = profile.positionDescription?.positions?.filter((p: any) => p.pitchPositionData) || [];

  // --- Extract Stats & Seasons ---
  const [statFilter, setStatFilter] = useState<'Total' | 'Per 90' | 'Per match'>('Total');
  const [selectedTournament, setSelectedTournament] = useState<any>(
    statSeasons?.[0]?.tournaments?.[0] ? { ...statSeasons[0].tournaments[0], seasonName: statSeasons[0].seasonName } : null
  );

  const isPrimaryTournament = selectedTournament?.tournamentId === statSeasons?.[0]?.tournaments?.[0]?.tournamentId && selectedTournament?.seasonName === statSeasons?.[0]?.seasonName;

  const { data: fetchedStats, isLoading: isStatsLoading } = useFotmobPlayerTournamentStats(
    id,
    selectedTournament?.entryId || statSeasons?.[0]?.tournaments?.[0]?.entryId,
    selectedTournament?.tournamentId || statSeasons?.[0]?.tournaments?.[0]?.tournamentId
  );
  
  const currentStats = fetchedStats || (isPrimaryTournament ? firstSeasonStats : null);
  const hasDeepStats = !!currentStats?.statsSection?.items?.length;

  const extractTopStat = (statTitle: string) => {
    const items = currentStats?.topStatCard?.items || [];
    const item = items.find((i: any) => i?.title?.toLowerCase() === statTitle.toLowerCase());
    return item?.statValue;
  };

  const extractStat = (categoryName: string, statTitle: string, applyFilter: boolean = true) => {
    const categories = currentStats?.statsSection?.items || [];
    const cat = categories.find((c: any) => c?.title?.toLowerCase() === categoryName.toLowerCase());
    const item = cat?.items?.find((i: any) => i?.title?.toLowerCase() === statTitle.toLowerCase());
    let rawValue = item?.statValue;

    if (!applyFilter || statFilter === 'Total' || !rawValue || rawValue === '-') return rawValue;

    if (!String(rawValue).includes('%') && !statTitle.toLowerCase().includes('accuracy') && !statTitle.toLowerCase().includes('rate') && statTitle !== 'Rating' && statTitle !== 'Yellow cards' && statTitle !== 'Red cards' && statTitle !== 'Clean sheets' && statTitle !== 'Matches played' && statTitle !== 'Started' && statTitle !== 'Minutes played') {
      const num = parseFloat(String(rawValue).replace(/,/g, ''));
      if (!isNaN(num)) {
        const minutesPlayedStr = extractTopStat('Minutes');
        const minutesPlayed = parseInt(String(minutesPlayedStr).replace(/,/g, '')) || 0;
        const matchesPlayedStr = extractTopStat('Matches');
        const matchesPlayed = parseInt(String(matchesPlayedStr).replace(/,/g, '')) || 0;

        if (statFilter === 'Per 90' && minutesPlayed > 0) {
          return ((num / minutesPlayed) * 90).toFixed(2);
        } else if (statFilter === 'Per match' && matchesPlayed > 0) {
          return (num / matchesPlayed).toFixed(2);
        }
      }
    }
    return rawValue;
  };

  // isPrimaryTournament is now defined above

  const getBasicStatsForSelected = () => {
    if (!selectedTournament || !careerHistory?.careerItems) return null;
    const seasonName = selectedTournament.seasonName;
    if (!seasonName) return null;
    
    const checkCategory = (cat: any) => {
      const season = cat?.seasonEntries?.find((s: any) => s.seasonName === seasonName);
      if (!season) return null;
      return season.tournamentStats?.find((t: any) => t.leagueId === selectedTournament.tournamentId || t.tournamentId === selectedTournament.tournamentId);
    };

    return checkCategory(careerHistory.careerItems.senior) || checkCategory(careerHistory.careerItems['national team']);
  };

  const selectedBasicStats = getBasicStatsForSelected();

  const goals = hasDeepStats 
      ? (extractStat('Shooting', 'Goals') || extractTopStat('Goals') || 0)
      : (selectedBasicStats?.goals || 0);

  // --- Extract Radar Traits ---
  const radarData = useMemo(() => {
    if (!traits?.items || traits.items.length === 0) return [];

    const desiredOrder = [
      "Touches",
      "Chances created",
      "Aerial duels",
      "Defensive actions",
      "Goals",
      "Shot attempts"
    ];

    // Map the traits into an object keyed by title for easy lookup
    const traitMap = traits.items.reduce((acc: any, t: any) => {
      acc[t.title] = t;
      return acc;
    }, {});

    // Build the final array strictly in the desired visual order
    return desiredOrder.map(title => {
      const t = traitMap[title];
      let val = 0;
      if (t && t.value !== undefined && t.value !== null) {
        const num = Number(t.value);
        if (!isNaN(num)) val = Math.round(num * 100);
      }
      return {
        subject: title,
        A: val,
        fullMark: 100
      };
    });
  }, [traits]);

  // --- Extract Recent Matches ---
  const ratingsData = useMemo(() => {
    if (!recentMatches || recentMatches.length === 0) return [];

    // Filter out matches without ratings FIRST, then take 10, then reverse for chronological order
    return [...recentMatches]
      .map((m: any) => {
        const date = new Date(m.matchDate?.utcTime || m.matchDate);
        return {
          match: `${date.getDate()} ${date.toLocaleString('default', { month: 'short' })}`,
          rating: parseFloat(m.ratingProps?.num || m.ratingProps?.rating || '0') || null,
          opponentName: m.opponentTeamName || m.opponentName,
          opponentId: m.opponentTeamId,
          teamId: m.teamId,
          teamName: m.teamName || m.homeTeam?.name || m.awayTeam?.name
        };
      })
      .filter((m: any) => m.rating !== null)
      .slice(0, 10)
      .reverse();
  }, [recentMatches]);

  const totalTrophies = useMemo(() => {
    return profile.trophies?.playerTrophies?.reduce((acc: number, team: any) => {
      return acc + (team.tournaments?.reduce((tAcc: number, tour: any) => tAcc + (tour.seasonsWon?.length || 0), 0) || 0);
    }, 0) || 0;
  }, [profile.trophies]);

  return (
    <div className="w-full max-w-6xl mx-auto dark:bg-[#16181c] bg-white rounded-2xl border dark:border-white/5 border-slate-200 shadow-2xl overflow-hidden dark:text-white text-slate-900 font-sans flex flex-col mb-20 relative z-30">

      {/* Header Dropdowns */}
      <div className="flex border-b dark:border-white/5 border-slate-200 px-6 py-4 dark:bg-[#121316] bg-slate-50 items-center gap-6">
        <div className="flex gap-8 font-bold text-sm tracking-wide uppercase dark:text-gray-400 text-slate-500">
          <span
            onClick={() => setActiveTab('overview')}
            className={`cursor-pointer transition-colors ${activeTab === 'overview' ? 'dark:text-[#34D399] text-emerald-600 border-b-2 border-[#34D399] pb-4 -mb-[18px]' : 'hover:dark:text-white text-slate-900 pb-4 -mb-[18px]'}`}
          >Overview</span>
          <span
            onClick={() => setActiveTab('detailed')}
            className={`cursor-pointer transition-colors ${activeTab === 'detailed' ? 'dark:text-[#34D399] text-emerald-600 border-b-2 border-[#34D399] pb-4 -mb-[18px]' : 'hover:dark:text-white text-slate-900 pb-4 -mb-[18px]'}`}
          >Detailed Season Stats</span>
          <span
            onClick={() => setActiveTab('career')}
            className={`cursor-pointer transition-colors ${activeTab === 'career' ? 'dark:text-[#34D399] text-emerald-600 border-b-2 border-[#34D399] pb-4 -mb-[18px]' : 'hover:dark:text-white text-slate-900 pb-4 -mb-[18px]'}`}
          >Career</span>
        </div>
      </div>

      <div className="p-6 md:p-8 space-y-8 dark:bg-[#16181c] bg-white min-h-[500px]">

        {/* League Dropdowns */}
        {activeTab === 'detailed' && (
          <div className="flex flex-wrap items-center justify-between gap-4 border-b dark:border-white/5 border-slate-200 pb-6 relative z-30">
            <div className="relative group">
              <button className="flex items-center gap-3 px-4 py-2 dark:bg-[#1f2126] bg-slate-100 border dark:border-white/5 border-slate-200 rounded-lg hover:dark:bg-[#2a2c33] hover:bg-slate-200 transition-colors cursor-pointer">
                <span className="font-bold text-sm">{selectedTournament ? `${selectedTournament.seasonName} - ${selectedTournament.name}` : 'All Competitions'}</span>
                <ChevronDown className="w-4 h-4 dark:text-gray-500 text-slate-600" />
              </button>
              <div className="absolute top-full left-0 mt-1 w-72 dark:bg-[#1f2126] bg-slate-100 border dark:border-white/5 border-slate-200 rounded-lg shadow-xl overflow-hidden opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 max-h-[400px] overflow-y-auto custom-scrollbar">
                {statSeasons?.map((season: any) => (
                  <div key={season.seasonName}>
                    <div className="px-4 py-2 dark:bg-[#16181c] bg-white dark:text-white text-slate-900/50 font-bold text-xs uppercase tracking-wider sticky top-0 z-10">
                      {season.seasonName}
                    </div>
                    {season.tournaments?.map((t: any) => (
                      <button
                        key={`${season.seasonName}-${t.tournamentId}`}
                        className="w-full text-left px-4 py-3 hover:dark:bg-white/5 hover:bg-slate-200 text-sm font-semibold transition-colors cursor-pointer pl-6"
                        onClick={() => setSelectedTournament({ ...t, seasonName: season.seasonName })}
                      >
                        {t.name}
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            </div>

            {/* Stat Filters */}
            {hasDeepStats && (
              <div className="flex items-center gap-1 dark:bg-[#1a1c21] bg-white p-1 rounded-lg border dark:border-white/5 border-slate-200 shadow-inner">
                {(['Total', 'Per 90', 'Per match'] as const).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setStatFilter(filter)}
                    className={`px-4 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider transition-all duration-300 ${statFilter === filter ? 'bg-[#34D399] text-black shadow-md' : 'dark:text-gray-400 text-slate-500 hover:dark:text-white text-slate-900 hover:dark:bg-white/5 hover:bg-slate-200'}`}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'overview' ? (
          <div className={`transition-opacity duration-300 space-y-8`}>
            {/* Header Profile Section - Premium Overhaul */}
            <div className="relative dark:bg-[#0e1015] bg-slate-50 rounded-2xl border dark:border-white/5 border-slate-200 p-8 md:p-12 flex flex-col md:flex-row gap-10 items-center md:items-end overflow-hidden">
              {/* Huge Team Logo Watermark */}
              {primaryTeam?.id && (
                <>
                  <div className="absolute -right-16 -bottom-16 opacity-[0.03] pointer-events-none grayscale mix-blend-overlay">
                    <img src={`https://images.fotmob.com/image_resources/logo/teamlogo/${primaryTeam.id}.png`} className="w-[400px] h-[400px] object-contain" alt="" />
                  </div>
                  {/* Glowing Accent */}
                  <div className="absolute right-0 top-0 w-1/2 h-full opacity-20 pointer-events-none" style={{ background: `radial-gradient(ellipse at right, ${primaryTeam?.teamColors?.color || '#34D399'} 0%, transparent 70%)` }}></div>
                </>
              )}

              {/* Profile Image with Glowing Ring */}
              <div className="relative shrink-0">
                <div className="absolute inset-0 rounded-full blur-xl opacity-40" style={{ backgroundColor: primaryTeam?.teamColors?.color || '#34D399' }}></div>
                <div className="w-36 h-36 rounded-full dark:bg-[#1a1c21] bg-white border-4 flex items-center justify-center relative overflow-hidden z-10 shadow-2xl" style={{ borderColor: primaryTeam?.teamColors?.color || '#252830' }}>
                  <img src={`https://images.fotmob.com/image_resources/playerimages/${id}.png`} alt={name} className="w-full h-full object-cover object-top" />
                </div>
              </div>

              {/* Info Container */}
              <div className="flex flex-col flex-1 z-10 w-full text-center md:text-left justify-end">
                <div className="flex flex-col md:flex-row md:items-end justify-between w-full gap-6">
                  <div>
                    <h1 className="text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r dark:from-white dark:to-white/70 from-slate-900 to-slate-600 tracking-tighter drop-shadow-xl mb-4">{name}</h1>

                    <div className="flex flex-wrap justify-center md:justify-start items-center gap-4 text-sm font-semibold">
                      {/* Team Badge */}
                      <div className="flex items-center gap-3 dark:bg-white/5 bg-slate-200 border dark:border-white/10 border-slate-300 px-4 py-2 rounded-full backdrop-blur-md shadow-lg">
                        {primaryTeam?.id ? (
                          <img
                            src={`https://images.fotmob.com/image_resources/logo/teamlogo/${primaryTeam.id}_xsmall.png`}
                            className="w-5 h-5 object-contain"
                            alt={primaryTeam.name}
                          />
                        ) : player?.ccode && (
                          <img
                            src={`https://images.fotmob.com/image_resources/logo/teamlogo/${player.ccode}_xsmall.png`}
                            className="w-5 h-5 rounded-full object-contain"
                            alt={player?.cname || ''}
                          />
                        )}
                        <span className="dark:text-white text-slate-900 font-bold">{primaryTeam?.name || player?.cname || mainLeague?.name || ''}</span>
                      </div>

                      {/* Position Badge */}
                      <div className="flex items-center gap-2 dark:bg-[#1a1c21] bg-white border dark:border-white/10 border-slate-300 px-4 py-2 rounded-full shadow-inner">
                        <span className="w-2 h-2 rounded-full shadow-[0_0_8px_rgba(255,255,255,0.5)]" style={{ backgroundColor: primaryTeam?.teamColors?.color || '#34D399' }}></span>
                        <span className="dark:text-gray-300 text-slate-700 font-bold uppercase tracking-wider text-[11px]">{primaryPos}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right Side: Big Shirt Number Watermark */}
                  {shirt !== '-' && (
                    <div className="hidden md:flex flex-col items-end dark:opacity-20 opacity-60 hover:opacity-40 transition-opacity">
                      <span className="text-[120px] font-black tracking-tighter leading-[0.8]" style={{ color: primaryTeam?.teamColors?.color || '#34D399' }}>#{shirt}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* NEW: Identity Matrix & Position Mini-Pitch */}
            <div className="flex flex-col lg:flex-row dark:bg-[#1a1c21] bg-white rounded-2xl border dark:border-white/5 border-slate-200 overflow-hidden">

              {/* Premium Info Matrix - Ultra Clean & Minimal */}
              <div className="flex-1 flex flex-col relative border-b lg:border-b-0 lg:border-r dark:border-white/5 border-slate-200 dark:bg-[#1a1c21] bg-white overflow-hidden">

                {/* Top Half: Hero */}
                <div className="p-8 md:p-10 relative flex flex-col md:flex-row items-center gap-10 lg:gap-14">
                  {/* Background Gradient */}
                  <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ background: `linear-gradient(135deg, ${primaryTeam?.teamColors?.color || '#34D399'} 0%, transparent 100%)` }}></div>

                  {/* Jersey */}
                  <div className="relative z-10 flex flex-col items-center">
                    <JerseyIcon
                      number={shirt !== '-' ? shirt : '00'}
                      color={primaryTeam?.teamColors?.color || '#34D399'}
                      name={name}
                      teamName={primaryTeam?.name || player?.cname || mainLeague?.name}
                    />
                  </div>

                  {/* Value */}
                  <div className="relative z-10 flex flex-col text-center md:text-left">
                    <span className="text-[11px] font-bold dark:text-gray-400 text-slate-500 uppercase tracking-[0.2em] mb-2 flex items-center justify-center md:justify-start gap-2">
                      <span className="w-2 h-2 rounded-full shadow-[0_0_8px_rgba(255,255,255,0.3)]" style={{ backgroundColor: primaryTeam?.teamColors?.color || '#34D399' }}></span>
                      Transfer Value
                    </span>
                    <span className="text-6xl font-black dark:text-white text-slate-900 tracking-tighter drop-shadow-md">{transferValue}</span>
                  </div>
                </div>

                {/* Bottom Half: Stats List */}
                <div className="dark:bg-[#121316] bg-slate-50 p-8 md:px-10 border-t dark:border-white/5 border-slate-200 relative z-10 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-6 w-full">
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] font-bold dark:text-gray-500 text-slate-600 uppercase tracking-[0.2em]">Age</span>
                      <span className="text-3xl font-black dark:text-white text-slate-900">{age}</span>
                    </div>
                    <div className="hidden md:block w-px h-12 dark:bg-white/10 bg-slate-300"></div>
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] font-bold dark:text-gray-500 text-slate-600 uppercase tracking-[0.2em]">Height</span>
                      <span className="text-3xl font-black dark:text-white text-slate-900">{height}</span>
                    </div>
                    <div className="hidden md:block w-px h-12 dark:bg-white/10 bg-slate-300"></div>
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] font-bold dark:text-gray-500 text-slate-600 uppercase tracking-[0.2em]">Foot</span>
                      <span className="text-3xl font-black dark:text-white text-slate-900 capitalize">{foot}</span>
                    </div>
                    <div className="hidden md:block w-px h-12 dark:bg-white/10 bg-slate-300"></div>
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] font-bold dark:text-gray-500 text-slate-600 uppercase tracking-[0.2em]">Country</span>
                      <div className="flex items-center gap-3">
                        {COUNTRY_CODES[country] && (
                          <img
                            src={`https://flagcdn.com/w40/${COUNTRY_CODES[country]}.png`}
                            className="w-8 h-auto shadow-sm"
                            alt={country}
                            onError={(e: any) => { e.currentTarget.style.display = 'none'; }}
                          />
                        )}
                        <span className="text-3xl font-black dark:text-white text-slate-900">{country}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Contract Footer */}
                {contractEnd !== '-' && (
                  <div className="dark:bg-[#08080a] bg-slate-100 p-4 px-8 md:px-10 border-t dark:border-white/5 border-slate-200 flex items-center justify-between relative z-10">
                    <span className="text-[10px] font-bold dark:text-gray-500 text-slate-600 uppercase tracking-[0.2em] flex items-center gap-2">
                      <Calendar className="w-4 h-4 dark:text-gray-400 text-slate-500" />
                      Contract Expires
                    </span>
                    <span className="text-xs font-bold dark:text-white text-slate-900/90">{contractEnd}</span>
                  </div>
                )}
              </div>

              {/* Right: Position & Pitch */}
              <div className="flex-1 p-6 lg:p-10 flex flex-col sm:flex-row gap-8 items-center sm:items-start justify-between bg-gradient-to-br dark:from-[#16181d] dark:to-[#121316] from-slate-100 to-slate-200">
                <div className="flex flex-col flex-1 pt-2 w-full sm:w-auto">
                  <div className="flex items-center gap-3 mb-8">
                    <span className="w-2 h-2 rounded-full shadow-[0_0_8px_rgba(255,255,255,0.3)]" style={{ backgroundColor: primaryTeam?.teamColors?.color || '#34D399' }}></span>
                    <h3 className="text-[10px] font-bold dark:text-gray-400 text-slate-500 uppercase tracking-[0.2em]">Position Overview</h3>
                  </div>

                  <div className="space-y-1 mb-6 dark:bg-white/5 bg-slate-200 p-5 rounded-2xl border dark:border-white/5 border-slate-200 shadow-inner">
                    <span className="text-[10px] font-bold dark:text-gray-500 text-slate-600 uppercase tracking-widest block mb-2">Primary Role</span>
                    <span className="text-xl md:text-2xl font-black dark:text-white text-slate-900 tracking-tight block">{primaryPos}</span>
                  </div>

                  {otherPos !== '-' && (
                    <div className="space-y-1 p-5">
                      <span className="text-[10px] font-bold dark:text-gray-500 text-slate-600 uppercase tracking-widest block mb-2">Other Roles</span>
                      <span className="text-sm font-semibold dark:text-gray-400 text-slate-500 block leading-snug">{otherPos}</span>
                    </div>
                  )}
                </div>

                {/* Mini Pitch - Premium 3D Feel */}
                <div
                  className="w-[180px] sm:w-[160px] lg:w-[220px] aspect-[2/3] rounded-2xl border dark:border-white/10 border-slate-300 relative overflow-hidden flex-shrink-0 shadow-[0_10px_40px_rgba(0,0,0,0.6)] transform transition-transform duration-500 hover:scale-105 bg-gradient-to-b dark:from-[#1a1d24] dark:to-[#13151a] from-slate-200 to-slate-300"
                >
                  {/* Grass Stripes Pattern */}
                  <div
                    className="absolute inset-0 opacity-40 pointer-events-none"
                    style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 10%, rgba(128,128,128,0.08) 10%, rgba(128,128,128,0.08) 20%)' }}
                  ></div>

                  {/* Inner Field Lines */}
                  <div className="absolute inset-4 border-[1.5px] dark:border-white/15 border-slate-400/40 pointer-events-none rounded-md" />
                  <div className="absolute top-1/2 left-4 right-4 border-t-[1.5px] dark:border-white/15 border-slate-400/40 pointer-events-none" />
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-14 h-14 rounded-full border-[1.5px] dark:border-white/15 border-slate-400/40 pointer-events-none" />
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1 h-1 rounded-full dark:bg-white/30 bg-slate-400/60 pointer-events-none" />
                  <div className="absolute top-4 left-1/2 -translate-x-1/2 w-24 h-12 border-[1.5px] dark:border-white/15 border-slate-400/40 border-t-0 pointer-events-none" />
                  <div className="absolute top-4 left-1/2 -translate-x-1/2 w-10 h-4 border-[1.5px] dark:border-white/15 border-slate-400/40 border-t-0 pointer-events-none" />
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-24 h-12 border-[1.5px] dark:border-white/15 border-slate-400/40 border-b-0 pointer-events-none" />
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-10 h-4 border-[1.5px] dark:border-white/15 border-slate-400/40 border-b-0 pointer-events-none" />
                  <div className="absolute top-16 left-1/2 -translate-x-1/2 w-10 h-5 border-[1.5px] dark:border-white/15 border-slate-400/40 border-t-0 rounded-b-full pointer-events-none" />
                  <div className="absolute bottom-16 left-1/2 -translate-x-1/2 w-10 h-5 border-[1.5px] dark:border-white/15 border-slate-400/40 border-b-0 rounded-t-full pointer-events-none" />

                  {/* Dots */}
                  {pitchPositions.map((p: any, i: number) => {
                    const isMain = p.isMainPosition;
                    const dotColor = isMain ? (primaryTeam?.teamColors?.color || '#34D399') : undefined;
                    return (
                      <div
                        key={i}
                        className={`absolute -translate-x-1/2 -translate-y-1/2 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center justify-center transition-all duration-300 cursor-default ${isMain ? 'dark:text-white text-slate-900 z-20 scale-125 drop-shadow-[0_4px_8px_rgba(0,0,0,0.8)] border dark:border-white/20 border-slate-400' : 'dark:text-gray-400 text-slate-600 dark:bg-[#2c303a] bg-slate-200/90 z-10 hover:scale-110 border dark:border-white/10 border-slate-400/50'}`}
                        style={{
                          left: `${p.pitchPositionData.right * 100}%`,
                          top: `${p.pitchPositionData.top * 100}%`,
                          backgroundColor: dotColor,
                          boxShadow: isMain ? `0 0 15px ${dotColor}80` : 'none'
                        }}
                      >
                        {p.strPosShort?.label}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Transfer Value History Graph */}
            {marketValueData.length > 0 && (
              <div className="bg-gradient-to-b dark:from-[#181a1f] dark:to-[#121316] from-slate-200 to-slate-300 rounded-[2rem] border dark:border-white/10 border-slate-300 p-6 md:p-8 relative overflow-hidden shadow-[inset_0_1px_1px_rgba(255,255,255,0.05),0_10px_30px_rgba(0,0,0,0.5)]">
                {/* Background Glow */}
                <div className="absolute -top-32 -right-32 w-96 h-96 bg-[#34D399]/5 rounded-full blur-3xl pointer-events-none"></div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 mb-8 relative z-10">
                  <div className="flex items-center gap-3">
                    <div className="dark:bg-white/5 bg-slate-200 border dark:border-white/10 border-slate-300 p-2 rounded-xl shadow-inner">
                      <Activity className="w-5 h-5 dark:text-[#34D399] text-emerald-600" />
                    </div>
                    <h3 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r dark:from-white dark:to-gray-400 from-slate-900 to-slate-500">
                      Recent Transfer Value: <span className="dark:text-white text-slate-900">{transferValue}</span>
                    </h3>
                  </div>
                  {highestMarketValue && (
                    <div className="flex items-center gap-3 mt-1 sm:mt-0 sm:ml-auto">
                      <div className="dark:bg-[#2b2d32] bg-slate-200 border dark:border-white/5 border-slate-200 rounded-full px-4 py-1.5 flex items-center gap-2 shadow-inner">
                        <span className="dark:text-gray-400 text-slate-500 text-xs font-bold uppercase tracking-wider">Peak</span>
                        <span className="dark:text-white text-slate-900 text-sm font-black">{highestValueFormatted}</span>
                        <span className="dark:text-[#34D399] text-emerald-600 text-xs font-bold">({highestValueDate})</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="dark:bg-[#121316] bg-slate-50/50 rounded-2xl p-4 pt-8 h-[320px] w-full relative z-10 border dark:border-white/5 border-slate-200 shadow-[inset_0_2px_15px_rgba(0,0,0,0.5)]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={marketValueData} margin={{ top: 45, right: 30, left: -15, bottom: 0 }}>
                      <defs>
                        <linearGradient id="lineColor" x1="0" y1="0" x2="1" y2="0">
                          {gradientStops.map((s: any, i: number) => (
                            <stop key={i} offset={s.offset} stopColor={s.color} />
                          ))}
                        </linearGradient>
                        <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#34D399" stopOpacity={0.3} />
                          <stop offset="100%" stopColor="#34D399" stopOpacity={0} />
                        </linearGradient>
                      </defs>

                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="dark:text-white/[0.03] text-slate-400/20" />

                      <XAxis
                        dataKey="timestamp"
                        type="number"
                        domain={['dataMin', 'dataMax']}
                        ticks={(() => {
                          const minT = marketValueData[0].timestamp;
                          const maxT = marketValueData[marketValueData.length - 1].timestamp;
                          const minYear = new Date(minT).getFullYear();
                          const maxYear = new Date(maxT).getFullYear();
                          const tks = [];
                          for (let y = minYear; y <= maxYear; y++) {
                            const t = new Date(`${y}-01-01T00:00:00Z`).getTime();
                            if (t >= minT && t <= maxT) tks.push(t);
                          }
                          return tks;
                        })()}
                        tickFormatter={(val) => new Date(val).getFullYear().toString()}
                        stroke="currentColor"
                        className="dark:text-white/20 text-slate-400"
                        tick={{ fill: 'currentColor', fontSize: 12, fontWeight: 500 }}
                        tickLine={false}
                        axisLine={false}
                        minTickGap={30}
                        dy={10}
                      />

                      <YAxis
                        domain={[0, highestMarketValue?.value || 'auto']}
                        ticks={(() => {
                          if (!highestMarketValue) return [];
                          const maxVal = highestMarketValue.value;
                          const step = maxVal / 4;
                          return [0, step, step * 2, step * 3, maxVal];
                        })()}
                        tickFormatter={(val) => `€${(val / 1000000).toFixed(0)}M`}
                        stroke="currentColor"
                        className="dark:text-white/20 text-slate-400"
                        tick={{ fill: 'currentColor', fontSize: 12, fontWeight: 600 }}
                        tickLine={false}
                        axisLine={false}
                      />

                      <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'currentColor', className: 'dark:text-white/20 text-slate-400', strokeWidth: 1, strokeDasharray: '4 4' }} />

                      <Area
                        type="monotone"
                        dataKey="value"
                        stroke="url(#lineColor)"
                        strokeWidth={4}
                        fillOpacity={0.45}
                        fill="url(#lineColor)"
                        activeDot={{ r: 6, fill: 'white', stroke: '#1a1c21', strokeWidth: 2 }}
                        dot={<CustomTeamLogoDot />}
                        isAnimationActive={true}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left Column */}
              <div className="space-y-8">
                {/* Ratings Trend */}
                <div className="dark:bg-[#1a1c21] bg-white rounded-2xl border dark:border-white/5 border-slate-200 p-6 h-[312px] flex flex-col">
                  <h3 className="text-lg font-bold dark:text-white text-slate-900 mb-6 flex items-center gap-2 shrink-0">
                    <Activity className="w-5 h-5 dark:text-[#34D399] text-emerald-600" />
                    Recent Match Ratings
                  </h3>
                  <div className="flex-1 w-full flex items-center justify-center min-h-0">
                    {isMatchesLoading ? (
                      <div className="flex flex-col items-center gap-3 dark:text-gray-500 text-slate-600">
                        <Loader2 className="w-6 h-6 animate-spin dark:text-[#34D399] text-emerald-600" />
                        <span className="text-sm">Loading match ratings...</span>
                      </div>
                    ) : ratingsData.length === 0 ? (
                      <div className="text-sm dark:text-gray-500 text-slate-600">No recent match ratings available.</div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={ratingsData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="dark:text-white/5 text-slate-400/30" />
                          <XAxis dataKey="match" stroke="currentColor" className="dark:text-white/30 text-slate-400" tick={{ fill: 'currentColor', fontSize: 12 }} tickLine={false} axisLine={false} />
                          <YAxis domain={['auto', 'auto']} stroke="currentColor" className="dark:text-white/30 text-slate-400" tick={{ fill: 'currentColor', fontSize: 12 }} tickLine={false} axisLine={false} width={30} />
                          <Tooltip
                            cursor={{ stroke: 'currentColor', className: 'dark:text-white/10 text-slate-300', strokeWidth: 1 }}
                            content={({ active, payload, label }) => {
                              if (active && payload && payload.length) {
                                const data = payload[0].payload;
                                return (
                                  <div className="dark:bg-[#1f2126] bg-slate-100 border dark:border-white/10 border-slate-300 p-3 rounded-xl shadow-2xl min-w-[140px]">
                                    <p className="dark:text-gray-400 text-slate-500 text-xs mb-2 font-medium uppercase tracking-wider">{label}</p>
                                    <div className="flex items-center gap-2 mb-2 pb-2 border-b dark:border-white/5 border-slate-200">
                                      <img src={`https://images.fotmob.com/image_resources/logo/teamlogo/${data.opponentId}_xsmall.png`} className="w-5 h-5 object-contain drop-shadow-md" alt="" onError={(e: any) => e.target.style.display = 'none'} />
                                      <span className="dark:text-white text-slate-900 font-bold text-sm truncate max-w-[120px]">{data.opponentName}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                      <span className="dark:text-gray-400 text-slate-500 text-xs font-medium">RATING</span>
                                      <span className="dark:text-[#34D399] text-emerald-600 font-black text-base">{data.rating.toFixed(1)}</span>
                                    </div>
                                  </div>
                                );
                              }
                              return null;
                            }}
                          />
                          <Line
                            type="monotone"
                            dataKey="rating"
                            stroke="currentColor"
                            className="dark:text-white/15 text-slate-500"
                            strokeWidth={2}
                            activeDot={(props: any) => {
                              const { cx, cy, payload } = props;
                              if (!cx || !cy) return null;
                              return (
                                <g>
                                  <circle cx={cx} cy={cy} r={14} className="dark:fill-[#1f2126] fill-slate-100" stroke="#34D399" strokeWidth={2} />
                                  <image
                                    href={`https://images.fotmob.com/image_resources/logo/teamlogo/${payload.teamId}_xsmall.png`}
                                    x={cx - 10}
                                    y={cy - 10}
                                    width="20"
                                    height="20"
                                  />
                                </g>
                              );
                            }}
                            dot={(props: any) => {
                              const { cx, cy, payload } = props;
                              if (!cx || !cy) return null;
                              return (
                                <g>
                                  <circle cx={cx} cy={cy} r={10} className="dark:fill-[#1a1c21] fill-white dark:stroke-white/10 stroke-slate-300" strokeWidth={1} />
                                  <image
                                    href={`https://images.fotmob.com/image_resources/logo/teamlogo/${payload.teamId}_xsmall.png`}
                                    x={cx - 7}
                                    y={cy - 7}
                                    width="14"
                                    height="14"
                                  />
                                </g>
                              );
                            }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>

                {/* Match Stats Table */}
                <div className="dark:bg-[#1a1c21] bg-white rounded-2xl border dark:border-white/5 border-slate-200 p-6">
                  <h3 className="text-lg font-bold dark:text-white text-slate-900 mb-6 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-blue-400" />
                    Match stats
                  </h3>
                  {isMatchesLoading ? (
                    <div className="flex flex-col items-center justify-center py-10 dark:text-gray-500 text-slate-600">
                      <Loader2 className="w-6 h-6 animate-spin text-blue-400 mb-3" />
                      <span className="text-sm">Loading matches...</span>
                    </div>
                  ) : !recentMatches || recentMatches.length === 0 ? (
                    <div className="text-sm dark:text-gray-500 text-slate-600 py-10 text-center">No recent match stats available.</div>
                  ) : (
                    <div className="overflow-x-auto -mx-6 px-6">
                      <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead>
                          <tr className="dark:text-gray-500 text-slate-600 border-b dark:border-white/5 border-slate-200">
                            <th className="pb-3 font-medium">Date</th>
                            <th className="pb-3 font-medium">Opponent</th>
                            <th className="pb-3 font-medium text-center">Result</th>
                            <th className="pb-3 font-medium text-center" title="Minutes">Min</th>
                            <th className="pb-3 font-medium text-center" title="Goals">G</th>
                            <th className="pb-3 font-medium text-center" title="Assists">A</th>
                            <th className="pb-3 font-medium text-center" title="Yellow Cards"><div className="w-[10px] h-3.5 bg-yellow-400 mx-auto shadow-sm"></div></th>
                            <th className="pb-3 font-medium text-center" title="Red Cards"><div className="w-[10px] h-3.5 bg-red-500 mx-auto shadow-sm"></div></th>
                            <th className="pb-3 font-medium text-center">Rating</th>
                          </tr>
                        </thead>
                        <tbody>
                          {recentMatches.slice(0, 10).map((m: any, i: number) => {
                            const date = new Date(m.matchDate?.utcTime || m.matchDate);
                            const dateStr = `${date.toLocaleString('default', { month: 'short' })} ${date.getDate()}`;

                            const isHome = m.isHomeTeam;
                            const teamScore = isHome ? m.homeScore : m.awayScore;
                            const oppScore = isHome ? m.awayScore : m.homeScore;
                            let resultChar = 'D';
                            let resultColor = 'dark:text-gray-400 text-slate-500';
                            if (teamScore > oppScore) { resultChar = 'W'; resultColor = 'text-green-400'; }
                            if (teamScore < oppScore) { resultChar = 'L'; resultColor = 'text-red-400'; }

                            const rating = parseFloat(m.ratingProps?.num || m.ratingProps?.rating || '0');
                            let ratingBg = 'bg-gray-600';
                            if (rating >= 8.0) ratingBg = 'bg-[#10b981]'; // Green
                            else if (rating >= 7.0) ratingBg = 'bg-[#34d399]'; // Light Green
                            else if (rating >= 6.0) ratingBg = 'bg-[#fbbf24]'; // Yellow
                            else if (rating > 0) ratingBg = 'bg-[#ef4444]'; // Red

                            return (
                              <tr key={m.id || i} className="border-b dark:border-white/5 border-slate-200 hover:dark:bg-white/5 hover:bg-slate-200 transition-colors">
                                <td className="py-3 dark:text-gray-400 text-slate-500 font-medium">{dateStr}</td>
                                <td className="py-3">
                                  <div className="flex items-center gap-2">
                                    <img src={`https://images.fotmob.com/image_resources/logo/teamlogo/${m.opponentTeamId}_xsmall.png`} className="w-5 h-5 object-contain" alt="" onError={(e: any) => e.target.style.display = 'none'} />
                                    <span className="dark:text-white text-slate-900 font-medium truncate max-w-[120px]">{m.opponentTeamName || m.opponentName}</span>
                                  </div>
                                </td>
                                <td className="py-3 text-center">
                                  <span className={`font-black text-[13px] tracking-wide mr-1.5 ${resultColor}`}>{resultChar}</span>
                                  <span className="dark:text-white text-slate-900/70 font-medium">{teamScore} - {oppScore}</span>
                                </td>
                                <td className="py-3 text-center dark:text-gray-400 text-slate-500 font-medium">{m.minutesPlayed || 0}</td>
                                <td className={`py-3 text-center font-bold ${m.goals > 0 ? 'dark:text-white text-slate-900' : 'dark:text-white text-slate-900/20 font-medium'}`}>{m.goals || 0}</td>
                                <td className={`py-3 text-center font-bold ${m.assists > 0 ? 'dark:text-white text-slate-900' : 'dark:text-white text-slate-900/20 font-medium'}`}>{m.assists || 0}</td>
                                <td className={`py-3 text-center font-bold ${m.yellowCards > 0 ? 'text-yellow-400' : 'dark:text-white text-slate-900/20 font-medium'}`}>{m.yellowCards || 0}</td>
                                <td className={`py-3 text-center font-bold ${m.redCards > 0 ? 'text-red-500' : 'dark:text-white text-slate-900/20 font-medium'}`}>{m.redCards || 0}</td>
                                <td className="py-3 text-center">
                                  {rating > 0 ? (
                                    <div className={`dark:text-white text-slate-900 text-xs font-black px-2.5 py-1 rounded-md ${ratingBg} inline-block shadow-sm`}>
                                      {rating.toFixed(1)}
                                    </div>
                                  ) : (
                                    <span className="dark:text-white text-slate-900/20 font-bold">-</span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column */}
              <div className="lg:relative">
                <div className="lg:absolute lg:inset-0 flex flex-col space-y-8 w-full h-full">
                  {/* Season Attributes */}
                  <div className="dark:bg-[#1a1c21] bg-white rounded-2xl border dark:border-white/5 border-slate-200 p-6 h-[312px]">
                    <h3 className="text-lg font-bold dark:text-white text-slate-900 mb-2 flex items-center gap-2">
                      <Star className="w-5 h-5 dark:text-[#34D399] text-emerald-600" />
                      Player Traits
                    </h3>
                    <div className="h-full w-full -mt-4 relative">
                      {radarData.length > 0 ? (
                        <PolarAreaChart data={radarData} />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-sm dark:text-gray-500 text-slate-600">No trait data available</div>
                      )}
                    </div>
                  </div>

                  {/* Trophies */}
                  <div className="dark:bg-[#1a1c21] bg-white rounded-2xl border dark:border-white/5 border-slate-200 p-6 flex-1 flex flex-col min-h-[500px] lg:min-h-0">
                    <h3 className="text-lg font-bold dark:text-white text-slate-900 mb-6 flex items-center gap-2 shrink-0">
                      <Trophy className="w-5 h-5 text-yellow-400" />
                      Trophies
                      {totalTrophies > 0 && <span className="dark:text-gray-400 text-slate-500 text-sm font-medium ml-1">({totalTrophies})</span>}
                    </h3>

                    {profile.trophies?.playerTrophies && profile.trophies.playerTrophies.length > 0 ? (
                      <div className="flex flex-col flex-1 min-h-0">
                        {/* Team Filters */}
                        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-2 scrollbar-thin shrink-0">
                          <button
                            onClick={() => setActiveTrophyTeam('all')}
                            className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap shrink-0 transition-all border ${activeTrophyTeam === 'all' ? 'dark:bg-[#2a2c33] bg-slate-200 dark:text-white text-slate-900 dark:border-white/10 border-slate-300 shadow-md' : 'bg-transparent dark:text-gray-500 text-slate-600 border-transparent hover:dark:bg-white/5 hover:bg-slate-200 hover:dark:text-gray-300 text-slate-700'}`}
                          >
                            All Teams
                          </button>
                          {profile.trophies.playerTrophies.map((team: any, i: number) => (
                            <button
                              key={i}
                              onClick={() => setActiveTrophyTeam(team.teamId)}
                              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap shrink-0 transition-all border ${activeTrophyTeam === team.teamId ? 'dark:bg-[#2a2c33] bg-slate-200 dark:text-white text-slate-900 dark:border-white/10 border-slate-300 shadow-md' : 'bg-transparent dark:text-gray-500 text-slate-600 border-transparent hover:dark:bg-white/5 hover:bg-slate-200 hover:dark:text-gray-300 text-slate-700'}`}
                            >
                              <img src={`https://images.fotmob.com/image_resources/logo/teamlogo/${team.teamId}_xsmall.png`} className="w-5 h-5 object-contain" alt="" onError={(e: any) => e.target.style.display = 'none'} />
                              {team.teamName}
                            </button>
                          ))}
                        </div>

                        {/* Trophies List */}
                        <div className="flex-1 overflow-y-auto pr-2 space-y-4 scrollbar-thin">
                          {profile.trophies.playerTrophies
                            .filter((team: any) => activeTrophyTeam === 'all' || activeTrophyTeam === team.teamId)
                            .map((team: any, teamIdx: number) => (
                              <div key={teamIdx} className="dark:bg-[#121316] bg-slate-50 border dark:border-white/5 border-slate-200 rounded-2xl overflow-hidden">
                                {/* Team Header */}
                                <div className="flex items-center gap-3 p-4 dark:bg-white/5 bg-slate-200 border-b dark:border-white/5 border-slate-200">
                                  <div className="w-10 h-10 rounded-full dark:bg-white/5 bg-slate-200 flex items-center justify-center p-1.5 shrink-0">
                                    <img src={`https://images.fotmob.com/image_resources/logo/teamlogo/${team.teamId}_xsmall.png`} className="w-full h-full object-contain" alt="" onError={(e: any) => e.target.style.display = 'none'} />
                                  </div>
                                  <div>
                                    <h4 className="dark:text-white text-slate-900 font-bold text-base leading-tight">{team.teamName}</h4>
                                    <span className="dark:text-gray-500 text-slate-600 font-medium text-xs uppercase tracking-wider">{team.ccode}</span>
                                  </div>
                                </div>
                                {/* Tournaments */}
                                <div className="flex flex-col">
                                  {team.tournaments?.map((tour: any, tourIdx: number) => (
                                    <div key={tourIdx} className="flex flex-wrap sm:flex-nowrap items-center gap-4 p-4 border-b dark:border-white/5 border-slate-200 last:border-0 hover:dark:bg-white/5 hover:bg-slate-200 transition-colors">
                                      <div className="w-6 text-center shrink-0">
                                        <span className="dark:text-white text-slate-900 font-black text-lg">{tour.seasonsWon?.length || 0}</span>
                                      </div>
                                      <div className="w-8 h-8 flex items-center justify-center shrink-0">
                                        {tour.leagueId > 0 && (
                                          <img src={`https://images.fotmob.com/image_resources/logo/leaguelogo/${tour.leagueId}.png`} className="w-full h-full object-contain" alt="" onError={(e: any) => e.target.style.display = 'none'} />
                                        )}
                                      </div>
                                      <div className="flex flex-wrap items-baseline gap-1.5 min-w-0 flex-1">
                                        <span className="dark:text-white text-slate-900 font-bold text-sm">{tour.leagueName}</span>
                                        <span className="dark:text-gray-500 text-slate-600 font-medium text-xs">
                                          ({tour.seasonsWon?.join(' · ')})
                                        </span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-full dark:text-gray-500 text-slate-600 text-sm">
                        No trophy data available.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : activeTab === 'detailed' ? (
          <div className="transition-opacity duration-300">
            {/* Top Graph Area (Matches) */}
            <div className="dark:bg-[#1a1c21] bg-white rounded-xl border dark:border-white/5 border-slate-200 p-6 mb-8 relative">
              <div className={`grid grid-cols-1 ${hasDeepStats ? 'md:grid-cols-2' : ''} gap-8 pt-2`}>
                {hasDeepStats && (
                  <div className="flex flex-col">
                    <h3 className="dark:text-white text-slate-900 font-bold text-center mb-4">Season Shot Map</h3>
                    <ShotMapPitch playerId={id} position={position} totalGoals={Number(goals)} realShotmap={currentStats?.shotmap} />
                  </div>
                )}

                <div className={`relative flex flex-col dark:bg-[#121316] bg-slate-50 rounded-2xl border dark:border-white/5 border-slate-200 p-6 shadow-2xl overflow-hidden group hover:-translate-y-1 transition-all duration-500 ${hasDeepStats ? 'border-l-4 border-l-[#60A5FA]' : 'max-w-md mx-auto w-full border-l-4 border-l-[#60A5FA]'}`}>
                  {/* Background Blur */}
                  <div className="absolute -top-24 -right-24 w-48 h-48 bg-gradient-to-br from-[#60A5FA]/20 to-[#3B82F6]/20 rounded-full blur-[50px] opacity-30 group-hover:opacity-60 transition-opacity duration-500 pointer-events-none" />
                  
                  <div className="flex items-center gap-3 mb-6 pb-4 border-b dark:border-white/5 border-slate-200 relative z-10">
                    <div className="w-1.5 h-6 rounded-full bg-[#60A5FA] shadow-[0_0_10px_rgba(96,165,250,0.5)]" />
                    <h3 className="dark:text-white text-slate-900 font-black text-base tracking-wide uppercase">Matches & Playtime</h3>
                  </div>
                  <div className="space-y-1.5 relative z-10">
                    <StatRow label="Matches played" value={hasDeepStats ? extractTopStat('Matches') : selectedBasicStats?.appearances} />
                    {hasDeepStats && <StatRow label="Started" value={extractTopStat('Started')} />}
                    {hasDeepStats && <StatRow label="Minutes played" value={extractTopStat('Minutes')} />}
                    <StatRow label="Rating" value={hasDeepStats ? extractTopStat('Rating') : selectedBasicStats?.rating?.rating} />
                    {!hasDeepStats && <StatRow label="Goals" value={selectedBasicStats?.goals} />}
                    {!hasDeepStats && <StatRow label="Assists" value={selectedBasicStats?.assists} />}
                  </div>
                </div>
              </div>
            </div>

            {/* 4 Column Data Grid */}
            {isStatsLoading ? (
              <div className="flex flex-col items-center justify-center p-12 dark:bg-[#1a1c21] bg-white rounded-xl border dark:border-white/5 border-slate-200">
                <Loader2 className="w-8 h-8 text-[#34D399] animate-spin mb-4" />
                <span className="dark:text-gray-400 text-slate-500 font-medium">Fetching tournament stats...</span>
              </div>
            ) : hasDeepStats ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatColumn title="Shooting">
                <StatRow label="Goals" value={extractStat('Shooting', 'Goals')} />
                <StatRow label="xG" value={extractStat('Shooting', 'xG')} />
                <StatRow label="xGOT" value={extractStat('Shooting', 'xGOT')} />
                <StatRow label="Shots" value={extractStat('Shooting', 'Shots')} />
                <StatRow label="Shots on target" value={extractStat('Shooting', 'Shots on target')} />
                <StatRow label="Penalty goals" value={extractStat('Shooting', 'Penalty goals')} />
                <StatRow label="xG excl. penalty" value={extractStat('Shooting', 'xG excl. penalty')} />
                <StatRow label="Headed shots" value={extractStat('Shooting', 'Headed shots')} />
              </StatColumn>

              <StatColumn title="Passing">
                <StatRow label="Assists" value={extractStat('Passing', 'Assists')} />
                <StatRow label="xA" value={extractStat('Passing', 'xA')} />
                <StatRow label="Accurate passes" value={extractStat('Passing', 'Accurate passes')} />
                <StatRow label="Pass accuracy" value={extractStat('Passing', 'Pass accuracy')} />
                <StatRow label="Accurate long balls" value={extractStat('Passing', 'Accurate long balls')} />
                <StatRow label="Long ball accuracy" value={extractStat('Passing', 'Long ball accuracy')} />
                <StatRow label="Chances created" value={extractStat('Passing', 'Chances created')} />
                <StatRow label="Big chances created" value={extractStat('Passing', 'Big chances created')} />
              </StatColumn>

              <StatColumn title="Defending">
                <StatRow label="Defensive actions" value={extractStat('Defending', 'Defensive actions')} />
                <StatRow label="Tackles" value={extractStat('Defending', 'Tackles')} />
                <StatRow label="Interceptions" value={extractStat('Defending', 'Interceptions')} />
                <StatRow label="Recoveries" value={extractStat('Defending', 'Recoveries')} />
                <StatRow label="Possession won final 3rd" value={extractStat('Defending', 'Possession won final 3rd')} />
                <StatRow label="Dribbled past" value={extractStat('Defending', 'Dribbled past')} />
                <StatRow label="Clean sheets" value={extractStat('Defending', 'Clean sheets')} />
                <StatRow label="Goals conceded" value={extractStat('Defending', 'Goals conceded while on pitch')} />
              </StatColumn>

              <StatColumn title="Possession & Discipline">
                <StatRow label="Dribbles" value={extractStat('Possession', 'Dribbles')} />
                <StatRow label="Dribbles success rate" value={extractStat('Possession', 'Dribbles success rate')} />
                <StatRow label="Touches" value={extractStat('Possession', 'Touches')} />
                <StatRow label="Touches in opp box" value={extractStat('Possession', 'Touches in opposition box')} />
                <StatRow label="Duels won" value={extractStat('Possession', 'Duels won')} />
                <StatRow label="Aerials won" value={extractStat('Possession', 'Aerials won')} />
                <StatRow label="Fouls committed" value={extractStat('Defending', 'Fouls committed')} />
                <StatRow label="Yellow cards" value={extractStat('Discipline', 'Yellow cards')} />
              </StatColumn>
            </div>
            ) : (
               <div className="flex items-center justify-center p-8 dark:bg-[#1a1c21] bg-white rounded-xl border dark:border-white/5 border-slate-200">
                 <span className="dark:text-gray-400 text-slate-500 font-medium">Deep stats (Shooting, Passing, Defending) are not available for this tournament.</span>
              </div>
            )}
          </div>
        ) : activeTab === 'career' ? (
          <div className="transition-opacity duration-300">
            <div className="dark:bg-[#16181c] bg-white rounded-2xl border dark:border-white/5 border-slate-200 p-4 sm:p-8">

              {/* Senior Career Section */}
              <div className="mb-12">
                <div className="flex items-center justify-between mb-4 pb-4 border-b dark:border-white/5 border-slate-200 px-2 sm:px-4">
                  <h3 className="text-lg font-bold dark:text-white text-slate-900 tracking-wide">Club career</h3>
                  <div className="flex items-center justify-end w-[105px] sm:w-[150px] text-[10px] font-bold dark:text-gray-500 text-slate-600 uppercase tracking-widest">
                    <div className="w-[35px] sm:w-[50px] text-center">App</div>
                    <div className="w-[35px] sm:w-[50px] text-center">Goals</div>
                    <div className="w-[35px] sm:w-[50px] text-center">Ast</div>
                  </div>
                </div>

                {careerHistory?.careerItems?.senior?.teamEntries?.length > 0 ? (
                  <div className="flex flex-col">
                    {careerHistory.careerItems.senior.teamEntries.map((entry: any, i: number) => (
                      <TeamCareerRow
                        key={i}
                        entry={entry}
                        seasonEntries={careerHistory.careerItems.senior.seasonEntries}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center dark:text-gray-500 text-slate-600 py-6">No club career data available.</div>
                )}
              </div>

              {/* National Team Section */}
              {careerHistory?.careerItems?.['national team']?.teamEntries?.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-4 pb-4 border-b dark:border-white/5 border-slate-200 px-2 sm:px-4">
                    <h3 className="text-lg font-bold dark:text-white text-slate-900 tracking-wide">National team</h3>
                    <div className="flex items-center justify-end w-[105px] sm:w-[150px] text-[10px] font-bold dark:text-gray-500 text-slate-600 uppercase tracking-widest">
                      <div className="w-[35px] sm:w-[50px] text-center">App</div>
                      <div className="w-[35px] sm:w-[50px] text-center">Gls</div>
                      <div className="w-[35px] sm:w-[50px] text-center">Ast</div>
                    </div>
                  </div>
                  <div className="flex flex-col">
                    {careerHistory.careerItems['national team'].teamEntries.map((entry: any, i: number) => (
                      <TeamCareerRow
                        key={i}
                        entry={entry}
                        seasonEntries={careerHistory.careerItems['national team'].seasonEntries}
                      />
                    ))}
                  </div>
                </div>
              )}

            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};
