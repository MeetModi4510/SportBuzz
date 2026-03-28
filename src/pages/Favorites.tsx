import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Helmet } from "react-helmet-async";
import { Heart, Share2, Calendar, MapPin, Users } from "lucide-react";
import { favoritesApi } from "@/services/api";
import { useToast } from "@/hooks/use-toast";

interface Favorite {
  _id: string;
  matchId: string;
  teams: {
    team1: string;
    team2: string;
  };
  date: string;
  venue: string;
  sport: string;
  status: "upcoming" | "live" | "completed";
}

const Favorites = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchFavorites = async () => {
      try {
        const response = await favoritesApi.getAll();
        if (response.success) {
          setFavorites(response.data);
        }
      } catch (error) {
        console.error('Failed to fetch favorites:', error);
      } finally {
        setIsLoading(false);
      }
    };

    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    fetchFavorites();
  }, [navigate]);

  const removeFavorite = async (id: string) => {
    try {
      await favoritesApi.remove(id);
      const updated = favorites.filter((m) => m._id !== id);
      setFavorites(updated);
      toast({
        title: "Removed",
        description: "Match removed from favorites",
      });
    } catch (error) {
      console.error('Failed to remove favorite:', error);
      toast({
        title: "Error",
        description: "Failed to remove from favorites",
        variant: "destructive",
      });
    }
  };

  const filteredMatches = favorites.filter(
    (match) =>
      match.teams.team1.toLowerCase().includes(searchTerm.toLowerCase()) ||
      match.teams.team2.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-white">Loading favorites...</div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Favorites - SportBuzz</title>
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
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">My Favorites</h1>
              <p className="text-slate-400">
                {favorites.length} match{favorites.length !== 1 ? "es" : ""} saved
              </p>
            </div>

            {favorites.length > 0 && (
              <div className="flex gap-4">
                <Input
                  placeholder="Search favorites by team name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>
            )}

            {filteredMatches.length === 0 ? (
              <Card className="bg-slate-900 border-slate-700">
                <CardContent className="pt-6 text-center">
                  <Heart className="w-16 h-16 mx-auto text-slate-500 mb-4" />
                  <p className="text-slate-400 text-lg mb-4">
                    {favorites.length === 0
                      ? "No favorite matches yet. Add matches from the dashboard!"
                      : "No matches found matching your search."}
                  </p>
                  {favorites.length === 0 && (
                    <Button
                      onClick={() => navigate("/")}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      Browse Matches
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {filteredMatches.map((match) => (
                  <Card
                    key={match._id}
                    className="bg-slate-900 border-slate-700 hover:border-slate-600 transition"
                  >
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-4 mb-3">
                            <span className="px-3 py-1 bg-red-500/20 text-red-400 text-sm rounded-full capitalize">
                              {match.sport}
                            </span>
                            <span className="px-3 py-1 bg-blue-500/20 text-blue-400 text-sm rounded-full capitalize">
                              {match.status}
                            </span>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                              <h3 className="text-xl font-bold text-white">
                                {match.teams.team1} <span className="text-slate-400">vs</span> {match.teams.team2}
                              </h3>
                            </div>

                            <div className="space-y-2 text-sm">
                              <div className="flex items-center gap-2 text-slate-300">
                                <Calendar size={16} />
                                {new Date(match.date).toLocaleDateString()}
                              </div>
                              <div className="flex items-center gap-2 text-slate-300">
                                <MapPin size={16} />
                                {match.venue}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-2 ml-4">
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-slate-700"
                          >
                            <Share2 size={18} />
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => removeFavorite(match._id)}
                            className="bg-red-600/20 text-red-400 hover:bg-red-600/40 border-red-700"
                          >
                            <Heart size={18} fill="currentColor" />
                          </Button>
                        </div>
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

export default Favorites;
