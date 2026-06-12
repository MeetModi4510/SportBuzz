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
    <div className={cn("inline-flex items-center gap-1 bg-secondary/40 p-1.5 rounded-2xl border border-border/50 shadow-sm backdrop-blur-sm overflow-x-auto scrollbar-hide max-w-full", className)}>
      {sports.map((sport) => (
        <button
          key={sport.id}
          onClick={() => onSportChange(sport.id)}
          className={cn(
            "flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-sm",
            "transition-all duration-300 whitespace-nowrap",
            activeSport === sport.id
              ? "bg-background text-foreground shadow-sm ring-1 ring-border/50"
              : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
          )}
        >
          {sport.id !== "all" && <SportIcon sport={sport.id as Sport} size={18} />}
          {sport.label}
        </button>
      ))}
    </div>
  );
};
