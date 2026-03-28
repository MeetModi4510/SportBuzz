import { useState, useEffect } from "react";
import { customMatchApi } from "@/services/api";
import { useTournamentFollow } from "./useTournamentFollow";

export interface TournamentTickerMatch {
    _id: string;
    tournamentName: string;
    homeTeamName: string;
    homeTeamLogo?: string;
    awayTeamName: string;
    awayTeamLogo?: string;
    homeScore: string;
    awayScore: string;
    status: "Live" | "Completed";
    tournamentId: string;
    testBreakStatus?: string | null;
}

/** Fetches live + recent matches for all followed tournaments and refreshes every 15s */
export const useFollowedTournamentMatches = (tournamentList: { _id: string; name: string }[]) => {
    const { followed } = useTournamentFollow();
    const [matches, setMatches] = useState<TournamentTickerMatch[]>([]);

    useEffect(() => {
        if (followed.length === 0) { setMatches([]); return; }

        const fetchAll = async () => {
            const followedTournaments = tournamentList.filter(t => followed.includes(t._id));
            const results: TournamentTickerMatch[] = [];

            await Promise.all(
                followedTournaments.map(async (t) => {
                    try {
                        const res = await customMatchApi.getAll({ tournamentId: t._id });
                        const liveMatches = (res.data || []).filter(
                            (m: any) => m.status === "Live"
                        );
                        for (const m of liveMatches) {
                            const fmtOv = (o: number) => {
                                const b = Math.round(o * 6);
                                return `${Math.floor(b / 6)}.${b % 6}`;
                            };
                            const s1 = m.score?.team1;
                            const s2 = m.score?.team2;
                            let testBreakStatus: string | null = null;
                            if (m.status === "Live" && m.tournament?.matchType === "Test") {
                                const sessionOvers = m.tournament.oversPerSession || 30;
                                const currentInningsScore = m.currentInnings === 1 ? s1 : s2;
                                if (currentInningsScore) {
                                    const overs = currentInningsScore.overs || 0;
                                    if (overs > 0 && Number.isInteger(overs) && overs % sessionOvers === 0) {
                                        if (m.testSession === 2) testBreakStatus = "Lunch";
                                        else if (m.testSession === 3) testBreakStatus = "Tea";
                                        else if (m.testSession === 1) testBreakStatus = `Stumps`;
                                        else testBreakStatus = "Break";
                                    }
                                }
                            }

                            results.push({
                                _id: m._id,
                                tournamentName: t.name,
                                homeTeamName: m.homeTeam?.name || "Team A",
                                homeTeamLogo: m.homeTeam?.logo,
                                awayTeamName: m.awayTeam?.name || "Team B",
                                awayTeamLogo: m.awayTeam?.logo,
                                homeScore: s1 ? `${s1.runs}/${s1.wickets} (${fmtOv(s1.overs)})` : "-",
                                awayScore: s2 ? `${s2.runs}/${s2.wickets} (${fmtOv(s2.overs)})` : "-",
                                status: m.status,
                                tournamentId: t._id,
                                testBreakStatus
                            });
                        }
                    } catch {
                        // ignore individual failures
                    }
                })
            );
            setMatches(results);
        };

        fetchAll();
        const interval = setInterval(fetchAll, 15000);
        return () => clearInterval(interval);
    }, [followed, tournamentList]);

    return matches;
};
