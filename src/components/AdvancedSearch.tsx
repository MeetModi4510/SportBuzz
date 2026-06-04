import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Search, X, Filter } from "lucide-react";

interface AdvancedSearchProps {
  onSearch: (filters: SearchFilters) => void;
  onClose?: () => void;
}

export interface SearchFilters {
  query: string;
  sport: string;
  status: string;
  venue: string;
  dateFrom: string;
  dateTo: string;
  team: string;
}

export const AdvancedSearch = ({ onSearch, onClose }: AdvancedSearchProps) => {
  const [filters, setFilters] = useState<SearchFilters>({
    query: "",
    sport: "",
    status: "",
    venue: "",
    dateFrom: "",
    dateTo: "",
    team: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSearch = () => {
    onSearch(filters);
  };

  const handleReset = () => {
    setFilters({
      query: "",
      sport: "",
      status: "",
      venue: "",
      dateFrom: "",
      dateTo: "",
      team: "",
    });
  };

  return (
    <Card className="bg-slate-900 border-slate-700 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <Filter size={20} />
          Advanced Search
        </h3>
        {onClose && (
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition"
          >
            <X size={20} />
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <div>
          <label className="text-sm text-slate-300 block mb-2">Search</label>
          <Input
            name="query"
            value={filters.query}
            onChange={handleChange}
            placeholder="Team, player, or match..."
            className="bg-slate-800 border-slate-700 text-white"
          />
        </div>

        <div>
          <label className="text-sm text-slate-300 block mb-2">Sport</label>
          <select
            name="sport"
            value={filters.sport}
            onChange={handleChange}
            className="w-full bg-slate-800 border border-slate-700 text-white rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            <option value="">All Sports</option>
            <option value="cricket">Cricket</option>
            <option value="football">Football</option>
            <option value="basketball">Basketball</option>
            <option value="tennis">Tennis</option>
          </select>
        </div>

        <div>
          <label className="text-sm text-slate-300 block mb-2">Status</label>
          <select
            name="status"
            value={filters.status}
            onChange={handleChange}
            className="w-full bg-slate-800 border border-slate-700 text-white rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            <option value="">All Status</option>
            <option value="upcoming">Upcoming</option>
            <option value="live">Live</option>
            <option value="completed">Completed</option>
          </select>
        </div>

        <div>
          <label className="text-sm text-slate-300 block mb-2">Venue</label>
          <Input
            name="venue"
            value={filters.venue}
            onChange={handleChange}
            placeholder="Stadium name..."
            className="bg-slate-800 border-slate-700 text-white"
          />
        </div>

        <div>
          <label className="text-sm text-slate-300 block mb-2">Team</label>
          <Input
            name="team"
            value={filters.team}
            onChange={handleChange}
            placeholder="Team name..."
            className="bg-slate-800 border-slate-700 text-white"
          />
        </div>

        <div>
          <label className="text-sm text-slate-300 block mb-2">Date Range</label>
          <div className="flex gap-2">
            <Input
              name="dateFrom"
              type="date"
              value={filters.dateFrom}
              onChange={handleChange}
              className="bg-slate-800 border-slate-700 text-white flex-1"
            />
            <Input
              name="dateTo"
              type="date"
              value={filters.dateTo}
              onChange={handleChange}
              className="bg-slate-800 border-slate-700 text-white flex-1"
            />
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <Button
          onClick={handleSearch}
          className="bg-red-600 hover:bg-red-700 flex-1"
        >
          <Search size={18} className="mr-2" />
          Search
        </Button>
        <Button
          onClick={handleReset}
          variant="outline"
          className="border-slate-700 flex-1"
        >
          Reset
        </Button>
      </div>
    </Card>
  );
};
