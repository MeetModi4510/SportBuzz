const fs = require('fs');
const path = 'c:\\\\Users\\\\PRANSHU PATEL\\\\OneDrive\\\\Desktop\\\\dev_scripts\\\\src\\\\components\\\\football\\\\FotmobPlayerCard.tsx';
let content = fs.readFileSync(path, 'utf8');

const newComponents = `
// --- GoalPost Graphic Component ---
const GoalPostGraphic = ({ activeShot, onPrev, onNext }: any) => {
  if (!activeShot) return null;

  return (
    <div className="flex flex-col dark:bg-[#121316] bg-[#1a1b1e] rounded-xl border dark:border-white/5 border-slate-800 shadow-xl overflow-hidden w-full max-w-[440px] mx-auto mt-4">
      {/* Match Navigation Header */}
      <div className="flex flex-col border-b dark:border-white/5 border-slate-700/50">
        <div className="flex items-center justify-between px-3 py-3 bg-gradient-to-r dark:from-white/5 dark:to-transparent from-slate-800/50 to-transparent">
          <button onClick={onPrev} className="p-2 rounded-full hover:dark:bg-white/10 hover:bg-slate-700 transition-colors shrink-0">
            <ChevronLeft className="w-5 h-5 dark:text-white text-slate-200" />
          </button>
          
          <div className="flex items-center justify-center gap-3 flex-1 min-w-0">
            {activeShot.homeTeamName && activeShot.awayTeamName ? (
              <>
                <div className="flex items-center justify-end gap-2 flex-1 min-w-0">
                  <span className="text-[13px] font-bold text-slate-200 truncate">{activeShot.homeTeamName}</span>
                  {activeShot.homeTeamId ? (
                    <img src={\`https://images.fotmob.com/image_resources/logo/teamlogo/\${activeShot.homeTeamId}.png\`} alt="" className="w-6 h-6 object-contain shrink-0" onError={(e) => e.currentTarget.style.display = 'none'} />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center text-[10px] font-bold text-white shrink-0 border border-slate-600">{activeShot.homeTeamName?.substring(0,1)}</div>
                  )}
                </div>
                
                <span className="text-base font-black text-white shrink-0 mx-1">{activeShot.homeScore} - {activeShot.awayScore}</span>
                
                <div className="flex items-center justify-start gap-2 flex-1 min-w-0">
                  {activeShot.awayTeamId ? (
                    <img src={\`https://images.fotmob.com/image_resources/logo/teamlogo/\${activeShot.awayTeamId}.png\`} alt="" className="w-6 h-6 object-contain shrink-0" onError={(e) => e.currentTarget.style.display = 'none'} />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center text-[10px] font-bold text-white shrink-0 border border-slate-600">{activeShot.awayTeamName?.substring(0,1)}</div>
                  )}
                  <span className="text-[13px] font-bold text-slate-200 truncate">{activeShot.awayTeamName}</span>
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
      </div>

      <div className="flex flex-row p-5 gap-6 items-center">
        {/* Left Side: Text Details */}
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

        {/* Right Side: Net and Stats */}
        <div className="flex flex-col w-[160px]">
          {/* Net Graphic */}
          <div className="relative w-full aspect-[24/8] bg-gradient-to-b dark:from-[#1a1c21] dark:to-[#121316] from-slate-800 to-slate-900 overflow-hidden flex flex-col justify-end p-2 rounded-t-lg">
            <div className="absolute inset-0 bottom-2 left-2 right-2 border-[2px] border-white/60 border-b-0 rounded-t-lg z-10">
              <svg width="100%" height="100%" className="opacity-20">
                <pattern id="net-pattern" x="0" y="0" width="12" height="12" patternUnits="userSpaceOnUse">
                  <path d="M 12 0 L 0 12 M 0 0 L 12 12" fill="none" stroke="white" strokeWidth="0.5" />
                </pattern>
                <rect x="0" y="0" width="100%" height="100%" fill="url(#net-pattern)" />
              </svg>
            </div>
            
            {activeShot.onGoalShot && (
              <div 
                className="absolute z-20 w-3.5 h-3.5 rounded-full bg-[#d49aab] shadow-[0_0_12px_rgba(212,154,171,0.8)] border-2 border-white -translate-x-1/2 translate-y-1/2 transition-all duration-500"
                style={{ 
                  left: \`calc(0.5rem + \${(activeShot.onGoalShot.x / 2) * 100}% * calc(100% - 1rem) / 100)\`, 
                  bottom: \`calc(0.5rem + \${Math.min(1, activeShot.onGoalShot.y / 0.67) * 100}% * calc(100% - 1rem) / 100)\` 
                }}
              />
            )}
            
            {!activeShot.onGoalShot && (activeShot.isGoal || activeShot.isOnTarget) && (
              <div 
                className="absolute z-20 w-3.5 h-3.5 rounded-full bg-[#d49aab] shadow-[0_0_12px_rgba(212,154,171,0.8)] border-2 border-white -translate-x-1/2 translate-y-1/2 transition-all duration-500"
                style={{ left: '50%', bottom: '50%' }}
              />
            )}
          </div>
          
          <div className="flex justify-between mt-3 px-2">
            <div className="flex flex-col items-center">
              <span className="text-base font-black text-white">{activeShot.expectedGoals > 0 ? activeShot.expectedGoals.toFixed(2) : '-'}</span>
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">xG</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-base font-black text-white">{activeShot.expectedGoalsOnTarget > 0 ? activeShot.expectedGoalsOnTarget.toFixed(2) : '-'}</span>
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">xGOT</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Advanced 2D Shotmap Pitch Renderer
const ShotMapPitch = ({ playerId, position, totalGoals = 1, realShotmap = [], matchesBox }: any) => {
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
          homeTeamName: s.match?.homeTeamName || s.homeTeamName,
          awayTeamName: s.match?.awayTeamName || s.awayTeamName,
          homeTeamId: s.match?.homeTeamId || s.match?.home?.id,
          awayTeamId: s.match?.awayTeamId || s.match?.away?.id,
          homeScore: s.match?.homeScore || s.homeScore,
          awayScore: s.match?.awayScore || s.awayScore,
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
        homeTeamName: 'Home FC',
        awayTeamName: 'Away FC',
        homeScore: 1,
        awayScore: 0,
        min: 45 + (seed % 45),
        onGoalShot: isGoal || seed % 2 === 0 ? { x: (seed % 200) / 100, y: (seed % 67) / 100 } : undefined
      });
    }
    return generated;
  }, [playerId, totalGoals, position, realShotmap]);

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

  // Calculate trajectory target based on onGoalShot
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
        
        {/* Main Vis Container */}
        <div className="flex flex-col flex-1 dark:bg-[#121316] bg-slate-50 rounded-2xl border dark:border-white/5 border-slate-200 p-6 shadow-inner relative overflow-hidden">
          
          {/* Header & Toggle */}
          <div className="flex items-center justify-between mb-6 z-20">
            <h3 className="dark:text-white text-slate-900 font-bold text-lg">Season Shot Map</h3>
            
            <div className="flex items-center bg-[#25272e] rounded-full p-1 border border-white/10 shadow-inner">
              <button 
                onClick={() => setViewMode('pitch')}
                className={\`p-1.5 rounded-full transition-all duration-300 \${viewMode === 'pitch' ? 'bg-white text-black shadow-md scale-105' : 'text-gray-400 hover:text-white'}\`}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M12 3v18"/><circle cx="12" cy="12" r="3"/></svg>
              </button>
              <button 
                onClick={() => setViewMode('goal')}
                className={\`p-1.5 rounded-full transition-all duration-300 \${viewMode === 'goal' ? 'bg-[#d49aab] text-white shadow-md scale-105' : 'text-gray-400 hover:text-white'}\`}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21h18"/><path d="M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16"/><path d="M5 9h14"/><path d="M5 15h14"/><path d="M12 3v18"/></svg>
              </button>
            </div>
          </div>

          <div className="relative w-full max-w-lg mx-auto min-h-[420px] transition-all duration-500">
            
            {/* View 1: Pitch */}
            <div className={\`absolute inset-0 transition-opacity duration-500 \${viewMode === 'pitch' ? 'opacity-100 z-10' : 'opacity-0 pointer-events-none z-0'}\`}>
              <div className="relative w-full aspect-[4/3] rounded-t-[2rem] rounded-b-lg overflow-hidden border-4 dark:border-white/10 border-slate-300 shadow-2xl bg-gradient-to-b dark:from-[#22522c] dark:to-[#13361a] from-[#2a6839] to-[#1e4a29]">
                <div className="absolute inset-0 opacity-40 pointer-events-none" style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 10%, rgba(255,255,255,0.05) 10%, rgba(255,255,255,0.05) 20%)' }}></div>
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[31.4%] aspect-square rounded-full border-[3px] border-white/40 pointer-events-none" />
                <div className="absolute left-1/2 -translate-x-1/2 w-[26.9%] overflow-hidden pointer-events-none" style={{ bottom: '31.4%', height: '6.95%' }}>
                  <div className="absolute top-0 left-0 w-full border-[3px] border-white/40 rounded-full pointer-events-none" style={{ height: '500%' }} />
                </div>
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[59.3%] h-[31.4%] border-[3px] border-white/40 border-b-0 pointer-events-none" />
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[26.9%] h-[10.5%] border-[3px] border-white/40 border-b-0 pointer-events-none" />
                <div className="absolute left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-white/60 rounded-full pointer-events-none" style={{ bottom: '20.95%' }} />
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[10.7%] h-[3%] bg-black/40 border-x-2 border-t-2 border-white pointer-events-none z-10" />
                
                {activeShot && (
                  <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
                    <line 
                      x1={\`\${activeShot.left}%\`} 
                      y1={\`\${activeShot.top}%\`} 
                      x2={\`\${trajectoryX}%\`} 
                      y2="100%" 
                      stroke="#ef4444" 
                      strokeWidth="2.5" 
                      className="opacity-90"
                    />
                  </svg>
                )}

                {filteredShots.map((shot: any, idx: number) => {
                  if (shot.top < 0 || shot.top > 100) return null;

                  let sizeClass = 'w-[14px] h-[14px]';
                  if (shot.expectedGoals && shot.expectedGoals > 0.3) sizeClass = 'w-[18px] h-[18px]';
                  
                  const isOnTarget = shot.eventType === 'AttemptSaved' || shot.isOnTarget;
                  const isActive = activeShotIndex === idx;

                  return (
                    <div
                      key={idx}
                      onClick={() => { setActiveShotIndex(idx); setViewMode('pitch'); }}
                      className={\`absolute -translate-x-1/2 -translate-y-1/2 transition-transform duration-300 hover:scale-[1.8] cursor-pointer flex items-center justify-center \${
                        isActive ? 'z-40' : (shot.isGoal ? 'z-30' : 'z-10')
                      }\`}
                      style={{ 
                        left: \`\${shot.left}%\`, 
                        top: \`\${shot.top}%\`,
                        transform: isActive ? 'translate(-50%, -50%) scale(1.4)' : 'translate(-50%, -50%)'
                      }}
                    >
                      <div className={\`\${sizeClass} rounded-full \${shot.isGoal ? 'bg-[#f8f9fa] shadow-[0_0_8px_rgba(255,255,255,0.8)]' : (isOnTarget ? 'bg-[#d49aab] opacity-[0.9]' : 'bg-[#333] border-[2px] border-[#d49aab] opacity-[0.8]')}\`}>
                        {shot.isGoal && <span className="text-[17px] leading-none pointer-events-none drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] grayscale contrast-[1.2] brightness-110">⚽</span>}
                      </div>
                      {isActive && (
                        <div className="absolute inset-0 rounded-full border-[3px] border-[#ef4444] shadow-[0_0_12px_rgba(239,68,68,0.9)] scale-[1.3] pointer-events-none" />
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-around items-center pt-8 pb-4">
                <div className="flex flex-col items-center">
                  <span className="text-2xl font-black dark:text-white text-slate-900">{totalShotsFiltered}</span>
                  <span className="text-[13px] font-bold dark:text-slate-400 text-slate-500">Shots</span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-2xl font-black dark:text-white text-slate-900">{totalGoalsFiltered}</span>
                  <span className="text-[13px] font-bold dark:text-slate-400 text-slate-500">Goals</span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-2xl font-black dark:text-white text-slate-900">{totalxG}</span>
                  <span className="text-[13px] font-bold dark:text-slate-400 text-slate-500">xG</span>
                </div>
              </div>
              
              <div className="flex justify-center gap-6 text-[13px] font-bold dark:text-slate-300 text-slate-600 mt-2">
                <div className="flex items-center gap-2">
                  <span className="text-[16px] leading-none drop-shadow-[0_2px_2px_rgba(0,0,0,0.6)] grayscale contrast-[1.2] brightness-110">⚽</span>
                  <span>Goal</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3.5 h-3.5 rounded-full bg-[#d49aab] opacity-[0.9]"></div>
                  <span>On Target</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3.5 h-3.5 rounded-full bg-[#333] border-[2px] border-[#d49aab] opacity-[0.8]"></div>
                  <span>Miss/Block</span>
                </div>
              </div>
            </div>

            {/* View 2: GoalPostGraphic */}
            <div className={\`absolute inset-x-0 top-4 transition-opacity duration-500 \${viewMode === 'goal' ? 'opacity-100 z-10' : 'opacity-0 pointer-events-none z-0'}\`}>
              <GoalPostGraphic 
                activeShot={activeShot} 
                onPrev={() => setActiveShotIndex((prev) => (prev > 0 ? prev - 1 : filteredShots.length - 1))}
                onNext={() => setActiveShotIndex((prev) => (prev < filteredShots.length - 1 ? prev + 1 : 0))}
              />
            </div>

          </div>
        </div>
        
        {/* Right Column: Controls */}
        <div className="flex flex-col gap-6 flex-1 xl:max-w-[380px]">
          {/* Filter Shots */}
          <div className="dark:bg-[#121316] bg-slate-50 rounded-2xl border dark:border-white/5 border-slate-200 p-6 shadow-inner flex flex-col gap-4">
            <div className="flex items-center justify-between border-b dark:border-white/5 border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-4 rounded-full bg-[#f43f5e] shadow-[0_0_8px_rgba(244,63,94,0.5)]" />
                <h4 className="text-[13px] font-black dark:text-white text-slate-900 uppercase tracking-widest">Filter Shots</h4>
              </div>
              {activeFilter && (
                <button 
                  onClick={() => setActiveFilter(null)} 
                  className="text-[11px] font-bold text-[#f43f5e] hover:text-[#e11d48] uppercase tracking-wider transition-colors px-2 py-1 rounded-md hover:bg-rose-500/10"
                >
                  Clear
                </button>
              )}
            </div>
            
            <div className="flex flex-wrap gap-2.5">
              {Object.entries(filterCounts).map(([key, count]) => {
                if (count === 0) return null;
                const isActive = activeFilter === key;
                return (
                  <button 
                    key={key}
                    onClick={() => setActiveFilter(isActive ? null : key)}
                    className={\`group relative flex items-center gap-2 px-3.5 py-2 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all duration-300 overflow-hidden \${
                      isActive 
                        ? 'text-white border-transparent shadow-[0_4px_12px_rgba(244,63,94,0.3)] scale-[1.02]' 
                        : 'dark:text-gray-400 text-slate-600 dark:bg-white/5 bg-slate-200/50 border dark:border-white/5 border-slate-300/50 hover:dark:bg-white/10 hover:bg-slate-200 hover:dark:text-white hover:text-slate-900'
                    }\`}
                  >
                    {isActive && <div className="absolute inset-0 bg-gradient-to-r from-[#f43f5e] to-[#e11d48] z-0"></div>}
                    <span className="relative z-10">{key}</span>
                    <span className={\`relative z-10 flex items-center justify-center min-w-[18px] h-[18px] rounded-md text-[10px] px-1 \${
                      isActive ? 'bg-black/20 text-white' : 'dark:bg-black/40 bg-white shadow-sm dark:text-gray-300 text-slate-500 group-hover:text-slate-700 dark:group-hover:text-white'
                    }\`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
          
          {matchesBox}
        </div>
      </div>
    </div>
  );
};
`;

const startTag = '// --- GoalPost Graphic Component ---';
const endTag = '// --- Custom Polar Area Chart ---';

const startIdx = content.indexOf(startTag);
const endIdx = content.indexOf(endTag);

if (startIdx !== -1 && endIdx !== -1) {
  const finalContent = content.substring(0, startIdx) + newComponents + content.substring(endIdx);
  fs.writeFileSync(path, finalContent, 'utf8');
  console.log('Replaced ShotMapPitch perfectly!');
} else {
  console.log('Failed to find tags.');
}
