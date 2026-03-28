import { BarChart3 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Props {
    tournamentStats: any;
    tournamentMatches: any[];
    getPlayerTeam: (name: string) => string | null;
}

const MEDAL = ["🥇", "🥈", "🥉"];

const BATTING_CATEGORIES = [
    { key: "runs", label: "Most Runs", subLabel: "Top Scorers", valueKey: "runs", grad: "from-blue-600/20 to-blue-900/10", accent: "text-blue-400", bar: "bg-blue-500", icon: "🏏", dataKey: "topRuns" },
    { key: "avg", label: "Highest Average", subLabel: "Min 30 runs", valueKey: "val", grad: "from-sky-600/20 to-sky-900/10", accent: "text-sky-400", bar: "bg-sky-500", icon: "📈", dataKey: "bestBatAvg" },
    { key: "sr", label: "Highest Strike Rate", subLabel: "Min. 10 balls", valueKey: "sr", grad: "from-purple-600/20 to-purple-900/10", accent: "text-purple-400", bar: "bg-purple-500", icon: "⚡", dataKey: "highestSR" },
    { key: "fifties", label: "Most Fifties", subLabel: "Half Centuries", valueKey: "fifties", grad: "from-amber-600/20 to-amber-900/10", accent: "text-amber-400", bar: "bg-amber-500", icon: "5️⃣0️⃣", dataKey: "mostFifties" },
    { key: "hundreds", label: "Most Hundreds", subLabel: "Centuries", valueKey: "hundreds", grad: "from-rose-600/20 to-rose-900/10", accent: "text-rose-400", bar: "bg-rose-500", icon: "💯", dataKey: "mostHundreds" },
    { key: "fours", label: "Most Fours", subLabel: "Boundary Kings", valueKey: "fours", grad: "from-yellow-600/20 to-yellow-900/10", accent: "text-yellow-400", bar: "bg-yellow-500", icon: "4️⃣", dataKey: "topFours" },
    { key: "sixes", label: "Most Sixes", subLabel: "Big Hitters", valueKey: "sixes", grad: "from-orange-600/20 to-orange-900/10", accent: "text-orange-400", bar: "bg-orange-500", icon: "6️⃣", dataKey: "topSixes" },
];

const BOWLING_CATEGORIES = [
    { key: "wickets", label: "Top Wicket-Takers", subLabel: "Best Bowlers", valueKey: "wickets", grad: "from-red-600/20 to-red-900/10", accent: "text-red-400", bar: "bg-red-500", icon: "🎯", dataKey: "topWickets" },
    { key: "bestFig", label: "Best Bowling Figures", subLabel: "In an Innings", valueKey: "bestFigW", displayKey: "bestFigures", grad: "from-pink-600/20 to-pink-900/10", accent: "text-pink-400", bar: "bg-pink-500", icon: "✨", dataKey: "bestBowlingFigures" },
    { key: "bowlAvg", label: "Best Bowling Average", subLabel: "Min 2 wickets", valueKey: "val", grad: "from-indigo-600/20 to-indigo-900/10", accent: "text-indigo-400", bar: "bg-indigo-500", icon: "📉", dataKey: "bestBowlAvg" },
    { key: "econ", label: "Best Economy", subLabel: "Min 2 overs", valueKey: "econ", grad: "from-teal-600/20 to-teal-900/10", accent: "text-teal-400", bar: "bg-teal-500", icon: "⏱️", dataKey: "bestEcon" },
];

const FIELDING_CATEGORIES = [
    { key: "dismissals", label: "Most Dismissals", subLabel: "Overall", valueKey: "total", grad: "from-cyan-600/20 to-cyan-900/10", accent: "text-cyan-400", bar: "bg-cyan-500", icon: "🛡️", dataKey: "mostDismissals" },
    { key: "catches", label: "Most Catches", subLabel: "Best Fielders", valueKey: "catches", grad: "from-emerald-600/20 to-emerald-900/10", accent: "text-emerald-400", bar: "bg-emerald-500", icon: "🧤", dataKey: "topCatches" },
    { key: "runouts", label: "Most Runouts", subLabel: "Direct hits & Assists", valueKey: "runouts", grad: "from-lime-600/20 to-lime-900/10", accent: "text-lime-400", bar: "bg-lime-500", icon: "🏃", dataKey: "mostRunouts" },
];

const MVP_CATEGORIES = [
    { key: "mvp", label: "Tournament MVP Points", subLabel: "Overall Impact", valueKey: "total", grad: "from-amber-600/20 to-yellow-900/10", accent: "text-yellow-400", bar: "bg-yellow-500", icon: "⭐", dataKey: "mvpRankings" }
];

const TournamentStatsTab = ({ tournamentStats, tournamentMatches, getPlayerTeam }: Props) => {
    const completedMatches = tournamentMatches.filter(m => m.status === "Completed").length;

    if (!tournamentStats) {
        return (
            <div className="py-16 text-center bg-slate-900/50 rounded-2xl border-2 border-dashed border-slate-800 mt-6">
                <BarChart3 className="w-12 h-12 text-slate-700 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-400">No stats yet</h3>
                <p className="text-slate-500 mt-1 text-sm">Stats are generated once matches are scored.</p>
            </div>
        );
    }

    const renderMvpTab = () => {
        const mvps = tournamentStats?.mvpRankings || [];
        if (mvps.length === 0) return <div className="py-12 text-center text-slate-500">No MVP data available yet.</div>;
        
        const top3 = mvps.slice(0, 3);
        const rest = mvps.slice(3, 15);

        const PodiumCard = ({ player, rank }: { player: any, rank: number }) => {
            if (!player) return <div className="flex-1 min-w-[30%]"></div>;
            
            const isFirst = rank === 1;
            const team = getPlayerTeam(player.name) || "Independent";
            
            // Subtle, premium gradients based on rank
            const bgClass = isFirst ? "bg-gradient-to-b from-amber-500/10 via-amber-900/10 to-transparent border-amber-500/30" : 
                            rank === 2 ? "bg-gradient-to-b from-slate-200/10 via-slate-700/10 to-transparent border-slate-400/20" : 
                            "bg-gradient-to-b from-orange-400/10 via-orange-900/10 to-transparent border-orange-400/20";
            
            const textClass = isFirst ? "text-amber-400" : rank === 2 ? "text-slate-300" : "text-orange-400";
            const heightClass = isFirst ? "h-52 sm:h-56" : "h-44 sm:h-48 mt-6 sm:mt-8";
            const medal = isFirst ? "🥇" : rank === 2 ? "🥈" : "🥉";

            return (
                <div className={`flex flex-col items-center flex-1 relative ${isFirst ? 'z-10 -mx-2 sm:-mx-4 shadow-2xl shadow-amber-900/20 scale-105' : 'z-0 opacity-95'}`}>
                    <div className="mb-2 relative w-full flex justify-center">
                        <div className={`rounded-full flex items-center justify-center border-[3px] bg-slate-900 shadow-xl ${isFirst ? 'w-16 h-16 sm:w-20 sm:h-20 border-amber-400' : 'w-14 h-14 sm:w-16 sm:h-16 border-slate-600'}`}>
                           <span className={`${isFirst ? 'text-xl sm:text-2xl' : 'text-lg sm:text-xl'} font-black text-slate-200 tracking-tighter`}>
                               {(player.name || "").substring(0, 2).toUpperCase()}
                           </span>
                        </div>
                        <div className={`absolute -bottom-2 ${isFirst ? 'text-2xl' : 'text-xl'} drop-shadow-lg`}>{medal}</div>
                    </div>
                    
                    <div className={`w-full rounded-2xl border-t border-l border-r backdrop-blur-md p-3 sm:p-4 flex flex-col items-center justify-between ${bgClass} ${heightClass}`}>
                        <div className="text-center w-full mt-1">
                            <h3 className={`font-bold truncate w-full ${isFirst ? 'text-base sm:text-lg text-white' : 'text-xs sm:text-sm text-slate-200'}`}>{player.name}</h3>
                            <p className="text-[8px] sm:text-[9px] text-slate-500 uppercase tracking-widest truncate w-full">{team}</p>
                        </div>
                        
                        <div className="text-center w-full mb-1">
                             <div className={`text-3xl sm:text-4xl font-black tracking-tighter leading-none ${textClass}`}>{player.total}</div>
                             <div className="text-[8px] sm:text-[9px] font-bold text-slate-500 uppercase tracking-[0.2em] mt-1">Points</div>
                        </div>

                        <div className="w-full flex justify-between gap-1 text-[8px] sm:text-[10px] font-medium bg-slate-950/50 rounded-lg p-1.5 border border-white/5">
                            <div className="text-center w-1/3"><span className="text-slate-500 block text-[6px] sm:text-[7px] uppercase tracking-wider">Bat</span><span className="text-slate-300 font-semibold">{player.bat}</span></div>
                            <div className="text-center w-1/3 border-x border-white/10"><span className="text-slate-500 block text-[6px] sm:text-[7px] uppercase tracking-wider">Bowl</span><span className="text-slate-300 font-semibold">{player.bowl}</span></div>
                            <div className="text-center w-1/3"><span className="text-slate-500 block text-[6px] sm:text-[7px] uppercase tracking-wider">Fld</span><span className="text-slate-300 font-semibold">{player.field}</span></div>
                        </div>
                    </div>
                </div>
            );
        };

        return (
            <div className="space-y-8 mt-6 fade-in pb-8">
                {/* Podium Section */}
                <div className="px-2 sm:px-4 py-8 sm:py-10 bg-slate-900/30 rounded-3xl border border-slate-800/60 mx-auto max-w-4xl relative overflow-hidden backdrop-blur-sm shadow-lg">
                    <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-amber-500/30 to-transparent"></div>
                    <div className="text-center mb-10 relative z-20">
                        <span className="bg-amber-500/10 text-amber-500 border border-amber-500/20 px-4 py-1 rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-[0.2em] shadow-sm">
                            Man of the Series
                        </span>
                        <h2 className="text-2xl sm:text-3xl font-black text-slate-100 mt-4 tracking-tight">Tournament MVP Podium</h2>
                    </div>

                    <div className="flex items-end justify-center px-1 sm:px-6 relative mt-10 max-w-3xl mx-auto">
                        <PodiumCard player={top3[1]} rank={2} />
                        <PodiumCard player={top3[0]} rank={1} />
                        <PodiumCard player={top3[2]} rank={3} />
                    </div>
                </div>

                {/* Rest of the Leaderboard */}
                {rest.length > 0 && (
                    <div className="max-w-4xl mx-auto">
                        <h3 className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 px-2">Other Contenders</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {rest.map((player: any, idx: number) => {
                                const rank = idx + 4;
                                return (
                                    <div key={idx} className="bg-slate-900/40 border border-slate-800/80 rounded-xl p-3 sm:p-4 flex items-center gap-3 hover:bg-slate-800/80 hover:border-slate-700 transition-all group">
                                        <div className="w-7 h-7 rounded-full bg-slate-800/80 flex items-center justify-center text-slate-400 font-bold text-[10px] border border-slate-700/50 group-hover:bg-slate-700 group-hover:text-amber-400 group-hover:border-amber-500/30 transition-colors">
                                            {rank}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="text-slate-200 font-bold text-xs truncate group-hover:text-white transition-colors">{player.name}</h4>
                                            <p className="text-[9px] text-slate-500 uppercase tracking-wider truncate mb-1">{getPlayerTeam(player.name) || "Independent"}</p>
                                            <div className="flex gap-2 text-[9px] text-slate-400 font-medium">
                                                <span>🏏 {player.bat}</span>
                                                <span>🎯 {player.bowl}</span>
                                                <span>🧤 {player.field}</span>
                                            </div>
                                        </div>
                                        <div className="text-right flex flex-col justify-center border-l border-slate-800 pl-3">
                                            <div className="text-[8px] text-slate-500 font-bold uppercase tracking-widest leading-none mb-1">Pts</div>
                                            <div className="text-lg font-black text-amber-500/90 leading-none">{player.total}</div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        );
    };

    const renderGrid = (categoriesDef: any[]) => {
        const categories = categoriesDef.map(c => ({ ...c, data: tournamentStats[c.dataKey] || [] }));
        const display = categories.filter(c => c.data.length > 0);

        if (display.length === 0) {
            return <div className="py-12 text-center text-slate-500">Not enough data to generate category leaderboards yet.</div>;
        }

        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mt-6">
                {display.map((cat) => {
                    const top3 = cat.data.slice(0, 3);
                    const rest = cat.data.slice(3, 7);

                    return (
                        <div key={cat.key}
                            className={`rounded-2xl border border-slate-700/60 overflow-hidden bg-gradient-to-br ${cat.grad} hover:border-slate-600 transition-all shadow-lg`}>
                            {/* Card Header */}
                            <div className="px-5 pt-4 pb-3 flex items-center gap-2 border-b border-white/5 bg-slate-900/40">
                                <span className="text-xl">{cat.icon}</span>
                                <div className="flex-1 min-w-0">
                                    <p className={`font-bold text-sm ${cat.accent}`}>{cat.label}</p>
                                    <p className="text-slate-500 text-[10px] uppercase tracking-wider">{cat.subLabel}</p>
                                </div>
                            </div>

                            {/* Mini Podium for Top 3 */}
                            {top3.length > 0 && (
                                <div className="px-4 py-6 bg-slate-950/20 flex items-end justify-center gap-2 border-b border-white/5 min-h-[160px]">
                                    {/* Rank 2 */}
                                    {top3[1] && (
                                        <div className="flex flex-col items-center flex-1 w-1/3 z-0 opacity-90 pb-1">
                                            <div className="w-8 h-8 rounded-full border-2 border-slate-400 bg-slate-800 flex items-center justify-center shadow-lg relative mb-1.5">
                                                <span className="text-[9px] font-black text-slate-300">{(top3[1]?.name || "").substring(0, 2).toUpperCase()}</span>
                                                <div className="absolute -bottom-2 text-xs z-10">🥈</div>
                                            </div>
                                            <div className="bg-slate-800/60 border-t border-slate-600 rounded-t-lg w-full p-1.5 flex flex-col items-center h-[50px] justify-between">
                                                <p className="text-[8px] font-bold text-slate-300 truncate w-full text-center">{top3[1].name}</p>
                                                <p className={`text-xs font-black ${cat.accent}`}>
                                                    {cat.key === "sr" || cat.key === "econ" || cat.key === "avg" || cat.key === "bowlAvg" ? Number(typeof cat.displayKey === 'string' && cat.displayKey ? top3[1][cat.displayKey] : top3[1][cat.valueKey]).toFixed(2) : (cat.displayKey ? top3[1][cat.displayKey] : top3[1][cat.valueKey])}
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                    {/* Rank 1 */}
                                    <div className="flex flex-col items-center flex-1 w-1/3 z-10 -mx-1 shadow-2xl">
                                        <div className="w-10 h-10 rounded-full border-2 border-amber-400 bg-slate-800 flex items-center justify-center shadow-[#fbbf2433]_0_0_12px relative mb-1.5">
                                            <span className="text-[10px] font-black text-amber-100">{(top3[0]?.name || "").substring(0, 2).toUpperCase()}</span>
                                            <div className="absolute -bottom-2 text-sm z-10 drop-shadow-md">🥇</div>
                                        </div>
                                        <div className={`bg-gradient-to-t ${cat.grad.split(' ')[0]} border-t border-slate-500 rounded-t-lg w-full p-2 flex flex-col items-center h-[65px] justify-between`}>
                                            <p className="text-[9px] font-bold text-white truncate w-full text-center">{top3[0].name}</p>
                                            <p className="text-[7px] text-slate-400 uppercase truncate w-full text-center">{getPlayerTeam(top3[0].name) || "Ind"}</p>
                                            <p className={`text-sm font-black ${cat.accent} drop-shadow-sm`}>
                                                {cat.key === "sr" || cat.key === "econ" || cat.key === "avg" || cat.key === "bowlAvg" ? Number(typeof cat.displayKey === 'string' && cat.displayKey ? top3[0][cat.displayKey] : top3[0][cat.valueKey]).toFixed(2) : (cat.displayKey ? top3[0][cat.displayKey] : top3[0][cat.valueKey])}
                                            </p>
                                        </div>
                                    </div>
                                    {/* Rank 3 */}
                                    {top3[2] && (
                                        <div className="flex flex-col items-center flex-1 w-1/3 z-0 opacity-90 pb-1">
                                            <div className="w-8 h-8 rounded-full border-2 border-orange-400/80 bg-slate-800 flex items-center justify-center shadow-lg relative mb-1.5">
                                                <span className="text-[9px] font-black text-orange-200/80">{(top3[2]?.name || "").substring(0, 2).toUpperCase()}</span>
                                                <div className="absolute -bottom-2 text-xs z-10">🥉</div>
                                            </div>
                                            <div className="bg-slate-800/60 border-t border-orange-900/50 rounded-t-lg w-full p-1.5 flex flex-col items-center h-[40px] justify-between">
                                                <p className="text-[8px] font-bold text-slate-300 truncate w-full text-center">{top3[2].name}</p>
                                                <p className={`text-[10px] font-black ${cat.accent}`}>
                                                    {cat.key === "sr" || cat.key === "econ" || cat.key === "avg" || cat.key === "bowlAvg" ? Number(typeof cat.displayKey === 'string' && cat.displayKey ? top3[2][cat.displayKey] : top3[2][cat.valueKey]).toFixed(2) : (cat.displayKey ? top3[2][cat.displayKey] : top3[2][cat.valueKey])}
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Remaining Ranks List (4+) */}
                            {cat.data.length === 0 ? (
                                <div className="px-5 py-8 text-center text-slate-600 text-sm">No data yet</div>
                            ) : rest.length > 0 ? (
                                <div className="divide-y divide-white/5 bg-slate-900/20">
                                    {rest.map((p: any, i: number) => {
                                        const val = p[cat.valueKey];
                                        const displayVal = cat.displayKey ? p[cat.displayKey] : val;
                                        const rank = i + 4;
                                        
                                        return (
                                            <div key={i} className="px-5 py-2.5 flex items-center gap-3 hover:bg-white/5 transition-colors">
                                                <div className="w-5 flex-shrink-0 text-center">
                                                    <span className="text-slate-600 text-[10px] font-bold">{rank}</span>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between">
                                                        <div className="min-w-0">
                                                            <p className="text-xs font-semibold truncate text-slate-300">{p.name}</p>
                                                        </div>
                                                        <span className={`ml-3 text-xs font-bold flex-shrink-0 ${cat.accent}`}>
                                                            {cat.key === "sr" || cat.key === "econ" || cat.key === "avg" || cat.key === "bowlAvg" ? Number(displayVal).toFixed(2) : displayVal}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : null}
                            {cat.data.length > 7 && (
                                <div className="px-5 py-2 text-[10px] text-slate-600 text-center border-t border-white/5 bg-slate-900/40">
                                    +{cat.data.length - 7} more
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        );
    };

    return (
        <div className="space-y-6 mt-6">
            <Tabs defaultValue="overview" className="w-full">
                <TabsList className="bg-slate-900 border border-slate-800 w-full justify-start p-1 h-auto grid grid-cols-4 lg:inline-flex rounded-xl">
                    <TabsTrigger value="overview" className="data-[state=active]:bg-slate-800 data-[state=active]:text-amber-400 transition-all rounded-lg py-2">MVP & Overview</TabsTrigger>
                    <TabsTrigger value="batting" className="data-[state=active]:bg-slate-800 data-[state=active]:text-blue-400 transition-all rounded-lg py-2">Batting</TabsTrigger>
                    <TabsTrigger value="bowling" className="data-[state=active]:bg-slate-800 data-[state=active]:text-red-400 transition-all rounded-lg py-2">Bowling</TabsTrigger>
                    <TabsTrigger value="fielding" className="data-[state=active]:bg-slate-800 data-[state=active]:text-emerald-400 transition-all rounded-lg py-2">Fielding</TabsTrigger>
                </TabsList>
                
                <TabsContent value="overview" className="focus:outline-none">
                    {renderMvpTab()}
                </TabsContent>
                <TabsContent value="batting" className="focus:outline-none">
                    {renderGrid(BATTING_CATEGORIES)}
                </TabsContent>
                <TabsContent value="bowling" className="focus:outline-none">
                    {renderGrid(BOWLING_CATEGORIES)}
                </TabsContent>
                <TabsContent value="fielding" className="focus:outline-none">
                    {renderGrid(FIELDING_CATEGORIES)}
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default TournamentStatsTab;
