import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
    Activity, Search, Filter, ArrowDownToLine, 
    User, Shield, Trophy, AlertCircle, Clock, Trash2, Settings
} from "lucide-react";

interface LogEntry {
    id: string;
    user: string;
    action: string;
    category: 'user' | 'tournament' | 'match' | 'system';
    timestamp: string;
    details: string;
}

export const AuditLogs = () => {
    const [searchQuery, setSearchQuery] = useState("");
    const [logs] = useState<LogEntry[]>([
        { id: "1", user: "admin@sportbuzz.com", action: "Tournament Created", category: "tournament", timestamp: new Date().toISOString(), details: "Created 'GCET Premier League'" },
        { id: "2", user: "meetmodi451013@gmail.com", action: "Match Scored", category: "match", timestamp: new Date(Date.now() - 3600000).toISOString(), details: "Scored Match #402: MI vs CSK" },
        { id: "3", user: "system", action: "Backup Completed", category: "system", timestamp: new Date(Date.now() - 86400000).toISOString(), details: "Global database backup successful" },
        { id: "4", user: "admin@sportbuzz.com", action: "User Role Updated", category: "user", timestamp: new Date(Date.now() - 172800000).toISOString(), details: "Promoted 'pranshu2106' to Scorer" },
        { id: "5", user: "scorer_test", action: "Match Deleted", category: "match", timestamp: new Date(Date.now() - 259200000).toISOString(), details: "Removed duplicate match entry #105" },
    ]);

    const getCategoryIcon = (category: string) => {
        switch (category) {
            case 'user': return <User size={14} className="text-blue-400" />;
            case 'tournament': return <Trophy size={14} className="text-yellow-400" />;
            case 'match': return <Shield size={14} className="text-emerald-400" />;
            default: return <Settings size={14} className="text-purple-400" />;
        }
    };

    const filteredLogs = logs.filter(log => 
        log.user.toLowerCase().includes(searchQuery.toLowerCase()) || 
        log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.details.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
                        <Activity className="text-emerald-500" />
                        Audit Interface
                    </h2>
                    <p className="text-slate-400 mt-1 uppercase text-[10px] font-black tracking-[0.3em]">Temporal Activity Monitoring</p>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="outline" className="border-slate-800 text-slate-400 hover:text-white rounded-xl">
                        <Filter className="mr-2" size={16} /> Filter
                    </Button>
                    <Button variant="outline" className="border-slate-800 text-slate-400 hover:text-white rounded-xl">
                        <ArrowDownToLine className="mr-2" size={16} /> Export CSV
                    </Button>
                </div>
            </div>

            <Card className="bg-slate-900/50 border-slate-800 rounded-[2.5rem] overflow-hidden backdrop-blur-md">
                <div className="p-8 border-b border-slate-800/50 bg-slate-800/20">
                    <div className="relative max-w-md">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                        <Input 
                            placeholder="Scan logs by user, action, or details..." 
                            className="bg-slate-950/50 border-slate-700 pl-12 h-12 text-white rounded-2xl focus-visible:ring-emerald-500/50"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-800/50">
                                    <th className="p-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Identity</th>
                                    <th className="p-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Operation</th>
                                    <th className="p-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Manifest Info</th>
                                    <th className="p-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Timestamp</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/30">
                                {filteredLogs.map((log) => (
                                    <tr key={log.id} className="hover:bg-slate-800/20 transition-colors group">
                                        <td className="p-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center font-mono text-[10px] text-slate-300">
                                                    {log.user.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-white">{log.user}</p>
                                                    <p className="text-[10px] text-slate-500">UID: {log.id.padStart(4, '0')}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-6">
                                            <div className="flex items-center gap-2">
                                                <div className="p-1.5 rounded-md bg-slate-800 border border-slate-700">
                                                    {getCategoryIcon(log.category)}
                                                </div>
                                                <span className="text-sm font-bold text-slate-200">{log.action}</span>
                                            </div>
                                        </td>
                                        <td className="p-6">
                                            <p className="text-sm text-slate-400 font-medium">{log.details}</p>
                                        </td>
                                        <td className="p-6">
                                            <div className="flex items-center gap-2 text-slate-500">
                                                <Clock size={12} />
                                                <span className="text-xs font-mono">{new Date(log.timestamp).toLocaleString()}</span>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {filteredLogs.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="p-20 text-center">
                                            <AlertCircle size={40} className="mx-auto text-slate-700 mb-4" />
                                            <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">No activity records found</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};
