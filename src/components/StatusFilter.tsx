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
              ? "bg-gradient-to-r from-[#D4AF37] to-[#F3E5AB] text-[#0a0a0a] border-transparent shadow-[0_0_20px_rgba(212,175,55,0.3)]"
              : "bg-[#121212] text-[#D4AF37]/50 border-[#D4AF37]/20 hover:bg-[#1a1a1a] hover:text-[#D4AF37]"
          )}
        >
          {status.label}
        </button>
      ))}
    </div>
  );
};
