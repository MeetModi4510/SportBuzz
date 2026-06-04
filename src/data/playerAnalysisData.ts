// Sport-specific detailed player analysis mock data
import { extraEnglandPlayers, extraNZPlayers, extraPakistanPlayers, extraSAPlayers } from './cricketExtras';
import { sriLankaPlayers, bangladeshPlayers, westIndiesPlayers, afghanistanPlayers } from './cricketNewTeams';

export type AnalysisSport = "cricket" | "football" | "basketball" | "tennis";

export interface AnalysisPlayer {
    id: string;
    name: string;
    country: string;
    countryFlag: string;
    sport: AnalysisSport;
    role: string;
    age: number;
    image: string; // initials
    photo?: string; // real player headshot URL
    photo2?: string;
    photo3?: string;
    overallRating: number;
    // Common radar attrs (0-100)
    attributes: Record<string, number>;
    // Sport-specific detailed stats
    detailedStats: Record<string, number | string>;
    // Performance trend (last 10 matches)
    formTrend: number[];
    // Career milestones
    milestones: { year: number; event: string; title?: string; icon?: string; reason?: string }[];
    // Unique sport-specific data
    specialData: any;
    recentPerformances?: any[];
    formats?: any;
    battingStyle?: string;
    bowlingStyle?: string;
}

// ─── CRICKET PLAYERS ─────────────────────────────────────────────
// ─── CRICKET PLAYERS ─────────────────────────────────────────────
const cricketPlayers: AnalysisPlayer[] = [
    // ─── INDIA ───
    {
        id: "cr1", name: "Virat Kohli", country: "India", countryFlag: "🇮🇳", sport: "cricket",
        role: "Batter", age: 36, image: "VK", photo: "/players/virat_new.jpg", photo2: "/players/virat_new.jpg", photo3: "/players/virat_new.jpg", overallRating: 94,
        attributes: { Batting: 96, Fielding: 85, Running: 88, Temperament: 92, Fitness: 90, Leadership: 91 },
        detailedStats: { Matches: 522, Runs: 26000, Average: 54.0, "Strike Rate": 93.5, Centuries: 80, "Highest Score": 254 },
        formTrend: [78, 85, 72, 91, 88, 95, 82, 89, 94, 87],
        milestones: [{ year: 2011, event: "World Cup winner" }, { year: 2023, event: "50th ODI century" }],
        specialData: { scoringZones: { V: 8320, Cover: 5720, "Mid-wicket": 4680, Square: 3120 }, formatBreakdown: { ODI: { matches: 280, avg: 57.7 }, T20I: { matches: 129, avg: 52.0 } }, vsOpposition: [{ team: "Australia", avg: 54.2 }, { team: "England", avg: 48.5 }, { team: "South Africa", avg: 51.0 }, { team: "Pakistan", avg: 62.4 }, { team: "New Zealand", avg: 45.8 }] },
        recentPerformances: [
            { date: "Mar 15, 2024", opponent: "Australia", result: "Win", batting: { runs: 85, balls: 60 }, bowling: { wickets: 0 }, impactScore: "A+" },
            { date: "Mar 10, 2024", opponent: "England", result: "Loss", batting: { runs: 42, balls: 30 }, bowling: { wickets: 0 }, impactScore: "B" },
            { date: "Mar 05, 2024", opponent: "South Africa", result: "Win", batting: { runs: 112, balls: 95 }, bowling: { wickets: 0 }, impactScore: "A++" },
        ],
    },
    {
        id: "rohit", name: "Rohit Sharma", country: "India", countryFlag: "🇮🇳", sport: "cricket",
        role: "Batter", age: 37, image: "RS", photo: "/players/rohit_new.jpg", photo2: "/players/rohit_new.jpg", overallRating: 91,
        attributes: { Batting: 93, Fielding: 78, Running: 75, Temperament: 85, Fitness: 80, Leadership: 88 },
        detailedStats: { Matches: 480, Runs: 18500, Average: 48.7, "Strike Rate": 90.1, Centuries: 52, "Highest Score": 264 },
        formTrend: [82, 75, 88, 85, 92, 80, 76, 84, 88, 90],
        milestones: [{ year: 2013, event: "Double Century (264)" }, { year: 2024, event: "T20 World Cup Captain" }],
        specialData: { scoringZones: { V: 5180, Cover: 3700, "Mid-wicket": 4070 }, formatBreakdown: { ODI: { matches: 260, avg: 49.3 }, T20I: { matches: 159, avg: 32.0 } }, vsOpposition: [{ team: "Australia", avg: 42.5 }, { team: "England", avg: 45.8 }, { team: "South Africa", avg: 38.2 }, { team: "Pakistan", avg: 55.0 }, { team: "Sri Lanka", avg: 58.4 }] },
        recentPerformances: [
            { date: "Mar 15, 2024", opponent: "Australia", result: "Win", batting: { runs: 45, balls: 28 }, bowling: { wickets: 0 }, impactScore: "A" },
            { date: "Mar 10, 2024", opponent: "England", result: "Loss", batting: { runs: 12, balls: 8 }, bowling: { wickets: 0 }, impactScore: "C" },
            { date: "Mar 05, 2024", opponent: "South Africa", result: "Win", batting: { runs: 92, balls: 54 }, bowling: { wickets: 0 }, impactScore: "A+" },
        ],
    },
    {
        id: "bumrah", name: "Jasprit Bumrah", country: "India", countryFlag: "🇮🇳", sport: "cricket",
        role: "Bowler", age: 31, image: "JB", photo: "/players/bumrah_new.png", overallRating: 95,
        attributes: { Pace: 94, Accuracy: 96, Swing: 88, Yorker: 97, Bouncer: 85, Death: 95 },
        detailedStats: { Matches: 180, Wickets: 350, Average: 21.0, Economy: 4.5, "Best Bowling": "6/19", "5W Hauls": 12 },
        formats: {
            All: {
                matchesPlayed: 195,
                batting: { innings: 52, runs: 284, average: '7.8', strikeRate: '85.2', highestScore: '34*', hundreds: 0, fifties: 0, fours: 30, sixes: 10 },
                bowling: { innings: 215, wickets: 397, economy: '4.15', average: '22.8', bestFigures: '6/19' },
                fielding: { catches: 42, stumpings: 0, runouts: 5, total: 47 },
                recentPerformances: [
                    { date: "Mar 15, 2024", opponent: "Australia", result: "Win", matchType: "ODI", batting: { runs: 2, balls: 5 }, bowling: { wickets: 3, economy: 4.2 }, impactScore: "A++" },
                    { date: "Mar 10, 2024", opponent: "England", result: "Loss", matchType: "Test", batting: { runs: 0, balls: 2 }, bowling: { wickets: 1, economy: 5.8 }, impactScore: "B+" },
                    { date: "Mar 05, 2024", opponent: "South Africa", result: "Win", matchType: "T20I", batting: { runs: 5, balls: 10 }, bowling: { wickets: 4, economy: 3.5 }, impactScore: "A++" }
                ],
                awardsList: [
                    { year: 2024, event: "T20 World Cup MVP", title: "World Cup MVP", icon: "🏆" },
                    { year: 2022, event: "Test Bowler of the Year", title: "ICC Award", icon: "🥇" },
                    { year: 2020, event: "IPL Champion", title: "Trophy Winner", icon: "⭐" }
                ],
                wagonWheel: [
                    { runs: 4, direction: "cover" }, { runs: 6, direction: "midwicket" }, { runs: 1, direction: "third-man" }, { runs: 2, direction: "square-leg" }, { runs: 4, direction: "fine-leg" }, { runs: 1, direction: "mid-off" }
                ]
            },
            Test: {
                matchesPlayed: 36,
                batting: { innings: 50, runs: 254, average: '7.4', strikeRate: '54.5', highestScore: '34*', hundreds: 0, fifties: 0, fours: 25, sixes: 6 },
                bowling: { innings: 69, wickets: 159, economy: '2.74', average: '20.5', bestFigures: '6/27' },
                fielding: { catches: 15, stumpings: 0, runouts: 2, total: 17 },
                recentPerformances: [
                    { date: "Feb 20, 2024", opponent: "England", result: "Win", matchType: "Test", batting: { runs: 10, balls: 25 }, bowling: { wickets: 5, economy: 2.5 }, impactScore: "A++" },
                    { date: "Jan 15, 2024", opponent: "South Africa", result: "Loss", matchType: "Test", batting: { runs: 0, balls: 5 }, bowling: { wickets: 2, economy: 3.1 }, impactScore: "B" },
                    { date: "Dec 26, 2023", opponent: "South Africa", result: "Win", matchType: "Test", batting: { runs: 15, balls: 18 }, bowling: { wickets: 6, economy: 2.1 }, impactScore: "S+" }
                ],
                awardsList: [
                    { year: 2022, event: "Test Bowler of the Year", title: "ICC Award", icon: "🥇" },
                    { year: 2021, event: "50 Test Wickets in England", title: "Milestone", icon: "🔥" }
                ],
                wagonWheel: [
                    { runs: 4, direction: "cover" }, { runs: 4, direction: "straight" }, { runs: 1, direction: "point" }, { runs: 2, direction: "midwicket" }
                ]
            },
            ODI: {
                matchesPlayed: 89,
                batting: { innings: 30, runs: 65, average: '4.3', strikeRate: '62.0', highestScore: '16', hundreds: 0, fifties: 0, fours: 3, sixes: 1 },
                bowling: { innings: 89, wickets: 149, economy: '4.67', average: '23.5', bestFigures: '6/19' },
                fielding: { catches: 18, stumpings: 0, runouts: 2, total: 20 },
                recentPerformances: [
                    { date: "Nov 19, 2023", opponent: "Australia", result: "Loss", matchType: "ODI", batting: { runs: 1, balls: 3 }, bowling: { wickets: 2, economy: 4.8 }, impactScore: "B+" },
                    { date: "Nov 15, 2023", opponent: "New Zealand", result: "Win", matchType: "ODI", batting: { runs: 0, balls: 0 }, bowling: { wickets: 1, economy: 6.4 }, impactScore: "B" },
                    { date: "Nov 05, 2023", opponent: "South Africa", result: "Win", matchType: "ODI", batting: { runs: 0, balls: 0 }, bowling: { wickets: 2, economy: 3.5 }, impactScore: "A" }
                ],
                awardsList: [
                    { year: 2023, event: "World Cup Finalist", title: "WC Run", icon: "🥈" },
                    { year: 2019, event: "CWC Team of the Tournament", title: "CWC Team", icon: "🏆" }
                ],
                wagonWheel: [
                    { runs: 1, direction: "third-man" }, { runs: 2, direction: "square-leg" }, { runs: 1, direction: "mid-on" }
                ]
            },
            T20: {
                matchesPlayed: 70,
                batting: { innings: 15, runs: 8, average: '2.0', strikeRate: '50.0', highestScore: '7', hundreds: 0, fifties: 0, fours: 0, sixes: 0 },
                bowling: { innings: 69, wickets: 89, economy: '6.27', average: '17.7', bestFigures: '3/11' },
                fielding: { catches: 15, stumpings: 0, runouts: 2, total: 17 },
                recentPerformances: [
                    { date: "Jun 29, 2024", opponent: "South Africa", result: "Win", matchType: "T20I", batting: { runs: 0, balls: 0 }, bowling: { wickets: 2, economy: 4.5 }, impactScore: "S+" },
                    { date: "Jun 27, 2024", opponent: "England", result: "Win", matchType: "T20I", batting: { runs: 0, balls: 0 }, bowling: { wickets: 2, economy: 3.0 }, impactScore: "A++" },
                    { date: "Jun 24, 2024", opponent: "Australia", result: "Win", matchType: "T20I", batting: { runs: 0, balls: 0 }, bowling: { wickets: 1, economy: 7.2 }, impactScore: "B+" }
                ],
                awardsList: [
                    { year: 2024, event: "T20 World Cup MVP", title: "World Cup MVP", icon: "🏆" },
                    { year: 2024, event: "T20 World Cup Champion", title: "Champion", icon: "🥇" }
                ],
                wagonWheel: [
                    { runs: 1, direction: "mid-off" }, { runs: 1, direction: "straight" }
                ]
            },
            T10: {
                matchesPlayed: 0,
                batting: { innings: 0, runs: 0, average: '0.0', strikeRate: '0.0', highestScore: '0', hundreds: 0, fifties: 0, fours: 0, sixes: 0 },
                bowling: { innings: 0, wickets: 0, economy: '0.00', average: '0.0', bestFigures: '0/0' },
                fielding: { catches: 0, stumpings: 0, runouts: 0, total: 0 },
                recentPerformances: [],
                awardsList: [],
                wagonWheel: []
            }
        },
        formTrend: [90, 88, 95, 92, 85, 97, 93, 91, 96, 94],
        milestones: [{ year: 2024, event: "T20 World Cup MVP" }],
        specialData: { scoringZones: { Yorker: 92, "Good Length": 115, Short: 60 }, formatBreakdown: { Test: { matches: 36, avg: 20.5 }, T20I: { matches: 70, avg: 17.0 } }, vsOpposition: [{ team: "Australia", avg: 22.4 }, { team: "England", avg: 19.8 }, { team: "South Africa", avg: 23.5 }, { team: "Pakistan", avg: 18.2 }, { team: "New Zealand", avg: 20.1 }] },
        recentPerformances: [
            { date: "Mar 15, 2024", opponent: "Australia", result: "Win", batting: { runs: 2, balls: 5 }, bowling: { wickets: 3, economy: 4.2 }, impactScore: "A++" },
            { date: "Mar 10, 2024", opponent: "England", result: "Loss", batting: { runs: 0, balls: 2 }, bowling: { wickets: 1, economy: 5.8 }, impactScore: "B+" },
            { date: "Mar 05, 2024", opponent: "South Africa", result: "Win", batting: { runs: 5, balls: 10 }, bowling: { wickets: 4, economy: 3.5 }, impactScore: "A++" }
        ],
    },
    {
        id: "gill", name: "Shubman Gill", country: "India", countryFlag: "🇮🇳", sport: "cricket",
        role: "Batter", age: 24, image: "SG", overallRating: 88,
        attributes: { Batting: 90, Fielding: 82, Running: 85, Temperament: 80, Fitness: 88, Leadership: 78 },
        detailedStats: { Matches: 80, Runs: 3500, Average: 50.0, "Strike Rate": 88.0, Centuries: 10, "Highest Score": 208 },
        formTrend: [80, 85, 88, 82, 90, 85, 88, 92, 85, 88],
        milestones: [{ year: 2023, event: "Youngest Double Centurion" }],
        specialData: { scoringZones: { V: 1200, Cover: 1000, "Mid-wicket": 800 }, formatBreakdown: { ODI: { matches: 45, avg: 60.5 } }, vsOpposition: [{ team: "Australia", avg: 45.2 }, { team: "England", avg: 42.8 }, { team: "New Zealand", avg: 48.0 }, { team: "South Africa", avg: 35.5 }] },
    },
    {
        id: "hardik", name: "Hardik Pandya", country: "India", countryFlag: "🇮🇳", sport: "cricket",
        role: "All-Rounder", age: 30, image: "HP", overallRating: 89,
        attributes: { Batting: 88, Bowling: 85, Fielding: 90, Fitness: 88, Power: 92 },
        detailedStats: { Matches: 180, Runs: 3800, Wickets: 160, "Strike Rate": 115.0 },
        formTrend: [85, 82, 88, 90, 85, 88, 92, 85, 88, 90],
        milestones: [{ year: 2022, event: "IPL Champion Captain" }],
        specialData: { scoringZones: { V: 800, "Mid-wicket": 1200 }, formatBreakdown: { T20I: { matches: 90, avg: 25.0, sr: 140 } }, vsOpposition: [{ team: "Pakistan", avg: 32.5 }, { team: "Australia", avg: 28.4 }, { team: "England", avg: 24.8 }] },
    },
    {
        id: "jadeja", name: "Ravindra Jadeja", country: "India", countryFlag: "🇮🇳", sport: "cricket",
        role: "All-Rounder", age: 35, image: "RJ", overallRating: 90,
        attributes: { Batting: 85, Bowling: 88, Fielding: 98, Fitness: 95, Accuracy: 90 },
        detailedStats: { Matches: 300, Runs: 6000, Wickets: 500, Economy: 4.8 },
        formTrend: [82, 85, 80, 88, 90, 85, 88, 82, 85, 88],
        milestones: [{ year: 2013, event: "Champions Trophy Winner" }],
        specialData: { scoringZones: { V: 1500, Square: 1200 }, formatBreakdown: { Test: { matches: 70, wickets: 290, avg: 24.0 } }, vsOpposition: [{ team: "Australia", avg: 28.5 }, { team: "England", avg: 25.2 }, { team: "South Africa", avg: 22.8 }, { team: "New Zealand", avg: 24.5 }] },
    },
    {
        id: "klrahul", name: "KL Rahul", country: "India", countryFlag: "🇮🇳", sport: "cricket",
        role: "Wicketkeeper", age: 32, image: "KR", overallRating: 87,
        attributes: { Batting: 88, Keeping: 84, Temperament: 82, Fitness: 80, Technique: 86 },
        detailedStats: { Matches: 220, Runs: 8500, Average: 40.5, Centuries: 18, "Highest Score": 199 },
        formTrend: [80, 82, 78, 85, 82, 80, 85, 78, 82, 80],
        milestones: [{ year: 2014, event: "Test debut century" }],
        specialData: { scoringZones: { Cover: 2500, V: 2000 }, formatBreakdown: { Test: { avg: 35.0 }, ODI: { avg: 42.0 } } },
    },
    {
        id: "pant", name: "Rishabh Pant", country: "India", countryFlag: "🇮🇳", sport: "cricket",
        role: "Wicketkeeper", age: 27, image: "RP", overallRating: 90,
        attributes: { Batting: 91, Power: 95, Innovation: 94, Keeping: 82, Aggression: 96 },
        detailedStats: { Matches: 120, Runs: 4500, Average: 44.0, "Strike Rate": 108.0, Centuries: 9 },
        formTrend: [85, 90, 88, 92, 85, 88, 90, 85, 92, 88],
        milestones: [{ year: 2021, event: "Gabba Test winning knock" }, { year: 2023, event: "Fastest Indian Test 150" }],
        specialData: { scoringZones: { V: 1500, "Mid-wicket": 1200 }, formatBreakdown: { Test: { avg: 44.0, sr: 70 } } },
    },
    {
        id: "kuldeep", name: "Kuldeep Yadav", country: "India", countryFlag: "🇮🇳", sport: "cricket",
        role: "Bowler", age: 29, image: "KY", overallRating: 87,
        attributes: { Spin: 94, Accuracy: 88, Variation: 92, Guile: 90, Flight: 88 },
        detailedStats: { Matches: 120, Wickets: 180, Average: 25.0, Economy: 5.2, "Best Bowling": "5/25" },
        formTrend: [82, 85, 88, 90, 85, 88, 82, 85, 88, 85],
        milestones: [{ year: 2024, event: "World Cup leading wicket-taker" }],
        specialData: { scoringZones: { Spin: 80, Flight: 60 }, formatBreakdown: { ODI: { wickets: 85, avg: 24.0 } } },
    },
    {
        id: "siraj", name: "Mohammed Siraj", country: "India", countryFlag: "🇮🇳", sport: "cricket",
        role: "Bowler", age: 30, image: "MSi", overallRating: 86,
        attributes: { Pace: 90, Swing: 88, Accuracy: 85, Yorker: 82, Bouncer: 80 },
        detailedStats: { Matches: 80, Wickets: 140, Average: 26.0, Economy: 5.4 },
        formTrend: [82, 85, 80, 88, 85, 82, 85, 80, 82, 85],
        milestones: [{ year: 2021, event: "5-wicket haul at Gabba" }],
        specialData: { scoringZones: { "Good Length": 60, Full: 40 }, formatBreakdown: { ODI: { wickets: 65 } } },
    },
    {
        id: "surya", name: "Suryakumar Yadav", country: "India", countryFlag: "🇮🇳", sport: "cricket",
        role: "Batter", age: 33, image: "SY", overallRating: 89,
        attributes: { Batting: 90, Power: 92, Innovation: 96, "360 Play": 98, Fitness: 82 },
        detailedStats: { Matches: 100, Runs: 3200, "Strike Rate": 168.0, Centuries: 5, "Highest Score": 117 },
        formTrend: [88, 90, 92, 85, 90, 88, 92, 85, 88, 90],
        milestones: [{ year: 2022, event: "ICC T20I Cricketer of Year" }, { year: 2024, event: "T20I Captain" }],
        specialData: { scoringZones: { "Mid-wicket": 1200, Square: 1000, V: 800 }, formatBreakdown: { T20I: { avg: 42.0, sr: 168 } } },
    },

    // ─── AUSTRALIA ───
    {
        id: "cr4", name: "Pat Cummins", country: "Australia", countryFlag: "🇦🇺", sport: "cricket",
        role: "Bowler", age: 31, image: "PC", overallRating: 93,
        attributes: { Pace: 90, Accuracy: 92, Swing: 85, Yorker: 82, Bouncer: 94, Death: 88 },
        detailedStats: { Matches: 150, Wickets: 280, Average: 24.5, Economy: 4.8 },
        formTrend: [84, 90, 88, 92, 86, 94, 91, 85, 88, 90],
        milestones: [{ year: 2023, event: "WTC & World Cup Winning Captain" }],
        specialData: { scoringZones: { "Good Length": 95, Short: 62 }, formatBreakdown: { Test: { matches: 62, wickets: 260 } }, vsOpposition: [{ team: "India", avg: 24.5 }, { team: "England", avg: 21.8 }, { team: "South Africa", avg: 25.2 }, { team: "Pakistan", avg: 22.8 }] },
    },
    {
        id: "head", name: "Travis Head", country: "Australia", countryFlag: "🇦🇺", sport: "cricket",
        role: "Batter", age: 30, image: "TH", overallRating: 90,
        attributes: { Batting: 92, Fielding: 80, Running: 82, Temperament: 88, Power: 90 },
        detailedStats: { Matches: 120, Runs: 5500, Average: 42.0, "Strike Rate": 105.0, Centuries: 10 },
        formTrend: [88, 92, 85, 95, 90, 88, 92, 85, 90, 88],
        milestones: [{ year: 2023, event: "WTC Final MOTM" }, { year: 2023, event: "World Cup Final Century" }],
        specialData: { scoringZones: { "Mid-wicket": 1500, Square: 1200 }, formatBreakdown: { ODI: { matches: 65, avg: 45.0, sr: 110 } }, vsOpposition: [{ team: "India", avg: 55.4 }, { team: "England", avg: 42.8 }, { team: "South Africa", avg: 38.5 }, { team: "New Zealand", avg: 44.2 }] },
    },
    {
        id: "warner", name: "David Warner", country: "Australia", countryFlag: "🇦🇺", sport: "cricket",
        role: "Batter", age: 37, image: "DW", overallRating: 88,
        attributes: { Batting: 90, Fielding: 85, Running: 88, Power: 92 },
        detailedStats: { Matches: 350, Runs: 18000, Average: 45.0, Centuries: 49 },
        formTrend: [80, 85, 82, 88, 85, 82, 85, 80, 82, 85],
        milestones: [{ year: 2015, event: "2x World Cup Winner (2015 & 2023)" }],
        specialData: { scoringZones: { Square: 5000, Cover: 4000 }, formatBreakdown: { ODI: { matches: 161, runs: 6932 } } },
    },
    {
        id: "smith", name: "Steve Smith", country: "Australia", countryFlag: "🇦🇺", sport: "cricket",
        role: "Batter", age: 35, image: "SS", overallRating: 92,
        attributes: { Batting: 94, Temperament: 96, Technique: 98 },
        detailedStats: { Matches: 300, Runs: 16200, Average: 58.0, Centuries: 44 },
        formTrend: [85, 88, 82, 90, 85, 88, 92, 85, 88, 90],
        milestones: [{ year: 2019, event: "Ashes 774 Runs" }],
        specialData: { scoringZones: { "Mid-wicket": 4000, Fine: 3000 }, formatBreakdown: { Test: { matches: 109, avg: 57.0 } } },
    },
    {
        id: "maxwell", name: "Glenn Maxwell", country: "Australia", countryFlag: "🇦🇺", sport: "cricket",
        role: "All-Rounder", age: 35, image: "GM", overallRating: 88,
        attributes: { Batting: 88, Power: 98, Fielding: 95, Innovation: 99 },
        detailedStats: { Matches: 250, Runs: 6000, "Strike Rate": 150.0, Wickets: 70 },
        formTrend: [82, 85, 95, 80, 88, 85, 90, 82, 85, 88],
        milestones: [{ year: 2023, event: "Double Century vs Afghanistan" }],
        specialData: { scoringZones: { "Reverse": 1000, "Mid-wicket": 2000 }, formatBreakdown: { ODI: { sr: 125.0 } } },
    },
    {
        id: "starc", name: "Mitchell Starc", country: "Australia", countryFlag: "🇦🇺", sport: "cricket",
        role: "Bowler", age: 34, image: "MS", overallRating: 91,
        attributes: { Pace: 95, Swing: 92, Yorker: 95, Death: 90 },
        detailedStats: { Matches: 220, Wickets: 400, Economy: 5.2 },
        formTrend: [85, 88, 90, 82, 85, 88, 92, 85, 88, 90],
        milestones: [{ year: 2015, event: "World Cup Leading Wicket Taker (2015 & 2019)" }],
        specialData: { scoringZones: { Yorker: 150, "Good Length": 120 }, formatBreakdown: { ODI: { wickets: 236 } } },
    },
    {
        id: "marnus", name: "Marnus Labuschagne", country: "Australia", countryFlag: "🇦🇺", sport: "cricket",
        role: "Batter", age: 30, image: "ML", overallRating: 89,
        attributes: { Batting: 90, Technique: 92, Consistency: 88, Temperament: 86 },
        detailedStats: { Matches: 120, Runs: 6500, Average: 52.0, Centuries: 14 },
        formTrend: [85, 88, 82, 90, 85, 88, 92, 85, 88, 90],
        milestones: [{ year: 2019, event: "Ashes breakthrough series" }],
        specialData: { scoringZones: { Cover: 2000, V: 1800 }, formatBreakdown: { Test: { avg: 53.0, matches: 45 } } },
    },
    {
        id: "hazlewood", name: "Josh Hazlewood", country: "Australia", countryFlag: "🇦🇺", sport: "cricket",
        role: "Bowler", age: 33, image: "JH", overallRating: 90,
        attributes: { Pace: 88, Accuracy: 95, Swing: 90, Seam: 92 },
        detailedStats: { Matches: 180, Wickets: 320, Average: 24.0, Economy: 4.6 },
        formTrend: [85, 88, 90, 85, 88, 85, 88, 82, 85, 88],
        milestones: [{ year: 2015, event: "World Cup winner" }],
        specialData: { scoringZones: { "Good Length": 140, Full: 80 }, formatBreakdown: { Test: { wickets: 220, avg: 25.0 } } },
    },
    {
        id: "carey", name: "Alex Carey", country: "Australia", countryFlag: "🇦🇺", sport: "cricket",
        role: "Wicketkeeper", age: 33, image: "AC", overallRating: 85,
        attributes: { Batting: 82, Keeping: 88, Grit: 85, Fitness: 86 },
        detailedStats: { Matches: 100, Runs: 3000, Average: 32.0, Dismissals: 180 },
        formTrend: [80, 82, 85, 80, 82, 85, 80, 82, 85, 80],
        milestones: [{ year: 2023, event: "Ashes keeping record" }],
        specialData: { scoringZones: { V: 800, Square: 700 }, formatBreakdown: { Test: { matches: 30 } } },
    },
    {
        id: "cgreen", name: "Cameron Green", country: "Australia", countryFlag: "🇦🇺", sport: "cricket",
        role: "All-Rounder", age: 25, image: "CG", overallRating: 86,
        attributes: { Batting: 84, Bowling: 82, Fielding: 85, Potential: 92 },
        detailedStats: { Matches: 60, Runs: 2000, Wickets: 50 },
        formTrend: [82, 85, 88, 82, 85, 82, 85, 80, 82, 85],
        milestones: [{ year: 2021, event: "Test debut century" }],
        specialData: { scoringZones: { V: 600, Cover: 500 }, formatBreakdown: { Test: { avg: 35.0 } } },
    },
    {
        id: "zampa", name: "Adam Zampa", country: "Australia", countryFlag: "🇦🇺", sport: "cricket",
        role: "Bowler", age: 32, image: "AZ", overallRating: 87,
        attributes: { Spin: 90, Accuracy: 88, Variation: 86, Death: 82 },
        detailedStats: { Matches: 150, Wickets: 200, Economy: 5.8, Average: 28.0 },
        formTrend: [82, 85, 88, 85, 82, 85, 88, 82, 85, 88],
        milestones: [{ year: 2023, event: "World Cup winning squad" }],
        specialData: { scoringZones: { Spin: 90, Flight: 50 }, formatBreakdown: { ODI: { wickets: 100 } } },
    },

    {
        id: "cr5", name: "Joe Root", country: "England", countryFlag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", sport: "cricket",
        role: "Batter", age: 34, image: "JR", overallRating: 90,
        attributes: { Batting: 92, Temperament: 90, Technique: 94 },
        detailedStats: { Matches: 320, Runs: 19000, Average: 48.5, Centuries: 46 },
        formTrend: [85, 88, 92, 95, 90, 88, 92, 85, 90, 88],
        milestones: [{ year: 2021, event: "England's Top Test Run Scorer" }],
        specialData: { scoringZones: { "Third Man": 2000, Cover: 5000 }, formatBreakdown: { Test: { matches: 140, avg: 50.0 } } },
    },
    {
        id: "stokes", name: "Ben Stokes", country: "England", countryFlag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", sport: "cricket",
        role: "All-Rounder", age: 33, image: "BS", overallRating: 91,
        attributes: { Batting: 88, Bowling: 85, Leadership: 95, Clutch: 99 },
        detailedStats: { Matches: 250, Runs: 9000, Wickets: 200 },
        formTrend: [80, 85, 88, 90, 85, 82, 85, 80, 82, 85],
        milestones: [{ year: 2019, event: "World Cup Final MOTM" }, { year: 2019, event: "Headingley Heroics" }],
        specialData: { scoringZones: { "Mid-wicket": 3000, V: 2000 }, formatBreakdown: { Test: { matches: 100 } } },
    },
    {
        id: "buttler", name: "Jos Buttler", country: "England", countryFlag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", sport: "cricket",
        role: "Wicketkeeper", age: 33, image: "JBu", overallRating: 92,
        attributes: { Batting: 94, Power: 95, Innovation: 96, Keeping: 88, Leadership: 85 },
        detailedStats: { Matches: 280, Runs: 10000, "Strike Rate": 118.0, Centuries: 15 },
        formTrend: [85, 88, 92, 90, 85, 88, 92, 85, 88, 90],
        milestones: [{ year: 2022, event: "T20 World Cup Winning Captain" }],
        specialData: { scoringZones: { Square: 3000, V: 4000 }, formatBreakdown: { ODI: { sr: 118 }, T20I: { sr: 144 } } },
    },
    {
        id: "bairstow", name: "Jonny Bairstow", country: "England", countryFlag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", sport: "cricket",
        role: "Batter", age: 35, image: "JBa", overallRating: 87,
        attributes: { Batting: 88, Power: 90, Fielding: 85 },
        detailedStats: { Matches: 200, Runs: 8000, "Strike Rate": 105.0 },
        formTrend: [80, 85, 82, 88, 85, 82, 85, 80, 82, 85],
        milestones: [{ year: 2016, event: "Maiden Test Century" }],
        specialData: { scoringZones: { V: 3000, Cover: 2000 }, formatBreakdown: { ODI: { avg: 45.0, sr: 104 } } },
    },

    // ─── NEW ZEALAND ───
    {
        id: "kane", name: "Kane Williamson", country: "New Zealand", countryFlag: "🇳🇿", sport: "cricket",
        role: "Batter", age: 34, image: "KW", overallRating: 91,
        attributes: { Batting: 93, Temperament: 96, Leadership: 94 },
        detailedStats: { Matches: 330, Runs: 17500, Average: 48.0, Centuries: 45 },
        formTrend: [85, 82, 88, 85, 90, 85, 88, 82, 85, 88],
        milestones: [{ year: 2021, event: "WTC Winning Captain" }],
        specialData: { scoringZones: { "Third Man": 1500, Cover: 4000 }, formatBreakdown: { Test: { avg: 55.0 } } },
    },
    {
        id: "boult", name: "Trent Boult", country: "New Zealand", countryFlag: "🇳🇿", sport: "cricket",
        role: "Bowler", age: 35, image: "TB", overallRating: 90,
        attributes: { Pace: 88, Swing: 96, Accuracy: 90 },
        detailedStats: { Matches: 220, Wickets: 350, Economy: 4.9 },
        formTrend: [85, 88, 85, 90, 85, 88, 92, 85, 88, 90],
        milestones: [{ year: 2015, event: "2x World Cup Finalist (2015 & 2019)" }],
        specialData: { scoringZones: { Full: 100, Swing: 150 }, formatBreakdown: { ODI: { wickets: 200 } } },
    },
    {
        id: "conway", name: "Devon Conway", country: "New Zealand", countryFlag: "🇳🇿", sport: "cricket",
        role: "Batter", age: 32, image: "DC", overallRating: 88,
        attributes: { Batting: 88, Technique: 90, Consistency: 88 },
        detailedStats: { Matches: 80, Runs: 4000, Average: 45.0 },
        formTrend: [85, 88, 90, 85, 88, 85, 88, 82, 85, 88],
        milestones: [{ year: 2021, event: "Double century on Test debut" }],
        specialData: { scoringZones: { Cover: 1200, Square: 1000 }, formatBreakdown: { Test: { avg: 50.0 } } },
    },
    {
        id: "ravindra", name: "Rachin Ravindra", country: "New Zealand", countryFlag: "🇳🇿", sport: "cricket",
        role: "All-Rounder", age: 24, image: "RR", overallRating: 86,
        attributes: { Batting: 86, Bowling: 80, Potential: 92 },
        detailedStats: { Matches: 40, Runs: 1500, Centuries: 3 },
        formTrend: [88, 90, 85, 92, 88, 85, 88, 82, 85, 88],
        milestones: [{ year: 2023, event: "World Cup 3 Centuries" }],
        specialData: { scoringZones: { V: 500, Cover: 400 }, formatBreakdown: { ODI: { avg: 42.0 } } },
    },

    // ─── PAKISTAN ───
    {
        id: "babar", name: "Babar Azam", country: "Pakistan", countryFlag: "🇵🇰", sport: "cricket",
        role: "Batter", age: 30, image: "BA", overallRating: 93,
        attributes: { Batting: 95, Technique: 94, Consistency: 92 },
        detailedStats: { Matches: 280, Runs: 13500, Average: 50.8, Centuries: 31 },
        formTrend: [88, 90, 85, 88, 85, 82, 85, 80, 82, 85],
        milestones: [{ year: 2022, event: "Cricketer of the Year" }],
        specialData: { scoringZones: { Cover: 4000, "Mid-wicket": 3000 }, formatBreakdown: { ODI: { avg: 56.5 } }, vsOpposition: [{ team: "India", avg: 48.5 }, { team: "Australia", avg: 42.8 }, { team: "England", avg: 45.2 }, { team: "South Africa", avg: 38.5 }, { team: "New Zealand", avg: 44.2 }] },
    },
    {
        id: "rizwan", name: "Mohammad Rizwan", country: "Pakistan", countryFlag: "🇵🇰", sport: "cricket",
        role: "Wicketkeeper", age: 31, image: "MR", overallRating: 90,
        attributes: { Batting: 88, Keeping: 90, Fitness: 95, Grit: 94 },
        detailedStats: { Matches: 200, Runs: 7000, Average: 42.0 },
        formTrend: [85, 88, 90, 85, 88, 85, 88, 82, 85, 88],
        milestones: [{ year: 2021, event: "Most T20I runs in a year" }],
        specialData: { scoringZones: { Square: 2500, Fine: 1500 }, formatBreakdown: { T20I: { avg: 48.0 } } },
    },
    {
        id: "shaheen", name: "Shaheen Afridi", country: "Pakistan", countryFlag: "🇵🇰", sport: "cricket",
        role: "Bowler", age: 24, image: "SA", overallRating: 92,
        attributes: { Pace: 93, Swing: 90, Yorker: 86, Death: 84 },
        detailedStats: { Matches: 140, Wickets: 280, Average: 23.5 },
        formTrend: [85, 88, 90, 85, 88, 85, 88, 82, 85, 88],
        milestones: [{ year: 2021, event: "T20 World Cup spell vs India" }],
        specialData: { scoringZones: { Yorker: 100, Full: 80 }, formatBreakdown: { T20I: { wickets: 64 } } },
    },
    {
        id: "rauf", name: "Haris Rauf", country: "Pakistan", countryFlag: "🇵🇰", sport: "cricket",
        role: "Bowler", age: 30, image: "HR", overallRating: 88,
        attributes: { Pace: 95, Death: 90, Aggression: 88 },
        detailedStats: { Matches: 100, Wickets: 150, Economy: 8.5 },
        formTrend: [80, 85, 82, 88, 85, 82, 85, 80, 82, 85],
        milestones: [{ year: 2020, event: "BBL breakout season" }],
        specialData: { scoringZones: { Short: 80, Yorker: 60 }, formatBreakdown: { T20I: { wickets: 90 } } },
    },

    // ─── SOUTH AFRICA ───
    {
        id: "rabada", name: "Kagiso Rabada", country: "South Africa", countryFlag: "🇿🇦", sport: "cricket",
        role: "Bowler", age: 29, image: "KR", overallRating: 91,
        attributes: { Pace: 92, Accuracy: 90, Swing: 82, Bouncer: 91 },
        detailedStats: { Matches: 200, Wickets: 380, Average: 22.5 },
        formTrend: [88, 90, 85, 88, 85, 82, 85, 80, 82, 85],
        milestones: [{ year: 2018, event: "No.1 ICC Test Bowler" }],
        specialData: { scoringZones: { "Good Length": 150, Bouncer: 60 }, formatBreakdown: { Test: { wickets: 291 } }, vsOpposition: [{ team: "India", avg: 24.5 }, { team: "Australia", avg: 21.8 }, { team: "England", avg: 22.2 }, { team: "Pakistan", avg: 25.5 }] },
    },
    {
        id: "dekock", name: "Quinton de Kock", country: "South Africa", countryFlag: "🇿🇦", sport: "cricket",
        role: "Wicketkeeper", age: 31, image: "QdK", overallRating: 90,
        attributes: { Batting: 92, Keeping: 90, Power: 88, Innovation: 85 },
        detailedStats: { Matches: 280, Runs: 11000, Centuries: 24 },
        formTrend: [85, 88, 90, 85, 88, 85, 88, 82, 85, 88],
        milestones: [{ year: 2017, event: "Fastest SA to 1000 ODI runs" }],
        specialData: { scoringZones: { Square: 3000, V: 3500 }, formatBreakdown: { ODI: { centuries: 21 } } },
    },
    {
        id: "hklaasen", name: "Heinrich Klaasen", country: "South Africa", countryFlag: "🇿🇦", sport: "cricket",
        role: "Wicketkeeper", age: 32, image: "HK", overallRating: 89,
        attributes: { Batting: 90, Power: 96, SpinPlaying: 98 },
        detailedStats: { Matches: 100, Runs: 3000, "Strike Rate": 150.0 },
        formTrend: [90, 92, 95, 88, 90, 85, 88, 82, 85, 88],
        milestones: [{ year: 2023, event: "World Cup 174 off 83" }],
        specialData: { scoringZones: { V: 1000, "Mid-wicket": 1500 }, formatBreakdown: { ODI: { sr: 115 } } },
    },
    {
        id: "miller", name: "David Miller", country: "South Africa", countryFlag: "🇿🇦", sport: "cricket",
        role: "Batter", age: 34, image: "DM", overallRating: 88,
        attributes: { Batting: 86, Power: 92, Finishing: 94 },
        detailedStats: { Matches: 250, Runs: 8000, Average: 42.0 },
        formTrend: [85, 82, 88, 85, 88, 85, 88, 82, 85, 88],
        milestones: [{ year: 2014, event: "Fastest T20I century (35 balls)" }],
        specialData: { scoringZones: { V: 2000, "Mid-wicket": 2500 }, formatBreakdown: { T20I: { matches: 116 } } },
    },
    {
        id: "jansen", name: "Marco Jansen", country: "South Africa", countryFlag: "🇿🇦", sport: "cricket",
        role: "All-Rounder", age: 24, image: "MJ", overallRating: 86,
        attributes: { Bowling: 88, Batting: 80, Bouncer: 90 },
        detailedStats: { Matches: 40, Wickets: 85, Runs: 800 },
        formTrend: [82, 85, 88, 85, 88, 85, 88, 82, 85, 88],
        milestones: [{ year: 2022, event: "Test debut 7-wicket haul" }],
        specialData: { scoringZones: { Bouncer: 40 }, formatBreakdown: { ODI: { wickets: 35 } } },
    },
];

// ─── FOOTBALL PLAYERS ────────────────────────────────────────────
const footballPlayers: AnalysisPlayer[] = [
    {
        id: "fb1", name: "Kylian Mbappé", country: "France", countryFlag: "🇫🇷", sport: "football",
        role: "Forward", age: 26, image: "/images/players/mbappe_headshot.png", photo: "/images/players/mbappe_headshot.png", overallRating: 96,
        attributes: { Pace: 98, Shooting: 92, Dribbling: 93, Passing: 80, Physical: 78, Vision: 85 },
        detailedStats: { Goals: 248, Assists: 92, Appearances: 340, "Goals/90": 0.72, "Shots/90": 3.4, "xG": 38.2, "Key Passes/90": 2.1, "Dribbles/90": 3.4 },
        formTrend: [88, 92, 85, 95, 90, 87, 93, 96, 91, 89],
        milestones: [
            { year: 2017, event: "Ligue 1 title with Monaco at 18" },
            { year: 2018, event: "FIFA World Cup winner", title: "World Champion", icon: "🏆" },
            { year: 2022, event: "World Cup Final hat-trick", title: "Golden Boot", icon: "⚽" },
            { year: 2024, event: "Signed for Real Madrid", title: "Galactico", icon: "⭐" },
            { year: 2024, event: "Ligue 1 All-time top scorer for PSG", title: "Legend Status", icon: "👑" },
        ],
        specialData: {
            shootingZones: { "Inside Box": 65, "Outside Box": 20, "Penalty": 15 },
            seasonGoals: [{ season: "20/21", goals: 42 }, { season: "21/22", goals: 39 }, { season: "22/23", goals: 41 }, { season: "23/24", goals: 44 }, { season: "24/25", goals: 32 }],
            positionHeatmap: [[0, 0, 0], [1, 2, 1], [3, 5, 4], [5, 8, 7]],
        },
        recentPerformances: [
            { date: "Mar 18, 2024", opponent: "Barcelona", result: "Win", stats: { goals: 2, assists: 1, shots: 5, passes: 42 }, impactScore: "9.5" },
            { date: "Mar 12, 2024", opponent: "Atletico", result: "Win", stats: { goals: 1, assists: 0, shots: 3, passes: 38 }, impactScore: "8.2" },
            { date: "Mar 05, 2024", opponent: "Real Sociedad", result: "Win", stats: { goals: 2, assists: 1, shots: 6, passes: 45 }, impactScore: "9.8" },
        ],
    },
    {
        id: "fb2", name: "Erling Haaland", country: "Norway", countryFlag: "🇳🇴", sport: "football",
        role: "Striker", age: 24, image: "/images/players/haaland_headshot.png", photo: "/images/players/haaland_headshot.png", overallRating: 97,
        attributes: { Pace: 89, Shooting: 96, Dribbling: 78, Passing: 65, Physical: 95, Vision: 72 },
        detailedStats: { Goals: 280, Assists: 52, Appearances: 300, "Goals/90": 0.92, "Shots/90": 4.1, "xG": 45.1, "Key Passes/90": 1.1, "Dribbles/90": 0.8 },
        formTrend: [92, 95, 88, 97, 90, 93, 96, 85, 94, 91],
        milestones: [
            { year: 2020, event: "Champions League debut hat-trick" },
            { year: 2022, event: "Signed for Manchester City" },
            { year: 2023, event: "Premier League treble winner", title: "Treble Winner", icon: "🏆" },
            { year: 2023, event: "Premier League Golden Boot (36 goals)", title: "Record Breaker", icon: "🔥" },
            { year: 2024, event: "Back-to-back PL Champion", title: "Champion", icon: "🥇" },
        ],
        specialData: {
            shootingZones: { "Inside Box": 78, "Outside Box": 8, "Penalty": 14 },
            seasonGoals: [{ season: "20/21", goals: 41 }, { season: "21/22", goals: 29 }, { season: "22/23", goals: 52 }, { season: "23/24", goals: 38 }, { season: "24/25", goals: 36 }],
            positionHeatmap: [[0, 0, 0], [0, 1, 0], [1, 4, 1], [3, 9, 3]],
        },
        recentPerformances: [
            { date: "Mar 18, 2024", opponent: "Arsenal", result: "Win", stats: { goals: 1, assists: 0, shots: 4, passes: 12 }, impactScore: "7.8" },
            { date: "Mar 12, 2024", opponent: "Liverpool", result: "Draw", stats: { goals: 0, assists: 0, shots: 2, passes: 10 }, impactScore: "6.5" },
            { date: "Mar 05, 2024", opponent: "Man Utd", result: "Win", stats: { goals: 3, assists: 0, shots: 7, passes: 15 }, impactScore: "10.0" },
        ],
    },
    {
        id: "messi", name: "Lionel Messi", country: "Argentina", countryFlag: "🇦🇷", sport: "football",
        role: "Forward", age: 37, image: "LM", photo: "/images/players/messi_new.png", overallRating: 98,
        attributes: { Pace: 78, Shooting: 92, Dribbling: 96, Passing: 93, Physical: 65, Vision: 98 },
        detailedStats: { Goals: 835, Assists: 380, Appearances: 1050, "Goals/90": 0.79, "Shots/90": 3.2, "xG": 22.4, "Key Passes/90": 3.2, "Dribbles/90": 2.9 },
        formTrend: [88, 82, 90, 85, 78, 92, 80, 86, 84, 88],
        milestones: [
            { year: 2005, event: "Youngest La Liga scorer" },
            { year: 2012, event: "91 goals in a calendar year", title: "World Record", icon: "🌎" },
            { year: 2021, event: "Copa América winner", title: "Continental Champ", icon: "🏆" },
            { year: 2022, event: "FIFA World Cup winner", title: "World Champion", icon: "👑" },
            { year: 2023, event: "8th Ballon d'Or", title: "Ballon d'Or", icon: "💎" },
            { year: 2024, event: "45 Career Trophies", title: "GOAT Status", icon: "🐐" },
        ],
        specialData: {
            shootingZones: { "Inside Box": 58, "Outside Box": 28, "Penalty": 14 },
            seasonGoals: [{ season: "20/21", goals: 38 }, { season: "21/22", goals: 11 }, { season: "22/23", goals: 21 }, { season: "23/24", goals: 25 }, { season: "24/25", goals: 12 }],
            positionHeatmap: [[0, 0, 0], [1, 3, 2], [3, 6, 5], [2, 7, 4]],
        },
        recentPerformances: [
            { date: "Mar 18, 2024", opponent: "LA Galaxy", result: "Win", stats: { goals: 1, assists: 2, shots: 3, passes: 65 }, impactScore: "9.2" },
            { date: "Mar 12, 2024", opponent: "Orlando City", result: "Win", stats: { goals: 2, assists: 0, shots: 5, passes: 58 }, impactScore: "9.0" },
            { date: "Mar 05, 2024", opponent: "Nashville", result: "Win", stats: { goals: 1, assists: 1, shots: 4, passes: 62 }, impactScore: "8.8" },
        ],
    },
    {
        id: "fb4", name: "Jude Bellingham", country: "England", countryFlag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", sport: "football",
        role: "Midfielder", age: 21, image: "JB", overallRating: 92,
        attributes: { Pace: 82, Shooting: 85, Dribbling: 87, Passing: 88, Physical: 84, Vision: 90 },
        detailedStats: { Goals: 65, Assists: 48, Appearances: 220, "Goals/90": 0.32, "Shots/90": 2.4, "xG": 18.9, "Key Passes/90": 2.4, "Dribbles/90": 2.1 },
        formTrend: [85, 92, 94, 88, 95, 90, 87, 93, 96, 91],
        milestones: [
            { year: 2020, event: "Youngest BVB scorer at 17" },
            { year: 2023, event: "Signed for Real Madrid" },
            { year: 2024, event: "La Liga Best Player" },
        ],
        specialData: {
            shootingZones: { "Inside Box": 52, "Outside Box": 35, "Penalty": 13 },
            seasonGoals: [{ season: "21/22", goals: 6 }, { season: "22/23", goals: 14 }, { season: "23/24", goals: 23 }, { season: "24/25", goals: 18 }],
            positionHeatmap: [[0, 1, 0], [2, 5, 2], [3, 7, 4], [1, 4, 2]],
        },
    },
    {
        id: "fb5", name: "Vinicius Jr", country: "Brazil", countryFlag: "🇧🇷", sport: "football",
        role: "Winger", age: 24, image: "VJ", overallRating: 93,
        attributes: { Pace: 96, Shooting: 84, Dribbling: 95, Passing: 78, Physical: 72, Vision: 82 },
        detailedStats: { Goals: 95, Assists: 72, Appearances: 250, "Goals/90": 0.40, "Shots/90": 2.6, "xG": 28.5, "Key Passes/90": 2.6, "Dribbles/90": 4.2 },
        formTrend: [80, 88, 92, 85, 95, 90, 87, 93, 88, 91],
        milestones: [
            { year: 2018, event: "Signed for Real Madrid at 18" },
            { year: 2022, event: "Champions League Final goal" },
            { year: 2024, event: "Ballon d'Or nominee" },
        ],
        specialData: {
            shootingZones: { "Inside Box": 60, "Outside Box": 28, "Penalty": 12 },
            seasonGoals: [{ season: "21/22", goals: 22 }, { season: "22/23", goals: 23 }, { season: "23/24", goals: 24 }, { season: "24/25", goals: 20 }],
            positionHeatmap: [[0, 0, 0], [3, 1, 0], [6, 3, 1], [8, 4, 1]],
        },
    },
    {
        id: "fb6", name: "Cristiano Ronaldo", country: "Portugal", countryFlag: "🇵🇹", sport: "football",
        role: "Forward", age: 40, image: "CR", overallRating: 91,
        attributes: { Pace: 75, Shooting: 94, Dribbling: 82, Passing: 78, Physical: 80, Vision: 82 },
        detailedStats: { Goals: 920, Assists: 240, Appearances: 1200, "Goals/90": 0.76, "Shots/90": 4.5, "xG": 18.5, "Key Passes/90": 1.5, "Dribbles/90": 1.2 },
        formTrend: [75, 80, 72, 85, 78, 82, 70, 78, 74, 80],
        milestones: [{ year: 2003, event: "Signed for Manchester United" }, { year: 2008, event: "First Ballon d'Or" }, { year: 2016, event: "Euro 2016 winner with Portugal" }, { year: 2023, event: "900th career goal" }],
        specialData: { shootingZones: { "Inside Box": 68, "Outside Box": 18, "Penalty": 14 }, seasonGoals: [{ season: "20/21", goals: 36 }, { season: "21/22", goals: 24 }, { season: "22/23", goals: 14 }, { season: "23/24", goals: 50 }, { season: "24/25", goals: 18 }], positionHeatmap: [[0, 0, 0], [0, 1, 0], [2, 5, 2], [4, 9, 4]] },
    },
    {
        id: "fb7", name: "Kevin De Bruyne", country: "Belgium", countryFlag: "🇧🇪", sport: "football",
        role: "Midfielder", age: 33, image: "KD", overallRating: 92,
        attributes: { Pace: 76, Shooting: 86, Dribbling: 85, Passing: 96, Physical: 78, Vision: 98 },
        detailedStats: { Goals: 102, Assists: 195, Appearances: 450, "Goals/90": 0.24, "Shots/90": 2.1, "xG": 22.5, "Key Passes/90": 3.8, "Dribbles/90": 1.8 },
        formTrend: [88, 85, 78, 82, 75, 80, 85, 78, 82, 80],
        milestones: [{ year: 2015, event: "Signed for Manchester City" }, { year: 2020, event: "PFA Player of the Year" }, { year: 2023, event: "Treble winner with City" }],
        specialData: { shootingZones: { "Inside Box": 42, "Outside Box": 45, "Penalty": 13 }, seasonGoals: [{ season: "20/21", goals: 10 }, { season: "21/22", goals: 15 }, { season: "22/23", goals: 7 }, { season: "23/24", goals: 6 }, { season: "24/25", goals: 5 }], positionHeatmap: [[0, 1, 0], [2, 6, 2], [3, 8, 3], [1, 3, 1]] },
    },
    {
        id: "fb8", name: "Virgil van Dijk", country: "Netherlands", countryFlag: "🇳🇱", sport: "football",
        role: "Defender", age: 33, image: "VD", overallRating: 90,
        attributes: { Pace: 78, Shooting: 55, Dribbling: 65, Passing: 82, Physical: 95, Vision: 80 },
        detailedStats: { Goals: 32, Assists: 18, Appearances: 380, "Goals/90": 0.08, "Shots/90": 0.6, "xG": 5.2, "Key Passes/90": 0.8, "Dribbles/90": 0.3 },
        formTrend: [88, 90, 85, 92, 88, 85, 90, 86, 88, 90],
        milestones: [{ year: 2018, event: "World record transfer to Liverpool" }, { year: 2019, event: "UEFA Men's Player of the Year" }, { year: 2020, event: "Premier League champion" }],
        specialData: { shootingZones: { "Inside Box": 75, "Outside Box": 5, "Penalty": 20 }, seasonGoals: [{ season: "20/21", goals: 3 }, { season: "21/22", goals: 5 }, { season: "22/23", goals: 3 }, { season: "23/24", goals: 4 }, { season: "24/25", goals: 5 }], positionHeatmap: [[0, 1, 0], [1, 8, 1], [0, 3, 0], [0, 0, 0]] },
    },
    {
        id: "fb9", name: "Rodri", country: "Spain", countryFlag: "🇪🇸", sport: "football",
        role: "Midfielder", age: 28, image: "RO", overallRating: 93,
        attributes: { Pace: 72, Shooting: 78, Dribbling: 82, Passing: 92, Physical: 88, Vision: 94 },
        detailedStats: { Goals: 45, Assists: 52, Appearances: 310, "Goals/90": 0.15, "Shots/90": 1.5, "xG": 12.2, "Key Passes/90": 2.5, "Dribbles/90": 1.4 },
        formTrend: [90, 92, 88, 95, 92, 90, 94, 88, 91, 93],
        milestones: [{ year: 2019, event: "Signed for Manchester City" }, { year: 2023, event: "Treble winner" }, { year: 2024, event: "Ballon d'Or winner" }],
        specialData: { shootingZones: { "Inside Box": 45, "Outside Box": 42, "Penalty": 13 }, seasonGoals: [{ season: "21/22", goals: 7 }, { season: "22/23", goals: 10 }, { season: "23/24", goals: 12 }, { season: "24/25", goals: 4 }], positionHeatmap: [[0, 1, 0], [2, 8, 2], [2, 6, 2], [0, 2, 0]] },
    },
    {
        id: "fb10", name: "Lamine Yamal", country: "Spain", countryFlag: "🇪🇸", sport: "football",
        role: "Winger", age: 17, image: "LY", overallRating: 88,
        attributes: { Pace: 94, Shooting: 80, Dribbling: 92, Passing: 82, Physical: 62, Vision: 85 },
        detailedStats: { Goals: 18, Assists: 22, Appearances: 75, "Goals/90": 0.26, "Shots/90": 2.2, "xG": 8.5, "Key Passes/90": 2.8, "Dribbles/90": 4.5 },
        formTrend: [82, 88, 90, 85, 92, 88, 95, 90, 88, 92],
        milestones: [{ year: 2023, event: "Youngest La Liga debutant at 15" }, { year: 2024, event: "Euro 2024 youngest ever goalscorer" }],
        specialData: { shootingZones: { "Inside Box": 55, "Outside Box": 32, "Penalty": 13 }, seasonGoals: [{ season: "23/24", goals: 7 }, { season: "24/25", goals: 11 }], positionHeatmap: [[0, 0, 0], [0, 1, 3], [1, 3, 6], [1, 4, 8]] },
    },
    {
        id: "fb11", name: "Victor Osimhen", country: "Nigeria", countryFlag: "🇳🇬", sport: "football",
        role: "Striker", age: 26, image: "VO", overallRating: 89,
        attributes: { Pace: 90, Shooting: 90, Dribbling: 78, Passing: 62, Physical: 88, Vision: 72 },
        detailedStats: { Goals: 140, Assists: 28, Appearances: 260, "Goals/90": 0.58, "Shots/90": 3.5, "xG": 32.5, "Key Passes/90": 0.8, "Dribbles/90": 1.2 },
        formTrend: [85, 90, 82, 88, 92, 78, 86, 90, 84, 88],
        milestones: [{ year: 2020, event: "Signed for Napoli" }, { year: 2023, event: "Serie A champion & top scorer" }],
        specialData: { shootingZones: { "Inside Box": 72, "Outside Box": 12, "Penalty": 16 }, seasonGoals: [{ season: "21/22", goals: 18 }, { season: "22/23", goals: 31 }, { season: "23/24", goals: 17 }, { season: "24/25", goals: 14 }], positionHeatmap: [[0, 0, 0], [0, 1, 0], [1, 3, 1], [3, 8, 3]] },
    },
    {
        id: "fb12", name: "Achraf Hakimi", country: "Morocco", countryFlag: "🇲🇦", sport: "football",
        role: "Defender", age: 26, image: "AH", overallRating: 87,
        attributes: { Pace: 95, Shooting: 72, Dribbling: 82, Passing: 80, Physical: 78, Vision: 78 },
        detailedStats: { Goals: 35, Assists: 55, Appearances: 280, "Goals/90": 0.13, "Shots/90": 1.2, "xG": 8.5, "Key Passes/90": 1.8, "Dribbles/90": 2.2 },
        formTrend: [82, 85, 88, 80, 86, 90, 84, 88, 82, 86],
        milestones: [{ year: 2017, event: "Real Madrid debut at 18" }, { year: 2022, event: "Morocco World Cup semifinal" }],
        specialData: { shootingZones: { "Inside Box": 45, "Outside Box": 40, "Penalty": 15 }, seasonGoals: [{ season: "21/22", goals: 5 }, { season: "22/23", goals: 7 }, { season: "23/24", goals: 8 }, { season: "24/25", goals: 6 }], positionHeatmap: [[0, 0, 1], [0, 2, 5], [0, 4, 6], [0, 2, 3]] },
    },
    {
        id: "fb13", name: "Florian Wirtz", country: "Germany", countryFlag: "🇩🇪", sport: "football",
        role: "Midfielder", age: 21, image: "FW", overallRating: 90,
        attributes: { Pace: 82, Shooting: 85, Dribbling: 90, Passing: 88, Physical: 68, Vision: 92 },
        detailedStats: { Goals: 52, Assists: 48, Appearances: 180, "Goals/90": 0.30, "Shots/90": 2.4, "xG": 18.2, "Key Passes/90": 3.0, "Dribbles/90": 3.2 },
        formTrend: [82, 88, 92, 85, 95, 90, 88, 94, 90, 92],
        milestones: [{ year: 2020, event: "Youngest Bundesliga scorer at 17" }, { year: 2024, event: "Unbeaten Bundesliga champion" }],
        specialData: { shootingZones: { "Inside Box": 50, "Outside Box": 38, "Penalty": 12 }, seasonGoals: [{ season: "21/22", goals: 7 }, { season: "22/23", goals: 10 }, { season: "23/24", goals: 18 }, { season: "24/25", goals: 14 }], positionHeatmap: [[0, 1, 0], [2, 5, 2], [3, 7, 3], [1, 4, 1]] },
    },
    {
        id: "fb14", name: "Luka Modric", country: "Croatia", countryFlag: "🇭🇷", sport: "football",
        role: "Midfielder", age: 39, image: "LM2", overallRating: 88,
        attributes: { Pace: 68, Shooting: 78, Dribbling: 88, Passing: 95, Physical: 62, Vision: 96 },
        detailedStats: { Goals: 85, Assists: 145, Appearances: 720, "Goals/90": 0.12, "Shots/90": 1.3, "xG": 12.1, "Key Passes/90": 2.8, "Dribbles/90": 1.8 },
        formTrend: [82, 78, 80, 75, 82, 78, 80, 76, 78, 80],
        milestones: [{ year: 2012, event: "Signed for Real Madrid" }, { year: 2018, event: "Ballon d'Or winner" }, { year: 2022, event: "Croatia World Cup bronze" }],
        specialData: { shootingZones: { "Inside Box": 35, "Outside Box": 50, "Penalty": 15 }, seasonGoals: [{ season: "21/22", goals: 5 }, { season: "22/23", goals: 4 }, { season: "23/24", goals: 6 }, { season: "24/25", goals: 3 }], positionHeatmap: [[0, 1, 0], [2, 7, 2], [2, 6, 2], [0, 2, 0]] },
    },
    {
        id: "fb15", name: "Federico Valverde", country: "Uruguay", countryFlag: "🇺🇾", sport: "football",
        role: "Midfielder", age: 26, image: "FV", overallRating: 89,
        attributes: { Pace: 88, Shooting: 82, Dribbling: 80, Passing: 85, Physical: 90, Vision: 84 },
        detailedStats: { Goals: 38, Assists: 40, Appearances: 250, "Goals/90": 0.16, "Shots/90": 2.0, "xG": 14.5, "Key Passes/90": 1.8, "Dribbles/90": 1.5 },
        formTrend: [85, 88, 82, 90, 86, 88, 92, 85, 88, 86],
        milestones: [{ year: 2018, event: "Real Madrid first team debut" }, { year: 2022, event: "Champions League winner" }],
        specialData: { shootingZones: { "Inside Box": 40, "Outside Box": 48, "Penalty": 12 }, seasonGoals: [{ season: "21/22", goals: 6 }, { season: "22/23", goals: 8 }, { season: "23/24", goals: 10 }, { season: "24/25", goals: 8 }], positionHeatmap: [[0, 1, 0], [2, 5, 2], [3, 7, 3], [1, 3, 1]] },
    },
];

// ─── BASKETBALL PLAYERS ──────────────────────────────────────────
const basketballPlayers: AnalysisPlayer[] = [
    {
        id: "bb1", name: "LeBron James", country: "USA", countryFlag: "🇺🇸", sport: "basketball",
        role: "Forward", age: 40, image: "/images/players/lebron_trending.jpg", photo: "/images/players/lebron_trending.jpg", overallRating: 97,
        attributes: { Scoring: 94, Playmaking: 95, Rebounding: 85, Defense: 82, IQ: 98, Leadership: 99 },
        detailedStats: { PPG: 27.1, RPG: 7.5, APG: 7.4, SPG: 1.5, BPG: 0.8, "FG%": 50.6, "3P%": 34.8, "FT%": 73.5 },
        formTrend: [85, 90, 88, 82, 92, 86, 90, 84, 88, 87],
        milestones: [
            { year: 2003, event: "NBA Draft #1 pick", title: "Phenom", icon: "⭐" },
            { year: 2012, event: "First NBA Championship", title: "Champion", icon: "🏆" },
            { year: 2020, event: "4th Championship with Lakers", title: "King in LA", icon: "👑" },
            { year: 2023, event: "NBA All-time scoring leader", title: "Scoring King", icon: "🏀" },
        ],
        specialData: {
            shotDistribution: { "At Rim": 32, "Mid-Range": 18, "3-Point": 28, "Free Throw": 22 },
            clutchStats: { "4th Qtr PPG": 6.8, "Game Winners": 18, "Buzzer Beaters": 8 },
            seasonSplits: [{ season: "21/22", ppg: 30.3 }, { season: "22/23", ppg: 28.9 }, { season: "23/24", ppg: 25.7 }, { season: "24/25", ppg: 23.5 }],
        },
        recentPerformances: [
            { date: "May 02, 2024", opponent: "Nuggets", result: "Loss", stats: { points: 30, rebounds: 9, assists: 11 }, impactScore: "A-" },
            { date: "Apr 29, 2024", opponent: "Nuggets", result: "Win", stats: { points: 26, rebounds: 7, assists: 9 }, impactScore: "A" },
            { date: "Apr 27, 2024", opponent: "Nuggets", result: "Loss", stats: { points: 27, rebounds: 6, assists: 8 }, impactScore: "B+" },
        ],
    },
    {
        id: "bb2", name: "Stephen Curry", country: "USA", countryFlag: "🇺🇸", sport: "basketball",
        role: "Guard", age: 36, image: "SC", overallRating: 95,
        attributes: { Scoring: 96, Playmaking: 88, Rebounding: 55, Defense: 72, IQ: 95, Leadership: 93 },
        detailedStats: { PPG: 24.8, RPG: 4.7, APG: 6.4, SPG: 1.3, BPG: 0.2, "FG%": 47.3, "3P%": 42.6, "FT%": 91.0 },
        formTrend: [88, 95, 90, 85, 92, 87, 94, 86, 91, 88],
        milestones: [
            { year: 2015, event: "First MVP & Championship", title: "Splash Brother", icon: "💦" },
            { year: 2016, event: "Unanimous MVP", title: "Unanimous", icon: "💎" },
            { year: 2021, event: "All-time 3-point record", title: "3pt King", icon: "🏹" },
            { year: 2022, event: "Finals MVP", title: "Finals MVP", icon: "🏆" },
        ],
        specialData: {
            shotDistribution: { "At Rim": 18, "Mid-Range": 12, "3-Point": 48, "Free Throw": 22 },
            clutchStats: { "4th Qtr PPG": 7.2, "Game Winners": 12, "Buzzer Beaters": 5 },
            seasonSplits: [{ season: "21/22", ppg: 25.5 }, { season: "22/23", ppg: 29.4 }, { season: "23/24", ppg: 26.4 }, { season: "24/25", ppg: 22.8 }],
        },
    },
    {
        id: "bb3", name: "Nikola Jokic", country: "Serbia", countryFlag: "🇷🇸", sport: "basketball",
        role: "Center", age: 29, image: "NJ", overallRating: 97,
        attributes: { Scoring: 90, Playmaking: 98, Rebounding: 95, Defense: 78, IQ: 99, Leadership: 88 },
        detailedStats: { PPG: 26.4, RPG: 12.4, APG: 9.0, SPG: 1.4, BPG: 0.7, "FG%": 58.3, "3P%": 35.9, "FT%": 82.2 },
        formTrend: [92, 95, 90, 96, 88, 93, 97, 91, 94, 96],
        milestones: [
            { year: 2021, event: "First MVP award", title: "The Joker", icon: "🃏" },
            { year: 2022, event: "Back-to-back MVP", title: "Double MVP", icon: "💨" },
            { year: 2023, event: "NBA Champion & Finals MVP", title: "Champion", icon: "🏆" },
            { year: 2024, event: "Third MVP award", title: "3x MVP", icon: "🌟" },
        ],
        specialData: {
            shotDistribution: { "At Rim": 35, "Mid-Range": 28, "3-Point": 20, "Free Throw": 17 },
            clutchStats: { "4th Qtr PPG": 7.8, "Game Winners": 8, "Buzzer Beaters": 4 },
            seasonSplits: [{ season: "21/22", ppg: 27.1 }, { season: "22/23", ppg: 24.5 }, { season: "23/24", ppg: 26.4 }, { season: "24/25", ppg: 28.1 }],
        },
    },
    {
        id: "bb4", name: "Giannis Antetokounmpo", country: "Greece", countryFlag: "🇬🇷", sport: "basketball",
        role: "Forward", age: 30, image: "GA", overallRating: 96,
        attributes: { Scoring: 93, Playmaking: 82, Rebounding: 92, Defense: 90, IQ: 85, Leadership: 90 },
        detailedStats: { PPG: 30.2, RPG: 11.5, APG: 6.5, SPG: 1.2, BPG: 1.4, "FG%": 60.1, "3P%": 27.5, "FT%": 65.2 },
        formTrend: [90, 92, 88, 95, 93, 87, 96, 90, 94, 91],
        milestones: [
            { year: 2017, event: "Most Improved Player" },
            { year: 2019, event: "Back-to-back MVP" },
            { year: 2021, event: "NBA Champion & Finals MVP" },
        ],
        specialData: {
            shotDistribution: { "At Rim": 52, "Mid-Range": 15, "3-Point": 12, "Free Throw": 21 },
            clutchStats: { "4th Qtr PPG": 8.5, "Game Winners": 10, "Buzzer Beaters": 3 },
            seasonSplits: [{ season: "21/22", ppg: 29.9 }, { season: "22/23", ppg: 31.1 }, { season: "23/24", ppg: 30.4 }, { season: "24/25", ppg: 28.8 }],
        },
    },
    {
        id: "bb5", name: "Kevin Durant", country: "USA", countryFlag: "🇺🇸", sport: "basketball",
        role: "Forward", age: 36, image: "KD", overallRating: 94,
        attributes: { Scoring: 96, Playmaking: 80, Rebounding: 78, Defense: 75, IQ: 92, Leadership: 85 },
        detailedStats: { PPG: 27.3, RPG: 7.1, APG: 4.3, SPG: 1.1, BPG: 1.2, "FG%": 50.1, "3P%": 38.7, "FT%": 88.3 },
        formTrend: [88, 85, 90, 82, 88, 84, 90, 86, 88, 85],
        milestones: [{ year: 2007, event: "NBA Draft #2 pick" }, { year: 2014, event: "NBA MVP" }, { year: 2017, event: "First Championship & Finals MVP" }],
        specialData: { shotDistribution: { "At Rim": 22, "Mid-Range": 30, "3-Point": 28, "Free Throw": 20 }, clutchStats: { "4th Qtr PPG": 7.5, "Game Winners": 14, "Buzzer Beaters": 6 }, seasonSplits: [{ season: "21/22", ppg: 29.9 }, { season: "22/23", ppg: 29.1 }, { season: "23/24", ppg: 27.1 }, { season: "24/25", ppg: 25.5 }] },
    },
    {
        id: "bb6", name: "Jayson Tatum", country: "USA", countryFlag: "🇺🇸", sport: "basketball",
        role: "Forward", age: 27, image: "JT", overallRating: 93,
        attributes: { Scoring: 92, Playmaking: 78, Rebounding: 82, Defense: 80, IQ: 88, Leadership: 85 },
        detailedStats: { PPG: 26.9, RPG: 8.1, APG: 4.9, SPG: 1.0, BPG: 0.7, "FG%": 45.3, "3P%": 37.6, "FT%": 83.5 },
        formTrend: [85, 90, 88, 92, 86, 94, 90, 88, 92, 90],
        milestones: [{ year: 2017, event: "NBA Draft #3 pick" }, { year: 2024, event: "NBA Champion with Celtics" }],
        specialData: { shotDistribution: { "At Rim": 28, "Mid-Range": 20, "3-Point": 32, "Free Throw": 20 }, clutchStats: { "4th Qtr PPG": 6.5, "Game Winners": 8, "Buzzer Beaters": 3 }, seasonSplits: [{ season: "21/22", ppg: 26.9 }, { season: "22/23", ppg: 30.1 }, { season: "23/24", ppg: 26.9 }, { season: "24/25", ppg: 27.8 }] },
    },
    {
        id: "bb7", name: "Anthony Edwards", country: "USA", countryFlag: "🇺🇸", sport: "basketball",
        role: "Guard", age: 23, image: "AE", overallRating: 91,
        attributes: { Scoring: 92, Playmaking: 75, Rebounding: 68, Defense: 78, IQ: 82, Leadership: 80 },
        detailedStats: { PPG: 25.4, RPG: 5.4, APG: 5.1, SPG: 1.3, BPG: 0.5, "FG%": 46.2, "3P%": 36.8, "FT%": 78.5 },
        formTrend: [82, 88, 92, 85, 95, 90, 88, 94, 90, 92],
        milestones: [{ year: 2020, event: "NBA Draft #1 pick" }, { year: 2024, event: "Led Wolves to Western Conference Finals" }],
        specialData: { shotDistribution: { "At Rim": 30, "Mid-Range": 15, "3-Point": 35, "Free Throw": 20 }, clutchStats: { "4th Qtr PPG": 7.2, "Game Winners": 5, "Buzzer Beaters": 2 }, seasonSplits: [{ season: "21/22", ppg: 21.3 }, { season: "22/23", ppg: 24.6 }, { season: "23/24", ppg: 25.9 }, { season: "24/25", ppg: 27.5 }] },
    },
    {
        id: "bb8", name: "Luka Doncic", country: "Slovenia", countryFlag: "🇸🇮", sport: "basketball",
        role: "Guard", age: 25, image: "LD", overallRating: 95,
        attributes: { Scoring: 95, Playmaking: 96, Rebounding: 82, Defense: 68, IQ: 96, Leadership: 88 },
        detailedStats: { PPG: 28.7, RPG: 9.1, APG: 8.8, SPG: 1.4, BPG: 0.3, "FG%": 47.5, "3P%": 35.2, "FT%": 75.8 },
        formTrend: [90, 92, 88, 95, 90, 92, 96, 88, 94, 92],
        milestones: [{ year: 2019, event: "NBA Rookie of the Year" }, { year: 2024, event: "NBA Finals with Mavericks" }],
        specialData: { shotDistribution: { "At Rim": 25, "Mid-Range": 22, "3-Point": 32, "Free Throw": 21 }, clutchStats: { "4th Qtr PPG": 8.8, "Game Winners": 12, "Buzzer Beaters": 7 }, seasonSplits: [{ season: "21/22", ppg: 28.4 }, { season: "22/23", ppg: 32.4 }, { season: "23/24", ppg: 33.9 }, { season: "24/25", ppg: 28.1 }] },
    },
    {
        id: "bb9", name: "Victor Wembanyama", country: "France", countryFlag: "🇫🇷", sport: "basketball",
        role: "Center", age: 21, image: "VW", overallRating: 90,
        attributes: { Scoring: 82, Playmaking: 72, Rebounding: 88, Defense: 95, IQ: 88, Leadership: 75 },
        detailedStats: { PPG: 21.4, RPG: 10.6, APG: 3.9, SPG: 1.2, BPG: 3.6, "FG%": 46.5, "3P%": 32.5, "FT%": 79.8 },
        formTrend: [78, 85, 88, 82, 90, 86, 92, 88, 85, 90],
        milestones: [{ year: 2023, event: "NBA Draft #1 pick" }, { year: 2024, event: "NBA Rookie of the Year" }],
        specialData: { shotDistribution: { "At Rim": 35, "Mid-Range": 18, "3-Point": 28, "Free Throw": 19 }, clutchStats: { "4th Qtr PPG": 5.8, "Game Winners": 3, "Buzzer Beaters": 1 }, seasonSplits: [{ season: "23/24", ppg: 21.4 }, { season: "24/25", ppg: 24.8 }] },
    },
    {
        id: "bb10", name: "Joel Embiid", country: "Cameroon", countryFlag: "🇨🇲", sport: "basketball",
        role: "Center", age: 31, image: "JE", overallRating: 94,
        attributes: { Scoring: 95, Playmaking: 78, Rebounding: 90, Defense: 85, IQ: 90, Leadership: 82 },
        detailedStats: { PPG: 30.6, RPG: 11.7, APG: 4.2, SPG: 1.0, BPG: 1.7, "FG%": 52.9, "3P%": 33.5, "FT%": 85.6 },
        formTrend: [85, 82, 90, 78, 88, 75, 80, 85, 82, 78],
        milestones: [{ year: 2014, event: "NBA Draft #3 pick" }, { year: 2023, event: "NBA MVP" }],
        specialData: { shotDistribution: { "At Rim": 38, "Mid-Range": 25, "3-Point": 18, "Free Throw": 19 }, clutchStats: { "4th Qtr PPG": 8.2, "Game Winners": 8, "Buzzer Beaters": 2 }, seasonSplits: [{ season: "21/22", ppg: 30.6 }, { season: "22/23", ppg: 33.1 }, { season: "23/24", ppg: 34.7 }, { season: "24/25", ppg: 25.2 }] },
    },
    {
        id: "bb11", name: "Shai Gilgeous-Alexander", country: "Canada", countryFlag: "🇨🇦", sport: "basketball",
        role: "Guard", age: 26, image: "SG", overallRating: 94,
        attributes: { Scoring: 95, Playmaking: 85, Rebounding: 72, Defense: 82, IQ: 92, Leadership: 88 },
        detailedStats: { PPG: 31.4, RPG: 5.5, APG: 6.2, SPG: 2.0, BPG: 0.9, "FG%": 53.5, "3P%": 35.3, "FT%": 87.4 },
        formTrend: [88, 92, 90, 95, 88, 94, 92, 96, 90, 94],
        milestones: [{ year: 2018, event: "NBA Draft #11 pick" }, { year: 2024, event: "NBA scoring leader" }],
        specialData: { shotDistribution: { "At Rim": 32, "Mid-Range": 28, "3-Point": 22, "Free Throw": 18 }, clutchStats: { "4th Qtr PPG": 9.2, "Game Winners": 10, "Buzzer Beaters": 4 }, seasonSplits: [{ season: "21/22", ppg: 24.5 }, { season: "22/23", ppg: 31.4 }, { season: "23/24", ppg: 30.1 }, { season: "24/25", ppg: 32.8 }] },
    },
    {
        id: "bb12", name: "Dennis Schroder", country: "Germany", countryFlag: "🇩🇪", sport: "basketball",
        role: "Guard", age: 31, image: "DS", overallRating: 82,
        attributes: { Scoring: 80, Playmaking: 82, Rebounding: 48, Defense: 72, IQ: 78, Leadership: 80 },
        detailedStats: { PPG: 14.8, RPG: 3.0, APG: 5.8, SPG: 0.9, BPG: 0.2, "FG%": 43.8, "3P%": 33.5, "FT%": 82.5 },
        formTrend: [75, 78, 72, 80, 76, 78, 82, 75, 78, 76],
        milestones: [{ year: 2013, event: "NBA Draft #17 pick" }, { year: 2023, event: "FIBA World Cup champion & MVP" }],
        specialData: { shotDistribution: { "At Rim": 30, "Mid-Range": 22, "3-Point": 28, "Free Throw": 20 }, clutchStats: { "4th Qtr PPG": 4.2, "Game Winners": 4, "Buzzer Beaters": 2 }, seasonSplits: [{ season: "21/22", ppg: 13.5 }, { season: "22/23", ppg: 15.4 }, { season: "23/24", ppg: 14.8 }, { season: "24/25", ppg: 12.5 }] },
    },
];

// ─── TENNIS PLAYERS ──────────────────────────────────────────────
const tennisPlayers: AnalysisPlayer[] = [
    {
        id: "tn1", name: "Novak Djokovic", country: "Serbia", countryFlag: "🇷🇸", sport: "tennis",
        role: "Right-handed", age: 37, image: "ND", photo: "/images/players/djokovic_trending.png", overallRating: 98,
        attributes: { Serve: 88, Return: 98, Forehand: 92, Backhand: 96, Net: 82, Fitness: 95 },
        detailedStats: { Titles: 98, "Grand Slams": 24, "Win%": 83.5, Aces: 710, "1st Serve%": 68, "Break Pts Won%": 45, "Weeks at No.1": 428, "Prize Money ($M)": 183 },
        formTrend: [92, 88, 95, 85, 90, 82, 94, 87, 90, 88],
        milestones: [
            { year: 2008, event: "First Grand Slam (Australian Open)", title: "Slam Winner", icon: "🎾" },
            { year: 2015, event: "Career Grand Slam complete", title: "Grand Slam", icon: "🏆" },
            { year: 2023, event: "24th Grand Slam title", title: "Record Holder", icon: "📊" },
            { year: 2024, event: "Olympic gold medal", title: "Golden Slam", icon: "🥇" },
        ],
        specialData: {
            surfaceWinRate: { Hard: 86.2, Clay: 80.1, Grass: 84.5, Indoor: 88.0 },
            serveAnalysis: { "1st Serve Win%": 78, "2nd Serve Win%": 58, "Avg Speed (mph)": 119, "Max Speed (mph)": 136 },
            grandSlamBreakdown: { AO: 10, RG: 3, Wimbledon: 7, USO: 4 },
        },
        recentPerformances: [
            { date: "Jul 14, 2024", opponent: "C. Alcaraz", matchType: "Wimbledon Final", result: "Loss", stats: { sets: "0-3", aces: 4, "winners": 15 }, impactScore: "B" },
            { date: "Jul 12, 2024", opponent: "L. Musetti", matchType: "Wimbledon SF", result: "Win", stats: { sets: "3-0", aces: 6, "winners": 34 }, impactScore: "A+" },
            { date: "Jul 08, 2024", opponent: "H. Rune", matchType: "Wimbledon R4", result: "Win", stats: { sets: "3-0", aces: 5, "winners": 28 }, impactScore: "A" },
        ],
    },
    {
        id: "tn2", name: "Carlos Alcaraz", country: "Spain", countryFlag: "🇪🇸", sport: "tennis",
        role: "Right-handed", age: 21, image: "CA", overallRating: 95,
        attributes: { Serve: 85, Return: 88, Forehand: 95, Backhand: 88, Net: 86, Fitness: 92 },
        detailedStats: { Titles: 16, "Grand Slams": 4, "Win%": 81.2, Aces: 450, "1st Serve%": 65, "Break Pts Won%": 44, "Weeks at No.1": 36, "Prize Money ($M)": 38 },
        formTrend: [85, 92, 88, 95, 90, 96, 87, 93, 94, 91],
        milestones: [
            { year: 2022, event: "US Open champion at 19", title: "Youngest #1", icon: "⚡" },
            { year: 2023, event: "Wimbledon champion", title: "Grass King", icon: "🌱" },
            { year: 2024, event: "French Open & Wimbledon double", title: "Surface Master", icon: "🌈" },
        ],
        specialData: {
            surfaceWinRate: { Hard: 82.5, Clay: 84.0, Grass: 78.5, Indoor: 80.0 },
            serveAnalysis: { "1st Serve Win%": 76, "2nd Serve Win%": 55, "Avg Speed (mph)": 122, "Max Speed (mph)": 139 },
            grandSlamBreakdown: { AO: 0, RG: 1, Wimbledon: 2, USO: 1 },
        },
    },
    {
        id: "tn3", name: "Jannik Sinner", country: "Italy", countryFlag: "🇮🇹", sport: "tennis",
        role: "Right-handed", age: 23, image: "JS", overallRating: 96,
        attributes: { Serve: 86, Return: 92, Forehand: 93, Backhand: 91, Net: 80, Fitness: 90 },
        detailedStats: { Titles: 18, "Grand Slams": 3, "Win%": 82.0, Aces: 520, "1st Serve%": 66, "Break Pts Won%": 43, "Weeks at No.1": 52, "Prize Money ($M)": 32 },
        formTrend: [88, 90, 95, 92, 96, 89, 94, 91, 97, 93],
        milestones: [
            { year: 2024, event: "Australian Open champion" },
            { year: 2024, event: "Became World No. 1" },
            { year: 2024, event: "US Open champion" },
        ],
        specialData: {
            surfaceWinRate: { Hard: 85.0, Clay: 78.5, Grass: 76.0, Indoor: 86.5 },
            serveAnalysis: { "1st Serve Win%": 77, "2nd Serve Win%": 56, "Avg Speed (mph)": 121, "Max Speed (mph)": 137 },
            grandSlamBreakdown: { AO: 2, RG: 0, Wimbledon: 0, USO: 1 },
        },
    },
    {
        id: "tn4", name: "Rafael Nadal", country: "Spain", countryFlag: "🇪🇸", sport: "tennis",
        role: "Left-handed", age: 38, image: "RN", overallRating: 92,
        attributes: { Serve: 82, Return: 90, Forehand: 96, Backhand: 85, Net: 78, Fitness: 88 },
        detailedStats: { Titles: 92, "Grand Slams": 22, "Win%": 83.1, Aces: 580, "1st Serve%": 69, "Break Pts Won%": 46, "Weeks at No.1": 209, "Prize Money ($M)": 135 },
        formTrend: [72, 68, 75, 60, 78, 65, 70, 72, 68, 62],
        milestones: [
            { year: 2005, event: "First French Open title at 19" },
            { year: 2010, event: "Career Grand Slam at 24" },
            { year: 2022, event: "22nd Grand Slam at Australian Open" },
        ],
        specialData: {
            surfaceWinRate: { Hard: 78.2, Clay: 91.8, Grass: 75.0, Indoor: 76.5 },
            serveAnalysis: { "1st Serve Win%": 74, "2nd Serve Win%": 56, "Avg Speed (mph)": 115, "Max Speed (mph)": 130 },
            grandSlamBreakdown: { AO: 2, RG: 14, Wimbledon: 2, USO: 4 },
        },
    },
    {
        id: "tn5", name: "Daniil Medvedev", country: "Russia", countryFlag: "🇷🇺", sport: "tennis",
        role: "Right-handed", age: 29, image: "DM", overallRating: 94,
        attributes: { Serve: 92, Return: 94, Forehand: 88, Backhand: 92, Net: 78, Fitness: 90 },
        detailedStats: { Titles: 20, "Grand Slams": 1, "Win%": 71.5, Aces: 650, "1st Serve%": 64, "Break Pts Won%": 42, "Weeks at No.1": 16, "Prize Money ($M)": 40 },
        formTrend: [88, 85, 90, 82, 92, 88, 85, 88, 90, 86],
        milestones: [{ year: 2021, event: "US Open Champion" }, { year: 2022, event: "Reached World No.1" }],
        specialData: { surfaceWinRate: { Hard: 75.5, Clay: 55.2, Grass: 62.1, Indoor: 78.5 }, serveAnalysis: { "1st Serve Win%": 76, "2nd Serve Win%": 52, "Avg Speed (mph)": 120, "Max Speed (mph)": 134 }, grandSlamBreakdown: { AO: 0, RG: 0, Wimbledon: 0, USO: 1 } },
    },
    {
        id: "tn6", name: "Alexander Zverev", country: "Germany", countryFlag: "🇩🇪", sport: "tennis",
        role: "Right-handed", age: 27, image: "AZ", overallRating: 92,
        attributes: { Serve: 94, Return: 85, Forehand: 88, Backhand: 95, Net: 80, Fitness: 88 },
        detailedStats: { Titles: 22, "Grand Slams": 0, "Win%": 69.5, Aces: 850, "1st Serve%": 70, "Break Pts Won%": 38, "Weeks at No.1": 0, "Prize Money ($M)": 42 },
        formTrend: [85, 88, 90, 82, 86, 92, 88, 85, 84, 88],
        milestones: [{ year: 2021, event: "Olympic Gold Medal" }, { year: 2021, event: "ATP Finals Champion" }],
        specialData: { surfaceWinRate: { Hard: 68.5, Clay: 72.5, Grass: 65.2, Indoor: 75.1 }, serveAnalysis: { "1st Serve Win%": 78, "2nd Serve Win%": 48, "Avg Speed (mph)": 125, "Max Speed (mph)": 140 }, grandSlamBreakdown: { AO: 0, RG: 0, Wimbledon: 0, USO: 0 } },
    },
    {
        id: "tn7", name: "Stefanos Tsitsipas", country: "Greece", countryFlag: "🇬🇷", sport: "tennis",
        role: "Right-handed", age: 26, image: "ST", overallRating: 90,
        attributes: { Serve: 90, Return: 82, Forehand: 94, Backhand: 85, Net: 88, Fitness: 86 },
        detailedStats: { Titles: 11, "Grand Slams": 0, "Win%": 67.5, Aces: 550, "1st Serve%": 62, "Break Pts Won%": 36, "Weeks at No.1": 0, "Prize Money ($M)": 30 },
        formTrend: [82, 85, 78, 88, 85, 82, 86, 84, 80, 85],
        milestones: [{ year: 2019, event: "ATP Finals Champion" }, { year: 2021, event: "French Open Finalist" }],
        specialData: { surfaceWinRate: { Hard: 65.5, Clay: 75.2, Grass: 60.1, Indoor: 68.5 }, serveAnalysis: { "1st Serve Win%": 75, "2nd Serve Win%": 54, "Avg Speed (mph)": 118, "Max Speed (mph)": 130 }, grandSlamBreakdown: { AO: 0, RG: 0, Wimbledon: 0, USO: 0 } },
    },
    {
        id: "tn8", name: "Iga Swiatek", country: "Poland", countryFlag: "🇵🇱", sport: "tennis",
        role: "Right-handed", age: 23, image: "IS", overallRating: 96,
        attributes: { Serve: 82, Return: 96, Forehand: 95, Backhand: 92, Net: 78, Fitness: 94 },
        detailedStats: { Titles: 22, "Grand Slams": 5, "Win%": 82.5, Aces: 150, "1st Serve%": 65, "Break Pts Won%": 52, "Weeks at No.1": 108, "Prize Money ($M)": 32 },
        formTrend: [92, 95, 88, 96, 90, 94, 92, 96, 94, 95],
        milestones: [{ year: 2020, event: "First French Open title" }, { year: 2022, event: "Reached World No.1" }, { year: 2024, event: "Third consecutive French Open" }],
        specialData: { surfaceWinRate: { Hard: 85.5, Clay: 94.2, Grass: 72.1, Indoor: 78.5 }, serveAnalysis: { "1st Serve Win%": 70, "2nd Serve Win%": 62, "Avg Speed (mph)": 105, "Max Speed (mph)": 118 }, grandSlamBreakdown: { AO: 0, RG: 4, Wimbledon: 0, USO: 1 } },
    },
    {
        id: "tn9", name: "Aryna Sabalenka", country: "Belarus", countryFlag: "🇧🇾", sport: "tennis",
        role: "Right-handed", age: 26, image: "AS", overallRating: 94,
        attributes: { Serve: 94, Return: 88, Forehand: 96, Backhand: 88, Net: 75, Fitness: 88 },
        detailedStats: { Titles: 14, "Grand Slams": 2, "Win%": 70.5, Aces: 350, "1st Serve%": 60, "Break Pts Won%": 45, "Weeks at No.1": 8, "Prize Money ($M)": 24 },
        formTrend: [88, 92, 85, 90, 94, 88, 92, 86, 90, 92],
        milestones: [{ year: 2023, event: "Australian Open Champion" }, { year: 2023, event: "Reached World No.1" }, { year: 2024, event: "Defended AO title" }],
        specialData: { surfaceWinRate: { Hard: 78.5, Clay: 72.2, Grass: 65.1, Indoor: 68.5 }, serveAnalysis: { "1st Serve Win%": 74, "2nd Serve Win%": 48, "Avg Speed (mph)": 112, "Max Speed (mph)": 124 }, grandSlamBreakdown: { AO: 2, RG: 0, Wimbledon: 0, USO: 0 } },
    },
    {
        id: "tn10", name: "Coco Gauff", country: "USA", countryFlag: "🇺🇸", sport: "tennis",
        role: "Right-handed", age: 20, image: "CG", overallRating: 91,
        attributes: { Serve: 92, Return: 88, Forehand: 85, Backhand: 94, Net: 85, Fitness: 92 },
        detailedStats: { Titles: 7, "Grand Slams": 1, "Win%": 68.5, Aces: 250, "1st Serve%": 58, "Break Pts Won%": 48, "Weeks at No.1": 0, "Prize Money ($M)": 14 },
        formTrend: [85, 88, 92, 80, 86, 90, 88, 85, 88, 86],
        milestones: [{ year: 2019, event: "Wimbledon 4th round at 15" }, { year: 2023, event: "US Open Champion" }],
        specialData: { surfaceWinRate: { Hard: 74.5, Clay: 68.2, Grass: 70.1, Indoor: 65.5 }, serveAnalysis: { "1st Serve Win%": 72, "2nd Serve Win%": 46, "Avg Speed (mph)": 115, "Max Speed (mph)": 128 }, grandSlamBreakdown: { AO: 0, RG: 0, Wimbledon: 0, USO: 1 } },
    },
    {
        id: "tn11", name: "Casper Ruud", country: "Norway", countryFlag: "🇳🇴", sport: "tennis",
        role: "Right-handed", age: 26, image: "CR", overallRating: 88,
        attributes: { Serve: 85, Return: 82, Forehand: 92, Backhand: 80, Net: 75, Fitness: 88 },
        detailedStats: { Titles: 10, "Grand Slams": 0, "Win%": 64.5, Aces: 350, "1st Serve%": 66, "Break Pts Won%": 38, "Weeks at No.1": 0, "Prize Money ($M)": 18 },
        formTrend: [82, 85, 80, 78, 86, 88, 82, 85, 84, 82],
        milestones: [{ year: 2022, event: "French Open Finalist" }, { year: 2022, event: "US Open Finalist" }],
        specialData: { surfaceWinRate: { Hard: 60.5, Clay: 78.2, Grass: 45.1, Indoor: 58.5 }, serveAnalysis: { "1st Serve Win%": 72, "2nd Serve Win%": 54, "Avg Speed (mph)": 118, "Max Speed (mph)": 128 }, grandSlamBreakdown: { AO: 0, RG: 0, Wimbledon: 0, USO: 0 } },
    },
    {
        id: "tn12", name: "Alex de Minaur", country: "Australia", countryFlag: "🇦🇺", sport: "tennis",
        role: "Right-handed", age: 26, image: "AD", overallRating: 87,
        attributes: { Serve: 80, Return: 90, Forehand: 85, Backhand: 86, Net: 82, Fitness: 96 },
        detailedStats: { Titles: 8, "Grand Slams": 0, "Win%": 62.5, Aces: 250, "1st Serve%": 62, "Break Pts Won%": 42, "Weeks at No.1": 0, "Prize Money ($M)": 14 },
        formTrend: [80, 84, 88, 85, 82, 86, 88, 84, 85, 82],
        milestones: [{ year: 2023, event: "Entered Top 10" }, { year: 2024, event: "Reached career high ranking" }],
        specialData: { surfaceWinRate: { Hard: 68.5, Clay: 50.2, Grass: 65.1, Indoor: 62.5 }, serveAnalysis: { "1st Serve Win%": 68, "2nd Serve Win%": 56, "Avg Speed (mph)": 110, "Max Speed (mph)": 122 }, grandSlamBreakdown: { AO: 0, RG: 0, Wimbledon: 0, USO: 0 } },
    },
];

// ─── Export ──────────────────────────────────────────────────────
export const ANALYSIS_PLAYERS: Record<AnalysisSport, AnalysisPlayer[]> = {
    cricket: [...cricketPlayers, ...extraEnglandPlayers, ...extraNZPlayers, ...extraPakistanPlayers, ...extraSAPlayers, ...sriLankaPlayers, ...bangladeshPlayers, ...westIndiesPlayers, ...afghanistanPlayers],
    football: footballPlayers,
    basketball: basketballPlayers,
    tennis: tennisPlayers,
};

export const SPORT_LABELS: Record<AnalysisSport, { icon: string; label: string; color: string; gradient: string }> = {
    cricket: { icon: "🏏", label: "Cricket", color: "#10b981", gradient: "from-emerald-500/20 to-teal-500/10" },
    football: { icon: "⚽", label: "Football", color: "#3b82f6", gradient: "from-blue-500/20 to-indigo-500/10" },
    basketball: { icon: "🏀", label: "Basketball", color: "#f97316", gradient: "from-orange-500/20 to-amber-500/10" },
    tennis: { icon: "🎾", label: "Tennis", color: "#84cc16", gradient: "from-lime-500/20 to-green-500/10" },
};
