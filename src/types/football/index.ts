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
  events?: any[];
  lineups?: any[];
  statistics?: any[];
}
