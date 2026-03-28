import { cn, getTeamAcronym } from "@/lib/utils";
import { useState } from "react";

interface TeamLogoProps {
    logo: string;
    name: string;
    shortName?: string;
    size?: "xs" | "sm" | "md" | "lg";
    className?: string;
}

export const TeamLogo = ({ logo, name, shortName, size = "md", className }: TeamLogoProps) => {
    const [useTextFallback, setUseTextFallback] = useState(false);

    const sizeClasses = {
        xs: { width: "w-8", height: "h-8", text: "text-lg" },
        sm: { width: "w-12", height: "h-12", text: "text-xl" },
        md: { width: "w-20", height: "h-20", text: "text-4xl" },
        lg: { width: "w-32", height: "h-32", text: "text-6xl" },
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

        return (
            <div
                className={cn(
                    sizeClasses[size].width,
                    sizeClasses[size].height,
                    'flex items-center justify-center rounded-full font-bold text-white shadow-md border border-white/20',
                    getTeamColor(safeName),
                    size === 'xs' ? 'text-[10px]' : size === 'sm' ? 'text-xs' : 'text-xl',
                    className
                )}
            >
                {displayText}
            </div>
        );
    };

    if (!logo || useTextFallback) return renderTextFallback();

    // Ensure logo is a string to prevent crashes
    if (typeof logo !== 'string') return renderTextFallback();

    // Blacklist specific generic placeholder images from the API
    const isGenericPlaceholder = logo === 'https://h.cricapi.com/img/icon512.png';
    if (isGenericPlaceholder) return renderTextFallback();

    // Check if it's a 2-letter country code (or 3-letter for some flagcdn specials like gb-eng)
    // This is our primary detection for "International" matches
    const isCountryCode = /^[a-z]{2}(-[a-z]{3})?$/.test(logo);

    // Special handling for West Indies (International)
    // If name contains West Indies or logo is specific, defaults to local asset
    const safeNameLower = (name || '').toLowerCase();
    const safeLogoLower = logo.toLowerCase();
    const isWestIndies = safeNameLower.includes('west indies') || safeLogoLower.includes('westindies') || logo === 'wi' || logo === '🌴';

    // Check if it's a football club logo (format: fb-{teamId})
    const isFootballClub = logo.startsWith('fb-');

    // Check if it's a cricket team logo (format: cr-{teamId})
    const isCricketTeam = logo.startsWith('cr-');

    // Check if it's a basketball team logo (format: bb-{teamId})
    const isBasketballTeam = logo.startsWith('bb-');

    // 1. West Indies Local Asset (Priority for WI)
    if (isWestIndies) {
        return (
            <img
                src="/flags/westindies.png"
                alt={`${name} flag`}
                className={cn(
                    sizeClasses[size].width,
                    sizeClasses[size].height,
                    "object-contain p-1 bg-white/10 rounded",
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
                src={`https://flagcdn.com/w80/${logo}.png`}
                alt={`${name} flag`}
                className={cn(
                    sizeClasses[size].width,
                    sizeClasses[size].height,
                    "object-cover rounded shadow-sm border border-border/50",
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
                    "object-contain rounded-full bg-white/10 p-1",
                    className
                )}
                onError={() => setUseTextFallback(true)}
            />
        );
    }

    // 5. Final Fallback if logo is just a string but not a URL/code
    return renderTextFallback();
};
