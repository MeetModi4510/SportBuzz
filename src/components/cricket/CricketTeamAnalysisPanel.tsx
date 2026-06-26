import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
    { id: 't20i', label: 'T20 Internationals' },
    { id: 'odi', label: 'One Day Internationals' },
    { id: 'test', label: 'Test Matches' },
];

function StatCard({ icon, label, value, sub, accent = 'amber' }: any) {
    const accents: any = {
        amber: 'bg-amber-400/10 text-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.15)]',
        emerald: 'bg-emerald-400/10 text-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.15)]',
        blue: 'bg-blue-400/10 text-blue-400 shadow-[0_0_15px_rgba(96,165,250,0.15)]',
        purple: 'bg-purple-400/10 text-purple-400 shadow-[0_0_15px_rgba(192,132,252,0.15)]',
        rose: 'bg-rose-400/10 text-rose-400 shadow-[0_0_15px_rgba(251,113,133,0.15)]',
        cyan: 'bg-cyan-400/10 text-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.15)]',
    };
    return (
        <div className="relative overflow-hidden p-6 rounded-2xl border border-white/[0.04] bg-[#0B0D14]/80 backdrop-blur-xl group hover:bg-gradient-to-br hover:from-white/[0.04] hover:to-transparent hover:border-white/[0.08] hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:-translate-y-1 transition-all duration-500 ease-out flex flex-col justify-center">
            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.01] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative z-10">
                <div className="flex items-center gap-3 mb-4">
                    <div className={`p-2.5 rounded-xl ${accents[accent]}`}>{icon}</div>
                    <span className="text-slate-400 font-semibold text-sm tracking-wide">{label}</span>
                </div>
                <p className="text-3xl font-display font-black text-white tracking-tight">{value}</p>
                {sub && <p className="text-xs text-slate-500 mt-1.5 font-medium">{sub}</p>}
            </div>
        </div>
    );
}

function WinBar({ won, lost, tied = 0, nr = 0 }: any) {
    const total = won + lost + tied + nr;
    if (total === 0) return null;
    return (
        <div className="flex rounded-full overflow-hidden h-2.5 w-full gap-[1px] mt-2 bg-slate-800">
            {won > 0 && <div style={{ width: `${(won / total) * 100}%` }} className="bg-emerald-500 transition-all shadow-[0_0_10px_rgba(16,185,129,0.3)]" />}
            {tied > 0 && <div style={{ width: `${(tied / total) * 100}%` }} className="bg-amber-400 transition-all shadow-[0_0_10px_rgba(251,191,36,0.3)]" />}
            {nr > 0 && <div style={{ width: `${(nr / total) * 100}%` }} className="bg-slate-400 transition-all" />}
            {lost > 0 && <div style={{ width: `${(lost / total) * 100}%` }} className="bg-rose-500 transition-all shadow-[0_0_10px_rgba(244,63,94,0.3)]" />}
        </div>
    );
}

function FormPill({ result }: { result: string }) {
    if (result === 'W') return <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-black text-[11px] shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]">W</div>;
    if (result === 'L') return <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-rose-500/10 border border-rose-500/20 text-rose-400 font-black text-[11px] shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]">L</div>;
    return <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-slate-500/10 border border-slate-500/20 text-slate-400 font-black text-[11px] shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]">{result}</div>;
}

const expandName = (name: string) => {
    const map: Record<string, string> = {
        'SR Tendulkar': 'Sachin Tendulkar', 'V Kohli': 'Virat Kohli', 'RG Sharma': 'Rohit Sharma', 'SC Ganguly': 'Sourav Ganguly', 'R Dravid': 'Rahul Dravid', 'MS Dhoni': 'MS Dhoni',
        'Yuvraj Singh': 'Yuvraj Singh', 'V Sehwag': 'Virender Sehwag', 'S Dhawan': 'Shikhar Dhawan', 'G Gambhir': 'Gautam Gambhir', 'A Kumble': 'Anil Kumble', 'J Srinath': 'Javagal Srinath',
        'Z Khan': 'Zaheer Khan', 'Harbhajan Singh': 'Harbhajan Singh', 'N Kapil Dev': 'Kapil Dev', 'AB Agarkar': 'Ajit Agarkar', 'B Kumar': 'Bhuvneshwar Kumar', 'I Sharma': 'Ishant Sharma',
        'Mohammed Shami': 'Mohammed Shami', 'JJ Bumrah': 'Jasprit Bumrah', 'R Ashwin': 'Ravichandran Ashwin', 'RA Jadeja': 'Ravindra Jadeja', 'RT Ponting': 'Ricky Ponting',
        'AC Gilchrist': 'Adam Gilchrist', 'ME Waugh': 'Mark Waugh', 'ML Hayden': 'Matthew Hayden', 'MJ Clarke': 'Michael Clarke', 'SR Waugh': 'Steve Waugh', 'GD McGrath': 'Glenn McGrath',
        'B Lee': 'Brett Lee', 'SK Warne': 'Shane Warne', 'MG Johnson': 'Mitchell Johnson', 'CJ McDermott': 'Craig McDermott', 'EJG Morgan': 'Eoin Morgan', 'JE Root': 'Joe Root',
        'PD Collingwood': 'Paul Collingwood', 'AJ Stewart': 'Alec Stewart', 'JM Anderson': 'James Anderson', 'SCJ Broad': 'Stuart Broad', 'IT Botham': 'Ian Botham', 'D Gough': 'Darren Gough',
        'Inzamam-ul-Haq': 'Inzamam-ul-Haq', 'Mohammad Yousuf': 'Mohammad Yousuf', 'Saeed Anwar': 'Saeed Anwar', 'Javed Miandad': 'Javed Miandad', 'Younis Khan': 'Younis Khan',
        'Wasim Akram': 'Wasim Akram', 'Waqar Younis': 'Waqar Younis', 'Shahid Afridi': 'Shahid Afridi', 'Saqlain Mushtaq': 'Saqlain Mushtaq', 'Imran Khan': 'Imran Khan', 'JH Kallis': 'Jacques Kallis',
        'AB de Villiers': 'AB de Villiers', 'HH Gibbs': 'Herschelle Gibbs', 'GC Smith': 'Graeme Smith', 'HM Amla': 'Hashim Amla', 'SM Pollock': 'Shaun Pollock', 'AA Donald': 'Allan Donald',
        'M Ntini': 'Makhaya Ntini', 'DW Steyn': 'Dale Steyn', 'SP Fleming': 'Stephen Fleming', 'LRPL Taylor': 'Ross Taylor', 'NJ Astle': 'Nathan Astle', 'MJ Guptill': 'Martin Guptill',
        'KS Williamson': 'Kane Williamson', 'DL Vettori': 'Daniel Vettori', 'KD Mills': 'Kyle Mills', 'TG Southee': 'Tim Southee', 'TA Boult': 'Trent Boult', 'KC Sangakkara': 'Kumar Sangakkara',
        'ST Jayasuriya': 'Sanath Jayasuriya', 'DPMD Jayawardene': 'Mahela Jayawardene', 'PA de Silva': 'Aravinda de Silva', 'M Muralitharan': 'Muttiah Muralitharan', 'WPUJC Vaas': 'Chaminda Vaas',
        'SL Malinga': 'Lasith Malinga', 'BC Lara': 'Brian Lara', 'CH Gayle': 'Chris Gayle', 'S Chanderpaul': 'Shivnarine Chanderpaul', 'IVA Richards': 'Viv Richards', 'CG Greenidge': 'Gordon Greenidge',
        'CA Walsh': 'Courtney Walsh', 'CEL Ambrose': 'Curtly Ambrose', 'J Garner': 'Joel Garner', 'MA Holding': 'Michael Holding'
    };
    return map[name] || name;
};

export function CricketTeamAnalysisPanel() {
    const navigate = useNavigate();
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
    const [venueSort, setVenueSort] = useState<'winPct' | 'matches' | 'wins'>('winPct');
    const [venueDropdownOpen, setVenueDropdownOpen] = useState(false);

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

    const totalMatchesPlayed = analyticsData?.matchesPlayed || 1;
    const winPct = analyticsData ? Math.round((analyticsData.winLoss?.won / Math.max(1, totalMatchesPlayed)) * 100) : 0;
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
                </div>
            ) : analyticsData ? (
                <div className="space-y-6 animate-fade-in">

                    {/* ── Row 1: Core Stats (FinTech Bento Grid) ── */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* 1. Win/Loss Master Card */}
                        <div className="lg:col-span-2 relative p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden group">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 blur-[80px] rounded-full pointer-events-none" />
                            <div className="relative z-10 flex flex-col justify-between h-full min-h-[220px]">
                                {(() => {
                                    const won = analyticsData.winLoss?.won || 0;
                                    const lost = analyticsData.winLoss?.lost || 0;
                                    const other = (analyticsData.winLoss?.tied || 0) + (analyticsData.winLoss?.noResult || 0);
                                    const total = won + lost + other;
                                    return (
                                        <>
                                            <div className="flex justify-between items-start">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-3 rounded-2xl bg-gradient-to-br from-amber-400/20 to-amber-600/10 shadow-[0_0_20px_rgba(251,191,36,0.15)] ring-1 ring-amber-400/30">
                                                        <Trophy className="w-5 h-5 text-amber-400" />
                                                    </div>
                                                    <div>
                                                        <h3 className="text-white font-semibold tracking-wide">Overall Record</h3>
                                                        <p className="text-slate-400 text-xs mt-0.5">{total} Total Matches</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <span className="text-4xl font-light text-white tracking-tight">{winPct}<span className="text-xl text-emerald-400 font-normal ml-1">%</span></span>
                                                    <div className="text-xs text-emerald-500/80 uppercase tracking-widest mt-1 font-semibold">Win Rate</div>
                                                </div>
                                            </div>

                                            <div className="mt-6 flex flex-col gap-3">
                                                {/* Minimal Stacked Bar */}
                                                <div className="w-full h-1.5 bg-slate-800/50 rounded-full overflow-hidden flex gap-0.5">
                                                    <div style={{ width: `${(won / Math.max(1, total)) * 100}%` }} className="bg-emerald-500 hover:opacity-80 transition-opacity cursor-pointer" title={`Wins: ${won}`} />
                                                    <div style={{ width: `${(lost / Math.max(1, total)) * 100}%` }} className="bg-rose-500 hover:opacity-80 transition-opacity cursor-pointer" title={`Losses: ${lost}`} />
                                                    <div style={{ width: `${(other / Math.max(1, total)) * 100}%` }} className="bg-slate-500 hover:opacity-80 transition-opacity cursor-pointer" title={`Draws: ${other}`} />
                                                </div>

                                                <div className="grid grid-cols-3 gap-2">
                                                    <div className="bg-[#0B0D14]/50 rounded-2xl p-4 ring-1 ring-white/5 relative overflow-hidden group/box">
                                                        <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/5 rounded-bl-full transition-transform group-hover/box:scale-110" />
                                                        <div className="flex items-center gap-1.5 mb-2">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                                            <div className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Won</div>
                                                        </div>
                                                        <div className="text-2xl font-light text-white relative z-10">{won}</div>
                                                    </div>
                                                    <div className="bg-[#0B0D14]/50 rounded-2xl p-4 ring-1 ring-white/5 relative overflow-hidden group/box">
                                                        <div className="absolute top-0 right-0 w-16 h-16 bg-rose-500/5 rounded-bl-full transition-transform group-hover/box:scale-110" />
                                                        <div className="flex items-center gap-1.5 mb-2">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                                                            <div className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Lost</div>
                                                        </div>
                                                        <div className="text-2xl font-light text-white relative z-10">{lost}</div>
                                                    </div>
                                                    <div className="bg-[#0B0D14]/50 rounded-2xl p-4 ring-1 ring-white/5 relative overflow-hidden group/box">
                                                        <div className="absolute top-0 right-0 w-16 h-16 bg-slate-500/5 rounded-bl-full transition-transform group-hover/box:scale-110" />
                                                        <div className="flex items-center gap-1.5 mb-2">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                                                            <div className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Draws</div>
                                                        </div>
                                                        <div className="text-2xl font-light text-white relative z-10">{other}</div>
                                                    </div>
                                                </div>
                                            </div>
                                        </>
                                    );
                                })()}
                            </div>
                        </div>

                        {/* 2. Recent Form Area Chart */}
                        <div className="lg:col-span-2 relative p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden group">
                            <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-blue-500/10 blur-[100px] rounded-full pointer-events-none" />
                            <div className="relative z-10 flex flex-col justify-between h-full min-h-[220px]">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="p-3 rounded-2xl bg-gradient-to-br from-blue-400/20 to-blue-600/10 shadow-[0_0_20px_rgba(59,130,246,0.15)] ring-1 ring-blue-400/30">
                                        <Activity className="w-5 h-5 text-blue-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-white font-semibold tracking-wide">Recent Form</h3>
                                        <p className="text-slate-400 text-xs mt-0.5">Last 10 Matches Trajectory</p>
                                    </div>
                                </div>
                                
                                {/* Smooth Area Chart SVG */}
                                <div className="flex-1 w-full relative mt-2">
                                    {(() => {
                                        const form = (analyticsData.recentForm || []).slice(0, 10);
                                        if (form.length === 0) return null;
                                        
                                        const width = 400;
                                        const height = 100;
                                        const xStep = width / Math.max(1, form.length - 1);
                                        
                                        // Calculate exact points
                                        const pts = form.map((r: string, i: number) => {
                                            const y = r === 'W' ? 20 : r === 'L' ? 80 : 50;
                                            return { x: i * xStep, y };
                                        });

                                        let path = `M ${pts[0].x},${pts[0].y}`;
                                        for (let i = 1; i < pts.length; i++) {
                                            path += ` L ${pts[i].x},${pts[i].y}`;
                                        }
                                        
                                        const areaPath = `${path} L ${width},${height} L 0,${height} Z`;

                                        return (
                                            <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible" preserveAspectRatio="none">
                                                <defs>
                                                    <linearGradient id="areaGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                                                        <stop offset="0%" stopColor="#10b981" stopOpacity="0.2" />
                                                        <stop offset="50%" stopColor="#64748b" stopOpacity="0.1" />
                                                        <stop offset="100%" stopColor="#f43f5e" stopOpacity="0" />
                                                    </linearGradient>
                                                    <linearGradient id="lineGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                                                        <stop offset="0%" stopColor="#10b981" />
                                                        <stop offset="50%" stopColor="#64748b" />
                                                        <stop offset="100%" stopColor="#f43f5e" />
                                                    </linearGradient>
                                                </defs>
                                                
                                                <path d={areaPath} fill="url(#areaGrad)" />
                                                <path d={path} fill="none" stroke="url(#lineGrad)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                                                
                                                {pts.map((p: any, i: number) => {
                                                    const r = form[i];
                                                    const color = r === 'W' ? '#10b981' : r === 'L' ? '#f43f5e' : '#64748b';
                                                    return (
                                                        <g key={i} className="group/point">
                                                            {/* Pointed Edges explicitly visible */}
                                                            <circle cx={p.x} cy={p.y} r="3" fill="#0B0D14" stroke={color} strokeWidth="2" className="transition-all duration-300 group-hover:r-5 group-hover:stroke-white" />
                                                            <text x={p.x} y={p.y - 12} fill="white" fontSize="12" fontWeight="500" textAnchor="middle" opacity="0" className="group-hover/point:opacity-100 transition-opacity pointer-events-none">{r}</text>
                                                            {/* Invisible hover target */}
                                                            <circle cx={p.x} cy={p.y} r="15" fill="transparent" className="cursor-pointer" />
                                                        </g>
                                                    );
                                                })}
                                            </svg>
                                        );
                                    })()}
                                </div>
                            </div>
                        </div>

                        {/* 3. Batting First */}
                        <div className="relative p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden group">
                            <div className="absolute -top-10 -right-10 w-32 h-32 bg-blue-500/10 blur-[40px] rounded-full pointer-events-none" />
                            <div className="relative z-10 flex flex-col justify-between h-full min-h-[160px]">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 rounded-2xl bg-blue-500/10 ring-1 ring-blue-500/30">
                                        <Shield className="w-4 h-4 text-blue-400" />
                                    </div>
                                    <h3 className="text-slate-300 text-sm font-medium">Batting First</h3>
                                </div>
                                <div>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-4xl font-light text-white tracking-tight">{batFirstWinPct}</span>
                                        <span className="text-lg text-blue-400">%</span>
                                    </div>
                                    <p className="text-slate-500 text-[10px] uppercase tracking-wider mt-1">{analyticsData.battingFirst?.won} WINS / {analyticsData.battingFirst?.matches} MATCHES</p>
                                </div>
                                <div className="w-full h-1.5 bg-slate-800 rounded-full mt-4 overflow-hidden">
                                    <div style={{ width: `${batFirstWinPct}%` }} className="h-full bg-blue-500 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
                                </div>
                            </div>
                        </div>

                        {/* 4. Chasing */}
                        <div className="relative p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden group">
                            <div className="absolute -top-10 -right-10 w-32 h-32 bg-purple-500/10 blur-[40px] rounded-full pointer-events-none" />
                            <div className="relative z-10 flex flex-col justify-between h-full min-h-[160px]">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 rounded-2xl bg-purple-500/10 ring-1 ring-purple-500/30">
                                        <Target className="w-4 h-4 text-purple-400" />
                                    </div>
                                    <h3 className="text-slate-300 text-sm font-medium">Chasing</h3>
                                </div>
                                <div>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-4xl font-light text-white tracking-tight">{chasingWinPct}</span>
                                        <span className="text-lg text-purple-400">%</span>
                                    </div>
                                    <p className="text-slate-500 text-[10px] uppercase tracking-wider mt-1">{analyticsData.chasing?.won} WINS / {analyticsData.chasing?.matches} MATCHES</p>
                                </div>
                                <div className="w-full h-1.5 bg-slate-800 rounded-full mt-4 overflow-hidden">
                                    <div style={{ width: `${chasingWinPct}%` }} className="h-full bg-purple-500 rounded-full shadow-[0_0_10px_rgba(168,85,247,0.5)]" />
                                </div>
                            </div>
                        </div>

                        {/* 5. Home / Away Split */}
                        <div className="lg:col-span-2 relative p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden group flex flex-col md:flex-row gap-4">
                            <div className="flex-1 bg-[#0B0D14]/50 rounded-2xl p-5 ring-1 ring-white/5 flex flex-col justify-between relative overflow-hidden">
                                <div className="absolute right-0 bottom-0 opacity-[0.03]"><Home className="w-32 h-32 -mr-8 -mb-8"/></div>
                                <div className="flex items-center gap-2 text-emerald-400/80 text-xs font-semibold uppercase tracking-widest mb-4"><Home className="w-4 h-4"/> Home Domain</div>
                                <div className="flex flex-col gap-1 relative z-10 mt-auto">
                                    <div className="flex items-end gap-2">
                                        <span className="text-3xl font-light text-white leading-none">{analyticsData.homeAway?.home?.won}</span>
                                        <span className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest mb-0.5">Wins</span>
                                    </div>
                                    <div className="flex items-end gap-2">
                                        <span className="text-2xl font-light text-slate-400 leading-none">{analyticsData.homeAway?.home?.lost}</span>
                                        <span className="text-[10px] text-rose-500 font-bold uppercase tracking-widest mb-0.5">Losses</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex-1 bg-[#0B0D14]/50 rounded-2xl p-5 ring-1 ring-white/5 flex flex-col justify-between relative overflow-hidden">
                                <div className="absolute right-0 bottom-0 opacity-[0.03]"><Plane className="w-32 h-32 -mr-8 -mb-8"/></div>
                                <div className="flex items-center gap-2 text-rose-400/80 text-xs font-semibold uppercase tracking-widest mb-4"><Plane className="w-4 h-4"/> Away Territory</div>
                                <div className="flex flex-col gap-1 relative z-10 mt-auto">
                                    <div className="flex items-end gap-2">
                                        <span className="text-3xl font-light text-white leading-none">{analyticsData.homeAway?.away?.won}</span>
                                        <span className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest mb-0.5">Wins</span>
                                    </div>
                                    <div className="flex items-end gap-2">
                                        <span className="text-2xl font-light text-slate-400 leading-none">{analyticsData.homeAway?.away?.lost}</span>
                                        <span className="text-[10px] text-rose-500 font-bold uppercase tracking-widest mb-0.5">Losses</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ── Row 2: Top Performances (Innings) ── */}
                    <div className="flex flex-col gap-10">
                        {/* Highest Scores */}
                        <div className="bg-slate-900/40 rounded-3xl border border-white/5 p-6 backdrop-blur-md">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-1.5 h-4 bg-amber-500 rounded-full" />
                                <h3 className="text-sm font-semibold uppercase tracking-widest text-slate-300">Highest Individual Scores</h3>
                            </div>
                            <div className="relative w-full px-4 sm:px-12 h-[340px] flex items-center justify-between">
                                {/* The Axis Line */}
                                <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-gradient-to-r from-amber-500/0 via-amber-500/30 to-amber-500/0 -translate-y-1/2" />
                                
                                {/* The Nodes */}
                                {(analyticsData.highestInnings || []).slice(0, 5).map((h: any, i: number) => (
                                    <div key={i} className="group relative flex flex-col items-center justify-center w-32 sm:w-48 h-full hover:-translate-y-2 transition-transform cursor-default z-10">
                                        
                                        {/* Top: Score */}
                                        <div className="absolute bottom-[calc(50%+2.25rem)] flex flex-col items-center w-full">
                                            <div className="relative">
                                                <span className="text-4xl sm:text-5xl font-light text-white tracking-tight group-hover:text-amber-400 transition-colors drop-shadow-md">{h.runs}</span>
                                                <div className="absolute -top-3 -right-6 text-[10px] font-black text-amber-500/50 group-hover:text-amber-400 transition-colors">#{i+1}</div>
                                            </div>
                                            {/* Connecting Stem */}
                                            <div className="w-[1px] h-6 bg-gradient-to-b from-amber-500/0 to-amber-500/50 mt-3 group-hover:to-amber-400 transition-colors" />
                                        </div>
                                        
                                        {/* Middle: The Node (Photo Space) */}
                                        <div className="w-14 h-14 rounded-full bg-[#0B0D14] border border-amber-500/40 group-hover:border-amber-400 z-10 flex items-center justify-center overflow-hidden group-hover:scale-110 group-hover:shadow-[0_0_20px_rgba(245,158,11,0.3)] transition-all bg-cover bg-center">
                                            {/* Photo Placeholder - You can render an img tag here later */}
                                            <span className="text-[8px] text-slate-600 uppercase tracking-widest font-semibold group-hover:text-amber-500/50 transition-colors">Photo</span>
                                        </div>
                                        
                                        {/* Bottom: Details */}
                                        <div className="absolute top-[calc(50%+2.25rem)] flex flex-col items-center w-full text-center">
                                            {/* Connecting Stem */}
                                            <div className="w-[1px] h-6 bg-gradient-to-t from-amber-500/0 to-amber-500/50 mb-3 group-hover:to-amber-400 transition-colors" />
                                            <span className="text-sm font-bold text-slate-200 group-hover:text-white transition-colors">{expandName(h.name)}</span>
                                            <span className="text-[10px] text-amber-400/80 font-bold uppercase tracking-widest mt-1.5">vs {h.opp}</span>
                                            <span className="text-[10px] text-slate-500 uppercase tracking-widest mt-1">{h.ground}</span>
                                            <span className="text-[9px] text-slate-600 mt-0.5">{h.date}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Best Bowling */}
                        <div className="bg-slate-900/40 rounded-3xl border border-white/5 p-6 backdrop-blur-md">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-1.5 h-4 bg-emerald-500 rounded-full" />
                                <h3 className="text-sm font-semibold uppercase tracking-widest text-slate-300">Best Bowling Figures</h3>
                            </div>
                            <div className="relative w-full px-4 sm:px-12 h-[340px] flex items-center justify-between">
                                {/* The Axis Line */}
                                <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-gradient-to-r from-emerald-500/0 via-emerald-500/30 to-emerald-500/0 -translate-y-1/2" />
                                
                                {/* The Nodes */}
                                {(analyticsData.bestBowling || []).slice(0, 5).map((b: any, i: number) => (
                                    <div key={i} className="group relative flex flex-col items-center justify-center w-32 sm:w-48 h-full hover:-translate-y-2 transition-transform cursor-default z-10">
                                        
                                        {/* Top: Score */}
                                        <div className="absolute bottom-[calc(50%+2.25rem)] flex flex-col items-center w-full">
                                            <div className="relative">
                                                <span className="text-4xl sm:text-5xl font-light text-white tracking-tight group-hover:text-emerald-400 transition-colors drop-shadow-md">{b.figures}</span>
                                                <div className="absolute -top-3 -right-6 text-[10px] font-black text-emerald-500/50 group-hover:text-emerald-400 transition-colors">#{i+1}</div>
                                            </div>
                                            {/* Connecting Stem */}
                                            <div className="w-[1px] h-6 bg-gradient-to-b from-emerald-500/0 to-emerald-500/50 mt-3 group-hover:to-emerald-400 transition-colors" />
                                        </div>
                                        
                                        {/* Middle: The Node (Photo Space) */}
                                        <div className="w-14 h-14 rounded-full bg-[#0B0D14] border border-emerald-500/40 group-hover:border-emerald-400 z-10 flex items-center justify-center overflow-hidden group-hover:scale-110 group-hover:shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all bg-cover bg-center">
                                            {/* Photo Placeholder - You can render an img tag here later */}
                                            <span className="text-[8px] text-slate-600 uppercase tracking-widest font-semibold group-hover:text-emerald-500/50 transition-colors">Photo</span>
                                        </div>
                                        
                                        {/* Bottom: Details */}
                                        <div className="absolute top-[calc(50%+2.25rem)] flex flex-col items-center w-full text-center">
                                            {/* Connecting Stem */}
                                            <div className="w-[1px] h-6 bg-gradient-to-t from-emerald-500/0 to-emerald-500/50 mb-3 group-hover:to-emerald-400 transition-colors" />
                                            <span className="text-sm font-bold text-slate-200 group-hover:text-white transition-colors">{expandName(b.name)}</span>
                                            <span className="text-[10px] text-emerald-400/80 font-bold uppercase tracking-widest mt-1.5">vs {b.opp}</span>
                                            <span className="text-[10px] text-slate-500 uppercase tracking-widest mt-1">{b.ground}</span>
                                            <span className="text-[9px] text-slate-600 mt-0.5">{b.date}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* ── Row 3: Year by Year + Venues ── */}
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                        {/* Year by Year */}
                        <div className="bg-slate-900/40 rounded-3xl border border-white/5 p-6 backdrop-blur-md flex flex-col h-[400px]">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2.5 rounded-xl bg-amber-400/10"><Calendar className="w-5 h-5 text-amber-400" /></div>
                                <h3 className="text-lg font-display font-bold text-white">Year-by-Year Form</h3>
                            </div>
                            <div className="flex-1 space-y-4 overflow-y-auto custom-scrollbar pr-2 pb-2">
                                {(analyticsData.yearByYear || []).map((y: any) => {
                                    const yWinPct = y.mat > 0 ? Math.round((y.won / y.mat) * 100) : 0;
                                    return (
                                        <div key={y.year} className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-2xl bg-[#0B0D14]/60 border border-white/5 hover:bg-white/[0.03] hover:border-white/10 transition-colors">
                                            {/* Left: Year & Win % */}
                                            <div className="flex sm:flex-col items-center sm:items-start justify-between w-full sm:w-16 shrink-0 border-b sm:border-b-0 sm:border-r border-white/10 pb-3 sm:pb-0 sm:pr-4">
                                                <span className="text-xl font-bold text-slate-200">{y.year}</span>
                                                <span className={`text-sm font-black mt-0.5 ${yWinPct >= 50 ? 'text-emerald-400' : 'text-rose-400'}`}>{yWinPct}%</span>
                                            </div>
                                            {/* Right: Dot Matrix */}
                                            <div className="flex-1 flex flex-wrap gap-1">
                                                {Array.from({ length: y.won }).map((_, i) => (
                                                    <div key={`w-${i}`} className="w-2.5 h-4 rounded-[2px] bg-emerald-500 hover:scale-125 transition-transform" title="Won" />
                                                ))}
                                                {Array.from({ length: y.lost }).map((_, i) => (
                                                    <div key={`l-${i}`} className="w-2.5 h-4 rounded-[2px] bg-rose-500 hover:scale-125 transition-transform" title="Lost" />
                                                ))}
                                                {Array.from({ length: y.tied || 0 }).map((_, i) => (
                                                    <div key={`t-${i}`} className="w-2.5 h-4 rounded-[2px] bg-amber-400 hover:scale-125 transition-transform" title="Tied" />
                                                ))}
                                                {Array.from({ length: y.drawNr || 0 }).map((_, i) => (
                                                    <div key={`d-${i}`} className="w-2.5 h-4 rounded-[2px] bg-slate-500 hover:scale-125 transition-transform" title="Draw/No Result" />
                                                ))}
                                            </div>
                                            
                                            {/* Far Right: Record */}
                                            <div className="flex gap-2 text-xs font-bold uppercase tracking-widest shrink-0 sm:flex-col sm:gap-1 sm:text-[10px] sm:items-end justify-end border-t sm:border-t-0 sm:border-l border-white/10 pt-3 sm:pt-0 sm:pl-4">
                                                <span className="text-emerald-400">{y.won}W</span>
                                                <span className="text-rose-400">{y.lost}L</span>
                                                {(y.tied > 0 || y.drawNr > 0) && (
                                                    <span className="text-slate-500">{(y.tied || 0) + (y.drawNr || 0)}D</span>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Venue Breakdown */}
                        <div className="bg-slate-900/40 rounded-3xl border border-white/5 p-6 backdrop-blur-md flex flex-col h-[400px]">
                            <div className="flex items-center justify-between mb-6 shrink-0">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 rounded-xl bg-blue-500/10"><MapPin className="w-5 h-5 text-blue-400" /></div>
                                    <h3 className="text-lg font-display font-bold text-white">Top Venues</h3>
                                </div>
                                <div className="relative">
                                    <button 
                                        onClick={() => setVenueDropdownOpen(!venueDropdownOpen)}
                                        className="flex items-center gap-2 bg-[#0B0D14]/80 text-slate-300 text-xs font-semibold px-4 py-2 rounded-lg border border-white/10 hover:border-white/20 transition-colors focus:outline-none shadow-sm"
                                    >
                                        {venueSort === 'winPct' ? 'Best Win %' : venueSort === 'matches' ? 'Most Matches' : 'Most Wins'}
                                        <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                                    </button>
                                    
                                    {venueDropdownOpen && (
                                        <>
                                            <div className="fixed inset-0 z-40" onClick={() => setVenueDropdownOpen(false)} />
                                            <div className="absolute right-0 top-full mt-2 w-40 bg-[#0F1219] border border-white/10 rounded-xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.7)] z-50 overflow-hidden">
                                                {[
                                                    { id: 'winPct', label: 'Best Win %' },
                                                    { id: 'matches', label: 'Most Matches' },
                                                    { id: 'wins', label: 'Most Wins' }
                                                ].map(opt => (
                                                    <button
                                                        key={opt.id}
                                                        className={`w-full text-left px-4 py-3 text-xs font-semibold transition-colors flex items-center justify-between ${venueSort === opt.id ? 'bg-blue-500/10 text-blue-400' : 'text-slate-300 hover:bg-white/5 hover:text-white'}`}
                                                        onClick={() => {
                                                            setVenueSort(opt.id as any);
                                                            setVenueDropdownOpen(false);
                                                        }}
                                                    >
                                                        {opt.label}
                                                        {venueSort === opt.id && <div className="w-1.5 h-1.5 rounded-full bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.8)]" />}
                                                    </button>
                                                ))}
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                            
                            <div className="flex-1 space-y-2 overflow-y-auto custom-scrollbar pr-2 pb-2">
                                {[...(analyticsData.venues || [])]
                                    .sort((a: any, b: any) => {
                                        if (venueSort === 'matches') return b.mat - a.mat;
                                        if (venueSort === 'wins') return b.won - a.won;
                                        const aPct = a.mat > 0 ? (a.won / a.mat) : 0;
                                        const bPct = b.mat > 0 ? (b.won / b.mat) : 0;
                                        return bPct - aPct;
                                    })
                                    .map((v: any, i: number) => {
                                    const vWinPct = v.mat > 0 ? Math.round((v.won / v.mat) * 100) : 0;
                                    
                                    return (
                                        <div key={i} className="group relative overflow-hidden flex items-center justify-between p-3 rounded-xl bg-[#0B0D14]/40 border border-white/5 hover:border-white/10 transition-colors">
                                            {/* Background Data Bar */}
                                            <div className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-blue-500/0 to-blue-500/20 border-r border-blue-500/50 transition-all duration-500" style={{ width: `${vWinPct}%` }} />
                                            
                                            <div className="relative z-10 flex items-center gap-4 w-full">
                                                {/* Rank */}
                                                <div className="w-8 h-8 rounded bg-slate-800/50 flex items-center justify-center text-xs font-bold text-slate-400 shrink-0 border border-white/5">
                                                    {i + 1}
                                                </div>
                                                
                                                {/* Venue Info */}
                                                <div className="flex-1 min-w-0 flex flex-col justify-center">
                                                    <span className="text-sm font-bold text-slate-200 truncate">{v.ground.replace(/^[^-]+ - /, '')}</span>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">{v.mat} MAT</span>
                                                        <span className="text-slate-700 text-[10px]">•</span>
                                                        <div className="flex gap-1.5 text-[10px] font-bold uppercase tracking-widest">
                                                            <span className="text-emerald-400/90">{v.won}W</span>
                                                            <span className="text-rose-400/90">{v.lost}L</span>
                                                            {(v.tied > 0 || v.drawNr > 0) && (
                                                                <span className="text-slate-500">{(v.tied||0)+(v.drawNr||0)}D</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                                
                                                {/* Win % */}
                                                <div className="shrink-0 flex items-center justify-end w-12">
                                                    <span className="text-lg font-light text-white tracking-tighter group-hover:text-blue-400 transition-colors">{vWinPct}%</span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* ── Row 4: Players Gallery ── */}
                    <div className="flex flex-col gap-8">
                        {/* Top Run Scorers */}
                        <div className="bg-slate-900/40 rounded-3xl border border-white/5 p-8 backdrop-blur-md flex flex-col h-full">
                            <div className="flex items-center justify-between mb-10 shrink-0">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 rounded-xl bg-amber-400/10"><TrendingUp className="w-5 h-5 text-amber-400" /></div>
                                    <h3 className="text-xl font-display font-bold text-white">Top Run Scorers</h3>
                                </div>
                                <span className="text-xs font-semibold bg-white/8 px-3 py-1 rounded-md text-slate-400">All Time</span>
                            </div>
                            
                            <div className="flex-1 flex gap-12 overflow-x-auto hide-scrollbar pb-8 pt-4 px-4 items-end snap-x snap-mandatory">
                                {(analyticsData.players?.topRunScorers || []).map((p: any, i: number) => (
                                    <div key={i} className="flex flex-col items-center group shrink-0 w-[160px] snap-center">
                                        <div className="relative mb-6 w-full max-w-[130px] aspect-square">
                                            {playerImages[p.name] ? (
                                                <img src={playerImages[p.name]} alt={p.name} className="w-full h-full object-cover rounded-2xl border border-white/5 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.5)] group-hover:-translate-y-2 group-hover:border-amber-400/30 transition-all duration-500 bg-[#0B0D14]" />
                                            ) : (
                                                <div className="w-full h-full rounded-2xl bg-slate-800/50 border border-white/5 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.5)] flex items-center justify-center text-5xl font-bold text-slate-700 group-hover:-translate-y-2 group-hover:border-amber-400/30 transition-all duration-500">
                                                    {p.name.charAt(0)}
                                                </div>
                                            )}
                                            <div className="absolute -bottom-3 -right-3 w-8 h-8 rounded-lg bg-[#0B0D14] border border-white/10 flex items-center justify-center text-slate-400 font-bold text-sm shadow-lg">
                                                #{i + 1}
                                            </div>
                                        </div>
                                        
                                        <span className="text-4xl sm:text-5xl font-light text-white tracking-tighter mb-2 group-hover:text-amber-400 transition-colors">
                                            {p.runs?.toLocaleString()}
                                        </span>
                                        
                                        <span className="font-bold text-slate-200 text-center text-base leading-tight mb-3 h-12 flex items-center justify-center">
                                            {expandName(p.name)}
                                        </span>
                                        
                                        <div className="flex flex-col items-center gap-1 text-[11px] text-slate-500 font-mono uppercase tracking-wider">
                                            {p.matches && <span>{p.matches} Mat</span>}
                                            {p.avg && <span>Avg <span className="text-slate-300">{p.avg}</span></span>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Top Wicket Takers */}
                        <div className="bg-slate-900/40 rounded-3xl border border-white/5 p-8 backdrop-blur-md flex flex-col h-full">
                            <div className="flex items-center justify-between mb-10 shrink-0">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 rounded-xl bg-emerald-400/10"><Activity className="w-5 h-5 text-emerald-400" /></div>
                                    <h3 className="text-xl font-display font-bold text-white">Top Wicket Takers</h3>
                                </div>
                                <span className="text-xs font-semibold bg-white/8 px-3 py-1 rounded-md text-slate-400">All Time</span>
                            </div>
                            
                            <div className="flex-1 flex gap-12 overflow-x-auto hide-scrollbar pb-8 pt-4 px-4 items-end snap-x snap-mandatory">
                                {(analyticsData.players?.topWicketTakers || []).map((p: any, i: number) => (
                                    <div key={i} className="flex flex-col items-center group shrink-0 w-[160px] snap-center">
                                        <div className="relative mb-6 w-full max-w-[130px] aspect-square">
                                            {playerImages[p.name] ? (
                                                <img src={playerImages[p.name]} alt={p.name} className="w-full h-full object-cover rounded-2xl border border-white/5 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.5)] group-hover:-translate-y-2 group-hover:border-emerald-400/30 transition-all duration-500 bg-[#0B0D14]" />
                                            ) : (
                                                <div className="w-full h-full rounded-2xl bg-slate-800/50 border border-white/5 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.5)] flex items-center justify-center text-5xl font-bold text-slate-700 group-hover:-translate-y-2 group-hover:border-emerald-400/30 transition-all duration-500">
                                                    {p.name.charAt(0)}
                                                </div>
                                            )}
                                            <div className="absolute -bottom-3 -right-3 w-8 h-8 rounded-lg bg-[#0B0D14] border border-white/10 flex items-center justify-center text-slate-400 font-bold text-sm shadow-lg">
                                                #{i + 1}
                                            </div>
                                        </div>
                                        
                                        <span className="text-4xl sm:text-5xl font-light text-white tracking-tighter mb-2 group-hover:text-emerald-400 transition-colors">
                                            {p.wickets}
                                        </span>
                                        
                                        <span className="font-bold text-slate-200 text-center text-base leading-tight mb-3 h-12 flex items-center justify-center">
                                            {expandName(p.name)}
                                        </span>
                                        
                                        <div className="flex flex-col items-center gap-1 text-[11px] text-slate-500 font-mono uppercase tracking-wider">
                                            {p.matches && <span>{p.matches} Mat</span>}
                                            {p.econ && <span>Econ <span className="text-slate-300">{p.econ}</span></span>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* ── Row 5: Head-to-Head ── */}
                    <div className="bg-[#0B0D14]/80 rounded-2xl border border-white/[0.04] p-8 backdrop-blur-xl shadow-2xl">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
                            <div className="flex items-center gap-3">
                                <div className="p-3 rounded-xl bg-purple-400/10 shadow-[0_0_15px_rgba(192,132,252,0.15)]"><Shield className="w-6 h-6 text-purple-400" /></div>
                                <h3 className="text-2xl font-display font-bold text-white tracking-tight">Head-to-Head Records</h3>
                            </div>
                            <input
                                type="text" placeholder="Filter opponent..."
                                value={h2hFilter} onChange={e => setH2hFilter(e.target.value)}
                                className="bg-[#131825]/80 border border-white/[0.05] rounded-xl px-5 py-3 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500/50 focus:bg-[#131825] transition-all w-full sm:w-64 shadow-inner"
                            />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 max-h-[500px] overflow-y-auto custom-scrollbar pr-2 pb-2">
                            {h2hEntries.map(([opp, rec]: any) => {
                                const oppWinPct = rec.played > 0 ? Math.round((rec.won / rec.played) * 100) : 0;
                                return (
                                    <div key={opp} className="flex flex-col gap-4 p-5 rounded-2xl bg-white/[0.02] border border-white/[0.03] hover:bg-gradient-to-br hover:from-white/[0.05] hover:to-transparent hover:border-white/[0.1] hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:-translate-y-1 transition-all duration-500 ease-out group">
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-center gap-3">
                                                {teamFlags[opp] ? (
                                                    <div className="w-11 h-11 rounded-full bg-white shadow-[0_0_15px_rgba(255,255,255,0.1)] flex items-center justify-center shrink-0 p-1 group-hover:scale-110 transition-transform duration-300">
                                                        <img src={teamFlags[opp]} alt={opp} className={`w-full h-full object-contain ${opp === 'New Zealand' ? 'brightness-0' : ''}`} />
                                                    </div>
                                                ) : (
                                                    <div className="w-11 h-11 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center shrink-0 text-slate-500 font-bold text-sm">
                                                        {opp.charAt(0)}
                                                    </div>
                                                )}
                                                <div>
                                                    <p className="text-white font-bold text-base truncate tracking-wide">{opp}</p>
                                                    <p className="text-slate-500 text-xs mt-0.5 font-medium">{rec.played} matches</p>
                                                </div>
                                            </div>
                                            <div className={`text-xs font-black px-2.5 py-1.5 rounded-lg shrink-0 shadow-sm ${oppWinPct >= 60 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : oppWinPct >= 40 ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'}`}>
                                                {oppWinPct}%
                                            </div>
                                        </div>
                                        
                                        <div className="flex flex-col gap-2 mt-1">
                                            <div className="flex justify-between items-center text-xs font-bold px-1">
                                                <span className="text-emerald-400">{rec.won}W</span>
                                                <span className="flex gap-2">
                                                    {rec.tied > 0 && <span className="text-amber-400">{rec.tied}T</span>}
                                                    {rec.drawNr > 0 && <span className="text-slate-500">{rec.drawNr}D</span>}
                                                </span>
                                                <span className="text-rose-400">{rec.lost}L</span>
                                            </div>
                                            <div className="flex h-1.5 w-full rounded-full overflow-hidden gap-0.5 bg-[#0B0D14] shadow-inner">
                                                {rec.won > 0 && <div className="bg-emerald-500" style={{ width: `${(rec.won / rec.played) * 100}%` }} />}
                                                {rec.tied > 0 && <div className="bg-amber-400" style={{ width: `${(rec.tied / rec.played) * 100}%` }} />}
                                                {rec.drawNr > 0 && <div className="bg-slate-500" style={{ width: `${(rec.drawNr / rec.played) * 100}%` }} />}
                                                {rec.lost > 0 && <div className="bg-rose-500" style={{ width: `${(rec.lost / rec.played) * 100}%` }} />}
                                            </div>
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
                                                <div 
                                                    key={player.espnId} 
                                                    onClick={() => navigate('/performance-lab', { state: { targetTab: 'players', targetPlayerName: player.name, targetPlayerId: player.espnId, targetSport: 'cricket' } })}
                                                    className="group relative flex flex-col items-center bg-slate-800/30 hover:bg-slate-800/80 p-4 rounded-2xl border border-white/5 hover:border-white/20 transition-all duration-300 cursor-pointer"
                                                >
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
                                                    <p className="text-[10px] text-slate-500 uppercase tracking-wider mt-2 font-semibold">
                                                        {player.role ? (player.role.toLowerCase().includes('wicketkeeper') ? 'Wicketkeeper' : player.role.replace(/top order batter/i, 'Batsman').replace(/middle order batter/i, 'Batsman').replace(/opening batter/i, 'Batsman').replace(/batter/i, 'Batsman')) : 'Player'}
                                                    </p>
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
