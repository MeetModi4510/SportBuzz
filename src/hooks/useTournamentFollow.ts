import { useState, useEffect, useCallback } from "react";
import { tournamentApi } from "@/services/api";

const STORAGE_KEY = "followed_tournaments";

const load = (): string[] => {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    } catch {
        return [];
    }
};

export const useTournamentFollow = () => {
    const [followed, setFollowed] = useState<string[]>(load);
    const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('token'));

    useEffect(() => {
        setFollowed(load());
        setIsLoggedIn(!!localStorage.getItem('token'));
    }, []);

    // Sync local follows to backend when logged in
    useEffect(() => {
        if (isLoggedIn && followed.length > 0) {
            const syncFollows = async () => {
                try {
                    // We only sync ones that might not be on the backend
                    // The backend follow is idempotent, so this is safe
                    const promises = followed.map(id => tournamentApi.follow(id));
                    await Promise.all(promises);
                } catch (err) {
                    console.error("Failed to sync follows to backend", err);
                }
            };
            syncFollows();
        }
    }, [isLoggedIn, followed.length]); // depend on length to sync new local additions

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(followed));
    }, [followed]);

    const follow = useCallback(async (id: string, isFootball: boolean = false) => {
        setFollowed(prev => prev.includes(id) ? prev : [...prev, id]);
        if (isLoggedIn) {
            try {
                if (isFootball) {
                    await (import("@/services/api").then(m => m.footballApi.follow(id)));
                } else {
                    await tournamentApi.follow(id);
                }
            } catch (err) {
                console.error("Failed to follow tournament on backend", err);
            }
        }
    }, [isLoggedIn]);

    const unfollow = useCallback(async (id: string, isFootball: boolean = false) => {
        setFollowed(prev => prev.filter(f => f !== id));
        if (isLoggedIn) {
            try {
                if (isFootball) {
                    await (import("@/services/api").then(m => m.footballApi.unfollow(id)));
                } else {
                    await tournamentApi.unfollow(id);
                }
            } catch (err) {
                console.error("Failed to unfollow tournament on backend", err);
            }
        }
    }, [isLoggedIn]);

    const toggle = useCallback((id: string, isFootball: boolean = false) => {
        if (followed.includes(id)) {
            unfollow(id, isFootball);
        } else {
            follow(id, isFootball);
        }
    }, [followed, follow, unfollow]);

    const isFollowed = useCallback((id: string) => followed.includes(id), [followed]);

    return { followed, follow, unfollow, toggle, isFollowed };
};
