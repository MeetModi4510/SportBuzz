import puppeteer from 'puppeteer';

async function fetchFotmobRumors() {
    try {
        console.log('[Fotmob Scraper] Launching Puppeteer for popular transfers (rumors)...');
        const browser = await puppeteer.launch({ headless: 'new' });
        const page = await browser.newPage();
        
        await page.setViewport({ width: 1280, height: 800 });

        console.log('[Fotmob Scraper] Navigating to fotmob.com/transfers...');
        await page.goto('https://www.fotmob.com/transfers', { waitUntil: 'networkidle0', timeout: 60000 });
        
        // Wait for rows to render
        await page.waitForSelector('a[href*="/players/"]', { timeout: 10000 });

        const transfers = await page.evaluate(() => {
            const data = [];
            
            // We want to process desktop rows or mobile rows. Let's just find the player links, 
            // then traverse up to get the full row context.
            const playerLinks = Array.from(document.querySelectorAll('a[href*="/players/"]'));
            
            playerLinks.forEach((playerLink) => {
                const href = playerLink.getAttribute('href');
                const match = href.match(/\/players\/(\d+)/);
                if (!match) return;
                
                const playerId = match[1];
                
                // Traverse up to find the row container
                let row = playerLink.parentElement;
                while (row && row.childElementCount < 3 && !row.className.includes('desktopWidth:grid') && !row.className.includes('flex-col')) {
                    row = row.parentElement;
                }
                
                if (!row) return;

                // Extract player name and position from playerLink
                const spans = Array.from(playerLink.querySelectorAll('span'));
                let name = '';
                let position = { label: '', key: '' };
                
                // Usually the first line-clamp span has the name and the position chip
                const nameContainer = playerLink.querySelector('.player-name')?.parentElement;
                if (nameContainer) {
                    name = Array.from(nameContainer.querySelectorAll('.player-name')).map(el => el.textContent).join('').trim();
                    const posEl = nameContainer.querySelector('.bg-transfer-positionChip-background');
                    if (posEl) {
                        position.label = posEl.textContent.trim();
                        position.key = posEl.textContent.trim();
                    }
                }

                if (!name) return; // Skip if we didn't find a valid name

                // Extract teams
                const teamLinks = Array.from(row.querySelectorAll('a[href*="/teams/"]'));
                let fromClub = '', toClub = '', fromClubId = null, toClubId = null;
                
                if (teamLinks.length >= 1) {
                    const fromLink = teamLinks[0];
                    fromClub = fromLink.textContent.trim();
                    const fromImg = fromLink.querySelector('img');
                    if (fromImg) {
                        const m = fromImg.src.match(/teamlogo\/(\d+)/);
                        if (m) fromClubId = parseInt(m[1]);
                    }
                }
                if (teamLinks.length >= 2) {
                    const toLink = teamLinks[1];
                    toClub = toLink.textContent.trim();
                    const toImg = toLink.querySelector('img');
                    if (toImg) {
                        const m = toImg.src.match(/teamlogo\/(\d+)/);
                        if (m) toClubId = parseInt(m[1]);
                    }
                }

                // Extract fee
                let feeText = '';
                let feeValue = 0;
                
                // Usually the fee is directly under "Fee: €X" or just "€X"
                const feeSpans = Array.from(row.querySelectorAll('span'));
                for (const span of feeSpans) {
                    const text = span.textContent.trim();
                    if (text.startsWith('Fee:')) {
                        feeText = text.replace('Fee:', '').trim();
                        break;
                    }
                    if (text === 'Free transfer' || text === 'free transfer') {
                        feeText = 'Free transfer';
                        break;
                    }
                    if (text === 'On loan' || text === 'on loan') {
                        feeText = 'On loan';
                        break;
                    }
                    if (text.startsWith('€') || text.startsWith('£') || text.startsWith('$')) {
                        feeText = text;
                        break;
                    }
                }

                // Extract date
                // Usually it's the last element in the row, text like "June 19" or "Jun 19"
                let dateStr = '';
                const possibleDates = Array.from(row.querySelectorAll('span')).map(s => s.textContent.trim());
                for (const text of possibleDates) {
                    if (/^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]* \d{1,2}$/i.test(text)) {
                        dateStr = text;
                        break;
                    }
                }

                let transferDateObj = new Date();
                if (dateStr) {
                    // Try to parse the date, assume current year
                    const currentYear = new Date().getFullYear();
                    transferDateObj = new Date(`${dateStr}, ${currentYear}`);
                    // If the date is in the future (e.g. Dec 31 when current is Jan 1), it might be from last year
                    if (transferDateObj > new Date()) {
                        transferDateObj.setFullYear(currentYear - 1);
                    }
                }
                
                // Add seconds descending to preserve order within the same day
                transferDateObj.setSeconds(transferDateObj.getSeconds() - data.length);

                if (playerId && !data.find(d => d.playerId === playerId)) {
                    data.push({
                        playerId,
                        name,
                        position,
                        fromClub,
                        fromClubFullName: fromClub,
                        fromClubId,
                        toClub,
                        toClubFullName: toClub,
                        toClubId,
                        transferDate: transferDateObj.toISOString(),
                        fee: {
                            feeText: feeText || 'Transfer',
                            value: feeValue
                        },
                        transferType: {
                            text: feeText.toLowerCase().includes('free') ? 'Free transfer' : (feeText.toLowerCase().includes('loan') ? 'On loan' : 'Transfer')
                        },
                        marketValue: 0
                    });
                }
            });
            
            return data;
        });

        console.log(`[Fotmob Scraper] Found ${transfers.length} popular transfers via Puppeteer.`);
        await browser.close();
        return transfers;

    } catch (error) {
        console.error('[Fotmob Scraper] Puppeteer error:', error);
        return [];
    }
}

export { fetchFotmobRumors };
