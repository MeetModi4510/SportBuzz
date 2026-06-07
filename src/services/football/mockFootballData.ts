export const MOCK_TRANSFERS = [
  {
    player: { id: 278, name: "Kylian Mbappé" },
    update: "2024-06-03T00:00:00+00:00",
    transfers: [
      {
        date: "2024-07-01",
        type: "Free",
        teams: {
          in: { id: 541, name: "Real Madrid", logo: "https://media.api-sports.io/football/teams/541.png" },
          out: { id: 85, name: "Paris Saint Germain", logo: "https://media.api-sports.io/football/teams/85.png" }
        }
      }
    ]
  },
  {
    player: { id: 645, name: "Jude Bellingham" },
    update: "2023-06-14T00:00:00+00:00",
    transfers: [
      {
        date: "2023-07-01",
        type: "€ 103M",
        teams: {
          in: { id: 541, name: "Real Madrid", logo: "https://media.api-sports.io/football/teams/541.png" },
          out: { id: 165, name: "Borussia Dortmund", logo: "https://media.api-sports.io/football/teams/165.png" }
        }
      }
    ]
  },
  {
    player: { id: 1100, name: "Erling Haaland" },
    update: "2022-06-13T00:00:00+00:00",
    transfers: [
      {
        date: "2022-07-01",
        type: "€ 60M",
        teams: {
          in: { id: 50, name: "Manchester City", logo: "https://media.api-sports.io/football/teams/50.png" },
          out: { id: 165, name: "Borussia Dortmund", logo: "https://media.api-sports.io/football/teams/165.png" }
        }
      }
    ]
  },
  {
    player: { id: 250, name: "Harry Kane" },
    update: "2023-08-12T00:00:00+00:00",
    transfers: [
      {
        date: "2023-08-12",
        type: "€ 95M",
        teams: {
          in: { id: 157, name: "Bayern Munich", logo: "https://media.api-sports.io/football/teams/157.png" },
          out: { id: 47, name: "Tottenham", logo: "https://media.api-sports.io/football/teams/47.png" }
        }
      }
    ]
  },
  {
    player: { id: 759, name: "Declan Rice" },
    update: "2023-07-15T00:00:00+00:00",
    transfers: [
      {
        date: "2023-07-15",
        type: "€ 116M",
        teams: {
          in: { id: 42, name: "Arsenal", logo: "https://media.api-sports.io/football/teams/42.png" },
          out: { id: 48, name: "West Ham", logo: "https://media.api-sports.io/football/teams/48.png" }
        }
      }
    ]
  }
];

export const MOCK_LIVE_MATCHES = [
  {
    fixture: { id: 9991, status: { short: '2H', elapsed: 65 }, date: new Date().toISOString(), venue: { name: "Santiago Bernabéu", city: "Madrid" } },
    league: { id: 140, name: "La Liga", logo: "https://media.api-sports.io/football/leagues/140.png" },
    teams: {
      home: { id: 541, name: "Real Madrid", logo: "https://media.api-sports.io/football/teams/541.png" },
      away: { id: 529, name: "Barcelona", logo: "https://media.api-sports.io/football/teams/529.png" }
    },
    goals: { home: 2, away: 1 }
  },
  {
    fixture: { id: 9992, status: { short: '1H', elapsed: 23 }, date: new Date().toISOString(), venue: { name: "Etihad Stadium", city: "Manchester" } },
    league: { id: 39, name: "Premier League", logo: "https://media.api-sports.io/football/leagues/39.png" },
    teams: {
      home: { id: 50, name: "Manchester City", logo: "https://media.api-sports.io/football/teams/50.png" },
      away: { id: 42, name: "Arsenal", logo: "https://media.api-sports.io/football/teams/42.png" }
    },
    goals: { home: 0, away: 0 }
  }
];

export const MOCK_RECENT_MATCHES = [
  {
    fixture: { id: 9993, status: { short: 'FT' }, date: new Date(Date.now() - 86400000).toISOString(), venue: { name: "Allianz Arena", city: "Munich" } },
    league: { id: 78, name: "Bundesliga", logo: "https://media.api-sports.io/football/leagues/78.png" },
    teams: {
      home: { id: 157, name: "Bayern Munich", logo: "https://media.api-sports.io/football/teams/157.png" },
      away: { id: 165, name: "Borussia Dortmund", logo: "https://media.api-sports.io/football/teams/165.png" }
    },
    goals: { home: 3, away: 1 }
  }
];

export const MOCK_UPCOMING_MATCHES = [
  {
    fixture: { id: 9994, status: { short: 'NS' }, date: new Date(Date.now() + 86400000).toISOString(), venue: { name: "San Siro", city: "Milan" } },
    league: { id: 135, name: "Serie A", logo: "https://media.api-sports.io/football/leagues/135.png" },
    teams: {
      home: { id: 505, name: "Inter", logo: "https://media.api-sports.io/football/teams/505.png" },
      away: { id: 496, name: "Juventus", logo: "https://media.api-sports.io/football/teams/496.png" }
    },
    goals: { home: null, away: null }
  }
];
