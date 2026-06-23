const fs = require('fs');
const path = 'c:\\\\Users\\\\PRANSHU PATEL\\\\OneDrive\\\\Desktop\\\\dev_scripts\\\\src\\\\components\\\\football\\\\FotmobPlayerCard.tsx';
let content = fs.readFileSync(path, 'utf8');

const newGoalpostView = `
            {/* VIEW 2: BIG GOALPOST (All Shots on Target) */}
            <div className={\`absolute inset-x-0 transition-opacity duration-500 \${viewMode === 'goal' ? 'opacity-100 z-10 relative' : 'opacity-0 pointer-events-none z-0 absolute'} flex flex-col items-center justify-center\`}>
              
              {/* Card Container for Goalpost */}
              <div className="relative w-full max-w-[500px] aspect-[5/3] bg-[#222225] rounded-xl overflow-hidden flex flex-col mt-6 border dark:border-white/5 border-slate-800">
                
                {/* Ground Line spanning full width */}
                <div className="absolute bottom-[25%] left-0 right-0 h-[1.5px] bg-[#44464a] z-0" />

                {/* Goal Box (Provides coordinate system exactly matching Fotmob 375x125 SVG) */}
                <div className="absolute bottom-[25%] left-[8.333%] w-[83.333%] aspect-[3/1] overflow-visible">
                  
                  {/* Exact Fotmob SVG Goal Netting */}
                  <div className="absolute inset-0 z-0 pointer-events-none">
                    <svg width="100%" height="100%" viewBox="0 0 375 125" preserveAspectRatio="none" className="overflow-visible">
                      {/* Back Net Frame */}
                      <path d="M5,5 L40,30 L335,30 L370,5" fill="none" stroke="#44464a" strokeWidth="2"/>
                      <path d="M40,30 L40,125" fill="none" stroke="#44464a" strokeWidth="2"/>
                      <path d="M335,30 L335,125" fill="none" stroke="#44464a" strokeWidth="2"/>
                      {/* Horizontal Net Lines */}
                      <path d="M40,53.75 L335,53.75" fill="none" stroke="#44464a" strokeWidth="2"/>
                      <path d="M40,77.5 L335,77.5" fill="none" stroke="#44464a" strokeWidth="2"/>
                      <path d="M40,101.25 L335,101.25" fill="none" stroke="#44464a" strokeWidth="2"/>
                      {/* Vertical Net Lines */}
                      <path d="M72.77,30 L72.77,125" fill="none" stroke="#44464a" strokeWidth="2"/>
                      <path d="M105.54,30 L105.54,125" fill="none" stroke="#44464a" strokeWidth="2"/>
                      <path d="M138.31,30 L138.31,125" fill="none" stroke="#44464a" strokeWidth="2"/>
                      <path d="M171.08,30 L171.08,125" fill="none" stroke="#44464a" strokeWidth="2"/>
                      <path d="M203.85,30 L203.85,125" fill="none" stroke="#44464a" strokeWidth="2"/>
                      <path d="M236.62,30 L236.62,125" fill="none" stroke="#44464a" strokeWidth="2"/>
                      <path d="M269.39,30 L269.39,125" fill="none" stroke="#44464a" strokeWidth="2"/>
                      <path d="M302.16,30 L302.16,125" fill="none" stroke="#44464a" strokeWidth="2"/>
                      {/* Side Net Diagonals */}
                      <path d="M22.5,17.5 L40,53.75" fill="none" stroke="#44464a" strokeWidth="2"/>
                      <path d="M22.5,17.5 L22.5,125" fill="none" stroke="#44464a" strokeWidth="2"/>
                      <path d="M352.5,17.5 L335,53.75" fill="none" stroke="#44464a" strokeWidth="2"/>
                      <path d="M352.5,17.5 L352.5,125" fill="none" stroke="#44464a" strokeWidth="2"/>
                      {/* Top Net Diagonals */}
                      <path d="M40,30 L72.77,5" fill="none" stroke="#44464a" strokeWidth="2"/>
                      <path d="M72.77,30 L105.54,5" fill="none" stroke="#44464a" strokeWidth="2"/>
                      <path d="M105.54,30 L138.31,5" fill="none" stroke="#44464a" strokeWidth="2"/>
                      <path d="M138.31,30 L171.08,5" fill="none" stroke="#44464a" strokeWidth="2"/>
                      <path d="M171.08,30 L203.85,5" fill="none" stroke="#44464a" strokeWidth="2"/>
                      <path d="M203.85,30 L236.62,5" fill="none" stroke="#44464a" strokeWidth="2"/>
                      <path d="M236.62,30 L269.39,5" fill="none" stroke="#44464a" strokeWidth="2"/>
                      <path d="M269.39,30 L302.16,5" fill="none" stroke="#44464a" strokeWidth="2"/>
                      <path d="M302.16,30 L335,5" fill="none" stroke="#44464a" strokeWidth="2"/>
                      {/* Posts and crossbar */}
                      <path d="M5,5 L370,5 L370,125" fill="none" stroke="#77787c" strokeWidth="4"/>
                      <path d="M5,5 L5,125" fill="none" stroke="#77787c" strokeWidth="4"/>
                    </svg>
                  </div>
                  
                  {/* Markers rendered exactly on coordinate grid */}
                  {filteredShots.map((shot: any, idx: number) => {
                    if (!shot.onGoalShot && !shot.isGoal && !shot.isOnTarget) return null;
                    
                    const isActive = activeShotIndex === idx;
                    
                    // Normalize exact coordinates: 
                    // Fotmob SVG has posts at x=5 and x=370 in a 375-width viewBox.
                    // So left post is 5/375 = 1.333%. Right post is 370/375 = 98.666%. Width=97.333%
                    const xPercent = shot.onGoalShot ? 1.333 + (shot.onGoalShot.x / 2.0) * 97.333 : 50;
                    
                    // Fotmob SVG has ground at y=125, crossbar at y=5. 
                    // Height is 120. Crossbar is at 96% from bottom (120/125).
                    const yPercent = shot.onGoalShot ? (shot.onGoalShot.y / 0.6666667) * 96.0 : 50;

                    return (
                      <div
                        key={idx}
                        onClick={() => setActiveShotIndex(idx)}
                        className={\`absolute cursor-pointer \${isActive ? 'z-40' : (shot.isGoal ? 'z-30' : 'z-20')}\`}
                        style={{ 
                          left: \`\${xPercent}%\`, 
                          bottom: \`\${yPercent}%\`,
                          transform: 'translate(-50%, 50%)', // Mathematically centers element
                          width: '18px',
                          height: '18px'
                        }}
                      >
                        {/* Render active highlight BEHIND the marker but visually on top layer */}
                        {isActive && (
                          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[26px] h-[26px] rounded-full border-[2px] border-[#ff4b4b] pointer-events-none z-50" />
                        )}
                        
                        {/* Shot Marker */}
                        {shot.isGoal ? (
                          <svg width="18" height="18" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className="absolute top-0 left-0">
                            <circle cx="8" cy="8" r="7.5" fill="white" stroke="#222" strokeWidth="0.5"/>
                            <path d="M8 4L10 7H6L8 4Z" fill="#222"/>
                            <path d="M13.5 8L11 11L13 12.5L14.5 10L13.5 8Z" fill="#222"/>
                            <path d="M2.5 8L5 11L3 12.5L1.5 10L2.5 8Z" fill="#222"/>
                            <path d="M10 14L8 11.5L6 14L10 14Z" fill="#222"/>
                          </svg>
                        ) : (
                          <div className="w-[18px] h-[18px] rounded-full bg-[#c2768d] opacity-80 border-[1px] border-[#a86579] absolute top-0 left-0" />
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
  console.log('Mathematical precision applied to Goalpost view!');
} else {
  console.log('Could not find tags for VIEW 2');
}
