const fs = require('fs');

let file = fs.readFileSync('d:\\dev_scripts\\src\\components\\football\\PerformanceLabTab.tsx', 'utf8');

const oldLogicStart = file.indexOf('// --- MATCH LEADERS ---');
const oldLogicEnd = file.indexOf('// --- FULL STATISTICS COMPARISON ---');
if (oldLogicStart === -1 || oldLogicEnd === -1) {
    console.error('Could not find match leaders logic bounds');
    process.exit(1);
}

const newLogic = `// --- MATCH LEADERS ---
    let matchLeaders: any[] = [];
    try {
        if (matchData?.rosters) {
            let allPlayers: any[] = [];
            matchData.rosters.forEach((r: any) => {
                if (r.roster) {
                    r.roster.forEach((p: any) => {
                        allPlayers.push({
                            ...p,
                            teamName: r.team?.displayName || r.team?.name || 'Unknown'
                        });
                    });
                }
            });

            const targetStats = [
                { key: 'totalGoals', label: 'Goals Scored' },
                { key: 'goalAssists', label: 'Assists' },
                { key: 'totalShots', label: 'Total Shots' },
                { key: 'shotsOnTarget', label: 'Shots On Target' },
                { key: 'saves', label: 'Saves' }
            ];

            const groupedCategories = targetStats.map(statTarget => {
                const playersWithStat = allPlayers.map(p => {
                    const statObj = p.stats?.find((s: any) => s.name === statTarget.key);
                    const val = statObj ? parseFloat(statObj.value || '0') : 0;
                    return {
                        id: String(p.athlete?.id || ''),
                        name: String(p.athlete?.shortName || p.athlete?.displayName || 'Unknown'),
                        position: String(p.position?.abbreviation || 'N/A'),
                        team: String(p.teamName),
                        value: val
                    };
                }).filter(p => p.value > 0);

                const top3 = playersWithStat.sort((a, b) => b.value - a.value).slice(0, 3);
                
                return {
                    categoryName: statTarget.label,
                    players: top3
                };
            }).filter(cat => cat.players.length > 0);

            matchLeaders = groupedCategories;
        }
    } catch (err) {
        console.error("Match Leaders Error:", err);
    }

    `;

file = file.substring(0, oldLogicStart) + newLogic + file.substring(oldLogicEnd);

const oldJsxStart = file.indexOf('{/* Match Leaders Section */}');
let nextSection = file.indexOf('{/* Full Match Statistics */}');
if (nextSection === -1) nextSection = file.indexOf('{/* Predictive Analysis */}');
if (oldJsxStart === -1 || nextSection === -1) {
    console.error('Could not find match leaders JSX bounds');
    process.exit(1);
}

const newJsx = `{/* Match Leaders Section */}
            {matchLeaders.length > 0 && (
                <div className="bg-gradient-to-br from-[#0B1120]/90 to-[#1e1b4b]/90 backdrop-blur-xl border border-cyan-500/20 shadow-[0_8px_32px_rgba(0,0,0,0.5)] rounded-3xl p-6 md:p-8 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
                    <div className="flex items-center gap-3 mb-6 pb-4 border-b border-cyan-500/30 relative z-10">
                        <Star className="w-6 h-6 text-cyan-400 fill-cyan-400" />
                        <h3 className="text-xl font-black uppercase tracking-wider text-white drop-shadow-md">Top Performers by Category</h3>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 relative z-10">
                        {matchLeaders.map((category, idx) => (
                            <div key={idx} className="bg-slate-900/50 backdrop-blur-lg shadow-[0_0_15px_rgba(6,182,212,0.1)] border border-white/10 p-5 rounded-2xl">
                                <h4 className="text-sm font-black uppercase text-cyan-400 mb-4 border-b border-white/5 pb-2">{category.categoryName}</h4>
                                <div className="space-y-3">
                                    {category.players.map((player: any, pIdx: number) => (
                                        <div key={pIdx} className="flex items-center justify-between group">
                                            <div className="flex items-center gap-3">
                                                <span className="text-xs font-black text-rose-500/80 w-3">{pIdx + 1}</span>
                                                <div className="w-8 h-8 rounded-full overflow-hidden border border-cyan-500/30 bg-secondary relative">
                                                    <LineupPlayerImage playerId={player.id} playerName={player.name} fallbackInitials={player.position} className="absolute inset-0" />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold text-white leading-none">{player.name}</span>
                                                    <span className="text-[10px] uppercase tracking-widest text-white/40 mt-1">{player.team}</span>
                                                </div>
                                            </div>
                                            <span className="text-lg font-black text-cyan-400 drop-shadow-md">{player.value}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            `;

file = file.substring(0, oldJsxStart) + newJsx + file.substring(nextSection);

fs.writeFileSync('d:\\dev_scripts\\src\\components\\football\\PerformanceLabTab.tsx', file);
