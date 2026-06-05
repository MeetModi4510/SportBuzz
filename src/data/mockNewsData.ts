export interface NewsItem {
  id: string;
  title: string;
  snippet: string;
  sport: 'cricket' | 'football' | 'basketball' | 'tennis';
  timestamp: string;
}

export const mockNewsData: NewsItem[] = [
  {
    id: "n1",
    sport: "football",
    title: "Mbappé Stuns Bernabéu with Hattrick",
    snippet: "The French superstar delivers a masterclass performance in the Champions League semi-final against Bayern Munich.",
    timestamp: "2 hours ago",
  },
  {
    id: "n2",
    sport: "cricket",
    title: "Kohli Breaks Another ODI Century Record",
    snippet: "Virat Kohli notches his 51st ODI ton, anchoring India to a historic series win over Australia at the MCG.",
    timestamp: "4 hours ago",
  },
  {
    id: "n3",
    sport: "tennis",
    title: "Alcaraz Edges Djokovic in Wimbledon Epic",
    snippet: "A grueling 5-set thriller ends with Carlos Alcaraz defending his Wimbledon crown in spectacular fashion.",
    timestamp: "5 hours ago",
  },
  {
    id: "n4",
    sport: "basketball",
    title: "Lakers Secure Playoff Spot with Buzzer-Beater",
    snippet: "LeBron James nails a game-winning 3-pointer as the Lakers overcome a 15-point deficit against the Nuggets.",
    timestamp: "8 hours ago",
  },
  {
    id: "n5",
    sport: "football",
    title: "Arsenal Completes Record Signing of Rising Star",
    snippet: "The Gunners strengthen their midfield with a €105m transfer on deadline day, signaling huge title ambitions.",
    timestamp: "12 hours ago",
  },
  {
    id: "n6",
    sport: "cricket",
    title: "England Unveils Radical New Bazball Approach",
    snippet: "Ben Stokes announces aggressive new strategies ahead of the highly anticipated Ashes series against Australia.",
    timestamp: "18 hours ago",
  }
];
