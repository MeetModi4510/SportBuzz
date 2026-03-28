import React, { useMemo, useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import {
    Newspaper, TrendingUp, Trophy, Users, Calendar,
    Sparkles, MessageCircle, ArrowRight, Quote, Globe, X,
    Share2, Bookmark, Clock, BarChart3, Loader2
} from "lucide-react";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription
} from "@/components/ui/dialog";
import { Tournament, Team, Match, Ball } from "@/data/scoringTypes";
import { Button } from '@/components/ui/button';
import { customMatchApi } from '@/services/api';
interface NewsItem {
    id: string;
    type: 'match' | 'milestone' | 'editorial' | 'upcoming';
    headline: string;
    content: string; // Brief for card
    extendedContent: string[]; // Detailed paragraphs for modal
    timestamp: string;
    image?: string;
    tags: string[];
    importance: 'high' | 'medium' | 'low';
    stats?: {
        label: string;
        value: string;
        subValue?: string;
    }[];
}

interface MatchPerformer {
    name: string;
    runs: number;
    balls: number;
    sr?: number;
    wickets?: number;
    overs?: string;
    economy?: number;
}

interface MatchStats {
    teamStats: {
        [teamId: string]: {
            topBatsmen: MatchPerformer[];
            topBowlers: MatchPerformer[];
            bestPerformer: any;
        }
    };
    inningsStats: {
        totalRuns: number;
        totalWickets: number;
        overs: string;
    }[];
}

export const TournamentNewsTab = ({
    tournament,
    matches,
    teams,
    stats
}: {
    tournament: Tournament,
    matches: Match[],
    teams: Team[],
    stats: any
}) => {
    const [selectedNewsItem, setSelectedNewsItem] = useState<NewsItem | null>(null);
    const [matchPerformers, setMatchPerformers] = useState<Record<string, MatchStats>>({});
    const [loadingMatches, setLoadingMatches] = useState<Set<string>>(new Set());

    const calculateMatchStats = (balls: Ball[], match: Match): MatchStats => {
        const teamStats: Record<string, { batMap: Record<string, any>, bowlMap: Record<string, any> }> = {};
        
        if (match.homeTeam?._id) teamStats[match.homeTeam._id] = { batMap: {}, bowlMap: {} };
        if (match.awayTeam?._id) teamStats[match.awayTeam._id] = { batMap: {}, bowlMap: {} };

        // We deduce batting team by assuming homeTeam bats first (Inning 1), away bats second (Inning 2).
        // A better heuristic: we check what team won the toss and decision, but for stats, we will look at `ball.team` if available,
        // or just use innings fallback if not available (Standard: Innings 1 = Team 1, Innings 2 = Team 2).
        // Let's use `tossWinner` and `decision` if possible to determine batting order.
        let team1Id = match.homeTeam?._id || "";
        let team2Id = match.awayTeam?._id || "";
        
        if (match.toss && match.toss.win && match.toss.decision) {
            if (match.toss.decision === 'Batting') {
                team1Id = match.toss.win;
                team2Id = match.toss.win === match.homeTeam?._id ? match.awayTeam?._id || "" : match.homeTeam?._id || "";
            } else {
                team2Id = match.toss.win;
                team1Id = match.toss.win === match.homeTeam?._id ? match.awayTeam?._id || "" : match.homeTeam?._id || "";
            }
        }

        const innings: { runs: number, wickets: number, balls: number }[] = [
            { runs: 0, wickets: 0, balls: 0 },
            { runs: 0, wickets: 0, balls: 0 }
        ];

        balls.forEach(ball => {
            const innIdx = ball.inning - 1;
            if (innIdx < 0 || innIdx > 1) return;

            const battingTeamId = innIdx === 0 ? team1Id : team2Id;
            const bowlingTeamId = innIdx === 0 ? team2Id : team1Id;

            innings[innIdx].runs += ball.totalBallRuns;
            if (ball.wicket?.isWicket) innings[innIdx].wickets += 1;
            if (ball.extraType !== 'wide' && ball.extraType !== 'noball') innings[innIdx].balls += 1;

            if (ball.batsman && teamStats[battingTeamId]) {
                const isTeamName = teams.some(t => t.name === ball.batsman || t.acronym === ball.batsman);
                if (!isTeamName) {
                    const batMap = teamStats[battingTeamId].batMap;
                    if (!batMap[ball.batsman]) batMap[ball.batsman] = { runs: 0, balls: 0 };
                    if (ball.extraType === 'none' || ball.extraType === 'noball') {
                        batMap[ball.batsman].runs += ball.runs;
                    }
                    if (ball.extraType !== 'wide') {
                        batMap[ball.batsman].balls += 1;
                    }
                }
            }

            if (ball.bowler && teamStats[bowlingTeamId]) {
                const isTeamName = teams.some(t => t.name === ball.bowler || t.acronym === ball.bowler);
                if (!isTeamName) {
                    const bowlMap = teamStats[bowlingTeamId].bowlMap;
                    if (!bowlMap[ball.bowler]) bowlMap[ball.bowler] = { runs: 0, balls: 0, wickets: 0 };
                    if (ball.extraType !== 'bye' && ball.extraType !== 'legbye') {
                        bowlMap[ball.bowler].runs += ball.totalBallRuns;
                    }
                    if (ball.extraType !== 'wide' && ball.extraType !== 'noball') bowlMap[ball.bowler].balls += 1;
                    if (ball.wicket?.isWicket) bowlMap[ball.bowler].wickets += 1;
                }
            }
        });

        const fmtOv = (b: number) => `${Math.floor(b / 6)}.${b % 6}`;

        const processMap = (tId: string) => {
            if (!teamStats[tId]) return { topBatsmen: [], topBowlers: [], bestPerformer: null };
            
            const playerPoints: Record<string, { name: string, points: number, runs: number, wickets: number }> = {};

            const topBatsmen = Object.entries(teamStats[tId].batMap)
                .map(([name, s]: any) => {
                    if (!playerPoints[name]) playerPoints[name] = { name, points: 0, runs: 0, wickets: 0 };
                    playerPoints[name].runs = s.runs;
                    playerPoints[name].points += s.runs;
                    return {
                        name, runs: s.runs, balls: s.balls, sr: s.balls > 0 ? parseFloat(((s.runs / s.balls) * 100).toFixed(1)) : 0
                    };
                })
                .filter(Boolean)
                .sort((a, b) => b.runs - a.runs);
                
            const topBowlers = Object.entries(teamStats[tId].bowlMap)
                .map(([name, s]: any) => {
                    if (!playerPoints[name]) playerPoints[name] = { name, points: 0, runs: 0, wickets: 0 };
                    playerPoints[name].wickets = s.wickets;
                    playerPoints[name].points += (s.wickets * 25);
                    return {
                        name, runs: s.runs, balls: s.balls, wickets: s.wickets, overs: fmtOv(s.balls), 
                        economy: s.balls > 0 ? parseFloat((s.runs / (s.balls / 6)).toFixed(2)) : 0
                    };
                })
                .filter(Boolean)
                .sort((a, b) => b.wickets - a.wickets || a.economy - b.economy);

            const bestPerformer = Object.values(playerPoints).sort((a, b) => b.points - a.points)[0] || null;
                
            return { topBatsmen, topBowlers, bestPerformer };
        };

        return {
            teamStats: {
                [team1Id]: processMap(team1Id),
                [team2Id]: processMap(team2Id),
            },
            inningsStats: innings.map(i => ({
                totalRuns: i.runs,
                totalWickets: i.wickets,
                overs: fmtOv(i.balls)
            }))
        };
    };

    // Fetch balls for completed matches to get real performers
    useEffect(() => {
        const completedMatches = matches.filter(m => m.status === 'Completed' && !matchPerformers[m._id]);

        const fetchAll = async () => {
            for (const match of completedMatches) {
                if (loadingMatches.has(match._id)) continue;

                setLoadingMatches(prev => new Set(prev).add(match._id));
                try {
                    const res = await customMatchApi.getBalls(match._id);
                    const balls: Ball[] = res.data || [];
                    const stats = calculateMatchStats(balls, match);
                    setMatchPerformers(prev => ({ ...prev, [match._id]: stats }));
                } catch (err) {
                    console.error(`Failed to fetch balls for match ${match._id}:`, err);
                } finally {
                    setLoadingMatches(prev => {
                        const next = new Set(prev);
                        next.delete(match._id);
                        return next;
                    });
                }
            }
        };

        if (completedMatches.length > 0) {
            fetchAll();
        }
    }, [matches]);

    const news = useMemo(() => {
        const items: NewsItem[] = [];
        const completedMatches = matches.filter(m => m.status === 'Completed');
        const liveMatches = matches.filter(m => m.status === 'Live');

        // Helper to get random players
        const getRandomPlayers = (team: Team, count: number) => {
            const players = team.players || [];
            const names = players.map(p => typeof p === 'string' ? p : p.name);
            return names.sort(() => 0.5 - Math.random()).slice(0, count);
        };

        // Helper to get random template
        const getTemplate = (templates: string[][]) => templates[Math.floor(Math.random() * templates.length)];

        // 1. Lead-up News
        // ... (lines 211-233)
        const welcomeTemplates = [
            [
                `The highly anticipated ${tournament.name} has officially commenced. With ${teams.length} top-tier teams competing in the ${tournament.format} format, fans are expecting a masterclass of cricket over the coming weeks. The tournament promises to be a spectacle of skill, strategy, and sportsmanship. Early predictions show high engagement across all digital platforms, with fans eager to see their favorite stars in action.`,
                `This year's edition brings several innovations in broadcasting and fan engagement, including real-time AI-driven tactical insights provided directly to viewers. The opening ceremony at the main stadium set a festive tone, celebrating the diversity and spirit of the sport.`,
                `Tournament Director stated: "We've worked tirelessly to ensure this tournament sets a new standard for leagues. The level of talent on display is truly international, and we expect many records to fall over the next month."`,
                `Early favorites include ${teams[0]?.name} and ${teams[1]?.name || 'the defending champions'}, but in this format, any team can pull off an upset on their day. Tactical flexibility and depth in the bowling department will be the decider.`,
                `As the sun sets on the first day, the atmosphere is electric. Fans from across the region have converged to witness what many are calling the definitive cricket event of the season. Coverage starts daily from 10:00 AM local time.`
            ]
        ];

        const welcomeExt = getTemplate(welcomeTemplates);

        items.push({
            id: 'n-welcome',
            type: 'editorial',
            headline: `${tournament.name} Kicks Off in Grand Style`,
            content: `The highly anticipated ${tournament.name} has officially commenced with ${teams.length} top-tier teams.`,
            extendedContent: welcomeExt,
            timestamp: tournament.startDate,
            tags: ['Announcement', 'Tournament', 'Grand Opening'],
            importance: 'high'
        });

        // 2. Completed Match News
        completedMatches.forEach((match, idx) => {
            const winnerId = (match.result as any)?.winner;
            const winningTeam = teams.find(t => t._id === winnerId);
            const losingTeam = teams.find(t => t._id === (winnerId === match.homeTeam?._id ? match.awayTeam?._id : match.homeTeam?._id));

            if (winningTeam && losingTeam) {
                const margin = (match.result as any)?.margin || "a convincing margin";
                const perf = matchPerformers[match._id];

                const winningStats = perf?.teamStats?.[winningTeam._id];
                const losingStats = perf?.teamStats?.[losingTeam._id];

                const topScorerRaw = winningStats?.topBatsmen[0];
                const topScorer = topScorerRaw ? `${topScorerRaw.name} (${topScorerRaw.runs})` : "the top order";
                
                const topBowlerRaw = winningStats?.topBowlers[0];
                const topBowler = topBowlerRaw ? `${topBowlerRaw.name} (${topBowlerRaw.wickets}/${topBowlerRaw.runs})` : "the bowling unit";
                
                const keySupport = winningStats?.topBatsmen[1]?.name || "a collective effort";
                const opposition = losingStats?.topBatsmen[0]?.name || "the opposition";

                // MVP Calculation
                const matchMVPDetails = winningStats?.bestPerformer;
                const matchMVPValue = matchMVPDetails ? `${matchMVPDetails.name} (${matchMVPDetails.runs} runs, ${matchMVPDetails.wickets} wkts)` : (topScorerRaw ? `${topScorerRaw.name} (${topScorerRaw.runs})` : "Team Effort");

                // Ensure margin doesn't trigger "by won by"
                const cleanMargin = margin.toLowerCase().startsWith('won by') ? margin.substring(7).trim() : margin;

                const matchTemplates = [
                    {
                        headline: `${winningTeam.acronym || winningTeam.name} Dominate ${losingTeam.acronym || losingTeam.name} to Secure Critical Points`,
                        paragraphs: [
                            `In a clinical display of skill, ${winningTeam.name} defeated ${losingTeam.name} by ${cleanMargin}. The match showcased exceptional tactical discipline from the victors, who now climb the ladder in this competitive ${tournament.name}. ${topScorerRaw ? `Key performances from ${topScorer} and ${keySupport} proved too much for the opposition.` : `A solid team performance saw several players contributing at crucial moments to seal the result.`}`,
                            `The turning point of the game was the middle-overs phase, where ${topBowlerRaw ? `${topBowler}'s spell capitalized on a dry surface to restrict scoring.` : `a disciplined bowling performance restricted the flow of runs, creating pressure that ultimately forced multiple errors.`} The captain's rotation of bowlers was particularly praised by commentators, keeping the batting side guessing throughout their innings. ${opposition} tried to provide resistance but lacked support from the other end.`,
                            `For ${losingTeam.name}, the loss serves as a wake-up call. Despite a late-order surge, the mountain of runs proved too steep to climb. Tactical adjustments in the top order are expected for their next outing if they wish to remain in contention for the knockouts.`,
                            `Statistical analysts noted that ${winningTeam.acronym}'s execution in the death overs was near-perfect. This efficiency under pressure is becoming a hallmark of their campaign this season.`,
                            `${topScorerRaw ? `The post-match presentation saw ${topScorerRaw.name} taking home the honours for a brilliant contribution.` : `The match showcased the depth of ${winningTeam.name}'s squad, with various players stepping up when needed.`} Looking ahead, ${winningTeam.name} will look to carry this momentum into their next fixture, while ${losingTeam.name} must regroup quickly to address their inconsistencies.`
                        ]
                    },
                    {
                        headline: `Tactical Masterclass: How ${winningTeam.name} Outsmarted ${losingTeam.name}`,
                        paragraphs: [
                            `The encounter between ${winningTeam.name} and ${losingTeam.name} was touted as the battle of strategies, and it lived up to the hype. Ultimately, ${winningTeam.name} emerged victorious by ${cleanMargin}, thanks to a brilliant tactical setup ${topScorerRaw ? `led by the performance of ${topScorer}` : `that focused on exploiting the opposition's weaknesses`}.`,
                            `${topScorerRaw ? `${topScorer} set the tone early with an aggressive approach, dismantling the bowling attack of ${losingTeam.name}.` : `The top order set the tone early with a measured approach, laying a strong foundation for the middle order to capitalize upon.`} Despite the best efforts of the opposition bowlers who claimed early breakthroughs, the middle order of ${winningTeam.acronym} held firm to post a formidable total.`,
                            `In response, ${losingTeam.name} struggled to find rhythm against ${topBowlerRaw ? `the pace and precision of ${topBowler}` : `a high-intensity bowling attack`}. Each time ${opposition} attempted to shift gears, a wicket fell, breaking the momentum of the chase. The discipline shown by the ${winningTeam.name} fielding unit further suffocated any comeback attempts.`,
                            `This victory propels ${winningTeam.name} into the top tier of the points table, solidifying their status as tournament heavyweights. The synergy between the veterans and the young talent is proving to be a winning formula for the side.`,
                            `The ${tournament.name} continues to deliver high-quality cricket, and this match was a testament to the rising standards of the league. Fans left the stadium with plenty to discuss, particularly regarding the late-game decisions that tipped the scales in favour of ${winningTeam.acronym}.`
                        ]
                    },
                    {
                        headline: `Clinical Finish! ${winningTeam.acronym} Overpower ${losingTeam.acronym} In High-Stakes Clash`,
                        paragraphs: [
                            `Intensity was at its peak as ${winningTeam.name} faced off against ${losingTeam.name}. In a match that swayed back and forth, ${winningTeam.name} eventually claimed a decisive win by ${cleanMargin}. ${topScorerRaw ? `${topScorerRaw.name} played a pivotal role, anchoring the innings with maturity.` : `It was a total team effort that saw the victors navigate through difficult phases of the game.`}`,
                            `The ${losingTeam.name} bowling unit struggled to contain the flow of boundaries once ${winningTeam.name} established their grip on the match. ${topBowlerRaw ? `${topBowler}'s contribution in the second half of the match was particularly noteworthy, dismantling the tail efficiently.` : `The bowling unit's collective discipline during the second half of the match effectively ended any hope for an opposition comeback.`}`,
                            `Pundits were impressed by ${winningTeam.acronym}'s ability to read the pitch conditions early on. Their decision-making at the toss and the subsequent execution of their game plan left ${losingTeam.name} searching for answers. ${opposition} showed flashes of brilliance but it wasn't enough to change the outcome.`,
                            `With this win, ${winningTeam.name} has sent a clear message to the rest of the teams in the tournament. Their balanced lineup and mental toughness make them a formidable opponent for anyone.`,
                            `As the tournament progresses, the race for the top spots is heating up. ${winningTeam.name} look poised to secure a high seed, while ${losingTeam.name} will need to find a way to bounce back in their next high-stakes encounter.`
                        ]
                    },
                    {
                        headline: `Power Performance: ${winningTeam.name} Secure Big Win Against ${losingTeam.name}`,
                        paragraphs: [
                            `Fans were treated to a spectacle of power-hitting and precision bowling as ${winningTeam.name} defeated ${losingTeam.name} by ${cleanMargin}. The victory was a result of superior execution in all departments of the game, leaving the spectators in awe of the winning side's prowess.`,
                            `${topScorerRaw ? `${topScorerRaw.name} was the star of the show, dispatching the ball to all parts of the ground.` : `The batting department fired in unison, posting a total that eventually proved too much for the opposition to chase.`} ${topBowlerRaw ? `This was followed by a lethal opening spell from ${topBowlerRaw.name}, who removed key wickets early.` : `The bowlers followed up with a disciplined performance, consistently hitting the right channels and forcing mistakes.`}`,
                            `The match highlights included some spectacular catches and athletic efforts in the field by ${winningTeam.name}. Such moments often define results in modern cricket, and today was no exception. ${opposition} struggled to keep pace with the high tempo set by the winners.`,
                            `${winningTeam.acronym}'s coach expressed satisfaction with the team's performance, noting that the hard work in the training camps is starting to pay off. The focus now shifts to maintaining this high level of consistency throughout the grueling tournament schedule.`,
                            `For the fans, it was a day to remember as their team dominated from start to finish. ${winningTeam.name}'s fans are already looking forward to the next match, hoping for a repeat of today's exceptional performance.`
                        ]
                    },
                    {
                        headline: `Defensive Masterclass as ${winningTeam.acronym} Stun ${losingTeam.acronym}`,
                        paragraphs: [
                            `In a match dominated by the ball, ${winningTeam.name} showed incredible grit to defeat ${losingTeam.name} by ${cleanMargin}. It wasn't the highest-scoring encounter, but the tactical battle and the pressure exerted by the bowlers made it a captivating watch for the purists.`,
                            `${topBowlerRaw ? `${topBowlerRaw.name} was the architect of the win, finishing with figures of ${topBowlerRaw.wickets}/${topBowlerRaw.runs}.` : `A collective bowling effort lead by disciplined lines and lengths made run-scoring a difficult task for the opposition.`} Early wickets put ${losingTeam.name} on the back foot, and they never quite recovered from the initial slump.`,
                            `${topScorerRaw ? `Earlier in the day, ${topScorerRaw.name} played a crucial knock that gave the bowlers enough to defend.` : `The batsmen ground out a competitive total on a challenging surface, showing the kind of character that wins championships.`} ${opposition} found it difficult to rotate the strike, falling prey to the relentless pressure applied by the ${winningTeam.acronym} fielders.`,
                            `This win highlights the importance of having a strong bowling unit in the tournament. ${winningTeam.name} have proven that they can win games even when their batting doesn't fully fire, making them a very dangerous side.`,
                            `The post-match analysis focused on the bowling variations used by ${winningTeam.name}. Their ability to adapt to the slowing pitch was the decisive factor in today's outcome, earning them a well-deserved victory.`
                        ]
                    },
                    {
                        headline: `Upset Alert! ${winningTeam.name} Claim Magnificent Victory Over ${losingTeam.name}`,
                        paragraphs: [
                            `The tournament saw one of its most surprising results today as ${winningTeam.name} overcame the odds to defeat ${losingTeam.name} by ${cleanMargin}. The underdog story continues to be one of the most compelling narratives in ${tournament.name}, and today added a brilliant new chapter.`,
                            `${topScorerRaw ? `${topScorerRaw.name} epitomized the spirit of the side, taking the attack to the opposition without any fear.` : `The team played with a sense of freedom and purpose, catching ${losingTeam.name} off guard with their aggressive intent.`} The victory has blown the points table wide open, making the race for the playoffs even more unpredictable.`,
                            `${topBowlerRaw ? `${topBowlerRaw.name}'s key breakthroughs at critical moments silenced the opposition fans.` : `Crucial wickets at key intervals ensured that ${losingTeam.name} could never build the big partnerships required to win the match.`} ${opposition} seemed caught in two minds throughout the chase, eventually folding under the pressure of the occasion.`,
                            `This win will go down as one of the highlights of the season for ${winningTeam.acronym}. It's a reminder that on their day, any team can beat anyone, provided they believe in their strategy and execute it with conviction.`,
                            `As the dust settles on this magnificent victory, ${winningTeam.name} will be celebrating a job well done. They've earned the respect of their peers and the adulation of their fans with a performance that will be remembered for a long time.`
                        ]
                    }
                ];

                const template = matchTemplates[idx % matchTemplates.length];

                items.push({
                    id: `n-match-${match._id}`,
                    type: 'match',
                    headline: template.headline,
                    content: `In a clinical display of skill, ${winningTeam.name} defeated ${losingTeam.name} by ${cleanMargin}.`,
                    extendedContent: template.paragraphs,
                    stats: [
                        { label: "Winner", value: winningTeam.name, subValue: winningTeam.acronym },
                        { label: "Defeated", value: losingTeam.name, subValue: losingTeam.acronym },
                        { label: "Margin", value: cleanMargin.toLowerCase().startsWith('won by') ? cleanMargin : `won by ${cleanMargin}` },
                        { label: "Match MVP", value: matchMVPValue },
                        { label: "Best Bowler", value: topBowlerRaw ? `${topBowlerRaw.name} (${topBowlerRaw.wickets}/${topBowlerRaw.runs})` : "Disciplined Attack" }
                    ],
                    timestamp: match.date || new Date().toISOString(),
                    tags: ['Match Report', winningTeam.name, 'Result', 'Performance'],
                    importance: 'high'
                });
            }
        });

        // 3. Live Match Alerts
        liveMatches.forEach(match => {
            const homePlayers = getRandomPlayers(match.homeTeam, 2);
            const awayPlayers = getRandomPlayers(match.awayTeam, 2);

            items.push({
                id: `n-live-${match._id}`,
                type: 'upcoming',
                headline: `Thriller in Progress: ${match.homeTeam?.name} vs ${match.awayTeam?.name}`,
                content: `Eyes are glued to the screen as ${match.homeTeam?.name} and ${match.awayTeam?.name} battle it out.`,
                extendedContent: [
                    `Eyes are glued to the screen as ${match.homeTeam?.name} and ${match.awayTeam?.name} battle it out in a high-stakes encounter. Current indicators suggest a nail-biting finish at ${match.venue}. ${homePlayers[0]} and ${awayPlayers[0]} are currently central to the unfolding drama.`,
                    `Live Win Probabilities are swinging wildly with every boundary. The home crowd is in full voice, creating an electrifying atmosphere that is clearly affecting on-field concentration. The tactical battle between the two captains in the death overs will surely decide the outcome.`,
                    `Scorers and analysts are noting several key matchups, particularly the contest between ${homePlayers[1]} and ${awayPlayers[1]}. This match has all the hallmarks of a tournament classic, with individual brilliance shining through in high-pressure moments.`,
                    `The pitch has started to show some signs of variable bounce, making the task even more challenging for the batting side. Every single run is being fought for, with the fielders diving across the turf to save everything possible.`,
                    `As the light begins to fade, the intensity only increases. This is cricket at its most raw and competitive, where one moment of brilliance or a single mistake can change everything. Stay tuned for the final outcome of this epic clash.`
                ],
                stats: [
                    { label: "Home Team", value: match.homeTeam?.name || "TBA" },
                    { label: "Away Team", value: match.awayTeam?.name || "TBA" },
                    { label: "Key Batsman", value: homePlayers[0] },
                    { label: "Key Bowler", value: awayPlayers[0] }
                ],
                timestamp: new Date().toISOString(),
                tags: ['Live', 'Breaking', 'Viral'],
                importance: 'medium'
            });
        });

        // 4. Milestone News
        if (completedMatches.length > 0) {
            const topBatsman = stats?.topRuns?.[0];
            const topBowler = stats?.topWickets?.[0];
            const mostSixes = stats?.sixes?.[0];

            const recordHolders = getRandomPlayers(teams[0], 2);
            const mainHero = topBatsman ? `${topBatsman.name} (${topBatsman.runs} runs)` : recordHolders[0];
            const bowlingHero = topBowler ? `${topBowler.name} (${topBowler.wickets} wickets)` : recordHolders[1];

            items.push({
                id: 'n-milestone-gen',
                type: 'milestone',
                headline: topBatsman ? `${topBatsman.name} Leads the Charge as Tournament Records Fall` : `Tournament Stats Surge: Records Shattered in Opening Rounds`,
                content: `${tournament.name} is proving to be one of the highest-scoring editions, led by exceptional individual performances.`,
                extendedContent: [
                    `Statistically, ${tournament.name} is proving to be one of the highest-scoring editions in recent history. Analysts point towards the aggressive batting powerplay as the key factor behind the scoring surge. With average first-innings scores exceeding expectations, the tournament is setting new benchmarks for ${tournament.matchType} cricket.`,
                    `The leaderboard is currently dominated by ${mainHero}, who has been instrumental in this shift, displaying an array of modern shots that have left fielders scrambling. On the bowling front, ${bowlingHero} has been the standout performer, providing clinical breakthroughs under pressure.`,
                    `Deep data analysis suggests that teams batting first have a slight statistical advantage, though chasing has become more viable with the dew factor coming into play in evening fixtures. ${topBatsman?.name || 'The top order'} remains the current focus of tactical discussions in every dugout.`,
                    `The strike rate among the top ten batsmen is currently at an all-time high, suggesting that the balance has tilted significantly towards the willow. Bowlers are struggling to maintain economies, a rarity in previous editions of the tournament.`,
                    `As we head into the next phase, the 'Race to the Playoffs' is tightening. With record numbers of sixes already hit${mostSixes ? `, led by ${mostSixes.name}` : ''}, the tournament is firmly established as a haven for aggressive, high-risk-high-reward cricket.`
                ],
                stats: [
                    { label: "Top Scorer", value: (topBatsman?.name || "").split(' ')[0] || "TBA", subValue: topBatsman?.runs ? `${topBatsman.runs} Runs` : "" },
                    { label: "Top Bowler", value: (topBowler?.name || "").split(' ')[0] || "TBA", subValue: topBowler?.wickets ? `${topBowler.wickets} Wickets` : "" },
                    { label: "Stat Hero", value: (mainHero || "").split(' (')[0] || "TBA" },
                    { label: "Consistency", value: (bowlingHero || "").split(' (')[0] || "TBA" }
                ],
                timestamp: new Date().toISOString(),
                tags: ['Analytics', 'Powerplay', 'Stat-Watch'],
                importance: 'medium'
            });
        }

        return items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }, [tournament, matches, teams]);

    if (news.length === 0) {
        return (
            <div className="py-12 text-center bg-slate-950/20 rounded-2xl border border-slate-800">
                <Newspaper className="w-12 h-12 text-slate-700 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium text-slate-400">No News Available</h3>
                <p className="text-slate-500 mt-1">Updates will appear here as the tournament progresses.</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
            {/* Featured Hero News (Most Recent) */}
            <div className="lg:col-span-2 space-y-6">
                {news.slice(0, 1).map(item => (
                    <Card key={item.id} onClick={() => setSelectedNewsItem(item)} className="bg-slate-900 border-slate-800 overflow-hidden group hover:border-blue-500/50 transition-all duration-500 cursor-pointer">
                        <div className="aspect-[21/9] bg-gradient-to-br from-blue-600/20 via-slate-900 to-indigo-900/30 relative flex items-center justify-center">
                            <Sparkles className="absolute top-4 right-4 text-yellow-400/30" size={40} />
                            <div className="p-8 space-y-4 relative z-10 w-full">
                                <span className="bg-blue-600/80 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-lg shadow-blue-500/20">
                                    {item.type === 'match' ? 'Match Highlight' : item.type === 'upcoming' ? 'Live Alert' : 'Editorial'}
                                </span>
                                <h2 className="text-3xl md:text-4xl font-black text-white leading-tight group-hover:text-blue-400 transition-colors">
                                    {item.headline}
                                </h2>
                                <div className="flex items-center gap-4 text-slate-400 text-xs font-medium">
                                    <span className="flex items-center gap-1.5"><Calendar size={14} /> {new Date(item.timestamp).toLocaleDateString()}</span>
                                    <span className="flex items-center gap-1.5"><Globe size={14} /> Global Feed</span>
                                </div>
                            </div>
                        </div>
                        <CardContent className="p-8">
                            <p className="text-slate-300 text-lg leading-relaxed font-medium line-clamp-2">
                                {item.content}
                            </p>
                            <div className="mt-8 pt-6 border-t border-slate-800 flex items-center justify-between">
                                <div className="flex gap-2">
                                    {item.tags.map(tag => (
                                        <span key={tag} className="text-[10px] text-slate-500 bg-slate-800/50 px-2 py-1 rounded uppercase font-bold tracking-wider border border-slate-700/50">
                                            #{tag}
                                        </span>
                                    ))}
                                </div>
                                <button className="text-blue-400 hover:text-white flex items-center gap-2 text-sm font-bold group/btn">
                                    Read Full Coverage <ArrowRight size={16} className="group-hover/btn:translate-x-1 transition-transform" />
                                </button>
                            </div>
                        </CardContent>
                    </Card>
                ))}

                {/* Secondary News Stream */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {news.slice(1, 11).map(item => (
                        <Card key={item.id} onClick={() => setSelectedNewsItem(item)} className="bg-slate-900 border-slate-800/80 hover:border-slate-600 transition-all group cursor-pointer">
                            <CardContent className="p-6">
                                <div className="flex items-start justify-between mb-4">
                                    <span className={`text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-tighter ${item.type === 'milestone' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' :
                                        item.type === 'match' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' :
                                            'bg-slate-800 text-slate-400 border border-slate-700'
                                        }`}>
                                        {item.type}
                                    </span>
                                    <div className="text-[10px] text-slate-500 font-bold">{new Date(item.timestamp).toLocaleDateString()}</div>
                                </div>
                                <h3 className="text-white text-lg font-bold mb-3 leading-snug group-hover:text-blue-400 transition-colors">
                                    {item.headline}
                                </h3>
                                <p className="text-slate-400 text-xs leading-relaxed line-clamp-3">
                                    {item.content}
                                </p>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>

            {/* News Detail Dialog */}
            <Dialog open={!!selectedNewsItem} onOpenChange={() => setSelectedNewsItem(null)}>
                <DialogContent className="bg-slate-950 border-slate-800 text-white max-w-3xl p-0 overflow-hidden max-h-[90vh] flex flex-col">
                    {selectedNewsItem && (
                        <>
                            <div className="bg-gradient-to-br from-blue-900/40 via-slate-950 to-indigo-950/40 p-10 pt-16 relative">

                                <div className="flex flex-wrap gap-2 mb-6">
                                    <span className="bg-blue-600 text-white text-[10px] font-black px-3 py-1 rounded uppercase tracking-widest">
                                        {selectedNewsItem.type === 'match' ? 'Match Highlight' : selectedNewsItem.type === 'upcoming' ? 'Live Alert' : 'Editorial'}
                                    </span>
                                    <span className="bg-slate-800 text-slate-300 text-[10px] font-bold px-3 py-1 rounded uppercase tracking-widest flex items-center gap-1.5">
                                        <Clock size={12} /> 4 min read
                                    </span>
                                </div>

                                <DialogTitle className="text-3xl md:text-5xl font-black text-white leading-tight mb-6">
                                    {selectedNewsItem.headline}
                                </DialogTitle>

                                <div className="flex items-center gap-6 text-slate-400 text-xs font-bold uppercase tracking-widest">
                                    <span className="flex items-center gap-2"><Calendar size={14} className="text-blue-400" /> {new Date(selectedNewsItem.timestamp).toLocaleDateString()}</span>
                                    <span className="flex items-center gap-2"><Globe size={14} className="text-blue-400" /> Source: AI Media Engine</span>
                                </div>
                            </div>

                            <div className="p-10 overflow-y-auto flex-1 custom-scrollbar">
                                <div className="flex items-center gap-4 mb-8 pb-8 border-b border-slate-800">
                                    <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 flex items-center justify-center font-black text-white shadow-lg shadow-blue-500/20">
                                        AI
                                    </div>
                                    <div>
                                        <p className="text-white font-black text-sm uppercase tracking-wide">Authored by SportBuzz AI</p>
                                        <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Lead Sportswriter & Data Analyst</p>
                                    </div>
                                    <div className="ml-auto flex gap-2">
                                        <Button variant="outline" size="sm" className="bg-slate-900 border-slate-700 text-xs font-bold hover:bg-slate-800">
                                            <Bookmark size={14} className="mr-2" /> Save
                                        </Button>
                                        <Button variant="outline" size="sm" className="bg-slate-900 border-slate-700 text-xs font-bold hover:bg-slate-800">
                                            <Share2 size={14} className="mr-2" /> Share
                                        </Button>
                                    </div>
                                </div>

                                <div className="prose prose-invert max-w-none">
                                    {(selectedNewsItem.extendedContent || []).map((paragraph, idx) => (
                                        <p key={idx} className={`text-slate-200 text-lg leading-relaxed mb-6 ${idx === 0 ? 'text-xl font-medium first-letter:text-5xl first-letter:font-black first-letter:mr-3 first-letter:float-left first-letter:text-blue-500' : ''}`}>
                                            {paragraph}
                                        </p>
                                    ))}

                                    {selectedNewsItem.stats && selectedNewsItem.stats.length > 0 && (
                                        <div className="my-10 p-8 bg-slate-900/80 border border-slate-700/50 rounded-2xl shadow-inner">
                                            <h5 className="text-white text-xs font-black uppercase tracking-widest mb-6 flex items-center gap-2">
                                                <BarChart3 size={16} className="text-blue-400" /> Key Performance Metrics
                                            </h5>
                                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                                                {(selectedNewsItem.stats || []).map((stat, idx) => (
                                                    <div key={idx} className="space-y-1">
                                                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{stat.label}</p>
                                                        <p className="text-xl font-black text-white">{stat.value}</p>
                                                        {stat.subValue && <p className="text-[10px] text-blue-400/70 font-bold">{stat.subValue}</p>}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    <div className="bg-slate-900/50 border-l-4 border-blue-500 p-8 my-10 rounded-r-xl">
                                        <Quote className="text-blue-500/40 mb-4" size={32} />
                                        <p className="text-white text-xl font-bold italic leading-relaxed mb-4">
                                            "The level of intensity we're witnessing in this edition of the {tournament.name} is unprecedented. The integration of high-level analytics into on-field decision-making is clearly visible."
                                        </p>
                                        <p className="text-blue-400 text-sm font-black uppercase tracking-widest">— Match Intelligence Report</p>
                                    </div>
                                    <p className="text-slate-400 text-lg leading-relaxed">
                                        As the tournament progresses, we can expect more such high-stakes drama and record-breaking performances. Stay tuned to the SportBuzz Newsroom for exclusive coverage, deep-dive analysis, and real-time updates from every venue.
                                    </p>
                                </div>

                                <div className="mt-12 flex flex-wrap gap-2">
                                    {selectedNewsItem.tags.map(tag => (
                                        <span key={tag} className="bg-slate-800/50 text-slate-400 text-[10px] font-black px-4 py-2 rounded-lg border border-slate-700 hover:border-blue-500/30 transition-colors uppercase tracking-widest">
                                            #{tag}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}
                </DialogContent>
            </Dialog>

            {/* Sidebar: Insights & Quotes */}
            <div className="space-y-6">
                <Card className="bg-indigo-950/20 border-indigo-500/20 shadow-xl overflow-hidden relative">
                    <div className="absolute -top-4 -right-4 w-24 h-24 bg-indigo-500/10 blur-3xl rounded-full"></div>
                    <CardContent className="p-6">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center">
                                <MessageCircle size={20} className="text-indigo-400" />
                            </div>
                            <div>
                                <h4 className="text-white text-sm font-black uppercase tracking-widest">Expert Opinion</h4>
                                <p className="text-indigo-400/60 text-[10px] font-bold">INSIDER ACCESS</p>
                            </div>
                        </div>
                        <div className="relative">
                            <Quote className="absolute -top-2 -left-2 text-indigo-500/20" size={32} />
                            <p className="text-slate-200 text-sm italic leading-relaxed relative z-10 pl-4 py-2">
                                "This tournament is proving that infrastructure and data-driven captaincy are the next frontiers of global cricket. We're seeing tactical shifts mid-over that were unheard of five years ago."
                            </p>
                            <div className="mt-4 pl-4 flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-[10px] font-bold text-slate-400">JD</div>
                                <div>
                                    <p className="text-white text-xs font-bold">Julian D'Cruz</p>
                                    <p className="text-slate-500 text-[10px]">Lead Cricket Analyst</p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-slate-900 border-slate-800">
                    <CardContent className="p-6">
                        <h4 className="text-white text-sm font-black uppercase tracking-widest mb-6 flex items-center gap-2">
                            <TrendingUp size={16} className="text-emerald-400" /> Viral Moments
                        </h4>
                        <div className="space-y-5">
                            {[
                                { title: "Unbelievable catch at point goes viral", views: "1.2M", time: "2h ago" },
                                { title: "Skipper's post-match rant trends on X", views: "850K", time: "4h ago" },
                                { title: "The 'Mystery Ball' analyzed by pros", views: "2.4M", time: "8h ago" }
                            ].map((v, idx) => (
                                <div key={idx} className="flex gap-4 group cursor-pointer">
                                    <div className="w-3 h-3 rounded-full bg-slate-800 group-hover:bg-blue-500 transition-colors mt-1"></div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-slate-200 text-xs font-bold mb-1 truncate group-hover:text-white">{v.title}</p>
                                        <div className="flex gap-3 text-[10px] text-slate-500 font-medium">
                                            <span>{v.views} views</span>
                                            <span>{v.time}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};
