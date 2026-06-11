import { useEffect, useState } from 'react';
import { TrendingPlayerData } from '../../hooks/football/useTrendingPlayers';
import { X, User, Star, Target, Zap, Shield, Swords, Activity, ShieldCheck } from 'lucide-react';

const BACKEND_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const StatRow = ({ label, value }: { label: string, value: string | number }) => (
  <div className="flex justify-between items-center py-2.5 border-b border-white/5 last:border-0 gap-3">
    <span className="text-xs text-white/60 leading-tight">{label}</span>
    <span className="text-sm font-bold text-white whitespace-nowrap tabular-nums">{value}</span>
  </div>
);

interface TrendingPlayerModalProps {
  player: TrendingPlayerData | null;
  onClose: () => void;
}

export function TrendingPlayerModal({ player, onClose }: TrendingPlayerModalProps) {
  const [imgError, setImgError] = useState(false);

  // Reset img error state when player changes
  useEffect(() => {
    setImgError(false);
  }, [player?.playerId]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (player) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [player, onClose]);

  if (!player) return null;

  const rawData: any = player.rawData || {};

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 sm:px-0">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div 
        className="relative w-full max-w-2xl bg-[#111214] border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]"
      >
        {/* Header Background */}
        <div className="h-32 bg-gradient-to-br from-[#2a2b2e] to-[#111214] relative">
          <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
          
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 z-20 p-2 rounded-full bg-black/40 hover:bg-black/60 text-white/70 hover:text-white transition-colors border border-white/5"
          >
            <X size={20} />
          </button>
        </div>

        {/* Profile Info overlaps header */}
        <div className="px-6 relative -mt-16 pb-6 flex-shrink-0">
          <div className="flex flex-col sm:flex-row gap-5 items-center sm:items-end">
            
            {/* Avatar */}
            <div className="w-32 h-32 rounded-full border-4 border-[#111214] bg-[#1a1b1e] flex items-center justify-center overflow-hidden shadow-xl relative z-10 shrink-0">
              {!imgError ? (
                <img 
                  src={`${BACKEND_URL}/football/trending-players/${player.playerId}/image`} 
                  alt={player.playerName}
                  className="w-full h-full object-cover object-top"
                  onError={() => setImgError(true)}
                />
              ) : (
                <User size={48} className="text-white/20" />
              )}
            </div>

            {/* Name & Titles */}
            <div className="flex-1 text-center sm:text-left mb-2">
              <h2 className="text-2xl font-bold text-white tracking-tight">{player.playerName}</h2>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-2">
                {player.position && (
                  <span className="px-2.5 py-1 rounded-md bg-white/5 border border-white/10 text-xs font-medium text-white/80">
                    {player.position}
                  </span>
                )}
                {player.teamName && (
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#d4af37]/10 border border-[#d4af37]/20">
                    {(player.teamId || player.teamFlag) && (
                      <img 
                        src={player.teamId ? `${BACKEND_URL}/football/trending-players/team/${player.teamId}/image` : player.teamFlag!} 
                        alt="flag" 
                        className="w-4 h-4 object-contain rounded-full" 
                      />
                    )}
                    <span className="text-xs font-semibold text-[#d4af37]">
                      {player.teamName}
                    </span>
                  </div>
                )}
                {(() => {
                  const country = rawData.player?.country || rawData.country;
                  const nationality = rawData.player?.nationality || rawData.nationality;
                  
                  if (!country && !nationality) return null;
                  
                  const alpha2 = country?.alpha2;
                  const name = country?.name || nationality;

                  if (!name) return null;

                  return (
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/5 border border-white/10">
                      {alpha2 && (
                        <img 
                          src={`https://flagcdn.com/w20/${alpha2.toLowerCase()}.png`} 
                          alt={name} 
                          className="w-4 h-3 object-cover rounded-sm" 
                          onError={(e) => { e.currentTarget.style.display = 'none'; }}
                        />
                      )}
                      <span className="text-xs font-medium text-white/80">
                        {name}
                      </span>
                    </div>
                  );
                })()}
              </div>
            </div>

          </div>
        </div>

        {/* Scrollable Content */}
        <div className="px-6 pb-6 overflow-y-auto custom-scrollbar flex-1">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            {/* Quick Details Card */}
            <div className="bg-[#1a1b1e] rounded-xl p-4 border border-white/5 space-y-3">
              <h4 className="text-xs font-bold text-white/40 uppercase tracking-wider mb-2">Details</h4>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-white/60">Jersey Number</span>
                <span className="text-sm font-semibold text-white">
                  {rawData.player?.jerseyNumber || rawData.jerseyNumber || 'N/A'}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-white/60">Date of Birth</span>
                <span className="text-sm font-semibold text-white">
                  {rawData.player?.dateOfBirthTimestamp 
                    ? new Date(rawData.player.dateOfBirthTimestamp * 1000).toLocaleDateString()
                    : rawData.player?.DOB || 'N/A'}
                </span>
              </div>

              <div className="flex justify-between items-center pt-2 border-t border-white/5">
                <span className="text-sm text-white/60">Market Value</span>
                <span className="text-sm font-bold text-[#d4af37]">
                  {(() => {
                    if (rawData.player?.proposedMarketValueFormatted) return rawData.player.proposedMarketValueFormatted;
                    const rawVal = rawData.player?.proposedMarketValueRaw || rawData.proposedMarketValueRaw;
                    if (!rawVal || !rawVal.value) return 'N/A';
                    const val = rawVal.value;
                    const cur = rawVal.currency === 'EUR' ? '€' : rawVal.currency === 'GBP' ? '£' : '$';
                    if (val >= 1000000) return `${cur}${(val / 1000000).toFixed(1)}M`;
                    if (val >= 1000) return `${cur}${(val / 1000).toFixed(0)}K`;
                    return `${cur}${val}`;
                  })()}
                </span>
              </div>
            </div>

            {/* Performance Stats Card */}
            <div className="bg-[#1a1b1e] rounded-xl p-4 border border-white/5 flex flex-col justify-center">
              <h4 className="text-xs font-bold text-white/40 uppercase tracking-wider mb-4">Overall Rating</h4>
              <div className="flex items-center justify-center gap-3">
                <Star size={36} className="text-[#d4af37] fill-[#d4af37]" />
                <span className="text-5xl font-black text-white tracking-tighter">
                  {player.rating ? player.rating.toFixed(1) : '-'}
                </span>
              </div>
            </div>
          </div>

          {/* Detailed Stats Grid */}
          <div className="bg-[#1a1b1e] rounded-xl border border-white/5 overflow-hidden">
            <div className="px-4 py-3 bg-white/5 border-b border-white/5">
              <h4 className="text-xs font-bold text-white/80 uppercase tracking-wider">Tournament Stats</h4>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 divide-white/5">
              
              <div className="p-4 flex flex-col items-center text-center">
                <Target size={20} className="text-white/40 mb-2" />
                <span className="text-2xl font-bold text-white mb-1">{player.stats.goals}</span>
                <span className="text-[10px] uppercase font-bold text-white/40 tracking-wider">Goals</span>
              </div>

              <div className="p-4 flex flex-col items-center text-center">
                <Zap size={20} className="text-white/40 mb-2" />
                <span className="text-2xl font-bold text-white mb-1">{player.stats.assists}</span>
                <span className="text-[10px] uppercase font-bold text-white/40 tracking-wider">Assists</span>
              </div>

              <div className="p-4 flex flex-col items-center text-center">
                <svg className="w-5 h-5 text-white/40 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
                <span className="text-2xl font-bold text-white mb-1">{player.stats.passes}</span>
                <span className="text-[10px] uppercase font-bold text-white/40 tracking-wider">Acc. Passes</span>
              </div>

              <div className="p-4 flex flex-col items-center text-center">
                <Shield size={20} className="text-white/40 mb-2" />
                <span className="text-2xl font-bold text-white mb-1">{player.stats.saves}</span>
                <span className="text-[10px] uppercase font-bold text-white/40 tracking-wider">Saves</span>
              </div>

            </div>
          </div>
          
          {/* Match Context (if available) */}
          {rawData.event?.tournament && (
            <div className="mt-4 px-4 py-3 bg-[#d4af37]/5 border border-[#d4af37]/20 rounded-xl flex items-center justify-center text-center">
              <p className="text-xs text-[#d4af37] font-medium">
                Trending in <span className="font-bold">{rawData.event.tournament.name}</span>
              </p>
            </div>
          )}

          {/* Advanced Metrics */}
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Offensive & Creative */}
            <div className="bg-[#1a1b1e] rounded-xl border border-white/5 p-4 flex flex-col hover:border-white/10 transition-colors">
              <div className="flex items-center text-[#d4af37] mb-3">
                <Swords size={16} className="mr-2" />
                <h4 className="text-xs font-bold uppercase tracking-wider">Attack & Creativity</h4>
              </div>
              <div className="flex-1 flex flex-col">
                <StatRow label="Expected Goals (xG)" value={rawData.expectedGoals ?? '-'} />
                <StatRow label="Expected Assists (xA)" value={rawData.expectedAssists ?? '-'} />
                <StatRow label="Shots (On/Tot)" value={`${rawData.onTargetScoringAttempt ?? 0} / ${rawData.totalShots ?? 0}`} />
                <StatRow label="Key Passes" value={rawData.keyPass ?? '-'} />
                <StatRow label="Big Chances" value={rawData.bigChanceCreated ?? '-'} />
                <StatRow label="Succ. Dribbles" value={`${rawData.wonContest ?? 0} / ${rawData.totalContest ?? 0}`} />
              </div>
            </div>

            {/* Gameplay & Possession */}
            <div className="bg-[#1a1b1e] rounded-xl border border-white/5 p-4 flex flex-col hover:border-white/10 transition-colors">
              <div className="flex items-center text-[#d4af37] mb-3">
                <Activity size={16} className="mr-2" />
                <h4 className="text-xs font-bold uppercase tracking-wider">Play & Possession</h4>
              </div>
              <div className="flex-1 flex flex-col">
                <StatRow label="Minutes Played" value={rawData.minutesPlayed ? `${rawData.minutesPlayed}'` : '-'} />
                <StatRow label="Total Touches" value={rawData.touches ?? '-'} />
                <StatRow label="Pass Accuracy" value={rawData.totalPass ? `${((rawData.accuratePass / rawData.totalPass) * 100).toFixed(1)}%` : '-'} />
                <StatRow label="Long Balls (Acc/Tot)" value={`${rawData.accurateLongBalls ?? 0} / ${rawData.totalLongBalls ?? 0}`} />
                <StatRow label="Fouls Won" value={rawData.wasFouled ?? '-'} />
                <StatRow label="Possession Lost" value={rawData.possessionLostCtrl ?? '-'} />
              </div>
            </div>

            {/* Defensive & Physical */}
            <div className="bg-[#1a1b1e] rounded-xl border border-white/5 p-4 flex flex-col hover:border-white/10 transition-colors">
              <div className="flex items-center text-[#d4af37] mb-3">
                <ShieldCheck size={16} className="mr-2" />
                <h4 className="text-xs font-bold uppercase tracking-wider">Defense & Physical</h4>
              </div>
              <div className="flex-1 flex flex-col">
                <StatRow label="Duels Won" value={rawData.duelWon ?? '-'} />
                <StatRow label="Aerials Won" value={rawData.aerialWon ?? '-'} />
                <StatRow label="Recoveries" value={rawData.ballRecovery ?? '-'} />
                <StatRow label="Interceptions" value={rawData.interceptionWon ?? '-'} />
                <StatRow label="Tackles Won" value={rawData.wonTackle ?? '-'} />
                <StatRow label="Clearances" value={rawData.totalClearance ?? '-'} />
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
