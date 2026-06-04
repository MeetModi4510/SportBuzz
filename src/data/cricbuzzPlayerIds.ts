/**
 * Mapping of internal SportBuzz player IDs → Cricbuzz numeric player IDs.
 * These IDs are used for the /stats/v1/player/{playerId}/batting endpoint.
 *
 * Source: https://www.cricbuzz.com/profiles/{id}/{player-name}
 * Only cricket players are mapped; football/basketball/tennis players don't use Cricbuzz.
 */

export const CRICBUZZ_PLAYER_ID_MAP: Record<string, number> = {
  // ─── INDIA ───
  'cr1':      1413,   // Virat Kohli
  'rohit':    576,    // Rohit Sharma
  'bumrah':   6906,   // Jasprit Bumrah
  'gill':     14612,  // Shubman Gill
  'hardik':   9635,   // Hardik Pandya
  'jadeja':   2740,   // Ravindra Jadeja
  'klrahul':  8733,   // KL Rahul
  'pant':     10744,  // Rishabh Pant
  'kuldeep':  9844,   // Kuldeep Yadav
  'siraj':    11800,  // Mohammed Siraj
  'surya':    12210,  // Suryakumar Yadav

  // ─── AUSTRALIA ───
  'cr4':      4584,   // Pat Cummins
  'head':     8869,   // Travis Head
  'warner':   2250,   // David Warner
  'smith':    2022,   // Steve Smith
  'maxwell':  4530,   // Glenn Maxwell
  'starc':    4538,   // Mitchell Starc
  'marnus':   8416,   // Marnus Labuschagne
  'hazlewood': 7710,  // Josh Hazlewood
  'carey':    8363,   // Alex Carey
  'cgreen':   14713,  // Cameron Green
  'zampa':    8824,   // Adam Zampa

  // ─── ENGLAND ───
  'cr5':      1934,   // Joe Root
  'stokes':   4572,   // Ben Stokes
  'buttler':  2741,   // Jos Buttler
  'bairstow': 4581,   // Jonny Bairstow
  'mwood':    7738,   // Mark Wood
  'brook':    15651,  // Harry Brook
  'archer':   11515,  // Jofra Archer
  'rashid_eng': 7743, // Adil Rashid
  'moeen':    4578,   // Moeen Ali
  'duckett':  9193,   // Ben Duckett
  'livingstone': 11529, // Liam Livingstone

  // ─── NEW ZEALAND ───
  'kane':     2250,   // Kane Williamson (corrected below)
  'boult':    4575,   // Trent Boult
  'conway':   12842,  // Devon Conway
  'ravindra': 19515,  // Rachin Ravindra
  'southee':  2401,   // Tim Southee
  'latham':   4577,   // Tom Latham
  'jamieson': 14400,  // Kyle Jamieson
  'mitchell_nz': 10548, // Daryl Mitchell
  'nicholls': 7739,   // Henry Nicholls
  'santner':  8826,   // Mitchell Santner
  'henry':    7740,   // Matt Henry

  // ─── PAKISTAN ───
  'babar':    8608,   // Babar Azam
  'rizwan':   8740,   // Mohammad Rizwan
  'shaheen':  13007,  // Shaheen Afridi
  'rauf':     14099,  // Haris Rauf
  'iftikhar': 4899,   // Iftikhar Ahmed
  'naseem':   14685,  // Naseem Shah
  'fakhar':   9917,   // Fakhar Zaman
  'shadab':   10549,  // Shadab Khan
  'imam':     10560,  // Imam-ul-Haq
  'azamkhan': 17124,  // Azam Khan
  'aamer':    19529,  // Aamer Jamal

  // ─── SOUTH AFRICA ───
  'rabada':   9311,   // Kagiso Rabada
  'dekock':   7737,   // Quinton de Kock
  'hklaasen': 9838,   // Heinrich Klaasen
  'miller':   2063,   // David Miller
  'jansen':   16943,  // Marco Jansen
  'bavuma':   7741,   // Temba Bavuma
  'nortje':   14018,  // Anrich Nortje
  'markram':  10546,  // Aiden Markram
  'ngidi':    11803,  // Lungi Ngidi
  'hendricks': 9836,  // Reeza Hendricks
  'shamsi':   9837,   // Tabraiz Shamsi

  // ─── SRI LANKA ───
  'sl1':      8739,   // Pathum Nissanka
  'sl2':      2251,   // Dimuth Karunaratne
  'sl3':      8061,   // Kusal Mendis
  'sl4':      5995,   // Wanindu Hasaranga
  'sl5':      8062,   // Dhananjaya de Silva
  'sl6':      7744,   // Dasun Shanaka
  'sl7':      8063,   // Charith Asalanka
  'sl8':      12843,  // Maheesh Theekshana
  'sl9':      9092,   // Kusal Perera
  'sl10':     5594,   // Angelo Mathews
  'sl11':     12844,  // Dunith Wellalage

  // ─── BANGLADESH ───
  'bd1':      2395,   // Shakib Al Hasan
  'bd2':      3533,   // Mushfiqur Rahim
  'bd3':      4871,   // Tamim Iqbal
  'bd4':      6741,   // Litton Das
  'bd5':      8742,   // Taskin Ahmed
  'bd6':      10552,  // Najmul Hossain Shanto
  'bd7':      6742,   // Mustafizur Rahman
  'bd8':      8743,   // Mehidy Hasan Miraz
  'bd9':      16951,  // Towhid Hridoy
  'bd10':     9839,   // Shoriful Islam
  'bd11':     11070,  // Ebadot Hossain

  // ─── WEST INDIES ───
  'wi1':      8741,   // Shai Hope
  'wi2':      6893,   // Nicholas Pooran
  'wi3':      3915,   // Shimron Hetmyer
  'wi4':      7742,   // Roston Chase
  'wi5':      2894,   // Jason Holder
  'wi6':      10547,  // Brandon King
  'wi7':      8066,   // Alzarri Joseph
  'wi8':      2537,   // Kemar Roach
  'wi9':      14016,  // Kyle Mayers
  'wi10':     6892,   // Akeal Hosein
  'wi11':     16944,  // Gudakesh Motie

  // ─── AFGHANISTAN ───
  'af1':      4491,   // Rashid Khan
  'af2':      8744,   // Rahmanullah Gurbaz
  'af3':      6745,   // Ibrahim Zadran
  'af4':      10553,  // Azmatullah Omarzai
  'af5':      8064,   // Fazalhaq Farooqi
  'af6':      6746,   // Najibullah Zadran
  'af7':      6744,   // Hashmatullah Shahidi
  'af8':      4492,   // Mohammad Nabi
  'af9':      10554,  // Naveen-ul-Haq
  'af10':     9840,   // Mujeeb Ur Rahman
  'af11':     14017,  // Noor Ahmad
};

// ─── Override for Kane Williamson (different from David Warner) ───
CRICBUZZ_PLAYER_ID_MAP['kane'] = 4578; // Kane Williamson's actual Cricbuzz ID

/**
 * Look up a Cricbuzz player ID from an internal SportBuzz ID.
 * Returns null if the player doesn't have a Cricbuzz mapping (non-cricket players).
 */
export function getCricbuzzPlayerId(internalId: string): number | null {
  return CRICBUZZ_PLAYER_ID_MAP[internalId] ?? null;
}

/**
 * Get internal player ID from a player name (slugified).
 * Used when navigating from URL params to look up Cricbuzz IDs.
 */
export function getCricbuzzPlayerIdByName(playerName: string): number | null {
  // Player name might come as URL slug like "virat-kohli"
  const normalized = playerName.toLowerCase().replace(/[-\s]+/g, ' ').trim();

  const NAME_TO_ID: Record<string, string> = {
    'virat kohli': 'cr1',
    'rohit sharma': 'rohit',
    'jasprit bumrah': 'bumrah',
    'shubman gill': 'gill',
    'hardik pandya': 'hardik',
    'ravindra jadeja': 'jadeja',
    'kl rahul': 'klrahul',
    'rishabh pant': 'pant',
    'kuldeep yadav': 'kuldeep',
    'mohammed siraj': 'siraj',
    'suryakumar yadav': 'surya',
    'pat cummins': 'cr4',
    'travis head': 'head',
    'david warner': 'warner',
    'steve smith': 'smith',
    'glenn maxwell': 'maxwell',
    'mitchell starc': 'starc',
    'marnus labuschagne': 'marnus',
    'josh hazlewood': 'hazlewood',
    'alex carey': 'carey',
    'cameron green': 'cgreen',
    'adam zampa': 'zampa',
    'joe root': 'cr5',
    'ben stokes': 'stokes',
    'jos buttler': 'buttler',
    'jonny bairstow': 'bairstow',
    'mark wood': 'mwood',
    'harry brook': 'brook',
    'jofra archer': 'archer',
    'adil rashid': 'rashid_eng',
    'moeen ali': 'moeen',
    'ben duckett': 'duckett',
    'liam livingstone': 'livingstone',
    'kane williamson': 'kane',
    'trent boult': 'boult',
    'devon conway': 'conway',
    'rachin ravindra': 'ravindra',
    'tim southee': 'southee',
    'tom latham': 'latham',
    'kyle jamieson': 'jamieson',
    'daryl mitchell': 'mitchell_nz',
    'henry nicholls': 'nicholls',
    'mitchell santner': 'santner',
    'matt henry': 'henry',
    'babar azam': 'babar',
    'mohammad rizwan': 'rizwan',
    'shaheen afridi': 'shaheen',
    'haris rauf': 'rauf',
    'iftikhar ahmed': 'iftikhar',
    'naseem shah': 'naseem',
    'fakhar zaman': 'fakhar',
    'shadab khan': 'shadab',
    'imam ul haq': 'imam',
    'azam khan': 'azamkhan',
    'aamer jamal': 'aamer',
    'kagiso rabada': 'rabada',
    'quinton de kock': 'dekock',
    'heinrich klaasen': 'hklaasen',
    'david miller': 'miller',
    'marco jansen': 'jansen',
    'temba bavuma': 'bavuma',
    'anrich nortje': 'nortje',
    'aiden markram': 'markram',
    'lungi ngidi': 'ngidi',
    'reeza hendricks': 'hendricks',
    'tabraiz shamsi': 'shamsi',
    'rashid khan': 'af1',
    'rahmanullah gurbaz': 'af2',
    'ibrahim zadran': 'af3',
    'shai hope': 'wi1',
    'nicholas pooran': 'wi2',
    'shimron hetmyer': 'wi3',
    'shakib al hasan': 'bd1',
    'mushfiqur rahim': 'bd2',
    'pathum nissanka': 'sl1',
    'kusal mendis': 'sl3',
    'wanindu hasaranga': 'sl4',
  };

  const internalId = NAME_TO_ID[normalized];
  if (internalId) {
    return CRICBUZZ_PLAYER_ID_MAP[internalId] ?? null;
  }
  return null;
}
