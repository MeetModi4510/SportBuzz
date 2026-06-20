import React, { useState, useMemo, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Radar, RadarChart, PolarGrid, PolarAngleAxis } from 'recharts';
import { ChevronDown, Info, Activity, Star } from 'lucide-react';


const radarData = [
  { subject: 'Attacking', A: 95, fullMark: 100 },
  { subject: 'Technical', A: 98, fullMark: 100 },
  { subject: 'Tactical', A: 85, fullMark: 100 },
  { subject: 'Defending', A: 35, fullMark: 100 },
  { subject: 'Creativity', A: 96, fullMark: 100 },
];

const recentRatingsData = [
  { match: 'M1', rating: 9.8 },
  { match: 'M2', rating: 8.8 },
  { match: 'M3', rating: 8.9 },
  { match: 'M4', rating: 7.2 },
  { match: 'M5', rating: 10.0 },
  { match: 'M6', rating: 10.0 },
];

const ratingsData = [
  { match: '23 Apr', rating: 8.1 },
  { match: '26 Apr', rating: 8.3 },
  { match: '3 May', rating: 10.0 },
  { match: '9 May', rating: 9.5 },
  { match: '14 May', rating: 9.5 },
  { match: '18 May', rating: 8.9 },
  { match: '25 May', rating: 8.6 },
];

const tournamentsList = [
  {
    id: 16,
    name: "FIFA World Cup",
    seasons: [ { id: 58210, year: "2026" }, { id: 41087, year: "2022" }, { id: 15586, year: "2018" } ]
  },
  {
    id: 242,
    name: "MLS",
    seasons: [ { id: 86668, year: "2026" }, { id: 70158, year: "2025" }, { id: 57317, year: "2024" } ]
  },
  {
    id: 498,
    name: "CONCACAF Champions Cup",
    seasons: [ { id: 87494, year: "2026" }, { id: 69806, year: "2025" }, { id: 57303, year: "2024" } ]
  }
];

const StatRow = ({ label, value, subValue, tooltip }: any) => (
  <div className="flex justify-between items-center py-2.5 text-[13px] border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors px-2 rounded">
    <span className="text-gray-300 font-medium flex items-center gap-1.5">
      {label}
      {tooltip && <Info className="w-3.5 h-3.5 text-blue-400" />}
    </span>
    <div className="text-right flex items-center gap-1.5">
      <span className="text-white font-bold">{value}</span>
      {subValue && <span className="text-gray-400 text-xs">({subValue})</span>}
    </div>
  </div>
);

const StatColumn = ({ title, children }: any) => (
  <div className="flex flex-col h-full">
    <h3 className="text-white font-bold text-center pb-3 border-b border-white/10 mb-2">{title}</h3>
    <div className="space-y-0.5 flex-1">
      {children}
    </div>
  </div>
);

export const MessiCardMockup = () => {
  const [selectedTournament, setSelectedTournament] = useState(tournamentsList[1]);
  const [selectedSeason, setSelectedSeason] = useState(tournamentsList[1].seasons[0]);
  const [fetchedStats, setFetchedStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'detailed'>('detailed');

  useEffect(() => {
    const fetchRealStats = async () => {
      setIsLoading(true);
      try {
        const url = `/api/sofascore/player/12994/unique-tournament/${selectedTournament.id}/season/${selectedSeason.id}/statistics/overall`;
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          if (data && data.statistics) {
            setFetchedStats(data.statistics);
            setIsLoading(false);
            return;
          }
        }
        setFetchedStats(null);
      } catch (err) {
        setFetchedStats(null);
      }
      setIsLoading(false);
    };
    fetchRealStats();
  }, [selectedTournament, selectedSeason]);

  const stats = useMemo(() => {
    if (fetchedStats) return fetchedStats;

    const seed = selectedTournament.id + selectedSeason.id;
    const multiplier = 1 + ((seed % 10) / 10);
    
    // Accurate realistic base matching the screenshot provided
    const base = {
      appearances: 14, matchesStarted: 14, minutesPlayed: 1243, totwAppearances: 6,
      goals: 12, expectedGoals: 10.44, scoringFrequency: 104, totalShots: 84, shotsOnTarget: 33, bigChancesMissed: 7, goalConversionPercentage: 14, freeKickGoal: 2, freeKickConversion: 11, goalsFromInsideTheBox: 8, goalsFromOutsideTheBox: 4, headedGoals: 1, leftFootGoals: 10, rightFootGoals: 1, penaltyWon: 0,
      assists: 7, expectedAssists: 7.58, touches: 960, bigChancesCreated: 13, keyPasses: 43, accuratePasses: 513, accuratePassesPercentage: 80, accurateOwnHalfPasses: 99, accurateOwnHalfPassesPercentage: 91, accurateOppositionHalfPasses: 414, accurateOppositionHalfPassesPercentage: 78, accurateLongBalls: 26, accurateLongBallsPercentage: 56, accurateChippedPasses: 21, accurateChippedPassesPercentage: 34, accurateCrosses: 12, accurateCrossesPercentage: 36,
      interceptions: 1, tackles: 8, possessionWonAttThird: 12, ballRecovery: 28, dribbledPast: 5, clearances: 0, blockedShots: 0, errorLeadToShot: 0, errorLeadToGoal: 0,
      successfulDribbles: 33, successfulDribblesPercentage: 49, totalDuelsWon: 68, totalDuelsWonPercentage: 45, groundDuelsWon: 67, groundDuelsWonPercentage: 46, aerialDuelsWon: 1, aerialDuelsWonPercentage: 40, possessionLost: 245, fouls: 12, wasFouled: 23, offsides: 9,
      yellowCards: 2, yellowRedCards: 0, redCards: 0
    };

    if (selectedTournament.name === "MLS" && selectedSeason.year === "2026") {
      return base; // Show exactly the screenshot mock for 2026
    }
    
    // Slightly alter base for other permutations
    return Object.fromEntries(Object.entries(base).map(([k, v]) => {
      if (typeof v === 'number' && v > 5) return [k, Math.floor(v * multiplier)];
      return [k, v];
    }));
  }, [selectedTournament, selectedSeason, fetchedStats]);

  const a = stats.appearances || 1;

  return (
    <div className="w-full max-w-6xl mx-auto bg-[#16181c] rounded-2xl border border-white/5 shadow-2xl overflow-hidden text-white font-sans flex flex-col mb-20">
      
      {/* Header Dropdowns */}
      <div className="flex border-b border-white/5 px-6 py-4 bg-[#121316] items-center gap-6">
        <div className="flex gap-8 font-bold text-sm tracking-wide uppercase text-gray-400">
           <span 
             onClick={() => setActiveTab('overview')}
             className={`cursor-pointer transition-colors ${activeTab === 'overview' ? 'text-[#F6B5CC] border-b-2 border-[#F6B5CC] pb-4 -mb-[18px]' : 'hover:text-white pb-4 -mb-[18px]'}`}
           >Overview</span>
           <span 
             onClick={() => setActiveTab('detailed')}
             className={`cursor-pointer transition-colors ${activeTab === 'detailed' ? 'text-[#F6B5CC] border-b-2 border-[#F6B5CC] pb-4 -mb-[18px]' : 'hover:text-white pb-4 -mb-[18px]'}`}
           >Detailed Season Stats</span>
        </div>
      </div>

      <div className="p-6 md:p-8 space-y-8 bg-[#16181c] min-h-[500px]">
        
        {/* League & Season Dropdowns */}

        <div className="flex flex-wrap items-center gap-3 border-b border-white/5 pb-6 relative z-30">
          <div className="relative group">
            <button className="flex items-center gap-3 px-4 py-2 bg-[#1f2126] border border-white/5 rounded-lg hover:bg-[#2a2c33] transition-colors cursor-pointer">
              <div className="w-5 h-5 rounded bg-white/10 flex items-center justify-center text-[10px] font-bold">
                {selectedTournament.name.substring(0, 1)}
              </div>
              <span className="font-bold text-sm">{selectedTournament.name}</span>
              <ChevronDown className="w-4 h-4 text-gray-500" />
            </button>
            <div className="absolute top-full left-0 mt-1 w-56 bg-[#1f2126] border border-white/5 rounded-lg shadow-xl overflow-hidden opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
              {tournamentsList.map(t => (
                <button 
                  key={t.id} 
                  className="w-full text-left px-4 py-3 hover:bg-white/5 text-sm font-semibold transition-colors cursor-pointer"
                  onClick={() => { setSelectedTournament(t); setSelectedSeason(t.seasons[0]); }}
                >
                  {t.name}
                </button>
              ))}
            </div>
          </div>

          <div className="relative group">
            <button className="flex items-center gap-3 px-4 py-2 bg-[#1f2126] border border-white/5 rounded-lg hover:bg-[#2a2c33] transition-colors cursor-pointer">
              <span className="font-bold text-sm">{selectedSeason.year}</span>
              <ChevronDown className="w-4 h-4 text-gray-500" />
            </button>
            <div className="absolute top-full left-0 mt-1 w-32 bg-[#1f2126] border border-white/5 rounded-lg shadow-xl overflow-hidden opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
              {selectedTournament.seasons.map(s => (
                <button 
                  key={s.id} 
                  className="w-full text-left px-4 py-3 hover:bg-white/5 text-sm font-semibold transition-colors cursor-pointer"
                  onClick={() => setSelectedSeason(s)}
                >
                  {s.year}
                </button>
              ))}
            </div>
          </div>
        </div>

        
        {activeTab === 'overview' ? (
          <div className={`transition-opacity duration-300 ${isLoading ? 'opacity-50' : 'opacity-100'} space-y-8`}>
            
            {/* Header Profile Section */}
            <div className="relative bg-[#1a1c21] rounded-2xl border border-white/5 p-8 flex flex-col md:flex-row gap-8 items-center md:items-start overflow-hidden">
               {/* Faded Watermark */}
               <div className="absolute right-8 top-1/2 -translate-y-1/2 text-[150px] font-black text-white/5 pointer-events-none select-none">
                 10
               </div>

               {/* Avatar */}
               <div className="relative">
                 <div className="w-32 h-32 rounded-full bg-[#1a1c21] border-4 border-[#252830] flex items-center justify-center shadow-[0_0_40px_rgba(246,181,204,0.15)] z-10 relative">
                   <span className="text-4xl font-black text-[#F6B5CC] tracking-tighter">LM</span>
                 </div>
               </div>

               {/* Info */}
               <div className="flex flex-col flex-1 z-10 w-full text-center md:text-left">
                 <h1 className="text-5xl font-black text-white mb-2">Lionel Messi</h1>
                 <div className="flex flex-wrap justify-center md:justify-start items-center gap-3 text-sm font-semibold text-gray-400 mb-6">
                   <div className="flex items-center gap-2">
                     <div className="w-2.5 h-2.5 rounded-full bg-[#F6B5CC]" />
                     <span className="text-white">Inter Miami CF</span>
                   </div>
                   <span>|</span>
                   <span>AR Argentina</span>
                   <span>|</span>
                   <div className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-xs text-[#F6B5CC]">
                     €16.3M Value
                   </div>
                 </div>

                 {/* Badges */}
                 <div className="flex flex-wrap justify-center md:justify-start gap-3">
                   <div className="flex flex-col bg-[#121316] border border-white/5 rounded-lg px-4 py-2">
                     <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Position</span>
                     <span className="text-sm font-bold text-white mt-0.5">Forward (RW)</span>
                   </div>
                   <div className="flex flex-col bg-[#121316] border border-white/5 rounded-lg px-4 py-2">
                     <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Age</span>
                     <span className="text-sm font-bold text-white mt-0.5">38 yrs</span>
                   </div>
                   <div className="flex flex-col bg-[#121316] border border-white/5 rounded-lg px-4 py-2">
                     <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Height</span>
                     <span className="text-sm font-bold text-white mt-0.5">169 cm</span>
                   </div>
                   <div className="flex flex-col bg-[#121316] border border-white/5 rounded-lg px-4 py-2">
                     <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Foot</span>
                     <span className="text-sm font-bold text-white mt-0.5">Left</span>
                   </div>
                   <div className="flex flex-col bg-[#121316] border border-white/5 rounded-lg px-4 py-2">
                     <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Contract</span>
                     <span className="text-sm font-bold text-white mt-0.5">Dec 2028</span>
                   </div>
                 </div>
               </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
               {/* Left Column */}
               <div className="space-y-8">
                 {/* Ratings Trend */}
                 <div className="bg-[#1a1c21] rounded-2xl border border-white/5 p-6">
                   <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                     <Activity className="w-5 h-5 text-[#F6B5CC]" />
                     Recent Ratings Trend
                   </h3>
                   <div className="h-48 w-full">
                     <ResponsiveContainer width="100%" height="100%">
                       <LineChart data={recentRatingsData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                         <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                         <XAxis dataKey="match" stroke="rgba(255,255,255,0.3)" tick={{fill: 'rgba(255,255,255,0.5)', fontSize: 12}} tickLine={false} axisLine={false} />
                         <YAxis domain={[6, 10]} stroke="rgba(255,255,255,0.3)" tick={{fill: 'rgba(255,255,255,0.5)', fontSize: 12}} tickLine={false} axisLine={false} width={30} />
                         <Tooltip contentStyle={{backgroundColor: '#1f2126', border: 'none', borderRadius: '8px'}} itemStyle={{color: '#F6B5CC'}} />
                         <Line type="monotone" dataKey="rating" stroke="#F6B5CC" strokeWidth={3} dot={{ r: 4, fill: '#1a1c21', stroke: '#F6B5CC', strokeWidth: 2 }} activeDot={{ r: 6, fill: '#F6B5CC' }} />
                       </LineChart>
                     </ResponsiveContainer>
                   </div>
                 </div>

                 {/* Active Tournaments */}
                 <div className="bg-[#1a1c21] rounded-2xl border border-white/5 p-6">
                   <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                     <div className="w-4 h-4 rounded border-2 border-[#F6B5CC] flex items-center justify-center">
                       <div className="w-1.5 h-1.5 bg-[#F6B5CC] rounded-full" />
                     </div>
                     Active Tournaments
                   </h3>
                   <div className="flex flex-wrap gap-3">
                     <span className="px-4 py-2 bg-white/5 border border-white/10 rounded-full text-sm font-semibold text-white">FIFA World Cup</span>
                     <span className="px-4 py-2 bg-white/5 border border-white/10 rounded-full text-sm font-semibold text-white">MLS</span>
                     <span className="px-4 py-2 bg-white/5 border border-white/10 rounded-full text-sm font-semibold text-white">Leagues Cup</span>
                     <span className="px-4 py-2 bg-white/5 border border-white/10 rounded-full text-sm font-semibold text-white">CONCACAF Champions Cup</span>
                   </div>
                 </div>
               </div>

               {/* Right Column */}
               <div className="space-y-8">
                 {/* Season Attributes */}
                 <div className="bg-[#1a1c21] rounded-2xl border border-white/5 p-6 h-[312px]">
                   <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                     <Star className="w-5 h-5 text-[#F6B5CC]" />
                     Season Attributes <span className="text-gray-500 font-normal text-sm">(Mocked)</span>
                   </h3>
                   <div className="h-full w-full -mt-4">
                     <ResponsiveContainer width="100%" height="100%">
                       <RadarChart cx="50%" cy="50%" outerRadius="65%" data={radarData}>
                         <PolarGrid stroke="rgba(255,255,255,0.1)" />
                         <PolarAngleAxis dataKey="subject" tick={{fill: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: 600}} />
                         <Radar name="Attributes" dataKey="A" stroke="#F6B5CC" fill="#F6B5CC" fillOpacity={0.3} />
                       </RadarChart>
                     </ResponsiveContainer>
                   </div>
                 </div>

                 {/* Transfer History */}
                 <div className="bg-[#1a1c21] rounded-2xl border border-white/5 p-6">
                   <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                     <span className="text-[#F6B5CC]">→</span>
                     Transfer History
                   </h3>
                   <div className="space-y-3">
                     <div className="flex justify-between items-center bg-[#121316] border border-white/5 rounded-xl p-4">
                       <div className="flex items-center gap-3">
                         <span className="text-sm font-bold text-gray-400">PSG</span>
                         <span className="text-gray-600">→</span>
                         <span className="text-sm font-bold text-white">Inter Miami CF</span>
                       </div>
                       <div className="text-right">
                         <div className="text-sm font-bold text-[#F6B5CC]">Free</div>
                         <div className="text-[10px] text-gray-500 font-semibold uppercase">Jul 15, 2023</div>
                       </div>
                     </div>
                     <div className="flex justify-between items-center bg-[#121316] border border-white/5 rounded-xl p-4">
                       <div className="flex items-center gap-3">
                         <span className="text-sm font-bold text-gray-400">FC Barcelona</span>
                         <span className="text-gray-600">→</span>
                         <span className="text-sm font-bold text-white">PSG</span>
                       </div>
                       <div className="text-right">
                         <div className="text-sm font-bold text-[#F6B5CC]">Free</div>
                         <div className="text-[10px] text-gray-500 font-semibold uppercase">Aug 10, 2021</div>
                       </div>
                     </div>
                   </div>
                 </div>
               </div>
            </div>

            {/* Footer Bio */}
            <div className="mt-8 pt-8 border-t border-white/5">
              <p className="text-gray-400 text-sm leading-relaxed">
                Lionel Messi is 38 years old (Jun 24, 1987), 169 cm tall and plays for Inter Miami CF. Lionel Messi prefers to play with left foot. His jersey number is 10. Lionel Messi career statistics, match ratings, heatmap and goals are available on Sofascore for current and previous seasons. Last player match was Argentina - Algeria (3 - 0) and Lionel Messi received 10 Sofascore rating.
              </p>
            </div>
          </div>
        ) : (
          <div className={`transition-opacity duration-300 ${isLoading ? 'opacity-50' : 'opacity-100'}`}>
{/* Top Graph Area (Matches) */}
        <div className="bg-[#1a1c21] rounded-xl border border-white/5 p-6 mb-8 relative">
           <div className="flex justify-between items-center mb-6">
             <h3 className="font-bold text-lg">Average Sofascore Rating</h3>
             <div className="flex items-center gap-2 font-black text-xl">
               <div className="w-4 h-4 bg-[#00a8e8] rounded-sm" />
               8.63
               <Info className="w-5 h-5 text-gray-400" />
             </div>
           </div>
           
           <div className="h-40 w-full mb-4">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={ratingsData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="match" stroke="rgba(255,255,255,0.3)" tick={{fill: 'rgba(255,255,255,0.7)', fontSize: 12}} tickLine={false} axisLine={false} />
                  <YAxis domain={[7, 10]} hide />
                  <Tooltip contentStyle={{backgroundColor: '#1f2126', border: 'none', borderRadius: '8px'}} />
                  <Line type="stepAfter" dataKey="rating" stroke="#00a8e8" strokeWidth={2} dot={{ r: 4, fill: '#00a8e8', strokeWidth: 0 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-t border-white/10 pt-6">
             <div className="flex flex-col">
               <h3 className="text-white font-bold text-center mb-4">Season heatmap</h3>
               <div className="h-48 w-full rounded-xl border border-black/40 relative overflow-hidden bg-[#416238] flex items-center justify-center">
                 {/* Pitch Lines */}
                 <div className="absolute inset-2 border-[1.5px] border-white/30 pointer-events-none" />
                 <div className="absolute top-0 bottom-0 left-1/2 border-l-[1.5px] border-white/30 pointer-events-none" />
                 <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full border-[1.5px] border-white/30 pointer-events-none" />
                 <div className="absolute left-2 top-1/2 -translate-y-1/2 w-16 h-24 border-[1.5px] border-white/30 border-l-0 pointer-events-none" />
                 <div className="absolute right-2 top-1/2 -translate-y-1/2 w-16 h-24 border-[1.5px] border-white/30 border-r-0 pointer-events-none" />
                 
                 {/* Heat Spots */}
                 <div className="absolute w-32 h-40 bg-red-600/80 blur-xl rounded-full mix-blend-color-burn" style={{ top: '30%', right: '20%' }} />
                 <div className="absolute w-24 h-24 bg-yellow-400/90 blur-xl rounded-full mix-blend-screen" style={{ top: '40%', right: '25%' }} />
                 <div className="absolute w-16 h-16 bg-red-600/70 blur-lg rounded-full mix-blend-screen" style={{ top: '50%', left: '40%' }} />
               </div>
             </div>

             <div className="flex flex-col border-l border-white/10 pl-8">
               <h3 className="text-white font-bold text-center mb-4">Matches</h3>
               <div className="space-y-1 mt-2">
                 <StatRow label="Appearances" value={stats.appearances} />
                 <StatRow label="Started" value={stats.matchesStarted} />
                 <StatRow label="Minutes per game" value={Math.round(stats.minutesPlayed / a)} />
                 <StatRow label="Total minutes played" value={stats.minutesPlayed} />
                 <StatRow label="Team of the week" value={stats.totwAppearances} />
               </div>
             </div>
           </div>
        </div>

            {/* 4 Column Data Grid */}
        <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 transition-opacity duration-300 ${isLoading ? 'opacity-50' : 'opacity-100'}`}>
          
          <StatColumn title="Attacking">
            <StatRow label="Goals" value={stats.goals} />
            <StatRow label="Expected goals (xG)" tooltip value={stats.expectedGoals} />
            <StatRow label="Scoring frequency (in minutes)" value={`${stats.scoringFrequency}min`} />
            <StatRow label="Goals per game" value={(stats.goals / a).toFixed(1)} />
            <StatRow label="Total shots" value={(stats.totalShots / a).toFixed(1)} />
            <StatRow label="Shots on target per game" value={(stats.shotsOnTarget / a).toFixed(1)} />
            <StatRow label="Big chances missed" value={stats.bigChancesMissed} />
            <StatRow label="Goal conversion" value={`${stats.goalConversionPercentage}%`} />
            <StatRow label="Free kick goals" value={`${stats.freeKickGoal}/${Math.round(stats.freeKickGoal/(stats.freeKickConversion/100)) || 19}`} />
            <StatRow label="Free kick conversion" value={`${stats.freeKickConversion}%`} />
            <StatRow label="Goals from inside the box" value={`${stats.goalsFromInsideTheBox}/${Math.round(stats.goalsFromInsideTheBox/(stats.goalConversionPercentage/100)) || 45}`} />
            <StatRow label="Goals from outside the box" value={`${stats.goalsFromOutsideTheBox}/${Math.round(stats.goalsFromOutsideTheBox/(stats.goalConversionPercentage/100)) || 39}`} />
            <StatRow label="Headed goals" value={stats.headedGoals} />
            <StatRow label="Left-footed goals" value={stats.leftFootGoals} />
            <StatRow label="Right-footed goals" value={stats.rightFootGoals} />
            <StatRow label="Penalty won" value={stats.penaltyWon} />
          </StatColumn>

          <StatColumn title="Passing">
            <StatRow label="Assists" value={stats.assists} />
            <StatRow label="Expected assists (xA)" value={stats.expectedAssists} />
            <StatRow label="Touches" value={(stats.touches / a).toFixed(1)} />
            <StatRow label="Big chances created" value={stats.bigChancesCreated} />
            <StatRow label="Key passes" value={(stats.keyPasses / a).toFixed(1)} />
            <StatRow label="Accurate passes" value={(stats.accuratePasses / a).toFixed(1)} subValue={`${stats.accuratePassesPercentage}%`} />
            <StatRow label="Acc. own half" value={(stats.accurateOwnHalfPasses / a).toFixed(1)} subValue={`${stats.accurateOwnHalfPassesPercentage || 91}%`} />
            <StatRow label="Acc. opposition half" value={(stats.accurateOppositionHalfPasses / a).toFixed(1)} subValue={`${stats.accurateOppositionHalfPassesPercentage || 78}%`} />
            <StatRow label="Long balls (accurate)" value={(stats.accurateLongBalls / a).toFixed(1)} subValue={`${stats.accurateLongBallsPercentage}%`} />
            <StatRow label="Accurate chip passes" value={(stats.accurateChippedPasses / a).toFixed(1)} subValue={`${stats.accurateChippedPassesPercentage || 34}%`} />
            <StatRow label="Acc. crosses" value={(stats.accurateCrosses / a).toFixed(1)} subValue={`${stats.accurateCrossesPercentage}%`} />
          </StatColumn>

          <StatColumn title="Defending">
            <StatRow label="Interceptions" value={(stats.interceptions / a).toFixed(1)} />
            <StatRow label="Tackles per game" value={(stats.tackles / a).toFixed(1)} />
            <StatRow label="Possession won (final third)" value={(stats.possessionWonAttThird / a).toFixed(1)} />
            <StatRow label="Balls recovered per game" value={(stats.ballRecovery / a).toFixed(1)} />
            <StatRow label="Dribbled past per game" value={(stats.dribbledPast / a).toFixed(1)} />
            <StatRow label="Clearances per game" value={(stats.clearances / a).toFixed(1)} />
            <StatRow label="Blocked shots per game" value={(stats.blockedShots / a).toFixed(1)} />
            <StatRow label="Errors leading to shot" value={stats.errorLeadToShot} />
            <StatRow label="Errors leading to goal" value={stats.errorLeadToGoal} />
          </StatColumn>

          <StatColumn title="Other (per game)">
            <StatRow label="Succ. dribbles" value={(stats.successfulDribbles / a).toFixed(1)} subValue={`${stats.successfulDribblesPercentage}%`} />
            <StatRow label="Total duels won" value={(stats.totalDuelsWon / a).toFixed(1)} subValue={`${stats.totalDuelsWonPercentage}%`} />
            <StatRow label="Ground duels won" value={(stats.groundDuelsWon / a).toFixed(1)} subValue={`${stats.groundDuelsWonPercentage}%`} />
            <StatRow label="Aerial duels won" value={(stats.aerialDuelsWon / a).toFixed(1)} subValue={`${stats.aerialDuelsWonPercentage}%`} />
            <StatRow label="Possession lost" value={(stats.possessionLost / a).toFixed(1)} />
            <StatRow label="Fouls per game" value={(stats.fouls / a).toFixed(1)} />
            <StatRow label="Was fouled" value={(stats.wasFouled / a).toFixed(1)} />
            <StatRow label="Offsides" value={(stats.offsides / a).toFixed(1)} />
          </StatColumn>

        </div>

        {/* Bottom Area */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-6">
           <div className="bg-[#1a1c21] rounded-xl border border-white/5 p-6">
             <StatColumn title="Cards">
                <StatRow label="Yellow" value={stats.yellowCards} />
                <StatRow label="Red (2 yellows)" value={stats.yellowRedCards || 0} />
                <StatRow label="Red" value={stats.redCards} />
             </StatColumn>
           </div>
           
           <div className="bg-[#1a1c21] rounded-xl border border-white/5 p-6 flex flex-col items-center">
             <h3 className="text-white font-bold text-center w-full pb-3 border-b border-white/10 mb-4">Season penalty shotmap</h3>
             
             <div className="flex gap-2 mb-6 bg-[#121316] p-1 rounded-full text-xs font-bold">
               <div className="px-4 py-1.5 bg-white text-black rounded-full">All</div>
               <div className="px-4 py-1.5 text-gray-400">Goal</div>
               <div className="px-4 py-1.5 text-gray-400">Missed</div>
               <div className="px-4 py-1.5 text-gray-400">Saved</div>
             </div>

             <div className="relative w-48 h-28 border-4 border-white border-b-0 flex items-end justify-center mb-0 mt-4">
                <div className="absolute inset-0 grid grid-cols-5 grid-rows-3 opacity-20 pointer-events-none">
                  {Array.from({length: 15}).map((_,i) => <div key={i} className="border border-white" />)}
                </div>
                <div className="w-5 h-5 rounded-full bg-white border-2 border-blue-500 absolute bottom-0 shadow-[0_0_15px_rgba(59,130,246,0.8)] z-10 translate-y-1" />
             </div>
             <div className="w-full max-w-[280px] h-8 bg-[#416238] rounded-t-lg -mt-1 z-0 relative" />

             <div className="w-full flex justify-between mt-6 text-sm px-4">
                <div>
                   <div className="text-gray-400 font-bold mb-1">Outcome</div>
                   <div className="text-white font-bold text-base">Goal</div>
                </div>
                <div className="text-right">
                   <div className="text-gray-400 font-bold mb-1">Goal zone</div>
                   <div className="text-white font-bold text-base">Low centre</div>
                </div>
             </div>

             <div className="w-full space-y-1 mt-6 border-t border-white/10 pt-4">
                <StatRow label="Penalty goals" value="1/1" />
                <StatRow label="Penalty conversion" value="100%" />
             </div>
           </div>
        </div>
          
          </div>
        )}
      </div>
    </div>
  );
};

export default MessiCardMockup;
