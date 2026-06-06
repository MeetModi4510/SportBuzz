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
            "flex items-center gap-2 px-5 py-2 rounded-full font-bold text-sm",
            "transition-all duration-300 whitespace-nowrap",
            "border",
            activeSport === sport.id
              ? "bg-gradient-to-r from-[#D4AF37] to-[#F3E5AB] text-[#0a0a0a] border-transparent shadow-[0_0_20px_rgba(212,175,55,0.3)]"
              : "bg-[#121212] text-[#D4AF37]/50 border-[#D4AF37]/20 hover:bg-[#1a1a1a] hover:text-[#D4AF37]"
          )}
        >
          {sport.id !== "all" && <SportIcon sport={sport.id as Sport} size={16} />}
          {sport.label}
        </button>
      ))}
    </div>
  );
};
