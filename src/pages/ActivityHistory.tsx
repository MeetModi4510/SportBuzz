import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Helmet } from "react-helmet-async";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/EmptyState";
import { Clock, Heart, Eye, Trophy, Settings, LogIn, UserPlus } from "lucide-react";
import { activityApi } from "@/services/api";

interface Activity {
  _id: string;
  type: string;
  description: string;
  createdAt: string;
}

const ActivityHistory = () => {
  const navigate = useNavigate();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        const response = await activityApi.getHistory();
        if (response.success) {
          setActivities(response.data);
        }
      } catch (error) {
        console.error("Failed to fetch activity history:", error);
      } finally {
        setIsLoading(false);
      }
    };

    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    fetchActivities();
  }, [navigate]);

  const getActivityColor = (type: string) => {
    const colors: Record<string, string> = {
      match_viewed: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      favorite_added: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
      team_created: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
      profile_updated: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      settings_changed: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
    };
    return colors[type] || "bg-gray-100 text-gray-800";
  };

  const getActivityIcon = (type: string) => {
    const icons: Record<string, React.ReactNode> = {
      match_viewed: <Eye className="h-4 w-4" />,
      favorite_added: <Heart className="h-4 w-4" />,
      team_created: <Trophy className="h-4 w-4" />,
      profile_updated: <Eye className="h-4 w-4" />,
      settings_changed: <Settings className="h-4 w-4" />,
    };
    return icons[type];
  };

  return (
    <>
      <Helmet>
        <title>Activity History - SportBuzz</title>
      </Helmet>

      <div className="min-h-screen bg-background p-4">
        <div className="max-w-3xl mx-auto">
          <Button
            onClick={() => navigate("/")}
            variant="outline"
            className="mb-6"
          >
            ← Back to Dashboard
          </Button>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Activity History
              </CardTitle>
              <CardDescription>
                Track your recent activities on SportBuzz
              </CardDescription>
            </CardHeader>
            <CardContent>
              {activities.length === 0 ? (
                <EmptyState
                  title="No activities yet"
                  description="Your activities will appear here"
                  icon={<Clock className="h-12 w-12 text-muted-foreground" />}
                />
              ) : (
                <div className="space-y-4">
                  {activities.map((activity) => (
                    <div
                      key={activity._id}
                      className="flex items-center gap-4 p-4 rounded-lg border"
                    >
                      <div
                        className={`p-2 rounded-lg ${getActivityColor(
                          activity.type
                        )}`}
                      >
                        {getActivityIcon(activity.type)}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{activity.description}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(activity.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <Badge variant="outline" className="capitalize">
                        {activity.type.replace(/_/g, " ")}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
};

export default ActivityHistory;
