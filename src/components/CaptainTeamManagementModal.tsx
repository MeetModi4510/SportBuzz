import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Shield, Copy, Check, Users, Save } from 'lucide-react';
import { teamApi } from '@/services/api';
import { useToast } from '@/hooks/use-toast';

interface CaptainTeamManagementModalProps {
  team: any;
  isOpen: boolean;
  onClose: () => void;
  onTeamUpdated: (updatedTeam: any) => void;
  onTeamDeleted: (teamId: string) => void;
}

export const CaptainTeamManagementModal: React.FC<CaptainTeamManagementModalProps> = ({
  team,
  isOpen,
  onClose,
  onTeamUpdated,
  onTeamDeleted
}) => {
  const [formData, setFormData] = useState({
    name: team.name || '',
    acronym: team.acronym || '',
    logo: team.logo || '',
    color: team.color || '#3b82f6'
  });
  
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [copiedCode, setCopiedCode] = useState<'captain' | 'player' | null>(null);
  const { toast } = useToast();

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await teamApi.update(team._id, formData) as any;
      if (response.success) {
        toast({ title: 'Success', description: 'Team updated successfully!' });
        onTeamUpdated(response.data);
        onClose();
      }
    } catch (error: any) {
      toast({ 
        title: 'Error', 
        description: error.response?.data?.message || 'Failed to update team', 
        variant: 'destructive' 
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to completely delete this team? This action cannot be undone.")) return;
    
    setIsDeleting(true);
    try {
      const response = await teamApi.delete(team._id) as any;
      if (response.success) {
        toast({ title: 'Success', description: 'Team deleted successfully!' });
        onTeamDeleted(team._id);
        onClose();
      }
    } catch (error: any) {
      toast({ 
        title: 'Error', 
        description: error.response?.data?.message || 'Failed to delete team', 
        variant: 'destructive' 
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const copyToClipboard = (text: string, type: 'captain' | 'player') => {
    navigator.clipboard.writeText(text);
    setCopiedCode(type);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-slate-950 text-white border-white/10 max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black text-white flex items-center gap-2">
            <Shield className="text-yellow-500" />
            Manage {team.name}
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            As captain, you can update your team's details and share join codes.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-8 py-4">
          {/* Join Codes Section */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500">Join Codes</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-blue-600/10 border border-blue-500/30 rounded-xl p-4 relative">
                <p className="text-xs font-bold text-blue-400 mb-1 uppercase tracking-wider">Player Code</p>
                <div className="flex justify-between items-center">
                  <p className="text-2xl font-black text-white tracking-widest">{team.playerJoinCode}</p>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => copyToClipboard(team.playerJoinCode, 'player')}
                    className="text-blue-400 hover:text-white hover:bg-blue-500/20"
                  >
                    {copiedCode === 'player' ? <Check size={16} /> : <Copy size={16} />}
                  </Button>
                </div>
              </div>
              
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 relative">
                <p className="text-xs font-bold text-yellow-500 mb-1 uppercase tracking-wider">Captain Code</p>
                <div className="flex justify-between items-center">
                  <p className="text-2xl font-black text-white tracking-widest">{team.captainJoinCode}</p>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => copyToClipboard(team.captainJoinCode, 'captain')}
                    className="text-yellow-500 hover:text-white hover:bg-yellow-500/20"
                  >
                    {copiedCode === 'captain' ? <Check size={16} /> : <Copy size={16} />}
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Team Details Form */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500">Team Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Team Name</Label>
                <Input 
                  value={formData.name} 
                  onChange={(e) => setFormData({...formData, name: e.target.value})} 
                  className="bg-slate-900 border-white/10 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label>Acronym</Label>
                <Input 
                  value={formData.acronym} 
                  maxLength={5}
                  onChange={(e) => setFormData({...formData, acronym: e.target.value.toUpperCase()})} 
                  className="bg-slate-900 border-white/10 text-white"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Logo URL</Label>
                <Input 
                  value={formData.logo} 
                  onChange={(e) => setFormData({...formData, logo: e.target.value})} 
                  className="bg-slate-900 border-white/10 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label>Theme Color</Label>
                <div className="flex gap-2">
                  <Input 
                    type="color"
                    value={formData.color} 
                    onChange={(e) => setFormData({...formData, color: e.target.value})} 
                    className="bg-slate-900 border-white/10 text-white h-10 w-16 p-1 cursor-pointer"
                  />
                  <Input 
                    value={formData.color} 
                    onChange={(e) => setFormData({...formData, color: e.target.value})} 
                    className="bg-slate-900 border-white/10 text-white flex-1"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Team Roster */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
              <Users size={16} /> Team Roster ({team.players?.length || 0})
            </h3>
            <div className="bg-slate-900 border border-white/5 rounded-xl max-h-48 overflow-y-auto">
              {team.players && team.players.length > 0 ? (
                <div className="divide-y divide-white/5">
                  {team.players.map((p: any, idx: number) => (
                    <div key={idx} className="p-3 flex items-center justify-between hover:bg-white/5">
                      <div className="flex items-center gap-3">
                        {p.photo ? (
                          <img src={p.photo} alt={p.name} className="w-8 h-8 rounded-full object-cover" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-400">
                            {p.name?.substring(0, 2).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-medium text-white flex items-center gap-2">
                            {p.name}
                            {p.userId === team.captainId && (
                              <span className="text-[9px] px-1.5 py-0.5 rounded bg-yellow-500/20 text-yellow-500 font-bold uppercase">Captain</span>
                            )}
                          </p>
                          <p className="text-xs text-slate-500">{p.role}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-500 p-4 text-center text-sm">No players drafted yet.</p>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center pt-4 border-t border-white/10 mt-4">
          <Button 
            variant="ghost" 
            onClick={handleDelete} 
            disabled={isDeleting} 
            className="text-red-500 hover:bg-red-500/10 hover:text-red-400"
          >
            {isDeleting ? 'Deleting...' : 'Delete Team'}
          </Button>
          <div className="flex gap-3">
            <Button variant="ghost" onClick={onClose} className="text-slate-400 hover:text-white">Cancel</Button>
            <Button onClick={handleSave} disabled={isSaving} className="bg-blue-600 hover:bg-blue-500 text-white">
              <Save size={16} className="mr-2" /> {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
