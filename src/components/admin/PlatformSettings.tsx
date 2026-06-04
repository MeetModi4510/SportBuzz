import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { 
    Settings, Save, RefreshCw, ShieldAlert,
    Globe, Lock, Zap, Database, Bell
} from "lucide-react";
import { toast } from "sonner";

export const PlatformSettings = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [settings, setSettings] = useState({
        maintenanceMode: false,
        userRegistration: true,
        publicTournaments: true,
        maxTournamentsPerUser: 5,
        apiRateLimit: 100,
        platformName: "SportBuzz",
        supportEmail: "support@sportbuzz.com"
    });

    const handleSave = () => {
        setIsLoading(true);
        // Simulate API call
        setTimeout(() => {
            setIsLoading(false);
            toast.success("Platform settings updated successfully!");
        }, 1000);
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
                        <Settings className="text-blue-500" />
                        Platform Configuration
                    </h2>
                    <p className="text-slate-400 mt-1 uppercase text-[10px] font-black tracking-[0.3em]">Neural System Core Settings</p>
                </div>
                <Button 
                    onClick={handleSave} 
                    disabled={isLoading}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-8 rounded-xl font-bold transition-all active:scale-95 shadow-lg shadow-blue-900/20"
                >
                    {isLoading ? <RefreshCw className="mr-2 animate-spin" size={16} /> : <Save className="mr-2" size={16} />}
                    Deploy Changes
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* General Settings */}
                <Card className="lg:col-span-2 bg-slate-900/50 border-slate-800 rounded-[2.5rem] overflow-hidden backdrop-blur-md">
                    <CardHeader className="border-b border-slate-800/50 bg-slate-800/20 p-8">
                        <CardTitle className="text-xl font-bold text-white flex items-center gap-3">
                            <Globe size={20} className="text-blue-400" />
                            General Environment
                        </CardTitle>
                        <CardDescription className="text-slate-500">Global identity and basic platform behavior</CardDescription>
                    </CardHeader>
                    <CardContent className="p-8 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-3">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Platform Identity</Label>
                                <Input 
                                    value={settings.platformName} 
                                    onChange={(e) => setSettings({...settings, platformName: e.target.value})}
                                    className="bg-slate-950/50 border-slate-700 text-white rounded-xl h-12" 
                                />
                            </div>
                            <div className="space-y-3">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Support Vector (Email)</Label>
                                <Input 
                                    value={settings.supportEmail} 
                                    onChange={(e) => setSettings({...settings, supportEmail: e.target.value})}
                                    className="bg-slate-950/50 border-slate-700 text-white rounded-xl h-12" 
                                />
                            </div>
                            <div className="space-y-3">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Legacy Tournament Cap</Label>
                                <Input 
                                    type="number"
                                    value={settings.maxTournamentsPerUser} 
                                    onChange={(e) => setSettings({...settings, maxTournamentsPerUser: parseInt(e.target.value)})}
                                    className="bg-slate-950/50 border-slate-700 text-white rounded-xl h-12" 
                                />
                            </div>
                            <div className="space-y-3">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">API Throughput (Req/min)</Label>
                                <Input 
                                    type="number"
                                    value={settings.apiRateLimit} 
                                    onChange={(e) => setSettings({...settings, apiRateLimit: parseInt(e.target.value)})}
                                    className="bg-slate-950/50 border-slate-700 text-white rounded-xl h-12" 
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Status Toggles */}
                <Card className="bg-slate-950/50 border-slate-800 rounded-[2.5rem] overflow-hidden border-l-blue-500/20">
                    <CardHeader className="p-8">
                        <CardTitle className="text-xl font-bold text-white flex items-center gap-3">
                            <ShieldAlert size={20} className="text-orange-400" />
                            System Overrides
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-8 space-y-8">
                        <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-900/50 border border-slate-800">
                            <div className="space-y-1">
                                <p className="text-sm font-bold text-white">Maintenance Protocol</p>
                                <p className="text-[10px] text-slate-500 uppercase font-black tracking-tighter">Disable Public Access</p>
                            </div>
                            <Switch 
                                checked={settings.maintenanceMode} 
                                onCheckedChange={(checked) => setSettings({...settings, maintenanceMode: checked})}
                            />
                        </div>

                        <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-900/50 border border-slate-800">
                            <div className="space-y-1">
                                <p className="text-sm font-bold text-white">New User Onboarding</p>
                                <p className="text-[10px] text-slate-500 uppercase font-black tracking-tighter">Allow Signups</p>
                            </div>
                            <Switch 
                                checked={settings.userRegistration} 
                                onCheckedChange={(checked) => setSettings({...settings, userRegistration: checked})}
                            />
                        </div>

                        <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-900/50 border border-slate-800">
                            <div className="space-y-1">
                                <p className="text-sm font-bold text-white">Public Discoverability</p>
                                <p className="text-[10px] text-slate-500 uppercase font-black tracking-tighter">Show Global Tournaments</p>
                            </div>
                            <Switch 
                                checked={settings.publicTournaments} 
                                onCheckedChange={(checked) => setSettings({...settings, publicTournaments: checked})}
                            />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Infrastructure Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                    { icon: Database, label: "Database Cluster", status: "Operational", color: "text-emerald-400" },
                    { icon: Zap, label: "Neural Compute", status: "Peak Efficiency", color: "text-blue-400" },
                    { icon: Bell, label: "Signal Relays", status: "Active", color: "text-purple-400" }
                ].map((item, i) => (
                    <div key={i} className="p-6 rounded-[2rem] bg-slate-900/30 border border-slate-800/50 flex items-center gap-5">
                        <div className={`p-4 rounded-2xl bg-slate-950/50 ${item.color}`}>
                            <item.icon size={24} />
                        </div>
                        <div>
                            <p className="text-xs font-black uppercase tracking-widest text-slate-500">{item.label}</p>
                            <p className="text-lg font-bold text-white mt-0.5">{item.status}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
