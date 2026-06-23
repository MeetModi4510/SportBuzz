const fs = require('fs');
const path = 'c:\\\\Users\\\\PRANSHU PATEL\\\\OneDrive\\\\Desktop\\\\dev_scripts\\\\src\\\\components\\\\football\\\\FotmobPlayerCard.tsx';
let content = fs.readFileSync(path, 'utf8');

const newComponents = `
// --- Match Detail Card (Right Column) ---
const MatchDetailCard = ({ activeShot, onPrev, onNext }: any) => {
  if (!activeShot) return null;

  return (
    <div className="flex flex-col dark:bg-[#121316] bg-[#1a1b1e] rounded-2xl border dark:border-white/5 border-slate-800 shadow-xl overflow-hidden w-full">
      {/* Header: Match Navigation */}
      <div className="flex items-center justify-between px-4 py-3 border-b dark:border-white/5 border-slate-700/50">
        <button onClick={onPrev} className="p-2 rounded-full hover:dark:bg-white/10 hover:bg-slate-700 transition-colors shrink-0">
          <ChevronLeft className="w-5 h-5 dark:text-white text-slate-200" />
        </button>
        
        <div className="flex items-center justify-center gap-3 flex-1 min-w-0">
          {activeShot.homeTeamName && activeShot.awayTeamName ? (
            <>
              <div className="flex items-center justify-end gap-2 flex-1 min-w-0">
                {activeShot.homeTeamId ? (
                  <img src={\`https://images.fotmob.com/image_resources/logo/teamlogo/\${activeShot.homeTeamId}.png\`} alt={activeShot.homeTeamName} className="w-6 h-6 object-contain shrink-0" onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.nextElementSibling?.classList.remove('hidden'); }} />
                ) : null}
                <div className={\`w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center text-[10px] font-bold text-white shrink-0 \${activeShot.homeTeamId ? 'hidden' : ''}\`}>
                  {activeShot.homeTeamName?.substring(0,1)}
                </div>
              </div>
              
              <span className="text-base font-black text-white shrink-0 mx-1">{activeShot.homeScore} - {activeShot.awayScore}</span>
              
              <div className="flex items-center justify-start gap-2 flex-1 min-w-0">
                {activeShot.awayTeamId ? (
                  <img src={\`https://images.fotmob.com/image_resources/logo/teamlogo/\${activeShot.awayTeamId}.png\`} alt={activeShot.awayTeamName} className="w-6 h-6 object-contain shrink-0" onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.nextElementSibling?.classList.remove('hidden'); }} />
                ) : null}
                <div className={\`w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center text-[10px] font-bold text-white shrink-0 \${activeShot.awayTeamId ? 'hidden' : ''}\`}>
                  {activeShot.awayTeamName?.substring(0,1)}
                </div>
              </div>
            </>
          ) : (
            <span className="text-sm font-bold text-slate-300">Shot Context</span>
          )}
        </div>
        
        <button onClick={onNext} className="p-2 rounded-full hover:dark:bg-white/10 hover:bg-slate-700 transition-colors shrink-0">
          <ChevronRight className="w-5 h-5 dark:text-white text-slate-200" />
        </button>
      </div>

      <div className="flex flex-row p-5 gap-4 items-center">
        {/* Left Stats */}
        <div className="flex flex-col gap-4 flex-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Minute</span>
            <span className="text-sm font-bold text-white">{activeShot.min}{activeShot.minAdded ? \`+\${activeShot.minAdded}\` : ''}'</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Shot type</span>
            <span className="text-sm font-bold text-white capitalize">{activeShot.shotType?.replace(/([A-Z])/g, ' $1').trim()}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Situation</span>
            <span className="text-sm font-bold text-white capitalize">{activeShot.situation?.replace(/([A-Z])/g, ' $1').trim()}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Result</span>
            <span className="text-sm font-bold text-white">{activeShot.isGoal ? 'Goal' : (activeShot.isOnTarget ? 'Saved' : 'Miss')}</span>
          </div>
        </div>

        {/* Right Mini Net Graphic */}
        <div className="flex flex-col w-[120px]">
          <div className="relative w-full aspect-[24/8] border-[1px] border-white/60 border-b-0 rounded-t-sm flex flex-col justify-end overflow-hidden">
            <div className="absolute inset-0">
              <svg width="100%" height="100%" className="opacity-20">
                <pattern id="mini-net-pattern" x="0" y="0" width="8" height="8" patternUnits="userSpaceOnUse">
                  <path d="M 8 0 L 0 8 M 0 0 L 8 8" fill="none" stroke="white" strokeWidth="0.5" />
                </pattern>
                <rect x="0" y="0" width="100%" height="100%" fill="url(#mini-net-pattern)" />
              </svg>
            </div>
            
            {activeShot.onGoalShot && (
              <div 
                className="absolute z-20 w-2.5 h-2.5 rounded-full bg-[#c2768d] shadow-[0_0_8px_rgba(194,118,141,0.8)] border-[1.5px] border-white -translate-x-1/2 translate-y-1/2 transition-all duration-300"
                style={{ 
                  left: \`\${(activeShot.onGoalShot.x / 2) * 100}%\`, 
                  bottom: \`\${Math.min(1, activeShot.onGoalShot.y / 0.67) * 100}%\` 
                }}
              />
            )}
            {!activeShot.onGoalShot && (activeShot.isGoal || activeShot.isOnTarget) && (
              <div 
                className="absolute z-20 w-2.5 h-2.5 rounded-full bg-[#c2768d] shadow-[0_0_8px_rgba(194,118,141,0.8)] border-[1.5px] border-white -translate-x-1/2 translate-y-1/2 transition-all duration-300"
                style={{ left: '50%', bottom: '50%' }}
              />
            )}
          </div>
          <div className="flex justify-between mt-2 px-1">
            <div className="flex flex-col items-center">
              <span className="text-xs font-black text-white">{activeShot.expectedGoals > 0 ? activeShot.expectedGoals.toFixed(2) : '-'}</span>
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">xG</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-xs font-black text-white">{activeShot.expectedGoalsOnTarget > 0 ? activeShot.expectedGoalsOnTarget.toFixed(2) : '-'}</span>
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">xGOT</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Advanced 2D Shotmap Pitch Renderer
const ShotMapPitch = ({ playerId, position, totalGoals = 1, realShotmap = [], allMatches = [], playerTeamId, matchesBox }: any) => {
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [activeShotIndex, setActiveShotIndex] = useState<number>(-1);
  const [viewMode, setViewMode] = useState<'pitch' | 'goal'>('pitch');

  const rawShots = useMemo(() => {
    if (realShotmap && realShotmap.length > 0) {
      return realShotmap.map((s: any) => {
        let rawX = s.x;
        let rawY = s.y;
        const top = ((rawX - 52.5) / 52.5) * 100;
        const left = (rawY / 68) * 100;

        let derivedHomeTeamId = s.match?.homeTeamId || s.match?.home?.id;
        let derivedAwayTeamId = s.match?.awayTeamId || s.match?.away?.id;
        let derivedHomeTeamName = s.match?.homeTeamName || s.homeTeamName;
        let derivedAwayTeamName = s.match?.awayTeamName || s.awayTeamName;

        const matchContext = allMatches?.find((m: any) => m.id === s.matchId);
        if (!derivedHomeTeamId && matchContext) {
           if (matchContext.isHomeTeam) {
             derivedHomeTeamId = playerTeamId || s.teamId; 
             derivedAwayTeamId = matchContext.opponentTeamId || matchContext.opponent?.id;
             derivedHomeTeamName = matchContext.homeTeamName || 'Home';
             derivedAwayTeamName = matchContext.opponentTeamName || matchContext.opponentName || 'Away';
           } else {
             derivedHomeTeamId = matchContext.opponentTeamId || matchContext.opponent?.id;
             derivedAwayTeamId = playerTeamId || s.teamId;
             derivedHomeTeamName = matchContext.opponentTeamName || matchContext.opponentName || 'Home';
             derivedAwayTeamName = matchContext.awayTeamName || 'Away';
           }
        }

        return {
          left,
          top,
          isGoal: s.eventType === 'Goal',
          eventType: s.eventType,
          expectedGoals: s.expectedGoals || 0,
          expectedGoalsOnTarget: s.expectedGoalsOnTarget || 0,
          situation: s.situation,
          shotType: s.shotType,
          isFromInsideBox: s.isFromInsideBox,
          isOnTarget: s.isOnTarget,
          onGoalShot: s.onGoalShot,
          matchId: s.matchId,
          homeTeamName: derivedHomeTeamName,
          awayTeamName: derivedAwayTeamName,
          homeTeamId: derivedHomeTeamId,
          awayTeamId: derivedAwayTeamId,
          homeScore: s.match?.homeScore || s.homeScore || (matchContext?.isHomeTeam ? matchContext?.homeScore : matchContext?.awayScore) || 0,
          awayScore: s.match?.awayScore || s.awayScore || (matchContext?.isHomeTeam ? matchContext?.awayScore : matchContext?.homeScore) || 0,
          min: s.min,
          minAdded: s.minAdded
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
      let top = 40 + ((seed * 7) % 50); 
      if (!isGoal && seed % 3 === 0) left += (seed % 2 === 0 ? 15 : -15);
      left = Math.max(5, Math.min(left, 95));
      top = Math.max(5, Math.min(top, 95));
      
      const shotTypes = ['LeftFoot', 'RightFoot', 'Header'];
      const situations = ['RegularPlay', 'FreeKick', 'FromCorner', 'Penalty', 'FastBreak'];

      generated.push({ 
        left, top, isGoal, 
        eventType: isGoal ? 'Goal' : (seed % 2 === 0 ? 'AttemptSaved' : 'Miss'),
        expectedGoals: (seed % 100) / 100,
        expectedGoalsOnTarget: isGoal ? (seed % 80 + 20) / 100 : 0,
        situation: situations[seed % situations.length],
        shotType: shotTypes[seed % shotTypes.length],
        isFromInsideBox: top > 68.6 && left > 20 && left < 80,
        isOnTarget: isGoal || seed % 2 === 0,
        homeTeamName: 'Los Angeles FC',
        awayTeamName: 'Inter Miami CF',
        homeTeamId: 10222, // LAFC
        awayTeamId: 8650,  // Inter Miami
        homeScore: 3,
        awayScore: 0,
        min: 45 + (seed % 45),
        onGoalShot: isGoal || seed % 2 === 0 ? { x: (seed % 200) / 100, y: (seed % 67) / 100 } : undefined
      });
    }
    return generated;
  }, [playerId, totalGoals, position, realShotmap, allMatches, playerTeamId]);

  const filterCounts = useMemo(() => {
    const counts: Record<string, number> = {
      'Goals': 0, 'Regular play': 0, 'Free kick': 0, 'Fast break': 0, 'From corner': 0, 'Penalty': 0,
      'Left foot': 0, 'Right foot': 0, 'Header': 0, 'Shots inside box': 0, 'Shots outside box': 0
    };
    rawShots.forEach((s: any) => {
      if (s.isGoal) counts['Goals']++;
      if (s.situation === 'RegularPlay') counts['Regular play']++;
      if (s.situation === 'FreeKick') counts['Free kick']++;
      if (s.situation === 'FastBreak') counts['Fast break']++;
      if (s.situation === 'FromCorner') counts['From corner']++;
      if (s.situation === 'Penalty') counts['Penalty']++;
      if (s.shotType === 'LeftFoot') counts['Left foot']++;
      if (s.shotType === 'RightFoot') counts['Right foot']++;
      if (s.shotType === 'Header') counts['Header']++;
      if (s.isFromInsideBox) counts['Shots inside box']++;
      if (s.isFromInsideBox === false) counts['Shots outside box']++;
    });
    return counts;
  }, [rawShots]);

  const filteredShots = useMemo(() => {
    if (!activeFilter) return rawShots;
    return rawShots.filter((s: any) => {
      if (activeFilter === 'Goals') return s.isGoal;
      if (activeFilter === 'Regular play') return s.situation === 'RegularPlay';
      if (activeFilter === 'Free kick') return s.situation === 'FreeKick';
      if (activeFilter === 'Fast break') return s.situation === 'FastBreak';
      if (activeFilter === 'From corner') return s.situation === 'FromCorner';
      if (activeFilter === 'Penalty') return s.situation === 'Penalty';
      if (activeFilter === 'Left foot') return s.shotType === 'LeftFoot';
      if (activeFilter === 'Right foot') return s.shotType === 'RightFoot';
      if (activeFilter === 'Header') return s.shotType === 'Header';
      if (activeFilter === 'Shots inside box') return s.isFromInsideBox;
      if (activeFilter === 'Shots outside box') return !s.isFromInsideBox;
      return true;
    });
  }, [rawShots, activeFilter]);

  useEffect(() => {
    if (filteredShots.length > 0) {
      setActiveShotIndex(0);
    } else {
      setActiveShotIndex(-1);
    }
  }, [filteredShots]);

  const totalxG = filteredShots.reduce((acc: number, s: any) => acc + (s.expectedGoals || 0), 0).toFixed(2);
  const totalGoalsFiltered = filteredShots.filter((s: any) => s.isGoal).length;
  const totalShotsFiltered = filteredShots.length;

  const activeShot = activeShotIndex >= 0 && activeShotIndex < filteredShots.length ? filteredShots[activeShotIndex] : null;

  // Calculate trajectory target based on onGoalShot for Pitch View
  let trajectoryX = 50;
  if (activeShot) {
    if (activeShot.onGoalShot) {
      trajectoryX = 45 + (activeShot.onGoalShot.x / 2) * 10;
    } else if (!activeShot.isGoal && !activeShot.isOnTarget) {
      trajectoryX = activeShot.left < 50 ? 42 : 58;
    }
  }

  return (
    <div className="flex flex-col gap-8 w-full">
      <div className="flex flex-col lg:flex-row gap-8">
        
        {/* LEFT COLUMN: Main Vis Container */}
        <div className="flex flex-col flex-1 dark:bg-[#1a1b1e] bg-[#f8f9fa] rounded-3xl p-6 relative">
          
          {/* Header & Toggle */}
          <div className="flex items-center justify-between mb-8 z-20">
            <div>
              <h3 className="dark:text-white text-slate-900 font-extrabold text-[16px] tracking-wide">Season shot map</h3>
              <p className="text-sm dark:text-slate-400 text-slate-500 font-medium mt-1">On target: {((filteredShots.filter((s: any) => s.isOnTarget || s.isGoal).length / Math.max(1, filteredShots.length)) * 100).toFixed(0)}%</p>
            </div>
            
            <div className="flex items-center bg-[#25272e] rounded-full p-1 border border-white/10 shadow-inner">
              <button 
                onClick={() => setViewMode('pitch')}
                className={\`p-1.5 rounded-full transition-all duration-300 \${viewMode === 'pitch' ? 'bg-[#c2768d] text-white shadow-md scale-105' : 'text-gray-400 hover:text-white'}\`}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M12 3v18"/><circle cx="12" cy="12" r="3"/></svg>
              </button>
              <button 
                onClick={() => setViewMode('goal')}
                className={\`p-1.5 rounded-full transition-all duration-300 \${viewMode === 'goal' ? 'bg-[#c2768d] text-white shadow-md scale-105' : 'text-gray-400 hover:text-white'}\`}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21h18"/><path d="M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16"/><path d="M5 9h14"/><path d="M5 15h14"/><path d="M12 3v18"/></svg>
              </button>
            </div>
          </div>

          <div className="relative w-full mx-auto min-h-[380px] flex flex-col justify-center">
            
            {/* VIEW 1: PITCH (All Shots) */}
            <div className={\`absolute inset-x-0 transition-opacity duration-500 \${viewMode === 'pitch' ? 'opacity-100 z-10 relative' : 'opacity-0 pointer-events-none z-0 absolute'}\`}>
              <div 
                className="relative w-full max-w-[500px] mx-auto aspect-[4/3] rounded-[1.5rem] overflow-hidden shadow-xl"
                style={{
                  background: 'repeating-linear-gradient(to bottom, #2d6b38, #2d6b38 11.11%, #276031 11.11%, #276031 22.22%)'
                }}
              >
                {/* Pitch Lines */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[31.4%] aspect-square rounded-full border-[2px] border-white/30 pointer-events-none" />
                <div className="absolute left-1/2 -translate-x-1/2 w-[26.9%] overflow-hidden pointer-events-none" style={{ bottom: '31.4%', height: '6.95%' }}>
                  <div className="absolute top-0 left-0 w-full border-[2px] border-white/30 rounded-full pointer-events-none" style={{ height: '500%' }} />
                </div>
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[59.3%] h-[31.4%] border-[2px] border-white/30 border-b-0 pointer-events-none rounded-t-xl" />
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[26.9%] h-[10.5%] border-[2px] border-white/30 border-b-0 pointer-events-none rounded-t-lg" />
                
                {/* Goal Box */}
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[10.7%] h-[2.5%] border-x-[2px] border-t-[2px] border-white pointer-events-none z-10" />
                
                {activeShot && (
                  <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
                    <line 
                      x1={\`\${activeShot.left}%\`} 
                      y1={\`\${activeShot.top}%\`} 
                      x2={\`\${trajectoryX}%\`} 
                      y2="100%" 
                      stroke="#ef4444" 
                      strokeWidth="2.5" 
                    />
                  </svg>
                )}

                {filteredShots.map((shot: any, idx: number) => {
                  if (shot.top < 0 || shot.top > 100) return null;
                  const isActive = activeShotIndex === idx;
                  const isOnTarget = shot.eventType === 'AttemptSaved' || shot.isOnTarget;
                  
                  return (
                    <div
                      key={idx}
                      onClick={() => setActiveShotIndex(idx)}
                      className={\`absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer flex items-center justify-center \${isActive ? 'z-40' : (shot.isGoal ? 'z-30' : 'z-10')}\`}
                      style={{ 
                        left: \`\${shot.left}%\`, 
                        top: \`\${shot.top}%\`,
                      }}
                    >
                      <div className={\`relative flex items-center justify-center \${shot.isGoal ? '' : 'rounded-full'} \${shot.isGoal ? '' : (isOnTarget ? 'w-[14px] h-[14px] bg-[#c2768d]' : 'w-[14px] h-[14px] bg-transparent border-[2.5px] border-[#c2768d]')}\`}>
                        {shot.isGoal && (
                          <span className="text-[14px] leading-none pointer-events-none grayscale contrast-[1.25] brightness-110 drop-shadow-md">⚽</span>
                        )}
                      </div>
                      
                      {isActive && (
                        <div className="absolute inset-0 rounded-full border-[3px] border-[#ef4444] shadow-[0_0_15px_rgba(239,68,68,0.9)] scale-[1.6] pointer-events-none bg-[#ef4444]/30" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* VIEW 2: BIG GOALPOST (All Shots on Target) */}
            <div className={\`absolute inset-x-0 transition-opacity duration-500 \${viewMode === 'goal' ? 'opacity-100 z-10 relative' : 'opacity-0 pointer-events-none z-0 absolute'} flex flex-col items-center justify-center\`}>
              <div className="relative w-full max-w-[500px] aspect-[24/8] border-4 border-white/20 border-b-0 rounded-t-sm flex flex-col justify-end overflow-visible bg-[#373940]">
                <div className="absolute inset-0">
                  <svg width="100%" height="100%" className="opacity-20">
                    <pattern id="big-net-pattern" x="0" y="0" width="30" height="30" patternUnits="userSpaceOnUse">
                      <path d="M 30 0 L 0 30 M 0 0 L 30 30" fill="none" stroke="white" strokeWidth="2" />
                    </pattern>
                    <rect x="0" y="0" width="100%" height="100%" fill="url(#big-net-pattern)" />
                  </svg>
                </div>
                
                {/* Dots on Big Net */}
                {filteredShots.map((shot: any, idx: number) => {
                  if (!shot.onGoalShot && !shot.isGoal && !shot.isOnTarget) return null;
                  
                  const isActive = activeShotIndex === idx;
                  const xCoord = shot.onGoalShot ? (shot.onGoalShot.x / 2) * 100 : 50;
                  const yCoord = shot.onGoalShot ? Math.min(1.2, shot.onGoalShot.y / 0.67) * 100 : 50;

                  return (
                    <div
                      key={idx}
                      onClick={() => setActiveShotIndex(idx)}
                      className={\`absolute -translate-x-1/2 translate-y-1/2 cursor-pointer flex items-center justify-center \${isActive ? 'z-40' : (shot.isGoal ? 'z-30' : 'z-20')}\`}
                      style={{ 
                        left: \`\${xCoord}%\`, 
                        bottom: \`\${yCoord}%\`,
                      }}
                    >
                      <div className={\`relative flex items-center justify-center \${shot.isGoal ? '' : 'rounded-full w-[14px] h-[14px] bg-[#c2768d]'}\`}>
                        {shot.isGoal && (
                          <span className="text-[16px] leading-none pointer-events-none grayscale contrast-[1.25] brightness-110 drop-shadow-md">⚽</span>
                        )}
                      </div>
                      
                      {isActive && (
                        <div className="absolute inset-0 rounded-full border-[3px] border-[#ef4444] shadow-[0_0_15px_rgba(239,68,68,0.9)] scale-[1.6] pointer-events-none bg-[#ef4444]/30" />
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="w-full h-12 bg-[#313339] max-w-[600px] border-t-2 border-white/10" />
            </div>

          </div>

          {/* Footer Stats for Left Column */}
          <div className="flex flex-col mt-auto pt-8">
            <div className="flex justify-around items-center">
              <div className="flex flex-col items-center gap-1.5">
                <span className="text-[26px] font-black dark:text-white text-slate-900 leading-none">{totalShotsFiltered}</span>
                <span className="text-[11px] font-bold dark:text-slate-400 text-slate-500">Shots</span>
              </div>
              <div className="flex flex-col items-center gap-1.5">
                <span className="text-[26px] font-black dark:text-white text-slate-900 leading-none">{totalGoalsFiltered}</span>
                <span className="text-[11px] font-bold dark:text-slate-400 text-slate-500">Goals</span>
              </div>
              <div className="flex flex-col items-center gap-1.5">
                <span className="text-[26px] font-black dark:text-white text-slate-900 leading-none">{totalxG}</span>
                <span className="text-[11px] font-bold dark:text-slate-400 text-slate-500">xG</span>
              </div>
            </div>
            
            <div className="w-full h-[1px] dark:bg-white/5 bg-slate-200 my-6"></div>
            
            <div className="flex justify-center gap-8 text-[11px] font-bold dark:text-slate-200 text-slate-700">
              <div className="flex items-center gap-2.5">
                <span className="text-[15px] leading-none grayscale contrast-[1.25] brightness-110 drop-shadow-md">⚽</span>
                <span>Goal</span>
              </div>
              <div className="flex items-center gap-2.5">
                <div className="w-3.5 h-3.5 rounded-full bg-[#c2768d]"></div>
                <span>On Target</span>
              </div>
              <div className="flex items-center gap-2.5">
                <div className="w-3.5 h-3.5 rounded-full bg-transparent border-[2.5px] border-[#c2768d]"></div>
                <span>Miss/Block</span>
              </div>
            </div>
          </div>
        </div>
`;

// Extract the exact start/end
const startTag = '// --- Match Detail Card';
const endTag = '{/* RIGHT COLUMN: Controls & Match Detail */}';

const startIdx = content.indexOf(startTag);
const endIdx = content.indexOf(endTag);

if (startIdx !== -1 && endIdx !== -1) {
  content = content.substring(0, startIdx) + newComponents.trim() + '\n        \n        ' + content.substring(endIdx);
  
  // Inject playerTeamId into the ShotMapPitch usage inside FotmobPlayerCard
  const searchPattern = "allMatches={recentMatches}";
  const replacePattern = "allMatches={recentMatches}\n                      playerTeamId={primaryTeam?.id}";
  if (content.includes(searchPattern) && !content.includes("playerTeamId={primaryTeam?.id}")) {
    content = content.replace(searchPattern, replacePattern);
  }

  fs.writeFileSync(path, content, 'utf8');
  console.log('Restored everything perfectly!');
} else {
  console.log('Failed to find tags.');
}
