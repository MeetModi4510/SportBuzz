/**
 * cricbuzzScorecardScraper.js
 *
 * Scrapes the full scorecard from Cricbuzz's /live-cricket-scorecard/{id}/{slug} page.
 * Uses Cheerio to parse the server-side rendered HTML — no JS execution needed.
 *
 * URL pattern: https://www.cricbuzz.com/live-cricket-scorecard/{matchId}/{slug}
 * e.g. /live-cricket-scorecard/129563/eng-vs-nz-2nd-test-new-zealand-tour-of-england-2026
 */

import axios from 'axios';
import * as cheerio from 'cheerio';
import NodeCache from 'node-cache';

// Cache: 60s for live, 10min for completed
const scorecardCache = new NodeCache({ stdTTL: 600 });

const BROWSER_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.5',
    'Accept-Encoding': 'gzip, deflate, br',
    'Connection': 'keep-alive',
    'Upgrade-Insecure-Requests': '1',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'none',
    'Cache-Control': 'max-age=0',
};

/**
 * Builds the scorecard slug from a match name if not supplied.
 * e.g. "England vs New Zealand 2nd Test" → "eng-vs-nz-2nd-test"
 */
function buildSlugFromName(name = '') {
    return name
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '') || 'match';
}

/**
 * Fetches the scorecard slug by looking it up from the Cricbuzz live/recent/upcoming
 * match lists (which contain the full URL slug in the href).
 */
async function resolveSlug(matchId) {
    const sources = [
        'https://www.cricbuzz.com/cricket-match/live-scores',
        'https://www.cricbuzz.com/cricket-match/live-scores/recent-matches',
        'https://www.cricbuzz.com/cricket-match/live-scores/upcoming-matches',
    ];

    for (const url of sources) {
        try {
            const res = await axios.get(url, { headers: BROWSER_HEADERS, timeout: 8000 });
            const $ = cheerio.load(res.data);
            let found = null;

            // Look for any anchor that contains our matchId in its href
            $('a[href]').each((_, el) => {
                const href = $(el).attr('href') || '';
                // Match both scorecard and live-scores URLs for the same match
                const patterns = [
                    new RegExp(`/live-cricket-scorecard/${matchId}/([^"\\s]+)`),
                    new RegExp(`/live-cricket-scores/${matchId}/([^"\\s]+)`),
                    new RegExp(`/cricket-match-facts/${matchId}/([^"\\s]+)`),
                ];
                for (const pat of patterns) {
                    const m = href.match(pat);
                    if (m) {
                        // Strip the part after the slug (e.g. /venues/...) 
                        found = m[1].split('/')[0];
                        return false; // break cheerio each
                    }
                }
            });

            if (found) {
                console.log(`[ScorecardScraper] Resolved slug for ${matchId}: ${found}`);
                return found;
            }
        } catch (e) {
            // Try next source
        }
    }
    return null;
}

/**
 * Parses a batting scorecard section from the HTML.
 * Returns an array of batsman objects.
 */
function parseBatting($, container) {
    const batsmen = [];
    
    // Each batter row is a grid div inside the innings section
    container.find('.grid.scorecard-bat-grid, .grid.scorecard-bat-grid-web').each((_, row) => {
        const cells = $(row).children('div, a');
        if (cells.length < 6) return; // skip header row

        // First cell: player name + dismissal
        const firstCell = $(cells[0]);
        const nameEl = firstCell.find('a');
        if (!nameEl.length) return; // this is the header row (Batter, R, B, 4s ...)

        const rawName = nameEl.text().trim();
        if (!rawName || rawName === 'Batter') return;

        // Extract player Cricbuzz ID from profile link
        const profileHref = nameEl.attr('href') || '';
        const idMatch = profileHref.match(/\/profiles\/(\d+)\//);
        const cricbuzzPlayerId = idMatch ? idMatch[1] : null;

        // Captain / Keeper markers
        const isCaptain = rawName.includes('(c)');
        const isKeeper = rawName.includes('(wk)');
        const name = rawName.replace(/\s*\(c\)\s*/g, '').replace(/\s*\(wk\)\s*/g, '').trim();

        // Dismissal text is in a sibling div inside the first cell
        const dismissalDiv = firstCell.find('div');
        const dismissal = dismissalDiv.text().trim() || 'batting';

        // Remaining cells: R, B, 4s, 6s, SR (some cells might be <a> tags for highlights)
        const dataValues = [];
        cells.each((idx, cell) => {
            if (idx === 0) return; // skip name cell
            const cellText = $(cell).text().trim();
            // Skip highlight icon cell (last one)
            if ($(cell).is('a') && $(cell).attr('href')?.includes('highlights')) return;
            dataValues.push(cellText);
        });

        batsmen.push({
            name,
            isCaptain,
            isKeeper,
            cricbuzzPlayerId,
            faceImageId: cricbuzzPlayerId, // Same ID used for player images
            dismissal,
            runs: parseInt(dataValues[0]) || 0,
            balls: parseInt(dataValues[1]) || 0,
            fours: parseInt(dataValues[2]) || 0,
            sixes: parseInt(dataValues[3]) || 0,
            strikeRate: parseFloat(dataValues[4]) || 0,
        });
    });

    return batsmen;
}

/**
 * Parses a bowling scorecard section from the HTML.
 */
function parseBowling($, container) {
    const bowlers = [];

    // Bowling rows: .grid.scorecard-bowl-grid
    // First child is an <a> (bowler profile link) directly — no wrapper div
    container.find('.grid.scorecard-bowl-grid, .grid.scorecard-bowl-grid-web').each((_, row) => {
        const $row = $(row);
        // Skip header row (first child is a div with "Bowler" text, not an <a>)
        const firstChild = $row.children().first();
        if (firstChild.is('div')) return; // header row

        const nameEl = firstChild.is('a') ? firstChild : $row.find('a').first();
        if (!nameEl.length) return;

        const rawName = nameEl.text().trim();
        if (!rawName || rawName === 'Bowler') return;

        const isCaptain = rawName.includes('(c)');
        const isKeeper = rawName.includes('(wk)');
        const name = rawName.replace(/\s*\(c\)\s*/g, '').replace(/\s*\(wk\)\s*/g, '').trim();

        const profileHref = nameEl.attr('href') || '';
        const idMatch = profileHref.match(/\/profiles\/(\d+)\//);
        const cricbuzzPlayerId = idMatch ? idMatch[1] : null;

        // Remaining cells: all direct children except the name link and the highlights icon <a>
        const dataValues = [];
        $row.children().each((idx, cell) => {
            if (idx === 0) return; // skip name cell
            const $cell = $(cell);
            // Skip highlight icon cell (last <a> with /bowling in href)
            if ($cell.is('a') && ($cell.attr('href') || '').includes('/bowling')) return;
            dataValues.push($cell.text().trim());
        });

        // dataValues: [O, M, R, W, NB (hidden), WD (hidden), ECO]
        // Note: NB and WD may have different positions depending on viewport CSS (they're always in DOM)
        bowlers.push({
            name,
            isCaptain,
            isKeeper,
            cricbuzzPlayerId,
            faceImageId: cricbuzzPlayerId,
            overs: dataValues[0] || '0',
            maidens: parseInt(dataValues[1]) || 0,
            runs: parseInt(dataValues[2]) || 0,
            wickets: parseInt(dataValues[3]) || 0,
            noBalls: parseInt(dataValues[4]) || 0,
            wides: parseInt(dataValues[5]) || 0,
            economy: parseFloat(dataValues[6]) || 0,
        });
    });

    return bowlers;
}

/**
 * Main function: scrapes the Cricbuzz scorecard page for a given matchId.
 * The slug is resolved automatically.
 *
 * @param {string|number} matchId - The Cricbuzz numeric match ID
 * @param {string} [slug] - Optional URL slug (e.g. "eng-vs-nz-2nd-test-..."). 
 *                          If omitted, will be auto-resolved.
 * @returns {Promise<object>} Scorecard data with innings array
 */
export async function scrapeScorecard(matchId, slug = null, force = false) {
    const cacheKey = `scorecard_html_${matchId}`;
    if (!force) {
        const cached = scorecardCache.get(cacheKey);
        if (cached) {
            console.log(`[ScorecardScraper] Cache hit for match ${matchId}`);
            return cached;
        }
    } else {
        console.log(`[ScorecardScraper] Force-bypass cache for match ${matchId}`);
    }

    // Resolve slug if not provided
    let resolvedSlug = slug;
    if (!resolvedSlug) {
        resolvedSlug = await resolveSlug(matchId);
    }
    if (!resolvedSlug) {
        resolvedSlug = 'match'; // fallback — Cricbuzz often accepts this
    }

    const timestamp = Date.now();
    const url = `https://www.cricbuzz.com/live-cricket-scorecard/${matchId}/${resolvedSlug}?_t=${timestamp}`;
    console.log(`[ScorecardScraper] Fetching: ${url}`);

    let html;
    try {
        const res = await axios.get(url, {
            headers: BROWSER_HEADERS,
            timeout: 12000,
        });
        html = typeof res.data === 'string' ? res.data : JSON.stringify(res.data);
    } catch (e) {
        // Try with "match" slug as fallback
        if (resolvedSlug !== 'match') {
            console.warn(`[ScorecardScraper] Failed with slug "${resolvedSlug}", retrying with "match"`);
            try {
                const fallbackUrl = `https://www.cricbuzz.com/live-cricket-scorecard/${matchId}/match?_t=${timestamp}`;
                const res = await axios.get(fallbackUrl, { headers: BROWSER_HEADERS, timeout: 12000 });
                html = typeof res.data === 'string' ? res.data : JSON.stringify(res.data);
            } catch (e2) {
                console.error(`[ScorecardScraper] Both URLs failed for match ${matchId}:`, e2.message);
                return null;
            }
        } else {
            console.error(`[ScorecardScraper] Fetch failed for match ${matchId}:`, e.message);
            return null;
        }
    }

    const $ = cheerio.load(html);
    const innings = [];

    // Match status text (e.g. "Day 1: Stumps - England opt to bowl")
    let matchStatus = '';
    const statusEl = $('.text-cbLive').first();
    if (statusEl.length) matchStatus = statusEl.text().trim();

    // Match title (e.g. "England vs New Zealand, 2nd Test, ...")
    let matchTitle = '';
    const titleEl = $('h1').first();
    if (titleEl.length) matchTitle = titleEl.text().trim().replace(/\s*-\s*Scorecard\s*/i, '').trim();

    // Each innings has a header with id="team-{teamId}-innings-{n}"
    // and scorecard content with id="scard-team-{teamId}-innings-{n}"
    $('[id^="team-"][id*="-innings-"]').each((_, headerEl) => {
        const headerId = $(headerEl).attr('id') || '';
        // id pattern: team-{teamId}-innings-{n}
        const match = headerId.match(/^team-(\d+)-innings-(\d+)$/);
        if (!match) return;

        const [, teamId, inningsNum] = match;

        // Get innings header text and score
        const headerText = $(headerEl);
        // Team name — prefer the "hidden tb:block" (full name) if available
        const fullNameEl = headerText.find('.hidden.tb\\:block, .hidden.tb\\:flex').first();
        const shortNameEl = headerText.find('.tb\\:hidden, .mb\\:hidden, .hidden').first();
        const teamName = (fullNameEl.length ? fullNameEl.text() : headerText.find('div').first().text()).trim();

        // Score string like "291-7"
        const scoreText = headerText.find('.font-bold').last().text().trim();
        const overs = headerText.find('span:not(.font-bold)').text().trim().replace(/[()]/g, '').trim();

        const scoreMatch = scoreText.match(/^(\d+)-(\d+)$/);
        const runs = scoreMatch ? parseInt(scoreMatch[1]) : 0;
        const wickets = scoreMatch ? parseInt(scoreMatch[2]) : 0;

        // Find the corresponding scorecard content div
        const scorecardDiv = $(`#scard-team-${teamId}-innings-${inningsNum}`);
        if (!scorecardDiv.length) return;

        // Parse batting
        const batsmen = parseBatting($, scorecardDiv);

        // Extras and Total
        let extras = { total: 0, byes: 0, legbyes: 0, wides: 0, noballs: 0, penalty: 0 };
        let totalStr = '';
        let runRate = '';
        scorecardDiv.find('div.flex.justify-between').each((_, row) => {
            const label = $(row).find('div.font-bold').first().text().trim();
            if (label === 'Extras') {
                const extrasText = $(row).text().replace('Extras', '').trim(); // e.g. "13 (b 0, lb 4, w 8, nb 1, p 0)"
                extras.total = parseInt(extrasText.match(/^(\d+)/)?.[1]) || 0;
                extras.byes = parseInt(extrasText.match(/b\s+(\d+)/)?.[1]) || 0;
                extras.legbyes = parseInt(extrasText.match(/lb\s+(\d+)/)?.[1]) || 0;
                extras.wides = parseInt(extrasText.match(/w\s+(\d+)/)?.[1]) || 0;
                extras.noballs = parseInt(extrasText.match(/nb\s+(\d+)/)?.[1]) || 0;
                extras.penalty = parseInt(extrasText.match(/p\s+(\d+)/)?.[1]) || 0;
            } else if (label === 'Total') {
                totalStr = $(row).find('.font-bold').last().text().trim();
                runRate = $(row).text().match(/RR:\s*([\d.]+)/)?.[1] || '';
            }
        });

        // Yet to bat — capture name + profile ID for image loading
        let yetToBat = [];
        scorecardDiv.find('div').each((_, el) => {
            const text = $(el).children('div.font-bold').first().text().trim();
            if (text === 'Yet to Bat') {
                // The next sibling div contains the player links
                $(el).find('a[href]').each((_, a) => {
                    const playerName = $(a).text().trim().replace(/,\s*$/, '').trim();
                    const href = $(a).attr('href') || '';
                    const idMatch = href.match(/\/profiles\/(\d+)\//);
                    const cricbuzzPlayerId = idMatch ? idMatch[1] : null;
                    if (playerName) {
                        yetToBat.push({
                            name: playerName,
                            cricbuzzPlayerId,
                            faceImageId: cricbuzzPlayerId,
                        });
                    }
                });
            }
        });

        // Parse bowling (bowling section follows batting in the scorecard div)
        const bowlers = parseBowling($, scorecardDiv);

        // Fall of wickets
        let fallOfWickets = [];
        const fowGrids = scorecardDiv.find('.scorecard-fow-grid, .scorecard-fow-grid-web');
        if (fowGrids.length > 0) {
            fowGrids.each((_, row) => {
                const $row = $(row);
                const firstChild = $row.children().first();
                if (firstChild.text().trim() === 'Fall of Wickets') return; // skip header

                const nameEl = $row.find('a').first();
                if (!nameEl.length) return;

                const batsmanName = nameEl.text().trim();
                const cells = [];
                $row.children('div').each((_, cell) => cells.push($(cell).text().trim()));

                const scoreStr = cells[0] || '';
                const overStr = cells[1] || '0';
                if (scoreStr.includes('-')) {
                    // Returning old string format for backward compatibility
                    fallOfWickets.push(`${scoreStr} (${batsmanName}, ${overStr} ov)`);
                }
            });
        } else {
            scorecardDiv.find('div').each((_, el) => {
                const text = $(el).text().trim();
                if (text.startsWith('Fall of Wickets') || $(el).prev().text().trim() === 'Fall of Wickets') {
                    const fowText = $(el).text().replace('Fall of Wickets', '').trim();
                    if (fowText) {
                        fallOfWickets = fowText.split(/,\s*(?=\d+-)/).map(s => s.trim()).filter(Boolean);
                    }
                }
            });
        }

        innings.push({
            inningsNumber: parseInt(inningsNum),
            teamId,
            teamName: teamName || `Team ${teamId}`,
            score: runs,
            wickets,
            overs: overs.replace(/^\(|\)$/g, '').replace('Ov', '').trim(),
            runRate,
            isDeclared: scoreText.includes('d') || false,
            extras,
            batsmen,
            bowlers,
            yetToBat,
            fallOfWickets,
        });
    });

    if (innings.length === 0) {
        console.warn(`[ScorecardScraper] No innings found for match ${matchId} — page may require JS or match hasn't started`);
        return null;
    }

    const result = {
        matchId: String(matchId),
        slug: resolvedSlug,
        matchTitle,
        status: matchStatus,
        innings,
        scrapedAt: new Date().toISOString(),
    };

    // Cache: shorter TTL if match is live (status includes "Stumps", "Live", "Day")
    // 60s for live (frontend bypasses this via force on its 60s cycle), 600s for completed
    const isLive = /live|stumps|day \d|innings break/i.test(matchStatus);
    const liveTtl = 60; // 60s cache time
    scorecardCache.set(cacheKey, result, isLive ? liveTtl : 600);
    console.log(`[ScorecardScraper] Parsed ${innings.length} innings for match ${matchId} (TTL: ${isLive ? liveTtl : 600}s, force=${force})`);

    return result;
}

/**
 * Clears cached scorecard for a matchId (force refresh).
 */
export function clearScorecardCache(matchId) {
    scorecardCache.del(`scorecard_html_${matchId}`);
}
