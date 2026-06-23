const fs = require('fs');
const path = 'c:\\\\Users\\\\PRANSHU PATEL\\\\OneDrive\\\\Desktop\\\\dev_scripts\\\\src\\\\components\\\\football\\\\FotmobPlayerCard.tsx';
let content = fs.readFileSync(path, 'utf8');

const newPitchContainer = `
        {/* LEFT COLUMN: Main Vis Container (Pitch only) */}
        <div className="flex flex-col flex-1 dark:bg-[#1a1b1e] bg-[#f8f9fa] rounded-3xl p-6 relative">
          
          {/* Header */}
          <div className="flex items-center justify-between mb-8 z-20">
            <h3 className="dark:text-white text-slate-900 font-extrabold text-[16px] tracking-wide">Season Shot Map</h3>
          </div>

          <div className="relative w-full mx-auto min-h-[380px] flex flex-col justify-center">
            
            {/* PITCH (All Shots) */}
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
              
              {/* Goal Box (Small white rectangle at bottom) */}
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
                    {shot.isGoal && (
                      <div className="absolute w-[20px] h-[20px] bg-white/70 blur-[4px] rounded-full pointer-events-none" />
                    )}
                    
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
                <div className="relative flex items-center justify-center w-4 h-4">
                  <div className="absolute inset-0 bg-white/70 blur-[3px] rounded-full" />
                  <span className="text-[14px] leading-none relative z-10 grayscale contrast-[1.25] brightness-110">⚽</span>
                </div>
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

// Extract the exact start/end of the left column container
const startTag = '{/* LEFT COLUMN: Main Vis Container';
const endTag = '{/* RIGHT COLUMN: Controls & Match Detail */}';

const startIdx = content.indexOf(startTag);
const endIdx = content.indexOf(endTag);

if (startIdx !== -1 && endIdx !== -1) {
  const finalContent = content.substring(0, startIdx) + newPitchContainer.trim() + '\n        \n        ' + content.substring(endIdx);
  fs.writeFileSync(path, finalContent, 'utf8');
  console.log('Replaced balls perfectly!');
} else {
  console.log('Failed to find tags.');
}
