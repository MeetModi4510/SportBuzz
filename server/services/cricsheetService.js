import axios from 'axios';
import * as cheerio from 'cheerio';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CACHE_DIR = path.join(__dirname, '../cache/cricsheet');
if (!fs.existsSync(CACHE_DIR)) fs.mkdirSync(CACHE_DIR, { recursive: true });

// ESPN Cricinfo Statsguru team IDs
const ESPNCRICINFO_TEAM_IDS = {
    'india-2': 6, 'australia-4': 2, 'england-9': 1, 'new-zealand-13': 5,
    'south-africa-11': 3, 'pakistan-3': 7, 'sri-lanka-5': 8, 'west-indies-10': 4,
    'bangladesh-6': 25, 'afghanistan-96': 40, 'zimbabwe-12': 9, 'ireland-27': 29,
    'scotland-23': 30, 'netherlands-24': 15, 'nepal-72': 32,
    // IPL Teams
    'Chennai Super Kings': 4343,
    'Deccan Chargers': 4347,
    'Delhi Capitals': 4344,
    'Delhi Daredevils': 4344,
    'Gujarat Lions': 5845,
    'Gujarat Titans': 6904,
    'Kochi Tuskers Kerala': 4788,
    'Kolkata Knight Riders': 4341,
    'Lucknow Super Giants': 6903,
    'Mumbai Indians': 4346,
    'Pune Warriors': 4787,
    'Punjab Kings': 4342,
    'Kings XI Punjab': 4342,
    'Rajasthan Royals': 4345,
    'Rising Pune Supergiant': 5843,
    'Rising Pune Supergiants': 5843,
    'Royal Challengers Bangalore': 4340,
    'Royal Challengers Bengaluru': 4340,
    'Sunrisers Hyderabad': 5143
};
const FORMAT_CLASS = { 't20i': 3, 'odi': 2, 'test': 1 };
const TEAM_NAMES = {
    'india-2': 'India', 'australia-4': 'Australia', 'england-9': 'England', 'new-zealand-13': 'New Zealand',
    'south-africa-11': 'South Africa', 'pakistan-3': 'Pakistan', 'sri-lanka-5': 'Sri Lanka', 'west-indies-10': 'West Indies',
    'bangladesh-6': 'Bangladesh', 'afghanistan-96': 'Afghanistan', 'zimbabwe-12': 'Zimbabwe', 'ireland-27': 'Ireland',
    'scotland-23': 'Scotland', 'netherlands-24': 'Netherlands', 'nepal-72': 'Nepal'
};

const ESPN_HEADERS = { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' };

async function espnGet(url) {
    const { data } = await axios.get(url, { headers: ESPN_HEADERS, timeout: 15000 });
    return cheerio.load(data);
}

/** Fetch overall team record */
async function fetchTeamRecord(espnTeamId, classId) {
    const url = `https://stats.espncricinfo.com/ci/engine/stats/index.html?class=${classId};team=${espnTeamId};template=results;type=team`;
    const $ = await espnGet(url);
    const row = $('table.engineTable').eq(2).find('tr.data1').eq(0);
    const cols = row.find('td');
    return {
        matchesPlayed: parseInt($(cols[2]).text()) || 0,
        won: parseInt($(cols[3]).text()) || 0,
        lost: parseInt($(cols[4]).text()) || 0,
        tied: parseInt($(cols[5]).text()) || 0,
        noResult: parseInt($(cols[6]).text()) || 0,
        highestTotal: parseInt($(cols[10]).text()) || 0,
        lowestTotal: parseInt($(cols[11]).text()) || 0
    };
}

/** Fetch year-by-year */
async function fetchYearByYear(espnTeamId, classId) {
    const url = `https://stats.espncricinfo.com/ci/engine/stats/index.html?class=${classId};team=${espnTeamId};template=results;type=team;view=year`;
    const $ = await espnGet(url);
    const years = [];
    $('table.engineTable').eq(2).find('tr.data1, tr.data2').each((i, row) => {
        const cols = $(row).find('td');
        const year = $(cols[12]).text().trim();
        const mat = parseInt($(cols[1]).text()) || 0;
        const won = parseInt($(cols[2]).text()) || 0;
        const lost = parseInt($(cols[3]).text()) || 0;
        const tied = parseInt($(cols[4]).text()) || 0;
        const drawNr = parseInt($(cols[5]).text()) || 0;
        if (year && mat > 0) years.push({ year, mat, won, lost, tied, drawNr });
    });
    return years.sort((a, b) => b.year - a.year);
}

/** Fetch venues */
async function fetchVenueBreakdown(espnTeamId, classId) {
    const url = `https://stats.espncricinfo.com/ci/engine/stats/index.html?class=${classId};team=${espnTeamId};template=results;type=team;view=ground`;
    const $ = await espnGet(url);
    const venues = [];
    let pendingData = null;
    $('table.engineTable').eq(2).find('tr').each((i, row) => {
        const dataRow = $(row).hasClass('data1') || $(row).hasClass('data2');
        const cols = $(row).find('td');
        
        if (dataRow) {
            const mat = parseInt($(cols[2]).text()) || 0;
            const won = parseInt($(cols[3]).text()) || 0;
            const lost = parseInt($(cols[4]).text()) || 0;
            const tied = parseInt($(cols[5]).text()) || 0;
            const drawNr = parseInt($(cols[6]).text()) || 0;
            pendingData = { mat, won, lost, tied, drawNr };
        } else if (cols.length === 1 && pendingData) {
            const groundName = $(cols[0]).text().trim();
            venues.push({
                ground: groundName,
                mat: pendingData.mat,
                won: pendingData.won,
                lost: pendingData.lost,
                tied: pendingData.tied,
                drawNr: pendingData.drawNr,
                winPct: pendingData.mat > 0 ? Math.round((pendingData.won / pendingData.mat) * 100) : 0
            });
            pendingData = null;
        }
    });
    return venues.sort((a, b) => b.mat - a.mat).slice(0, 10);
}

/** Fetch match list for H2H and Recent Form */
async function fetchMatchesList(espnTeamId, classId) {
    const headToHead = {};
    const recentForm = [];
    let page = 1;
    
    while (true) {
        // Order by start reverse to get recent matches first
        const url = `https://stats.espncricinfo.com/ci/engine/stats/index.html?class=${classId};team=${espnTeamId};template=results;type=team;view=match;orderby=start;orderbyad=reverse;page=${page}`;
        const $ = await espnGet(url);
        const rows = $('table.engineTable').eq(2).find('tr.data1, tr.data2');
        if (rows.length === 0) break;

        rows.each((i, row) => {
            const cols = $(row).find('td');
            let opponent = $(cols[8]).text().trim().replace(/^v\s+/, '');
            const result = $(cols[6]).text().trim().toLowerCase();
            
            // Collect recent form from the first 10 rows of the first page
            if (page === 1 && i < 10 && ['won','lost','tied','n/r','draw','drawn'].includes(result)) {
                recentForm.push(result === 'n/r' ? 'NR' : result === 'won' ? 'W' : result === 'lost' ? 'L' : ['draw','drawn'].includes(result) ? 'D' : 'T');
            }

            if (!opponent) return;
            if (!headToHead[opponent]) headToHead[opponent] = { played: 0, won: 0, lost: 0, tied: 0, drawNr: 0 };
            headToHead[opponent].played++;
            if (result === 'won') headToHead[opponent].won++;
            else if (result === 'lost') headToHead[opponent].lost++;
            else if (result === 'tied') headToHead[opponent].tied++;
            else if (['draw', 'n/r', 'drawn'].includes(result)) headToHead[opponent].drawNr++;
        });

        const pageText = $('table.engineTable').eq(3).text();
        const pageMatch = pageText.match(/Page (\d+) of (\d+)/);
        if (!pageMatch || parseInt(pageMatch[1]) >= parseInt(pageMatch[2])) break;
        page++;
    }

    return { headToHead, recentForm: recentForm.reverse() }; // chronologically oldest to newest
}

/** Fetch Batting First / Chasing */
async function fetchBattingFirstVsChasing(espnTeamId, classId) {
    const fetchStats = async (battedOrFieldedFirst) => {
        const url = `https://stats.espncricinfo.com/ci/engine/stats/index.html?batting_fielding_first=${battedOrFieldedFirst};class=${classId};team=${espnTeamId};template=results;type=team`;
        const $ = await espnGet(url);
        const row = $('table.engineTable').eq(2).find('tr.data1').eq(0);
        if (row.length === 0) return { matches: 0, won: 0 };
        const cols = row.find('td');
        return {
            matches: parseInt($(cols[2]).text()) || 0,
            won: parseInt($(cols[3]).text()) || 0
        };
    };
    return {
        battingFirst: await fetchStats(1),
        chasing: await fetchStats(2)
    };
}

/** Fetch Top Run Scorers */
async function fetchTopRunScorers(espnTeamId, classId) {
    const url = `https://stats.espncricinfo.com/ci/engine/stats/index.html?class=${classId};team=${espnTeamId};template=results;type=batting`;
    const $ = await espnGet(url);
    const results = [];
    $('table.engineTable').eq(2).find('tr.data1').each((i, el) => {
        if (i >= 15) return false;
        const rawName = $(el).find('td').eq(0).find('a').first().text().trim() || $(el).find('td').eq(0).text().trim();
        const name = getFullName(rawName);
        const matches = parseInt($(el).find('td').eq(2).text());
        const runs = parseInt($(el).find('td').eq(5).text().replace(/,/g, ''));
        const hs = $(el).find('td').eq(6).text().trim();
        const avg = parseFloat($(el).find('td').eq(7).text());
        const sr = parseFloat($(el).find('td').eq(9).text());
        if (name && !isNaN(runs) && runs > 0) results.push({ name, runs, matches, hs, avg, sr });
    });
    return results;
}

/** Fetch Top Wicket Takers */
async function fetchTopWicketTakers(espnTeamId, classId) {
    const url = `https://stats.espncricinfo.com/ci/engine/stats/index.html?class=${classId};team=${espnTeamId};template=results;type=bowling`;
    const $ = await espnGet(url);
    const results = [];
    $('table.engineTable').eq(2).find('tr.data1').each((i, el) => {
        if (i >= 15) return false;
        const rawName = $(el).find('td').eq(0).find('a').first().text().trim() || $(el).find('td').eq(0).text().trim();
        const name = getFullName(rawName);
        let wktCol, bbiCol, avgCol, econCol;
        if (String(classId) === '1') { // Test
            wktCol = 6; bbiCol = 7; avgCol = 9; econCol = 10;
        } else if (String(classId) === '2') { // ODI
            wktCol = 6; bbiCol = 7; avgCol = 8; econCol = 9;
        } else { // T20I
            wktCol = 7; bbiCol = 8; avgCol = 9; econCol = 10;
        }
        
        const matches = parseInt($(el).find('td').eq(2).text());
        const wickets = parseInt($(el).find('td').eq(wktCol).text().replace(/,/g, ''));
        const bbi = $(el).find('td').eq(bbiCol).text().trim();
        const avg = parseFloat($(el).find('td').eq(avgCol).text());
        const econ = parseFloat($(el).find('td').eq(econCol).text());
        if (name && !isNaN(wickets) && wickets > 0) results.push({ name, wickets, matches, bbi, avg, econ });
    });
    return results;
}

/** Fetch All-Time IPL Top Run Scorers (Trophy=117) */
async function fetchAllTimeIplScorers(espnTeamId) {
    const url = `https://stats.espncricinfo.com/ci/engine/stats/index.html?class=6;team=${espnTeamId};template=results;trophy=117;type=batting`;
    const $ = await espnGet(url);
    const results = [];
    $('table.engineTable').eq(2).find('tr.data1').each((i, el) => {
        if (i >= 50) return false; // Fetch up to 50 players
        const tds = $(el).find('td');
        const rawName = tds.eq(0).find('a').first().text().trim() || tds.eq(0).text().trim();
        const name = getFullName(rawName);
        const matches = parseInt(tds.eq(2).text()) || 0;
        const runs = parseInt(tds.eq(5).text().replace(/,/g, '')) || 0;
        const hs = tds.eq(6).text().trim();
        const avg = parseFloat(tds.eq(7).text()) || 0;
        const sr = parseFloat(tds.eq(9).text()) || 0;
        const hundreds = parseInt(tds.eq(10).text()) || 0;
        const fifties = parseInt(tds.eq(11).text()) || 0;
        const fours = parseInt(tds.eq(13).text()) || 0;
        const sixes = parseInt(tds.eq(14).text()) || 0;
        if (name && !isNaN(runs) && runs > 0) results.push({ name, runs, matches, hs, avg, sr, hundreds, fifties, fours, sixes });
    });
    return results;
}

/** Fetch All-Time IPL Top Wicket Takers (Trophy=117) */
async function fetchAllTimeIplWickets(espnTeamId) {
    const url = `https://stats.espncricinfo.com/ci/engine/stats/index.html?class=6;team=${espnTeamId};template=results;trophy=117;type=bowling`;
    const $ = await espnGet(url);
    const results = [];
    $('table.engineTable').eq(2).find('tr.data1').each((i, el) => {
        if (i >= 50) return false; // Fetch up to 50 players
        const tds = $(el).find('td');
        const rawName = tds.eq(0).find('a').first().text().trim() || tds.eq(0).text().trim();
        const name = getFullName(rawName);
        
        const matches = parseInt(tds.eq(2).text()) || 0;
        const overs = parseFloat(tds.eq(4).text()) || 0;
        const maidens = parseInt(tds.eq(5).text()) || 0;
        const runsConceded = parseInt(tds.eq(6).text().replace(/,/g, '')) || 0;
        const wickets = parseInt(tds.eq(7).text().replace(/,/g, '')) || 0;
        const bbi = tds.eq(8).text().trim();
        const avg = parseFloat(tds.eq(9).text()) || 0;
        const econ = parseFloat(tds.eq(10).text()) || 0;
        const sr = parseFloat(tds.eq(11).text()) || 0;
        const fourWickets = parseInt(tds.eq(12).text()) || 0;
        const fiveWickets = parseInt(tds.eq(13).text()) || 0;
        if (name && !isNaN(wickets) && wickets > 0) results.push({ name, wickets, matches, overs, maidens, runsConceded, bbi, avg, econ, sr, fourWickets, fiveWickets });
    });
    return results;
}

/** Fetch Home/Away Record */
async function fetchHomeAway(espnTeamId, classId) {
    const fetchLoc = async (hostType) => {
        const url = `https://stats.espncricinfo.com/ci/engine/stats/index.html?class=${classId};team=${espnTeamId};home_or_away=${hostType};template=results;type=team`;
        const $ = await espnGet(url);
        const row = $('table.engineTable').eq(2).find('tr.data1').eq(0);
        if (row.length === 0) return { matches: 0, won: 0, lost: 0 };
        const cols = row.find('td');
        return {
            matches: parseInt($(cols[2]).text()) || 0,
            won: parseInt($(cols[3]).text()) || 0,
            lost: parseInt($(cols[4]).text()) || 0
        };
    };
    return {
        home: await fetchLoc(1),
        away: await fetchLoc(2)
    };
}

const PLAYER_FULL_NAMES = {
    "V Sehwag": "Virender Sehwag",
    "KK Nair": "Karun Nair",
    "VVS Laxman": "VVS Laxman", // Commonly known by acronym
    "A Kumble": "Anil Kumble",
    "JM Patel": "Jasu Patel",
    "N Kapil Dev": "Kapil Dev",
    "SP Gupte": "Subhash Gupte",
    "MH Mankad": "Vinoo Mankad",
    "SR Tendulkar": "Sachin Tendulkar",
    "RG Sharma": "Rohit Sharma",
    "V Kohli": "Virat Kohli",
    "MS Dhoni": "MS Dhoni", // Fine as is
    "SC Ganguly": "Sourav Ganguly",
    "R Dravid": "Rahul Dravid",
    "Yuvraj Singh": "Yuvraj Singh",
    "Z Khan": "Zaheer Khan",
    "Harbhajan Singh": "Harbhajan Singh",
    "I Sharma": "Ishant Sharma",
    "R Ashwin": "Ravichandran Ashwin",
    "RA Jadeja": "Ravindra Jadeja",
    "JJ Bumrah": "Jasprit Bumrah",
    "Mohammed Shami": "Mohammed Shami",
    "HH Pandya": "Hardik Pandya",
    "SA Yadav": "Suryakumar Yadav",
    "DL Chahar": "Deepak Chahar",
    "YS Chahal": "Yuzvendra Chahal",
    "AR Patel": "Axar Patel",
    "KL Rahul": "KL Rahul",
    "CV Varun": "Varun Chakravarthy",
    "B Kumar": "Bhuvneshwar Kumar",
    "STR Binny": "Stuart Binny",
    "S Dhawan": "Shikhar Dhawan",
    "A Nehra": "Ashish Nehra",
    "J Srinath": "Javagal Srinath",
    "SV Samson": "Sanju Samson",
    "NT Tilak Varma": "Tilak Varma",
    "RR Pant": "Rishabh Pant",
    // Expanded List
    "SK Raina": "Suresh Raina",
    "RD Gaikwad": "Ruturaj Gaikwad",
    "F du Plessis": "Faf du Plessis",
    "AT Rayudu": "Ambati Rayudu",
    "MEK Hussey": "Michael Hussey",
    "S Dube": "Shivam Dube",
    "M Vijay": "Murali Vijay",
    "S Badrinath": "Subramaniam Badrinath",
    "SR Watson": "Shane Watson",
    "ML Hayden": "Matthew Hayden",
    "DP Conway": "Devon Conway",
    "DJ Bravo": "Dwayne Bravo",
    "DR Smith": "Dwayne Smith",
    "MM Ali": "Moeen Ali",
    "BB McCullum": "Brendon McCullum",
    "JA Morkel": "Albie Morkel",
    "AM Rahane": "Ajinkya Rahane",
    "PA Patel": "Parthiv Patel",
    "R Ravindra": "Rachin Ravindra",
    "D Brevis": "Dewald Brevis",
    "SM Curran": "Sam Curran",
    "RV Uthappa": "Robin Uthappa",
    "DJ Mitchell": "Daryl Mitchell",
    "KM Jadhav": "Kedar Jadhav",
    "SP Fleming": "Stephen Fleming",
    "SN Khan": "Sarfaraz Khan",
    "WP Saha": "Wriddhiman Saha",
    "V Shankar": "Vijay Shankar",
    "DJ Hussey": "David Hussey",
    "P Negi": "Pawan Negi",
    "SW Billings": "Sam Billings",
    "JDP Oram": "Jacob Oram",
    "MJ Santner": "Mitchell Santner",
    "SN Thakur": "Shardul Thakur",
    "GJ Bailey": "George Bailey",
    "MM Sharma": "Mohit Sharma",
    "M Pathirana": "Matheesha Pathirana",
    "SB Jakati": "Shadab Jakati",
    "M Muralidaran": "Muttiah Muralitharan",
    "TU Deshpande": "Tushar Deshpande",
    "DE Bollinger": "Doug Bollinger",
    "L Balaji": "Lakshmipathy Balaji",
    "L Ngidi": "Lungi Ngidi",
    "M Theekshana": "Maheesh Theekshana",
    "MS Gony": "Manpreet Gony",
    "BW Hilfenhaus": "Ben Hilfenhaus",
    "KK Ahmed": "Khaleel Ahmed",
    "CH Morris": "Chris Morris",
    "JR Hazlewood": "Josh Hazlewood",
    "KV Sharma": "Karn Sharma",
    "AJ Hosein": "Akeal Hosein",
    "T Thushara": "Nuwan Thushara",
    "M Ntini": "Makhaya Ntini",
    "PP Chawla": "Piyush Chawla",
    "D Pretorius": "Dwaine Pretorius",
    "KA Pollard": "Kieron Pollard",
    "Q de Kock": "Quinton de Kock",
    "KH Pandya": "Krunal Pandya",
    "LMP Simmons": "Lendl Simmons",
    "ST Jayasuriya": "Sanath Jayasuriya",
    "KD Karthik": "Dinesh Karthik",
    "SS Tiwary": "Saurabh Tiwary",
    "TH David": "Tim David",
    "JP Duminy": "JP Duminy",
    "JC Buttler": "Jos Buttler",
    "AM Nayar": "Abhishek Nayar",
    "C Green": "Cameron Green",
    "N Rana": "Nitish Rana",
    "E Lewis": "Evin Lewis",
    "CJ Anderson": "Corey Anderson",
    "WG Jacks": "Will Jacks",
    "N Wadhera": "Nehal Wadhera",
    "JEC Franklin": "James Franklin",
    "AP Tare": "Aditya Tare",
    "SM Pollock": "Shaun Pollock",
    "A Symonds": "Andrew Symonds",
    "SE Rutherford": "Sherfane Rutherford",
    "BCJ Cutting": "Ben Cutting",
    "SL Malinga": "Lasith Malinga",
    "MJ McClenaghan": "Mitchell McClenaghan",
    "TA Boult": "Trent Boult",
    "RD Chahar": "Rahul Chahar",
    "MM Patel": "Munaf Patel",
    "DS Kulkarni": "Dhawal Kulkarni",
    "MG Johnson": "Mitchell Johnson",
    "PP Ojha": "Pragyan Ojha",
    "JP Behrendorff": "Jason Behrendorff",
    "A Madhwal": "Akash Madhwal",
    "CRD Fernando": "Dilhara Fernando",
    "M Markande": "Mayank Markande",
    "G Coetzee": "Gerald Coetzee",
    "NM Coulter-Nile": "Nathan Coulter-Nile",
    "DR Sams": "Daniel Sams",
    "TG Southee": "Tim Southee",
    "R Vinay Kumar": "Vinay Kumar",
    "JL Pattinson": "James Pattinson",
    "S Gopal": "Shreyas Gopal",
    "K Kartikeya": "Kumar Kartikeya",
    "RP Singh": "RP Singh",
    "M Ashwin": "Murugan Ashwin",
    "AS Joseph": "Alzarri Joseph",
    "AB de Villiers": "AB de Villiers",
    "CH Gayle": "Chris Gayle",
    "RM Patidar": "Rajat Patidar",
    "D Padikkal": "Devdutt Padikkal",
    "GJ Maxwell": "Glenn Maxwell",
    "JH Kallis": "Jacques Kallis",
    "PD Salt": "Phil Salt",
    "TM Dilshan": "Tillakaratne Dilshan",
    "MA Agarwal": "Mayank Agarwal",
    "MK Pandey": "Manish Pandey",
    "MV Boucher": "Mark Boucher",
    "JM Sharma": "Jitesh Sharma",
    "MK Lomror": "Mahipal Lomror",
    "KP Pietersen": "Kevin Pietersen",
    "AJ Finch": "Aaron Finch",
    "MP Stoinis": "Marcus Stoinis",
    "VR Iyer": "Venkatesh Iyer",
    "TM Head": "Travis Head",
    "KS Bharat": "KS Bharat",
    "P Kumar": "Praveen Kumar",
    "C de Grandhomme": "Colin de Grandhomme",
    "MC Henriques": "Moises Henriques",
    "HV Patel": "Harshal Patel",
    "S Aravind": "Sreenath Aravind",
    "PW Hasaranga": "Wanindu Hasaranga",
    "MA Starc": "Mitchell Starc",
    "DW Steyn": "Dale Steyn",
    "UT Yadav": "Umesh Yadav",
    "VR Aaron": "Varun Aaron",
    "NA Saini": "Navdeep Saini",
    "DL Vettori": "Daniel Vettori",
    "D Wiese": "David Wiese",
    "R Rampaul": "Ravi Rampaul",
    "JD Unadkat": "Jaydev Unadkat",
    "V Vyshak": "Vyshak Vijay Kumar",
    "CJ Jordan": "Chris Jordan",
    "RE van der Merwe": "Roelof van der Merwe",
    "S Badree": "Samuel Badree",
    "LH Ferguson": "Lockie Ferguson",
    "KA Jamieson": "Kyle Jamieson",
    "M Kartik": "Murali Kartik",
    "KW Richardson": "Kane Richardson",
    "DA Warner": "David Warner",
    "S Dhawan": "Shikhar Dhawan",
    "B Kumar": "Bhuvneshwar Kumar",
    "T Natarajan": "T Natarajan",
    "Rashid Khan": "Rashid Khan"
};

const TEAM_FULL_NAMES = {
    'CSK': 'Chennai Super Kings',
    'Super Kings': 'Chennai Super Kings',
    'MI': 'Mumbai Indians',
    'RCB': 'Royal Challengers Bengaluru',
    'Royals': 'Rajasthan Royals',
    'RR': 'Rajasthan Royals',
    'KKR': 'Kolkata Knight Riders',
    'Daredevils': 'Delhi Daredevils',
    'Capitals': 'Delhi Capitals',
    'DC': 'Delhi Capitals',
    'Kings XI': 'Kings XI Punjab',
    'Punjab Kings': 'Punjab Kings',
    'PBKS': 'Punjab Kings',
    'KXIP': 'Kings XI Punjab',
    'SRH': 'Sunrisers Hyderabad',
    'Sunrisers': 'Sunrisers Hyderabad',
    'Chargers': 'Deccan Chargers',
    'Titans': 'Gujarat Titans',
    'GT': 'Gujarat Titans',
    'Super Giant': 'Lucknow Super Giants',
    'LSG': 'Lucknow Super Giants',
    'Lions': 'Gujarat Lions',
    'Pune': 'Rising Pune Supergiant',
    'Supergiant': 'Rising Pune Supergiant',
    'Kochi': 'Kochi Tuskers Kerala',
    'Warriors': 'Pune Warriors'
};

function getFullName(acronymName) {
    return PLAYER_FULL_NAMES[acronymName] || acronymName;
}

/** Fetch Highest Individual Scores in an Innings */
async function fetchHighestScores(espnTeamId, classId) {
    const url = `https://stats.espncricinfo.com/ci/engine/stats/index.html?class=${classId};team=${espnTeamId};template=results;type=batting;view=innings`;
    const $ = await espnGet(url);
    const results = [];
    $('table.engineTable').eq(2).find('tr.data1').each((i, el) => {
        if (i >= 5) return false;
        const cols = $(el).find('td');
        const name = getFullName($(cols[0]).text().trim());
        const runs = $(cols[1]).text().trim();
        const opp = $(cols[9]).text().trim().replace(/^v\s+/, '');
        const ground = $(cols[10]).text().trim();
        const date = $(cols[11]).text().trim();
        if (name) results.push({ name, runs, opp, ground, date });
    });
    return results;
}

/** Fetch Best Bowling Figures in an Innings */
async function fetchBestBowling(espnTeamId, classId) {
    const url = `https://stats.espncricinfo.com/ci/engine/stats/index.html?class=${classId};team=${espnTeamId};template=results;type=bowling;view=innings`;
    const $ = await espnGet(url);
    const results = [];
    $('table.engineTable').eq(2).find('tr.data1').each((i, el) => {
        if (i >= 5) return false;
        const cols = $(el).find('td');
        const name = getFullName($(cols[0]).text().trim());
        const figures = $(cols[1]).text().trim() + '/' + $(cols[4]).text().trim(); // Overs/Runs is weird, let's just grab O M R W
        // Columns: [0]Player [1]Overs [2]... [3]Mdns [4]Runs [5]Wkts
        const isT20 = String(classId) === '3';
        const wktCol = isT20 ? 4 : 5;
        const runsCol = isT20 ? 3 : 4;
        const oppCol = isT20 ? 8 : 9;
        const groundCol = isT20 ? 9 : 10;
        const dateCol = isT20 ? 10 : 11;
        
        const wkts = $(cols[wktCol]).text().trim();
        const runs = $(cols[runsCol]).text().trim();
        const opp = $(cols[oppCol]).text().trim().replace(/^v\s+/, '');
        const ground = $(cols[groundCol]).text().trim();
        const date = $(cols[dateCol]).text().trim();
        if (name) results.push({ name, figures: `${wkts}/${runs}`, opp, ground, date });
    });
    return results;
}

export async function getTeamAnalytics(teamId, format) {
    const cacheFile = path.join(CACHE_DIR, `${teamId}_${format}.json`);
    if (fs.existsSync(cacheFile)) {
        const ageHours = (new Date() - fs.statSync(cacheFile).mtime) / (1000 * 60 * 60);
        if (ageHours < 24) {
            console.log(`[Analytics] Returning cached data for ${teamId} (${format})`);
            return JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
        }
    }

    const espnTeamId = ESPNCRICINFO_TEAM_IDS[teamId];
    const teamName = TEAM_NAMES[teamId] || teamId;
    if (!espnTeamId) throw new Error(`Unknown team ID: ${teamId}`);

    console.log(`[Analytics] Fetching all data from ESPN for ${teamName} (${format})...`);
    const formatsToProcess = format === 'all' ? ['t20i', 'odi', 'test'] : [format];

    let aggregated = {
        team: teamName, format, matchesPlayed: 0,
        winLoss: { won: 0, lost: 0, tied: 0, noResult: 0 },
        highestTotal: { score: 0, against: 'N/A' }, lowestTotal: 0,
        battingFirst: { matches: 0, won: 0 }, chasing: { matches: 0, won: 0 },
        headToHead: {}, venues: [], yearByYear: [],
        players: { topRunScorers: [], topWicketTakers: [] },
        recentForm: [], // newest to oldest
        homeAway: { home: { matches: 0, won: 0, lost: 0 }, away: { matches: 0, won: 0, lost: 0 } },
        highestInnings: [],
        bestBowling: []
    };

    for (const f of formatsToProcess) {
        const classId = FORMAT_CLASS[f];
        if (!classId) continue;
        try {
            console.log(`[Analytics] Fetching ${f} data sequentially...`);
            
            // Sequentially await to prevent IP bans
            const teamRecord = await fetchTeamRecord(espnTeamId, classId);
            const yearByYear = await fetchYearByYear(espnTeamId, classId);
            const venues = await fetchVenueBreakdown(espnTeamId, classId);
            const matchesData = await fetchMatchesList(espnTeamId, classId);
            const battingStats = await fetchBattingFirstVsChasing(espnTeamId, classId);
            const topRunScorers = await fetchTopRunScorers(espnTeamId, classId);
            const topWicketTakers = await fetchTopWicketTakers(espnTeamId, classId);
            const homeAway = await fetchHomeAway(espnTeamId, classId);
            const highestInnings = await fetchHighestScores(espnTeamId, classId);
            const bestBowling = await fetchBestBowling(espnTeamId, classId);

            aggregated.matchesPlayed += teamRecord.matchesPlayed;
            aggregated.winLoss.won += teamRecord.won;
            aggregated.winLoss.lost += teamRecord.lost;
            aggregated.winLoss.tied += teamRecord.tied;
            aggregated.winLoss.noResult += teamRecord.noResult;

            if (teamRecord.highestTotal > aggregated.highestTotal.score) aggregated.highestTotal.score = teamRecord.highestTotal;
            if (!aggregated.lowestTotal || (teamRecord.lowestTotal > 0 && teamRecord.lowestTotal < aggregated.lowestTotal)) aggregated.lowestTotal = teamRecord.lowestTotal;

            yearByYear.forEach(y => {
                const existing = aggregated.yearByYear.find(x => x.year === y.year);
                if (existing) { 
                    existing.mat += y.mat; 
                    existing.won += y.won; 
                    existing.lost += y.lost; 
                    existing.tied += (y.tied || 0);
                    existing.drawNr += (y.drawNr || 0);
                }
                else aggregated.yearByYear.push({ ...y, tied: y.tied || 0, drawNr: y.drawNr || 0 });
            });
            venues.forEach(v => {
                const existing = aggregated.venues.find(x => x.ground === v.ground);
                if (existing) { 
                    existing.mat += v.mat; 
                    existing.won += v.won; 
                    existing.lost += v.lost;
                    existing.tied += (v.tied || 0);
                    existing.drawNr += (v.drawNr || 0);
                }
                else aggregated.venues.push({ ...v, tied: v.tied || 0, drawNr: v.drawNr || 0 });
            });
            for (const [opp, rec] of Object.entries(matchesData.headToHead)) {
                if (!aggregated.headToHead[opp]) aggregated.headToHead[opp] = { played: 0, won: 0, lost: 0, tied: 0, drawNr: 0 };
                aggregated.headToHead[opp].played += rec.played;
                aggregated.headToHead[opp].won += rec.won;
                aggregated.headToHead[opp].lost += rec.lost;
                aggregated.headToHead[opp].tied += rec.tied;
                aggregated.headToHead[opp].drawNr += rec.drawNr;
            }
            
            // recent form is tricky across formats, we just take the first format's recent form if it's "all"
            if (aggregated.recentForm.length === 0) aggregated.recentForm = matchesData.recentForm;

            aggregated.battingFirst.matches += battingStats.battingFirst.matches;
            aggregated.battingFirst.won += battingStats.battingFirst.won;
            aggregated.chasing.matches += battingStats.chasing.matches;
            aggregated.chasing.won += battingStats.chasing.won;

            topRunScorers.forEach(p => {
                const existing = aggregated.players.topRunScorers.find(x => x.name === p.name);
                if (existing) existing.runs += p.runs;
                else aggregated.players.topRunScorers.push({ ...p });
            });
            topWicketTakers.forEach(p => {
                const existing = aggregated.players.topWicketTakers.find(x => x.name === p.name);
                if (existing) existing.wickets += p.wickets;
                else aggregated.players.topWicketTakers.push({ ...p });
            });

            aggregated.homeAway.home.matches += homeAway.home.matches;
            aggregated.homeAway.home.won += homeAway.home.won;
            aggregated.homeAway.home.lost += homeAway.home.lost;
            aggregated.homeAway.away.matches += homeAway.away.matches;
            aggregated.homeAway.away.won += homeAway.away.won;
            aggregated.homeAway.away.lost += homeAway.away.lost;

            // Merging best innings is hard for "all formats", let's just append and slice later
            highestInnings.forEach(h => aggregated.highestInnings.push({...h, format: f}));
            bestBowling.forEach(b => aggregated.bestBowling.push({...b, format: f}));

        } catch (e) {
            console.error(`[Analytics] Error fetching ${f} for ${teamId}:`, e.message);
        }
    }

    aggregated.players.topRunScorers.sort((a, b) => b.runs - a.runs);
    aggregated.players.topWicketTakers.sort((a, b) => b.wickets - a.wickets);
    aggregated.yearByYear.sort((a, b) => b.year - a.year);
    aggregated.venues = aggregated.venues.map(v => ({ ...v, winPct: v.mat > 0 ? Math.round((v.won / v.mat) * 100) : 0 })).sort((a, b) => b.mat - a.mat).slice(0, 10);
    
    // Sort best scores/figures for "all formats"
    aggregated.highestInnings = aggregated.highestInnings.sort((a, b) => {
        const aRuns = parseInt(a.runs.replace('*', ''));
        const bRuns = parseInt(b.runs.replace('*', ''));
        if (aRuns === bRuns) return a.runs.includes('*') ? -1 : 1; // Not out ranks higher
        return bRuns - aRuns;
    }).slice(0, 5);
    
    aggregated.bestBowling = aggregated.bestBowling.sort((a, b) => {
        const aW = parseInt(a.figures.split('/')[0]);
        const bW = parseInt(b.figures.split('/')[0]);
        if (aW === bW) {
            const aR = parseInt(a.figures.split('/')[1]);
            const bR = parseInt(b.figures.split('/')[1]);
            return aR - bR; // fewer runs conceded ranks higher
        }
        return bW - aW; // more wickets ranks higher
    }).slice(0, 5);

    if (!fs.existsSync(CACHE_DIR)) fs.mkdirSync(CACHE_DIR, { recursive: true });
    fs.writeFileSync(cacheFile, JSON.stringify(aggregated, null, 2));
    console.log(`[Analytics] Done for ${teamId}/${format}`);
    return aggregated;
}

/** Fetch All-Time IPL Top Fielders (Trophy=117) */
async function fetchAllTimeIplFielding(espnTeamId) {
    const url = `https://stats.espncricinfo.com/ci/engine/stats/index.html?class=6;team=${espnTeamId};template=results;trophy=117;type=fielding`;
    const $ = await espnGet(url);
    const results = [];
    $('table.engineTable').eq(2).find('tr.data1').each((i, el) => {
        if (i >= 50) return false;
        const tds = $(el).find('td');
        const rawName = tds.eq(0).find('a').first().text().trim() || tds.eq(0).text().trim();
        const name = getFullName(rawName);
        const matches = parseInt(tds.eq(2).text()) || 0;
        const dismissals = parseInt(tds.eq(4).text()) || 0;
        const catches = parseInt(tds.eq(5).text()) || 0;
        const stumpings = parseInt(tds.eq(6).text()) || 0;
        if (name && (dismissals > 0 || catches > 0 || stumpings > 0)) {
            results.push({ name, matches, dismissals, catches, stumpings });
        }
    });
    return results;
}

/** Fetch Fall of Wickets / Partnerships (Trophy=117) */
async function fetchAllTimeIplFow(espnTeamId) {
    const url = `https://stats.espncricinfo.com/ci/engine/stats/index.html?class=6;team=${espnTeamId};template=results;trophy=117;type=fow`;
    const $ = await espnGet(url);
    const results = [];
    $('table.engineTable').eq(2).find('tr.data1').each((i, el) => {
        if (i >= 20) return false; // Top 20 partnerships
        const tds = $(el).find('td');
        const partnersRaw = tds.eq(0).text().trim().split(',');
        const partner1 = getFullName(partnersRaw[0]?.trim() || '');
        const partner2 = getFullName(partnersRaw[1]?.trim() || '');
        const partners = `${partner1}, ${partner2}`;
        const inns = parseInt(tds.eq(2).text()) || 0;
        const runs = parseInt(tds.eq(4).text()) || 0;
        const highest = tds.eq(5).text().trim();
        const avg = parseFloat(tds.eq(6).text()) || 0;
        const hundreds = parseInt(tds.eq(9).text()) || 0;
        const fifties = parseInt(tds.eq(10).text()) || 0;
        if (partners && runs > 0) {
            results.push({ partners, inns, runs, highest, avg, hundreds, fifties });
        }
    });
    return results;
}

/** Fetch Head to Head (Trophy=117) */
async function fetchAllTimeIplHeadToHead(espnTeamId) {
    const url = `https://stats.espncricinfo.com/ci/engine/stats/index.html?class=6;team=${espnTeamId};template=results;trophy=117;type=team;view=opposition`;
    const $ = await espnGet(url);
    const results = [];
    let currentH2h = null;
    $('table.engineTable').eq(2).find('tr').each((i, el) => {
        const cls = $(el).attr('class');
        if (cls === 'data2' || cls === 'data1') {
            const tds = $(el).find('td');
            if (tds.length >= 7) {
                currentH2h = {
                    matches: parseInt(tds.eq(2).text()) || 0,
                    won: parseInt(tds.eq(3).text()) || 0,
                    lost: parseInt(tds.eq(4).text()) || 0,
                    tied: parseInt(tds.eq(5).text()) || 0,
                    nr: parseInt(tds.eq(6).text()) || 0
                };
            }
        } else if (cls === 'note' && currentH2h) {
            const oppText = $(el).find('td').text().trim().replace(/^v\s+/, '');
            if (oppText) {
                currentH2h.opposition = TEAM_FULL_NAMES[oppText] || oppText;
                results.push(currentH2h);
            }
            currentH2h = null;
        }
    });
    return results.sort((a, b) => b.matches - a.matches);
}

export async function getAllTimeIplStats(teamId) {
    const espnTeamId = ESPNCRICINFO_TEAM_IDS[teamId];
    if (!espnTeamId) {
        throw new Error(`Team ID ${teamId} not found in ESPN mapping`);
    }

    const cacheFile = path.join(CACHE_DIR, `ipl_all_time_${teamId}.json`);
    
    // Check if cache exists and is fresh (e.g., 12 hours)
    if (fs.existsSync(cacheFile)) {
        const stats = fs.statSync(cacheFile);
        const ageHrs = (Date.now() - stats.mtimeMs) / (1000 * 60 * 60);
        if (ageHrs < 12) {
            console.log(`[AllTimeStats] Serving cache for ${teamId}`);
            return JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
        }
    }

    console.log(`[AllTimeStats] Fetching fresh all-time stats for ${teamId}`);
    try {
        const topRunScorers = await fetchAllTimeIplScorers(espnTeamId);
        const topWicketTakers = await fetchAllTimeIplWickets(espnTeamId);
        const topFielders = await fetchAllTimeIplFielding(espnTeamId);
        const partnerships = await fetchAllTimeIplFow(espnTeamId);
        const headToHead = await fetchAllTimeIplHeadToHead(espnTeamId);
        
        const aggregated = {
            players: {
                topRunScorers,
                topWicketTakers,
                topFielders,
                partnerships,
                headToHead
            }
        };

        if (!fs.existsSync(CACHE_DIR)) fs.mkdirSync(CACHE_DIR, { recursive: true });
        fs.writeFileSync(cacheFile, JSON.stringify(aggregated, null, 2));
        console.log(`[AllTimeStats] Done for ${teamId}`);
        return aggregated;
    } catch (e) {
        console.error(`[AllTimeStats] Error fetching all-time stats for ${teamId}:`, e.message);
        throw e;
    }
}
