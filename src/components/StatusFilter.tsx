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
    <div className={cn("flex items-center gap-1 bg-secondary/30 p-1 rounded-lg", className)}>
      {statuses.map((status) => (
        <button
          key={status.id}
          onClick={() => onStatusChange(status.id)}
          className={cn(
            "px-4 py-2 rounded-md font-medium text-sm transition-all duration-200",
            activeStatus === status.id
              ? status.id === "live"
                ? "bg-live/20 text-live"
                : status.id === "completed"
                  ? "bg-completed/20 text-completed"
                  : "bg-card text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {status.label}
        </button>
      ))}
    </div>
  );
};
