const fs = require('fs');
const path = 'c:\\\\Users\\\\PRANSHU PATEL\\\\OneDrive\\\\Desktop\\\\dev_scripts\\\\src\\\\components\\\\football\\\\FotmobPlayerCard.tsx';
let lines = fs.readFileSync(path, 'utf8').split(/\\r?\\n/);

const newComponents = `
// --- GoalPost Graphic Component ---
const GoalPostGraphic = ({ activeShot, onPrev, onNext }: any) => {
  if (!activeShot) return null;

  return (
    <div className="flex flex-col dark:bg-[#121316] bg-slate-50 rounded-2xl border dark:border-white/5 border-slate-200 shadow-inner overflow-hidden">
      {/* Match Navigation Header */}
      <div className="flex flex-col border-b dark:border-white/5 border-slate-200">
        <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r dark:from-white/5 dark:to-transparent from-slate-200/50 to-transparent">
          <button onClick={onPrev} className="p-2 rounded-full hover:dark:bg-white/10 hover:bg-slate-300 transition-colors">
            <ChevronLeft className="w-5 h-5 dark:text-white text-slate-900" />
          </button>
          
          <div className="flex items-center gap-3">
            {activeShot.homeTeamName && activeShot.awayTeamName ? (
              <>
                <span className="text-xs font-bold dark:text-gray-300 text-slate-700 max-w-[80px] truncate text-right">{activeShot.homeTeamName}</span>
                <div className="flex items-center justify-center min-w-[48px] px-2 py-1 dark:bg-black/40 bg-white rounded shadow-sm border dark:border-white/10 border-slate-300">
                  <span className="text-sm font-black dark:text-white text-slate-900">{activeShot.homeScore} - {activeShot.awayScore}</span>
                </div>
                <span className="text-xs font-bold dark:text-gray-300 text-slate-700 max-w-[80px] truncate">{activeShot.awayTeamName}</span>
              </>
            ) : (
              <span className="text-sm font-bold dark:text-gray-300 text-slate-700">Shot Context</span>
            )}
          </div>
          
          <button onClick={onNext} className="p-2 rounded-full hover:dark:bg-white/10 hover:bg-slate-300 transition-colors">
            <ChevronRight className="w-5 h-5 dark:text-white text-slate-900" />
          </button>
        </div>
        <div className="px-4 py-1.5 flex justify-center items-center gap-4 text-[10px] uppercase tracking-widest font-bold dark:text-gray-500 text-slate-500 dark:bg-black/20 bg-slate-200/50">
          <span>{activeShot.min}{activeShot.minAdded ? \`+\${activeShot.minAdded}\` : ''}'</span>
          <div className="w-1 h-1 rounded-full dark:bg-gray-600 bg-slate-400" />
          <span>{activeShot.situation}</span>
          <div className="w-1 h-1 rounded-full dark:bg-gray-600 bg-slate-400" />
          <span>{activeShot.shotType}</span>
        </div>
      </div>

      {/* Net Graphic */}
      <div className="relative w-full aspect-[21/9] bg-gradient-to-b dark:from-[#1a1c21] dark:to-[#121316] from-slate-100 to-slate-200 overflow-hidden flex flex-col justify-end p-4 md:p-6">
        {/* Net background SVG */}
        <div className="absolute inset-0 bottom-6 left-6 right-6 border-4 dark:border-white/80 border-slate-400 border-b-0 rounded-t-lg z-10">
          <svg width="100%" height="100%" className="opacity-20">
            <pattern id="net-pattern" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 20 M 0 0 L 20 20" fill="none" stroke="currentColor" strokeWidth="1" className="dark:text-white text-slate-900" />
            </pattern>
            <rect x="0" y="0" width="100%" height="100%" fill="url(#net-pattern)" />
          </svg>
        </div>
        
        {/* Plotting the exact point if available */}
        {activeShot.onGoalShot && (
          <div 
            className="absolute z-20 w-4 h-4 rounded-full bg-[#d49aab] shadow-[0_0_15px_rgba(212,154,171,0.8)] border-2 border-white -translate-x-1/2 -translate-y-1/2 transition-all duration-500"
            style={{ 
              left: \`calc(1.5rem + \${activeShot.onGoalShot.x * 100}% * calc(100% - 3rem) / 100)\`, 
              top: \`calc(\${activeShot.onGoalShot.y * 100}% * calc(100% - 1.5rem) / 100)\` 
            }}
          />
        )}
        
        {/* If no exact coordinates but is a goal/on target, just place it center */}
        {!activeShot.onGoalShot && (activeShot.isGoal || activeShot.isOnTarget) && (
          <div 
            className="absolute z-20 w-4 h-4 rounded-full bg-[#d49aab] shadow-[0_0_15px_rgba(212,154,171,0.8)] border-2 border-white -translate-x-1/2 -translate-y-1/2 transition-all duration-500"
            style={{ left: '50%', top: '50%' }}
          />
        )}
      </div>

      {/* Stats Below */}
      <div className="grid grid-cols-2 divide-x dark:divide-white/5 divide-slate-200 border-t dark:border-white/5 border-slate-200">
        <div className="flex flex-col items-center p-4">
          <span className="text-2xl font-black dark:text-white text-slate-900">{activeShot.expectedGoalsOnTarget > 0 ? activeShot.expectedGoalsOnTarget.toFixed(2) : '-'}</span>
          <span className="text-[10px] font-bold dark:text-gray-500 text-slate-500 uppercase tracking-widest">xGOT</span>
        </div>
        <div className="flex flex-col items-center p-4">
          <span className="text-2xl font-black dark:text-white text-slate-900">{activeShot.expectedGoals > 0 ? activeShot.expectedGoals.toFixed(2) : '-'}</span>
          <span className="text-[10px] font-bold dark:text-gray-500 text-slate-500 uppercase tracking-widest">xG</span>
        </div>
      </div>
    </div>
  );
};

// Advanced 2D Shotmap Pitch Renderer
const ShotMapPitch = ({ playerId, position, totalGoals = 1, realShotmap = [], matchesBox }: any) => {
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [activeShotIndex, setActiveShotIndex] = useState<number>(-1);

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
        min: 45 + (seed % 45)
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

  // Set first shot as active whenever filter changes
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

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 w-full">
      <div className="flex flex-col">
        <h3 className="dark:text-white text-slate-900 font-bold text-center mb-4">Season Shot Map</h3>
        <div className="w-full max-w-sm mx-auto flex flex-col gap-6">
          <div className="relative w-full aspect-[4/3] rounded-t-[2rem] rounded-b-lg overflow-hidden border-4 dark:border-white/10 border-slate-300 shadow-2xl bg-gradient-to-b dark:from-[#22522c] dark:to-[#13361a] from-[#2a6839] to-[#1e4a29]">
            <div 
              className="absolute inset-0 opacity-40 pointer-events-none"
              style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 10%, rgba(255,255,255,0.05) 10%, rgba(255,255,255,0.05) 20%)' }}
            ></div>
            <div 
              className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[31.4%] aspect-square rounded-full border-[3px] border-white/40 pointer-events-none"
            />
            <div 
              className="absolute left-1/2 -translate-x-1/2 w-[26.9%] overflow-hidden pointer-events-none"
              style={{ bottom: '31.4%', height: '6.95%' }}
            >
              <div 
                className="absolute top-0 left-0 w-full border-[3px] border-white/40 rounded-full pointer-events-none"
                style={{ height: '500%' }}
              />
            </div>
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[59.3%] h-[31.4%] border-[3px] border-white/40 border-b-0 pointer-events-none" />
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[26.9%] h-[10.5%] border-[3px] border-white/40 border-b-0 pointer-events-none" />
            <div className="absolute left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-white/60 rounded-full pointer-events-none" style={{ bottom: '20.95%' }} />
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[10.7%] h-[3%] bg-black/40 border-x-2 border-t-2 border-white pointer-events-none z-10" />
            
            {/* Draw active shot line */}
            {activeShot && (activeShot.isGoal || activeShot.isOnTarget) && (
              <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
                <line 
                  x1={\`\${activeShot.left}%\`} 
                  y1={\`\${activeShot.top}%\`} 
                  x2="50%" 
                  y2="100%" 
                  stroke="#ef4444" 
                  strokeWidth="2" 
                  strokeDasharray="4,4"
                  className="opacity-60"
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
                  onClick={() => setActiveShotIndex(idx)}
                  className={\`absolute -translate-x-1/2 -translate-y-1/2 transition-transform duration-300 hover:scale-[1.8] cursor-pointer \${
                    shot.isGoal
                      ? 'z-30 flex items-center justify-center'
                      : \`\${sizeClass} rounded-full \${isOnTarget ? 'bg-[#d49aab] opacity-[0.65]' : 'bg-transparent border-[2px] border-[#d49aab] opacity-[0.65]'} z-10\`
                  }\`}
                  style={{ 
                    left: \`\${shot.left}%\`, 
                    top: \`\${shot.top}%\`,
                    boxShadow: isActive ? '0 0 0 3px rgba(255,255,255,0.8), 0 0 15px rgba(255,255,255,0.5)' : 'none',
                    transform: isActive ? 'translate(-50%, -50%) scale(1.4)' : 'translate(-50%, -50%)',
                    zIndex: isActive ? 40 : (shot.isGoal ? 30 : 10)
                  }}
                  title={shot.isGoal ? 'Goal' : shot.eventType || 'Miss/Saved'}
                >
                  {shot.isGoal && <span className="text-[17px] leading-none pointer-events-none drop-shadow-[0_4px_4px_rgba(0,0,0,0.85)] grayscale contrast-[1.2] brightness-110">⚽</span>}
                </div>
              );
            })}
          </div>
          <div className="flex justify-around items-center border-b dark:border-white/10 border-slate-200 pb-4">
            <div className="flex flex-col items-center">
              <span className="text-2xl font-bold dark:text-white text-slate-900">{totalShotsFiltered}</span>
              <span className="text-[13px] font-medium dark:text-slate-400 text-slate-500">Shots</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-2xl font-bold dark:text-white text-slate-900">{totalGoalsFiltered}</span>
              <span className="text-[13px] font-medium dark:text-slate-400 text-slate-500">Goals</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-2xl font-bold dark:text-white text-slate-900">{totalxG}</span>
              <span className="text-[13px] font-medium dark:text-slate-400 text-slate-500">xG</span>
            </div>
          </div>
          <div className="flex justify-center gap-6 text-[13px] font-medium dark:text-slate-300 text-slate-600">
            <div className="flex items-center gap-1.5">
              <span className="text-[17px] leading-none drop-shadow-[0_3px_3px_rgba(0,0,0,0.6)] grayscale contrast-[1.2] brightness-110">⚽</span>
              <span>Goal</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-[#d49aab] opacity-[0.65]"></div>
              <span>On Target</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-transparent border-[2px] border-[#d49aab] opacity-[0.65]"></div>
              <span>Miss/Block</span>
            </div>
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-6">
        <GoalPostGraphic 
          activeShot={activeShot} 
          onPrev={() => setActiveShotIndex((prev) => (prev > 0 ? prev - 1 : filteredShots.length - 1))}
          onNext={() => setActiveShotIndex((prev) => (prev < filteredShots.length - 1 ? prev + 1 : 0))}
        />
        {matchesBox}
        <div className="dark:bg-[#121316] bg-slate-50 rounded-2xl border dark:border-white/5 border-slate-200 p-6 shadow-inner flex flex-col gap-4">
          <div className="flex items-center justify-between border-b dark:border-white/5 border-slate-200 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-4 rounded-full bg-[#34D399] shadow-[0_0_8px_rgba(52,211,153,0.5)]" />
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
                      ? 'text-white border-transparent shadow-[0_4px_12px_rgba(56,189,248,0.3)] scale-[1.02]' 
                      : 'dark:text-gray-400 text-slate-600 dark:bg-white/5 bg-slate-200/50 border dark:border-white/5 border-slate-300/50 hover:dark:bg-white/10 hover:bg-slate-200 hover:dark:text-white hover:text-slate-900'
                  }\`}
                >
                  {isActive && (
                    <div className="absolute inset-0 bg-gradient-to-r from-[#38bdf8] to-[#3B82F6] z-0"></div>
                  )}
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
      </div>
    </div>
  );
};
`;

const beforeLines = lines.slice(0, 183);
const afterLines = lines.slice(419);

const finalLines = beforeLines.join('\\n') + '\\n' + newComponents + '\\n' + afterLines.join('\\n');
fs.writeFileSync(path, finalLines, 'utf8');
console.log('Replaced ShotMapPitch using line slices successfully.');
