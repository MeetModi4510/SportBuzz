import { useState, useEffect } from "react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, Search, ExternalLink, User, ChevronUp, ChevronDown, ChevronsUpDown, Trash2 } from "lucide-react";
import { adminApi } from "@/services/api";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";

interface Player {
  name: string;
  role: string;
  photo?: string;
  battingStyle: string;
  bowlingStyle: string;
  teams: { _id: string; name: string; color: string }[];
}

type SortField = 'name' | 'role' | 'team';
type SortOrder = 'asc' | 'desc' | null;

interface SortConfig {
  field: SortField;
  order: SortOrder;
}

export const PlayerManager = () => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortConfig, setSortConfig] = useState<SortConfig>({ field: 'name', order: 'asc' });
  const navigate = useNavigate();

  const fetchPlayers = async () => {
    try {
      setIsLoading(true);
      const response: any = await adminApi.getPlayers();
      if (response.success) {
        setPlayers(response.data);
      }
    } catch (error: any) {
      console.error("Failed to fetch players:", error);
      toast.error("Failed to load players list");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (name: string) => {
    if (!window.confirm(`Are you sure you want to delete player "${name}"? This will remove them from all teams and auctions.`)) {
      return;
    }

    try {
      const response: any = await adminApi.deletePlayer(name);
      if (response.success) {
        toast.success(response.message || "Player deleted successfully");
        fetchPlayers(); // Refresh list
      }
    } catch (error: any) {
      console.error("Failed to delete player:", error);
      toast.error(error.response?.data?.message || "Failed to delete player");
    }
  };

  useEffect(() => {
    fetchPlayers();
  }, []);

  const handleSort = (field: SortField) => {
    setSortConfig(prev => ({
      field,
      order: prev.field === field && prev.order === 'asc' ? 'desc' : 'asc'
    }));
  };

  const getSortIcon = (field: SortField) => {
    if (sortConfig.field !== field) return <ChevronsUpDown className="w-4 h-4 ml-1 opacity-50" />;
    return sortConfig.order === 'asc' ? 
      <ChevronUp className="w-4 h-4 ml-1 text-blue-500" /> : 
      <ChevronDown className="w-4 h-4 ml-1 text-blue-500" />;
  };

  const filteredAndSortedPlayers = [...players]
    .filter(player => 
      player.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      player.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
      player.teams.some(t => t.name.toLowerCase().includes(searchQuery.toLowerCase()))
    )
    .sort((a, b) => {
      if (!sortConfig.order) return 0;
      
      let valA = "";
      let valB = "";

      if (sortConfig.field === 'name') {
        valA = a.name;
        valB = b.name;
      } else if (sortConfig.field === 'role') {
        valA = a.role;
        valB = b.role;
      } else if (sortConfig.field === 'team') {
        valA = a.teams[0]?.name || "";
        valB = b.teams[0]?.name || "";
      }

      return sortConfig.order === 'asc' 
        ? valA.localeCompare(valB)
        : valB.localeCompare(valA);
    });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 space-y-4">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
        <p className="text-slate-400">Loading players directory...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
          <Input
            placeholder="Search players, roles or teams..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-500 focus:ring-blue-500/20"
          />
        </div>
        <div className="text-sm text-slate-400">
          Showing {filteredAndSortedPlayers.length} of {players.length} players
        </div>
      </div>

      <div className="rounded-xl border border-slate-700 bg-slate-900/50 backdrop-blur-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-800/50">
            <TableRow className="border-slate-700 hover:bg-transparent">
              <TableHead 
                className="text-slate-300 font-semibold py-4 cursor-pointer hover:text-white transition-colors"
                onClick={() => handleSort('name')}
              >
                <div className="flex items-center">
                  Player {getSortIcon('name')}
                </div>
              </TableHead>
              <TableHead 
                className="text-slate-300 font-semibold py-4 cursor-pointer hover:text-white transition-colors"
                onClick={() => handleSort('role')}
              >
                <div className="flex items-center">
                  Role {getSortIcon('role')}
                </div>
              </TableHead>
              <TableHead 
                className="text-slate-300 font-semibold py-4 cursor-pointer hover:text-white transition-colors"
                onClick={() => handleSort('team')}
              >
                <div className="flex items-center">
                  Teams {getSortIcon('team')}
                </div>
              </TableHead>
              <TableHead className="text-slate-300 font-semibold py-4 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAndSortedPlayers.length > 0 ? (
              filteredAndSortedPlayers.map((player) => (
                <TableRow key={player.name} className="border-slate-800 hover:bg-slate-800/30 transition-colors group">
                  <TableCell className="py-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10 border border-slate-700 group-hover:border-blue-500/50 transition-colors">
                        <AvatarImage src={player.photo} />
                        <AvatarFallback className="bg-slate-800 text-slate-400">
                          <User size={18} />
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium text-white">{player.name}</div>
                        <div className="text-xs text-slate-500">{player.battingStyle}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="py-4">
                    <Badge variant="outline" className="bg-blue-500/5 text-blue-400 border-blue-500/20 hover:bg-blue-500/10">
                      {player.role}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-4">
                    <div className="flex flex-wrap gap-1.5">
                      {player.teams.map((team) => (
                        <Badge 
                          key={team._id} 
                          variant="secondary" 
                          className="text-[10px] bg-slate-800 text-slate-300 border-slate-700"
                        >
                          <div 
                            className="w-1.5 h-1.5 rounded-full mr-1.5" 
                            style={{ backgroundColor: team.color || "#3b82f6" }}
                          />
                          {team.name}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/player/${player.name}`)}
                        className="text-slate-400 hover:text-white hover:bg-slate-700/50 transition-all gap-2"
                      >
                        <ExternalLink size={14} />
                        View
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(player.name)}
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all gap-2"
                      >
                        <Trash2 size={14} />
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center text-slate-500 py-8">
                  {searchQuery ? "No players matching your search." : "No players found in the system."}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
