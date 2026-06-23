const fs = require('fs');
const path = 'c:\\\\Users\\\\PRANSHU PATEL\\\\OneDrive\\\\Desktop\\\\dev_scripts\\\\src\\\\components\\\\football\\\\FotmobPlayerCard.tsx';
let content = fs.readFileSync(path, 'utf8');

const newGoalpostView = `
            {/* VIEW 2: BIG GOALPOST (All Shots on Target) */}
            <div className={\`absolute inset-x-0 transition-opacity duration-500 \${viewMode === 'goal' ? 'opacity-100 z-10 relative' : 'opacity-0 pointer-events-none z-0 absolute'} flex flex-col items-center justify-center\`}>
              
              {/* Card Container for Goalpost */}
              <div className="relative w-full max-w-[500px] aspect-[5/3] bg-[#2b2d32] rounded-xl overflow-hidden shadow-inner flex flex-col mt-6 border dark:border-white/5 border-slate-800">
                
                {/* Ground Line spanning full width */}
                <div className="absolute bottom-[20%] left-0 right-0 h-[1px] bg-[#55565a]" />

                {/* Goal Box (Provides coordinate system) */}
                <div className="absolute bottom-[20%] left-[10%] w-[80%] aspect-[24/8] overflow-visible">
                  
                  {/* SVG Goal Netting */}
                  <div className="absolute inset-0 z-0 pointer-events-none">
                    <svg width="100%" height="100%" viewBox="0 0 732 244" preserveAspectRatio="none">
                      {/* Back of the net (Inner Rectangle) */}
                      <rect x="70" y="44" width="592" height="200" fill="none" stroke="#55565a" strokeWidth="2" />
                      
                      {/* Perspective diagonal lines (corners to inner back) */}
                      <line x1="0" y1="0" x2="70" y2="44" stroke="#55565a" strokeWidth="2" />
                      <line x1="732" y1="0" x2="662" y2="44" stroke="#55565a" strokeWidth="2" />
                      
                      {/* Vertical grid lines inside back net */}
                      <path d="M 144 44 V 244 M 218 44 V 244 M 292 44 V 244 M 366 44 V 244 M 440 44 V 244 M 514 44 V 244 M 588 44 V 244" stroke="#55565a" strokeWidth="2" />
                      
                      {/* Horizontal grid lines inside back net */}
                      <path d="M 70 94 H 662 M 70 144 H 662 M 70 194 H 662" stroke="#55565a" strokeWidth="2" />
                      
                      {/* Diagonal side nets */}
                      <path d="M 35 22 L 70 94 M 35 22 V 244 M 70 94 V 244" stroke="#55565a" strokeWidth="2" />
                      
                      {/* Top net diagonals */}
                      <path d="M 70 44 L 144 0 M 144 44 L 218 0 M 218 44 L 292 0 M 292 44 L 366 0 M 366 44 L 440 0 M 440 44 L 514 0 M 514 44 L 588 0 M 588 44 L 662 0" stroke="#55565a" strokeWidth="2" />

                      {/* Outer frame (Posts and crossbar) */}
                      <rect x="0" y="0" width="732" height="244" fill="none" stroke="#9ca3af" strokeWidth="6" />
                    </svg>
                  </div>
                  
                  {/* Dots on Big Net */}
                  {filteredShots.map((shot: any, idx: number) => {
                    if (!shot.onGoalShot && !shot.isGoal && !shot.isOnTarget) return null;
                    
                    const isActive = activeShotIndex === idx;
                    
                    // Fotmob goal coords: x=0 (left post) to x=2 (right post). Center is 1.
                    // y=0 (ground) to y=0.68 (crossbar).
                    const xCoord = shot.onGoalShot ? (shot.onGoalShot.x / 2) * 100 : 50;
                    const yCoord = shot.onGoalShot ? (shot.onGoalShot.y / 0.68) * 100 : 50;

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
                          // Vector Soccer Ball
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="white" stroke="black" strokeWidth="1.5" className="drop-shadow-md z-20">
                            <circle cx="12" cy="12" r="10" />
                            <path d="M12 5.5l2.5 3.5h-5z" fill="black" />
                            <path d="M18 10l-2 4 3 2z" fill="black" />
                            <path d="M6 10l2 4-3 2z" fill="black" />
                            <path d="M14 18l-2-3-2 3z" fill="black" />
                            <path d="M12 9l2.5 3.5h-5z" stroke="black" strokeWidth="0.5" />
                          </svg>
                        ) : (
                          // Pink Shot Attempt (Save/Miss)
                          <div className="w-[18px] h-[18px] rounded-full bg-[#d49aab]/40 border-[2.5px] border-[#d49aab] shadow-sm z-20" />
                        )}
                        
                        {/* Red Highlight Ring perfectly centered */}
                        {isActive && (
                          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 w-[28px] h-[28px] rounded-full border-[2px] border-[#ef4444] shadow-[0_0_8px_rgba(239,68,68,0.5)] pointer-events-none" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
`;

const startTag = "{/* VIEW 2: BIG GOALPOST (All Shots on Target) */}";
const endTag = "          </div>\n\n          {/* Footer Stats for Left Column */}";

const startIdx = content.indexOf(startTag);
const endIdx = content.indexOf(endTag);

if (startIdx !== -1 && endIdx !== -1) {
  content = content.substring(0, startIdx) + newGoalpostView.trim() + '\n\n' + content.substring(endIdx);
  fs.writeFileSync(path, content, 'utf8');
  console.log('Replaced Big Goalpost view precisely!');
} else {
  console.log('Could not find tags for VIEW 2');
}
