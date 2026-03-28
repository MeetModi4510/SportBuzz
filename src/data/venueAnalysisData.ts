// Sport-specific detailed venue analysis data
import { Sport } from "./types";
import { edenGardens, gabba, galle, campNou, anfield, maracana, unitedCenter, chasecenter, usOpen, australianOpen } from './venueExtras';

export interface VenueAnalysis {
    id: string;
    name: string;
    city: string;
    country: string;
    capacity: number;
    sport: Sport;
    established: number;
    nickname?: string;
    description: string;
    // Sport-specific stats are below — each sport adds its own shape
    stats: CricketVenueStats | FootballVenueStats | BasketballVenueStats | TennisVenueStats;
    recentMatches: VenueRecentMatch[];
    topPerformers: VenueTopPerformer[];
}

// ─── Cricket ─────────────────────────────────────────────────────
export interface CricketVenueStats {
    sport: "cricket";
    avgFirstInningsScore: number;
    avgSecondInningsScore: number;
    highestTotal: { score: string; team: string; year: number };
    lowestTotal: { score: string; team: string; year: number };
    matchesHosted: number;
    wonBattingFirst: number;  // percentage
    wonBattingSecond: number; // percentage
    draws: number;            // percentage
    avgRunRate: number;
    pitchType: string;
    tossWinBatFirst: number;  // % who chose to bat
    tossWinFieldFirst: number; // % who chose to field
    avgWicketsFallen: number;
    centuries: number;
    fiveWicketHauls: number;
    formatBreakdown: { format: string; matches: number }[];
}

// ─── Football ────────────────────────────────────────────────────
export interface FootballVenueStats {
    sport: "football";
    matchesHosted: number;
    avgGoalsPerMatch: number;
    homeWinPct: number;
    awayWinPct: number;
    drawPct: number;
    biggestHomeWin: { score: string; teams: string; year: number };
    biggestAwayWin: { score: string; teams: string; year: number };
    cleanSheetPct: number;
    avgAttendance: number;
    penaltiesAwarded: number;
    redCards: number;
    competitionsHosted: string[];
}

// ─── Basketball ──────────────────────────────────────────────────
export interface BasketballVenueStats {
    sport: "basketball";
    matchesHosted: number;
    avgTotalPoints: number;
    homeWinPct: number;
    awayWinPct: number;
    avgPointDifferential: number;
    highestScoringGame: { score: string; teams: string; year: number };
    lowestScoringGame: { score: string; teams: string; year: number };
    overtimeGamesPct: number;
    avgAttendance: number;
    tripleDoubles: number;
    buzzerBeaters: number;
}

// ─── Tennis ──────────────────────────────────────────────────────
export interface TennisVenueStats {
    sport: "tennis";
    surface: string;
    matchesHosted: number;
    avgSetsPerMatch: number;
    tiebreakPct: number;
    longestMatch: { duration: string; players: string; year: number };
    avgMatchDuration: string;
    upsetPct: number;
    aceAvgPerMatch: number;
    fiveSetter: number; // percentage of 5-set matches
    mostTitles: { player: string; titles: number };
    grandSlamEdition: number; // how many editions hosted
}

export interface VenueRecentMatch {
    date: string;
    teams: string;
    score: string;
    result: string; // e.g. "India won by 5 wickets", "Real Madrid 3-1"
}

export interface VenueTopPerformer {
    name: string;
    country: string;
    stat: string; // e.g. "1245 runs", "67 goals"
    highlight: string; // e.g. "Highest scorer"
}

// ═════════════════════════════════════════════════════════════════
//  CRICKET VENUES
// ═════════════════════════════════════════════════════════════════

const wankhede: VenueAnalysis = {
    id: "wankhede",
    name: "Wankhede Stadium",
    city: "Mumbai",
    country: "India",
    capacity: 33000,
    sport: "cricket",
    established: 1974,
    nickname: "The Fortress of Mumbai",
    description: "Iconic home of Mumbai cricket, hosted the 2011 World Cup Final where India lifted the trophy on home soil.",
    stats: {
        sport: "cricket",
        avgFirstInningsScore: 267,
        avgSecondInningsScore: 245,
        highestTotal: { score: "413/5", team: "India", year: 2014 },
        lowestTotal: { score: "112", team: "New Zealand", year: 2017 },
        matchesHosted: 169,
        wonBattingFirst: 52,
        wonBattingSecond: 41,
        draws: 7,
        avgRunRate: 5.42,
        pitchType: "Flat batting track, assists spin in 2nd innings",
        tossWinBatFirst: 62,
        tossWinFieldFirst: 38,
        avgWicketsFallen: 14,
        centuries: 78,
        fiveWicketHauls: 34,
        formatBreakdown: [
            { format: "Test", matches: 26 },
            { format: "ODI", matches: 24 },
            { format: "T20I", matches: 12 },
            { format: "IPL", matches: 107 },
        ],
    },
    recentMatches: [
        { date: "Mar 2025", teams: "India vs England", score: "318/5 vs 287/8", result: "India won by 31 runs" },
        { date: "Jan 2025", teams: "MI vs CSK (IPL)", score: "186/4 vs 181/7", result: "MI won by 5 runs" },
        { date: "Nov 2024", teams: "India vs Australia", score: "302/6 vs 298/9", result: "India won by 4 runs" },
        { date: "Oct 2024", teams: "India vs New Zealand", score: "235 vs 237/4", result: "NZ won by 6 wickets" },
        { date: "Apr 2024", teams: "MI vs RCB (IPL)", score: "212/3 vs 196/8", result: "MI won by 16 runs" },
    ],
    topPerformers: [
        { name: "Sachin Tendulkar", country: "India", stat: "1,245 runs", highlight: "Highest scorer" },
        { name: "Rohit Sharma", country: "India", stat: "987 runs", highlight: "Most sixes (42)" },
        { name: "Harbhajan Singh", country: "India", stat: "52 wickets", highlight: "Most wickets" },
        { name: "Jasprit Bumrah", country: "India", stat: "34 wickets", highlight: "Best economy (4.2)" },
    ],
};

const lords: VenueAnalysis = {
    id: "lords",
    name: "Lord's Cricket Ground",
    city: "London",
    country: "England",
    capacity: 30000,
    sport: "cricket",
    established: 1814,
    nickname: "The Home of Cricket",
    description: "The most famous cricket ground in the world, home to the Marylebone Cricket Club (MCC) and the spirit of the game.",
    stats: {
        sport: "cricket",
        avgFirstInningsScore: 283,
        avgSecondInningsScore: 240,
        highestTotal: { score: "729/6d", team: "Australia", year: 1930 },
        lowestTotal: { score: "42", team: "India", year: 1974 },
        matchesHosted: 412,
        wonBattingFirst: 48,
        wonBattingSecond: 35,
        draws: 17,
        avgRunRate: 4.85,
        pitchType: "Seam-friendly with variable bounce, rewards patience",
        tossWinBatFirst: 55,
        tossWinFieldFirst: 45,
        avgWicketsFallen: 16,
        centuries: 185,
        fiveWicketHauls: 92,
        formatBreakdown: [
            { format: "Test", matches: 145 },
            { format: "ODI", matches: 68 },
            { format: "T20I", matches: 8 },
            { format: "Other", matches: 191 },
        ],
    },
    recentMatches: [
        { date: "Jul 2025", teams: "England vs India", score: "364 vs 368/7", result: "India won by 3 wickets" },
        { date: "Jun 2025", teams: "England vs Australia", score: "289/8 vs 278", result: "England won by 11 runs" },
        { date: "Sep 2024", teams: "England vs Sri Lanka", score: "325/7 vs 156", result: "England won by 169 runs" },
        { date: "Jul 2024", teams: "England vs West Indies", score: "121 vs 302", result: "West Indies won by 181 runs" },
        { date: "Jun 2024", teams: "MCC vs Rest of World", score: "245/8 vs 246/4", result: "Rest of World won" },
    ],
    topPerformers: [
        { name: "Graham Gooch", country: "England", stat: "2,015 runs", highlight: "Highest scorer (Tests)" },
        { name: "James Anderson", country: "England", stat: "112 wickets", highlight: "Most wickets" },
        { name: "Brian Lara", country: "West Indies", stat: "221* (2001)", highlight: "Highest individual score" },
        { name: "Stuart Broad", country: "England", stat: "86 wickets", highlight: "Best spell: 8/15" },
    ],
};

const mcg: VenueAnalysis = {
    id: "mcg",
    name: "Melbourne Cricket Ground",
    city: "Melbourne",
    country: "Australia",
    capacity: 100024,
    sport: "cricket",
    established: 1853,
    nickname: "The G",
    description: "The largest cricket stadium in the world, spiritual home of the Boxing Day Test and Australian sporting culture.",
    stats: {
        sport: "cricket",
        avgFirstInningsScore: 295,
        avgSecondInningsScore: 258,
        highestTotal: { score: "604/6d", team: "Australia", year: 1937 },
        lowestTotal: { score: "36", team: "South Africa", year: 1932 },
        matchesHosted: 503,
        wonBattingFirst: 45,
        wonBattingSecond: 43,
        draws: 12,
        avgRunRate: 5.15,
        pitchType: "Hard and bouncy, rewards fast bowlers early, flattens for batting",
        tossWinBatFirst: 58,
        tossWinFieldFirst: 42,
        avgWicketsFallen: 15,
        centuries: 210,
        fiveWicketHauls: 98,
        formatBreakdown: [
            { format: "Test", matches: 115 },
            { format: "ODI", matches: 98 },
            { format: "T20I", matches: 18 },
            { format: "BBL/Other", matches: 272 },
        ],
    },
    recentMatches: [
        { date: "Dec 2024", teams: "Australia vs India", score: "474 vs 369", result: "Australia won by 105 runs" },
        { date: "Nov 2024", teams: "Australia vs Pakistan", score: "325/6 vs 268", result: "Australia won by 57 runs" },
        { date: "Dec 2023", teams: "Australia vs Pakistan", score: "299/5 vs 203", result: "Australia won by 96 runs" },
        { date: "Feb 2023", teams: "Stars vs Renegades (BBL)", score: "182/5 vs 176/8", result: "Stars won by 6 runs" },
        { date: "Dec 2022", teams: "Australia vs South Africa", score: "372 vs 204", result: "Australia won by 168 runs" },
    ],
    topPerformers: [
        { name: "Don Bradman", country: "Australia", stat: "1,671 runs", highlight: "Tests — avg 128.5" },
        { name: "Shane Warne", country: "Australia", stat: "103 wickets", highlight: "Most wickets (Tests)" },
        { name: "Ricky Ponting", country: "Australia", stat: "1,452 runs", highlight: "Most ODI runs here" },
        { name: "Dennis Lillee", country: "Australia", stat: "85 wickets", highlight: "Iconic fast bowler" },
    ],
};

// ═════════════════════════════════════════════════════════════════
//  FOOTBALL VENUES
// ═════════════════════════════════════════════════════════════════

const oldTrafford: VenueAnalysis = {
    id: "old-trafford-f",
    name: "Old Trafford",
    city: "Manchester",
    country: "England",
    capacity: 74310,
    sport: "football",
    established: 1910,
    nickname: "Theatre of Dreams",
    description: "Home of Manchester United, one of the most storied grounds in world football with a rich history of legendary players and dramatic moments.",
    stats: {
        sport: "football",
        matchesHosted: 2187,
        avgGoalsPerMatch: 2.78,
        homeWinPct: 58,
        awayWinPct: 24,
        drawPct: 18,
        biggestHomeWin: { score: "9-0", teams: "Man United vs Ipswich", year: 1995 },
        biggestAwayWin: { score: "1-6", teams: "Man United vs Man City", year: 2011 },
        cleanSheetPct: 34,
        avgAttendance: 73200,
        penaltiesAwarded: 245,
        redCards: 189,
        competitionsHosted: ["Premier League", "Champions League", "FA Cup", "Europa League", "World Cup 1966"],
    },
    recentMatches: [
        { date: "Feb 2025", teams: "Man United vs Liverpool", score: "2-1", result: "Man United won" },
        { date: "Jan 2025", teams: "Man United vs Arsenal", score: "1-1", result: "Draw" },
        { date: "Dec 2024", teams: "Man United vs Man City", score: "2-3", result: "Man City won" },
        { date: "Nov 2024", teams: "Man United vs Chelsea", score: "3-0", result: "Man United won" },
        { date: "Oct 2024", teams: "Man United vs Tottenham", score: "0-2", result: "Tottenham won" },
    ],
    topPerformers: [
        { name: "Wayne Rooney", country: "England", stat: "183 goals", highlight: "All-time top scorer" },
        { name: "Ryan Giggs", country: "Wales", stat: "632 apps", highlight: "Most appearances" },
        { name: "Cristiano Ronaldo", country: "Portugal", stat: "101 goals", highlight: "2 stints at club" },
        { name: "Bobby Charlton", country: "England", stat: "199 goals", highlight: "Club legend" },
    ],
};

const bernabeu: VenueAnalysis = {
    id: "bernabeu",
    name: "Santiago Bernabéu",
    city: "Madrid",
    country: "Spain",
    capacity: 81044,
    sport: "football",
    established: 1947,
    nickname: "The Cathedral of Football",
    description: "Legendary home of Real Madrid, recently renovated into a cutting-edge arena with a retractable roof and 360-degree screen.",
    stats: {
        sport: "football",
        matchesHosted: 2845,
        avgGoalsPerMatch: 3.12,
        homeWinPct: 65,
        awayWinPct: 18,
        drawPct: 17,
        biggestHomeWin: { score: "11-1", teams: "Real Madrid vs Elche", year: 1960 },
        biggestAwayWin: { score: "2-6", teams: "Real Madrid vs Barcelona", year: 2009 },
        cleanSheetPct: 38,
        avgAttendance: 78500,
        penaltiesAwarded: 312,
        redCards: 234,
        competitionsHosted: ["La Liga", "Champions League", "Copa del Rey", "World Cup 1982", "Euro 1964", "UCL Finals (4)"],
    },
    recentMatches: [
        { date: "Feb 2025", teams: "Real Madrid vs Barcelona", score: "3-1", result: "Real Madrid won" },
        { date: "Jan 2025", teams: "Real Madrid vs Atletico Madrid", score: "2-2", result: "Draw" },
        { date: "Dec 2024", teams: "Real Madrid vs Bayern Munich", score: "2-1", result: "Real Madrid won (UCL)" },
        { date: "Nov 2024", teams: "Real Madrid vs Sevilla", score: "4-0", result: "Real Madrid won" },
        { date: "Oct 2024", teams: "Real Madrid vs PSG", score: "3-2", result: "Real Madrid won (UCL)" },
    ],
    topPerformers: [
        { name: "Cristiano Ronaldo", country: "Portugal", stat: "311 goals", highlight: "Top scorer in Bernabéu history" },
        { name: "Raúl González", country: "Spain", stat: "228 goals", highlight: "Club icon" },
        { name: "Karim Benzema", country: "France", stat: "192 goals", highlight: "151 at Bernabéu" },
        { name: "Sergio Ramos", country: "Spain", stat: "53 goals", highlight: "Defender with most goals here" },
    ],
};

// ═════════════════════════════════════════════════════════════════
//  BASKETBALL VENUES
// ═════════════════════════════════════════════════════════════════

const cryptoArena: VenueAnalysis = {
    id: "staples",
    name: "Crypto.com Arena",
    city: "Los Angeles",
    country: "USA",
    capacity: 19068,
    sport: "basketball",
    established: 1999,
    nickname: "The House That Stars Built",
    description: "Home to the Lakers and Clippers, this downtown LA arena has witnessed championships, iconic performances, and legendary playoff battles.",
    stats: {
        sport: "basketball",
        matchesHosted: 2845,
        avgTotalPoints: 208.5,
        homeWinPct: 59,
        awayWinPct: 41,
        avgPointDifferential: 5.8,
        highestScoringGame: { score: "162-158 (4OT)", teams: "Lakers vs Celtics", year: 2006 },
        lowestScoringGame: { score: "82-71", teams: "Lakers vs Pistons", year: 2004 },
        overtimeGamesPct: 8.2,
        avgAttendance: 18997,
        tripleDoubles: 156,
        buzzerBeaters: 42,
    },
    recentMatches: [
        { date: "Feb 2025", teams: "Lakers vs Warriors", score: "118-112", result: "Lakers won" },
        { date: "Jan 2025", teams: "Lakers vs Celtics", score: "105-115", result: "Celtics won" },
        { date: "Jan 2025", teams: "Lakers vs Nuggets", score: "122-118", result: "Lakers won" },
        { date: "Dec 2024", teams: "Lakers vs Bucks", score: "130-125 (OT)", result: "Lakers won" },
        { date: "Dec 2024", teams: "Clippers vs Suns", score: "98-108", result: "Suns won" },
    ],
    topPerformers: [
        { name: "Kobe Bryant", country: "USA", stat: "16,161 pts", highlight: "81-point game (2006)" },
        { name: "LeBron James", country: "USA", stat: "8,420 pts", highlight: "All-time leading scorer" },
        { name: "Shaquille O'Neal", country: "USA", stat: "5,892 pts", highlight: "3 championships here" },
        { name: "Anthony Davis", country: "USA", stat: "4,210 pts", highlight: "2020 champion" },
    ],
};

const msg: VenueAnalysis = {
    id: "msg",
    name: "Madison Square Garden",
    city: "New York",
    country: "USA",
    capacity: 19812,
    sport: "basketball",
    established: 1968,
    nickname: "The Mecca of Basketball",
    description: "The world's most famous arena, home of the New York Knicks and host to countless iconic moments in basketball and entertainment history.",
    stats: {
        sport: "basketball",
        matchesHosted: 3450,
        avgTotalPoints: 202.3,
        homeWinPct: 55,
        awayWinPct: 45,
        avgPointDifferential: 4.2,
        highestScoringGame: { score: "169-147", teams: "Knicks vs Nuggets", year: 1983 },
        lowestScoringGame: { score: "75-68", teams: "Knicks vs Heat", year: 2000 },
        overtimeGamesPct: 9.1,
        avgAttendance: 19210,
        tripleDoubles: 198,
        buzzerBeaters: 58,
    },
    recentMatches: [
        { date: "Feb 2025", teams: "Knicks vs 76ers", score: "121-115", result: "Knicks won" },
        { date: "Jan 2025", teams: "Knicks vs Nets", score: "112-98", result: "Knicks won" },
        { date: "Jan 2025", teams: "Knicks vs Celtics", score: "108-118", result: "Celtics won" },
        { date: "Dec 2024", teams: "Knicks vs Heat", score: "105-99", result: "Knicks won" },
        { date: "Dec 2024", teams: "Knicks vs Bulls", score: "115-108", result: "Knicks won" },
    ],
    topPerformers: [
        { name: "Patrick Ewing", country: "USA", stat: "23,665 pts", highlight: "Knicks franchise player" },
        { name: "Carmelo Anthony", country: "USA", stat: "10,186 pts", highlight: "62-point game (2014)" },
        { name: "Willis Reed", country: "USA", stat: "12,183 pts", highlight: "Iconic 1970 Finals" },
        { name: "Walt Frazier", country: "USA", stat: "14,617 pts", highlight: "Style icon of basketball" },
    ],
};

// ═════════════════════════════════════════════════════════════════
//  TENNIS VENUES
// ═════════════════════════════════════════════════════════════════

const wimbledon: VenueAnalysis = {
    id: "wimbledon",
    name: "All England Club",
    city: "London",
    country: "England",
    capacity: 15000,
    sport: "tennis",
    established: 1877,
    nickname: "The Championships",
    description: "The oldest and most prestigious tennis tournament in the world, played on grass courts with a tradition of all-white attire.",
    stats: {
        sport: "tennis",
        surface: "Grass",
        matchesHosted: 4500,
        avgSetsPerMatch: 3.4,
        tiebreakPct: 18.5,
        longestMatch: { duration: "11h 5min", players: "Isner vs Mahut", year: 2010 },
        avgMatchDuration: "2h 12min",
        upsetPct: 14.2,
        aceAvgPerMatch: 14.8,
        fiveSetter: 22,
        mostTitles: { player: "Roger Federer", titles: 8 },
        grandSlamEdition: 138,
    },
    recentMatches: [
        { date: "Jul 2024", teams: "Alcaraz vs Djokovic", score: "6-2, 6-2, 7-6(4)", result: "Alcaraz won (Final)" },
        { date: "Jul 2024", teams: "Sinner vs Medvedev", score: "6-7, 6-4, 7-6, 6-2", result: "Sinner won (QF)" },
        { date: "Jul 2024", teams: "Fritz vs Zverev", score: "4-6, 6-7, 6-4, 7-6, 6-3", result: "Fritz won" },
        { date: "Jul 2023", teams: "Alcaraz vs Djokovic", score: "1-6, 7-6, 6-1, 3-6, 6-4", result: "Alcaraz won (Final)" },
        { date: "Jul 2023", teams: "Sinner vs Alcaraz", score: "3-6, 6-4, 6-4, 6-3", result: "Alcaraz won (SF)" },
    ],
    topPerformers: [
        { name: "Roger Federer", country: "Switzerland", stat: "8 titles", highlight: "Most Wimbledon titles (Open Era)" },
        { name: "Novak Djokovic", country: "Serbia", stat: "7 titles", highlight: "5 consecutive (2018-22)" },
        { name: "Pete Sampras", country: "USA", stat: "7 titles", highlight: "Grass court master" },
        { name: "Serena Williams", country: "USA", stat: "7 titles", highlight: "Most women's titles (Open Era)" },
    ],
};

const rolandGarros: VenueAnalysis = {
    id: "roland-garros",
    name: "Roland Garros",
    city: "Paris",
    country: "France",
    capacity: 15225,
    sport: "tennis",
    established: 1928,
    nickname: "The Cathedral of Clay",
    description: "Home of the French Open, the only Grand Slam played on clay. Known for grueling rallies and the dominance of Rafael Nadal.",
    stats: {
        sport: "tennis",
        surface: "Clay",
        matchesHosted: 3800,
        avgSetsPerMatch: 3.6,
        tiebreakPct: 12.3,
        longestMatch: { duration: "6h 33min", players: "Fabrice Santoro vs Arnaud Clément", year: 2004 },
        avgMatchDuration: "2h 35min",
        upsetPct: 11.8,
        aceAvgPerMatch: 8.4,
        fiveSetter: 26,
        mostTitles: { player: "Rafael Nadal", titles: 14 },
        grandSlamEdition: 128,
    },
    recentMatches: [
        { date: "Jun 2024", teams: "Alcaraz vs Zverev", score: "6-3, 2-6, 5-7, 6-1, 6-2", result: "Alcaraz won (Final)" },
        { date: "Jun 2024", teams: "Sinner vs Alcaraz", score: "2-6, 6-3, 3-6, 6-4, 6-3", result: "Alcaraz won (SF)" },
        { date: "Jun 2024", teams: "Djokovic vs Musetti", score: "7-5, 6-7, 2-6, 6-3, 6-0", result: "Djokovic won" },
        { date: "Jun 2023", teams: "Djokovic vs Ruud", score: "7-6, 6-3, 7-5", result: "Djokovic won (Final)" },
        { date: "Jun 2023", teams: "Alcaraz vs Djokovic", score: "6-3, 5-7, 6-1, 6-1", result: "Djokovic won (SF)" },
    ],
    topPerformers: [
        { name: "Rafael Nadal", country: "Spain", stat: "14 titles", highlight: "The King of Clay" },
        { name: "Björn Borg", country: "Sweden", stat: "6 titles", highlight: "1978–81 streak" },
        { name: "Novak Djokovic", country: "Serbia", stat: "3 titles", highlight: "Career Grand Slam" },
        { name: "Chris Evert", country: "USA", stat: "7 titles", highlight: "Most women's titles" },
    ],
};

// ═════════════════════════════════════════════════════════════════
//  EXPORTS
// ═════════════════════════════════════════════════════════════════

export const VENUE_ANALYSIS_DATA: VenueAnalysis[] = [
    wankhede, lords, mcg, edenGardens, gabba, galle,
    oldTrafford, bernabeu, campNou, anfield, maracana,
    cryptoArena, msg, unitedCenter, chasecenter,
    wimbledon, rolandGarros, usOpen, australianOpen,
];

export const getVenueAnalysis = (id: string) => VENUE_ANALYSIS_DATA.find(v => v.id === id);
export const getVenuesBySport = (sport: Sport) => VENUE_ANALYSIS_DATA.filter(v => v.sport === sport);
