import React, { useState, useMemo } from 'react';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts';
import { ChevronDown, Info, Activity, Star } from 'lucide-react';

const StatRow = ({ label, value, subValue, tooltip }: any) => (
  <div className="flex justify-between items-center py-2.5 text-[13px] border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors px-2 rounded">
    <span className="text-gray-300 font-medium flex items-center gap-1.5">
      {label}
      {tooltip && <Info className="w-3.5 h-3.5 text-blue-400" />}
    </span>
    <div className="text-right flex items-center gap-1.5">
      <span className="text-white font-bold">{value !== undefined && value !== null ? value : '-'}</span>
      {subValue && <span className="text-gray-400 text-xs">({subValue})</span>}
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

const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        const value = payload[0].value;
        const teamColor = data.teamColor || '#fff';
        
        return (
            <div className="flex items-center gap-3 bg-[#1a1c21] border border-white/10 rounded-full py-1.5 pl-2 pr-1.5 shadow-2xl">
                <div className="flex items-center gap-2">
                    <img 
                        src={`https://images.fotmob.com/image_resources/logo/teamlogo/${data.teamId}_xsmall.png`}
                        className="w-6 h-6 rounded-full"
                        alt={data.teamName}
                    />
                    <div className="flex flex-col justify-center">
                        <span className="text-xs font-bold leading-none" style={{ color: teamColor }}>{data.teamName}</span>
                        <span className="text-gray-400 text-[10px] font-medium leading-none mt-1">
                            {new Date(data.timestamp).toLocaleDateString('default', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                    </div>
                </div>
                <div className="rounded-full px-3 py-1 ml-2" style={{ backgroundColor: teamColor }}>
                    <span className="text-white font-bold text-xs">
                        €{(value / 1000000).toFixed(0)}M
                    </span>
                </div>
            </div>
        );
    }
    return null;
};

const StatColumn = ({ title, children }: any) => (
  <div className="flex flex-col h-full">
    <h3 className="text-white font-bold text-center pb-3 border-b border-white/10 mb-2">{title}</h3>
    <div className="space-y-0.5 flex-1">
      {children}
    </div>
  </div>
);

// Advanced 2D Shotmap Pitch Renderer
const ShotMapPitch = ({ playerId, position, totalGoals = 1 }: any) => {
    // Generate deterministic shot data based on playerId and total goals
    const shots = useMemo(() => {
        const generated = [];
        const seedBase = parseInt(String(playerId).slice(0, 5)) || 12345;
        
        // Number of shots based on goals (rough estimate)
        const numShots = Math.max(totalGoals * 5, 10);
        
        for (let i = 0; i < numShots; i++) {
            const seed = seedBase + i * 13;
            const isGoal = i < totalGoals;
            
            // Adjust clustering based on position
            let x, y;
            if (position?.toLowerCase().includes('forward') || position?.toLowerCase().includes('striker')) {
                // Closer to goal
                x = 35 + (seed % 30); // 35 to 65 (center)
                y = 70 + ((seed * 7) % 25); // 70 to 95 (close to goal)
            } else {
                // More spread out
                x = 20 + (seed % 60); 
                y = 50 + ((seed * 7) % 40); 
            }
            
            // Misses might be wider
            if (!isGoal && seed % 3 === 0) {
                x = x + (seed % 2 === 0 ? 15 : -15);
            }

            // Ensure within bounds
            x = Math.max(5, Math.min(x, 95));
            y = Math.max(5, Math.min(y, 95));

            generated.push({ x, y, isGoal });
        }
        return generated;
    }, [playerId, totalGoals, position]);

    return (
        <div className="relative w-full max-w-[320px] aspect-[3/4] bg-[#416238] rounded-xl border-2 border-black/40 mx-auto overflow-hidden shadow-inner flex flex-col items-center">
            {/* Pitch Lines */}
            <div className="absolute inset-3 border-2 border-white/40 pointer-events-none" />
            <div className="absolute top-1/2 left-3 right-3 border-t-2 border-white/40 pointer-events-none" />
            
            {/* Center Circle */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 rounded-full border-2 border-white/40 pointer-events-none" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-white/40 rounded-full pointer-events-none" />
            
            {/* Penalty Areas */}
            <div className="absolute top-3 left-1/2 -translate-x-1/2 w-40 h-24 border-2 border-white/40 border-t-0 pointer-events-none" />
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 w-40 h-24 border-2 border-white/40 border-b-0 pointer-events-none" />
            
            {/* Goal Areas */}
            <div className="absolute top-3 left-1/2 -translate-x-1/2 w-16 h-8 border-2 border-white/40 border-t-0 pointer-events-none" />
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 w-16 h-8 border-2 border-white/40 border-b-0 pointer-events-none" />

            {/* D Arcs */}
            <div className="absolute top-[6.5rem] left-1/2 -translate-x-1/2 w-16 h-12 border-2 border-white/40 rounded-b-full border-t-0 pointer-events-none" />
            <div className="absolute bottom-[6.5rem] left-1/2 -translate-x-1/2 w-16 h-12 border-2 border-white/40 rounded-t-full border-b-0 pointer-events-none" />

            {/* Plot Shots (Attacking towards top) */}
            {shots.map((shot, idx) => (
                <div 
                    key={idx}
                    className={`absolute w-3 h-3 -translate-x-1/2 -translate-y-1/2 rounded-full shadow-sm transition-all hover:scale-150 cursor-pointer ${
                        shot.isGoal 
                            ? 'bg-[#34D399] border border-emerald-800 z-20 shadow-[0_0_10px_rgba(52,211,153,0.8)]' 
                            : 'bg-[#EF4444] border border-red-900 z-10 opacity-70'
                    }`}
                    style={{ left: `${shot.x}%`, top: `${100 - shot.y}%` }}
                    title={shot.isGoal ? 'Goal' : 'Miss/Saved'}
                />
            ))}
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

export const FotmobPlayerCard = ({ profile }: { profile: any }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'detailed'>('detailed');
  
  if (!profile) return null;

  // --- Extract Player Identity ---
  const { id, name, primaryTeam, mainLeague, playerInformation, traits, recentMatches, careerHistory, statSeasons, firstSeasonStats } = profile;
  
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

  const { marketValueData, gradientStops } = useMemo(() => {
      if (!marketValuesArray || marketValuesArray.length === 0) return { marketValueData: [], gradientStops: [] };
      
      const processed = marketValuesArray.map((mv: any) => ({
          ...mv,
          timestamp: new Date(mv.date).getTime(),
          teamColor: getTeamColor(mv.teamId)
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

      stops.push({ offset: '0%', color: getTeamColor(currentTeamId) });

      for (let i = 1; i < processed.length; i++) {
          if (processed[i].teamId !== currentTeamId) {
              const prevT = processed[i-1].timestamp;
              const currT = processed[i].timestamp;
              const midT = (prevT + currT) / 2;
              const pct = total > 0 ? ((midT - minT) / total) * 100 : 0;
              
              stops.push({ offset: `${pct}%`, color: getTeamColor(currentTeamId) });
              currentTeamId = processed[i].teamId;
              stops.push({ offset: `${pct}%`, color: getTeamColor(currentTeamId) });
          }
      }
      stops.push({ offset: '100%', color: getTeamColor(currentTeamId) });

      return { marketValueData: processed, gradientStops: stops };
  }, [marketValuesArray]);

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
  const tournamentsList = statSeasons?.[0]?.tournaments || [];
  
  const [selectedTournament, setSelectedTournament] = useState<any>(tournamentsList[0] || null);
  
  const extractStat = (categoryName: string, statTitle: string) => {
      const categories = firstSeasonStats?.statsSection?.items || [];
      const cat = categories.find((c: any) => c?.title?.toLowerCase() === categoryName.toLowerCase());
      const item = cat?.items?.find((i: any) => i?.title?.toLowerCase() === statTitle.toLowerCase());
      return item?.statValue;
  };

  const extractTopStat = (statTitle: string) => {
      const items = firstSeasonStats?.topStatCard?.items || [];
      const item = items.find((i: any) => i?.title?.toLowerCase() === statTitle.toLowerCase());
      return item?.statValue;
  };

  const goals = extractStat('Shooting', 'Goals') || extractTopStat('Goals') || 0;

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
          return {
              subject: title,
              A: t && Number(t.value) ? Math.round(Number(t.value) * 100) : 0,
              fullMark: 100
          };
      });
  }, [traits]);

  // --- Extract Recent Matches ---
  const ratingsData = useMemo(() => {
      if (!recentMatches || recentMatches.length === 0) return [];
      return [...recentMatches].reverse().map((m: any) => {
          const date = new Date(m.matchDate);
          return {
              match: `${date.getDate()} ${date.toLocaleString('default', { month: 'short' })}`,
              rating: parseFloat(m.ratingProps?.num) || null
          };
      }).filter((m: any) => m.rating !== null);
  }, [recentMatches]);

  return (
    <div className="w-full max-w-6xl mx-auto bg-[#16181c] rounded-2xl border border-white/5 shadow-2xl overflow-hidden text-white font-sans flex flex-col mb-20 relative z-30">
      
      {/* Header Dropdowns */}
      <div className="flex border-b border-white/5 px-6 py-4 bg-[#121316] items-center gap-6">
        <div className="flex gap-8 font-bold text-sm tracking-wide uppercase text-gray-400">
           <span 
             onClick={() => setActiveTab('overview')}
             className={`cursor-pointer transition-colors ${activeTab === 'overview' ? 'text-[#34D399] border-b-2 border-[#34D399] pb-4 -mb-[18px]' : 'hover:text-white pb-4 -mb-[18px]'}`}
           >Overview</span>
           <span 
             onClick={() => setActiveTab('detailed')}
             className={`cursor-pointer transition-colors ${activeTab === 'detailed' ? 'text-[#34D399] border-b-2 border-[#34D399] pb-4 -mb-[18px]' : 'hover:text-white pb-4 -mb-[18px]'}`}
           >Detailed Season Stats</span>
        </div>
      </div>

      <div className="p-6 md:p-8 space-y-8 bg-[#16181c] min-h-[500px]">
        
        {/* League Dropdowns */}
        <div className="flex flex-wrap items-center gap-3 border-b border-white/5 pb-6 relative z-30">
          <div className="relative group">
            <button className="flex items-center gap-3 px-4 py-2 bg-[#1f2126] border border-white/5 rounded-lg hover:bg-[#2a2c33] transition-colors cursor-pointer">
              <span className="font-bold text-sm">{selectedTournament?.name || 'All Competitions'}</span>
              <ChevronDown className="w-4 h-4 text-gray-500" />
            </button>
            <div className="absolute top-full left-0 mt-1 w-64 bg-[#1f2126] border border-white/5 rounded-lg shadow-xl overflow-hidden opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 max-h-[300px] overflow-y-auto">
              {tournamentsList.map((t: any) => (
                <button 
                  key={t.name} 
                  className="w-full text-left px-4 py-3 hover:bg-white/5 text-sm font-semibold transition-colors cursor-pointer"
                  onClick={() => setSelectedTournament(t)}
                >
                  {t.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {activeTab === 'overview' ? (
          <div className={`transition-opacity duration-300 space-y-8`}>
            {/* Header Profile Section */}
            <div className="relative bg-[#1a1c21] rounded-2xl border border-white/5 p-8 flex flex-col md:flex-row gap-8 items-center md:items-start overflow-hidden">
               <div className="relative">
                 <div className="w-32 h-32 rounded-full bg-[#1a1c21] border-4 border-[#252830] flex items-center justify-center shadow-[0_0_40px_rgba(52,211,153,0.15)] z-10 relative overflow-hidden">
                    <img src={`https://images.fotmob.com/image_resources/playerimages/${id}.png`} alt={name} className="w-full h-full object-cover object-top" />
                 </div>
               </div>

               {/* Info */}
               <div className="flex flex-col flex-1 z-10 w-full text-center md:text-left">
                 <h1 className="text-5xl font-black text-white mb-4">{name}</h1>
                 <div className="flex flex-wrap justify-center md:justify-start items-center gap-3 text-sm font-semibold text-gray-400">
                   <div className="flex items-center gap-2">
                     <span className="text-white">{primaryTeam?.name || mainLeague?.name || ''}</span>
                   </div>
                   <span>|</span>
                   <div className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-xs text-[#34D399]">
                     {transferValue} Value
                   </div>
                 </div>
               </div>
            </div>

            {/* NEW: Identity Matrix & Position Mini-Pitch */}
            <div className="flex flex-col lg:flex-row bg-[#1a1c21] rounded-2xl border border-white/5 overflow-hidden">
              
              {/* Left: Basic Info Grid */}
              <div className="flex-1 p-6 lg:p-8 border-b lg:border-b-0 lg:border-r border-white/5">
                <div className="grid grid-cols-2 gap-y-8 gap-x-6">
                  {/* Row 1 */}
                  <div className="flex flex-col border-b border-white/5 pb-4">
                    <span className="text-lg font-bold text-white mb-1">{height}</span>
                    <span className="text-[11px] text-gray-400 font-medium uppercase tracking-wider">Height</span>
                  </div>
                  <div className="flex flex-col border-b border-white/5 pb-4">
                    <span className="text-lg font-bold text-white mb-1">{shirt}</span>
                    <span className="text-[11px] text-gray-400 font-medium uppercase tracking-wider">Shirt</span>
                  </div>

                  {/* Row 2 */}
                  <div className="flex flex-col border-b border-white/5 pb-4">
                    <span className="text-lg font-bold text-white mb-1">{age}</span>
                    <span className="text-[11px] text-gray-400 font-medium uppercase tracking-wider">Age</span>
                  </div>
                  <div className="flex flex-col border-b border-white/5 pb-4">
                    <span className="text-lg font-bold text-white mb-1">{foot}</span>
                    <span className="text-[11px] text-gray-400 font-medium uppercase tracking-wider">Preferred foot</span>
                  </div>

                  {/* Row 3 */}
                  <div className="flex flex-col border-b border-white/5 pb-4">
                    <span className="text-lg font-bold text-white mb-1 flex items-center gap-2">
                      {country}
                    </span>
                    <span className="text-[11px] text-gray-400 font-medium uppercase tracking-wider">Country</span>
                  </div>
                  <div className="flex flex-col border-b border-white/5 pb-4">
                    <span className="text-lg font-bold text-white mb-1">{transferValue}</span>
                    <span className="text-[11px] text-gray-400 font-medium uppercase tracking-wider">Transfer value</span>
                  </div>

                  {/* Row 4 */}
                  <div className="flex flex-col col-span-2">
                    <span className="text-lg font-bold text-white mb-1">{contractEnd}</span>
                    <span className="text-[11px] text-gray-400 font-medium uppercase tracking-wider">Contract end</span>
                  </div>
                </div>
              </div>

              {/* Right: Position & Pitch */}
              <div className="flex-1 p-6 lg:p-8 flex flex-col sm:flex-row gap-8 items-start justify-between">
                <div className="flex flex-col flex-1 pt-2">
                  <h3 className="text-xl font-bold text-white mb-8">Position</h3>
                  <div className="space-y-1 mb-6">
                    <span className="text-sm font-bold text-white">Primary</span>
                    <span className="text-sm text-gray-300 block">{primaryPos}</span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-sm font-bold text-white">Others</span>
                    <span className="text-sm text-gray-300 block leading-tight">{otherPos}</span>
                  </div>
                </div>
                
                {/* Mini Pitch */}
                <div className="w-[160px] aspect-[2/3] bg-[#1f2126] rounded-xl border border-white/5 relative overflow-hidden flex-shrink-0 mt-2 sm:mt-0 shadow-inner">
                   {/* Lines */}
                   <div className="absolute inset-3 border border-white/10 pointer-events-none rounded-sm" />
                   <div className="absolute top-1/2 left-3 right-3 border-t border-white/10 pointer-events-none" />
                   <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full border border-white/10 pointer-events-none" />
                   <div className="absolute top-3 left-1/2 -translate-x-1/2 w-20 h-10 border border-white/10 border-t-0 pointer-events-none" />
                   <div className="absolute bottom-3 left-1/2 -translate-x-1/2 w-20 h-10 border border-white/10 border-b-0 pointer-events-none" />
                   
                   {/* Dots */}
                   {pitchPositions.map((p: any, i: number) => (
                       <div 
                         key={i} 
                         className={`absolute -translate-x-1/2 -translate-y-1/2 px-2 py-0.5 rounded-full text-[10px] font-bold shadow-md flex items-center justify-center transition-transform hover:scale-110 cursor-default ${p.isMainPosition ? 'bg-[#ff7aa3] text-white z-20 scale-110' : 'bg-[#40434a] text-gray-300 z-10'}`}
                         style={{ left: `${p.pitchPositionData.right * 100}%`, top: `${p.pitchPositionData.top * 100}%` }}
                       >
                         {p.strPosShort?.label}
                       </div>
                   ))}
                </div>
              </div>
            </div>

            {/* Transfer Value History Graph */}
            {marketValueData.length > 0 && (
                <div className="bg-[#1a1c21] rounded-2xl border border-white/5 p-6 md:p-8 relative overflow-hidden">
                   <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 mb-6">
                      <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        Transfer value: {transferValue}
                      </h3>
                      {highestMarketValue && (
                          <div className="flex items-center gap-3">
                            <span className="hidden sm:inline text-white/10">|</span>
                            <span className="text-gray-400 text-sm font-medium">Highest: {highestValueFormatted} ({highestValueDate})</span>
                          </div>
                      )}
                   </div>
                   
                   <div className="bg-[#2b2d32] rounded-2xl p-4 pt-10 h-[300px] w-full relative z-10 border border-white/5">
                     <ResponsiveContainer width="100%" height="100%">
                       <AreaChart data={marketValueData} margin={{ top: 40, right: 30, left: -25, bottom: 0 }}>
                         <defs>
                           <linearGradient id="lineColor" x1="0" y1="0" x2="1" y2="0">
                             {gradientStops.map((s: any, i: number) => (
                               <stop key={i} offset={s.offset} stopColor={s.color} />
                             ))}
                           </linearGradient>
                         </defs>
                         
                         <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                         
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
                            stroke="rgba(255,255,255,0.3)" 
                            tick={{fill: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: 500}} 
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
                            tickFormatter={(val) => `€${(val/1000000).toFixed(0)}M`} 
                            stroke="rgba(255,255,255,0.3)" 
                            tick={{fill: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: 600}} 
                            tickLine={false} 
                            axisLine={false} 
                         />
                         
                         <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.2)', strokeWidth: 1, strokeDasharray: '3 3' }} />
                         
                         <Area 
                           type="monotone" 
                           dataKey="value" 
                           stroke="url(#lineColor)" 
                           strokeWidth={3} 
                           fillOpacity={0.3} 
                           fill="url(#lineColor)" 
                           activeDot={{ r: 5, fill: 'white', stroke: 'none' }}
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
                 <div className="bg-[#1a1c21] rounded-2xl border border-white/5 p-6">
                   <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                     <Activity className="w-5 h-5 text-[#34D399]" />
                     Recent Match Ratings
                   </h3>
                   <div className="h-48 w-full">
                     <ResponsiveContainer width="100%" height="100%">
                       <LineChart data={ratingsData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                         <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                         <XAxis dataKey="match" stroke="rgba(255,255,255,0.3)" tick={{fill: 'rgba(255,255,255,0.5)', fontSize: 12}} tickLine={false} axisLine={false} />
                         <YAxis domain={['auto', 'auto']} stroke="rgba(255,255,255,0.3)" tick={{fill: 'rgba(255,255,255,0.5)', fontSize: 12}} tickLine={false} axisLine={false} width={30} />
                         <Tooltip contentStyle={{backgroundColor: '#1f2126', border: 'none', borderRadius: '8px'}} itemStyle={{color: '#34D399'}} />
                         <Line type="monotone" dataKey="rating" stroke="#34D399" strokeWidth={3} dot={{ r: 4, fill: '#1a1c21', stroke: '#34D399', strokeWidth: 2 }} activeDot={{ r: 6, fill: '#34D399' }} />
                       </LineChart>
                     </ResponsiveContainer>
                   </div>
                 </div>

                 {/* Career History */}
                 <div className="bg-[#1a1c21] rounded-2xl border border-white/5 p-6">
                   <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                     <span className="text-[#34D399]">→</span>
                     Career History
                   </h3>
                   <div className="space-y-3">
                     {careerHistory?.careerItems?.teams?.slice(0, 5).map((team: any, i: number) => (
                         <div key={i} className="flex justify-between items-center bg-[#121316] border border-white/5 rounded-xl p-4">
                           <div className="flex items-center gap-3">
                             <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center p-1">
                                <img src={`https://images.fotmob.com/image_resources/logo/teamlogo/${team.teamId}_xsmall.png`} className="w-full h-full object-contain" alt="" />
                             </div>
                             <span className="text-sm font-bold text-white">{team.team}</span>
                           </div>
                           <div className="text-right">
                             <div className="text-sm font-bold text-[#34D399]">{team.goals || 0} Goals</div>
                             <div className="text-[10px] text-gray-500 font-semibold uppercase">{team.startDate} - {team.endDate || 'Present'}</div>
                           </div>
                         </div>
                     ))}
                   </div>
                 </div>
               </div>

               {/* Right Column */}
               <div className="space-y-8">
                 {/* Season Attributes */}
                 <div className="bg-[#1a1c21] rounded-2xl border border-white/5 p-6 h-[312px]">
                   <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                     <Star className="w-5 h-5 text-[#34D399]" />
                     Player Traits
                   </h3>
                   <div className="h-full w-full -mt-4">
                     {radarData.length > 0 ? (
                         <ResponsiveContainer width="100%" height="100%">
                             <RadarChart cx="50%" cy="50%" outerRadius="55%" data={radarData} className="-rotate-30">
                               <PolarGrid stroke="rgba(255,255,255,0.1)" />
                               <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
                               <PolarAngleAxis 
                                 dataKey="subject" 
                                 tick={({ payload, x, y, textAnchor }) => {
                                   const item = radarData.find((d: any) => d.subject === payload.value);
                                   const val = item ? item.A : 0;
                                   return (
                                     <g className="recharts-layer recharts-polar-angle-axis-tick" transform={`rotate(30, ${x}, ${y})`}>
                                       <text x={x} y={y} textAnchor={textAnchor} fill="white" fontSize="11">
                                         <tspan x={x} dy="0em" fontWeight="800" fill="white">{val}%</tspan>
                                         <tspan x={x} dy="1.2em" fill="rgba(255,255,255,0.7)" fontWeight="600">{payload.value}</tspan>
                                       </text>
                                     </g>
                                   );
                                 }} 
                               />
                               <Radar name="Attributes" dataKey="A" stroke="#34D399" fill="#34D399" fillOpacity={0.3} isAnimationActive={false} />
                             </RadarChart>
                         </ResponsiveContainer>
                     ) : (
                         <div className="w-full h-full flex items-center justify-center text-sm text-gray-500">No trait data available</div>
                     )}
                   </div>
                 </div>
                 
                 {/* Trophies */}
                 <div className="bg-[#1a1c21] rounded-2xl border border-white/5 p-6">
                   <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                     <div className="w-4 h-4 rounded border-2 border-[#34D399] flex items-center justify-center">
                       <div className="w-1.5 h-1.5 bg-[#34D399] rounded-full" />
                     </div>
                     Major Trophies
                   </h3>
                   <div className="flex flex-wrap gap-3">
                     {profile.trophies?.playerTrophies?.[0]?.tournaments?.slice(0, 6).map((t: any, i: number) => (
                         <span key={i} className="px-4 py-2 bg-white/5 border border-white/10 rounded-full text-sm font-semibold text-white flex items-center gap-2">
                            <span className="text-[#34D399] font-bold">{t.seasonsWon?.length || 1}x</span> {t.name}
                         </span>
                     ))}
                     {!profile.trophies?.playerTrophies && (
                         <span className="text-gray-500 text-sm">No trophy data</span>
                     )}
                   </div>
                 </div>
               </div>
            </div>
          </div>
        ) : (
          <div className="transition-opacity duration-300">
            {/* Top Graph Area (Matches) */}
            <div className="bg-[#1a1c21] rounded-xl border border-white/5 p-6 mb-8 relative">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-2">
                 <div className="flex flex-col">
                   <h3 className="text-white font-bold text-center mb-4">2D Simulated Shot Map</h3>
                   <ShotMapPitch playerId={id} position={position} totalGoals={Number(goals)} />
                 </div>

                 <div className="flex flex-col border-l border-white/10 pl-8">
                   <h3 className="text-white font-bold text-center mb-4">Matches & Playtime</h3>
                   <div className="space-y-1 mt-2">
                     <StatRow label="Matches played" value={extractTopStat('Matches')} />
                     <StatRow label="Started" value={extractTopStat('Started')} />
                     <StatRow label="Minutes played" value={extractTopStat('Minutes')} />
                     <StatRow label="Rating" value={extractTopStat('Rating')} />
                   </div>
                 </div>
               </div>
            </div>

            {/* 4 Column Data Grid */}
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
          </div>
        )}
      </div>
    </div>
  );
};
