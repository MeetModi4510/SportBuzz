import { useState, useEffect } from 'react';

export interface LeagueTeam {
  id: number;
  name: string;
  played?: number;
  points?: number;
}

export interface FotmobLeagueData {
  tabs: string[];
  details: any;
  table: any[];
  transfers: any;
  overview: any;
  stats: any;
  fixtures: any;
  playoff: any;
  seasons: any;
  teams: LeagueTeam[];
}

export function useFotmobLeague(leagueId: number | string | null) {
  const [data, setData] = useState<FotmobLeagueData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!leagueId) {
      setData(null);
      setError(null);
      setIsLoading(false);
      return;
    }

    const fetchLeague = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(`${import.meta.env.PROD ? "" : (import.meta.env.PROD ? "" : "http://localhost:5000")}/api/fotmob/league/${leagueId}`);
        const result = await response.json();
        
        if (result.success && result.data) {
          setData(result.data);
        } else {
          setError(result.message || 'Failed to fetch league data');
        }
      } catch (err: any) {
        setError(err.message || 'An error occurred while fetching league data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchLeague();
  }, [leagueId]);

  return { data, isLoading, error };
}
