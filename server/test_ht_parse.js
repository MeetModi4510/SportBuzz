import fs from 'fs';

const nextData = JSON.parse(fs.readFileSync('ht_next_data.json', 'utf8'));

// Deep search for any commentary-like data
function deepSearch(obj, depth = 0, path = '') {
    if (depth > 10 || !obj || typeof obj !== 'object') return;
    
    for (const [key, val] of Object.entries(obj)) {
        const currentPath = path ? `${path}.${key}` : key;
        
        // If array with multiple items, show its length and first item keys
        if (Array.isArray(val) && val.length > 5) {
            console.log(`[ARRAY] ${currentPath}: length=${val.length}`);
            if (val[0] && typeof val[0] === 'object') {
                console.log(`  First item keys: ${Object.keys(val[0]).join(', ')}`);
                // Check if it looks like commentary
                if (val[0].text || val[0].description || val[0].content || val[0].commentary) {
                    console.log(`  *** LOOKS LIKE COMMENTARY! ***`);
                    console.log(`  First item: ${JSON.stringify(val[0]).substring(0, 200)}`);
                }
            }
        }
        
        // Look for cricket-specific keys
        if (typeof key === 'string' && (
            key.toLowerCase().includes('comment') ||
            key.toLowerCase().includes('over') ||
            key.toLowerCase().includes('ball') ||
            key.toLowerCase().includes('innings') ||
            key.toLowerCase().includes('cricket') ||
            key.toLowerCase().includes('match')
        )) {
            if (val && typeof val === 'object') {
                const size = JSON.stringify(val).length;
                console.log(`\n[KEY MATCH] ${currentPath} (size: ${size})`);
                if (size < 500) {
                    console.log(`  Value: ${JSON.stringify(val)}`);
                } else if (Array.isArray(val)) {
                    console.log(`  Array length: ${val.length}`);
                    if (val[0]) console.log(`  First: ${JSON.stringify(val[0]).substring(0, 200)}`);
                } else {
                    console.log(`  Keys: ${Object.keys(val).join(', ')}`);
                }
            } else if (typeof val === 'string' && val.length > 30) {
                console.log(`\n[KEY MATCH] ${currentPath}: "${val.substring(0, 100)}"`);
            }
        }
        
        // Recurse
        if (val && typeof val === 'object' && !Array.isArray(val)) {
            deepSearch(val, depth + 1, currentPath);
        }
    }
}

console.log('Searching __NEXT_DATA__.props.pageProps for commentary...\n');
deepSearch(nextData.props.pageProps, 0, 'pageProps');

// Also dump the pageProps keys
console.log('\n\npageProps keys:', Object.keys(nextData.props.pageProps || {}));
