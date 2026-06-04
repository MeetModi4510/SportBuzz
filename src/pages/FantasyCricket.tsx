import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Helmet } from "react-helmet-async";
import { Users, Target, Plus, Trash2 } from "lucide-react";

interface FantasyTeam {
  id: string;
  name: string;
  players: string[];
  points: number;
  createdDate: string;
}

const FantasyCricket = () => {
  const navigate = useNavigate();
  const [teams, setTeams] = useState<FantasyTeam[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newTeamName, setNewTeamName] = useState("");

  useEffect(() => {
    const user = localStorage.getItem("user");
    if (!user) {
      navigate("/login");
      return;
    }

    const saved = localStorage.getItem("fantasyTeams");
    if (saved) {
      setTeams(JSON.parse(saved));
    }
  }, [navigate]);

  const createTeam = () => {
    if (!newTeamName.trim()) return;

    const newTeam: FantasyTeam = {
      id: Date.now().toString(),
      name: newTeamName,
      players: [],
      points: 0,
      createdDate: new Date().toISOString(),
    };

    const updated = [...teams, newTeam];
    setTeams(updated);
    localStorage.setItem("fantasyTeams", JSON.stringify(updated));
    setNewTeamName("");
    setShowCreateForm(false);
  };

  const deleteTeam = (id: string) => {
    const updated = teams.filter((t) => t.id !== id);
    setTeams(updated);
    localStorage.setItem("fantasyTeams", JSON.stringify(updated));
  };

  return (
    <>
      <Helmet>
        <title>Fantasy Cricket - SportBuzz</title>
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4">
        <div className="max-w-6xl mx-auto">
          <Button
            onClick={() => navigate("/")}
            variant="outline"
            className="mb-6 border-slate-700"
          >
            ← Back to Dashboard
          </Button>

          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-white mb-2">Fantasy Cricket</h1>
                <p className="text-slate-400">Create and manage your fantasy teams</p>
              </div>
              <Button
                onClick={() => setShowCreateForm(!showCreateForm)}
                className="bg-red-600 hover:bg-red-700"
              >
                <Plus size={18} className="mr-2" />
                New Team
              </Button>
            </div>

            {showCreateForm && (
              <Card className="bg-slate-900 border-slate-700">
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div>
                      <Label className="text-white">Team Name</Label>
                      <Input
                        value={newTeamName}
                        onChange={(e) => setNewTeamName(e.target.value)}
                        placeholder="Enter team name..."
                        className="bg-slate-800 border-slate-700 text-white mt-2"
                        onKeyPress={(e) => {
                          if (e.key === "Enter") createTeam();
                        }}
                      />
                    </div>
                    <div className="flex gap-3">
                      <Button
                        onClick={createTeam}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        Create Team
                      </Button>
                      <Button
                        onClick={() => setShowCreateForm(false)}
                        variant="outline"
                        className="border-slate-700"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {teams.length === 0 ? (
              <Card className="bg-slate-900 border-slate-700">
                <CardContent className="pt-12 text-center">
                  <Users className="w-16 h-16 mx-auto text-slate-500 mb-4" />
                  <p className="text-slate-400 text-lg mb-4">No fantasy teams yet</p>
                  <Button
                    onClick={() => setShowCreateForm(true)}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    Create Your First Team
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {teams.map((team) => (
                  <Card key={team.id} className="bg-slate-900 border-slate-700 hover:border-slate-600 transition">
                    <CardHeader>
                      <CardTitle className="text-white text-lg">{team.name}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-slate-800/50 p-3 rounded">
                          <p className="text-slate-400 text-sm">Players</p>
                          <p className="text-2xl font-bold text-blue-400">
                            {team.players.length}/11
                          </p>
                        </div>
                        <div className="bg-slate-800/50 p-3 rounded">
                          <p className="text-slate-400 text-sm">Points</p>
                          <p className="text-2xl font-bold text-purple-400">{team.points}</p>
                        </div>
                      </div>

                      <p className="text-xs text-slate-400">
                        Created: {new Date(team.createdDate).toLocaleDateString()}
                      </p>

                      <div className="flex gap-2">
                        <Button
                          className="flex-1 bg-blue-600 hover:bg-blue-700"
                          onClick={() => navigate(`/fantasy/${team.id}`)}
                        >
                          <Target size={16} className="mr-2" />
                          Edit Team
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => deleteTeam(team.id)}
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default FantasyCricket;
