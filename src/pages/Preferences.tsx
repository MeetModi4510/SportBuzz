import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Helmet } from "react-helmet-async";
import { Moon, Sun, Bell, Mail, Smartphone } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { userApi } from "@/services/api";

interface UserPreferences {
  darkMode: boolean;
  emailNotifications: boolean;
  pushNotifications: boolean;
  smsNotifications: boolean;
  matchUpdates: boolean;
  playerNews: boolean;
  weeklyDigest: boolean;
}

const Preferences = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [preferences, setPreferences] = useState<UserPreferences>({
    darkMode: localStorage.getItem("theme") === "dark",
    emailNotifications: true,
    pushNotifications: true,
    smsNotifications: false,
    matchUpdates: true,
    playerNews: true,
    weeklyDigest: true,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchPreferences = async () => {
      try {
        const response = await userApi.getPreferences();
        if (response.success) {
          setPreferences(prev => ({
            ...prev,
            ...response.data
          }));
        }
      } catch (error) {
        console.error('Failed to fetch preferences:', error);
      } finally {
        setIsLoading(false);
      }
    };

    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
    } else {
      fetchPreferences();
    }
  }, [navigate]);

  const applyTheme = (isDarkMode: boolean) => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
      document.body.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      document.body.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };

  const handleToggle = (key: keyof UserPreferences) => {
    setPreferences((prev) => {
      const updated = {
        ...prev,
        [key]: !prev[key],
      };
      // Apply theme immediately if darkMode is being toggled
      if (key === "darkMode") {
        applyTheme(updated.darkMode);
      }
      return updated;
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await userApi.updatePreferences(preferences);
      if (response.success) {
        applyTheme(preferences.darkMode);
        toast({
          title: "Success",
          description: "Preferences saved successfully!",
        });
      }
    } catch (error) {
      console.error('Failed to save preferences:', error);
      toast({
        title: "Error",
        description: "Failed to save preferences. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Preferences - SportBuzz</title>
      </Helmet>

      <div className="min-h-screen bg-background p-4">
        <div className="max-w-2xl mx-auto">
          <Button
            onClick={() => navigate("/")}
            variant="outline"
            className="mb-6"
          >
            ← Back to Dashboard
          </Button>

          <div className="space-y-6">
            {/* Theme Preferences */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sun size={20} className="text-yellow-500" />
                  Display
                </CardTitle>
                <CardDescription>Manage how SportBuzz looks</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-3">
                    {preferences.darkMode ? (
                      <Moon size={20} className="text-muted-foreground" />
                    ) : (
                      <Sun size={20} className="text-yellow-500" />
                    )}
                    <div>
                      <Label className="cursor-pointer">Dark Mode</Label>
                      <p className="text-sm text-muted-foreground">
                        {preferences.darkMode ? "Enabled" : "Disabled"}
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={preferences.darkMode}
                    onCheckedChange={() => handleToggle("darkMode")}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Notification Preferences */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell size={20} className="text-blue-500" />
                  Notifications
                </CardTitle>
                <CardDescription>Choose how you want to receive updates</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-3">
                    <Mail size={20} className="text-muted-foreground" />
                    <div>
                      <Label className="cursor-pointer">Email Notifications</Label>
                      <p className="text-sm text-muted-foreground">Receive updates via email</p>
                    </div>
                  </div>
                  <Switch
                    checked={preferences.emailNotifications}
                    onCheckedChange={() => handleToggle("emailNotifications")}
                  />
                </div>

                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-3">
                    <Bell size={20} className="text-muted-foreground" />
                    <div>
                      <Label className="cursor-pointer">Push Notifications</Label>
                      <p className="text-sm text-muted-foreground">Browser notifications</p>
                    </div>
                  </div>
                  <Switch
                    checked={preferences.pushNotifications}
                    onCheckedChange={() => handleToggle("pushNotifications")}
                  />
                </div>

                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-3">
                    <Smartphone size={20} className="text-muted-foreground" />
                    <div>
                      <Label className="cursor-pointer">SMS Notifications</Label>
                      <p className="text-sm text-muted-foreground">Text message alerts</p>
                    </div>
                  </div>
                  <Switch
                    checked={preferences.smsNotifications}
                    onCheckedChange={() => handleToggle("smsNotifications")}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Content Preferences */}
            <Card>
              <CardHeader>
                <CardTitle>Content Preferences</CardTitle>
                <CardDescription>Choose what content interests you</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div>
                    <Label className="cursor-pointer">Match Updates</Label>
                    <p className="text-sm text-muted-foreground">Live match notifications</p>
                  </div>
                  <Switch
                    checked={preferences.matchUpdates}
                    onCheckedChange={() => handleToggle("matchUpdates")}
                  />
                </div>

                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div>
                    <Label className="cursor-pointer">Player News</Label>
                    <p className="text-sm text-muted-foreground">Updates about your favorite players</p>
                  </div>
                  <Switch
                    checked={preferences.playerNews}
                    onCheckedChange={() => handleToggle("playerNews")}
                  />
                </div>

                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div>
                    <Label className="cursor-pointer">Weekly Digest</Label>
                    <p className="text-sm text-muted-foreground">Summary email every week</p>
                  </div>
                  <Switch
                    checked={preferences.weeklyDigest}
                    onCheckedChange={() => handleToggle("weeklyDigest")}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Save Button */}
            <Button
              onClick={handleSave}
              className="w-full h-12 text-lg"
            >
              {saved ? "✓ Preferences Saved" : "Save Preferences"}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Preferences;
