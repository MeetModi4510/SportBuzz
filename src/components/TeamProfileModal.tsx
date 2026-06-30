import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Shield, Calendar, Users, Activity } from 'lucide-react';
import { customMatchApi } from '@/services/api';
import { getPlayerRole, PlayerRole } from '@/data/scoringTypes';

interface TeamProfileModalProps {
  team: any | null;
  isOpen: boolean;
  onClose: () => void;
}

export const TeamProfileModal: React.FC<TeamProfileModalProps> = ({ team, isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'roster' | 'matches'>('roster');
  const [matches, setMatches] = useState<any[]>([]);
  const [loadingMatches, setLoadingMatches] = useState(false);

  useEffect(() => {
    if (team && isOpen && activeTab === 'matches') {
      fetchMatches();
    }
  }, [team, isOpen, activeTab]);

  const fetchMatches = async () => {
    if (!team) return;
    setLoadingMatches(true);
    try {
      const response = await customMatchApi.getAll({ teamId: team._id }) as any;
      if (response.success) {
        setMatches(response.data);
      }
    } catch (error) {
      console.error("Failed to fetch matches", error);
    } finally {
      setLoadingMatches(false);
    }
  };

  if (!team) return null;

  // Group players
  const roster: Record<PlayerRole, any[]> = {
    "Batsman": [],
    "Bowler": [],
    "All-Rounder": [],
    "Wicket Keeper": []
  };

  if (team.players && Array.isArray(team.players)) {
    team.players.forEach((p: any) => {
      const role = getPlayerRole(p);
      roster[role].push(p);
    });
  }

  const roleColors: Record<PlayerRole, { bg: string, text: string }> = {
    "Batsman": { bg: "bg-blue-500/10", text: "text-blue-400" },
    "Bowler": { bg: "bg-red-500/10", text: "text-red-400" },
    "All-Rounder": { bg: "bg-purple-500/10", text: "text-purple-400" },
    "Wicket Keeper": { bg: "bg-yellow-500/10", text: "text-yellow-400" }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-slate-950 text-white border-white/10 max-w-3xl max-h-[90vh] overflow-hidden flex flex-col p-0">
        
        {/* Header Section */}
        <div className="relative overflow-hidden bg-slate-900 border-b border-white/10 p-8 flex flex-col md:flex-row gap-6 items-center md:items-start shrink-0">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-transparent pointer-events-none" />
          
          <div className="relative w-24 h-24 rounded-2xl bg-slate-800 border-2 border-white/10 flex items-center justify-center text-4xl font-black shadow-2xl shrink-0 overflow-hidden">
            {team.logo ? (
              <img src={team.logo} alt={team.name} className="w-full h-full object-cover" />
            ) : (
              <span className="bg-gradient-to-br from-white to-white/50 bg-clip-text text-transparent">
                {team.acronym || team.name.substring(0, 2).toUpperCase()}
              </span>
            )}
          </div>
          
          <div className="relative text-center md:text-left flex-1">
            <h2 className="text-3xl font-black text-white mb-2 tracking-tight">{team.name}</h2>
            {team.acronym && (
               <div className="inline-flex px-3 py-1 bg-white/5 rounded-full border border-white/10 text-sm font-bold tracking-widest text-slate-300">
                 {team.acronym}
               </div>
            )}
          </div>
          
          <div className="relative flex items-center gap-4 text-slate-400 font-medium">
             <div className="flex flex-col items-center p-3 bg-white/5 rounded-xl border border-white/5">
                <Users className="w-5 h-5 text-blue-400 mb-1" />
                <span className="text-lg text-white font-bold">{team.players?.length || 0}</span>
                <span className="text-xs uppercase tracking-wider">Players</span>
             </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-white/10 px-6 bg-slate-900 shrink-0">
          <button 
            onClick={() => setActiveTab('roster')}
            className={`flex items-center gap-2 px-6 py-4 font-semibold text-sm transition-all border-b-2 ${activeTab === 'roster' ? 'border-blue-500 text-blue-400 bg-blue-500/5' : 'border-transparent text-slate-400 hover:text-white hover:bg-white/5'}`}
          >
            <Shield className="w-4 h-4" /> Team Roster
          </button>
          <button 
            onClick={() => setActiveTab('matches')}
            className={`flex items-center gap-2 px-6 py-4 font-semibold text-sm transition-all border-b-2 ${activeTab === 'matches' ? 'border-blue-500 text-blue-400 bg-blue-500/5' : 'border-transparent text-slate-400 hover:text-white hover:bg-white/5'}`}
          >
            <Calendar className="w-4 h-4" /> Matches
          </button>
        </div>

        {/* Content Area */}
        <div className="overflow-y-auto p-6 bg-slate-950 flex-1">
          {activeTab === 'roster' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {(Object.keys(roster) as PlayerRole[]).map(role => (
                roster[role].length > 0 && (
                  <div key={role} className="space-y-3">
                    <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${roleColors[role].bg.replace('/10', '')}`} />
                      {role}s ({roster[role].length})
                    </h3>
                    <div className="space-y-2">
                      {roster[role].map((p: any, idx: number) => {
                        const pName = typeof p === 'string' ? p : p.name;
                        const isCaptain = team.captainId === p.userId || pName === team.captain;
                        return (
                          <div key={idx} className="flex items-center gap-4 p-3 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-colors">
                            <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center font-bold text-slate-400 shrink-0">
                              {pName.charAt(0)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="text-white font-semibold truncate">{pName}</h4>
                              <div className="flex gap-2">
                                <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${roleColors[role].bg} ${roleColors[role].text}`}>
                                  {role}
                                </span>
                              </div>
                            </div>
                            {isCaptain && (
                              <span className="px-2.5 py-1 bg-yellow-500/10 text-yellow-500 text-[10px] font-black uppercase tracking-widest rounded-full shrink-0">
                                C
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )
              ))}
            </div>
          )}

          {activeTab === 'matches' && (
            <div className="space-y-4">
              {loadingMatches ? (
                <div className="py-12 text-center text-slate-500 animate-pulse">
                  <Activity className="w-8 h-8 mx-auto mb-3 opacity-50" />
                  Loading matches...
                </div>
              ) : matches.length > 0 ? (
                matches.map((match: any) => (
                   <div key={match._id} className="p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-colors flex flex-col md:flex-row items-center gap-6">
                     <div className="text-center md:text-left">
                       <div className="text-sm font-medium text-slate-400">{new Date(match.date).toLocaleDateString()}</div>
                       <div className="text-xs font-bold uppercase tracking-widest text-slate-500 mt-1">{match.status}</div>
                     </div>
                     
                     <div className="flex-1 flex items-center justify-center md:justify-start gap-4">
                       <div className={`font-bold text-lg ${match.homeTeam?._id === team._id ? 'text-blue-400' : 'text-white'}`}>
                         {match.homeTeam?.name || 'TBD'}
                       </div>
                       <span className="text-slate-500 font-black text-sm">VS</span>
                       <div className={`font-bold text-lg ${match.awayTeam?._id === team._id ? 'text-blue-400' : 'text-white'}`}>
                         {match.awayTeam?.name || 'TBD'}
                       </div>
                     </div>
                     
                     <div className="text-right">
                        {match.status === 'completed' && match.winner && (
                          <div className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest inline-flex ${match.winner === team._id ? 'bg-green-500/10 text-green-400' : 'bg-slate-800 text-slate-400'}`}>
                            {match.winner === team._id ? 'Won' : 'Lost'}
                          </div>
                        )}
                     </div>
                   </div>
                ))
              ) : (
                <div className="py-16 text-center bg-white/[0.01] border border-white/5 rounded-3xl">
                  <Calendar className="w-12 h-12 text-slate-700 mx-auto mb-4" />
                  <h4 className="text-white font-medium mb-1">No Matches Yet</h4>
                  <p className="text-slate-500 text-sm">This team hasn't participated in any matches.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
