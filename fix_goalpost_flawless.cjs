const fs = require('fs');
const path = 'c:\\\\Users\\\\PRANSHU PATEL\\\\OneDrive\\\\Desktop\\\\dev_scripts\\\\src\\\\components\\\\football\\\\FotmobPlayerCard.tsx';
let content = fs.readFileSync(path, 'utf8');

const newGoalpostView = `
            {/* VIEW 2: BIG GOALPOST (All Shots on Target) */}
            <div className={\`absolute inset-x-0 transition-opacity duration-500 \${viewMode === 'goal' ? 'opacity-100 z-10 relative' : 'opacity-0 pointer-events-none z-0 absolute'} flex flex-col items-center justify-center\`}>
              
              {/* Card Container for Goalpost */}
              <div className="relative w-full max-w-[500px] aspect-[5/3] bg-[#222225] rounded-xl overflow-hidden flex flex-col mt-6 border dark:border-white/5 border-slate-800">
                
                {/* Ground Fill */}
                <div className="absolute bottom-0 left-0 right-0 h-[25%] bg-[#222225]" />
                
                {/* Ground Line spanning full width */}
                <div className="absolute bottom-[25%] left-0 right-0 h-[1.5px] bg-[#44464a] z-0" />

                {/* Goal Box (Strict 3:1 coordinate system matching exact bounds) */}
                <div className="absolute bottom-[25%] left-[8.333%] w-[83.333%] aspect-[3/1] overflow-visible z-10">
                  
                  {/* Exact SVG Grid */}
                  <div className="absolute inset-0 z-0 pointer-events-none">
                    <svg width="100%" height="100%" viewBox="0 0 300 100" preserveAspectRatio="none" className="overflow-visible">
                      {/* Back Net Frame (Indented by 15px/15% to look correct) */}
                      <path d="M15,15 L285,15 L285,100 L15,100 Z" fill="none" stroke="#44464a" strokeWidth="2"/>
                      
                      {/* Horizontal Net Lines */}
                      <path d="M15,36.25 L285,36.25" fill="none" stroke="#44464a" strokeWidth="2"/>
                      <path d="M15,57.5 L285,57.5" fill="none" stroke="#44464a" strokeWidth="2"/>
                      <path d="M15,78.75 L285,78.75" fill="none" stroke="#44464a" strokeWidth="2"/>
                      
                      {/* Vertical Net Lines */}
                      <path d="M45,15 L45,100" fill="none" stroke="#44464a" strokeWidth="2"/>
                      <path d="M75,15 L75,100" fill="none" stroke="#44464a" strokeWidth="2"/>
                      <path d="M105,15 L105,100" fill="none" stroke="#44464a" strokeWidth="2"/>
                      <path d="M135,15 L135,100" fill="none" stroke="#44464a" strokeWidth="2"/>
                      <path d="M165,15 L165,100" fill="none" stroke="#44464a" strokeWidth="2"/>
                      <path d="M195,15 L195,100" fill="none" stroke="#44464a" strokeWidth="2"/>
                      <path d="M225,15 L225,100" fill="none" stroke="#44464a" strokeWidth="2"/>
                      <path d="M255,15 L255,100" fill="none" stroke="#44464a" strokeWidth="2"/>

                      {/* Side & Top Diagonals */}
                      <path d="M0,0 L15,15" fill="none" stroke="#44464a" strokeWidth="2"/>
                      <path d="M300,0 L285,15" fill="none" stroke="#44464a" strokeWidth="2"/>
                      <path d="M0,100 L15,100" fill="none" stroke="#44464a" strokeWidth="2"/>
                      <path d="M300,100 L285,100" fill="none" stroke="#44464a" strokeWidth="2"/>

                      {/* Top Net Diagonals */}
                      <path d="M45,15 L33.3,0" fill="none" stroke="#44464a" strokeWidth="2"/>
                      <path d="M75,15 L66.6,0" fill="none" stroke="#44464a" strokeWidth="2"/>
                      <path d="M105,15 L100,0" fill="none" stroke="#44464a" strokeWidth="2"/>
                      <path d="M135,15 L133.3,0" fill="none" stroke="#44464a" strokeWidth="2"/>
                      <path d="M165,15 L166.6,0" fill="none" stroke="#44464a" strokeWidth="2"/>
                      <path d="M195,15 L200,0" fill="none" stroke="#44464a" strokeWidth="2"/>
                      <path d="M225,15 L233.3,0" fill="none" stroke="#44464a" strokeWidth="2"/>
                      <path d="M255,15 L266.6,0" fill="none" stroke="#44464a" strokeWidth="2"/>

                      {/* Front Posts and Crossbar */}
                      <path d="M0,0 L300,0 L300,100" fill="none" stroke="#77787c" strokeWidth="4"/>
                      <path d="M0,0 L0,100" fill="none" stroke="#77787c" strokeWidth="4"/>
                    </svg>
                  </div>
                  
                  {/* Markers rendered exactly on coordinate grid */}
                  {filteredShots.map((shot: any, idx: number) => {
                    if (!shot.onGoalShot && !shot.isGoal && !shot.isOnTarget) return null;
                    
                    const isActive = activeShotIndex === idx;
                    
                    // Direct mathematical mapping: width represents 0..2, height represents 0..0.666
                    const xPercent = shot.onGoalShot ? (shot.onGoalShot.x / 2.0) * 100 : 50;
                    const yPercent = shot.onGoalShot ? (shot.onGoalShot.y / 0.6666667) * 100 : 50;

                    return (
                      <div
                        key={idx}
                        onClick={() => setActiveShotIndex(idx)}
                        className={\`absolute cursor-pointer flex items-center justify-center \${isActive ? 'z-40' : (shot.isGoal ? 'z-30' : 'z-20')}\`}
                        style={{ 
                          left: \`\${xPercent}%\`, 
                          bottom: \`\${yPercent}%\`,
                          transform: 'translate(-50%, 50%)', // Centers the container directly on coordinates
                          width: '26px', // Container size accommodates highlight ring
                          height: '26px'
                        }}
                      >
                        {/* 1. The Highlight Ring (Centered, crisp, proportional) */}
                        {isActive && (
                          <div className="absolute inset-0 rounded-full border-[2px] border-[#ff4b4b] pointer-events-none z-50" />
                        )}
                        
                        {/* 2. The Shot Marker (18x18 uniform size) */}
                        <div className="relative flex items-center justify-center w-[18px] h-[18px] z-30">
                          {shot.isGoal ? (
                            // Clean SVG Soccer Ball Icon
                            <svg viewBox="0 0 512 512" fill="white" className="w-full h-full drop-shadow-sm">
                              <circle cx="256" cy="256" r="240" fill="white" stroke="#222" strokeWidth="24"/>
                              <path d="M256,160 L320,208 L296,288 L216,288 L192,208 Z" fill="#222"/>
                              <line x1="256" y1="160" x2="256" y2="16" stroke="#222" strokeWidth="24" strokeLinecap="round"/>
                              <line x1="320" y1="208" x2="456" y2="152" stroke="#222" strokeWidth="24" strokeLinecap="round"/>
                              <line x1="296" y1="288" x2="400" y2="440" stroke="#222" strokeWidth="24" strokeLinecap="round"/>
                              <line x1="216" y1="288" x2="112" y2="440" stroke="#222" strokeWidth="24" strokeLinecap="round"/>
                              <line x1="192" y1="208" x2="56" y2="152" stroke="#222" strokeWidth="24" strokeLinecap="round"/>
                            </svg>
                          ) : (
                            // Solid Pink Circle
                            <div className="w-full h-full rounded-full bg-[#c2768d] opacity-[0.85] shadow-sm" />
                          )}
                        </div>
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
  console.log('Final flawless structural fix applied!');
} else {
  console.log('Could not find tags for VIEW 2');
}
