import { cn } from "@/lib/utils";
import { Sport } from "@/data/types";
import { SportIcon } from "./SportIcon";

interface SportFilterProps {
  activeSport: Sport | "all";
  onSportChange: (sport: Sport | "all") => void;
  className?: string;
}

const sports: { id: Sport | "all"; label: string }[] = [
  { id: "all", label: "All Sports" },
  { id: "cricket", label: "Cricket" },
  { id: "football", label: "Football" },
  { id: "basketball", label: "Basketball" },
  { id: "tennis", label: "Tennis" },
];

export const SportFilter = ({ activeSport, onSportChange, className }: SportFilterProps) => {
  return (
    <div className={cn("flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide", className)}>
      {sports.map((sport) => (
        <button
          key={sport.id}
          onClick={() => onSportChange(sport.id)}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-full font-medium text-sm",
            "transition-all duration-300 whitespace-nowrap",
            "border",
            activeSport === sport.id
              ? sport.id === "all"
                ? "bg-primary text-primary-foreground border-primary"
                : sport.id === "cricket"
                ? "bg-cricket/20 text-cricket border-cricket/50"
                : sport.id === "football"
                ? "bg-football/20 text-football border-football/50"
                : sport.id === "basketball"
                ? "bg-basketball/20 text-basketball border-basketball/50"
                : "bg-tennis/20 text-tennis border-tennis/50"
              : "bg-secondary/50 text-muted-foreground border-border hover:bg-secondary hover:text-foreground"
          )}
        >
          {sport.id !== "all" && <SportIcon sport={sport.id as Sport} size={16} />}
          {sport.label}
        </button>
      ))}
    </div>
  );
};
