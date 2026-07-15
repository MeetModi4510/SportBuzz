import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Plus, X, Users, Clock, Trophy, MapPin, ArrowRight, Loader2 } from 'lucide-react';
import { footballApi } from '@/services/api';
import { toast } from 'sonner';

export default function CreateSingleMatch() {
    const navigate = useNavigate();
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Config State
    const [format, setFormat] = useState<number>(6); // Default 6v6
    const [customFormat, setCustomFormat] = useState<number | ''>('');
    const [duration, setDuration] = useState<number>(60);
    const [halfDuration, setHalfDuration] = useState<number>(30);
    const [venue, setVenue] = useState<string>('Local Pitch');
    const [allowPenalties, setAllowPenalties] = useState<boolean>(false);
    const [unlimitedSubs, setUnlimitedSubs] = useState<boolean>(true);
    const [maxSubstitutions, setMaxSubstitutions] = useState<number>(5);

    const playersNeeded = format === 0 ? (Number(customFormat) || 0) : format;

    // Team A State
    const [teamAName, setTeamAName] = useState('Team A');
    const [teamAPlayers, setTeamAPlayers] = useState<string[]>([]);
    const [newPlayerA, setNewPlayerA] = useState('');

    // Team B State
    const [teamBName, setTeamBName] = useState('Team B');
    const [teamBPlayers, setTeamBPlayers] = useState<string[]>([]);
    const [newPlayerB, setNewPlayerB] = useState('');

    const handleAddPlayer = (team: 'A' | 'B', name: string) => {
        if (!name.trim()) return;
        if (team === 'A') {
            if (teamAPlayers.length >= playersNeeded) return toast.error(`Team A already has ${playersNeeded} players.`);
            setTeamAPlayers([...teamAPlayers, name.trim()]);
            setNewPlayerA('');
        } else {
            if (teamBPlayers.length >= playersNeeded) return toast.error(`Team B already has ${playersNeeded} players.`);
            setTeamBPlayers([...teamBPlayers, name.trim()]);
            setNewPlayerB('');
        }
    };

    const handleRemovePlayer = (team: 'A' | 'B', index: number) => {
        if (team === 'A') {
            setTeamAPlayers(teamAPlayers.filter((_, i) => i !== index));
        } else {
            setTeamBPlayers(teamBPlayers.filter((_, i) => i !== index));
        }
    };

    const isValid = () => {
        if (!teamAName.trim() || !teamBName.trim()) return false;
        if (teamAPlayers.length !== playersNeeded || teamBPlayers.length !== playersNeeded) return false;
        if (playersNeeded === 0) return false;
        return true;
    };

    const handleCreateMatch = async () => {
        if (!isValid()) return toast.error("Please fill all required fields and ensure both teams have the correct number of players.");
        
        setIsSubmitting(true);
        try {
            // 1. Create Team A
            const resA = await footballApi.createTeam({
                name: teamAName,
                players: teamAPlayers.map((name, index) => ({ 
                    name, 
                    role: index === 0 ? 'Goalkeeper' : 'Midfielder' 
                })),
            });
            const teamAId = resA.data._id;

            // 2. Create Team B
            const resB = await footballApi.createTeam({
                name: teamBName,
                players: teamBPlayers.map((name, index) => ({ 
                    name, 
                    role: index === 0 ? 'Goalkeeper' : 'Midfielder' 
                })),
            });
            const teamBId = resB.data._id;

            // 3. Create Match
            const resMatch = await footballApi.createMatch({
                tournamentId: null, // Standalone match
                homeTeam: teamAId,
                awayTeam: teamBId,
                matchDate: new Date(),
                venue: venue || 'Local Pitch',
                matchConfig: {
                    playersPerTeam: playersNeeded,
                    duration: Number(duration),
                    halfDuration: Number(halfDuration),
                    maxSubstitutions: unlimitedSubs ? 999 : Number(maxSubstitutions),
                    allowPenalties
                }
            });

            toast.success("Match created successfully!");
            navigate(`/football/match/${resMatch.data._id}`);

        } catch (error: any) {
            console.error("Failed to create match:", error);
            toast.error(error.response?.data?.message || "Failed to create match.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const formatOptions = [5, 6, 7, 11, 0]; // 0 means custom

    return (
        <div className="w-full h-full p-4 md:p-8 overflow-y-auto bg-background text-foreground custom-scrollbar pb-24">
            <div className="max-w-6xl mx-auto space-y-8">
                
                <div className="flex flex-col gap-2">
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">Create Single Match</h1>
                    <p className="text-muted-foreground">Setup a quick standalone match, define rules, and add players.</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    
                    {/* Left Column: Match Configuration */}
                    <div className="lg:col-span-1 space-y-6">
                        <Card className="border-border/50 shadow-sm bg-card overflow-hidden">
                            <div className="px-6 py-4 bg-muted/30 border-b border-border/50 flex items-center gap-3">
                                <Trophy className="text-primary" size={20} />
                                <h2 className="font-semibold text-lg">Match Config</h2>
                            </div>
                            <CardContent className="p-6 space-y-6">
                                
                                <div className="space-y-3">
                                    <Label>Match Format</Label>
                                    <div className="flex flex-wrap gap-2">
                                        {formatOptions.map(opt => (
                                            <Button 
                                                key={opt}
                                                variant={format === opt ? "default" : "outline"}
                                                size="sm"
                                                onClick={() => setFormat(opt)}
                                                className={`rounded-full ${format === opt ? 'shadow-md' : 'text-muted-foreground hover:text-foreground'}`}
                                            >
                                                {opt === 0 ? "Custom" : `${opt}v${opt}`}
                                            </Button>
                                        ))}
                                    </div>
                                    {format === 0 && (
                                        <div className="mt-2 flex items-center gap-3">
                                            <Input 
                                                type="number" 
                                                value={customFormat} 
                                                onChange={e => setCustomFormat(e.target.value ? Number(e.target.value) : '')}
                                                placeholder="e.g. 8"
                                                className="w-24 bg-secondary/50 border-border/50 rounded-xl"
                                                min={1}
                                            />
                                            <span className="text-sm text-muted-foreground">players per team</span>
                                        </div>
                                    )}
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="flex items-center gap-1.5"><Clock size={14} /> Total Mins</Label>
                                        <Input 
                                            type="number" 
                                            value={duration} 
                                            onChange={e => setDuration(Number(e.target.value))}
                                            className="bg-secondary/50 border-border/50 rounded-xl"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="flex items-center gap-1.5"><Clock size={14} /> Half Mins</Label>
                                        <Input 
                                            type="number" 
                                            value={halfDuration} 
                                            onChange={e => setHalfDuration(Number(e.target.value))}
                                            className="bg-secondary/50 border-border/50 rounded-xl"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label className="flex items-center gap-1.5"><MapPin size={14} /> Venue</Label>
                                    <Input 
                                        value={venue} 
                                        onChange={e => setVenue(e.target.value)}
                                        placeholder="e.g. Turf 1, Wembley"
                                        className="bg-secondary/50 border-border/50 rounded-xl"
                                    />
                                </div>

                                <div className="space-y-4 pt-4 border-t border-border/50">
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-0.5">
                                            <Label>Rolling Subs</Label>
                                            <p className="text-xs text-muted-foreground">Unlimited substitutions</p>
                                        </div>
                                        <Switch 
                                            checked={unlimitedSubs} 
                                            onCheckedChange={setUnlimitedSubs}
                                            className="data-[state=checked]:bg-primary" 
                                        />
                                    </div>
                                    
                                    {!unlimitedSubs && (
                                        <div className="flex items-center justify-between animate-in fade-in slide-in-from-top-2">
                                            <Label className="text-sm text-muted-foreground">Max Subs</Label>
                                            <Input 
                                                type="number" 
                                                value={maxSubstitutions} 
                                                onChange={e => setMaxSubstitutions(Number(e.target.value))}
                                                className="w-20 bg-secondary/50 border-border/50 rounded-xl h-8 text-center"
                                            />
                                        </div>
                                    )}

                                    <div className="flex items-center justify-between">
                                        <div className="space-y-0.5">
                                            <Label>Allow Penalties</Label>
                                            <p className="text-xs text-muted-foreground">If match ends in a draw</p>
                                        </div>
                                        <Switch 
                                            checked={allowPenalties} 
                                            onCheckedChange={setAllowPenalties} 
                                            className="data-[state=checked]:bg-primary"
                                        />
                                    </div>
                                </div>

                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Column: Teams */}
                    <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                        
                        {/* Team A */}
                        <Card className="border-border/50 shadow-sm bg-card overflow-hidden border-t-4 border-t-blue-500">
                            <CardContent className="p-6 space-y-6">
                                <div className="space-y-2">
                                    <Label>Home Team Name</Label>
                                    <Input 
                                        value={teamAName} 
                                        onChange={e => setTeamAName(e.target.value)}
                                        className="bg-secondary/50 border-border/50 rounded-xl font-semibold text-lg"
                                    />
                                </div>
                                
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center">
                                        <Label className="flex items-center gap-1.5"><Users size={14} /> Players</Label>
                                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${teamAPlayers.length === playersNeeded ? 'bg-green-500/20 text-green-500' : 'bg-primary/20 text-primary'}`}>
                                            {teamAPlayers.length} / {playersNeeded}
                                        </span>
                                    </div>
                                    
                                    <div className="flex gap-2">
                                        <Input 
                                            value={newPlayerA} 
                                            onChange={e => setNewPlayerA(e.target.value)}
                                            onKeyDown={e => e.key === 'Enter' && handleAddPlayer('A', newPlayerA)}
                                            placeholder="Enter player name"
                                            className="bg-secondary/50 border-border/50 rounded-xl"
                                            disabled={teamAPlayers.length >= playersNeeded}
                                        />
                                        <Button 
                                            variant="secondary" 
                                            className="rounded-xl px-3 bg-secondary/80 hover:bg-secondary text-foreground"
                                            onClick={() => handleAddPlayer('A', newPlayerA)}
                                            disabled={teamAPlayers.length >= playersNeeded || !newPlayerA.trim()}
                                        >
                                            <Plus size={16} />
                                        </Button>
                                    </div>

                                    <div className="space-y-2 mt-4 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                                        {teamAPlayers.map((player, idx) => (
                                            <div key={idx} className="flex justify-between items-center p-3 rounded-xl bg-secondary/30 border border-border/30 group hover:bg-secondary/60 transition-colors">
                                                <span className="font-medium text-sm truncate">{player}</span>
                                                <button 
                                                    onClick={() => handleRemovePlayer('A', idx)}
                                                    className="opacity-0 group-hover:opacity-100 p-1.5 rounded-full hover:bg-red-500/20 hover:text-red-500 transition-all text-muted-foreground"
                                                >
                                                    <X size={14} />
                                                </button>
                                            </div>
                                        ))}
                                        {teamAPlayers.length === 0 && (
                                            <div className="text-center py-6 text-sm text-muted-foreground/60 italic border border-dashed border-border/40 rounded-xl">
                                                No players added yet.
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Team B */}
                        <Card className="border-border/50 shadow-sm bg-card overflow-hidden border-t-4 border-t-red-500">
                            <CardContent className="p-6 space-y-6">
                                <div className="space-y-2">
                                    <Label>Away Team Name</Label>
                                    <Input 
                                        value={teamBName} 
                                        onChange={e => setTeamBName(e.target.value)}
                                        className="bg-secondary/50 border-border/50 rounded-xl font-semibold text-lg"
                                    />
                                </div>
                                
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center">
                                        <Label className="flex items-center gap-1.5"><Users size={14} /> Players</Label>
                                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${teamBPlayers.length === playersNeeded ? 'bg-green-500/20 text-green-500' : 'bg-primary/20 text-primary'}`}>
                                            {teamBPlayers.length} / {playersNeeded}
                                        </span>
                                    </div>
                                    
                                    <div className="flex gap-2">
                                        <Input 
                                            value={newPlayerB} 
                                            onChange={e => setNewPlayerB(e.target.value)}
                                            onKeyDown={e => e.key === 'Enter' && handleAddPlayer('B', newPlayerB)}
                                            placeholder="Enter player name"
                                            className="bg-secondary/50 border-border/50 rounded-xl"
                                            disabled={teamBPlayers.length >= playersNeeded}
                                        />
                                        <Button 
                                            variant="secondary" 
                                            className="rounded-xl px-3 bg-secondary/80 hover:bg-secondary text-foreground"
                                            onClick={() => handleAddPlayer('B', newPlayerB)}
                                            disabled={teamBPlayers.length >= playersNeeded || !newPlayerB.trim()}
                                        >
                                            <Plus size={16} />
                                        </Button>
                                    </div>

                                    <div className="space-y-2 mt-4 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                                        {teamBPlayers.map((player, idx) => (
                                            <div key={idx} className="flex justify-between items-center p-3 rounded-xl bg-secondary/30 border border-border/30 group hover:bg-secondary/60 transition-colors">
                                                <span className="font-medium text-sm truncate">{player}</span>
                                                <button 
                                                    onClick={() => handleRemovePlayer('B', idx)}
                                                    className="opacity-0 group-hover:opacity-100 p-1.5 rounded-full hover:bg-red-500/20 hover:text-red-500 transition-all text-muted-foreground"
                                                >
                                                    <X size={14} />
                                                </button>
                                            </div>
                                        ))}
                                        {teamBPlayers.length === 0 && (
                                            <div className="text-center py-6 text-sm text-muted-foreground/60 italic border border-dashed border-border/40 rounded-xl">
                                                No players added yet.
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                    </div>
                </div>
                
                {/* Submit Action */}
                <div className="flex justify-end pt-4">
                    <Button 
                        size="lg" 
                        onClick={handleCreateMatch}
                        disabled={!isValid() || isSubmitting}
                        className={`rounded-xl px-8 h-14 text-base font-bold shadow-lg transition-all ${isValid() ? 'bg-primary hover:bg-primary/90 text-primary-foreground hover:shadow-primary/25 hover:translate-y-[-2px]' : 'bg-muted text-muted-foreground shadow-none'}`}
                    >
                        {isSubmitting ? (
                            <><Loader2 className="mr-2 animate-spin" size={20} /> Creating Match...</>
                        ) : (
                            <>Start Match <ArrowRight className="ml-2" size={20} /></>
                        )}
                    </Button>
                </div>

            </div>
        </div>
    );
}
