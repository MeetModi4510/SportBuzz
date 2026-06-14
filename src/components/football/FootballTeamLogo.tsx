import React, { useState, useEffect } from 'react';
import { TeamLogo } from '../TeamLogo';
import axios from 'axios';

interface FootballTeamLogoProps {
    logo: string | null;
    name: string;
    shortName?: string;
    size?: "xs" | "sm" | "md" | "lg";
    className?: string;
}

// ─── In-memory cache for team badges ────────────────────────────────────────
const badgeCache = new Map<string, string | null>();
const pendingBadgeRequests = new Map<string, Promise<string | null>>();

const TSDB_BASE = 'https://www.thesportsdb.com/api/v1/json/3';

async function fetchTeamBadge(teamName: string): Promise<string | null> {
    const key = teamName.toLowerCase().trim();
    
    if (badgeCache.has(key)) return badgeCache.get(key)!;
    if (pendingBadgeRequests.has(key)) return pendingBadgeRequests.get(key)!;

    const promise = (async () => {
        try {
            const res = await axios.get(
                `${TSDB_BASE}/searchteams.php?t=${encodeURIComponent(teamName)}`,
                { timeout: 8000 }
            );

            if (res.data?.teams?.length > 0) {
                // Find the soccer team, preferring exact name/country match
                const team = res.data.teams.find((t: any) =>
                    t.strSport === 'Soccer' &&
                    (t.strCountry?.toLowerCase() === teamName.toLowerCase() ||
                     t.strTeam?.toLowerCase() === teamName.toLowerCase())
                );

                if (team?.strBadge) {
                    badgeCache.set(key, team.strBadge);
                    return team.strBadge;
                }
            }

            badgeCache.set(key, null);
            return null;
        } catch {
            badgeCache.set(key, null);
            return null;
        } finally {
            pendingBadgeRequests.delete(key);
        }
    })();

    pendingBadgeRequests.set(key, promise);
    return promise;
}

export const FootballTeamLogo = ({ logo, name, shortName, size = "md", className }: FootballTeamLogoProps) => {
    const [displayLogo, setDisplayLogo] = useState<string | null>(() => {
        // Check cache synchronously
        const cached = badgeCache.get(name.toLowerCase().trim());
        return cached || logo;
    });

    useEffect(() => {
        let isMounted = true;
        const key = name.toLowerCase().trim();

        // Already cached
        if (badgeCache.has(key)) {
            const cached = badgeCache.get(key);
            if (cached && isMounted) {
                setDisplayLogo(cached);
            }
            return;
        }

        // Fetch federation crest from TheSportsDB directly
        fetchTeamBadge(name).then(url => {
            if (!isMounted) return;
            if (url) {
                setDisplayLogo(url);
            }
            // If no result, keep the original ESPN logo/flag fallback
        });

        return () => { isMounted = false; };
    }, [name, logo]);

    return (
        <TeamLogo
            logo={displayLogo || logo || ''}
            name={name}
            shortName={shortName}
            size={size}
            className={className}
        />
    );
};
