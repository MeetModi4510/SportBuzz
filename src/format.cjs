const fs = require('fs');
let file = fs.readFileSync('d:\\dev_scripts\\src\\components\\football\\PerformanceLabTab.tsx', 'utf8');
file = file.replace(/text-blue-400/g, 'text-slate-300')
           .replace(/bg-blue-500/g, 'bg-slate-300')
           .replace(/border-blue-500/g, 'border-slate-400')
           .replace(/text-blue-300/g, 'text-slate-400')
           .replace(/from-blue-500/g, 'from-slate-500')
           .replace(/from-blue-900/g, 'from-slate-800');

file = file.replace(/text-red-400/g, 'text-slate-400')
           .replace(/bg-red-500/g, 'bg-slate-500')
           .replace(/border-red-500/g, 'border-slate-500')
           .replace(/text-red-300/g, 'text-slate-500')
           .replace(/from-red-500/g, 'from-slate-600')
           .replace(/from-red-900/g, 'from-slate-800');

file = file.replace(/#3b82f6/g, '#cbd5e1').replace(/#ef4444/g, '#64748b');
file = file.replace(/shadow-\[0_0_10px_rgba\(59,130,246,0\.5\)\]/g, 'shadow-sm')
           .replace(/shadow-\[0_0_10px_rgba\(239,68,68,0\.5\)\]/g, 'shadow-sm');

// More minimalistic gradients and borders overall
file = file.replace(/bg-gradient-to-br from-indigo-900\/20 to-purple-900\/10/g, 'bg-black/20 backdrop-blur-md')
           .replace(/border-indigo-500\/20/g, 'border-white/5')
           .replace(/text-indigo-50/g, 'text-white')
           .replace(/text-indigo-400/g, 'text-slate-300')
           .replace(/fill-indigo-400/g, 'fill-slate-300')
           .replace(/border-indigo-500\/30/g, 'border-white/10')
           .replace(/text-indigo-300\/80/g, 'text-slate-400')
           .replace(/bg-indigo-500\/10/g, 'bg-white/5')
           .replace(/text-indigo-200\/80/g, 'text-slate-300')
           .replace(/border-white\/5/g, 'border-white/10');

// Radar chart colors
file = file.replace(/fill="#3b82f6"/g, 'fill="#cbd5e1"')
           .replace(/stroke="#3b82f6"/g, 'stroke="#cbd5e1"')
           .replace(/fill="#ef4444"/g, 'fill="#64748b"')
           .replace(/stroke="#ef4444"/g, 'stroke="#64748b"');

fs.writeFileSync('d:\\dev_scripts\\src\\components\\football\\PerformanceLabTab.tsx', file);
