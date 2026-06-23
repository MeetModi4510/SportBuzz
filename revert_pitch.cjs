const fs = require('fs');
const path = 'c:\\\\Users\\\\PRANSHU PATEL\\\\OneDrive\\\\Desktop\\\\dev_scripts\\\\src\\\\components\\\\football\\\\FotmobPlayerCard.tsx';
let content = fs.readFileSync(path, 'utf8');

const newPitchContainer = `
        {/* LEFT COLUMN: Main Vis Container (Pitch only) */}
        <div className="flex flex-col flex-1 dark:bg-[#121316] bg-slate-50 rounded-2xl border dark:border-white/5 border-slate-200 p-6 shadow-inner relative">
          
          {/* Header */}
          <div className="flex items-center justify-between mb-6 z-20">
            <div>
              <h3 className="dark:text-white text-slate-900 font-bold text-[17px] tracking-wide">Season Shot Map</h3>
            </div>
          </div>

          <div className="relative w-full mx-auto min-h-[380px] flex flex-col justify-center">
            
            {/* PITCH (All Shots) */}
            <div className="relative w-full max-w-[500px] mx-auto aspect-[4/3] rounded-[2rem] overflow-hidden border-4 dark:border-[#373940] border-slate-300 shadow-2xl bg-gradient-to-b dark:from-[#2a6839] dark:to-[#1e4a29] from-[#348247] to-[#255c32]">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[31.4%] aspect-square rounded-full border-[3px] dark:border-white/20 border-white/40 pointer-events-none" />
              <div className="absolute left-1/2 -translate-x-1/2 w-[26.9%] overflow-hidden pointer-events-none" style={{ bottom: '31.4%', height: '6.95%' }}>
                <div className="absolute top-0 left-0 w-full border-[3px] dark:border-white/20 border-white/40 rounded-full pointer-events-none" style={{ height: '500%' }} />
              </div>
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[59.3%] h-[31.4%] border-[3px] dark:border-white/20 border-white/40 border-b-0 pointer-events-none rounded-t-xl" />
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[26.9%] h-[10.5%] border-[3px] dark:border-white/20 border-white/40 border-b-0 pointer-events-none rounded-t-lg" />
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[10.7%] h-[3%] bg-[#c2c4cb] border-x-2 border-t-2 border-[#b0b3ba] pointer-events-none z-10 rounded-t-sm" />
              
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
                    <div className={\`rounded-full \${shot.isGoal ? 'w-[15px] h-[15px] bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]' : (isOnTarget ? 'w-[13px] h-[13px] bg-[#d49aab] opacity-[0.9]' : 'w-[13px] h-[13px] bg-transparent border-[2.5px] border-[#d49aab] opacity-[0.8]')}\`}>
                      {shot.isGoal && <span className="absolute inset-0 flex items-center justify-center text-[10px] leading-none pointer-events-none drop-shadow-md">⚽</span>}
                    </div>
                    {isActive && (
                      <div className="absolute inset-0 rounded-full border-[2.5px] border-[#ef4444] shadow-[0_0_8px_rgba(239,68,68,0.8)] scale-[1.5] pointer-events-none bg-[#ef4444]/20" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Footer Stats for Left Column */}
          <div className="flex flex-col mt-auto">
            <div className="flex justify-around items-center pt-8">
              <div className="flex flex-col items-center gap-1">
                <span className="text-[22px] font-black dark:text-white text-slate-900 leading-none">{totalShotsFiltered}</span>
                <span className="text-[12px] font-bold dark:text-slate-400 text-slate-500">Shots</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <span className="text-[22px] font-black dark:text-white text-slate-900 leading-none">{totalGoalsFiltered}</span>
                <span className="text-[12px] font-bold dark:text-slate-400 text-slate-500">Goals</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <span className="text-[22px] font-black dark:text-white text-slate-900 leading-none">{totalxG}</span>
                <span className="text-[12px] font-bold dark:text-slate-400 text-slate-500">xG</span>
              </div>
            </div>
            
            <div className="w-full h-px dark:bg-white/5 bg-slate-200 my-6"></div>
            
            <div className="flex justify-center gap-6 text-[12px] font-bold dark:text-slate-200 text-slate-700">
              <div className="flex items-center gap-2">
                <span className="text-[14px] leading-none">⚽</span>
                <span>Goal</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#d49aab]"></div>
                <span>On Target</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-transparent border-[2.5px] border-[#d49aab]"></div>
                <span>Miss/Block</span>
              </div>
            </div>
          </div>
        </div>
`;

// Extract the exact start/end of the left column container
const startTag = '{/* LEFT COLUMN: Main Vis Container (Pitch or Big Goalpost) */}';
const endTag = '{/* RIGHT COLUMN: Controls & Match Detail */}';

const startIdx = content.indexOf(startTag);
const endIdx = content.indexOf(endTag);

if (startIdx !== -1 && endIdx !== -1) {
  const finalContent = content.substring(0, startIdx) + newPitchContainer.trim() + '\n        \n        ' + content.substring(endIdx);
  fs.writeFileSync(path, finalContent, 'utf8');
  console.log('Replaced left column perfectly!');
} else {
  console.log('Failed to find tags.');
}
