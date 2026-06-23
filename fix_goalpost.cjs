const fs = require('fs');
const path = 'c:\\\\Users\\\\PRANSHU PATEL\\\\OneDrive\\\\Desktop\\\\dev_scripts\\\\src\\\\components\\\\football\\\\FotmobPlayerCard.tsx';
let content = fs.readFileSync(path, 'utf8');

const replacement = `
            {/* VIEW 2: BIG GOALPOST (All Shots on Target) */}
            <div className={\`absolute inset-x-0 transition-opacity duration-500 \${viewMode === 'goal' ? 'opacity-100 z-10 relative' : 'opacity-0 pointer-events-none z-0 absolute'} flex flex-col items-center justify-center\`}>
              
              {/* Goal Container */}
              <div className="relative w-full max-w-[500px] aspect-[24/8] flex flex-col justify-end overflow-visible">
                {/* SVG Goal Netting to match original */}
                <div className="absolute inset-0 z-0 pointer-events-none">
                  <svg width="100%" height="100%" viewBox="0 0 732 244" preserveAspectRatio="none">
                    {/* Back of the net */}
                    <rect x="70" y="44" width="592" height="200" fill="none" stroke="#606266" strokeWidth="2" className="opacity-50" />
                    
                    {/* Perspective lines */}
                    <line x1="0" y1="0" x2="70" y2="44" stroke="#606266" strokeWidth="2" className="opacity-50" />
                    <line x1="732" y1="0" x2="662" y2="44" stroke="#606266" strokeWidth="2" className="opacity-50" />
                    
                    {/* Vertical grid lines inside back net */}
                    <path d="M 144 44 V 244 M 218 44 V 244 M 292 44 V 244 M 366 44 V 244 M 440 44 V 244 M 514 44 V 244 M 588 44 V 244" stroke="#606266" strokeWidth="2" className="opacity-30" />
                    
                    {/* Horizontal grid lines inside back net */}
                    <path d="M 70 94 H 662 M 70 144 H 662 M 70 194 H 662" stroke="#606266" strokeWidth="2" className="opacity-30" />
                    
                    {/* Diagonal side nets */}
                    <path d="M 35 22 L 70 94 M 35 22 V 244 M 70 94 V 244" stroke="#606266" strokeWidth="2" className="opacity-30" />
                    
                    {/* Top net diagonals */}
                    <path d="M 70 44 L 144 0 M 144 44 L 218 0 M 218 44 L 292 0 M 292 44 L 366 0 M 366 44 L 440 0 M 440 44 L 514 0 M 514 44 L 588 0 M 588 44 L 662 0" stroke="#606266" strokeWidth="2" className="opacity-30" />

                    {/* Outer frame (Posts and crossbar) */}
                    <rect x="0" y="0" width="732" height="244" fill="none" stroke="#808285" strokeWidth="8" />
                  </svg>
                </div>
                
                {/* Dots on Big Net */}
                {filteredShots.map((shot: any, idx: number) => {
                  if (!shot.onGoalShot && !shot.isGoal && !shot.isOnTarget) return null;
                  
                  const isActive = activeShotIndex === idx;
                  const xCoord = shot.onGoalShot ? (shot.onGoalShot.x / 2) * 100 : 50;
                  // Fotmob goals are exactly 1/3 ratio height/width. so y runs 0 to 0.6666.
                  const yCoord = shot.onGoalShot ? Math.min(1.0, shot.onGoalShot.y / 0.6666) * 100 : 50;

                  return (
                    <div
                      key={idx}
                      onClick={() => setActiveShotIndex(idx)}
                      className={\`absolute -translate-x-1/2 translate-y-1/2 cursor-pointer flex items-center justify-center \${isActive ? 'z-40' : (shot.isGoal ? 'z-30' : 'z-20')}\`}
                      style={{ 
                        left: \`\${xCoord}%\`, 
                        bottom: \`\${yCoord}%\`,
                        width: '20px',
                        height: '20px'
                      }}
                    >
                      {/* Shot Marker */}
                      {shot.isGoal ? (
                        <div className="relative flex items-center justify-center w-[16px] h-[16px]">
                          <span className="text-[14px] leading-none pointer-events-none grayscale contrast-[1.25] brightness-110 drop-shadow-md">⚽</span>
                        </div>
                      ) : (
                        <div className="w-[16px] h-[16px] rounded-full bg-[#c2768d] opacity-80 border-[1.5px] border-[#c2768d]" />
                      )}
                      
                      {/* Red Highlight Ring */}
                      {isActive && (
                        <div className="absolute z-50 w-[24px] h-[24px] rounded-full border-[2.5px] border-[#ef4444] shadow-[0_0_8px_rgba(239,68,68,0.5)] pointer-events-none" />
                      )}
                    </div>
                  );
                })}
              </div>
              {/* Ground */}
              <div className="w-full h-14 bg-[#2d2e33] max-w-[600px] mt-0 rounded-b-md z-0" />
            </div>
`;

const view2Start = "{/* VIEW 2: BIG GOALPOST (All Shots on Target) */}";
const view2End = "</div>\n\n          </div>\n\n          {/* Footer Stats for Left Column */}";

const startIndex = content.indexOf(view2Start);
const endIndex = content.indexOf("{/* Footer Stats for Left Column */}");

if (startIndex !== -1 && endIndex !== -1) {
  // Find the exact end of VIEW 2
  const before = content.substring(0, startIndex);
  const after = "\n          " + content.substring(endIndex);
  
  content = before + replacement.trim() + after;
  fs.writeFileSync(path, content, 'utf8');
  console.log('Replaced Big Goalpost view!');
} else {
  console.log('Could not find tags');
}
