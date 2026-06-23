const fs = require('fs');
const path = 'c:\\\\Users\\\\PRANSHU PATEL\\\\OneDrive\\\\Desktop\\\\dev_scripts\\\\src\\\\components\\\\football\\\\FotmobPlayerCard.tsx';
let content = fs.readFileSync(path, 'utf8');

const newGoalpostView = `
            {/* VIEW 2: BIG GOALPOST (All Shots on Target) */}
            <div className={\`absolute inset-x-0 transition-opacity duration-500 \${viewMode === 'goal' ? 'opacity-100 z-10 relative' : 'opacity-0 pointer-events-none z-0 absolute'} flex flex-col items-center justify-center\`}>
              
              {/* Card Container for Goalpost */}
              <div className="relative w-full max-w-[500px] aspect-[5/3] bg-[#222225] rounded-xl overflow-hidden shadow-inner flex flex-col mt-6 border dark:border-white/5 border-slate-800">
                
                {/* Ground Fill */}
                <div className="absolute bottom-0 left-0 right-0 h-[22%] bg-[#2b2d32]" />
                
                {/* Ground Line spanning full width */}
                <div className="absolute bottom-[22%] left-0 right-0 h-[1.5px] bg-[#44464a]" />

                {/* Goal Box (Provides coordinate system exactly matching posts) */}
                <div className="absolute bottom-[22%] left-[10%] w-[80%] aspect-[3/1] overflow-visible">
                  
                  {/* SVG Goal Netting */}
                  <div className="absolute inset-0 z-0 pointer-events-none">
                    <svg width="100%" height="100%" viewBox="0 0 300 100" className="overflow-visible">
                      {/* Back Net Frame */}
                      <path d="M0,0 L30,20 L270,20 L300,0" fill="none" stroke="#44464a" strokeWidth="2" />
                      <path d="M30,20 L30,100" fill="none" stroke="#44464a" strokeWidth="2" />
                      <path d="M270,20 L270,100" fill="none" stroke="#44464a" strokeWidth="2" />
                      
                      {/* Horizontal Net Lines */}
                      <path d="M30,40 L270,40" fill="none" stroke="#44464a" strokeWidth="2" />
                      <path d="M30,60 L270,60" fill="none" stroke="#44464a" strokeWidth="2" />
                      <path d="M30,80 L270,80" fill="none" stroke="#44464a" strokeWidth="2" />
                      
                      {/* Vertical Net Lines */}
                      <path d="M56.66,20 L56.66,100" fill="none" stroke="#44464a" strokeWidth="2" />
                      <path d="M83.33,20 L83.33,100" fill="none" stroke="#44464a" strokeWidth="2" />
                      <path d="M110,20 L110,100" fill="none" stroke="#44464a" strokeWidth="2" />
                      <path d="M136.66,20 L136.66,100" fill="none" stroke="#44464a" strokeWidth="2" />
                      <path d="M163.33,20 L163.33,100" fill="none" stroke="#44464a" strokeWidth="2" />
                      <path d="M190,20 L190,100" fill="none" stroke="#44464a" strokeWidth="2" />
                      <path d="M216.66,20 L216.66,100" fill="none" stroke="#44464a" strokeWidth="2" />
                      <path d="M243.33,20 L243.33,100" fill="none" stroke="#44464a" strokeWidth="2" />

                      {/* Side Net Diagonals */}
                      <path d="M15,10 L30,40" fill="none" stroke="#44464a" strokeWidth="2" />
                      <path d="M15,10 L15,100" fill="none" stroke="#44464a" strokeWidth="2" />
                      <path d="M285,10 L270,40" fill="none" stroke="#44464a" strokeWidth="2" />
                      <path d="M285,10 L285,100" fill="none" stroke="#44464a" strokeWidth="2" />

                      {/* Top Net Diagonals */}
                      <path d="M30,20 L56.66,0" fill="none" stroke="#44464a" strokeWidth="2" />
                      <path d="M56.66,20 L83.33,0" fill="none" stroke="#44464a" strokeWidth="2" />
                      <path d="M83.33,20 L110,0" fill="none" stroke="#44464a" strokeWidth="2" />
                      <path d="M110,20 L136.66,0" fill="none" stroke="#44464a" strokeWidth="2" />
                      <path d="M136.66,20 L163.33,0" fill="none" stroke="#44464a" strokeWidth="2" />
                      <path d="M163.33,20 L190,0" fill="none" stroke="#44464a" strokeWidth="2" />
                      <path d="M190,20 L216.66,0" fill="none" stroke="#44464a" strokeWidth="2" />
                      <path d="M216.66,20 L243.33,0" fill="none" stroke="#44464a" strokeWidth="2" />
                      <path d="M243.33,20 L270,0" fill="none" stroke="#44464a" strokeWidth="2" />

                      {/* Posts and crossbar */}
                      <path d="M0,0 L300,0 L300,100" fill="none" stroke="#77787c" strokeWidth="5" />
                      <path d="M0,0 L0,100" fill="none" stroke="#77787c" strokeWidth="5" />
                    </svg>
                  </div>
                  
                  {/* Dots on Big Net */}
                  {filteredShots.map((shot: any, idx: number) => {
                    if (!shot.onGoalShot && !shot.isGoal && !shot.isOnTarget) return null;
                    
                    const isActive = activeShotIndex === idx;
                    
                    // Normalize exact coordinates: Fotmob goal x=0 to 2, y=0 to 0.6666667
                    const xCoord = shot.onGoalShot ? (shot.onGoalShot.x / 2.0) * 100 : 50;
                    const yCoord = shot.onGoalShot ? (shot.onGoalShot.y / 0.66666667) * 100 : 50;

                    return (
                      <div
                        key={idx}
                        onClick={() => setActiveShotIndex(idx)}
                        className={\`absolute -translate-x-1/2 translate-y-1/2 cursor-pointer flex items-center justify-center \${isActive ? 'z-40' : (shot.isGoal ? 'z-30' : 'z-20')}\`}
                        style={{ 
                          left: \`\${xCoord}%\`, 
                          bottom: \`\${yCoord}%\`,
                          width: '16px',
                          height: '16px'
                        }}
                      >
                        {/* Shot Marker */}
                        {shot.isGoal ? (
                          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-sm">
                            <circle cx="8" cy="8" r="7.5" fill="white" stroke="#222222" strokeWidth="1"/>
                            <path d="M8 4.5L10 7H6L8 4.5Z" fill="#222222"/>
                            <path d="M13 8.5L11 11L12.5 12.5L14 10.5L13 8.5Z" fill="#222222"/>
                            <path d="M3 8.5L5 11L3.5 12.5L2 10.5L3 8.5Z" fill="#222222"/>
                            <path d="M10 13.5L8 11.5L6 13.5L10 13.5Z" fill="#222222"/>
                          </svg>
                        ) : (
                          <div className="w-[16px] h-[16px] rounded-full bg-[#d18a9e] opacity-90 shadow-sm" />
                        )}
                        
                        {/* Crisp Red Highlight Ring */}
                        {isActive && (
                          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[24px] h-[24px] rounded-full border-[1.5px] border-[#ff4b4b] pointer-events-none" />
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
