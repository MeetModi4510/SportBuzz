export interface FootballTeam {
  id: number;
  name: string;
  logo: string;
  winner?: boolean;
}

export interface FootballLeague {
  id: number;
  name: string;
  country: string;
  logo: string;
  flag: string;
  season: number;
  round: string;
}

export interface FootballFixture {
  id: number;
  referee: string | null;
  timezone: string;
  date: string;
  timestamp: number;
  periods: {
    first: number | null;
    second: number | null;
  };
  venue: {
    id: number | null;
    name: string;
    city: string;
  };
  status: {
    long: string;
    short: string;
    elapsed: number | null;
  };
}

export interface FootballGoals {
  home: number | null;
  away: number | null;
}

export interface FootballEvent {
  time: { elapsed: number; extra: number | null };
  team: { id: number; name: string; logo: string };
  player: { id: number | null; name: string };
  assist: { id: number | null; name: string | null };
  type: string;
  detail: string;
  comments: string | null;
}

export interface FootballStatistic {
  type: string;
  value: string | number | null;
}

export interface FootballTeamStatistics {
  team: { id: number; name: string; logo: string };
  statistics: FootballStatistic[];
}

export interface FootballPlayerInfo {
  player: {
    id: number;
    name: string;
    number: number;
    pos: string;
    grid: string | null;
  };
}

export interface FootballLineup {
  team: {
    id: number;
    name: string;
    logo: string;
    colors: any;
  };
  coach: { id: number; name: string; photo: string };
  formation: string;
  startXI: FootballPlayerInfo[];
  substitutes: FootballPlayerInfo[];
}

export interface FootballMatchPlayerStat {
  team: { id: number; name: string; logo: string };
  players: {
    player: { id: number; name: string; photo: string };
    statistics: {
      games: { rating: string | null; minutes: number | null };
      goals: { total: number | null; assists: number | null };
    }[];
  }[];
}

export interface FootballMatch {
  fixture: FootballFixture;
  league: FootballLeague;
  teams: {
    home: FootballTeam;
    away: FootballTeam;
  };
  goals: FootballGoals;
  score: {
    halftime: FootballGoals;
    fulltime: FootballGoals;
    extratime: FootballGoals;
    penalty: FootballGoals;
  };
  events?: FootballEvent[];
  lineups?: FootballLineup[];
  statistics?: FootballTeamStatistics[];
  players?: FootballMatchPlayerStat[];
}
