const fs = require('fs');
const path = 'c:\\\\Users\\\\PRANSHU PATEL\\\\OneDrive\\\\Desktop\\\\dev_scripts\\\\src\\\\components\\\\football\\\\FotmobPlayerCard.tsx';
let content = fs.readFileSync(path, 'utf8');

// Remove the glow from the pitch balls
content = content.replace(
  /\{\s*shot\.isGoal && \(\s*<div className="absolute w-\[20px\] h-\[20px\] bg-white\/70 blur-\[4px\] rounded-full pointer-events-none" \/>\s*\)\s*\}/g,
  ''
);

// Remove the glow from the legend
content = content.replace(
  /<div className="relative flex items-center justify-center w-4 h-4">\s*<div className="absolute inset-0 bg-white\/70 blur-\[3px\] rounded-full" \/>\s*<span className="text-\[14px\] leading-none relative z-10 grayscale contrast-\[1\.25\] brightness-110">⚽<\/span>\s*<\/div>/g,
  '<span className="text-[15px] leading-none grayscale contrast-[1.25] brightness-110 drop-shadow-md">⚽</span>'
);

fs.writeFileSync(path, content, 'utf8');
console.log('Removed glow!');
