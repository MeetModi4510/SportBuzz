/**
 * State Flags Service - Maps Indian state/team names to emblem URLs
 * Uses UI Avatars API to generate reliable, professional team badges since
 * Wikipedia URLs are unstable due to hash path changes.
 */

// Generate a professional team badge URL
const getBadgeUrl = (name) => {
    // Generate distinct background colors based on name hash to ensure consistency
    // Simple hash function
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const c = (hash & 0x00FFFFFF).toString(16).toUpperCase();
    const color = "00000".substring(0, 6 - c.length) + c;

    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=${color}&color=fff&rounded=true&bold=true&size=128`;
};

// Indian State Cricket Teams → Badge URLs
// Using generated avatars ensures consistent, high-quality badges for all teams
// without relying on unstable external image paths.
const stateFlags = {
    // Major Ranji Trophy Teams
    'madhya pradesh': getBadgeUrl('Madhya Pradesh'),
    'jammu and kashmir': getBadgeUrl('Jammu Kashmir'),
    'jharkhand': getBadgeUrl('Jharkhand'),
    'uttarakhand': getBadgeUrl('Uttarakhand'),
    'mumbai': getBadgeUrl('Mumbai'),
    'delhi': getBadgeUrl('Delhi'),
    'karnataka': getBadgeUrl('Karnataka'),
    'tamil nadu': getBadgeUrl('Tamil Nadu'),
    'bengal': getBadgeUrl('Bengal'),
    'baroda': getBadgeUrl('Baroda'),
    'saurashtra': getBadgeUrl('Saurashtra'),
    'vidarbha': getBadgeUrl('Vidarbha'),
    'rajasthan': getBadgeUrl('Rajasthan'),
    'gujarat': getBadgeUrl('Gujarat'),
    'punjab': getBadgeUrl('Punjab'),
    'haryana': getBadgeUrl('Haryana'),
    'andhra': getBadgeUrl('Andhra'),
    'andhra pradesh': getBadgeUrl('Andhra Pradesh'),
    'kerala': getBadgeUrl('Kerala'),
    'hyderabad': getBadgeUrl('Hyderabad'),
    'telangana': getBadgeUrl('Telangana'),
    'uttar pradesh': getBadgeUrl('Uttar Pradesh'),
    'odisha': getBadgeUrl('Odisha'),
    'assam': getBadgeUrl('Assam'),
    'goa': getBadgeUrl('Goa'),
    'himachal pradesh': getBadgeUrl('Himachal'),
    'chhattisgarh': getBadgeUrl('Chhattisgarh'),
    'tripura': getBadgeUrl('Tripura'),
    'meghalaya': getBadgeUrl('Meghalaya'),
    'manipur': getBadgeUrl('Manipur'),
    'nagaland': getBadgeUrl('Nagaland'),
    'mizoram': getBadgeUrl('Mizoram'),
    'arunachal pradesh': getBadgeUrl('Arunachal'),
    'sikkim': getBadgeUrl('Sikkim'),
    'puducherry': getBadgeUrl('Puducherry'),
    'chandigarh': getBadgeUrl('Chandigarh'),

    // Special Teams
    'services': getBadgeUrl('Services'),
    'railways': getBadgeUrl('Railways'),
};

const DEFAULT_FLAG = getBadgeUrl('Cricket');

/**
 * Get the flag/emblem URL for a state team
 * @param {string} teamName - State/team name
 * @returns {string} - Flag URL or default
 */
export const getStateFlag = (teamName) => {
    if (!teamName) return DEFAULT_FLAG;

    const normalizedName = teamName.toLowerCase().trim();
    return stateFlags[normalizedName] || getBadgeUrl(teamName); // Fallback to generating one if not in list
};

/**
 * Check if a team is a state-level team (domestic)
 * @param {string} teamName - Team name to check
 * @returns {boolean}
 */
export const isStateTeam = (teamName) => {
    if (!teamName) return false;
    // Check our list or assume yes for debugging logic in controller
    const normalizedName = teamName.toLowerCase().trim();
    return Object.keys(stateFlags).includes(normalizedName);
};

export const getAllStateMappings = () => stateFlags;

export default {
    getStateFlag,
    isStateTeam,
    getAllStateMappings,
    DEFAULT_FLAG,
};
