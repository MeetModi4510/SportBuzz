import { cn } from "@/lib/utils";
import { MatchStatus } from "@/data/types";

interface StatusFilterProps {
  activeStatus: MatchStatus | "all";
  onStatusChange: (status: MatchStatus | "all") => void;
  className?: string;
}

const statuses: { id: MatchStatus | "all"; label: string }[] = [
  { id: "all", label: "All" },
  { id: "live", label: "Live" },
  { id: "completed", label: "Completed" },
];

export const StatusFilter = ({ activeStatus, onStatusChange, className }: StatusFilterProps) => {
  return (
    <div className={cn("flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide", className)}>
      {statuses.map((status) => (
        <button
          key={status.id}
          onClick={() => onStatusChange(status.id)}
          className={cn(
            "px-5 py-2 rounded-full font-bold text-sm transition-all duration-300 border",
            activeStatus === status.id
              ? "bg-foreground text-background border-transparent shadow-[0_0_15px_rgba(255,255,255,0.2)]"
              : "bg-transparent text-muted-foreground border-white/10 hover:bg-white/5 hover:text-foreground"
          )}
        >
          {status.label}
        </button>
      ))}
    </div>
  );
};
