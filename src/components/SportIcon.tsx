import { cn } from "@/lib/utils";
import { Sport } from "@/data/types";
import { Circle, Dribbble, Trophy } from "lucide-react";

interface SportIconProps {
  sport: Sport;
  className?: string;
  size?: number;
}

export const SportIcon = ({ sport, className, size = 60 }: SportIconProps) => {
  const icons: Record<Sport, React.ReactNode> = {
    cricket: (
      <img
        src="/icons/cricket.svg"
        alt="Cricket"
        width={size}
        height={size}
        className={className}
      />
    ),
    football: (
      <img
        src="/icons/football.svg"
        alt="Football"
        width={size}
        height={size}
        className={className}
      />
    ),
    basketball: (
      <img
        src="/icons/basketball.svg"
        alt="Basketball"
        width={size}
        height={size}
        className={className}
      />
    ),
    tennis: (
      <img
        src="/icons/tennis.svg"
        alt="Tennis"
        width={size}
        height={size}
        className={className}
      />
    ),
  };

  const colorClasses: Record<Sport, string> = {
    cricket: "text-cricket",
    football: "text-football",
    basketball: "text-basketball",
    tennis: "text-tennis",
  };

  return (
    <span className={cn(colorClasses[sport], className)}>
      {icons[sport]}
    </span>
  );
};

export const getSportGradient = (sport: Sport): string => {
  const gradients: Record<Sport, string> = {
    cricket: "from-cricket/20 to-cricket/5",
    football: "from-football/20 to-football/5",
    basketball: "from-basketball/20 to-basketball/5",
    tennis: "from-tennis/20 to-tennis/5",
  };
  return gradients[sport];
};

export const getSportBorderColor = (sport: Sport): string => {
  const borders: Record<Sport, string> = {
    cricket: "border-cricket/30",
    football: "border-football/30",
    basketball: "border-basketball/30",
    tennis: "border-tennis/30",
  };
  return borders[sport];
};
