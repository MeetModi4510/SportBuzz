const fs = require('fs');
let file = fs.readFileSync('d:\\dev_scripts\\src\\components\\football\\PerformanceLabTab.tsx', 'utf8');

// Replace flat slate colors with vibrant cyan/rose
file = file.replace(/text-slate-300/g, 'text-cyan-400')
           .replace(/bg-slate-300/g, 'bg-cyan-500')
           .replace(/border-slate-400/g, 'border-cyan-500/30')
           .replace(/text-slate-400/g, 'text-rose-400')
           .replace(/from-slate-500/g, 'from-cyan-500/20')
           .replace(/from-slate-800/g, 'from-cyan-900/40');

file = file.replace(/text-slate-500/g, 'text-rose-500')
           .replace(/bg-slate-500/g, 'bg-rose-500')
           .replace(/border-slate-500/g, 'border-rose-500/30')
           .replace(/from-slate-600/g, 'from-rose-500/20');

file = file.replace(/#cbd5e1/g, '#06b6d4').replace(/#64748b/g, '#f43f5e');

// Add rich glow to shadows
file = file.replace(/shadow-sm/g, 'shadow-[0_0_15px_rgba(6,182,212,0.6)]')
           .replace(/shadow-\[0_0_15px_rgba\(6,182,212,0\.6\)\]/g, (match, offset, str) => {
               // Alternate rose shadows for away elements based on nearby text
               if (str.substring(offset - 100, offset).includes('bg-rose-500')) {
                   return 'shadow-[0_0_15px_rgba(244,63,94,0.6)]';
               }
               return match;
           });

// Enhance borders and backgrounds for premium glassmorphism
file = file.replace(/bg-black\/20 backdrop-blur-md/g, 'bg-gradient-to-br from-[#0B1120]/90 to-[#1e1b4b]/90 backdrop-blur-xl border border-indigo-500/20 shadow-[0_8px_32px_rgba(0,0,0,0.5)]')
           .replace(/bg-black\/40/g, 'bg-slate-900/50 backdrop-blur-lg shadow-xl');

// Add subtle gradients to icons
file = file.replace(/text-white/g, 'text-white drop-shadow-md')
           .replace(/fill-slate-300/g, 'fill-cyan-400');

fs.writeFileSync('d:\\dev_scripts\\src\\components\\football\\PerformanceLabTab.tsx', file);
