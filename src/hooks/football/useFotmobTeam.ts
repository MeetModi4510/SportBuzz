import { useState, useEffect } from 'react';

export interface FotmobTeamData {
  details: {
    id: number;
    name: string;
    country: string;
    sportsTeamJSONLD?: any;
  };
  overview: {
    table: any[];
    topPlayers: {
      byRating: any;
      byGoals: any;
      byAssists: any;
    };
    venue: {
      statValue: {
        name: string;
        city: string;
        capacity: number;
      };
    };
    coachHistory: {
      name: string;
      startDate: string;
    };
    fifaRanking: {
      statValue: number;
    };
    overviewFixtures: any[];
    nextMatch: any;
    teamForm: Record<string, any>;
    teamColors: {
      darkMode: string;
      lightMode: string;
    };
  };
  squad?: {
    squad: Array<{
      title: string;
      members: Array<{
        id: number;
        name: string;
        role: string;
        cname?: string;
        ccode?: string;
      }>;
    }>;
  };
  fixtures?: {
    allFixtures: {
      fixtures: Array<{
        id: number;
        home: { name: string; id: number; score?: number };
        away: { name: string; id: number; score?: number };
        status: { utcTime: string; started: boolean; cancelled: boolean; finished: boolean };
        tournament: { name: string };
      }>;
    };
  };
  history?: {
    trophyList: Array<{
      name: string[];
      tournamentTemplateId: string[];
      area: string[];
      ccode: string[];
      won: string[];
      runnerup: string[];
      season_won: string[];
      season_runnerup: string[];
    }>;
  };
}

export function useFotmobTeam(identifier: string | null) {
  const [data, setData] = useState<FotmobTeamData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!identifier) {
      setData(null);
      setError(null);
      return;
    }

    let isMounted = true;

    async function fetchTeam() {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(`http://localhost:5000/api/fotmob/team/${encodeURIComponent(identifier!)}`);
        const json = await response.json();
        
        if (isMounted) {
          if (json.success) {
            setData(json.data);
          } else {
            setError(json.message || 'Failed to fetch team data');
          }
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err.message || 'Network error');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    fetchTeam();

    return () => {
      isMounted = false;
    };
  }, [identifier]);

  return { data, isLoading, error };
}
