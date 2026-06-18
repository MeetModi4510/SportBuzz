const fs = require('fs');
const file = 'services/cricbuzzScraperService.js';
let content = fs.readFileSync(file, 'utf8');

const startIdx = content.indexOf('const scrapeFullCommentary = async');
const endIdx = content.indexOf('// ── Match Details API ──');

if (startIdx !== -1 && endIdx !== -1) {
    const newFunc = `const scrapeFullCommentary = async (matchId, slug) => {
    const cacheKey = \`cb_fullcomm_\${matchId}\`;
    if (commentaryCache.has(cacheKey)) {
        console.log(\`[Commentary Scraper] Returning cached commentary for \${matchId}\`);
        return commentaryCache.get(cacheKey);
    }

    if (!slug) {
        try {
            const live = liveCache.get('scraped_live_matches') || [];
            const m = live.find(x => String(x.id) === String(matchId));
            if (m) {
                const t1 = (m.teamInfo?.[0]?.shortname || '').toLowerCase();
                const t2 = (m.teamInfo?.[1]?.shortname || '').toLowerCase();
                const type = (m.matchType || '').toLowerCase();
                if (t1 && t2 && type) slug = \`\${t1}-vs-\${t2}-\${type}\`.replace(/[^a-z0-9-]/g, '');
            }
        } catch (_) {}
        if (!slug) slug = 'match';
    }

    const liveUrl = \`https://www.cricbuzz.com/live-cricket-scores/\${matchId}/\${slug}\`;
    console.log(\`[Commentary Scraper] Fetching: \${liveUrl}\`);

    try {
        const axios = require('axios');
        const res = await axios.get(liveUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,*/*',
                'Accept-Language': 'en-US,en;q=0.9',
                'Referer': 'https://www.cricbuzz.com/'
            },
            timeout: 15000
        });

        const html = typeof res.data === 'string' ? res.data : JSON.stringify(res.data);
        const cheerio = require('cheerio');
        const $ = cheerio.load(html);
        
        const commentaryList = [];

        $('div.font-bold').each((i, el) => {
            const text = $(el).text().trim();
            if (/^\\d+\\.\\d+$/.test(text)) {
                const parts = text.split('.');
                const overNum = parts[0];
                const ballNbr = parts[1];
                
                const parentCol = $(el).parent();
                const commentaryNode = parentCol.next();
                let commText = commentaryNode.text().trim();
                
                const isWicket = commText.includes('OUT') || commText.includes('Wicket') || commText.includes('bowled') || $(el).parent().find('span').text().includes('W');
                const isFour = commText.includes('FOUR') || $(el).parent().find('span').text().includes('4');
                const isSix = commText.includes('SIX') || $(el).parent().find('span').text().includes('6');
                
                commentaryList.push({
                    inningsId: 0,
                    overNum: parseInt(overNum),
                    ballNbr: parseInt(ballNbr),
                    event: isWicket ? 'WICKET' : isSix ? 'SIX' : isFour ? 'FOUR' : 'NONE',
                    commText: commText,
                    timestamp: Date.now() - (i * 1000)
                });
            }
        });
        
        // Check if there are preview updates (Toss, Squads)
        let previewItems = [];
        const markerIdx = html.indexOf('matchPreviewFullComm');
        if (markerIdx !== -1) {
            const scriptStart = html.lastIndexOf('self.__next_f.push', markerIdx);
            if (scriptStart !== -1) {
                const scriptClose = html.indexOf('</script>', scriptStart);
                const rawScript = html.substring(scriptStart, scriptClose === -1 ? html.length : scriptClose);
                const payloadMatch = rawScript.match(/self\\.__next_f\\.push\\(\\[1,"([\\s\\S]+?)"\\]\\)/);
                
                if (payloadMatch) {
                    let unescaped;
                    try {
                        unescaped = JSON.parse('"' + payloadMatch[1] + '"');
                    } catch (_) {
                        unescaped = payloadMatch[1].replace(/\\\\"/g, '"').replace(/\\\\\\\\/g, '\\\\');
                    }
                    
                    const mpIdx = unescaped.indexOf('"matchPreviewFullComm":{');
                    if (mpIdx !== -1) {
                        const objStart = mpIdx + '"matchPreviewFullComm":'.length;
                        let braces = 0, objEnd = objStart;
                        for (let i = objStart; i < unescaped.length; i++) {
                            if (unescaped[i] === '{') braces++;
                            else if (unescaped[i] === '}') braces--;
                            if (braces === 0 && i > objStart) { objEnd = i + 1; break; }
                        }
                        try {
                            const mpObj = JSON.parse(unescaped.substring(objStart, objEnd));
                            if (mpObj.commentary && mpObj.commentary[0]?.commentaryList) {
                                previewItems = mpObj.commentary[0].commentaryList.map(item => {
                                    let text = item.commText || '';
                                    if (text.startsWith('$')) {
                                        const refId = text.substring(1);
                                        const possibleText = unescaped.match(new RegExp(\`"\${refId}":"([^"]+)"\`));
                                        if (possibleText) text = possibleText[1];
                                    }
                                    if (!text && item.commentaryFormats?.bold?.formatValue) {
                                        text = item.commentaryFormats.bold.formatValue.join(' ');
                                    }
                                    return {
                                        inningsId: 0,
                                        overNum: item.overNum || 0,
                                        ballNbr: item.ballNbr || 0,
                                        event: item.event || 'NONE',
                                        commText: text,
                                        timestamp: item.timestamp || Date.now()
                                    };
                                }).filter(c => c.commText && c.commText.length > 2);
                            }
                        } catch(e) {}
                    }
                }
            }
        }

        const combinedList = [...commentaryList, ...previewItems];
        
        const result = {
            matchId: parseInt(matchId),
            totalPages: 1,
            inningsCount: 1,
            commentary: combinedList
        };

        if (result.commentary.length > 0) {
            commentaryCache.set(cacheKey, result, 60);
            return result;
        }

        return null;
    } catch (err) {
        console.error('[Commentary Scraper] Error:', err.message);
        return null;
    }
};

`;
    const newContent = content.substring(0, startIdx) + newFunc + content.substring(endIdx);
    fs.writeFileSync(file, newContent);
    console.log('Successfully replaced scrapeFullCommentary');
} else {
    console.error('Failed to find start or end index');
}
