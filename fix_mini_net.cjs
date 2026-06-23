const fs = require('fs');
const path = 'c:\\\\Users\\\\PRANSHU PATEL\\\\OneDrive\\\\Desktop\\\\dev_scripts\\\\src\\\\components\\\\football\\\\FotmobPlayerCard.tsx';
let content = fs.readFileSync(path, 'utf8');

const targetContent = `        {/* Right Mini Net Graphic */}
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
          </div>`;

const replacementContent = `        {/* Right Mini Net Graphic */}
        <div className="flex flex-col w-[120px]">
          <div className="relative w-full aspect-[24/8] border-[1px] border-white/60 border-b-0 rounded-t-sm flex flex-col justify-end overflow-hidden">
            {/* Square Grid Pattern matching Fotmob exactly */}
            <div className="absolute inset-0 z-0">
              <svg width="100%" height="100%" viewBox="0 0 100 33.33" preserveAspectRatio="none" className="opacity-[0.35]">
                <line x1="0" y1="8.33" x2="100" y2="8.33" stroke="white" strokeWidth="0.5" />
                <line x1="0" y1="16.66" x2="100" y2="16.66" stroke="white" strokeWidth="0.5" />
                <line x1="0" y1="25" x2="100" y2="25" stroke="white" strokeWidth="0.5" />
                <line x1="12.5" y1="0" x2="12.5" y2="33.33" stroke="white" strokeWidth="0.5" />
                <line x1="25" y1="0" x2="25" y2="33.33" stroke="white" strokeWidth="0.5" />
                <line x1="37.5" y1="0" x2="37.5" y2="33.33" stroke="white" strokeWidth="0.5" />
                <line x1="50" y1="0" x2="50" y2="33.33" stroke="white" strokeWidth="0.5" />
                <line x1="62.5" y1="0" x2="62.5" y2="33.33" stroke="white" strokeWidth="0.5" />
                <line x1="75" y1="0" x2="75" y2="33.33" stroke="white" strokeWidth="0.5" />
                <line x1="87.5" y1="0" x2="87.5" y2="33.33" stroke="white" strokeWidth="0.5" />
              </svg>
            </div>
            
            {(activeShot.onGoalShot || activeShot.isGoal || activeShot.isOnTarget) && (
              <div 
                className="absolute z-20 flex items-center justify-center transition-all duration-300"
                style={{ 
                  left: activeShot.onGoalShot ? \`\${(activeShot.onGoalShot.x / 2.0) * 100}%\` : '50%', 
                  bottom: activeShot.onGoalShot ? \`\${Math.min(1, activeShot.onGoalShot.y / 0.6666667) * 100}%\` : '50%',
                  transform: 'translate(-50%, 50%)',
                  width: '14px',
                  height: '14px'
                }}
              >
                {activeShot.isGoal ? (
                  <span className="text-[13px] leading-none pointer-events-none grayscale contrast-[1.25] brightness-110 drop-shadow-md absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[46%] z-30">⚽</span>
                ) : (
                  <div className="w-[9px] h-[9px] rounded-full bg-[#c2768d] shadow-[0_0_8px_rgba(194,118,141,0.8)] border-[1.5px] border-white z-20" />
                )}
              </div>
            )}
          </div>`;

if (content.includes(targetContent)) {
  content = content.replace(targetContent, replacementContent);
  fs.writeFileSync(path, content, 'utf8');
  console.log('Successfully replaced mini net graphic');
} else {
  console.log('Could not find target content');
}
