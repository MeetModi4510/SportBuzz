/**
 * Flag Service - Maps team/country names to flag URLs
 * 
 * STRATEGY:
 * 1. For INTERNATIONAL teams: Use Flagpedia CDN with proper country code mapping
 * 2. For WEST INDIES: Use custom WICB cricket logo (Flagpedia doesn't have 'wi')
 * 3. For STATE/DOMESTIC teams: The teamInfo.img from CricketData API is used directly
 *    (this is handled in the controller, not here - we just provide fallback)
 */

// West Indies Cricket Board official logo URL (Served locally vs external CDN)
const WEST_INDIES_FLAG_URL = '/flags/westindies.png';

// Comprehensive mapping of team names to ISO country codes for Flagpedia
const teamToCountryCode = {
    // International Teams (Full names)
    'india': 'in',
    'australia': 'au',
    'england': 'gb',
    'pakistan': 'pk',
    'new zealand': 'nz',
    'south africa': 'za',
    'sri lanka': 'lk',
    'bangladesh': 'bd',
    'afghanistan': 'af',
    'zimbabwe': 'zw',
    'ireland': 'ie',
    'netherlands': 'nl',
    'scotland': 'gb-sct',
    'usa': 'us',
    'united states': 'us',
    'united states of america': 'us',
    'canada': 'ca',
    'namibia': 'na',
    'oman': 'om',
    'nepal': 'np',
    'uae': 'ae',
    'united arab emirates': 'ae',
    'hong kong': 'hk',
    'papua new guinea': 'pg',
    'kenya': 'ke',
    'bermuda': 'bm',
    'italy': 'it',
    'germany': 'de',
    'jersey': 'je',
    'belgium': 'be',
    'france': 'fr',
    'spain': 'es',
    'denmark': 'dk',
    'singapore': 'sg',
    'malaysia': 'my',
    'uganda': 'ug',
    'tanzania': 'tz',
    'rwanda': 'rw',
    'botswana': 'bw',

    // West Indies - Use Jamaica flag as representative (most recognizable Caribbean cricket nation)
    // Alternatively could use Trinidad, Barbados etc. Flagpedia doesn't have 'wi'
    'west indies': 'jm',
    'windies': 'jm',

    // Common Abbreviations (must match API shortnames)
    'ind': 'in',
    'aus': 'au',
    'eng': 'gb',
    'pak': 'pk',
    'nz': 'nz',
    'rsa': 'za',
    'sa': 'za',
    'sl': 'lk',
    'ban': 'bd',
    'afg': 'af',
    'zim': 'zw',
    'ire': 'ie',
    'ned': 'nl',
    'sco': 'gb-sct',
    'nam': 'na',
    'ita': 'it',      // ITALY
    'it': 'it',       // ITALY shortcode
    'ger': 'de',
    'ue': 'ae',       // UAE shortcode used in API
    'oma': 'om',
    'nep': 'np',
    'hk': 'hk',
    'png': 'pg',
    'ken': 'ke',
    'ber': 'bm',
    'can': 'ca',
    'sin': 'sg',
    'mal': 'my',
    'uga': 'ug',
    'wi': 'jm',       // West Indies shortcode - uses Jamaica flag
    'us': 'us',       // USA shortcode

    // National sub-teams (U19, A, Women's)
    'india a': 'in',
    'india u19': 'in',
    'in19': 'in',      // India U19 shortcode
    'ina': 'in',       // India A shortcode
    'england u19': 'gb',
    'australia u19': 'au',
    'australia a': 'au',
    'pakistan a': 'pk',
    'afghanistan u19': 'af',
    'af19': 'af',      // Afghanistan U19 shortcode
};

// Indian State Teams - we DON'T map these to Flagpedia (they use API images)
const indianStateTeams = new Set([
    'madhya pradesh', 'jammu and kashmir', 'jharkhand', 'uttarakhand',
    'mumbai', 'delhi', 'karnataka', 'tamil nadu', 'bengal', 'baroda',
    'saurashtra', 'vidarbha', 'rajasthan', 'gujarat', 'punjab', 'haryana',
    'andhra', 'kerala', 'hyderabad', 'uttar pradesh', 'odisha', 'assam',
    'goa', 'himachal pradesh', 'services', 'railways', 'chandigarh',
    'chhattisgarh', 'tripura', 'meghalaya', 'manipur', 'nagaland',
    'mizoram', 'arunachal pradesh', 'sikkim', 'puducherry',
    // Shortcodes
    'mp', 'jk', 'jhkd', 'utk', 'mum', 'del', 'kar', 'tn', 'ben', 'bar',
    'sau', 'vid', 'raj', 'guj', 'pun', 'har', 'ap', 'ker', 'hyd', 'up'
]);

/**
 * Check if a team is a state-level team (domestic)
 */
export const isStateTeam = (teamName) => {
    if (!teamName) return false;
    const normalizedName = teamName.toLowerCase().trim();
    return indianStateTeams.has(normalizedName);
};

/**
 * Get Flagpedia URL for a team (for INTERNATIONAL teams only)
 * @param {string} teamName - Team or country name
 * @returns {string|null} - Flag URL or null if not found/state team
 */
export const getFlagUrl = (teamName) => {
    if (!teamName) return null;

    const normalizedName = teamName.toLowerCase().trim();

    // Don't provide Flagpedia URL for state teams
    if (isStateTeam(normalizedName)) {
        return null; // Controller should use teamInfo.img instead
    }

    // Special handling for West Indies (Flagpedia doesn't have 'wi' code)
    const westIndiesVariants = ['west indies', 'windies', 'wi'];
    if (westIndiesVariants.some(v => normalizedName === v || normalizedName.includes('west indies'))) {
        return WEST_INDIES_FLAG_URL;
    }

    // 1. Exact Match (covers common shortcodes like 'ind', 'aus', 'rsa')
    const countryCode = teamToCountryCode[normalizedName];
    if (countryCode) {
        return `https://flagcdn.com/w80/${countryCode}.png`;
    }

    // 2. Safe Partial Match
    // Only match against keys that are long enough (length > 3) to avoid false positives.
    // e.g. "Queensland" (contains 'sl') should NOT match 'sl' (Sri Lanka).
    // but "India U19" (contains 'india') SHOULD match 'india'.
    for (const [key, code] of Object.entries(teamToCountryCode)) {
        if (key.length <= 3) continue; // Skip short keys for fuzzy matching

        if (normalizedName.includes(key)) {
            return `https://flagcdn.com/w80/${code}.png`;
        }
    }

    return null;
};

/**
 * Get just the country code for a team
 */
export const getCountryCode = (teamName) => {
    if (!teamName) return null;
    const normalizedName = teamName.toLowerCase().trim();
    return teamToCountryCode[normalizedName] || null;
};

/**
 * Check if a match is International based on Type
 */
const isInternationalMatch = (match) => {
    if (!match) return false;
    const type = (match.matchType || '').toUpperCase();
    return ['TEST', 'ODI', 'T20I'].includes(type) ||
        type.includes('INTERNATIONAL') ||
        type.includes('WORLD CUP');
};

/**
 * Attach flag URLs to a match object's teams
 * Priority: 
 *   - If recognized as a Country/International Team (via mapping): Use Flagpedia
 *   - Otherwise: Use API image
 */
export const attachFlagsToMatch = (match) => {
    if (!match) return match;

    const team1Name = match.teams?.[0] || match.teamInfo?.[0]?.name || match.t1 || '';
    const team2Name = match.teams?.[1] || match.teamInfo?.[1]?.name || match.t2 || '';

    // Also check shortnames for better matching
    const team1Short = match.teamInfo?.[0]?.shortname || '';
    const team2Short = match.teamInfo?.[1]?.shortname || '';

    // Get API-provided images (for state/domestic teams)
    const team1ApiImg = match.teamInfo?.[0]?.img || match.team1Flag;
    const team2ApiImg = match.teamInfo?.[1]?.img || match.team2Flag;

    // Helper to get flag
    // We Do NOT use shortname for Flagpedia lookup because duplicate shortcodes exist (e.g. CAN for Canterbury & Canada)
    // Relying on Full Name + Fuzzy Match is safer.
    const getFlag = (name) => getFlagUrl(name);

    // Determines flag with simple fallback priority:
    // If Flagpedia has it (based on Name), USE IT.
    // Else use API image.

    const team1Flag = getFlag(team1Name) || team1ApiImg || null;
    const team2Flag = getFlag(team2Name) || team2ApiImg || null;

    return {
        ...match,
        team1Flag,
        team2Flag,
    };
};

export default {
    getFlagUrl,
    getCountryCode,
    attachFlagsToMatch,
    isStateTeam,
};
