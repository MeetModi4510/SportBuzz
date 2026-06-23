import axios from 'axios';
import * as cheerio from 'cheerio';

const LEAGUES = [
    { id: 47, name: 'Premier League' },
    { id: 87, name: 'La Liga' },
    { id: 53, name: 'Ligue 1' },
    { id: 54, name: 'Bundesliga' },
    { id: 55, name: 'Serie A' },
    { id: 130, name: 'MLS' },
    { id: 536, name: 'Saudi Pro League' },
    { id: 40, name: 'Belgian Pro League' },
    { id: 57, name: 'Eredivisie' },
    { id: 9435, name: 'Indian Super League' }
];

async function fetchLeagueTransfers(leagueId) {
    try {
        const url = `https://www.fotmob.com/leagues/${leagueId}/transfers`;
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });

        const $ = cheerio.load(response.data);
        const scriptContent = $('#__NEXT_DATA__').html();
        if (!scriptContent) return [];

        const data = JSON.parse(scriptContent);
        return data?.props?.pageProps?.transfers?.data || [];
    } catch (error) {
        console.error(`[Fotmob Scraper] Failed to fetch transfers for league ${leagueId}:`, error.message);
        return [];
    }
}

export async function scrapeFotmobTransfers() {
    console.log('[Fotmob Scraper] Starting fetch across all targeted leagues...');
    const allTransfers = [];
    const seen = new Set();

    // Fetch in parallel for speed
    const fetchPromises = LEAGUES.map(async (league) => {
        const transfers = await fetchLeagueTransfers(league.id);
        
        for (const t of transfers) {
            const key = `${t.playerId}_${t.transferDate}`;
            if (!seen.has(key)) {
                seen.add(key);
                
                // Add Fotmob-specific IDs and image mappings
                const playerImage = `https://images.fotmob.com/image_resources/playerimages/${t.playerId}.png`;
                const fromClubLogo = t.fromClubId ? `https://images.fotmob.com/image_resources/logo/teamlogo/${t.fromClubId}.png` : '';
                const toClubLogo = t.toClubId ? `https://images.fotmob.com/image_resources/logo/teamlogo/${t.toClubId}.png` : '';
                
                // Extract feeValue if possible
                let feeValue = 0;
                if (t.fee && t.fee.value) {
                    feeValue = t.fee.value;
                }

                // Fotmob indicates loan/free in feeText or transferType
                const feeText = t.fee?.feeText || '';
                const onLoan = feeText.toLowerCase().includes('loan') || t.transferType?.text?.toLowerCase().includes('loan');

                allTransfers.push({
                    playerId: t.playerId,
                    name: t.name,
                    playerImage,
                    position: t.position || { label: '', key: '' },
                    fromClub: t.fromClub,
                    fromClubFullName: t.fromClubFullName,
                    fromClubId: t.fromClubId,
                    fromClubLogo,
                    toClub: t.toClub,
                    toClubFullName: t.toClubFullName,
                    toClubId: t.toClubId,
                    toClubLogo,
                    transferDate: t.transferDate,
                    fee: feeText,
                    feeValue,
                    transferType: t.transferType?.text || '',
                    marketValue: t.marketValue || 0,
                    leagueId: league.id,
                    onLoan,
                    contractExtension: false // Fotmob doesn't explicitly flag this in the same way, but keeping it for schema
                });
            }
        }
    });

    await Promise.all(fetchPromises);
    
    // Sort combined globally by newest first
    allTransfers.sort((a, b) => new Date(b.transferDate) - new Date(a.transferDate));
    
    console.log(`[Fotmob Scraper] Completed. Fetched ${allTransfers.length} unique transfers.`);
    return allTransfers;
}
