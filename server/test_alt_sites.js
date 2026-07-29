import axios from 'axios';

// Test a variety of smaller cricket sites that might have simpler HTML
// and full commentary without Next.js protection

async function testSite(name, url, searchTerms = ['commentary', 'over', 'bowled']) {
    console.log(`\n${'='.repeat(50)}`);
    console.log(`Testing: ${name}`);
    console.log(`URL: ${url}`);
    try {
        const res = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept': 'text/html,application/xhtml+xml,*/*'
            },
            timeout: 8000
        });

        const html = res.data;
        const isNextJs = html.includes('__NEXT_DATA__') || html.includes('_next/static');
        const isReact = html.includes('window.__INITIAL_STATE__') || html.includes('window.appState') || html.includes('ReactDOM');
        const isOldSchool = !isNextJs && !isReact;

        console.log(`Status: ${res.status} | Size: ${(html.length/1024).toFixed(0)}KB`);
        console.log(`Is Next.js: ${isNextJs} | Is React: ${isReact} | Is Old-School HTML: ${isOldSchool}`);

        for (const term of searchTerms) {
            const count = (html.match(new RegExp(term, 'gi')) || []).length;
            console.log(`  "${term}" occurrences: ${count}`);
        }

        // If old-school, show a snippet
        if (isOldSchool) {
            const commIdx = html.toLowerCase().indexOf('commentary');
            if (commIdx !== -1) {
                console.log(`\n*** OLD-SCHOOL SITE - Commentary snippet: ***`);
                console.log(html.substring(commIdx, commIdx + 300));
            }
        }

    } catch(e) {
        console.log(`FAILED: ${e.response?.status || e.message}`);
    }
}

// The match: India vs England 1st ODI 2025 (or any known match)
// We'll try multiple sites
async function runTests() {
    // Test 1: Cricmetric - known old-school stats site
    await testSite('Cricmetric', 'https://cricmetric.com/');
    
    // Test 2: Howstat - very old HTML site with full historical data
    await testSite('Howstat', 'http://www.howstat.com/cricket/Statistics/Matches/MatchScorecard.asp?MatchCode=4659');

    // Test 3: CricketArchive - old HTML site
    await testSite('CricketArchive', 'https://cricketarchive.com/');

    // Test 4: Cricsheet.org - open data
    await testSite('Cricsheet', 'https://cricsheet.org/');

    // Test 5: Sports-reference cricket
    await testSite('sports-reference', 'https://www.sports-reference.com/');
    
    // Test 6: LiveCricket.in - smaller Indian site
    await testSite('LiveCricket.in', 'https://www.livecricket.in/', ['commentary', 'ball', 'over']);
    
    // Test 7: Cricbuzz old API that was never shut down
    await testSite('Cricbuzz Old API', 'https://cricbuzz.com/cricket-match/commentary/114175', ['commentaryList', 'commText']);
}

runTests();
