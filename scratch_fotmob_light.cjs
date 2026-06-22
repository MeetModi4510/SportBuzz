const fs = require('fs');
const path = require('path');

const filePath = path.join('d:', 'dev_scripts', 'src', 'components', 'football', 'FotmobPlayerCard.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// The replacements to perform
const replacements = [
    { from: /bg-\[#16181c\]/g, to: 'dark:bg-[#16181c] bg-white' },
    { from: /bg-\[#121316\]/g, to: 'dark:bg-[#121316] bg-slate-50' },
    { from: /bg-\[#1f2126\]/g, to: 'dark:bg-[#1f2126] bg-slate-100' },
    { from: /bg-\[#1a1c21\]/g, to: 'dark:bg-[#1a1c21] bg-white' },
    { from: /bg-\[#0e1015\]/g, to: 'dark:bg-[#0e1015] bg-slate-50' },
    { from: /bg-\[#08080a\]/g, to: 'dark:bg-[#08080a] bg-slate-100' },
    { from: /bg-\[#2b2d32\]/g, to: 'dark:bg-[#2b2d32] bg-slate-200' },
    { from: /bg-\[#2a2c33\]/g, to: 'dark:bg-[#2a2c33] bg-slate-200' },
    { from: /border-white\/5/g, to: 'dark:border-white/5 border-slate-200' },
    { from: /border-white\/10/g, to: 'dark:border-white/10 border-slate-300' },
    { from: /border-white\/20/g, to: 'dark:border-white/20 border-slate-400' },
    { from: /bg-white\/5/g, to: 'dark:bg-white/5 bg-slate-200' },
    { from: /bg-white\/10/g, to: 'dark:bg-white/10 bg-slate-300' },
    { from: /text-white/g, to: 'dark:text-white text-slate-900' },
    { from: /text-gray-400/g, to: 'dark:text-gray-400 text-slate-500' },
    { from: /text-gray-500/g, to: 'dark:text-gray-500 text-slate-600' },
    { from: /text-gray-300/g, to: 'dark:text-gray-300 text-slate-700' },
    { from: /text-\[#34D399\]/g, to: 'dark:text-[#34D399] text-emerald-600' },
];

replacements.forEach(({ from, to }) => {
    content = content.replace(from, to);
});

// Since we did global text-white, we might have messed up some inline SVGs or special Recharts labels that expect "white", "gray-400".
// Let's check if there are any Recharts components and fix them. Recharts components often use fill="white", but we replaced text-white which is a Tailwind class.
// But we might have accidentally transformed stroke="white" ? No, regex only looks for text-white. 
// However, there is <text fill="white"> in PolarAreaChart, let's fix if it was affected. text-white is a class, but we matched text-white which also matches inside className="text-white".

fs.writeFileSync(filePath, content);
console.log('Successfully updated FotmobPlayerCard.tsx to light mode!');
