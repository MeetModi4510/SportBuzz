import axios from 'axios';
import * as cheerio from 'cheerio';

/**
 * Searches NDTV Sports and HT for a match matching the given teams.
 * Extracts the 6-digit Match ID which is universally shared across their CDNs.
 */
async function findHTMatchId(teamA, teamB, matchDate, matchFormat) {
    console.log(`\n🔍 Searching HT for: ${teamA} vs ${teamB} (Date: ${matchDate}, Format: ${matchFormat})`);

    // Generate multiple name variants for matching
    function getNameVariants(name) {
        const n = name.toLowerCase().replace(/under-?19/g, 'u19').replace(/women/g, 'w').replace(/[^a-z0-9]/g, '');
        const variants = [n];
        // Add first 3 chars (abbreviation)
        if (n.length >= 3) variants.push(n.substring(0, 3));
        // Common country abbreviations
        const abbrevMap = { 'india':'ind', 'australia':'aus', 'england':'eng', 'pakistan':'pak',
            'srilanka':'sl', 'southafrica':'sa', 'newzealand':'nz', 'bangladesh':'ban',
            'westindies':'wi', 'zimbabwe':'zim', 'afghanistan':'afg', 'ireland':'ire',
            'scotland':'sco', 'netherlands':'ned', 'unitedstates':'usa', 'namibia':'nam',
            'nepal':'nep', 'oman':'om', 'uae':'uae', 'kenya':'ken', 'canada':'can',
            'hongkong':'hk', 'malaysia':'mas', 'singapore':'sg', 'papua':'png' };
        if (abbrevMap[n]) variants.push(abbrevMap[n]);
        return variants;
    }

    const t1Variants = getNameVariants(teamA);
    const t2Variants = getNameVariants(teamB);

    const MONTH_NAMES = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'];
    let year = '', monthStr = '', day = '';
    if (matchDate) {
        let d = new Date(Number(matchDate));
        if (isNaN(d.getTime())) d = new Date(matchDate);
        if (!isNaN(d.getTime())) {
            year     = d.getFullYear().toString();
            monthStr = MONTH_NAMES[d.getMonth()];
            day      = d.getDate().toString();
        }
    }

    const cleanFormat = (matchFormat || '').toLowerCase().replace(/[^a-z0-9]/g, '');

    const urlsToScrape = [
        'https://www.hindustantimes.com/cricket/live-score',
        'https://www.hindustantimes.com/cricket/match-results',
        'https://www.hindustantimes.com/cricket/results',
        'https://sports.ndtv.com/cricket/live-scores',
        'https://sports.ndtv.com/cricket/results',
    ];

    const allCandidates = [];

    for (const url of urlsToScrape) {
        try {
            console.log(`Checking ${url}...`);
            const res = await axios.get(url, {
                headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
                responseType: 'arraybuffer',
                timeout: 10000
            });

            const $ = cheerio.load(new TextDecoder('utf-8').decode(res.data));

            $('a').each((i, el) => {
                const href = $(el).attr('href') || '';
                if (!href.includes('/cricket/')) return;
                if (!href.includes('-live-score') && !href.includes('live-scorecard') &&
                    !href.includes('match-result') && !href.includes('scorecard')) return;

                const idMatch = href.match(/(\d{6})$/);
                if (!idMatch) return;
                const id = idMatch[1];

                const hrefSlug = href.toLowerCase().replace(/under-?19/g, 'u19').replace(/women/g, 'w');

                // Check if any variant of t1 AND any variant of t2 appear in the slug
                const hasT1 = t1Variants.some(v => hrefSlug.includes(v));
                const hasT2 = t2Variants.some(v => hrefSlug.includes(v));
                if (!hasT1 || !hasT2) return;

                let score = 10;
                if (year && hrefSlug.includes(year)) score += 30;
                
                // HT slugs encode the match date as MMDDYYYY right before the 6-digit match ID.
                // e.g. slug suffix: 'npne07292026270956' → month=07, day=29, year=2026
                // Extract this and compare precisely with the target date.
                const slugDateMatch = hrefSlug.match(/(\d{2})(\d{2})(\d{4})(\d{6})$/);
                if (slugDateMatch) {
                    const slugMonth = parseInt(slugDateMatch[1]);  // 07
                    const slugDay   = parseInt(slugDateMatch[2]);  // 29
                    const slugYear  = parseInt(slugDateMatch[3]);  // 2026
                    const targetMonth = monthStr ? (MONTH_NAMES.indexOf(monthStr) + 1) : null;
                    const targetDay   = day ? parseInt(day) : null;
                    const targetYear  = year ? parseInt(year) : null;
                    
                    let dateScore = 0;
                    if (targetYear  && slugYear  === targetYear)  dateScore += 30;
                    if (targetMonth && slugMonth === targetMonth) dateScore += 20;
                    if (targetDay   && slugDay   === targetDay) {
                        dateScore += 60;  // decisive: correct day → correct match
                    } else if (targetDay) {
                        dateScore -= 40;  // heavy penalty: wrong day = definitely wrong match
                    }
                    score += dateScore;
                    console.log(`   Slug date: ${slugDay}/${slugMonth}/${slugYear}, target: ${targetDay}/${targetMonth && targetMonth}/${targetYear}, dateScore: ${dateScore}`);
                } else {
                    // Fallback text-based scoring for slugs without the MMDDYYYY pattern
                    if (monthStr && hrefSlug.includes(monthStr)) score += 20;
                    if (day) {
                        const dayPatterns = [`-${day}-`, `${day}${monthStr}`, `${monthStr}${day}`];
                        if (dayPatterns.some(p => hrefSlug.includes(p))) {
                            score += 60;
                        } else {
                            score -= 20;
                        }
                    }
                }
                
                if (cleanFormat && hrefSlug.includes(cleanFormat)) score += 15;

                allCandidates.push({ href, score, id });
            });

        } catch (e) {
            console.log(`❌ Failed to scrape ${url}: ${e.message}`);
        }
    }

    if (allCandidates.length > 0) {
        allCandidates.sort((a, b) => b.score - a.score);
        const best = allCandidates[0];
        console.log(`✅ Best candidate (score ${best.score}): ${best.href}`);
        console.log(`✅ Extracted Match ID: ${best.id}`);

        // CDN verification — use GET instead of HEAD (HEAD may return 403 on some CDNs)
        try {
            const verifyUrl = `https://www.hindustantimes.com/static-content/10s/commentary_${best.id}_1.json`;
            const vRes = await axios.get(verifyUrl, {
                headers: { 'User-Agent': 'Mozilla/5.0' },
                timeout: 6000,
                validateStatus: s => s < 500
            });
            if (vRes.status === 200) {
                console.log(`✅ CDN verified — commentary exists for ID ${best.id}`);
                return best.id;
            }
        } catch(ve) {
            console.log(`⚠️  CDN verify failed for ${best.id}: ${ve.message} — returning anyway.`);
            return best.id; // Return anyway — CDN is up, HEAD just may have been blocked
        }
    }

    console.log(`❌ No matching game found for ${teamA} vs ${teamB}.`);
    return null;
}

function mapHTCommentToStandard(htComment, playerMap = {}) {
    if (!htComment) return null;
    
    const overStr = htComment.Over_No ? `${htComment.Over_No}.${htComment.Ball}` : null;
    const runsStr = htComment.Runs || '0';
    
    // Some basic parsing for event formatting (W, 4, 6)
    let event = '';
    if (htComment.Iswicket === '1' || htComment.IsWicket === '1' || htComment.Shot_type_id === 'w' || htComment.Iswicket === true) {
        event = 'WICKET';
    } else if (runsStr === '4') {
        event = 'FOUR';
    } else if (runsStr === '6') {
        event = 'SIX';
    } else if (htComment.noball === '1') {
        event = 'NOBALL';
    } else if (htComment.wide === '1') {
        event = 'WIDE';
    }
    
    // MatchDetails.tsx uses overNum for grouping by over (0-indexed integer)
    let overNum = null;
    let ballNbr = null;
    if (htComment.Over_No) {
        overNum = Math.max(0, parseInt(htComment.Over_No, 10) - 1); // convert to 0-indexed over number
        ballNbr = htComment.Ball ? parseInt(htComment.Ball, 10) : 0;
    }

    // Extract rich Over Summary
    let overSummary = null;
    if (htComment.End_Over || htComment.Summary) {
        if (htComment.Summary) {
            overSummary = {
                score: htComment.Summary.Score || htComment.Score,
                over: htComment.Summary.Over || htComment.Over_No,
                runs: htComment.Summary.Runs || '0',
                wickets: htComment.Summary.Wickets || '0',
                batsmen: (htComment.Summary.Batsmen || []).map(b => ({
                    ...b,
                    Name: b.Name || b.Batsman_Name || playerMap[b.Batsman] || playerMap[b.Batsman_Id] || `Batter`
                })),
                bowlers: (htComment.Summary.Bowlers || []).map(b => ({
                    ...b,
                    Name: b.Name || b.Bowler_Name || playerMap[b.Bowler] || playerMap[b.Bowler_Id] || `Bowler`
                })),
                crr: htComment.Summary.Current_runrate || '',
                ballsThisOver: htComment.This_Over ? htComment.This_Over.split(',').filter(b => b) : []
            };
        } else if (htComment.Event === 'over-end') {
            event = 'OVER_BREAK';
        }
    }

    // Extract rich Wicket Details
    let wicketDetails = null;
    if (event === 'WICKET') {
        wicketDetails = {
            batsmanName: htComment.Batsman_Name || '',
            howOut: htComment.Howout || htComment.Detail || '',
            batsmanRuns: htComment.Batsman_Details?.Runs || '0',
            batsmanBalls: htComment.Batsman_Details?.Balls || '0',
            batsmanFours: htComment.Batsman_Details?.Fours || '0',
            batsmanSixes: htComment.Batsman_Details?.Sixes || '0'
        };
    }

    let commText = htComment.Commentary || htComment.text || '';
    if (htComment.Isball || htComment.Iswicket === '1' || htComment.Iswicket === true || htComment.Batsman_Name) {
        const bowlerName = htComment.Bowler_Name || htComment.Bowler_Short_Name || 'Bowler';
        const batsmanName = htComment.Batsman_Name || htComment.Batsman_Short_Name || 'Batter';
        if (bowlerName !== 'Bowler' && batsmanName !== 'Batter') {
            // Capitalize the first letter of the original commentary if needed
            if (commText) {
                commText = commText.charAt(0).toUpperCase() + commText.slice(1);
            } else {
                // If there's no custom commentary, use the default ending from Default_Commentary or construct one
                if (htComment.Default_Commentary) {
                    const fallbackMatch = htComment.Default_Commentary.match(/,\s*(.*)$/);
                    if (fallbackMatch) {
                        commText = fallbackMatch[1];
                    }
                }
                if (!commText) {
                    if (event === 'WICKET') commText = 'OUT!';
                    else if (runsStr === '0') commText = 'no run';
                    else if (runsStr === '1') commText = '1 run';
                    else commText = `${runsStr} runs`;
                }
            }
            commText = `${bowlerName} to ${batsmanName}, ${commText}`;
        } else if (htComment.Default_Commentary) {
            const match = htComment.Default_Commentary.match(/^\d+\.\d+:\s*(.*)$/);
            if (match) commText = match[1];
        }
    }

    const innId = htComment.inning || htComment.Inning_No;
    return {
        timestamp: htComment.commentaryTimestamp || Date.now(),
        over: overStr,
        overNum: overNum,
        ballNbr: ballNbr,
        commText: commText,
        batsmanRuns: runsStr,
        event: event,
        inningsId: innId ? parseInt(innId, 10) : 1,
        overSummary: overSummary,
        wicketDetails: wicketDetails,
        thisOver: htComment.This_Over || ''
    };
}

/**
 * Fetches the full commentary JSON from HT CDN using the HT Match ID.
 */
export async function getFullCommentaryFromHT(teamA, teamB, matchDate, matchFormat) {
    if (!teamA || !teamB) {
        throw new Error("Team names required for HT Search.");
    }
    
    const htMatchId = await findHTMatchId(teamA, teamB, matchDate, matchFormat);
    
    if (!htMatchId) {
        return null; // Signals 404 to frontend
    }
    
    console.log(`\n🚀 Fetching Full Commentary from CDN for ID: ${htMatchId}...`);
    
    let allCommentaryRaw = [];
    
    // We try fetching innings 1, 2, 3, 4 (Test matches can have 4 innings)
    for (let inning = 1; inning <= 4; inning++) {
        const cdnUrl = `https://www.hindustantimes.com/static-content/10s/commentary_${htMatchId}_${inning}.json`;
        try {
            const res = await axios.get(cdnUrl, {
                headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
                timeout: 8000
            });
            
            if (res.data && res.data.commentary) {
                console.log(`  -> Innings ${inning}: Found ${res.data.commentary.length} balls.`);
                allCommentaryRaw = [...allCommentaryRaw, ...res.data.commentary];
            } else if (Array.isArray(res.data)) {
                 allCommentaryRaw = [...allCommentaryRaw, ...res.data];
            }
        } catch (e) {
            if (e.response && (e.response.status === 404 || e.response.status === 403)) {
                // 404 means the inning hasn't happened yet or doesn't exist
                console.log(`  -> Innings ${inning}: 404 Not Found (End of available innings)`);
                break; // Stop at first 404, we have all innings
            }
        }
    }
    
    console.log(`🎉 Total HT Commentary Balls Fetched: ${allCommentaryRaw.length}`);
    
    if (allCommentaryRaw.length === 0) return null;
    
    // Build a player dictionary from the ball-by-ball data to resolve IDs in the Over Summary
    const playerMap = {};
    allCommentaryRaw.forEach(c => {
        if (c.Batsman && c.Batsman_Name) playerMap[c.Batsman] = c.Batsman_Name;
        if (c.Bowler && c.Bowler_Name) playerMap[c.Bowler] = c.Bowler_Name;
    });
    
    // Map to standard format expected by MatchDetails.tsx
    // The raw array is often sorted newest-first or oldest-first depending on inning
    // HT generally puts them in some order. We will map them.
    const mappedCommentary = allCommentaryRaw
        .map(c => mapHTCommentToStandard(c, playerMap))
        .filter(c => c && (c.commText || c.event === 'OVER_BREAK'))
        .sort((a, b) => b.timestamp - a.timestamp); // Sort descending (newest first)
        
    return mappedCommentary;
}
