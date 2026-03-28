import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { Trophy, Target, Zap, Users } from "lucide-react";
import { leaderboardApi } from "@/services/api";

interface UserStats {
  totalPoints: number;
  correctPredictions: number;
  totalPredictions: number;
  rank: number;
  level: string;
  accuracy: number;
}

interface LeaderboardEntry {
  rank: number;
  name: string;
  points: number;
  predictions: number;
  accuracy: number;
}

const Leaderboard = () => {
  const navigate = useNavigate();
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch both user stats and leaderboard data in parallel
        const [statsResponse, leaderboardResponse] = await Promise.all([
          leaderboardApi.getMyStats(),
          leaderboardApi.getTop(10)
        ]);

        if (statsResponse.success) {
          setUserStats(statsResponse.data);
        }

        if (leaderboardResponse.success) {
          setLeaderboardData(leaderboardResponse.data);
        }
      } catch (error) {
        console.error('Failed to fetch leaderboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    fetchData();
  }, [navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-white">Loading leaderboard...</div>
      </div>
    );
  }

  if (!userStats) return null;

  const userAccuracy = userStats.accuracy || (
    userStats.totalPredictions > 0
      ? ((userStats.correctPredictions / userStats.totalPredictions) * 100).toFixed(1)
      : 0
  );

  return (
    <>
      <Helmet>
        <title>Leaderboard - SportBuzz</title>
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

          {/* Your Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card className="bg-gradient-to-br from-yellow-500/20 to-yellow-600/10 border-yellow-600/30">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-2">
                  <Trophy className="w-6 h-6 text-yellow-400" />
                  <span className="text-slate-300 text-sm">Rank</span>
                </div>
                <p className="text-3xl font-bold text-yellow-400">#{userStats.rank}</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-500/20 to-purple-600/10 border-purple-600/30">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-2">
                  <Zap className="w-6 h-6 text-purple-400" />
                  <span className="text-slate-300 text-sm">Points</span>
                </div>
                <p className="text-3xl font-bold text-purple-400">{userStats.totalPoints}</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-blue-500/20 to-blue-600/10 border-blue-600/30">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-2">
                  <Target className="w-6 h-6 text-blue-400" />
                  <span className="text-slate-300 text-sm">Accuracy</span>
                </div>
                <p className="text-3xl font-bold text-blue-400">{userAccuracy}%</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-red-500/20 to-red-600/10 border-red-600/30">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-2">
                  <Users className="w-6 h-6 text-red-400" />
                  <span className="text-slate-300 text-sm">Level</span>
                </div>
                <p className="text-3xl font-bold text-red-400">{userStats.level}</p>
              </CardContent>
            </Card>
          </div>

          {/* Leaderboard */}
          <Card className="bg-slate-900 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Trophy className="text-yellow-500" />
                Top 10 Leaderboard
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-700">
                      <th className="text-left py-3 px-4 text-slate-300 font-semibold">Rank</th>
                      <th className="text-left py-3 px-4 text-slate-300 font-semibold">Username</th>
                      <th className="text-center py-3 px-4 text-slate-300 font-semibold">Points</th>
                      <th className="text-center py-3 px-4 text-slate-300 font-semibold">
                        Predictions
                      </th>
                      <th className="text-center py-3 px-4 text-slate-300 font-semibold">Accuracy</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaderboardData.map((entry) => (
                      <tr
                        key={entry.rank}
                        className="border-b border-slate-700/50 hover:bg-slate-800/30 transition"
                      >
                        <td className="py-3 px-4">
                          {entry.rank === 1 ? (
                            <span className="text-2xl">🥇</span>
                          ) : entry.rank === 2 ? (
                            <span className="text-2xl">🥈</span>
                          ) : entry.rank === 3 ? (
                            <span className="text-2xl">🥉</span>
                          ) : (
                            <span className="text-slate-400 font-semibold">#{entry.rank}</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-white font-medium">{entry.name}</span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="text-purple-400 font-semibold">{entry.points}</span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="text-blue-400">{entry.predictions}</span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="text-green-400 font-semibold">{entry.accuracy}%</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
};

export default Leaderboard;
