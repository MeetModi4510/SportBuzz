import React, { useState } from 'react';
import { usePerformanceLabSquad, useCricketTeamAnalytics } from '../../hooks/usePerformanceLab';
import {
    BarChart3, TrendingUp, Trophy, Activity, ChevronDown, Zap, Target,
    MapPin, Calendar, Users, Shield, ArrowUp, ArrowDown, Minus, TrendingDown,
    Home, Plane, Star
} from 'lucide-react';

interface Player {
    espnId: string;
    name: string;
    role: string;
    imageUrl: string;
}

const regions = [
    { id: 'india-2', name: 'India', flag: 'https://flagcdn.com/w80/in.png' },
    { id: 'australia-4', name: 'Australia', flag: 'https://flagcdn.com/w80/au.png' },
    { id: 'england-9', name: 'England', flag: 'https://flagcdn.com/w80/gb-eng.png' },
    { id: 'south-africa-11', name: 'South Africa', flag: 'https://flagcdn.com/w80/za.png' },
    { id: 'new-zealand-13', name: 'New Zealand', flag: 'https://flagcdn.com/w80/nz.png' },
    { id: 'pakistan-3', name: 'Pakistan', flag: 'https://flagcdn.com/w80/pk.png' },
    { id: 'sri-lanka-5', name: 'Sri Lanka', flag: 'https://flagcdn.com/w80/lk.png' },
    { id: 'west-indies-10', name: 'West Indies', flag: 'https://a.espncdn.com/i/teamlogos/cricket/500/4.png' },
    { id: 'bangladesh-6', name: 'Bangladesh', flag: 'https://flagcdn.com/w80/bd.png' },
    { id: 'afghanistan-96', name: 'Afghanistan', flag: 'https://flagcdn.com/w80/af.png' },
    { id: 'zimbabwe-12', name: 'Zimbabwe', flag: 'https://flagcdn.com/w80/zw.png' },
    { id: 'ireland-27', name: 'Ireland', flag: 'https://flagcdn.com/w80/ie.png' },
    { id: 'scotland-23', name: 'Scotland', flag: 'https://flagcdn.com/w80/gb-sct.png' },
    { id: 'netherlands-24', name: 'Netherlands', flag: 'https://flagcdn.com/w80/nl.png' },
    { id: 'nepal-72', name: 'Nepal', flag: 'https://flagcdn.com/w80/np.png' },
];

const formats = [
    { id: 'all', label: 'All Formats' },
    { id: 't20i', label: 'T20 Internationals' },
    { id: 'odi', label: 'One Day Internationals' },
    { id: 'test', label: 'Test Matches' },
];

function StatCard({ icon, label, value, sub, accent = 'amber' }: any) {
    const accents: any = {
        amber: 'bg-amber-400/10 text-amber-400',
        emerald: 'bg-emerald-400/10 text-emerald-400',
        blue: 'bg-blue-400/10 text-blue-400',
        purple: 'bg-purple-400/10 text-purple-400',
        rose: 'bg-rose-400/10 text-rose-400',
        cyan: 'bg-cyan-400/10 text-cyan-400',
    };
    return (
        <div className="relative overflow-hidden p-5 rounded-2xl border border-white/5 bg-slate-900/50 backdrop-blur-md group hover:bg-slate-800/60 hover:border-white/10 transition-all duration-300">
            <div className="flex items-center gap-3 mb-3">
                <div className={`p-2.5 rounded-xl ${accents[accent]}`}>{icon}</div>
                <span className="text-slate-400 font-semibold text-sm">{label}</span>
            </div>
            <p className="text-2xl font-display font-black text-white">{value}</p>
            {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
        </div>
    );
}

function WinBar({ won, lost, tied = 0, nr = 0 }: any) {
    const total = won + lost + tied + nr;
    if (total === 0) return null;
    return (
        <div className="flex rounded-full overflow-hidden h-2.5 w-full gap-0.5 mt-2">
            <div style={{ width: `${(won / total) * 100}%` }} className="bg-emerald-500 transition-all" />
            <div style={{ width: `${(lost / total) * 100}%` }} className="bg-rose-500 transition-all" />
            {tied > 0 && <div style={{ width: `${(tied / total) * 100}%` }} className="bg-amber-400 transition-all" />}
        </div>
    );
}

function FormPill({ result }: { result: string }) {
    if (result === 'W') return <div className="w-6 h-6 rounded flex items-center justify-center bg-emerald-500/20 text-emerald-400 font-black text-[10px]">W</div>;
    if (result === 'L') return <div className="w-6 h-6 rounded flex items-center justify-center bg-rose-500/20 text-rose-400 font-black text-[10px]">L</div>;
    return <div className="w-6 h-6 rounded flex items-center justify-center bg-slate-500/20 text-slate-400 font-black text-[10px]">{result}</div>;
}

export function CricketTeamAnalysisPanel() {
    const [selectedTeam, setSelectedTeam] = useState('india-2');
    const [selectedFormat, setSelectedFormat] = useState('t20i');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isTriggered, setIsTriggered] = useState(false);
    const [h2hFilter, setH2hFilter] = useState('');

    const { data: squadData, isLoading: isLoadingSquad } = usePerformanceLabSquad(selectedTeam);
    const selectedRegionObj = regions.find(r => r.id === selectedTeam) || regions[0];

    const { data: analyticsData, isLoading: isLoadingAnalytics, isFetching } = useCricketTeamAnalytics(
        selectedTeam, selectedFormat, isTriggered
    );

    React.useEffect(() => { setIsTriggered(false); }, [selectedTeam, selectedFormat]);

    const [teamFlags, setTeamFlags] = useState<Record<string, string>>({});
    const [playerImages, setPlayerImages] = useState<Record<string, string>>({});

    React.useEffect(() => {
        if (!analyticsData?.headToHead) return;
        const fetchFlags = async () => {
            const opps = Object.keys(analyticsData.headToHead);
            for (const opp of opps) {
                const cacheKey = `cricket_flag_${opp}`;
                const cached = localStorage.getItem(cacheKey);
                if (cached) {
                    if (cached !== 'null') setTeamFlags(prev => ({ ...prev, [opp]: cached }));
                    continue;
                }
                try {
                    const res = await fetch(`https://www.thesportsdb.com/api/v1/json/3/searchteams.php?t=${encodeURIComponent(opp + ' Cricket')}`);
                    const data = await res.json();
                    const badge = data.teams?.[0]?.strBadge || 'null';
                    localStorage.setItem(cacheKey, badge);
                    if (badge !== 'null') setTeamFlags(prev => ({ ...prev, [opp]: badge }));
                } catch (e) {
                    console.error('Failed to fetch flag for', opp);
                }
                // tiny delay to prevent rate limit
                await new Promise(r => setTimeout(r, 200));
            }
        };
        fetchFlags();
    }, [analyticsData?.headToHead]);

    React.useEffect(() => {
        if (!analyticsData?.players) return;
        const fetchPlayerImages = async () => {
            const players = [
                ...(analyticsData.players.topRunScorers || []),
                ...(analyticsData.players.topWicketTakers || [])
            ];
            const names = Array.from(new Set(players.map((p: any) => p.name)));
            
            for (const name of names) {
                const cacheKey = `cricket_player_${name}`;
                const cached = localStorage.getItem(cacheKey);
                if (cached) {
                    if (cached !== 'null') setPlayerImages(prev => ({ ...prev, [name]: cached }));
                    continue;
                }
                try {
                    const res = await fetch(`https://www.thesportsdb.com/api/v1/json/3/searchplayers.php?p=${encodeURIComponent(name)}`);
                    const data = await res.json();
                    const thumb = data.player?.[0]?.strThumb || data.player?.[0]?.strCutout || data.player?.[0]?.strRender || 'null';
                    localStorage.setItem(cacheKey, thumb);
                    if (thumb !== 'null') setPlayerImages(prev => ({ ...prev, [name]: thumb }));
                } catch (e) {
                    console.error('Failed to fetch player image for', name);
                }
                await new Promise(r => setTimeout(r, 200));
            }
        };
        fetchPlayerImages();
    }, [analyticsData?.players]);

    const groups = [
        { label: 'Batsmen', players: [] as Player[] },
        { label: 'All-Rounders', players: [] as Player[] },
        { label: 'Wicket-Keepers', players: [] as Player[] },
        { label: 'Bowlers', players: [] as Player[] }
    ];
    if (squadData?.players) {
        squadData.players.forEach((player: Player) => {
            const r = (player.role || '').toLowerCase();
            if (r.includes('wicket')) groups[2].players.push(player);
            else if (r.includes('all')) groups[1].players.push(player);
            else if (r.includes('bowl')) groups[3].players.push(player);
            else groups[0].players.push(player);
        });
    }

    const totalValidMatches = (analyticsData?.matchesPlayed || 1) - (analyticsData?.winLoss?.noResult || 0);
    const winPct = analyticsData ? Math.round((analyticsData.winLoss?.won / Math.max(1, totalValidMatches)) * 100) : 0;
    const batFirstWinPct = analyticsData?.battingFirst?.matches > 0
        ? Math.round((analyticsData.battingFirst.won / analyticsData.battingFirst.matches) * 100) : 0;
    const chasingWinPct = analyticsData?.chasing?.matches > 0
        ? Math.round((analyticsData.chasing.won / analyticsData.chasing.matches) * 100) : 0;

    const h2hEntries = analyticsData?.headToHead
        ? Object.entries(analyticsData.headToHead as Record<string, any>)
            .filter(([opp]) => opp.toLowerCase().includes(h2hFilter.toLowerCase()))
            .sort((a: any, b: any) => b[1].played - a[1].played)
        : [];

    return (
        <div className="w-full max-w-[1600px] mx-auto space-y-6 animate-fade-in">
            {/* ── Header ── */}
            <div className="relative z-50 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-slate-900/40 p-6 rounded-2xl border border-white/5 backdrop-blur-md">
                <div>
                    <h2 className="text-3xl font-display font-bold text-white mb-1">Team Analysis</h2>
                    <p className="text-slate-400 text-sm">Official data powered by ESPN Statsguru — always up-to-date.</p>
                </div>
                <div className="flex flex-col sm:flex-row items-center gap-3">
                    <div className="flex bg-[#0f172a] rounded-xl p-1 border border-white/10 shadow-lg">
                        {formats.map(f => (
                            <button key={f.id} onClick={() => setSelectedFormat(f.id)}
                                className={`px-3 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${selectedFormat === f.id ? 'bg-blue-500 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>
                                {f.label}
                            </button>
                        ))}
                    </div>
                    <div className="relative">
                        <div onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                            className="bg-[#0f172a] border border-white/10 rounded-2xl px-4 py-3 flex items-center gap-3 cursor-pointer hover:bg-[#1e293b] transition-all shadow-lg min-w-[220px]">
                            <div className={`w-8 h-5 overflow-hidden flex items-center justify-center ${selectedRegionObj.name.toLowerCase().includes('west') ? 'rounded-full' : 'rounded-sm'}`}>
                                <img src={selectedRegionObj.flag} alt="" className="w-full h-full object-cover" />
                            </div>
                            <span className="text-white font-black text-sm flex-1">{selectedRegionObj.name}</span>
                            <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                        </div>
                        {isDropdownOpen && (
                            <div className="absolute top-full mt-2 right-0 w-full bg-[#0B1120]/95 backdrop-blur-3xl border border-white/10 rounded-2xl shadow-2xl z-50 max-h-80 overflow-y-auto custom-scrollbar p-2">
                                {regions.map(r => (
                                    <div key={r.id} onClick={() => { setSelectedTeam(r.id); setIsDropdownOpen(false); }}
                                        className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors ${selectedTeam === r.id ? 'bg-blue-500/15 border border-blue-500/30' : 'hover:bg-white/5 border border-transparent'}`}>
                                        <img src={r.flag} alt={r.name} className={`w-8 h-5 object-cover shadow-sm ${r.name.toLowerCase().includes('west') ? 'rounded-full' : 'rounded-sm'}`} />
                                        <span className={`font-bold text-sm ${selectedTeam === r.id ? 'text-blue-400' : 'text-slate-200'}`}>{r.name}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ── Landing / Loading / Data ── */}
            {!isTriggered ? (
                <div className="bg-slate-900/40 rounded-2xl border border-white/5 p-16 flex flex-col items-center justify-center text-center">
                    <div className="w-24 h-24 bg-blue-500/10 rounded-full flex items-center justify-center mb-6 border border-blue-500/20 shadow-[0_0_50px_rgba(59,130,246,0.2)]">
                        <BarChart3 className="w-12 h-12 text-blue-400" />
                    </div>
                    <h3 className="text-3xl font-display font-bold text-white mb-3">Deep Dive Analytics Engine</h3>
                    <p className="text-slate-400 max-w-xl mb-8 text-base">
                        Win/Loss, Home/Away, Form, Highest Scores, Best Bowling, Strike Rates and more.
                    </p>
                    <button onClick={() => setIsTriggered(true)}
                        className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-xl font-bold text-lg shadow-[0_0_30px_rgba(59,130,246,0.4)] transition-all hover:scale-105 active:scale-95 flex items-center gap-3">
                        <Zap className="w-5 h-5 fill-current" />
                        Analyse {selectedRegionObj.name}
                    </button>
                </div>
            ) : isLoadingAnalytics || isFetching ? (
                <div className="bg-slate-900/40 rounded-2xl border border-white/5 p-16 flex flex-col items-center justify-center text-center space-y-5">
                    <div className="w-16 h-16 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
                    <h3 className="text-2xl font-bold text-white">Fetching Live Data...</h3>
                    <p className="text-slate-400 max-w-md text-sm">Pulling official statistics from ESPN Statsguru sequentially to prevent rate limits. This takes about 5-10 seconds.</p>
                </div>
            ) : analyticsData ? (
                <div className="space-y-6 animate-fade-in">

                    {/* ── Row 1: Core Stats & Recent Form ── */}
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        {/* Overall Record */}
                        <div className="col-span-2 lg:col-span-2 relative p-5 rounded-2xl border border-white/5 bg-slate-900/50 hover:bg-slate-800/60 transition-all flex flex-col justify-between">
                            <div>
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="p-2.5 rounded-xl bg-amber-400/10"><Trophy className="w-5 h-5 text-amber-400" /></div>
                                        <span className="text-slate-400 font-semibold text-sm">Win / Loss Record</span>
                                    </div>
                                    <span className="text-xs font-semibold bg-white/10 px-2 py-1 rounded text-slate-300">{winPct}% Win Rate</span>
                                </div>
                                <p className="text-3xl font-display font-black text-white">
                                    <span className="text-emerald-400">{analyticsData.winLoss?.won}W</span>
                                    <span className="text-slate-500 mx-2">—</span>
                                    <span className="text-rose-400">{analyticsData.winLoss?.lost}L</span>
                                    {analyticsData.winLoss?.tied > 0 && <><span className="text-slate-500 mx-2">—</span><span className="text-amber-400">{analyticsData.winLoss.tied}T</span></>}
                                    {analyticsData.winLoss?.noResult > 0 && <><span className="text-slate-500 mx-2">—</span><span className="text-slate-400">{analyticsData.winLoss.noResult}NR</span></>}
                                </p>
                            </div>
                            <WinBar won={analyticsData.winLoss?.won} lost={analyticsData.winLoss?.lost} tied={analyticsData.winLoss?.tied} nr={analyticsData.winLoss?.noResult} />
                        </div>

                        {/* Recent Form */}
                        <div className="col-span-2 lg:col-span-1 p-5 rounded-2xl border border-white/5 bg-slate-900/50 flex flex-col justify-between">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2.5 rounded-xl bg-blue-400/10"><Activity className="w-5 h-5 text-blue-400" /></div>
                                <span className="text-slate-400 font-semibold text-sm">Recent Form</span>
                            </div>
                            <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                                {(analyticsData.recentForm || []).slice(0, 10).map((r: string, i: number) => <FormPill key={i} result={r} />)}
                            </div>
                        </div>

                        <StatCard icon={<Shield className="w-5 h-5" />} label="Batting First Win%" accent="blue"
                            value={`${batFirstWinPct}%`} sub={`${analyticsData.battingFirst?.won}/${analyticsData.battingFirst?.matches} wins`} />

                        <StatCard icon={<Target className="w-5 h-5" />} label="Chasing Win%" accent="purple"
                            value={`${chasingWinPct}%`} sub={`${analyticsData.chasing?.won}/${analyticsData.chasing?.matches} wins`} />

                        <div className="p-5 rounded-2xl border border-white/5 bg-slate-900/50 flex flex-col justify-center">
                            <div className="flex justify-between items-center mb-2">
                                <div className="flex items-center gap-2 text-slate-400 text-xs"><Home className="w-3 h-3"/> Home</div>
                                <span className="text-white text-sm font-bold">{analyticsData.homeAway?.home?.won}W - {analyticsData.homeAway?.home?.lost}L</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-2 text-slate-400 text-xs"><Plane className="w-3 h-3"/> Away</div>
                                <span className="text-white text-sm font-bold">{analyticsData.homeAway?.away?.won}W - {analyticsData.homeAway?.away?.lost}L</span>
                            </div>
                        </div>
                    </div>

                    {/* ── Row 2: Top Performances (Innings) ── */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Highest Scores */}
                        <div className="bg-slate-900/40 rounded-2xl border border-white/5 p-6 backdrop-blur-md">
                            <div className="flex items-center gap-3 mb-5">
                                <div className="p-2 rounded-xl bg-amber-400/10"><Star className="w-5 h-5 text-amber-400 fill-amber-400/20" /></div>
                                <h3 className="text-lg font-display font-bold text-white">Highest Individual Scores</h3>
                            </div>
                            <div className="space-y-2">
                                {(analyticsData.highestInnings || []).slice(0, 5).map((h: any, i: number) => (
                                    <div key={i} className="flex justify-between items-center p-3 hover:bg-white/5 rounded-xl border border-transparent hover:border-white/10 transition-colors">
                                        <div>
                                            <p className="font-bold text-slate-200 text-sm">{h.name}</p>
                                            <p className="text-[11px] text-slate-500 mt-0.5">
                                                vs {h.opp}
                                                {h.ground && <><span className="text-slate-600 px-1.5">•</span>{h.ground}</>}
                                                {h.date && <><span className="text-slate-600 px-1.5">•</span>{h.date}</>}
                                            </p>
                                        </div>
                                        <span className="font-black text-amber-400 text-xl">{h.runs}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Best Bowling */}
                        <div className="bg-slate-900/40 rounded-2xl border border-white/5 p-6 backdrop-blur-md">
                            <div className="flex items-center gap-3 mb-5">
                                <div className="p-2 rounded-xl bg-emerald-400/10"><Star className="w-5 h-5 text-emerald-400 fill-emerald-400/20" /></div>
                                <h3 className="text-lg font-display font-bold text-white">Best Bowling Figures</h3>
                            </div>
                            <div className="space-y-2">
                                {(analyticsData.bestBowling || []).slice(0, 5).map((b: any, i: number) => (
                                    <div key={i} className="flex justify-between items-center p-3 hover:bg-white/5 rounded-xl border border-transparent hover:border-white/10 transition-colors">
                                        <div>
                                            <p className="font-bold text-slate-200 text-sm">{b.name}</p>
                                            <p className="text-[11px] text-slate-500 mt-0.5">
                                                vs {b.opp}
                                                {b.ground && <><span className="text-slate-600 px-1.5">•</span>{b.ground}</>}
                                                {b.date && <><span className="text-slate-600 px-1.5">•</span>{b.date}</>}
                                            </p>
                                        </div>
                                        <span className="font-black text-emerald-400 text-xl">{b.figures}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* ── Row 3: Year by Year + Venues ── */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Year by Year */}
                        <div className="bg-slate-900/40 rounded-2xl border border-white/5 p-6 backdrop-blur-md">
                            <div className="flex items-center gap-3 mb-5">
                                <div className="p-2.5 rounded-xl bg-amber-400/10"><Calendar className="w-5 h-5 text-amber-400" /></div>
                                <h3 className="text-lg font-display font-bold text-white">Year-by-Year Form</h3>
                            </div>
                            <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar pr-2">
                                {(analyticsData.yearByYear || []).map((y: any) => {
                                    const yWinPct = y.mat > 0 ? Math.round((y.won / y.mat) * 100) : 0;
                                    const yLossPct = y.mat > 0 ? Math.round((y.lost / y.mat) * 100) : 0;
                                    const yTiePct = y.mat > 0 ? Math.round(((y.tied || 0) / y.mat) * 100) : 0;
                                    const yDrawPct = y.mat > 0 ? Math.round(((y.drawNr || 0) / y.mat) * 100) : 0;
                                    return (
                                        <div key={y.year} className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors">
                                            <span className="text-slate-400 font-bold text-sm w-10 shrink-0">{y.year}</span>
                                            <div className="flex-1">
                                                <div className="flex rounded-full overflow-hidden h-2 gap-0.5">
                                                    {yWinPct > 0 && <div style={{ width: `${yWinPct}%` }} className="bg-emerald-500 rounded-full transition-all" title="Won" />}
                                                    {yLossPct > 0 && <div style={{ width: `${yLossPct}%` }} className="bg-rose-500 rounded-full transition-all" title="Lost" />}
                                                    {yTiePct > 0 && <div style={{ width: `${yTiePct}%` }} className="bg-amber-400 rounded-full transition-all" title="Tied" />}
                                                    {yDrawPct > 0 && <div style={{ width: `${yDrawPct}%` }} className="bg-slate-500 rounded-full transition-all" title="Draw/NR" />}
                                                </div>
                                            </div>
                                            <span className="text-xs font-bold text-emerald-400 w-8 text-right">{y.won}W</span>
                                            <span className="text-xs text-rose-400/80 w-8 text-right">{y.lost}L</span>
                                            {(y.tied > 0 || y.drawNr > 0) && (
                                                <div className="flex flex-col gap-0.5 w-8 text-right">
                                                    {y.tied > 0 && <span className="text-[10px] leading-none text-amber-400">{y.tied}T</span>}
                                                    {y.drawNr > 0 && <span className="text-[10px] leading-none text-slate-400">{y.drawNr}D/N</span>}
                                                </div>
                                            )}
                                            <span className={`text-xs font-black w-9 text-right ${yWinPct >= 60 ? 'text-emerald-400' : yWinPct >= 40 ? 'text-amber-400' : 'text-rose-400'}`}>{yWinPct}%</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Venue Breakdown */}
                        <div className="bg-slate-900/40 rounded-2xl border border-white/5 p-6 backdrop-blur-md">
                            <div className="flex items-center gap-3 mb-5">
                                <div className="p-2.5 rounded-xl bg-blue-400/10"><MapPin className="w-5 h-5 text-blue-400" /></div>
                                <h3 className="text-lg font-display font-bold text-white">Top Venues</h3>
                            </div>
                            <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar pr-2">
                                {(analyticsData.venues || []).map((v: any, i: number) => (
                                    <div key={i} className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors">
                                        <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-400 shrink-0">{i + 1}</div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-slate-200 text-sm font-semibold truncate">{v.ground.replace(/^[^-]+ - /, '')}</p>
                                            <p className="text-slate-500 text-xs">
                                                {v.mat} matches • {v.won}W {v.lost}L
                                                {v.tied > 0 ? ` ${v.tied}T` : ''}
                                                {v.drawNr > 0 ? ` ${v.drawNr}D` : ''}
                                            </p>
                                        </div>
                                        <span className={`text-sm font-black shrink-0 ${v.winPct >= 70 ? 'text-emerald-400' : v.winPct >= 50 ? 'text-amber-400' : 'text-rose-400'}`}>{v.winPct}%</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* ── Row 4: Players ── */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Top Run Scorers */}
                        <div className="bg-slate-900/40 rounded-2xl border border-white/5 p-6 backdrop-blur-md">
                            <div className="flex items-center justify-between mb-5">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 rounded-xl bg-amber-400/10"><TrendingUp className="w-5 h-5 text-amber-400" /></div>
                                    <h3 className="text-lg font-display font-bold text-white">Top Run Scorers</h3>
                                </div>
                                <span className="text-xs font-semibold bg-white/8 px-3 py-1 rounded-full text-slate-400">All Time</span>
                            </div>
                            <div className="space-y-2 max-h-80 overflow-y-auto custom-scrollbar pr-1">
                                {(analyticsData.players?.topRunScorers || []).map((p: any, i: number) => (
                                    <div key={i} className="flex items-center gap-3 p-3 hover:bg-white/5 rounded-xl transition-colors">
                                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${i === 0 ? 'bg-amber-400/20 text-amber-400' : i === 1 ? 'bg-slate-400/20 text-slate-300' : i === 2 ? 'bg-orange-700/30 text-orange-400' : 'bg-slate-800 text-slate-500'}`}>{i + 1}</div>
                                        <div className="flex items-center gap-2 flex-1 min-w-0">
                                            {playerImages[p.name] ? (
                                                <img src={playerImages[p.name]} alt={p.name} className="w-8 h-8 rounded-full object-cover shrink-0 border border-white/10" />
                                            ) : (
                                                <div className="w-8 h-8 rounded-full bg-slate-800 shrink-0 border border-white/5 flex items-center justify-center text-xs font-bold text-slate-500">
                                                    {p.name.charAt(0)}
                                                </div>
                                            )}
                                            <span className="font-bold text-slate-200 text-sm truncate">{p.name}</span>
                                        </div>
                                        <div className="flex items-center gap-3 text-xs text-slate-500 hidden sm:flex">
                                            {p.matches && <span>{p.matches}m</span>}
                                            {p.avg && <span>avg <strong className="text-slate-300">{p.avg}</strong></span>}
                                            {p.sr && <span>sr <strong className="text-slate-300">{p.sr}</strong></span>}
                                        </div>
                                        <span className="font-black text-amber-400 text-lg ml-2">{p.runs?.toLocaleString()}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Top Wicket Takers */}
                        <div className="bg-slate-900/40 rounded-2xl border border-white/5 p-6 backdrop-blur-md">
                            <div className="flex items-center justify-between mb-5">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 rounded-xl bg-emerald-400/10"><Activity className="w-5 h-5 text-emerald-400" /></div>
                                    <h3 className="text-lg font-display font-bold text-white">Top Wicket Takers</h3>
                                </div>
                                <span className="text-xs font-semibold bg-white/8 px-3 py-1 rounded-full text-slate-400">All Time</span>
                            </div>
                            <div className="space-y-2 max-h-80 overflow-y-auto custom-scrollbar pr-1">
                                {(analyticsData.players?.topWicketTakers || []).map((p: any, i: number) => (
                                    <div key={i} className="flex items-center gap-3 p-3 hover:bg-white/5 rounded-xl transition-colors">
                                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${i === 0 ? 'bg-amber-400/20 text-amber-400' : i === 1 ? 'bg-slate-400/20 text-slate-300' : i === 2 ? 'bg-orange-700/30 text-orange-400' : 'bg-slate-800 text-slate-500'}`}>{i + 1}</div>
                                        <div className="flex items-center gap-2 flex-1 min-w-0">
                                            {playerImages[p.name] ? (
                                                <img src={playerImages[p.name]} alt={p.name} className="w-8 h-8 rounded-full object-cover shrink-0 border border-white/10" />
                                            ) : (
                                                <div className="w-8 h-8 rounded-full bg-slate-800 shrink-0 border border-white/5 flex items-center justify-center text-xs font-bold text-slate-500">
                                                    {p.name.charAt(0)}
                                                </div>
                                            )}
                                            <span className="font-bold text-slate-200 text-sm truncate">{p.name}</span>
                                        </div>
                                        <div className="flex items-center gap-3 text-xs text-slate-500 hidden sm:flex">
                                            {p.matches && <span>{p.matches}m</span>}
                                            {p.avg && <span>avg <strong className="text-slate-300">{p.avg}</strong></span>}
                                            {p.econ && <span>econ <strong className="text-slate-300">{p.econ}</strong></span>}
                                        </div>
                                        <span className="font-black text-emerald-400 text-lg ml-2">{p.wickets}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* ── Row 5: Head-to-Head ── */}
                    <div className="bg-slate-900/40 rounded-2xl border border-white/5 p-6 backdrop-blur-md">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-5">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 rounded-xl bg-purple-400/10"><Shield className="w-5 h-5 text-purple-400" /></div>
                                <h3 className="text-lg font-display font-bold text-white">Head-to-Head Records</h3>
                            </div>
                            <input
                                type="text" placeholder="Filter opponent..."
                                value={h2hFilter} onChange={e => setH2hFilter(e.target.value)}
                                className="bg-slate-800/60 border border-white/10 rounded-xl px-4 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500/50 w-full sm:w-48"
                            />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-96 overflow-y-auto custom-scrollbar pr-1">
                            {h2hEntries.map(([opp, rec]: any) => {
                                const oppWinPct = rec.played > 0 ? Math.round((rec.won / rec.played) * 100) : 0;
                                return (
                                    <div key={opp} className="flex items-center gap-3 p-4 rounded-xl bg-slate-800/30 hover:bg-slate-800/60 border border-white/5 hover:border-white/10 transition-all">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                {teamFlags[opp] && <img src={teamFlags[opp]} alt={opp} className="w-5 h-5 object-contain" />}
                                                <p className="text-white font-bold text-sm truncate">{opp}</p>
                                            </div>
                                            <p className="text-slate-500 text-xs mt-0.5">{rec.played} played</p>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs font-bold shrink-0">
                                            <span className="text-emerald-400">{rec.won}W</span>
                                            <span className="text-slate-600">·</span>
                                            <span className="text-rose-400">{rec.lost}L</span>
                                            {rec.tied > 0 && <><span className="text-slate-600">·</span><span className="text-amber-400">{rec.tied}T</span></>}
                                            {rec.drawNr > 0 && <><span className="text-slate-600">·</span><span className="text-slate-400">{rec.drawNr}D</span></>}
                                        </div>
                                        <div className={`text-xs font-black px-2 py-1 rounded-lg shrink-0 ${oppWinPct >= 60 ? 'bg-emerald-500/15 text-emerald-400' : oppWinPct >= 40 ? 'bg-amber-500/15 text-amber-400' : 'bg-rose-500/15 text-rose-400'}`}>
                                            {oppWinPct}%
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                </div>
            ) : null}

            {/* ── Squad Depth ── */}
            <div className="bg-slate-900/40 rounded-2xl border border-white/5 p-8 backdrop-blur-md">
                <div className="flex items-center justify-between mb-8">
                    <h3 className="text-2xl font-display font-bold text-white flex items-center gap-3">
                        <div className="w-2 h-8 bg-blue-500 rounded-full" />
                        Current Squad Depth
                    </h3>
                </div>
                {!isLoadingSquad && (!squadData || squadData.players?.length === 0) ? (
                    <div className="text-center py-20 text-slate-500">No squad data available for this team.</div>
                ) : (
                    <div className="space-y-12">
                        {groups.map((group, idx) => {
                            if (group.players.length === 0) return null;
                            return (
                                <div key={idx}>
                                    <h4 className="text-lg font-bold text-slate-400 uppercase tracking-widest mb-6 border-b border-white/5 pb-2">
                                        {group.label} <span className="text-slate-600 ml-2">({group.players.length})</span>
                                    </h4>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                                        {group.players.map((player) => {
                                            const idSum = player.espnId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
                                            const stableOVR = (idSum % 16) + 80;
                                            const highResUrl = player.imageUrl ? player.imageUrl.replace(/w=\d+/g, 'w=800').replace(/h=\d+/g, 'h=800') : '';
                                            return (
                                                <div key={player.espnId} className="group relative flex flex-col items-center bg-slate-800/30 hover:bg-slate-800/80 p-4 rounded-2xl border border-white/5 hover:border-white/20 transition-all duration-300">
                                                    <div className="relative w-24 h-24 mb-4">
                                                        <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/20 to-purple-500/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                                                        <div className="relative w-full h-full rounded-full overflow-hidden border-2 border-slate-700 group-hover:border-blue-400 transition-colors bg-slate-800">
                                                            {highResUrl ? (
                                                                <img src={highResUrl} alt={player.name} className="w-full h-full object-cover object-top" />
                                                            ) : (
                                                                <div className="w-full h-full flex items-center justify-center">
                                                                    <svg className="w-10 h-10 text-slate-600" fill="currentColor" viewBox="0 0 24 24">
                                                                        <path d="M12 14c2.761 0 5-2.239 5-5s-2.239-5-5-5-5 2.239-5 5 2.239 5 5 5zm0 2c-3.315 0-10 1.672-10 5v1h20v-1c0-3.328-6.685-5-10-5z" />
                                                                    </svg>
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="absolute -bottom-2 -right-2 bg-slate-900 border border-slate-700 text-white text-xs font-black px-2 py-1 rounded-lg shadow-lg">{stableOVR}</div>
                                                    </div>
                                                    <h5 className="font-bold text-slate-200 text-center text-sm group-hover:text-white transition-colors line-clamp-2 leading-tight">{player.name}</h5>
                                                    <p className="text-[10px] text-slate-500 uppercase tracking-wider mt-2 font-semibold">{player.role || 'Player'}</p>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
