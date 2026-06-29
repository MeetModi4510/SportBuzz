const fs = require('fs');
let text = fs.readFileSync('server/routes/cricketRoutes.js', 'utf8');

const imageLogic = `
// A dictionary to hardcode high-quality stadium images (bypassing Wikipedia)
// You can add or replace any stadium's image here by its ESPN ground ID.
const HARDCODED_IMAGES = {
    // India
    713: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?q=80&w=2000&auto=format&fit=crop', // Wankhede
    292: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=2000&auto=format&fit=crop', // Eden Gardens
    291: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?q=80&w=2000&auto=format&fit=crop', // MA Chidambaram
    333: 'https://images.unsplash.com/photo-1551280857-2b9ebf241ac1?q=80&w=2000&auto=format&fit=crop', // Arun Jaitley
    2865: 'https://images.unsplash.com/photo-1508344928928-7137b29de216?q=80&w=2000&auto=format&fit=crop', // Barsapara
    275: 'https://images.unsplash.com/photo-1518091043644-c1d4457512c6?q=80&w=2000&auto=format&fit=crop', // Narendra Modi Stadium
    273: 'https://images.unsplash.com/photo-1497561813398-8fcc7a37b567?q=80&w=2000&auto=format&fit=crop', // M. Chinnaswamy
    683: 'https://images.unsplash.com/photo-1587329310686-91414b8e3cb7?q=80&w=2000&auto=format&fit=crop', // Rajiv Gandhi
    1015: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=2000&auto=format&fit=crop', // IS Bindra
    
    // Default fallback image if neither Wikipedia nor hardcoded is found
    'DEFAULT': 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?q=80&w=2000&auto=format&fit=crop'
};
`;

if (!text.includes('HARDCODED_IMAGES')) {
    text = text.replace('const COUNTRY_ESPN_VENUES = {', imageLogic + '\nconst COUNTRY_ESPN_VENUES = {');
}

const replaceStr = `let finalImage = v.wikiTitle ? (getCached(imgCache, v.wikiTitle) || null) : null;`;
const replacement = `let finalImage = HARDCODED_IMAGES[v.id] || (v.wikiTitle ? (getCached(imgCache, v.wikiTitle) || null) : null) || HARDCODED_IMAGES['DEFAULT'];`;
text = text.replace(replaceStr, replacement);

// The `v.id` is actually `v.name` in the mapped object if we look closely... Wait! 
// Let's check `v.id` vs `v.espnGroundId`
// Wait, inside the `canonicalVenues.map(v => ... )`, `v` is the original object from `COUNTRY_ESPN_VENUES`, so `v.id` IS the ESPN ground id!
// Let me double check it. Yes, it's `canonicalVenues.map(v => { ... v.id ... })`.

fs.writeFileSync('server/routes/cricketRoutes.js', text);
