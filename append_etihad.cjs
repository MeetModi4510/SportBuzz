const fs = require('fs');
const etihadCode = `
export const etihad: VenueAnalysis = {
    id: "etihad",
    name: "Etihad Stadium",
    city: "Manchester",
    country: "England",
    capacity: 52900,
    sport: "football",
    league: "Premier League",
    established: 1999,
    nickname: "City of Manchester",
    description: "Home of Manchester City, a modern fortress known for breathtaking football and numerous Premier League titles under Pep Guardiola.",
    image: "/images/venues/etihad.jpg",
    gallery: [
        "/gallery/etihad/1.png",
        "/gallery/etihad/2.png",
        "/gallery/etihad/3.png",
        "/gallery/etihad/4.png"
    ],
    stats: {
        sport: "football",
        isBDFutbol: true,
        bdfutbolId: "2002",
        matchesHosted: 527,
        architect: "Arup",
        dimensions: "105x68",
        clubs: 95,
        seasons: 23,
        locationCoords: [53.483, -2.2],
        locationText: "Manchester (England)",
        finalsPlayed: "Europa League 14/05/2008 Zenit 2 - 0 Rangers",
        homeTeams: [
            { name: "Manchester City", matches: 526 }
        ],
        historicalNames: [
            { name: "City of Manchester", period: "<2010" },
            { name: "Etihad Stadium", period: ">2011" }
        ],
        seasonsList: [
            { year: "2025-26", matches: 24 },
            { year: "2024-25", matches: 24 },
            { year: "2023-24", matches: 24 },
            { year: "2022-23", matches: 25 },
            { year: "2021-22", matches: 25 },
            { year: "2020-21", matches: 24 },
            { year: "2019-20", matches: 23 }
        ],
        competitions: [
            { name: "Premier League", matches: 437 },
            { name: "Champions League", matches: 71 },
            { name: "Europa League", matches: 19 }
        ],
        visitingTeams: [
            { name: "Liverpool", matches: 24 },
            { name: "Tottenham", matches: 24 },
            { name: "Arsenal", matches: 23 },
            { name: "Chelsea", matches: 23 },
            { name: "Manchester United", matches: 23 },
            { name: "Everton", matches: 23 },
            { name: "Newcastle", matches: 21 },
            { name: "Aston Villa", matches: 20 },
            { name: "West Ham", matches: 20 },
            { name: "Fulham", matches: 17 }
        ],
        topVisitors: [
            { equip: "Liverpool", partits: 24 },
            { equip: "Tottenham", partits: 24 },
            { equip: "Arsenal", partits: 23 },
            { equip: "Chelsea", partits: 23 },
            { equip: "Man Utd", partits: 23 },
            { equip: "Everton", partits: 23 },
            { equip: "Newcastle", partits: 21 },
            { equip: "Aston Villa", partits: 20 },
            { equip: "West Ham", partits: 20 },
            { equip: "Fulham", partits: 17 }
        ]
    } as BDFutbolVenueStats,
    recentMatches: [
        { date: "Feb 2025", teams: "Man City vs Arsenal", score: "2-0", result: "Man City won" },
        { date: "Jan 2025", teams: "Man City vs Chelsea", score: "3-1", result: "Man City won" },
        { date: "Jan 2025", teams: "Man City vs Real Madrid", score: "4-0", result: "Man City won" },
        { date: "Dec 2024", teams: "Man City vs Liverpool", score: "1-1", result: "Draw" },
        { date: "Dec 2024", teams: "Man City vs Aston Villa", score: "3-0", result: "Man City won" }
    ],
    topPerformers: [
        { name: "Sergio Agüero", country: "Argentina", stat: "106 goals", highlight: "All-time top scorer" },
        { name: "Kevin De Bruyne", country: "Belgium", stat: "150+ assists", highlight: "Assist King" },
        { name: "David Silva", country: "Spain", stat: "436 apps", highlight: "Midfield Maestro" },
        { name: "Erling Haaland", country: "Norway", stat: "60+ goals", highlight: "Goal Machine" }
    ]
};
`;
fs.appendFileSync('src/data/venueExtras.ts', etihadCode);
console.log('Appended etihad correctly to venueExtras.ts');
