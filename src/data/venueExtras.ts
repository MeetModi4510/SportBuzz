// Additional venues for all sports
import type { VenueAnalysis } from './venueAnalysisData';

// ═══════════ CRICKET ═══════════

export const edenGardens: VenueAnalysis = {
    id: "eden-gardens", name: "Eden Gardens", city: "Kolkata", country: "India",
    capacity: 68000, sport: "cricket", established: 1864, nickname: "The Colosseum of Cricket",
    description: "India's largest and most atmospheric cricket ground, famous for its passionate crowd and historic matches including Laxman's 281.",
    stats: {
        sport: "cricket", avgFirstInningsScore: 278, avgSecondInningsScore: 248,
        highestTotal: { score: "657/7d", team: "India", year: 2010 }, lowestTotal: { score: "67", team: "Australia", year: 2001 },
        matchesHosted: 253, wonBattingFirst: 50, wonBattingSecond: 38, draws: 12, avgRunRate: 5.1,
        pitchType: "Balanced, assists spinners later", tossWinBatFirst: 58, tossWinFieldFirst: 42,
        avgWicketsFallen: 15, centuries: 120, fiveWicketHauls: 55,
        formatBreakdown: [{ format: "Test", matches: 43 }, { format: "ODI", matches: 34 }, { format: "T20I", matches: 8 }, { format: "IPL", matches: 120 }],
    },
    recentMatches: [
        { date: "Feb 2025", teams: "India vs England", score: "307/4 vs 245", result: "India won by 62 runs" },
        { date: "Dec 2024", teams: "KKR vs MI (IPL)", score: "198/5 vs 172/9", result: "KKR won by 26 runs" },
        { date: "Nov 2024", teams: "India vs SA", score: "282/6 vs 285/4", result: "SA won by 6 wickets" },
        { date: "Oct 2024", teams: "India vs NZ", score: "312/8 vs 280", result: "India won by 32 runs" },
        { date: "Apr 2024", teams: "KKR vs SRH (IPL)", score: "175/4 vs 171/8", result: "KKR won by 4 runs" },
    ],
    topPerformers: [
        { name: "Sourav Ganguly", country: "India", stat: "1,450 runs", highlight: "Prince of Kolkata" },
        { name: "VVS Laxman", country: "India", stat: "281 vs Aus (2001)", highlight: "Greatest Test innings" },
        { name: "Anil Kumble", country: "India", stat: "65 wickets", highlight: "Most Test wickets here" },
        { name: "Andre Russell", country: "West Indies", stat: "1,200 runs", highlight: "IPL legend at Eden" },
    ],
};

export const gabba: VenueAnalysis = {
    id: "gabba", name: "The Gabba", city: "Brisbane", country: "Australia",
    capacity: 42000, sport: "cricket", established: 1895, nickname: "The Fortress",
    description: "Australia's fortress in Brisbane where they went unbeaten for 32 years until India's historic 2021 victory.",
    stats: {
        sport: "cricket", avgFirstInningsScore: 310, avgSecondInningsScore: 265,
        highestTotal: { score: "645/5d", team: "Australia", year: 2007 }, lowestTotal: { score: "58", team: "India", year: 1947 },
        matchesHosted: 215, wonBattingFirst: 48, wonBattingSecond: 40, draws: 12, avgRunRate: 5.3,
        pitchType: "Fast and bouncy, extra pace for seamers", tossWinBatFirst: 55, tossWinFieldFirst: 45,
        avgWicketsFallen: 16, centuries: 95, fiveWicketHauls: 48,
        formatBreakdown: [{ format: "Test", matches: 65 }, { format: "ODI", matches: 42 }, { format: "T20I", matches: 12 }, { format: "BBL", matches: 85 }],
    },
    recentMatches: [
        { date: "Jan 2025", teams: "Australia vs India", score: "369 vs 302", result: "Australia won by 67 runs" },
        { date: "Nov 2024", teams: "Australia vs Pakistan", score: "401/7 vs 289", result: "Australia won by 112 runs" },
        { date: "Jan 2024", teams: "Heat vs Strikers (BBL)", score: "165/6 vs 158", result: "Heat won by 7 runs" },
        { date: "Dec 2023", teams: "Australia vs West Indies", score: "388 vs 220", result: "Australia won by 168 runs" },
        { date: "Jan 2021", teams: "Australia vs India", score: "294 vs 329/7", result: "India won by 3 wickets" },
    ],
    topPerformers: [
        { name: "Don Bradman", country: "Australia", stat: "1,125 runs", highlight: "Avg 102.3 at Gabba" },
        { name: "Glenn McGrath", country: "Australia", stat: "78 wickets", highlight: "Most wickets (Tests)" },
        { name: "Matthew Hayden", country: "Australia", stat: "1,340 runs", highlight: "Gabba specialist" },
        { name: "Rishabh Pant", country: "India", stat: "89* (2021)", highlight: "Broke the fortress" },
    ],
};

export const galle: VenueAnalysis = {
    id: "galle", name: "Galle International Stadium", city: "Galle", country: "Sri Lanka",
    capacity: 35000, sport: "cricket", established: 1998, nickname: "The Fort Ground",
    description: "One of the most picturesque cricket grounds in the world, set against a backdrop of the historic Dutch Fort and the Indian Ocean.",
    stats: {
        sport: "cricket", avgFirstInningsScore: 310, avgSecondInningsScore: 245,
        highestTotal: { score: "756/5d", team: "Sri Lanka", year: 2009 }, lowestTotal: { score: "73", team: "Sri Lanka", year: 2020 },
        matchesHosted: 95, wonBattingFirst: 52, wonBattingSecond: 35, draws: 13, avgRunRate: 4.8,
        pitchType: "Spin-friendly, deteriorates significantly for batting last", tossWinBatFirst: 65, tossWinFieldFirst: 35,
        avgWicketsFallen: 17, centuries: 55, fiveWicketHauls: 38,
        formatBreakdown: [{ format: "Test", matches: 48 }, { format: "ODI", matches: 18 }, { format: "T20I", matches: 5 }, { format: "Other", matches: 24 }],
    },
    recentMatches: [
        { date: "Jan 2025", teams: "Sri Lanka vs Australia", score: "245 vs 282/4", result: "Australia won by 6 wickets" },
        { date: "Nov 2024", teams: "Sri Lanka vs England", score: "356 vs 200", result: "Sri Lanka won by 156 runs" },
        { date: "Sep 2024", teams: "Sri Lanka vs NZ", score: "305/7 vs 278", result: "Sri Lanka won by 27 runs" },
        { date: "Jul 2024", teams: "Sri Lanka vs India", score: "190 vs 240/5", result: "India won by 5 wickets" },
        { date: "Mar 2024", teams: "Sri Lanka vs Bangladesh", score: "375 vs 280", result: "Sri Lanka won by 95 runs" },
    ],
    topPerformers: [
        { name: "Muttiah Muralitharan", country: "Sri Lanka", stat: "188 wickets", highlight: "Most wickets at any venue" },
        { name: "Kumar Sangakkara", country: "Sri Lanka", stat: "2,850 runs", highlight: "Highest scorer at Galle" },
        { name: "Rangana Herath", country: "Sri Lanka", stat: "100 wickets", highlight: "Left-arm spin master" },
        { name: "Jack Leach", country: "England", stat: "42 wickets", highlight: "Top visiting bowler" },
    ],
};

// ═══════════ FOOTBALL ═══════════

export const campNou: VenueAnalysis = {
    id: "camp-nou", name: "Camp Nou", city: "Barcelona", country: "Spain",
    capacity: 99354, sport: "football", established: 1957, nickname: "The Cathedral",
    description: "Europe's largest football stadium, home to FC Barcelona. Currently undergoing a historic renovation to become a 105,000-seat state-of-the-art arena.",
    stats: {
        sport: "football", matchesHosted: 2650, avgGoalsPerMatch: 2.95, homeWinPct: 68, awayWinPct: 16, drawPct: 16,
        biggestHomeWin: { score: "10-1", teams: "Barcelona vs Cultural Leonesa", year: 2014 },
        biggestAwayWin: { score: "1-4", teams: "Barcelona vs Real Madrid", year: 2004 },
        cleanSheetPct: 40, avgAttendance: 80000, penaltiesAwarded: 290, redCards: 195,
        competitionsHosted: ["La Liga", "Champions League", "Copa del Rey", "World Cup 1982", "Olympics 1992"],
    },
    recentMatches: [
        { date: "Feb 2025", teams: "Barcelona vs Atletico Madrid", score: "3-2", result: "Barcelona won" },
        { date: "Jan 2025", teams: "Barcelona vs Real Madrid", score: "2-1", result: "Barcelona won (CDR)" },
        { date: "Dec 2024", teams: "Barcelona vs Bayern Munich", score: "4-1", result: "Barcelona won (UCL)" },
        { date: "Nov 2024", teams: "Barcelona vs Real Sociedad", score: "1-0", result: "Barcelona won" },
        { date: "Oct 2024", teams: "Barcelona vs Sevilla", score: "5-1", result: "Barcelona won" },
    ],
    topPerformers: [
        { name: "Lionel Messi", country: "Argentina", stat: "474 goals", highlight: "All-time top scorer" },
        { name: "Xavi Hernández", country: "Spain", stat: "505 apps", highlight: "Most La Liga appearances" },
        { name: "Andrés Iniesta", country: "Spain", stat: "442 apps", highlight: "Midfield maestro" },
        { name: "Samuel Eto'o", country: "Cameroon", stat: "108 goals", highlight: "Treble hero 2009" },
    ],
};

export const anfield: VenueAnalysis = {
    id: "anfield", name: "Anfield", city: "Liverpool", country: "England",
    capacity: 61276, sport: "football", established: 1884, nickname: "The Fortress",
    description: "Home of Liverpool FC, famous for its electrifying atmosphere and the iconic 'You'll Never Walk Alone' anthem sung by The Kop.",
    stats: {
        sport: "football", matchesHosted: 2100, avgGoalsPerMatch: 2.65, homeWinPct: 62, awayWinPct: 20, drawPct: 18,
        biggestHomeWin: { score: "11-0", teams: "Liverpool vs Stromsgodset", year: 1974 },
        biggestAwayWin: { score: "1-5", teams: "Liverpool vs Arsenal", year: 2014 },
        cleanSheetPct: 36, avgAttendance: 53500, penaltiesAwarded: 220, redCards: 175,
        competitionsHosted: ["Premier League", "Champions League", "FA Cup", "Europa League"],
    },
    recentMatches: [
        { date: "Feb 2025", teams: "Liverpool vs Man City", score: "2-0", result: "Liverpool won" },
        { date: "Jan 2025", teams: "Liverpool vs Arsenal", score: "3-1", result: "Liverpool won" },
        { date: "Dec 2024", teams: "Liverpool vs Everton", score: "4-0", result: "Liverpool won (Derby)" },
        { date: "Nov 2024", teams: "Liverpool vs Real Madrid", score: "2-0", result: "Liverpool won (UCL)" },
        { date: "Oct 2024", teams: "Liverpool vs Chelsea", score: "2-1", result: "Liverpool won" },
    ],
    topPerformers: [
        { name: "Mohamed Salah", country: "Egypt", stat: "176 goals", highlight: "Egyptian King" },
        { name: "Steven Gerrard", country: "England", stat: "186 goals", highlight: "Captain Fantastic" },
        { name: "Kenny Dalglish", country: "Scotland", stat: "172 goals", highlight: "King Kenny" },
        { name: "Ian Rush", country: "Wales", stat: "346 goals", highlight: "All-time record scorer" },
    ],
};

export const maracana: VenueAnalysis = {
    id: "maracana", name: "Maracanã", city: "Rio de Janeiro", country: "Brazil",
    capacity: 78838, sport: "football", established: 1950, nickname: "The Temple of Football",
    description: "Brazil's cathedral of football, built for the 1950 World Cup. Scene of both the greatest triumphs and heartbreaks in football history.",
    stats: {
        sport: "football", matchesHosted: 3200, avgGoalsPerMatch: 2.85, homeWinPct: 55, awayWinPct: 25, drawPct: 20,
        biggestHomeWin: { score: "10-1", teams: "Flamengo vs Madureira", year: 1958 },
        biggestAwayWin: { score: "1-7", teams: "Brazil vs Germany", year: 2014 },
        cleanSheetPct: 30, avgAttendance: 62000, penaltiesAwarded: 400, redCards: 350,
        competitionsHosted: ["Copa Libertadores", "Brasileirão", "World Cup 1950", "World Cup 2014", "Olympics 2016", "Copa América"],
    },
    recentMatches: [
        { date: "Feb 2025", teams: "Flamengo vs Vasco", score: "3-0", result: "Flamengo won" },
        { date: "Jan 2025", teams: "Flamengo vs Palmeiras", score: "2-2", result: "Draw" },
        { date: "Nov 2024", teams: "Brazil vs Colombia", score: "1-0", result: "Brazil won (WC Qualifier)" },
        { date: "Oct 2024", teams: "Fluminense vs Boca Juniors", score: "2-1", result: "Fluminense won (Libertadores)" },
        { date: "Sep 2024", teams: "Brazil vs Argentina", score: "1-1", result: "Draw (WC Qualifier)" },
    ],
    topPerformers: [
        { name: "Zico", country: "Brazil", stat: "333 goals", highlight: "Flamengo's greatest" },
        { name: "Pelé", country: "Brazil", stat: "1,000th goal (1969)", highlight: "Scored milénio" },
        { name: "Romário", country: "Brazil", stat: "204 goals", highlight: "Vasco & Flamengo legend" },
        { name: "Neymar", country: "Brazil", stat: "52 goals", highlight: "Brazil's talisman" },
    ],
};

// ═══════════ BASKETBALL ═══════════

export const unitedCenter: VenueAnalysis = {
    id: "united-center", name: "United Center", city: "Chicago", country: "USA",
    capacity: 20917, sport: "basketball", established: 1994, nickname: "The Madhouse on Madison",
    description: "Home of the Chicago Bulls, forever immortalized by the Michael Jordan dynasty and six championship banners hanging from the rafters.",
    stats: {
        sport: "basketball", matchesHosted: 2400, avgTotalPoints: 205.8, homeWinPct: 58, awayWinPct: 42,
        avgPointDifferential: 5.2,
        highestScoringGame: { score: "156-140", teams: "Bulls vs Hawks", year: 1996 },
        lowestScoringGame: { score: "72-68", teams: "Bulls vs Heat", year: 2004 },
        overtimeGamesPct: 7.8, avgAttendance: 20100, tripleDoubles: 145, buzzerBeaters: 38,
    },
    recentMatches: [
        { date: "Feb 2025", teams: "Bulls vs Cavaliers", score: "108-112", result: "Cavaliers won" },
        { date: "Jan 2025", teams: "Bulls vs Bucks", score: "115-110", result: "Bulls won" },
        { date: "Jan 2025", teams: "Bulls vs 76ers", score: "102-98", result: "Bulls won" },
        { date: "Dec 2024", teams: "Bulls vs Heat", score: "95-104", result: "Heat won" },
        { date: "Dec 2024", teams: "Bulls vs Lakers", score: "118-122 (OT)", result: "Lakers won" },
    ],
    topPerformers: [
        { name: "Michael Jordan", country: "USA", stat: "12,192 pts", highlight: "6x champion, GOAT debates" },
        { name: "Scottie Pippen", country: "USA", stat: "8,312 pts", highlight: "6x champion, MJ's partner" },
        { name: "Derrick Rose", country: "USA", stat: "5,520 pts", highlight: "Youngest MVP (2011)" },
        { name: "Jimmy Butler", country: "USA", stat: "3,840 pts", highlight: "3x All-Star as Bull" },
    ],
};

export const chasecenter: VenueAnalysis = {
    id: "chase-center", name: "Chase Center", city: "San Francisco", country: "USA",
    capacity: 18064, sport: "basketball", established: 2019, nickname: "The Bay's Arena",
    description: "State-of-the-art home of the Golden State Warriors, where Steph Curry's Splash Brothers era continues. The first privately financed NBA arena.",
    stats: {
        sport: "basketball", matchesHosted: 450, avgTotalPoints: 220.5, homeWinPct: 62, awayWinPct: 38,
        avgPointDifferential: 6.5,
        highestScoringGame: { score: "152-148 (2OT)", teams: "Warriors vs Trail Blazers", year: 2023 },
        lowestScoringGame: { score: "88-82", teams: "Warriors vs Grizzlies", year: 2022 },
        overtimeGamesPct: 7.5, avgAttendance: 18064, tripleDoubles: 52, buzzerBeaters: 14,
    },
    recentMatches: [
        { date: "Feb 2025", teams: "Warriors vs Thunder", score: "112-118", result: "Thunder won" },
        { date: "Jan 2025", teams: "Warriors vs Celtics", score: "125-120", result: "Warriors won" },
        { date: "Jan 2025", teams: "Warriors vs Lakers", score: "132-128 (OT)", result: "Warriors won" },
        { date: "Dec 2024", teams: "Warriors vs Nuggets", score: "108-115", result: "Nuggets won" },
        { date: "Dec 2024", teams: "Warriors vs Suns", score: "118-105", result: "Warriors won" },
    ],
    topPerformers: [
        { name: "Stephen Curry", country: "USA", stat: "6,050 pts", highlight: "Greatest shooter ever" },
        { name: "Klay Thompson", country: "USA", stat: "2,890 pts", highlight: "Splash Brother" },
        { name: "Andrew Wiggins", country: "Canada", stat: "2,430 pts", highlight: "2022 champion" },
        { name: "Draymond Green", country: "USA", stat: "1,680 pts", highlight: "Defensive anchor" },
    ],
};

// ═══════════ TENNIS ═══════════

export const usOpen: VenueAnalysis = {
    id: "us-open", name: "Arthur Ashe Stadium", city: "New York", country: "USA",
    capacity: 23771, sport: "tennis", established: 1997, nickname: "The Electric Arena",
    description: "The largest tennis stadium in the world, home of the US Open. Known for its electric night sessions, loud New York crowd, and dramatic finishes.",
    stats: {
        sport: "tennis", surface: "Hard (DecoTurf)", matchesHosted: 3200, avgSetsPerMatch: 3.3, tiebreakPct: 20.5,
        longestMatch: { duration: "5h 26min", players: "Djokovic vs Wawrinka", year: 2013 },
        avgMatchDuration: "2h 05min", upsetPct: 16.8, aceAvgPerMatch: 12.5, fiveSetter: 20,
        mostTitles: { player: "Roger Federer / Pete Sampras", titles: 5 }, grandSlamEdition: 143,
    },
    recentMatches: [
        { date: "Sep 2024", teams: "Sinner vs Fritz", score: "6-3, 6-4, 7-5", result: "Sinner won (Final)" },
        { date: "Sep 2024", teams: "Fritz vs Tiafoe", score: "4-6, 7-5, 4-6, 6-4, 6-1", result: "Fritz won (SF)" },
        { date: "Sep 2024", teams: "Gauff vs Sabalenka", score: "3-6, 6-3, 6-2", result: "Gauff won (QF)" },
        { date: "Sep 2023", teams: "Djokovic vs Medvedev", score: "6-3, 7-6, 6-3", result: "Djokovic won (Final)" },
        { date: "Sep 2023", teams: "Gauff vs Sabalenka", score: "2-6, 6-3, 6-2", result: "Gauff won (Final)" },
    ],
    topPerformers: [
        { name: "Roger Federer", country: "Switzerland", stat: "5 titles", highlight: "5 consecutive (2004-08)" },
        { name: "Novak Djokovic", country: "Serbia", stat: "4 titles", highlight: "24th Grand Slam" },
        { name: "Serena Williams", country: "USA", stat: "6 titles", highlight: "Farewell in 2022" },
        { name: "Pete Sampras", country: "USA", stat: "5 titles", highlight: "Night session king" },
    ],
};

export const australianOpen: VenueAnalysis = {
    id: "australian-open", name: "Rod Laver Arena", city: "Melbourne", country: "Australia",
    capacity: 14820, sport: "tennis", established: 1988, nickname: "The Happy Slam",
    description: "Home of the Australian Open, the first Grand Slam of the year. Known for extreme heat, passionate crowds, and Novak Djokovic's dominance.",
    stats: {
        sport: "tennis", surface: "Hard (GreenSet)", matchesHosted: 2900, avgSetsPerMatch: 3.5, tiebreakPct: 19.2,
        longestMatch: { duration: "5h 53min", players: "Djokovic vs Nadal", year: 2012 },
        avgMatchDuration: "2h 15min", upsetPct: 15.5, aceAvgPerMatch: 11.8, fiveSetter: 24,
        mostTitles: { player: "Novak Djokovic", titles: 10 }, grandSlamEdition: 112,
    },
    recentMatches: [
        { date: "Jan 2025", teams: "Sinner vs Zverev", score: "6-3, 7-6, 6-3", result: "Sinner won (Final)" },
        { date: "Jan 2025", teams: "Sabalenka vs Keys", score: "6-1, 2-6, 7-6", result: "Keys won (Final)" },
        { date: "Jan 2025", teams: "Djokovic vs Alcaraz", score: "4-6, 6-4, 6-3, 6-4", result: "Alcaraz won (QF)" },
        { date: "Jan 2024", teams: "Sinner vs Medvedev", score: "3-6, 3-6, 6-4, 6-4, 6-3", result: "Sinner won (Final)" },
        { date: "Jan 2024", teams: "Sabalenka vs Zheng", score: "6-3, 6-2", result: "Sabalenka won (Final)" },
    ],
    topPerformers: [
        { name: "Novak Djokovic", country: "Serbia", stat: "10 titles", highlight: "Most titles in history" },
        { name: "Serena Williams", country: "USA", stat: "7 titles", highlight: "Won while pregnant (2017)" },
        { name: "Roger Federer", country: "Switzerland", stat: "6 titles", highlight: "Tearful 2018 comeback" },
        { name: "Margaret Court", country: "Australia", stat: "11 titles", highlight: "All-time record" },
    ],
};
