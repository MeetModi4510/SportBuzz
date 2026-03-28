import { Trophy, Flame, Target, Award, Zap, Heart } from "lucide-react";

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  unlocked: boolean;
  unlockedDate?: string;
}

export const achievements: Achievement[] = [
  {
    id: "first_login",
    title: "Welcome to SportBuzz",
    description: "Complete your first login",
    icon: <Zap className="h-6 w-6" />,
    color: "text-blue-500",
    unlocked: true,
    unlockedDate: new Date().toISOString(),
  },
  {
    id: "cricket_fan",
    title: "Cricket Fan",
    description: "Watch 10 cricket matches",
    icon: <Trophy className="h-6 w-6" />,
    color: "text-green-500",
    unlocked: false,
  },
  {
    id: "fantasy_master",
    title: "Fantasy Master",
    description: "Create and manage 5 fantasy teams",
    icon: <Award className="h-6 w-6" />,
    color: "text-yellow-500",
    unlocked: false,
  },
  {
    id: "on_fire",
    title: "On Fire",
    description: "Log in 7 consecutive days",
    icon: <Flame className="h-6 w-6" />,
    color: "text-red-500",
    unlocked: false,
  },
  {
    id: "favorite_collector",
    title: "Collector",
    description: "Add 20 matches to favorites",
    icon: <Heart className="h-6 w-6" />,
    color: "text-pink-500",
    unlocked: false,
  },
  {
    id: "leaderboard_pro",
    title: "Leaderboard Pro",
    description: "Reach top 10 on global leaderboard",
    icon: <Target className="h-6 w-6" />,
    color: "text-purple-500",
    unlocked: false,
  },
];

export const getAchievements = (): Achievement[] => {
  const saved = localStorage.getItem("achievements");
  return saved ? JSON.parse(saved) : achievements;
};

export const saveAchievements = (achs: Achievement[]) => {
  localStorage.setItem("achievements", JSON.stringify(achs));
};

export const unlockAchievement = (id: string) => {
  const achs = getAchievements();
  const achievement = achs.find((a) => a.id === id);
  if (achievement && !achievement.unlocked) {
    achievement.unlocked = true;
    achievement.unlockedDate = new Date().toISOString();
    saveAchievements(achs);
    return achievement;
  }
  return null;
};
