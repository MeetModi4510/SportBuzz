import fs from 'fs';

/**
 * Scrapes FotMob for a specific player's data including:
 * 1. Initial page data (extracted via __NEXT_DATA__ web scraping)
 * 2. Dropdown tournament options
 * 3. Specific tournament data fetching (e.g. World Cup 26) with Total / Per 90 stats
 */
async function scrapeFotmobPlayer(playerId, playerSlug) {
    console.log(`[Scraper] Starting scrape for player ${playerId} (${playerSlug})...`);
    
    const headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5'
    };

    // 1. Web scrape the main player page
    const pageUrl = `https://www.fotmob.com/players/${playerId}/${playerSlug}`;
    console.log(`[Scraper] Fetching main page: ${pageUrl}`);
    const res = await fetch(pageUrl, { headers });
    
    if (!res.ok) {
        throw new Error(`Failed to fetch page, status: ${res.status}`);
    }

    const html = await res.text();
    
    // 2. Extract the Next.js hydration data from the HTML
    const nextDataMatch = html.match(/<script id="__NEXT_DATA__" type="application\/json">(.+?)<\/script>/);
    if (!nextDataMatch) {
        throw new Error("Could not find __NEXT_DATA__ in the HTML. The page structure might have changed.");
    }

    const nextData = JSON.parse(nextDataMatch[1]);
    const props = nextData.props.pageProps;
    
    // Different Next.js pages might have the data under 'fallback' or 'data'
    const playerDataKey = `player:${playerId}`;
    const playerData = (props.fallback && props.fallback[playerDataKey]) || props.data;

    if (!playerData) {
        throw new Error("Player data not found in the Next.js payload.");
    }

    console.log(`[Scraper] Successfully extracted data for ${playerData.name}`);

    // 3. Extract the dropdown data (Tournaments / Seasons)
    const dropdownOptions = [];
    if (playerData.statSeasons) {
        for (const season of playerData.statSeasons) {
            for (const tournament of season.tournaments) {
                dropdownOptions.push({
                    seasonName: season.seasonName,
                    tournamentName: tournament.name,
                    tournamentId: tournament.tournamentId,
                    entryId: tournament.entryId,
                    hasDeepStats: tournament.hasDeepStats
                });
            }
        }
    }
    
    console.log(`[Scraper] Found ${dropdownOptions.length} dropdown options.`);
    
    // Example: Let's find "World Cup" for season "2026"
    const worldCupOption = dropdownOptions.find(opt => opt.tournamentName === 'World Cup');
    
    if (worldCupOption) {
        console.log(`[Scraper] Found World Cup Option! Entry ID: ${worldCupOption.entryId}. Fetching stats...`);
        
        // 4. Fetch the selected tournament data via Fotmob's internal data API
        const statsUrl = `https://www.fotmob.com/api/data/playerStats?playerId=${playerId}&seasonId=${worldCupOption.entryId}&isFirstSeason=false`;
        
        const statsRes = await fetch(statsUrl, { headers });
        if (!statsRes.ok) {
            throw new Error(`Failed to fetch stats, status: ${statsRes.status}`);
        }
        
        const statsData = await statsRes.json();
        
        // 5. Output the Images full data (Shotmap & Heatmap)
        console.log('\n--- IMAGES / VISUAL DATA ---');
        console.log(`Total Shots in Shotmap: ${statsData.shotmap ? statsData.shotmap.length : 0}`);
        if (statsData.shotmap && statsData.shotmap.length > 0) {
            const firstShot = statsData.shotmap[0];
            console.log(`Example Shot: Min ${firstShot.min}', ${firstShot.eventType} by ${firstShot.shotType} (${firstShot.situation}). xG: ${firstShot.expectedGoals}`);
        }
        
        // 6. Output Season Performance (Total & Per 90)
        console.log('\n--- SEASON PERFORMANCE (TOTAL & PER 90) ---');
        if (statsData.statsSection && statsData.statsSection.items) {
            for (const group of statsData.statsSection.items) {
                console.log(`\n# ${group.title}`);
                for (const stat of group.items) {
                    // Formatting to match the requested output style
                    console.log(`${stat.title.padEnd(25)} | Total: ${stat.statValue.toString().padEnd(6)} | Per 90: ${stat.per90 ? stat.per90.toFixed(2) : 'N/A'}`);
                }
            }
        } else {
            console.log("No deep stats found for this tournament.");
        }
        
        // Save to file for user inspection
        const output = {
            player: playerData.name,
            dropdownOptions,
            worldCupStats: statsData
        };
        fs.writeFileSync('fotmob_messi_output.json', JSON.stringify(output, null, 2));
        console.log(`\n[Scraper] Full extracted data saved to fotmob_messi_output.json`);
    } else {
        console.log(`[Scraper] World Cup option not found in dropdowns.`);
    }
}

// Run for Lionel Messi (ID: 30981)
scrapeFotmobPlayer(30981, 'lionel-messi').catch(console.error);
