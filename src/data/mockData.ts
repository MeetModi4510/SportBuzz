import { Match, Player, Team, Venue, Sport } from "./types";

// Team logos (using placeholder icons from lucide-react representation)
export const teams: Team[] = [
  // Cricket Teams - International (using country flags)
  { id: "ind", name: "India", shortName: "IND", logo: "in", sport: "cricket", primaryColor: "#0066B3" },
  { id: "aus", name: "Australia", shortName: "AUS", logo: "au", sport: "cricket", primaryColor: "#FFD700" },
  { id: "eng", name: "England", shortName: "ENG", logo: "gb-eng", sport: "cricket", primaryColor: "#CF142B" },
  { id: "pak", name: "Pakistan", shortName: "PAK", logo: "pk", sport: "cricket", primaryColor: "#01411C" },
  { id: "nz", name: "New Zealand", shortName: "NZ", logo: "nz", sport: "cricket", primaryColor: "#000000" },
  { id: "sa", name: "South Africa", shortName: "SA", logo: "za", sport: "cricket", primaryColor: "#007A4D" },

  // IPL Teams - Using API-Sports cricket team IDs (format: cr-{teamId})
  { id: "mi", name: "Mumbai Indians", shortName: "MI", logo: "cr-971", sport: "cricket", primaryColor: "#004BA0" },
  { id: "csk", name: "Chennai Super Kings", shortName: "CSK", logo: "cr-966", sport: "cricket", primaryColor: "#FDB913" },
  { id: "rcb", name: "Royal Challengers Bangalore", shortName: "RCB", logo: "cr-972", sport: "cricket", primaryColor: "#EC1C24" },
  { id: "kkr", name: "Kolkata Knight Riders", shortName: "KKR", logo: "cr-968", sport: "cricket", primaryColor: "#3A225D" },
  { id: "dc", name: "Delhi Capitals", shortName: "DC", logo: "cr-967", sport: "cricket", primaryColor: "#004C93" },
  { id: "srh", name: "Sunrisers Hyderabad", shortName: "SRH", logo: "cr-974", sport: "cricket", primaryColor: "#FF822A" },
  { id: "pbks", name: "Punjab Kings", shortName: "PBKS", logo: "cr-970", sport: "cricket", primaryColor: "#ED1B24" },
  { id: "rr", name: "Rajasthan Royals", shortName: "RR", logo: "cr-973", sport: "cricket", primaryColor: "#e818c2ff" },
  { id: "gt", name: "Gujarat Titans", shortName: "GT", logo: "cr-8133", sport: "cricket", primaryColor: "#1C2033" },
  { id: "lsg", name: "Lucknow Super Giants", shortName: "LSG", logo: "cr-8134", sport: "cricket", primaryColor: "#3AABE5" },

  // Football Teams - International
  { id: "arg", name: "Argentina", shortName: "ARG", logo: "ar", sport: "football", primaryColor: "#75AADB" },
  { id: "fra", name: "France", shortName: "FRA", logo: "fr", sport: "football", primaryColor: "#002395" },
  { id: "bra", name: "Brazil", shortName: "BRA", logo: "br", sport: "football", primaryColor: "#FFDF00" },

  // Football Clubs - Using API-Football team IDs
  { id: "manu", name: "Manchester United", shortName: "MUN", logo: "fb-33", sport: "football", primaryColor: "#DA291C" },
  { id: "liv", name: "Liverpool", shortName: "LIV", logo: "fb-40", sport: "football", primaryColor: "#C8102E" },
  { id: "rma", name: "Real Madrid", shortName: "RMA", logo: "fb-541", sport: "football", primaryColor: "#FEBE10" },
  { id: "bar", name: "Barcelona", shortName: "BAR", logo: "fb-529", sport: "football", primaryColor: "#004D98" },
  { id: "ars", name: "Arsenal", shortName: "ARS", logo: "fb-42", sport: "football", primaryColor: "#EF0107" },
  { id: "mci", name: "Manchester City", shortName: "MCI", logo: "fb-50", sport: "football", primaryColor: "#6CABDD" },
  { id: "che", name: "Chelsea", shortName: "CHE", logo: "fb-49", sport: "football", primaryColor: "#034694" },
  { id: "psg", name: "Paris Saint-Germain", shortName: "PSG", logo: "fb-85", sport: "football", primaryColor: "#004170" },

  // Basketball Teams - International (using country flags)
  { id: "usa-b", name: "USA Basketball", shortName: "USA", logo: "us", sport: "basketball", primaryColor: "#BD1021" },
  { id: "esp-b", name: "Spain Basketball", shortName: "ESP", logo: "es", sport: "basketball", primaryColor: "#C8102E" },
  { id: "fra-b", name: "France Basketball", shortName: "FRA", logo: "fr", sport: "basketball", primaryColor: "#002395" },

  // NBA Teams - Using API-Sports basketball team IDs (format: bb-{teamId})
  { id: "lal", name: "Los Angeles Lakers", shortName: "LAL", logo: "bb-145", sport: "basketball", primaryColor: "#552583" },
  { id: "gsw", name: "Golden State Warriors", shortName: "GSW", logo: "bb-144", sport: "basketball", primaryColor: "#1D428A" },
  { id: "bos", name: "Boston Celtics", shortName: "BOS", logo: "bb-133", sport: "basketball", primaryColor: "#007A33" },
  { id: "mia", name: "Miami Heat", shortName: "MIA", logo: "bb-148", sport: "basketball", primaryColor: "#98002E" },
  { id: "chi", name: "Chicago Bulls", shortName: "CHI", logo: "bb-136", sport: "basketball", primaryColor: "#CE1141" },
  { id: "bkn", name: "Brooklyn Nets", shortName: "BKN", logo: "bb-150", sport: "basketball", primaryColor: "#000000" },

  // Tennis (representing countries for Davis Cup style)
  { id: "esp", name: "Spain", shortName: "ESP", logo: "es", sport: "tennis", primaryColor: "#AA151B" },
  { id: "ser", name: "Serbia", shortName: "SRB", logo: "rs", sport: "tennis", primaryColor: "#C6363C" },
  { id: "sui", name: "Switzerland", shortName: "SUI", logo: "ch", sport: "tennis", primaryColor: "#FF0000" },
  { id: "usa", name: "United States", shortName: "USA", logo: "us", sport: "tennis", primaryColor: "#3C3B6E" },
  { id: "ita", name: "Italy", shortName: "ITA", logo: "it", sport: "tennis", primaryColor: "#009246" },
];

export const venues: Venue[] = [
  { id: "wankhede", name: "Wankhede Stadium", city: "Mumbai", country: "India", capacity: 33000, sport: "cricket" },
  { id: "lords", name: "Lord's", city: "London", country: "England", capacity: 30000, sport: "cricket" },
  { id: "mcg", name: "Melbourne Cricket Ground", city: "Melbourne", country: "Australia", capacity: 100024, sport: "cricket" },
  { id: "old-trafford-f", name: "Old Trafford", city: "Manchester", country: "England", capacity: 74310, sport: "football" },
  { id: "bernabeu", name: "Santiago Bernabéu", city: "Madrid", country: "Spain", capacity: 81044, sport: "football" },
  { id: "staples", name: "Crypto.com Arena", city: "Los Angeles", country: "USA", capacity: 19068, sport: "basketball" },
  { id: "msg", name: "Madison Square Garden", city: "New York", country: "USA", capacity: 19812, sport: "basketball" },
  { id: "wimbledon", name: "All England Club", city: "London", country: "England", capacity: 15000, sport: "tennis" },
  { id: "roland-garros", name: "Roland Garros", city: "Paris", country: "France", capacity: 15225, sport: "tennis" },
];

export const players: Player[] = [
  // ─── CRICKET PLAYERS ───

  // India
  { id: "rohit", name: "Rohit Sharma", teamId: "ind", sport: "cricket", position: "Batsman", rating: 91, stats: { matches: 260, runs: 10850, average: 49.1, strikeRate: 92.0 }, image: "/players/rohit_new.jpg", photo2: "/players/rohit_new.jpg" },
  { id: "gill", name: "Shubman Gill", teamId: "ind", sport: "cricket", position: "Batsman", rating: 88, stats: { matches: 45, runs: 2300, average: 60.5, strikeRate: 102.0 } },
  { id: "cr1", name: "Virat Kohli", teamId: "ind", sport: "cricket", position: "Batsman", rating: 94, stats: { matches: 290, runs: 13900, average: 58.2, strikeRate: 93.8 }, image: "/players/virat_new.jpg", photo: "/players/virat_new.jpg", photo2: "/players/virat_new.jpg", photo3: "/players/virat_new.jpg" },
  { id: "iyer", name: "Shreyas Iyer", teamId: "ind", sport: "cricket", position: "Batsman", rating: 85, stats: { matches: 60, runs: 2400, average: 45.0, strikeRate: 96.0 } },
  { id: "rahul", name: "KL Rahul", teamId: "ind", sport: "cricket", position: "Wicketkeeper", rating: 86, stats: { matches: 75, runs: 2800, average: 46.0, strikeRate: 88.0 } },
  { id: "hardik", name: "Hardik Pandya", teamId: "ind", sport: "cricket", position: "All-Rounder", rating: 89, stats: { matches: 85, runs: 1800, wickets: 80, average: 33.0 } },
  { id: "jadeja", name: "Ravindra Jadeja", teamId: "ind", sport: "cricket", position: "All-Rounder", rating: 90, stats: { matches: 195, runs: 2700, wickets: 215, economy: 4.8 } },
  { id: "axar", name: "Axar Patel", teamId: "ind", sport: "cricket", position: "All-Rounder", rating: 84, stats: { matches: 58, runs: 600, wickets: 65, economy: 4.5 } },
  { id: "kuldeep", name: "Kuldeep Yadav", teamId: "ind", sport: "cricket", position: "Bowler", rating: 87, stats: { matches: 100, wickets: 165, average: 25.5, economy: 5.0 } },
  { id: "bumrah", name: "Jasprit Bumrah", teamId: "mi", sport: "cricket", position: "Bowler", rating: 96, stats: { matches: 120, wickets: 145, economy: 7.39 }, image: "/players/bumrah_new.png" },
  { id: "siraj", name: "Mohammed Siraj", teamId: "ind", sport: "cricket", position: "Bowler", rating: 86, stats: { matches: 40, wickets: 65, average: 28.0, economy: 5.2 } },
  { id: "shami", name: "Mohammed Shami", teamId: "ind", sport: "cricket", position: "Bowler", rating: 89, stats: { matches: 100, wickets: 190, average: 24.5, economy: 5.4 } },
  { id: "pant", name: "Rishabh Pant", teamId: "ind", sport: "cricket", position: "Wicketkeeper", rating: 87, stats: { matches: 35, runs: 1200, average: 34.0, strikeRate: 105.0 } },
  { id: "surya", name: "Suryakumar Yadav", teamId: "ind", sport: "cricket", position: "Batsman", rating: 90, stats: { matches: 60, runs: 2100, average: 40.0, strikeRate: 160.0 } },

  // Australia
  { id: "head", name: "Travis Head", teamId: "aus", sport: "cricket", position: "Batsman", rating: 90, stats: { matches: 65, runs: 2500, average: 42.0, strikeRate: 110.0 } },
  { id: "warner", name: "David Warner", teamId: "aus", sport: "cricket", position: "Batsman", rating: 88, stats: { matches: 160, runs: 6900, average: 45.0, strikeRate: 97.0 } },
  { id: "marsh", name: "Mitchell Marsh", teamId: "aus", sport: "cricket", position: "All-Rounder", rating: 89, stats: { matches: 85, runs: 2800, wickets: 60, strikeRate: 94.0 } },
  { id: "smith", name: "Steve Smith", teamId: "aus", sport: "cricket", position: "Batsman", rating: 92, stats: { matches: 155, runs: 5400, average: 43.5, strikeRate: 88.0 } },
  { id: "labus", name: "Marnus Labuschagne", teamId: "aus", sport: "cricket", position: "Batsman", rating: 87, stats: { matches: 50, runs: 1800, average: 38.0, strikeRate: 85.0 } },
  { id: "maxwell", name: "Glenn Maxwell", teamId: "aus", sport: "cricket", position: "All-Rounder", rating: 88, stats: { matches: 135, runs: 3800, wickets: 70, strikeRate: 150.0 } },
  { id: "stoinis", name: "Marcus Stoinis", teamId: "aus", sport: "cricket", position: "All-Rounder", rating: 85, stats: { matches: 70, runs: 1500, wickets: 50, strikeRate: 95.0 } },
  { id: "carey", name: "Alex Carey", teamId: "aus", sport: "cricket", position: "Wicketkeeper", rating: 84, stats: { matches: 75, runs: 1900, average: 34.0, strikeRate: 88.0 } },
  { id: "cummins", name: "Pat Cummins", teamId: "aus", sport: "cricket", position: "Bowler", rating: 93, stats: { matches: 85, wickets: 140, average: 26.0, economy: 5.1 } },
  { id: "starc", name: "Mitchell Starc", teamId: "aus", sport: "cricket", position: "Bowler", rating: 91, stats: { matches: 120, wickets: 230, average: 23.0, economy: 5.2 } },
  { id: "zampa", name: "Adam Zampa", teamId: "aus", sport: "cricket", position: "Bowler", rating: 89, stats: { matches: 95, wickets: 160, average: 28.0, economy: 5.5 } },
  { id: "hazlewood", name: "Josh Hazlewood", teamId: "aus", sport: "cricket", position: "Bowler", rating: 90, stats: { matches: 85, wickets: 130, average: 25.0, economy: 4.8 } },
  { id: "inglis", name: "Josh Inglis", teamId: "aus", sport: "cricket", position: "Wicketkeeper", rating: 82, stats: { matches: 25, runs: 600, average: 28.0, strikeRate: 98.0 }, isSubstitute: true },
  { id: "green", name: "Cameron Green", teamId: "aus", sport: "cricket", position: "All-Rounder", rating: 86, stats: { matches: 28, runs: 800, wickets: 18, average: 38.0 } },

  // England
  { id: "bairstow", name: "Jonny Bairstow", teamId: "eng", sport: "cricket", position: "Batsman", rating: 87, stats: { matches: 105, runs: 3800, average: 44.0, strikeRate: 103.0 } },
  { id: "malan", name: "Dawid Malan", teamId: "eng", sport: "cricket", position: "Batsman", rating: 86, stats: { matches: 30, runs: 1200, average: 55.0, strikeRate: 96.0 } },
  { id: "root", name: "Joe Root", teamId: "eng", sport: "cricket", position: "Batsman", rating: 89, stats: { matches: 170, runs: 6500, average: 48.0, strikeRate: 86.0 } },
  { id: "stokes", name: "Ben Stokes", teamId: "eng", sport: "cricket", position: "All-Rounder", rating: 91, stats: { matches: 110, runs: 3400, wickets: 80, strikeRate: 95.0 } },
  { id: "buttler", name: "Jos Buttler", teamId: "eng", sport: "cricket", position: "Wicketkeeper", rating: 92, stats: { matches: 175, runs: 5000, average: 40.0, strikeRate: 118.0 } },
  { id: "brook", name: "Harry Brook", teamId: "eng", sport: "cricket", position: "Batsman", rating: 85, stats: { matches: 15, runs: 500, average: 35.0, strikeRate: 98.0 } },
  { id: "moeen", name: "Moeen Ali", teamId: "eng", sport: "cricket", position: "All-Rounder", rating: 84, stats: { matches: 135, runs: 2300, wickets: 105, strikeRate: 100.0 } },
  { id: "livingstone", name: "Liam Livingstone", teamId: "eng", sport: "cricket", position: "All-Rounder", rating: 85, stats: { matches: 20, runs: 600, wickets: 15, strikeRate: 120.0 } },
  { id: "curran", name: "Sam Curran", teamId: "eng", sport: "cricket", position: "All-Rounder", rating: 86, stats: { matches: 30, runs: 400, wickets: 45, economy: 5.8 } },
  { id: "woakes", name: "Chris Woakes", teamId: "eng", sport: "cricket", position: "All-Rounder", rating: 87, stats: { matches: 120, runs: 1400, wickets: 165, economy: 5.4 } },
  { id: "rashid", name: "Adil Rashid", teamId: "eng", sport: "cricket", position: "Bowler", rating: 89, stats: { matches: 130, wickets: 190, average: 32.0, economy: 5.6 } },
  { id: "wood", name: "Mark Wood", teamId: "eng", sport: "cricket", position: "Bowler", rating: 88, stats: { matches: 65, wickets: 75, average: 38.0, economy: 5.5 } },
  { id: "archer", name: "Jofra Archer", teamId: "eng", sport: "cricket", position: "Bowler", rating: 90, stats: { matches: 25, wickets: 45, average: 24.0, economy: 4.9 } },
  { id: "topley", name: "Reece Topley", teamId: "eng", sport: "cricket", position: "Bowler", rating: 83, stats: { matches: 28, wickets: 40, average: 26.0, economy: 5.2 } },

  // Pakistan
  { id: "fakhar", name: "Fakhar Zaman", teamId: "pak", sport: "cricket", position: "Batsman", rating: 86, stats: { matches: 80, runs: 3400, average: 45.0, strikeRate: 92.0 } },
  { id: "imam", name: "Imam-ul-Haq", teamId: "pak", sport: "cricket", position: "Batsman", rating: 84, stats: { matches: 70, runs: 3000, average: 48.0, strikeRate: 82.0 } },
  { id: "babar", name: "Babar Azam", teamId: "pak", sport: "cricket", position: "Batsman", rating: 93, stats: { matches: 112, runs: 5600, average: 56.5, strikeRate: 89.0 } },
  { id: "rizwan", name: "Mohammad Rizwan", teamId: "pak", sport: "cricket", position: "Wicketkeeper", rating: 89, stats: { matches: 70, runs: 2000, average: 38.0, strikeRate: 90.0 } },
  { id: "iftikhar", name: "Iftikhar Ahmed", teamId: "pak", sport: "cricket", position: "Batsman", rating: 83, stats: { matches: 25, runs: 600, average: 34.0, strikeRate: 105.0 } },
  { id: "shadab", name: "Shadab Khan", teamId: "pak", sport: "cricket", position: "All-Rounder", rating: 87, stats: { matches: 70, runs: 800, wickets: 85, economy: 5.1 } },
  { id: "nawaz", name: "Mohammad Nawaz", teamId: "pak", sport: "cricket", position: "All-Rounder", rating: 82, stats: { matches: 35, runs: 400, wickets: 45, economy: 4.9 } },
  { id: "shaheen", name: "Shaheen Afridi", teamId: "pak", sport: "cricket", position: "Bowler", rating: 92, stats: { matches: 50, wickets: 105, average: 23.0, economy: 5.4 } },
  { id: "rauf", name: "Haris Rauf", teamId: "pak", sport: "cricket", position: "Bowler", rating: 88, stats: { matches: 35, wickets: 65, average: 26.0, economy: 5.8 } },
  { id: "naseem", name: "Naseem Shah", teamId: "pak", sport: "cricket", position: "Bowler", rating: 89, stats: { matches: 15, wickets: 35, average: 18.0, economy: 4.8 } },
  { id: "hasan", name: "Hasan Ali", teamId: "pak", sport: "cricket", position: "Bowler", rating: 84, stats: { matches: 65, wickets: 95, average: 30.0, economy: 5.9 } },
  { id: "wasim", name: "Mohammad Wasim Jr", teamId: "pak", sport: "cricket", position: "All-Rounder", rating: 81, stats: { matches: 20, wickets: 28, average: 24.0, economy: 5.2 } },
  { id: "usama", name: "Usama Mir", teamId: "pak", sport: "cricket", position: "Bowler", rating: 80, stats: { matches: 12, wickets: 18, average: 32.0, economy: 6.0 } },

  // New Zealand
  { id: "conway", name: "Devon Conway", teamId: "nz", sport: "cricket", position: "Batsman", rating: 88, stats: { matches: 30, runs: 1400, average: 50.0, strikeRate: 88.0 } },
  { id: "ravindra", name: "Rachin Ravindra", teamId: "nz", sport: "cricket", position: "Batsman", rating: 86, stats: { matches: 25, runs: 900, average: 42.0, strikeRate: 94.0 } },
  { id: "kane", name: "Kane Williamson", teamId: "nz", sport: "cricket", position: "Batsman", rating: 91, stats: { matches: 165, runs: 6700, average: 48.0, strikeRate: 82.0 } },
  { id: "mitchell", name: "Daryl Mitchell", teamId: "nz", sport: "cricket", position: "All-Rounder", rating: 87, stats: { matches: 40, runs: 1500, average: 48.0, strikeRate: 98.0 } },
  { id: "latham", name: "Tom Latham", teamId: "nz", sport: "cricket", position: "Wicketkeeper", rating: 85, stats: { matches: 140, runs: 4000, average: 35.0, strikeRate: 85.0 } },
  { id: "phillips", name: "Glenn Phillips", teamId: "nz", sport: "cricket", position: "All-Rounder", rating: 84, stats: { matches: 35, runs: 900, average: 32.0, strikeRate: 95.0 } },
  { id: "chapman", name: "Mark Chapman", teamId: "nz", sport: "cricket", position: "Batsman", rating: 82, stats: { matches: 20, runs: 500, average: 28.0, strikeRate: 102.0 } },
  { id: "santner", name: "Mitchell Santner", teamId: "nz", sport: "cricket", position: "All-Rounder", rating: 86, stats: { matches: 100, runs: 1300, wickets: 105, economy: 4.8 } },
  { id: "southee", name: "Tim Southee", teamId: "nz", sport: "cricket", position: "Bowler", rating: 89, stats: { matches: 160, wickets: 220, average: 34.0, economy: 5.5 } },
  { id: "boult", name: "Trent Boult", teamId: "nz", sport: "cricket", position: "Bowler", rating: 90, stats: { matches: 110, wickets: 195, average: 24.0, economy: 4.9 } },
  { id: "ferguson", name: "Lockie Ferguson", teamId: "nz", sport: "cricket", position: "Bowler", rating: 87, stats: { matches: 60, wickets: 95, average: 30.0, economy: 5.6 } },
  { id: "henry", name: "Matt Henry", teamId: "nz", sport: "cricket", position: "Bowler", rating: 86, stats: { matches: 80, wickets: 140, average: 26.0, economy: 5.2 } },
  { id: "ish", name: "Ish Sodhi", teamId: "nz", sport: "cricket", position: "Bowler", rating: 83, stats: { matches: 50, wickets: 60, average: 38.0, economy: 5.8 } },

  // South Africa
  { id: "dekock", name: "Quinton de Kock", teamId: "sa", sport: "cricket", position: "Wicketkeeper", rating: 90, stats: { matches: 155, runs: 6700, average: 45.0, strikeRate: 96.0 } },
  { id: "bavuma", name: "Temba Bavuma", teamId: "sa", sport: "cricket", position: "Batsman", rating: 83, stats: { matches: 35, runs: 1200, average: 45.0, strikeRate: 88.0 } },
  { id: "markram", name: "Aiden Markram", teamId: "sa", sport: "cricket", position: "Batsman", rating: 87, stats: { matches: 65, runs: 2000, average: 36.0, strikeRate: 94.0 } },
  { id: "hklaasen", name: "Heinrich Klaasen", teamId: "sa", sport: "cricket", position: "Wicketkeeper", rating: 89, stats: { matches: 50, runs: 1600, average: 42.0, strikeRate: 115.0 } },
  { id: "miller", name: "David Miller", teamId: "sa", sport: "cricket", position: "Batsman", rating: 88, stats: { matches: 165, runs: 4200, average: 42.0, strikeRate: 103.0 } },
  { id: "jansen", name: "Marco Jansen", teamId: "sa", sport: "cricket", position: "All-Rounder", rating: 86, stats: { matches: 25, runs: 500, wickets: 40, strikeRate: 110.0 } },
  { id: "maharaj", name: "Keshav Maharaj", teamId: "sa", sport: "cricket", position: "Bowler", rating: 87, stats: { matches: 45, wickets: 60, average: 30.0, economy: 4.6 } },
  { id: "rabada", name: "Kagiso Rabada", teamId: "sa", sport: "cricket", position: "Bowler", rating: 92, stats: { matches: 95, wickets: 150, average: 27.0, economy: 5.0 } },
  { id: "ngidi", name: "Lungi Ngidi", teamId: "sa", sport: "cricket", position: "Bowler", rating: 85, stats: { matches: 55, wickets: 85, average: 28.0, economy: 5.8 } },
  { id: "coetzee", name: "Gerald Coetzee", teamId: "sa", sport: "cricket", position: "Bowler", rating: 84, stats: { matches: 15, wickets: 32, average: 22.0, economy: 6.2 } },
  { id: "shamsi", name: "Tabraiz Shamsi", teamId: "sa", sport: "cricket", position: "Bowler", rating: 86, stats: { matches: 50, wickets: 75, average: 32.0, economy: 5.4 } },
  { id: "nortje", name: "Anrich Nortje", teamId: "sa", sport: "cricket", position: "Bowler", rating: 88, stats: { matches: 25, wickets: 40, average: 26.0, economy: 5.6 } },
  { id: "phehlukwayo", name: "Andile Phehlukwayo", teamId: "sa", sport: "cricket", position: "All-Rounder", rating: 82, stats: { matches: 78, runs: 900, wickets: 90, economy: 5.8 } },


  // ─── FOOTBALL PLAYERS ───

  // Argentina Squad (World Cup Final)
  { id: "emi-martinez", name: "E. Martínez", teamId: "arg", sport: "football", position: "Goalkeeper", rating: 88, stats: { matches: 26, saves: 45 }, photo: "/images/players/E. Martinez.jpeg", image: "/images/players/E. Martinez.jpeg" },
  { id: "molina", name: "N. Molina", teamId: "arg", sport: "football", position: "Defender", rating: 72, stats: { matches: 20 }, photo: "/images/players/N. Molina.jpeg", image: "/images/players/N. Molina.jpeg" },
  { id: "romero", name: "C. Romero", teamId: "arg", sport: "football", position: "Defender", rating: 75, stats: { matches: 18 }, photo: "fp-1255" },
  { id: "otamendi", name: "N. Otamendi", teamId: "arg", sport: "football", position: "Defender", rating: 73, stats: { matches: 100 }, photo: "fp-215" },
  { id: "tagliafico", name: "N. Tagliafico", teamId: "arg", sport: "football", position: "Defender", rating: 70, stats: { matches: 45 }, photo: "fp-194" },
  { id: "depaul", name: "R. De Paul", teamId: "arg", sport: "football", position: "Midfielder", rating: 78, stats: { matches: 50 }, photo: "fp-216" },
  { id: "enzo", name: "E. Fernández", teamId: "arg", sport: "football", position: "Midfielder", rating: 82, stats: { matches: 10 }, photo: "fp-1475" },
  { id: "macallister", name: "A. Mac Allister", teamId: "arg", sport: "football", position: "Midfielder", rating: 80, stats: { matches: 12 }, photo: "fp-2516" },
  { id: "messi", name: "Lionel Messi", teamId: "arg", sport: "football", position: "Forward", rating: 98, stats: { matches: 172, goals: 98, assists: 55 }, photo: "/images/players/messi_new.png", image: "/images/players/messi_new.png" },
  { id: "alvarez", name: "J. Álvarez", teamId: "arg", sport: "football", position: "Forward", rating: 81, stats: { matches: 15, goals: 7 }, photo: "fp-2397" },
  { id: "dimaria", name: "Á. Di María", teamId: "arg", sport: "football", position: "Midfielder", rating: 85, stats: { matches: 129, goals: 28 }, photo: "/images/players/A. Di Maria.jpeg", image: "/images/players/A. Di Maria.jpeg" },
  { id: "acuna", name: "Marcos Acuña", teamId: "arg", sport: "football", position: "Defender", rating: 70, stats: { matches: 48 }, photo: "fp-192", isSubstitute: true },
  { id: "montiel", name: "G. Montiel", teamId: "arg", sport: "football", position: "Defender", rating: 7.1, stats: { matches: 20 }, photo: "fp-217", isSubstitute: true },
  { id: "lautaro", name: "L. Martínez", teamId: "arg", sport: "football", position: "Forward", rating: 7.4, stats: { matches: 45, goals: 21 }, photo: "fp-176", isSubstitute: true },
  { id: "paredes", name: "L. Paredes", teamId: "arg", sport: "football", position: "Midfielder", rating: 7.2, stats: { matches: 49 }, photo: "fp-208", isSubstitute: true },
  { id: "dybala", name: "P. Dybala", teamId: "arg", sport: "football", position: "Forward", rating: 7.5, stats: { matches: 35 }, photo: "fp-214", isSubstitute: true },
  { id: "lisandro", name: "Lisandro Martínez", teamId: "arg", sport: "football", position: "Defender", rating: 7.6, stats: { matches: 15 }, photo: "fp-1280", isSubstitute: true },
  { id: "rulli", name: "Geronimo Rulli", teamId: "arg", sport: "football", position: "Goalkeeper", rating: 7.0, stats: { matches: 4 }, photo: "fp-500", isSubstitute: true },

  // France Squad (World Cup Final)
  { id: "lloris", name: "Hugo Lloris", teamId: "fra", sport: "football", position: "Goalkeeper", rating: 79, stats: { matches: 145 }, photo: "fp-620" },
  { id: "kounde", name: "J. Koundé", teamId: "fra", sport: "football", position: "Defender", rating: 74, stats: { matches: 18 }, photo: "fp-1324" },
  { id: "varane", name: "R. Varane", teamId: "fra", sport: "football", position: "Defender", rating: 76, stats: { matches: 93 }, photo: "fp-618" },
  { id: "upamecano", name: "D. Upamecano", teamId: "fra", sport: "football", position: "Defender", rating: 75, stats: { matches: 12 }, photo: "fp-337" },
  { id: "theo", name: "T. Hernández", teamId: "fra", sport: "football", position: "Defender", rating: 77, stats: { matches: 12 }, photo: "fp-593" },
  { id: "tchouameni", name: "A. Tchouaméni", teamId: "fra", sport: "football", position: "Midfielder", rating: 78, stats: { matches: 20 }, photo: "fp-1563" },
  { id: "rabiot", name: "Adrien Rabiot", teamId: "fra", sport: "football", position: "Midfielder", rating: 76, stats: { matches: 35 }, photo: "fp-619" },
  { id: "dembele", name: "O. Dembélé", teamId: "fra", sport: "football", position: "Forward", rating: 72, stats: { matches: 30 }, photo: "fp-616" },
  { id: "griezmann", name: "A. Griezmann", teamId: "fra", sport: "football", position: "Forward", rating: 83, stats: { matches: 117, goals: 42 }, photo: "fp-617" },
  { id: "fb1", name: "Kylian Mbappe", teamId: "fra", sport: "football", position: "Forward", rating: 80, stats: { matches: 66, goals: 36 }, photo: "fp-1396", image: "/images/players/mbappe_headshot.png" },
  { id: "giroud", name: "Olivier Giroud", teamId: "fra", sport: "football", position: "Forward", rating: 75, stats: { matches: 120, goals: 53 }, photo: "fp-624" },
  { id: "thuram", name: "Marcus Thuram", teamId: "fra", sport: "football", position: "Forward", rating: 74, stats: { matches: 9 }, photo: "fp-628", isSubstitute: true },
  { id: "kolomuani", name: "R. Kolo Muani", teamId: "fra", sport: "football", position: "Forward", rating: 76, stats: { matches: 5 }, photo: "fp-1250", isSubstitute: true },
  { id: "camavinga", name: "E. Camavinga", teamId: "fra", sport: "football", position: "Midfielder", rating: 75, stats: { matches: 6 }, photo: "fp-1566", isSubstitute: true },
  { id: "konate", name: "I. Konaté", teamId: "fra", sport: "football", position: "Defender", rating: 73, stats: { matches: 7 }, photo: "fp-582", isSubstitute: true },
  { id: "coman", name: "K. Coman", teamId: "fra", sport: "football", position: "Forward", rating: 72, stats: { matches: 46 }, photo: "fp-612", isSubstitute: true },
  { id: "saliba", name: "William Saliba", teamId: "fra", sport: "football", position: "Defender", rating: 75, stats: { matches: 8 }, photo: "fp-1500", isSubstitute: true },
  { id: "fofana", name: "Y. Fofana", teamId: "fra", sport: "football", position: "Midfielder", rating: 70, stats: { matches: 10 }, photo: "fp-1510", isSubstitute: true },

  // Manchester City
  { id: "fb2", name: "Erling Haaland", teamId: "mci", sport: "football", position: "Forward", rating: 97, stats: { matches: 89, goals: 91, assists: 14, rating: 8.6 }, photo: "fp-1100", image: "/images/players/haaland_headshot.png" },
  { id: "debruyne", name: "Kevin De Bruyne", teamId: "mci", sport: "football", position: "Midfielder", rating: 93, stats: { matches: 382, goals: 90, assists: 152, rating: 8.4 }, photo: "fp-629" },
  { id: "rodri", name: "Rodri", teamId: "mci", sport: "football", position: "Midfielder", rating: 92, stats: { matches: 200, goals: 20, assists: 25 }, photo: "fp-1600" },
  { id: "foden", name: "Phil Foden", teamId: "mci", sport: "football", position: "Midfielder", rating: 89, stats: { matches: 150, goals: 50, assists: 40 }, photo: "fp-1601" },
  { id: "bernardo", name: "Bernardo Silva", teamId: "mci", sport: "football", position: "Midfielder", rating: 88, stats: { matches: 300, goals: 55, assists: 60 }, photo: "fp-1602" },
  { id: "dias", name: "Ruben Dias", teamId: "mci", sport: "football", position: "Defender", rating: 89, stats: { matches: 150, goals: 5 }, photo: "fp-1603" },
  { id: "walker", name: "Kyle Walker", teamId: "mci", sport: "football", position: "Defender", rating: 86, stats: { matches: 250, goals: 6 }, photo: "fp-1604" },
  { id: "ederson", name: "Ederson", teamId: "mci", sport: "football", position: "Goalkeeper", rating: 88, stats: { matches: 300, saves: 600 }, photo: "fp-1605" },

  // Liverpool
  { id: "salah", name: "Mohamed Salah", teamId: "liv", sport: "football", position: "Forward", rating: 92, stats: { matches: 352, goals: 211, assists: 89, rating: 8.2 }, photo: "fp-306" },
  { id: "virgil", name: "Virgil van Dijk", teamId: "liv", sport: "football", position: "Defender", rating: 90, stats: { matches: 250, goals: 20 }, photo: "fp-1700" },
  { id: "alisson", name: "Alisson Becker", teamId: "liv", sport: "football", position: "Goalkeeper", rating: 89, stats: { matches: 250, saves: 700 }, photo: "fp-1701" },
  { id: "trent", name: "Trent Alexander-Arnold", teamId: "liv", sport: "football", position: "Defender", rating: 87, stats: { matches: 300, goals: 18, assists: 80 }, photo: "fp-1702" },
  { id: "macallister-liv", name: "Alexis Mac Allister", teamId: "liv", sport: "football", position: "Midfielder", rating: 85, stats: { matches: 40, goals: 6 }, photo: "fp-1703" },
  { id: "szoboszlai", name: "Dominik Szoboszlai", teamId: "liv", sport: "football", position: "Midfielder", rating: 84, stats: { matches: 35, goals: 5 }, photo: "fp-1704" },
  { id: "nunez", name: "Darwin Nunez", teamId: "liv", sport: "football", position: "Forward", rating: 83, stats: { matches: 60, goals: 30 }, photo: "fp-1705" },
  { id: "diazz", name: "Luis Diaz", teamId: "liv", sport: "football", position: "Forward", rating: 84, stats: { matches: 70, goals: 20 }, photo: "fp-1706" },

  // Real Madrid
  { id: "bellingham", name: "Jude Bellingham", teamId: "rma", sport: "football", position: "Midfielder", rating: 91, stats: { matches: 42, goals: 23, assists: 11, rating: 8.4 }, photo: "fp-162966" },
  { id: "vini", name: "Vinicius Jr", teamId: "rma", sport: "football", position: "Forward", rating: 92, stats: { matches: 200, goals: 70, assists: 60 }, photo: "fp-1800" },
  { id: "fb1", name: "Kylian Mbappe", teamId: "rma", sport: "football", position: "Forward", rating: 96, stats: { matches: 66, goals: 36 }, photo: "fp-1801", image: "/images/players/mbappe_headshot.png" },
  { id: "valverde", name: "Federico Valverde", teamId: "rma", sport: "football", position: "Midfielder", rating: 88, stats: { matches: 200, goals: 20 }, photo: "fp-1802" },
  { id: "courtois", name: "Thibaut Courtois", teamId: "rma", sport: "football", position: "Goalkeeper", rating: 90, stats: { matches: 200, saves: 650 }, photo: "fp-1803" },
  { id: "modric", name: "Luka Modric", teamId: "rma", sport: "football", position: "Midfielder", rating: 87, stats: { matches: 500, goals: 35 }, photo: "fp-1804" },
  { id: "rodrygo", name: "Rodrygo", teamId: "rma", sport: "football", position: "Forward", rating: 86, stats: { matches: 150, goals: 40 }, photo: "fp-1805" },
  { id: "militao", name: "Eder Militao", teamId: "rma", sport: "football", position: "Defender", rating: 86, stats: { matches: 120, goals: 8 }, photo: "fp-1806" },

  // Barcelona
  { id: "lewy", name: "Robert Lewandowski", teamId: "bar", sport: "football", position: "Forward", rating: 90, stats: { matches: 80, goals: 55 }, photo: "fp-1900" },
  { id: "pedri", name: "Pedri", teamId: "bar", sport: "football", position: "Midfielder", rating: 87, stats: { matches: 100, goals: 15 }, photo: "fp-1901" },
  { id: "gavi", name: "Gavi", teamId: "bar", sport: "football", position: "Midfielder", rating: 85, stats: { matches: 90, goals: 8 }, photo: "fp-1902" },
  { id: "yamal", name: "Lamine Yamal", teamId: "bar", sport: "football", position: "Forward", rating: 86, stats: { matches: 40, goals: 10 }, photo: "fp-1903" },
  { id: "araujo", name: "Ronald Araujo", teamId: "bar", sport: "football", position: "Defender", rating: 86, stats: { matches: 110, goals: 7 }, photo: "fp-1904" },
  { id: "dejong", name: "Frenkie de Jong", teamId: "bar", sport: "football", position: "Midfielder", rating: 87, stats: { matches: 180, goals: 16 }, photo: "fp-1905" },
  { id: "terstegen", name: "Marc-Andre ter Stegen", teamId: "bar", sport: "football", position: "Goalkeeper", rating: 89, stats: { matches: 400, saves: 900 }, photo: "fp-1906" },
  { id: "raphinha", name: "Raphinha", teamId: "bar", sport: "football", position: "Forward", rating: 84, stats: { matches: 80, goals: 20 }, photo: "fp-1907" },



  // Basketball Players
  { id: "bb1", name: "LeBron James", teamId: "usa", sport: "basketball", position: "Forward", rating: 97, stats: { matches: 1421, points: 38652, assists: 10420 }, image: "/images/players/lebron_trending.jpg" },
  { id: "curry", name: "Stephen Curry", teamId: "gsw", sport: "basketball", position: "Guard", rating: 94, stats: { matches: 956, points: 23670, threePointers: 3747, assists: 5445 } },
  { id: "tatum", name: "Jayson Tatum", teamId: "bos", sport: "basketball", position: "Forward", rating: 91, stats: { matches: 495, points: 11892, rebounds: 3421, assists: 2198 } },

  // Tennis Players
  { id: "tn1", name: "Novak Djokovic", teamId: "srb", sport: "tennis", position: "Singles", rating: 97, stats: { matches: 1234, wins: 1068, title: "24 Grand Slams" }, image: "/images/players/djokovic_trending.png" },
  { id: "alcaraz", name: "Carlos Alcaraz", teamId: "esp", sport: "tennis", position: "Singles", rating: 94, stats: { matches: 187, wins: 152, grandSlams: 4, aces: 1234 } },
  { id: "sinner", name: "Jannik Sinner", teamId: "ita", sport: "tennis", position: "Singles", rating: 93, stats: { matches: 245, wins: 189, grandSlams: 2, aces: 1567 } },
];

// Helper functions to prevent crashes if IDs are missing
const safeGetTeam = (id: string) => teams.find(t => t.id === id) || teams[0];
const safeGetVenue = (id: string) => venues.find(v => v.id === id) || venues[0];

export const matches: Match[] = [
  // Football Matches (adding international ones)
  {
    id: "f4",
    sport: "football",
    homeTeam: safeGetTeam("arg"),
    awayTeam: safeGetTeam("fra"),
    homeScore: "3 (4)",
    awayScore: "3 (2)",
    status: "completed",
    startTime: new Date("2022-12-18T15:00:00Z"),
    venue: { id: "lusail", name: "Lusail Stadium", city: "Lusail", country: "Qatar", capacity: 88966, sport: "football" },
    matchType: "World Cup Final",
    referee: "Szymon Marciniak (Poland)",
    attendance: "88,966",
    manOfTheMatch: { id: "messi", name: "Lionel Messi" },
    summaryText: "Argentina defeated France 4-2 on penalties to win their third World Cup title after a thrilling 3-3 draw. Lionel Messi scored twice and Angel Di Maria once for Argentina, while Kylian Mbappe became the second player to score a hat-trick in a World Cup final. The match is widely regarded as one of the greatest World Cup finals of all time.",
    goals: [
      { teamId: "arg", player: "L. Messi", minute: 23, type: 'penalty' },
      { teamId: "arg", player: "A. Di María", minute: 36, assist: "A. Mac Allister" },
      { teamId: "fra", player: "K. Mbappé", minute: 80, type: 'penalty' },
      { teamId: "fra", player: "K. Mbappé", minute: 81, assist: "M. Thuram" },
      { teamId: "arg", player: "L. Messi", minute: 108 },
      { teamId: "fra", player: "K. Mbappé", minute: 118, type: 'penalty' },
    ],
    events: [
      { id: "e1", matchId: "f4", time: "1'", type: "info", shortDescription: "Kick-off at Lusail Stadium.", description: "The referee blows the whistle and the 2022 World Cup Final is underway at the magnificent Lusail Stadium! Argentina kick us off in their traditional sky blue and white stripes, while France are in all dark blue.", playerId: "" },
      { id: "e1b", matchId: "f4", time: "5'", type: "save", shortDescription: "Mac Allister shot saved by Lloris.", description: "First shot on target! Alexis Mac Allister finds pockets of space just outside the box and unleashes a firm drive, but Hugo Lloris is well-positioned to gather it comfortably.", playerId: "Alexis Mac Allister" },
      { id: "e1c", matchId: "f4", time: "8'", type: "foul", shortDescription: "Foul by Rabiot on De Paul.", description: "Rodrigo De Paul is fouled by Adrien Rabiot. A tactical foul to break up Argentina's rhythm as they looked to counter-attack swiftly.", playerId: "Rodrigo De Paul" },
      { id: "e1d", matchId: "f4", time: "17'", type: "info", shortDescription: "Argentina dominating early possession.", description: "Argentina are dominating possession in these opening stages. France appear uncharacteristically nervous, struggling to string passes together against Argentina's high press.", playerId: "" },
      { id: "e1e", matchId: "f4", time: "21'", type: "foul", shortDescription: "Penalty to Argentina! Di Maria fouled.", description: "PENALTY TO ARGENTINA! Angel Di Maria beats Ousmane Dembele with a clever turn on the left flank and cuts into the box. Dembele clips his heels, and the referee points straight to the spot!", playerId: "Ousmane Dembélé" },
      { id: "e1", matchId: "f4", time: "23'", type: "goal", shortDescription: "GOAL! Messi scores pen. 1-0.", description: "GOAL! Lionel Messi steps up and sends Lloris the wrong way! He rolls the ball coolly into the bottom right corner. Argentina 1-0 France! The stadium erupts!", playerId: "Lionel Messi" },
      { id: "e1f", matchId: "f4", time: "27'", type: "info", shortDescription: "Varane clears dangerous free-kick.", description: "CLOSE! Messi whips in a dangerous free-kick from the right. It causes chaos in the box, but Raphael Varane rises highest to head it clear just before Romero could connect.", playerId: "Lionel Messi" },
      { id: "e2", matchId: "f4", time: "36'", type: "goal", shortDescription: "GOAL! Di Maria finishes counter. 2-0.", description: "GOAL! ARGENTINA LEAD 2-0! One of the greatest World Cup final goals! A breathtaking counter-attack involving Messi, Alvarez, and Mac Allister, who squares it perfectly for Angel Di Maria to sweep home past Lloris!", playerId: "Ángel Di María" },
      { id: "e3", matchId: "f4", time: "41'", type: "substitution", description: "Double substitution for France. Didier Deschamps has seen enough. Olivier Giroud, who has been struggling with a knock, is replaced by Marcus Thuram.", playerId: "Marcus Thuram" },
      { id: "e4", matchId: "f4", time: "41'", type: "substitution", description: "Substitution for France. Ousmane Dembele, who conceded the penalty, is also hauled off. Randal Kolo Muani comes on to inject some pace.", playerId: "Randal Kolo Muani" },
      { id: "e4b", matchId: "f4", time: "45+7'", type: "info", description: "Half-time whistle blows. Argentina 2-0 France. A masterclass from Lionel Scaloni's side. France have failed to register a single shot in the first half - a World Cup final first.", playerId: "" },
      { id: "e4c", matchId: "f4", time: "49'", type: "miss", description: "Argentina start the second half as they ended the first. De Paul connects with a volley at the edge of the box but slices it wide of the post.", playerId: "Rodrigo De Paul" },
      { id: "e4d", matchId: "f4", time: "59'", type: "save", description: "Sharp save from Lloris! Alvarez breaks through on the left and fires a low shot towards the near post, but the French captain gets down quickly to hold it.", playerId: "Julián Álvarez" },
      { id: "e5", matchId: "f4", time: "64'", type: "substitution", description: "Substitution for Argentina. Angel Di Maria receives a standing ovation as he makes way for Marcos Acuna to shore up the defense.", playerId: "Marcos Acuña" },
      { id: "e5b", matchId: "f4", time: "71'", type: "miss", description: "Mbappe finally finds a yard of space! He cuts inside and fires over the bar. It's France's first real attempt on goal, but still no trouble for Emi Martinez.", playerId: "Kylian Mbappé" },
      { id: "e5c", matchId: "f4", time: "79'", type: "foul", description: "PENALTY TO FRANCE! Out of nowhere! Nicolas Otamendi gets tangled with Randal Kolo Muani in the box and drags him down. lifeline for Les Bleus!", playerId: "Nicolás Otamendi" },
      { id: "e6", matchId: "f4", time: "80'", type: "goal", description: "GOAL! Kylian Mbappe steps up... and drills it into the bottom left corner! Martinez guessed right but couldn't reach it. Argentina 2-1 France. Game on!", playerId: "Kylian Mbappé" },
      { id: "e7", matchId: "f4", time: "81'", type: "goal", description: "GOAL! INCREDIBLE! FRANCE ARE LEVEL! Just 97 seconds later! Mbappe plays a one-two with Thuram and hits a sensational first-time volley past Martinez! Argentina 2-2 France!", playerId: "Kylian Mbappé" },
      { id: "e7b", matchId: "f4", time: "87'", type: "foul", shortDescription: "Yellow Card: Thuram (Simulation).", description: "Yellow Card. Marcus Thuram goes down in the box looking for a penalty, but the referee books him for simulation. A clear dive.", playerId: "Marcus Thuram" },
      { id: "e7c", matchId: "f4", time: "90+4'", type: "save", shortDescription: "Lloris saves Messi thunderbolt!", description: "WHAT A SAVE! Messi unleashes a thunderbolt from 20 yards that is destined for the roof of the net, but Lloris produces a stunning fingertip save to tip it over!", playerId: "Hugo Lloris" },
      { id: "e7d", matchId: "f4", time: "FT", type: "info", shortDescription: "Full Time: 2-2. Extra Time.", description: "Full Time. Argentina 2-2 France. An astonishing turnaround from France forces this final into Extra Time. Argentina look shell-shocked.", playerId: "" },
      { id: "e8", matchId: "f4", time: "105'", type: "miss", shortDescription: "Lautaro misses chance.", description: "CHANCE! Lautaro Martinez is played through on goal but hesitate! Upamecano throws himself in the way to make a vital match-saving block.", playerId: "Lautaro Martínez" },
      { id: "e10", matchId: "f4", time: "108'", type: "goal", shortDescription: "GOAL! Messi! 3-2.", description: "GOAL! ARGENTINA LEAD AGAIN! Lloris saves the initial shot from Lautaro, but Messi is there to bundle the rebound over the line! Kounde tries to clear it but it's clearly over! 3-2!", playerId: "Lionel Messi" },
      { id: "e10b", matchId: "f4", time: "116'", type: "foul", shortDescription: "Penalty to France! Handball.", description: "PENALTY TO FRANCE! Mbappe's shot strikes the arm of Gonzalo Montiel in the box. A hat-trick of penalties in this final!", playerId: "Gonzalo Montiel" },
      { id: "e11", matchId: "f4", time: "118'", type: "goal", shortDescription: "GOAL! Mbappe Hat-trick! 3-3.", description: "GOAL! MBAPPE! He sends Martinez the wrong way again! He becomes the second player ever to score a hat-trick in a World Cup final! 3-3!", playerId: "Kylian Mbappé" },
      { id: "e12", matchId: "f4", time: "120+3'", type: "save", shortDescription: "EMI MARTINEZ SAVES FROM KOLO MUANI!", description: "SAVE OF THE CENTURY! Randal Kolo Muani is through on goal with seconds remaining... he shoots... BUT EMI MARTINEZ SPREADS HIMSELF AND SAVES WITH HIS LEG! UNBELIEVABLE!", playerId: "Emiliano Martínez" }
    ],
    detailedStats: [
      {
        category: "General",
        stats: [
          { label: "Possession", home: 54, away: 46, unit: "%" },
          { label: "Duels Won", home: 58, away: 42, unit: "%" },
          { label: "Aerials Won", home: 45, away: 55, unit: "%" },
        ]
      },
      {
        category: "Attack",
        stats: [
          { label: "Shots", home: 20, away: 10 },
          { label: "Shots on Target", home: 10, away: 5 },
          { label: "Corners", home: 6, away: 5 },
          { label: "Offsides", home: 4, away: 4 },
        ]
      },
      {
        category: "Defense",
        stats: [
          { label: "Tackles", home: 22, away: 28 },
          { label: "Interceptions", home: 12, away: 15 },
          { label: "Clearances", home: 18, away: 24 },
          { label: "Saves", home: 2, away: 7 },
        ]
      },
      {
        category: "Discipline",
        stats: [
          { label: "Fouls", home: 26, away: 19 },
          { label: "Yellow Cards", home: 5, away: 3 },
          { label: "Red Cards", home: 0, away: 0 },
        ]
      },
      {
        category: "Passing",
        stats: [
          { label: "Passes", home: 635, away: 524 },
          { label: "Passing Acc.", home: 84, away: 82, unit: "%" },
          { label: "Crosses", home: 18, away: 16 },
        ]
      }
    ]
  },
  {
    id: "f1",
    sport: "football",
    homeTeam: safeGetTeam("manu"),
    awayTeam: safeGetTeam("liv"),
    homeScore: "2",
    awayScore: "1",
    status: "live",
    venue: safeGetVenue("old-trafford-f"),
    startTime: new Date(),
    matchType: "Premier League",
    currentMinute: "67'",
  },
  {
    id: "f2",
    sport: "football",
    homeTeam: safeGetTeam("rma"),
    awayTeam: safeGetTeam("bar"),
    homeScore: "0",
    awayScore: "0",
    status: "upcoming",
    venue: safeGetVenue("bernabeu"),
    startTime: new Date(Date.now() + 86400000),
    matchType: "La Liga",
  },
  {
    id: "f3",
    sport: "football",
    homeTeam: safeGetTeam("mci"),
    awayTeam: safeGetTeam("ars"),
    homeScore: "3",
    awayScore: "2",
    status: "completed",
    venue: safeGetVenue("old-trafford-f"),
    startTime: new Date(Date.now() - 86400000),
    matchType: "Premier League",
  },

  // Basketball Matches
  {
    id: "b1",
    sport: "basketball",
    homeTeam: safeGetTeam("lal"),
    awayTeam: safeGetTeam("gsw"),
    homeScore: "98",
    awayScore: "102",
    status: "live",
    venue: safeGetVenue("staples"),
    startTime: new Date(),
    matchType: "NBA Regular Season",
    currentQuarter: "Q4",
    timeRemaining: "4:32",
  },
  {
    id: "b2",
    sport: "basketball",
    homeTeam: safeGetTeam("bos"),
    awayTeam: safeGetTeam("mia"),
    homeScore: "",
    awayScore: "",
    status: "upcoming",
    venue: safeGetVenue("msg"),
    startTime: new Date(Date.now() + 86400000 * 3),
    matchType: "NBA Playoffs",
  },
  {
    id: "b3",
    sport: "basketball",
    homeTeam: safeGetTeam("chi"),
    awayTeam: safeGetTeam("bkn"),
    homeScore: "112",
    awayScore: "108",
    status: "completed",
    venue: safeGetVenue("msg"),
    startTime: new Date(Date.now() - 86400000 * 2),
    matchType: "NBA Regular Season",
  },

  // Tennis Matches
  {
    id: "t1",
    sport: "tennis",
    homeTeam: { ...safeGetTeam("ser"), name: "N. Djokovic", shortName: "DJO" },
    awayTeam: { ...safeGetTeam("esp"), name: "C. Alcaraz", shortName: "ALC" },
    homeScore: "6-4, 3-2",
    awayScore: "4-6, 2-3",
    status: "live",
    venue: safeGetVenue("wimbledon"),
    startTime: new Date(),
    matchType: "Wimbledon Final",
    currentSet: "Set 2",
  },
  {
    id: "t2",
    sport: "tennis",
    homeTeam: { ...safeGetTeam("ita"), name: "J. Sinner", shortName: "SIN" },
    awayTeam: { ...safeGetTeam("usa"), name: "T. Fritz", shortName: "FRI" },
    homeScore: "",
    awayScore: "",
    status: "upcoming",
    venue: safeGetVenue("roland-garros"),
    startTime: new Date(Date.now() + 86400000 * 4),
    matchType: "French Open SF",
  },
];

export const getMatchesBySport = (sport: Sport) => matches.filter(m => m.sport === sport);
export const getLiveMatches = () => matches.filter(m => m.status === "live");
export const getUpcomingMatches = () => matches.filter(m => m.status === "upcoming");
export const getCompletedMatches = () => matches.filter(m => m.status === "completed");
export const getTeamById = (id: string) => teams.find(t => t.id === id);
export const getPlayersByTeam = (teamId: string) => players.filter(p => p.teamId === teamId);
export const getPlayersBySport = (sport: Sport) => players.filter(p => p.sport === sport);
