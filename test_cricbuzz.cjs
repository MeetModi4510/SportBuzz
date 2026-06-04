const axios = require('axios');

const CD_KEY = '10d3fca6-f7ac-476b-8b3f-f3b631a5d358';
const CB_KEY = '030c75b4d4mshfdaef69329cdd7ap1943adjsn3edfcf4a96b1';
const CD_BASE = 'https://api.cricapi.com/v1';
const CB_BASE = 'https://cricbuzz-cricket.p.rapidapi.com';

const cbHeaders = {
    'x-rapidapi-key': CB_KEY,
    'x-rapidapi-host': 'cricbuzz-cricket.p.rapidapi.com'
};

// Short name to full name mapping for common teams
const TEAM_ALIASES = {
    'IND': ['India', 'India U19', 'India Women'],
    'AUS': ['Australia', 'Australia Women'],
    'ENG': ['England', 'England Women', 'England U19'],
    'PAK': ['Pakistan', 'Pakistan Women'],
    'SA': ['South Africa', 'South Africa Women'],
    'NZ': ['New Zealand', 'New Zealand Women'],
    'WI': ['West Indies', 'West Indies Women'],
    'SL': ['Sri Lanka'],
    'BAN': ['Bangladesh'],
    'AFG': ['Afghanistan'],
    'IRE': ['Ireland'],
    'ZIM': ['Zimbabwe'],
    'SCO': ['Scotland'],
    'NEP': ['Nepal'],
    'USA': ['United States of America', 'USA'],
    'NED': ['Netherlands'],
    'NAM': ['Namibia'],
    'OMA': ['Oman'],
    'UAE': ['United Arab Emirates'],
    'PNG': ['Papua New Guinea'],
};

function normalizeTeam(name) {
    if (!name) return '';
    return name.toLowerCase()
        .replace(/\s+women/i, '')
        .replace(/\s+u19/i, '')
        .replace(/\s+/g, ' ')
        .trim();
}

function teamsMatch(cdTeams, cbTeam1, cbTeam2) {
    const cdNorm = cdTeams.map(normalizeTeam).sort();
    const cbNorm = [normalizeTeam(cbTeam1), normalizeTeam(cbTeam2)].sort();

    // Direct match
    if (cdNorm[0] === cbNorm[0] && cdNorm[1] === cbNorm[1]) return true;

    // Fuzzy: check if one contains the other
    return cdNorm[0].includes(cbNorm[0]) && cdNorm[1].includes(cbNorm[1]) ||
        cbNorm[0].includes(cdNorm[0]) && cbNorm[1].includes(cdNorm[1]);
}

function dateMatch(cdDateTimeGMT, cbStartDate, toleranceMs = 5 * 60 * 1000) {
    let cdEpoch;
    if (typeof cdDateTimeGMT === 'string') {
        let ts = cdDateTimeGMT;
        if (!ts.endsWith('Z') && !ts.includes('+')) ts += 'Z';
        cdEpoch = new Date(ts).getTime();
    } else {
        cdEpoch = cdDateTimeGMT;
    }

    const cbEpoch = typeof cbStartDate === 'string' ? parseInt(cbStartDate) : cbStartDate;

    return Math.abs(cdEpoch - cbEpoch) <= toleranceMs;
}

async function test() {
    // 1. Get CricketData.org matches
    console.log('Fetching CricketData.org matches...');
    const cdRes = await axios.get(`${CD_BASE}/matches?apikey=${CD_KEY}&offset=0`);
    const cdMatches = cdRes.data.data || [];
    console.log(`Found ${cdMatches.length} CD matches`);

    // 2. Get Cricbuzz matches (live + recent + upcoming)
    console.log('Fetching Cricbuzz matches...');
    const cbMatches = [];

    for (const endpoint of ['live', 'recent']) {
        try {
            const res = await axios.get(`${CB_BASE}/matches/v1/${endpoint}`, { headers: cbHeaders });
            if (res.data.typeMatches) {
                res.data.typeMatches.forEach(tm => {
                    tm.seriesMatches?.forEach(sm => {
                        sm.seriesAdWrapper?.matches?.forEach(m => {
                            cbMatches.push(m.matchInfo);
                        });
                    });
                });
            }
        } catch (e) {
            console.log(`CB ${endpoint} error:`, e.message);
        }
    }
    console.log(`Found ${cbMatches.length} CB matches`);

    // 3. Try to map
    let mapped = 0;
    const mappings = [];

    for (const cd of cdMatches.slice(0, 10)) {
        for (const cb of cbMatches) {
            const tm = teamsMatch(cd.teams || [], cb.team1?.teamName, cb.team2?.teamName);
            const dm = dateMatch(cd.dateTimeGMT, cb.startDate, 24 * 60 * 60 * 1000); // 24hr tolerance for testing

            if (tm && dm) {
                mapped++;
                mappings.push({
                    cd_id: cd.id,
                    cb_id: cb.matchId,
                    cd_teams: cd.teams,
                    cb_teams: [cb.team1?.teamName, cb.team2?.teamName],
                    cd_date: cd.dateTimeGMT,
                    cb_date: new Date(parseInt(cb.startDate)).toISOString()
                });
                break;
            }
        }
    }

    console.log(`\nMapped ${mapped} out of ${Math.min(cdMatches.length, 10)} matches:`);
    mappings.forEach(m => {
        console.log(`  ${m.cd_teams.join(' vs ')} → CD:${m.cd_id.slice(0, 8)}... CB:${m.cb_id}`);
    });
}

test();
