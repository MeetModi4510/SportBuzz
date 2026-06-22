import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, X, Flame, Loader2, BarChart3 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface PlayerMatchStatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  player: any;
  teamId?: number;
  teamName?: string;
  teamColor?: string;
  playerStats?: any;
  onNext?: () => void;
  onPrev?: () => void;
}

const getRatingBadgeClass = (rating: string | number) => {
  const r = parseFloat(rating as string);
  if (isNaN(r)) return 'text-slate-400 bg-white/5';
  if (r >= 9.0) return 'text-white bg-gradient-to-br from-[#a855f7] to-[#ec4899] shadow-[0_4px_12px_rgba(236,72,153,0.5)]';
  if (r >= 8.0) return 'text-white bg-[#10b981] shadow-[0_4px_10px_rgba(16,185,129,0.4)]';
  if (r >= 7.0) return 'text-white bg-[#34d399] shadow-[0_4px_10px_rgba(52,211,153,0.3)]';
  if (r >= 6.0) return 'text--[#1a1b1c] bg-[#fbbf24] shadow-[0_4px_10px_rgba(251,191,36,0.3)]';
  return 'text-white bg-[#ef4444] shadow-[0_4px_10px_rgba(239,68,68,0.3)]';
};

const HeatmapRenderer = ({ position, stats }: { position: any, stats: any }) => {
  // Generate a realistic looking heatmap based on player's position
  const blobs = useMemo(() => {
    // If we have real coordinates from Fotmob in the future, we use them.
    // For now, since Fotmob API doesn't expose raw touch coordinates in matchDetails, 
    // we generate a realistic positional heatmap for the visual.
    const generated = [];
    const seedBase = position?.x ? Math.floor((position.x + position.y) * 100) : 123;
    
    const numBlobs = 15;
    const cx = position?.x ? position.x * 100 : 50;
    const cy = position?.y ? position.y * 100 : 50;
    
    for (let i = 0; i < numBlobs; i++) {
      const offsetX = (Math.sin(seedBase + i * 1.5) * 20);
      const offsetY = (Math.cos(seedBase + i * 2.5) * 20);
      generated.push({
        x: Math.max(10, Math.min(90, cx + offsetX)),
        y: Math.max(10, Math.min(90, cy + offsetY)),
        size: 30 + (Math.sin(seedBase + i) * 10),
        intensity: Math.sin(seedBase + i * 3) > 0 ? 'high' : 'medium'
      });
    }
    return generated;
  }, [position]);

  return (
    <div className="relative w-full aspect-[16/9] bg-[#222222] rounded-lg border border-white/10 overflow-hidden mb-4 shadow-inner">
      {/* Pitch Lines */}
      <div className="absolute inset-2 border border-white/20 pointer-events-none" />
      <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 border-l border-white/20 pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full border border-white/20 pointer-events-none" />
      
      {/* Penalty Boxes */}
      <div className="absolute top-1/2 left-2 -translate-y-1/2 w-16 h-24 border border-white/20 border-l-0 pointer-events-none" />
      <div className="absolute top-1/2 right-2 -translate-y-1/2 w-16 h-24 border border-white/20 border-r-0 pointer-events-none" />

      {/* Heatmap Blobs Overlay */}
      <div className="absolute inset-0 filter blur-xl opacity-60 pointer-events-none flex items-center justify-center mix-blend-screen">
        {blobs.map((blob, i) => (
          <div
            key={i}
            className={`absolute rounded-full ${blob.intensity === 'high' ? 'bg-[#eab308]' : 'bg-[#22c55e]'}`}
            style={{
              left: `${blob.x}%`,
              top: `${blob.y}%`,
              width: `${blob.size}px`,
              height: `${blob.size}px`,
              transform: 'translate(-50%, -50%)',
              opacity: blob.intensity === 'high' ? 0.8 : 0.6
            }}
          />
        ))}
      </div>
    </div>
  );
};

export const PlayerMatchStatsModal = ({ 
  isOpen, 
  onClose, 
  player, 
  teamId, 
  teamName, 
  playerStats,
  isLoading,
  onNext,
  onPrev
}: PlayerMatchStatsModalProps & { isLoading?: boolean }) => {

  const navigate = useNavigate();
  const [profileData, setProfileData] = React.useState<any>(null);

  React.useEffect(() => {
    if (isOpen && player?.id) {
       const API_BASE = import.meta.env.VITE_API_URL || '';
       fetch(`${API_BASE}/api/football/fotmob-player/${player.id}`)
         .then(res => res.json())
         .then(data => {
            if (data?.success && data?.data) {
               setProfileData(data.data);
            }
         }).catch(console.error);
    }
  }, [isOpen, player?.id]);
  
  if (!player) return null;

  // Extract Stats
  let ratingRaw = player.performance?.rating || player.rating || '-';
  if (typeof ratingRaw === 'object' && ratingRaw !== null) {
    ratingRaw = ratingRaw.num || ratingRaw.value || ratingRaw.rating || '-';
  }
  const rating = ratingRaw;
  let positionRaw = playerStats?.positionStringShort || player.positionStringShort || player.role || player.positionName || player.usualPosition || playerStats?.usualPosition || 'Player';
  if (typeof positionRaw === 'number' || (typeof positionRaw === 'string' && !isNaN(Number(positionRaw)))) {
     positionRaw = player.positionStringShort || player.positionName || 'Player';
  }
  const positionName = positionRaw;
  
  let fetchedAge = player.age || playerStats?.age || player.athlete?.age || '-';
  let fetchedTeamName = teamName || '-';

  if (profileData) {
      if (profileData.primaryTeam?.name) fetchedTeamName = profileData.primaryTeam.name;
      if (Array.isArray(profileData.playerInformation)) {
          const ageInfo = profileData.playerInformation.find((i: any) => i?.title === 'Age' || i?.translationKey === 'age');
          if (ageInfo) fetchedAge = typeof ageInfo.value === 'object' ? ageInfo.value.fallback : ageInfo.value;
      }
  }

  // Real stats parsing from Fotmob playerStats object
  let topStats: any[] = [];
  let touches = '-';
  let highlights: string[] = [];
  let allSections: any[] = [];

  if (playerStats?.stats) {
    allSections = Array.isArray(playerStats.stats) ? playerStats.stats : [];
    const topStatsSection = allSections.find((s: any) => s.title === 'Top stats' || s.title === 'Attack');
    if (topStatsSection && typeof topStatsSection.stats === 'object') {
      topStats = Object.keys(topStatsSection.stats).map(key => {
         const obj = topStatsSection.stats[key];
         return { title: key, value: obj?.stat?.value ?? obj?.value ?? '-' };
      });
    }

    // Try to find touches
    const passesSection = allSections.find((s: any) => s.title === 'Passes' || s.title === 'Attack');
    if (passesSection && typeof passesSection.stats === 'object') {
      const keys = Object.keys(passesSection.stats);
      const touchesKey = keys.find(k => k.toLowerCase() === 'touches');
      if (touchesKey) touches = passesSection.stats[touchesKey]?.stat?.value?.toString() || '-';
    } else {
      // Fallback
      if (Array.isArray(topStats)) {
         const anyTouches = topStats.find((s: any) => s.title?.toLowerCase() === 'touches');
         if (anyTouches) touches = anyTouches.value;
      }
    }
    
    // Extract intelligent highlights
    if (Array.isArray(playerStats.events) && playerStats.events.length > 0) {
      highlights = playerStats.events.map((e: any) => {
         if (typeof e === 'string') return e;
         return e.text || e.title || e.description || JSON.stringify(e);
      });
    } else {
      // Generate realistic and grammatically correct highlights based on impressive stats
      const getStat = (titleIncludes: string) => {
         if (allSections.length > 0) {
             for (const section of allSections) {
                 if (!section.stats || typeof section.stats !== 'object') continue;
                 const key = Object.keys(section.stats).find(k => k.toLowerCase().includes(titleIncludes.toLowerCase()));
                 if (key) return parseFloat(section.stats[key]?.stat?.value ?? section.stats[key]?.value ?? '0');
             }
         } else if (Array.isArray(topStats)) {
             const stat = topStats.find((s: any) => s.title?.toLowerCase().includes(titleIncludes.toLowerCase()));
             return parseFloat(stat?.value ?? '0');
         }
         return 0;
      };

      const goalsMatch = getStat('goals');
      // prevent matching 'expected goals'
      const actualGoals = getStat('goals') === getStat('expected goals') ? 0 : getStat('goals'); // Hacky check. Better to look exactly for 'Goals'
      
      const exactGoals = (() => {
        if (allSections.length > 0) {
             for (const section of allSections) {
                 if (!section.stats) continue;
                 const key = Object.keys(section.stats).find(k => k.toLowerCase() === 'goals');
                 if (key) return parseFloat(section.stats[key]?.stat?.value ?? section.stats[key]?.value ?? '0');
             }
         } else if (Array.isArray(topStats)) {
             const stat = topStats.find((s: any) => s.title?.toLowerCase() === 'goals');
             return parseFloat(stat?.value ?? '0');
         }
         return 0;
      })();

      if (exactGoals > 0) highlights.push(exactGoals === 1 ? `Scored 1 goal in this match` : `Scored ${exactGoals} goals in this match`);
      
      const exactAssists = (() => {
        if (allSections.length > 0) {
             for (const section of allSections) {
                 if (!section.stats) continue;
                 const key = Object.keys(section.stats).find(k => k.toLowerCase() === 'assists');
                 if (key) return parseFloat(section.stats[key]?.stat?.value ?? section.stats[key]?.value ?? '0');
             }
         } else if (Array.isArray(topStats)) {
             const stat = topStats.find((s: any) => s.title?.toLowerCase() === 'assists');
             return parseFloat(stat?.value ?? '0');
         }
         return 0;
      })();
      if (exactAssists > 0) highlights.push(exactAssists === 1 ? `Provided 1 assist` : `Provided ${exactAssists} assists`);
      
      const chances = getStat('chances created');
      if (chances >= 2) highlights.push(`Created ${chances} chances`); // Only highlight if impressive (2+)
      else if (chances === 1 && highlights.length === 0) highlights.push(`Created 1 chance`); // Or if it's the only thing they did
      
      const tackles = getStat('tackles won');
      if (tackles >= 3) highlights.push(`Won ${tackles} tackles`);
      
      const saves = getStat('saves');
      if (saves >= 3) highlights.push(`Made ${saves} crucial saves`);
      
      const r = parseFloat(rating as string);
      if (highlights.length === 0 && !isNaN(r) && r >= 8.0) {
         highlights.push(`Delivered an outstanding performance with an ${r.toFixed(1)} match rating`);
      }
    }
  }

  // Fallback to basic stats if playerStats is empty (e.g. friendly match)
  if (!Array.isArray(topStats) || topStats.length === 0) {
    topStats = [
      { title: 'Goals', value: player.goals || '0' },
      { title: 'Assists', value: player.assists || '0' },
      { title: 'Expected goals (xG)', value: player.xg || '0.00' }
    ];
  }

  const getPlayerName = () => {
    if (typeof player.name === 'string') return player.name;
    if (player.athlete?.displayName) return player.athlete.displayName;
    if (player.athlete?.shortName) return player.athlete.shortName;
    if (player.name?.name) return player.name.name;
    if (player.name?.fullName) return player.name.fullName;
    if (player.name?.firstName && player.name?.lastName) return `${player.name.firstName} ${player.name.lastName}`;
    if (player.firstName && player.lastName) return `${player.firstName} ${player.lastName}`;
    return 'Unknown Player';
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm"
          />

          {/* Modal Container for Centering */}
          <div className="fixed inset-0 z-[101] flex items-end justify-center md:items-center p-0 md:p-4 pointer-events-none">
            {/* Modal Content */}
            <motion.div
              initial={{ opacity: 0, y: '100%' }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: '100%' }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="w-full md:w-[400px] bg-[#1a1b1c] rounded-t-3xl md:rounded-3xl shadow-2xl flex flex-col max-h-[90vh] md:max-h-[85vh] overflow-hidden border border-white/10 pointer-events-auto"
            >
              {/* Premium Header Area */}
              <div className="relative pt-6 pb-6 px-6 bg-[#151617] border-b border-white/5">
                {/* Close Button */}
                <div className="absolute top-4 right-4 z-10">
                  <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors border border-white/10">
                    <X className="w-4 h-4 text-white" />
                  </button>
                </div>

                <div className="flex items-center gap-5 mt-2">
                  {/* Player Image & Rating Container */}
                  <div className="relative shrink-0">
                    <div className="w-24 h-24 rounded-2xl overflow-hidden bg-gradient-to-br from-white/10 to-transparent p-0.5 shadow-xl">
                      <div className="w-full h-full rounded-xl overflow-hidden bg-[#1a1b1c]">
                        <img 
                          src={`https://images.fotmob.com/image_resources/playerimages/${player.id}.png`} 
                          alt={getPlayerName()} 
                          className="w-full h-full object-cover object-top"
                          onError={(e: any) => e.target.src = 'https://www.fotmob.com/_next/static/media/player_fallback.b8f72535.png'}
                        />
                      </div>
                    </div>
                    {/* Rating Badge at Bottom Center */}
                    {rating !== '-' && (
                      <div className="absolute -bottom-3 left-1/2 -translate-x-1/2">
                        <div className={`transform -skew-x-12 px-3 py-[1px] border-b-[2px] border-r-[2px] border-black/40 shadow-xl ${getRatingBadgeClass(rating)}`}>
                          <div className="transform skew-x-12 text-[15px] font-black tracking-widest text-center drop-shadow-md">
                            {rating}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Name & Details */}
                  <div className="flex flex-col flex-1 min-w-0">
                    <h2 className="text-white font-black text-2xl tracking-tight leading-none mb-3 truncate">
                      {getPlayerName()}
                    </h2>
                    <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-gray-300">
                      <div className="flex items-center bg-white/[0.03] px-2.5 py-1.5 rounded-md border border-white/[0.05]">
                        <span className="tracking-wide uppercase">{positionName || 'N/A'}</span>
                      </div>
                      <div className="flex items-center gap-1.5 bg-white/[0.03] px-2.5 py-1.5 rounded-md border border-white/[0.05]">
                        {teamId && <img src={`https://images.fotmob.com/image_resources/logo/teamlogo/${teamId}_xsmall.png`} className="w-3.5 h-3.5 object-contain" alt="Team" />}
                        <span className="truncate max-w-[120px]">{fetchedTeamName}</span>
                      </div>
                      <div className="flex items-center bg-white/[0.03] px-2.5 py-1.5 rounded-md border border-white/[0.05]">
                        <span>{fetchedAge} YRS</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            {/* Scrollable Content */}
            {isLoading ? (
              <div className="flex-1 flex flex-col items-center justify-center min-h-[300px] bg-[#1a1b1c]">
                <Loader2 className="w-8 h-8 animate-spin text-[#34d399]" />
                <span className="text-sm font-semibold text-gray-400 mt-4">Loading player stats...</span>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6 bg-[#1a1b1c] custom-scrollbar">
                
                {/* Heatmap Section */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <h3 className="text-white font-bold text-base">Heatmap</h3>
                    <span className="text-white font-bold text-sm">Touches <span className="text-gray-300 font-normal">{touches}</span></span>
                  </div>
                  <HeatmapRenderer position={player.verticalLayout} stats={playerStats} />
                </div>

                {/* Highlights Section */}
                {highlights.length > 0 && (
                  <div className="bg-[#1f2f22] border border-[#2d4d33] rounded-xl p-3.5 flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <div className="px-2 py-0.5 rounded-full bg-[#2d4d33] text-[#4ade80] text-[10px] font-bold uppercase tracking-wider">
                        Highlights
                      </div>
                    </div>
                    <span className="text-white font-medium text-sm">
                      {highlights[0]}
                    </span>
                  </div>
                )}

{/* Dynamic Stats Sections */}
                {allSections.length > 0 ? (
                  allSections.map((section: any, idx: number) => {
                    if (!section.title || !section.stats || typeof section.stats !== 'object') return null;
                    const statKeys = Object.keys(section.stats);
                    if (statKeys.length === 0) return null;
                    return (
                      <div key={idx} className="space-y-4 pb-2">
                        <div className="flex items-center gap-3">
                          <h3 className="text-white font-black text-[15px] uppercase tracking-wider">{section.title}</h3>
                          <div className="h-px bg-white/10 flex-1"></div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          {statKeys.map((key: string, i: number) => {
                            const statObj = section.stats[key];
                            const val = statObj?.stat?.value ?? statObj?.value ?? '-';
                            const displayKey = key.toLowerCase() === 'fotmob rating' ? 'Match Rating' : key;
                            return (
                              <div key={i} className="flex flex-col justify-center bg-gradient-to-br from-white/[0.05] to-white/[0.01] border border-white/[0.08] rounded-2xl p-4 hover:border-[#34d399]/40 transition-colors relative overflow-hidden group">
                                <span className="text-white font-black text-2xl tracking-tight mb-1 relative z-10">{val}</span>
                                <span className="text-[#9ca3af] group-hover:text-gray-300 transition-colors text-[11px] font-bold uppercase tracking-wider leading-tight relative z-10 pr-2">{displayKey}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="space-y-4 pb-6">
                    <div className="flex items-center gap-3">
                      <h3 className="text-white font-black text-[15px] uppercase tracking-wider">Top stats</h3>
                      <div className="h-px bg-white/10 flex-1"></div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {topStats.map((stat: any, i: number) => {
                        const displayTitle = stat.title?.toLowerCase() === 'fotmob rating' ? 'Match Rating' : stat.title;
                        return (
                          <div key={i} className="flex flex-col justify-center bg-gradient-to-br from-white/[0.05] to-white/[0.01] border border-white/[0.08] rounded-2xl p-4 hover:border-[#34d399]/40 transition-colors relative overflow-hidden group">
                             <span className="text-white font-black text-2xl tracking-tight mb-1 relative z-10">{stat.value}</span>
                             <span className="text-[#9ca3af] group-hover:text-gray-300 transition-colors text-[11px] font-bold uppercase tracking-wider leading-tight relative z-10 pr-2">{displayTitle}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

              </div>
            )}
            
            {/* Footer */}
            <div className="bg-[#1a1b1c] border-t border-white/5 px-5 py-3 flex justify-between items-center">
              <button 
                onClick={() => {
                  onClose();
                  navigate('/performance-lab', { 
                    state: { 
                      targetPlayerId: player.id,
                      targetPlayerName: getPlayerName(),
                      targetTeamName: teamName || (player.team?.name) || (player.team?.displayName),
                      fromMatchUrl: window.location.pathname
                    } 
                  });
                }}
                className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors cursor-pointer"
              >
                <div className="w-5 h-5 rounded-full border border-gray-500 flex items-center justify-center">
                  <span className="text-[10px]">👤</span>
                </div>
                <span className="text-sm font-medium">Player profile</span>
              </button>
              <button onClick={onClose} className="text-[#34d399] hover:text-[#10b981] font-medium text-sm transition-colors">
                Done
              </button>
            </div>
          </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};
