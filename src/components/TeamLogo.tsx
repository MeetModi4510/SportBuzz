import { cn, getTeamAcronym } from "@/lib/utils";
import { useState } from "react";
import mplFlags from "@/data/mpl_t20_2026_flags.json";

interface TeamLogoProps {
    logo: string;
    name: string;
    shortName?: string;
    size?: "xs" | "sm" | "md" | "lg";
    className?: string;
    season?: string | number;
}

export const TeamLogo = ({ logo, name, shortName, size = "md", className, season }: TeamLogoProps) => {
    const [useTextFallback, setUseTextFallback] = useState(false);

    const sizeClasses = {
        xs: { width: "w-8", height: "h-8", text: "text-xs" },
        sm: { width: "w-12", height: "h-12", text: "text-sm" },
        md: { width: "w-20", height: "h-20", text: "text-lg" },
        lg: { width: "w-32", height: "h-32", text: "text-2xl" },
    };

    // Generate a consistent vibrant gradient based on team name hash
    const getTeamColor = (str: string) => {
        const hash = str.split("").reduce((acc, char) => {
            return char.charCodeAt(0) + ((acc << 5) - acc);
        }, 0);
        const gradients = [
            "bg-gradient-to-br from-red-500 to-rose-600",
            "bg-gradient-to-br from-blue-500 to-cyan-600",
            "bg-gradient-to-br from-emerald-500 to-teal-600",
            "bg-gradient-to-br from-orange-500 to-amber-600",
            "bg-gradient-to-br from-purple-500 to-indigo-600",
            "bg-gradient-to-br from-pink-500 to-fuchsia-600",
            "bg-gradient-to-br from-violet-500 to-purple-600",
            "bg-gradient-to-br from-yellow-500 to-orange-600",
        ];
        return gradients[Math.abs(hash) % gradients.length];
    };

    // Helper to render text fallback with defensive check
    const renderTextFallback = () => {
        const safeName = name || '?';
        // Use shortName if available, otherwise first 2 chars of name
        const displayText = shortName || getTeamAcronym(safeName);

        // Dynamically scale font size so long abbreviations (ENGA, WARKS, etc.)
        // always fit perfectly inside the circle without overflowing.
        const getDynamicFontSize = (): string | undefined => {
            const len = displayText.length;
            if (len <= 2) return undefined;   // CSS class handles it fine
            if (len === 3) return '0.78em';
            if (len === 4) return '0.60em';
            return '0.46em';                  // 5+ chars (e.g. ATMWS)
        };
        const dynamicFontSize = getDynamicFontSize();

        return (
            <div
                style={dynamicFontSize ? { fontSize: dynamicFontSize } : undefined}
                className={cn(
                    sizeClasses[size].width,
                    sizeClasses[size].height,
                    'flex items-center justify-center rounded-md font-bold text-white shadow-md border border-white/20',
                    getTeamColor(safeName),
                    sizeClasses[size].text,
                    className
                )}
            >
                {displayText}
            </div>
        );
    };
    // Check local flag mappings first (highest priority for user downloaded assets)
    const safeNameLower = (name || '').toLowerCase().trim();
    const safeShortLower = (shortName || '').toLowerCase().trim();

    const localFlagMap: Record<string, string> = {
        'sobo mumbai falcons': '/flags/t20_mumbai_2026/sobo.png',
        'smf': '/flags/t20_mumbai_2026/sobo.png',
        'msc maratha royals': '/flags/t20_mumbai_2026/mscmr.png',
        'mscmr': '/flags/t20_mumbai_2026/mscmr.png',
        'aakash tigers mws': '/flags/t20_mumbai_2026/atmws.png',
        'atmws': '/flags/t20_mumbai_2026/atmws.png',
        'bandra blasters': '/flags/t20_mumbai_2026/bb.png',
        'eagle thane strikers': '/flags/t20_mumbai_2026/ets.png',
        'triumph knights mumbai north east': '/flags/t20_mumbai_2026/tkme.png',
        'triumphs knights mne': '/flags/t20_mumbai_2026/tkme.png',
        'tkme': '/flags/t20_mumbai_2026/tkme.png',
        'nmp': '/flags/t20_mumbai_2026/mp.png',
        'arcs andheri': '/flags/t20_mumbai_2026/aa.png',
        'aa': '/flags/t20_mumbai_2026/aa.png',
        
        // IPL Teams
        'chennai super kings': '/flags/ipl_2026/csk.png',
        'csk': '/flags/ipl_2026/csk.png',
        'delhi capitals': '/flags/ipl_2026/dc.png',
        'dc': '/flags/ipl_2026/dc.png',
        'delhi daredevils': '/flags/ipl_2026/dd.png',
        'dd': '/flags/ipl_2026/dd.png',
        'gujarat lions': '/flags/ipl_2026/gl.png',
        'gl': '/flags/ipl_2026/gl.png',
        'gujarat titans': '/flags/ipl_2026/gt.png',
        'gt': '/flags/ipl_2026/gt.png',
        'kolkata knight riders': '/flags/ipl_2026/kkr.png',
        'kkr': '/flags/ipl_2026/kkr.png',
        'lucknow super giants': '/flags/ipl_2026/lsg.png',
        'lsg': '/flags/ipl_2026/lsg.png',
        'mumbai indians': '/flags/ipl_2026/mi.png',
        'mi': '/flags/ipl_2026/mi.png',
        'punjab kings': '/flags/ipl_2026/pbks.png',
        'pbks': '/flags/ipl_2026/pbks.png',
        'kings xi punjab': '/flags/ipl_2026/kxip.png',
        'kxip': '/flags/ipl_2026/kxip.png',
        'rising pune supergiant': '/flags/ipl_2026/rps.png',
        'rising pune supergiants': '/flags/ipl_2026/rps.png',
        'rps': '/flags/ipl_2026/rps.png',
        'royal challengers bengaluru': '/flags/ipl_2026/rcb.png',
        'royal challengers bangalore': '/flags/ipl_2026/rcb.png',
        'rcb': '/flags/ipl_2026/rcb.png',
        'rajasthan royals': '/flags/ipl_2026/rr.png',
        'rr': '/flags/ipl_2026/rr.png',
        'sunrisers hyderabad': '/flags/ipl_2026/srh.png',
        'deccan chargers': '/flags/ipl_2026/srh.png',
        'srh': '/flags/ipl_2026/srh.png',
        
        ...mplFlags
    };

    let resolvedLocalFlag = localFlagMap[safeNameLower] || localFlagMap[safeShortLower];
    if (!resolvedLocalFlag) {
        for (const [key, path] of Object.entries(localFlagMap)) {
            if (key.length >= 3 && (safeNameLower.includes(key) || safeShortLower.includes(key))) {
                resolvedLocalFlag = path;
                break;
            }
        }
    }

    // Dynamic Season Overrides
    if (season) {
        const seasonNum = parseInt(season.toString(), 10);
        if (!isNaN(seasonNum)) {
            // LSG logo update from 2026 onwards
            if (
                (safeNameLower === 'lucknow super giants' || safeShortLower === 'lsg') &&
                seasonNum >= 2026
            ) {
                resolvedLocalFlag = '/flags/ipl_2026/lsg2026.png';
            }
            // RR legacy logo for 2009-2018
            if (
                (safeNameLower === 'rajasthan royals' || safeShortLower === 'rr') &&
                seasonNum >= 2009 && seasonNum <= 2018
            ) {
                resolvedLocalFlag = '/flags/ipl_2026/rr2018.png';
            }
            // RCB legacy logo for 2016-2019
            if (
                (safeNameLower === 'royal challengers bengaluru' || safeNameLower === 'royal challengers bangalore' || safeShortLower === 'rcb') &&
                seasonNum >= 2016 && seasonNum <= 2019
            ) {
                resolvedLocalFlag = '/flags/ipl_2026/rcb2016.png';
            }
        }
    }

    if (resolvedLocalFlag && !useTextFallback) {
        return (
            <img
                src={resolvedLocalFlag}
                alt={`${name} logo`}
                className={cn(
                    sizeClasses[size].width,
                    sizeClasses[size].height,
                    "object-contain rounded-md",
                    className
                )}
                onError={() => setUseTextFallback(true)}
            />
        );
    }

    if (!logo || useTextFallback) return renderTextFallback();

    // Ensure logo is a string to prevent crashes
    if (typeof logo !== 'string') return renderTextFallback();

    // Blacklist specific generic placeholder images from the API
    const isGenericPlaceholder = logo === 'https://h.cricapi.com/img/icon512.png';
    if (isGenericPlaceholder) return renderTextFallback();

    // Check if it's a 2-letter country code (or 3-letter for some flagcdn specials like gb-eng)
    // This is our primary detection for "International" matches
    const isCountryCode = /^[a-z]{2}(-[a-z]{3})?$/.test(logo);

    // Special handling for West Indies, Sri Lanka, and England (use local assets)
    const safeLogoLower = logo.toLowerCase();
    const isWestIndies = safeNameLower.includes('west indies') || safeLogoLower.includes('westindies') || logo === 'wi' || logo === '🌴';
    const isSriLanka = safeNameLower.includes('sri lanka') || safeLogoLower === 'lk' || safeLogoLower === 'sl';
    const isEngland = safeNameLower.includes('england') || safeLogoLower === 'gb-eng' || safeLogoLower === 'eng';

    // Check if it's a football club logo (format: fb-{teamId})
    const isFootballClub = logo.startsWith('fb-');

    // Check if it's a cricket team logo (format: cr-{teamId})
    const isCricketTeam = logo.startsWith('cr-');

    // Check if it's a basketball team logo (format: bb-{teamId})
    const isBasketballTeam = logo.startsWith('bb-');

    // 1. Local Assets for West Indies, Sri Lanka, and England
    if (isWestIndies) {
        return (
            <img
                src="/flags/westindies.png"
                alt={`${name} flag`}
                className={cn(
                    sizeClasses[size].width,
                    sizeClasses[size].height,
                    "object-contain rounded-md",
                    className
                )}
                onError={() => setUseTextFallback(true)}
            />
        );
    }

    if (isSriLanka) {
        return (
            <img
                src="/flags/srilanka.png"
                alt={`${name} flag`}
                className={cn(
                    sizeClasses[size].width,
                    sizeClasses[size].height,
                    "object-contain rounded-md",
                    className
                )}
                onError={() => setUseTextFallback(true)}
            />
        );
    }

    if (isEngland) {
        return (
            <img
                src="/flags/england.png"
                alt={`${name} flag`}
                className={cn(
                    sizeClasses[size].width,
                    sizeClasses[size].height,
                    "object-contain rounded-md",
                    className
                )}
                onError={() => setUseTextFallback(true)}
            />
        );
    }

    // 2. International Matches -> Flagpedia
    if (isCountryCode) {
        return (
            <img
                src={`https://flagcdn.com/w160/${logo}.png`}
                alt={`${name} flag`}
                className={cn(
                    sizeClasses[size].width,
                    sizeClasses[size].height,
                    "object-contain rounded-md",
                    className
                )}
                onError={() => setUseTextFallback(true)}
            />
        );
    }

    // 3. Football/Basketball/League Specific Logic (Existing)
    if (isFootballClub) {
        const teamId = logo.replace('fb-', '');
        return (
            <img
                src={`https://media.api-sports.io/football/teams/${teamId}.png`}
                alt={`${name} logo`}
                className={cn(
                    sizeClasses[size].width,
                    sizeClasses[size].height,
                    "object-contain",
                    className
                )}
                onError={() => setUseTextFallback(true)}
            />
        );
    }

    if (isBasketballTeam) {
        const teamId = logo.replace('bb-', '');
        return (
            <img
                src={`https://media.api-sports.io/basketball/teams/${teamId}.png`}
                alt={`${name} logo`}
                className={cn(
                    sizeClasses[size].width,
                    sizeClasses[size].height,
                    "object-contain",
                    className
                )}
                onError={() => setUseTextFallback(true)}
            />
        );
    }

    if (isCricketTeam) {
        const teamId = logo.replace('cr-', '');
        const iplTeamMapping: Record<string, string> = {
            '971': 'MI', '966': 'CSK', '972': 'RCB', '968': 'KKR', '967': 'DC',
            '974': 'SRH', '970': 'PBKS', '973': 'RR', '8133': 'GT', '8134': 'LSG'
        };
        const teamAbbr = iplTeamMapping[teamId];
        if (teamAbbr) {
            if (useTextFallback) {
                // IPL Fallback colors (handled by state re-render above, checking map here for specific colors)
                const teamColors: Record<string, { bg: string, text: string }> = {
                    'MI': { bg: '#004BA0', text: 'white' },
                    'CSK': { bg: '#FDB913', text: '#1A1A1A' },
                    'RCB': { bg: '#EC1C24', text: 'white' },
                    'KKR': { bg: '#3A225D', text: 'white' },
                    'DC': { bg: '#004C93', text: 'white' },
                    'SRH': { bg: '#FF822A', text: 'white' },
                    'PBKS': { bg: '#ED1B24', text: 'white' },
                    'RR': { bg: '#254AA5', text: 'white' },
                    'GT': { bg: '#1C2033', text: 'white' },
                    'LSG': { bg: '#3AABE5', text: 'white' }
                };
                const team = teamColors[teamAbbr];
                if (team) {
                    return (
                        <div
                            style={{ backgroundColor: team.bg, color: team.text }}
                            className={cn(
                                sizeClasses[size].width,
                                sizeClasses[size].height,
                                'flex items-center justify-center rounded font-bold text-sm shadow-sm border border-border/20',
                                className
                            )}
                        >
                            {teamAbbr}
                        </div>
                    );
                }
            }
            return (
                <img
                    src={`https://scores.iplt20.com/ipl/teamlogos/${teamAbbr}.png?v=3`}
                    alt={`${name} logo`}
                    className={cn(
                        sizeClasses[size].width,
                        sizeClasses[size].height,
                        "object-contain",
                        className
                    )}
                    onError={() => setUseTextFallback(true)}
                />
            );
        }
    }

    // 4. General Fallback (Domestic/Other) -> CricketDataOrg / Direct URL
    // If this fails, onError triggers useTextFallback -> renderTextFallback()
    if (logo.startsWith('http') || logo.startsWith('https') || logo.startsWith('/')) {
        return (
            <img
                src={logo}
                alt={`${name} logo`}
                className={cn(
                    sizeClasses[size].width,
                    sizeClasses[size].height,
                    "object-contain",
                    className
                )}
                onError={() => setUseTextFallback(true)}
            />
        );
    }

    // 5. Final Fallback if logo is just a string but not a URL/code
    return renderTextFallback();
};
