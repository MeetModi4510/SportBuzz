import axios from 'axios';

const TRANSFERS_API_KEY = process.env.VITE_FOOTBALL_TRANSFERS_API_KEY || '982d5ee668msh085573a4a340b18p114ab3jsn335eb6f0210c';
const TRANSFERS_API_HOST = 'fotmob-api.p.rapidapi.com';

const transfersApiClient = axios.create({
  baseURL: `https://${TRANSFERS_API_HOST}`,
  headers: {
    'x-rapidapi-host': TRANSFERS_API_HOST,
    'x-rapidapi-key': TRANSFERS_API_KEY,
  },
});

export const PRIORITY_CLUBS = [
  'arsenal', 'aston villa', 'bournemouth', 'brentford', 'brighton', 'chelsea', 'crystal palace', 'everton', 'fulham', 'liverpool', 'luton', 'man city', 'manchester city', 'man united', 'manchester united', 'newcastle', 'nottm forest', 'nottingham forest', 'sheff utd', 'sheffield united', 'tottenham', 'spurs', 'west ham', 'wolves',
  'athletic club', 'atletico madrid', 'barcelona', 'real madrid', 'real sociedad', 'sevilla', 'valencia', 'villarreal', 'girona', 'betis',
  'ac milan', 'inter', 'juventus', 'napoli', 'roma', 'lazio', 'atalanta', 'fiorentina', 'bologna',
  'bayern munich', 'dortmund', 'bayer leverkusen', 'rb leipzig', 'eintracht frankfurt', 'stuttgart',
  'psg', 'paris saint-germain', 'monaco', 'marseille', 'lyon', 'lille', 'lens',
  'al nassr', 'al hilal', 'al ittihad', 'al ahli',
  'inter miami', 'lafc', 'la galaxy',
  'ajax', 'psv', 'feyenoord',
  'porto', 'benfica', 'sporting cp', 'sporting lisbon',
  'celtic', 'rangers', 'galatasaray', 'fenerbahce', 'besiktas'
];

async function test() {
  try {
    const response = await transfersApiClient.get('/api/v1/transfers');
    const rawTransfers = response.data?.transfers || [];
    
    console.log(`Total fetched: ${rawTransfers.length}`);
    
    const allTransfers = rawTransfers.map((t: any) => ({
      update: t.transferDate,
      out: t.fromClub || t.fromClubFullName || 'Unknown',
      in: t.toClub || t.toClubFullName || 'Unknown'
    }));

    const priorityTransfers = allTransfers.filter((t: any) => {
      const outName = t.out.toLowerCase();
      const inName = t.in.toLowerCase();
      return PRIORITY_CLUBS.some(club => outName.includes(club) || inName.includes(club));
    });

    console.log(`After priority filter: ${priorityTransfers.length}`);

    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    const recentPriorityTransfers = priorityTransfers.filter((t: any) => {
      const transferDate = new Date(t.update);
      return transferDate >= oneWeekAgo;
    });

    console.log(`After date filter: ${recentPriorityTransfers.length}`);
    
    if (recentPriorityTransfers.length === 0 && priorityTransfers.length > 0) {
        console.log("Dumping priority transfers dates:");
        priorityTransfers.forEach((p: any) => console.log(p.update, p.in, p.out));
    }

  } catch(e: any) {
    console.error("API error", e.message);
  }
}

test();
