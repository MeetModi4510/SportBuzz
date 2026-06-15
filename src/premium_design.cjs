const fs = require('fs');

let file = fs.readFileSync('d:\\dev_scripts\\src\\components\\football\\PerformanceLabTab.tsx', 'utf8');

// Strip all gradients and glassmorphism wrappers
file = file.replace(/bg-gradient-to-br from-\S+ to-\S+/g, 'bg-[#09090b]');
file = file.replace(/backdrop-blur-\w+/g, '');

// Strip neon/glow shadows
file = file.replace(/shadow-\[0_.*?\]/g, 'shadow-sm');
file = file.replace(/shadow-xl/g, 'shadow-none');
file = file.replace(/shadow-lg/g, 'shadow-none');
file = file.replace(/drop-shadow-md\/[0-9]+/g, '');
file = file.replace(/drop-shadow-md/g, '');

// Strip decorative background blobs entirely (they look like gaming UI)
file = file.replace(/<div className="absolute top-0 (right|left)-0 w-\d+ h-\d+ bg-\S+ rounded-full blur-3xl.*?><\/div>/g, '');

// Matte, ultra-thin borders for bento boxes
file = file.replace(/border border-\S+/g, 'border border-white/[0.08]');
file = file.replace(/border-\S+\/30\/20/g, 'border-white/[0.05]');
file = file.replace(/border-\S+\/30/g, 'border-white/[0.05]');

// Tone down font weights (font-black -> font-semibold, tracking-tight)
file = file.replace(/font-black/g, 'font-semibold tracking-tight');
file = file.replace(/text-4xl/g, 'text-4xl tracking-tighter');
file = file.replace(/text-3xl/g, 'text-3xl tracking-tighter');
file = file.replace(/text-xl/g, 'text-lg font-medium');
file = file.replace(/uppercase tracking-wider/g, 'tracking-tight');

// Clean up text colors
// Muted elegant primary text
file = file.replace(/text-white/g, 'text-zinc-100');
file = file.replace(/text-cyan-400/g, 'text-zinc-300');
file = file.replace(/text-rose-400/g, 'text-zinc-400');
file = file.replace(/text-rose-500\/80/g, 'text-zinc-500');

// Muted elegant secondary text
file = file.replace(/text-zinc-100\/40/g, 'text-zinc-500');
file = file.replace(/text-zinc-100\/50/g, 'text-zinc-500');
file = file.replace(/text-zinc-100\/70/g, 'text-zinc-400');

// Change bright fills/bg to extremely subtle dark accents
file = file.replace(/bg-slate-900\/50/g, 'bg-[#0f0f11]');
file = file.replace(/bg-secondary/g, 'bg-[#18181b]');
file = file.replace(/bg-black\/40/g, 'bg-[#09090b]');
file = file.replace(/bg-cyan-500\/10/g, 'bg-zinc-800/20');
file = file.replace(/bg-rose-500\/10/g, 'bg-zinc-800/20');
file = file.replace(/bg-cyan-500/g, 'bg-zinc-700');
file = file.replace(/bg-rose-500/g, 'bg-zinc-800');

// Rounding
file = file.replace(/rounded-3xl/g, 'rounded-2xl');

// Radar chart colors (Make them matte white/gray instead of neon)
file = file.replace(/stroke="#06b6d4"/g, 'stroke="#e4e4e7"');
file = file.replace(/fill="#06b6d4"/g, 'fill="#e4e4e7"');
file = file.replace(/stroke="#f43f5e"/g, 'stroke="#71717a"');
file = file.replace(/fill="#f43f5e"/g, 'fill="#71717a"');

// Line chart momentum
file = file.replace(/stroke="#06b6d4" strokeWidth=\{3\}/g, 'stroke="#e4e4e7" strokeWidth={2}');
file = file.replace(/stroke="#f43f5e" strokeWidth=\{3\}/g, 'stroke="#71717a" strokeWidth={2}');
file = file.replace(/fill: "#06b6d4"/g, 'fill: "#e4e4e7"');
file = file.replace(/fill: "#f43f5e"/g, 'fill: "#71717a"');

fs.writeFileSync('d:\\dev_scripts\\src\\components\\football\\PerformanceLabTab.tsx', file);
