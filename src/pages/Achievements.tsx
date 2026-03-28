import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Helmet } from "react-helmet-async";
import { Badge } from "@/components/ui/badge";
import { Achievement as staticAchievements, getAchievements } from "@/data/achievements";
import { Lock } from "lucide-react";
import { activityApi } from "@/services/api";

const Achievements = () => {
  const navigate = useNavigate();
  const [achievements, setAchievements] = useState<any[]>([]);
  const [unlockedCount, setUnlockedCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAchievements = async () => {
      try {
        const response = await activityApi.getAchievements();
        if (response.success) {
          const unlockedAchs = response.data;
          const allAchs = getAchievements().map(staticAch => {
            const unlocked = unlockedAchs.find((ua: any) => ua.key === staticAch.id);
            return {
              ...staticAch,
              unlocked: !!unlocked,
              unlockedDate: unlocked ? unlocked.unlockedAt : null
            };
          });
          setAchievements(allAchs);
          setUnlockedCount(unlockedAchs.length);
        }
      } catch (error) {
        console.error("Failed to fetch achievements:", error);
      } finally {
        setIsLoading(false);
      }
    };

    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    fetchAchievements();
  }, [navigate]);

  return (
    <>
      <Helmet>
        <title>Achievements - SportBuzz</title>
      </Helmet>

      <div className="min-h-screen bg-background p-4">
        <div className="max-w-4xl mx-auto">
          <Button
            onClick={() => navigate("/")}
            variant="outline"
            className="mb-6"
          >
            ← Back to Dashboard
          </Button>

          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Achievements</h1>
            <p className="text-muted-foreground">
              Unlock achievements by completing tasks and milestones
            </p>
            <div className="mt-4 flex gap-4">
              <Card className="flex-1">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-primary">
                      {unlockedCount}/{achievements.length}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Achievements Unlocked
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="flex-1">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-primary">
                      {Math.round((unlockedCount / achievements.length) * 100)}%
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Completion
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {achievements.map((achievement) => (
              <Card
                key={achievement.id}
                className={
                  !achievement.unlocked ? "opacity-50 grayscale" : ""
                }
              >
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div
                      className={`p-3 rounded-lg ${achievement.color} bg-secondary`}
                    >
                      {achievement.unlocked ? (
                        achievement.icon
                      ) : (
                        <Lock className="h-6 w-6" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold">{achievement.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        {achievement.description}
                      </p>
                      {achievement.unlocked && achievement.unlockedDate && (
                        <Badge className="mt-2" variant="outline">
                          Unlocked{" "}
                          {new Date(achievement.unlockedDate).toLocaleDateString()}
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default Achievements;
