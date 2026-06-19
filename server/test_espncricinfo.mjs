import { connect } from 'puppeteer-real-browser';
import * as cheerio from 'cheerio';

const BASE_URL = 'https://www.espncricinfo.com';

async function fetchMatches() {
    console.log("Launching real browser to bypass Cloudflare...");
    let browserInstance = null;
    try {
        const { browser, page } = await connect({
            headless: false,
            args: [],
            turnstile: true
        });
        browserInstance = browser;
        
        console.log("Fetching Live Cricket Scores Page...");
        await page.goto(`${BASE_URL}/live-cricket-score`, { waitUntil: 'networkidle2', timeout: 45000 });
        
        // Wait a bit to ensure Cloudflare challenge passes if any
        await new Promise(r => setTimeout(r, 2000));
        
        const html = await page.content();
        const $ = cheerio.load(html);
        
        const nextDataScript = $('#__NEXT_DATA__').html();
        if (!nextDataScript) {
            console.log("Could not find __NEXT_DATA__ script tag on the page.");
            return;
        }
        
        const nextData = JSON.parse(nextDataScript);
        
        // The data structure can vary but typically matches are in props.pageProps.data or similar
        // Let's explore the structure
        const liveMatchesData = nextData.props?.appPageProps?.data?.content?.matches || nextData.props?.pageProps?.data?.matches || [];
        
        console.log(`Found ${liveMatchesData.length} matches in the initial payload.`);
        
        if (liveMatchesData.length > 0) {
            const testMatch = liveMatchesData[0];
            console.log(`\nSample Match from payload: ${testMatch.title} - Status: ${testMatch.state}`);
            
            // To get detailed scorecard, commentary, etc., we navigate to the match page
            const pathStr = testMatch.url || testMatch.slug;
            const matchUrl = `${BASE_URL}${pathStr.startsWith('/') ? '' : '/series/'}${pathStr}`;
            console.log(`\nNavigating to Match Page: ${matchUrl}`);
            console.log(`Test Match Object Keys:`, Object.keys(testMatch));
            
            await page.goto(matchUrl, { waitUntil: 'networkidle2', timeout: 45000 });
            await new Promise(r => setTimeout(r, 2000));
            
            const matchHtml = await page.content();
            const $match = cheerio.load(matchHtml);
            const matchNextDataScript = $match('#__NEXT_DATA__').html();
            
            if (matchNextDataScript) {
                const matchNextData = JSON.parse(matchNextDataScript);
                const matchProps = matchNextData.props?.appPageProps?.data || matchNextData.props?.pageProps?.data || {};
                
                console.log("\n--- Extracted Data from Match Page ---");
                console.log("MatchProps Keys:", Object.keys(matchProps));
                if (matchProps.content) {
                    console.log("MatchProps.content Keys:", Object.keys(matchProps.content));
                }
                if (matchProps.match) {
                    console.log("Match Info Title:", matchProps.match?.title);
                }
                
                // Let's dump a small snippet of the matchProps to see what's inside
                const dump = JSON.stringify(matchProps).substring(0, 500);
                console.log("Snippet:", dump);
                
                // If we specifically want the Squads, we can check the URL for squads
                const squadUrl = matchUrl.replace(/((live-cricket-score)|(full-scorecard)|(match-report))/, 'match-playing-xi');
                console.log(`\nNavigating to Squad Page: ${squadUrl}`);
                try {
                    await page.goto(squadUrl, { waitUntil: 'networkidle2', timeout: 45000 });
                    await new Promise(r => setTimeout(r, 2000));
                    const squadHtml = await page.content();
                    const $squad = cheerio.load(squadHtml);
                    const squadNextDataScript = $squad('#__NEXT_DATA__').html();
                    if (squadNextDataScript) {
                        const squadNextData = JSON.parse(squadNextDataScript);
                        const squadProps = squadNextData.props?.appPageProps?.data || squadNextData.props?.pageProps?.data || {};
                        console.log("Squads Found:", squadProps.squads?.length || 0);
                    }
                } catch (e) {
                    console.log("Could not fetch squads:", e.message);
                }
            } else {
                console.log("Could not find __NEXT_DATA__ on match page.");
            }
        } else {
            console.log("No matches found in the payload. The structure might have changed.");
            console.log("Keys in props:", Object.keys(nextData.props || {}));
            if (nextData.props?.appPageProps) {
                console.log("Keys in appPageProps:", Object.keys(nextData.props.appPageProps));
            }
        }
        
    } catch (e) {
        console.error("Error:", e.message);
    } finally {
        if (browserInstance) {
            await browserInstance.close();
        }
    }
}

fetchMatches();
