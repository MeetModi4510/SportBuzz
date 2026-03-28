export type Sport = "cricket" | "football" | "basketball" | "tennis";
export type MatchStatus = "live" | "upcoming" | "completed";

export interface Team {
  id: string;
  name: string;
  shortName: string;
  logo: string;
  sport: Sport;
  primaryColor: string;
  players?: any[];
}

export interface Venue {
  id: string;
  name: string;
  city: string;
  country: string;
  capacity: number;
  sport: Sport;
}

export interface Match {
  id: string;
  sport: Sport;
  homeTeam: Team;
  awayTeam: Team;
  homeScore: string;
  awayScore: string;
  status: MatchStatus;
  venue: Venue;
  startTime: Date;
  matchType: string;
  nameDescription?: string; // e.g. "2nd Quarter-Final"
  scoreBreakdown?: {
    home: { inn1?: string; inn2?: string };
    away: { inn1?: string; inn2?: string };
  };
  // Sport-specific fields
  currentOver?: string;
  targetScore?: string;
  requiredRunRate?: string;
  goals?: {
    teamId: string;
    player: string;
    assist?: string;
    minute: number;
    type?: 'goal' | 'penalty' | 'own-goal';
  }[];
  currentMinute?: string;
  currentQuarter?: string;
  timeRemaining?: string;
  currentSet?: string;
  events?: MatchEvent[];
  summaryText?: string;
  displayTime?: string; // Pre-formatted IST time string from backend

  // Test Match Specific
  stumpsStatus?: string;
  inningsScores?: {
    inning: string; // e.g. "1", "2"
    score: string;
    team: string; // "home" or "away"
    teamName: string;
    overs?: string;
  }[];
  referee?: string;
  attendance?: string;
  manOfTheMatch?: { id: string; name: string };
  tossResult?: string;
  detailedStats?: {
    category: string;
    stats: { label: string; home: number; away: number; unit?: string }[];
  }[];
    squads?: {
      homeTeam: Player[];
      awayTeam: Player[];
    };
    homeLineup?: string[];
    awayLineup?: string[];
  }

export interface PlayerStats {
  matches?: number;
  runs?: number;
  average?: number;
  strikeRate?: number;
  wickets?: number;
  economy?: number;
  goals?: number;
  assists?: number;
  rating?: number;
  points?: number;
  rebounds?: number;
  threePointers?: number;
  wins?: number;
  grandSlams?: number;
  aces?: number;
}

export interface Player {
  id: string;
  name: string;
  teamId: string;
  sport: Sport;
  position: string;
  rating: number;
  stats: Record<string, any>;
  matchStats?: {
    goals?: number;
    assists?: number;
    yellowCards?: number;
    redCards?: number;
    saves?: number;
    rating?: number;
    substitutedIn?: string;
    substitutedOut?: string;
  };
  photo?: string; // Optional photo URL or ID (format: fp-{playerId} for football)
  photo2?: string;
  photo3?: string;
  image?: string;
  isSubstitute?: boolean;
}

export interface MatchEvent {
  id: string;
  matchId: string;
  time: string;
  type: "goal" | "wicket" | "boundary" | "foul" | "substitution" | "timeout" | "ace" | "break" | "info" | "save" | "miss";
  description: string;
  shortDescription?: string;
  playerId?: string;
}

export interface HeadToHead {
  team1Id: string;
  team2Id: string;
  team1Wins: number;
  team2Wins: number;
  draws: number;
  lastMatches: {
    date: Date;
    winner: string | null;
    score: string;
  }[];
}
