import axios from 'axios';

export async function fetchFotmobRumors() {
    try {
        console.log('[Fotmob Scraper] Fetching popular transfers (rumors) without Puppeteer...');
        
        const response = await axios.get('https://www.fotmob.com/transfers', {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
            },
            timeout: 15000
        });

        const match = response.data.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/);
        if (!match) {
            console.error('[Fotmob Scraper] Could not find __NEXT_DATA__ for transfers.');
            return [];
        }

        const nextData = JSON.parse(match[1]);
        const transfersData = nextData?.props?.pageProps?.transfers?.data;
        
        if (!transfersData || !Array.isArray(transfersData)) {
            console.error('[Fotmob Scraper] Transfers data missing from __NEXT_DATA__.');
            return [];
        }

        const data = transfersData.map(t => {
            let feeText = t.fee?.feeText || t.fee?.localizedFeeText || 'Transfer';
            
            return {
                playerId: t.playerId?.toString(),
                name: t.name,
                position: t.position || { label: '', key: '' },
                fromClub: t.fromClub || t.fromClubFullName,
                fromClubFullName: t.fromClubFullName || t.fromClub,
                fromClubId: t.fromClubId,
                toClub: t.toClub || t.toClubFullName,
                toClubFullName: t.toClubFullName || t.toClub,
                toClubId: t.toClubId,
                transferDate: t.transferDate || new Date().toISOString(),
                fee: {
                    feeText: feeText,
                    value: t.fee?.value || 0
                },
                transferType: {
                    text: t.transferType?.text || t.transferType?.localizationKey || (feeText.toLowerCase().includes('free') ? 'Free transfer' : (feeText.toLowerCase().includes('loan') ? 'On loan' : 'Transfer'))
                },
                marketValue: t.marketValue || 0
            };
        });

        console.log(`[Fotmob Scraper] Found ${data.length} popular transfers via axios fallback.`);
        return data;

    } catch (error) {
        console.error('[Fotmob Scraper] Error fetching rumors:', error.message);
        return [];
    }
}
