import { createHash } from 'crypto';

/**
 * Flag Service - Maps team/country names to flag URLs
 *
 * STRATEGY (Priority Order):
 * 1. INTERNATIONAL teams: Flagpedia CDN (country flag) — fast, always available
 * 2. LEAGUE/FRANCHISE teams: Wikimedia Commons direct URLs — official logos, hotlink-safe
 * 3. STATE/DOMESTIC teams (Indian Ranji): Initials badge via UI Avatars
 * 4. UNKNOWN teams: Clean initials badge fallback — never a broken image
 */

// West Indies Cricket Board official logo URL
const WEST_INDIES_FLAG_URL = '/flags/westindies.png';

// ─── Wikipedia Special:Redirect URL Builder ────────────────────────────────────
// This pattern is extremely stable — Wikipedia redirects to the actual CDN file,
// so even if the underlying file moves, this URL stays consistent.
const wiki = (filename) => `https://en.wikipedia.org/wiki/Special:Redirect/file/${filename}`;

// ─── League / Franchise Team Logo Map ─────────────────────────────────────────
// Covers all major domestic leagues worldwide.
// Keys are LOWERCASE full name OR common abbreviation as used by Cricbuzz.
// Fallback: If a team is not here, it gets a professional initials badge.
const leagueTeamLogoMap = {

    // ── IPL (Indian Premier League) ──────────────────────────────────────────
    'chennai super kings':              wiki('Chennai_Super_Kings_Logo.svg'),
    'csk':                              wiki('Chennai_Super_Kings_Logo.svg'),
    'mumbai indians':                   wiki('Mumbai_Indians_Logo.svg'),
    'mi':                               wiki('Mumbai_Indians_Logo.svg'),
    'royal challengers bengaluru':      wiki('Royal_Challengers_Bengaluru_logo.svg'),
    'royal challengers bangalore':      wiki('Royal_Challengers_Bengaluru_logo.svg'),
    'rcb':                              wiki('Royal_Challengers_Bengaluru_logo.svg'),
    'kolkata knight riders':            wiki('Kolkata_Knight_Riders_Logo.svg'),
    'kkr':                              wiki('Kolkata_Knight_Riders_Logo.svg'),
    'delhi capitals':                   wiki('Delhi_Capitals.svg'),
    'dc':                               wiki('Delhi_Capitals.svg'),
    'sunrisers hyderabad':              wiki('Sunrisers_Hyderabad.svg'),
    'srh':                              wiki('Sunrisers_Hyderabad.svg'),
    'rajasthan royals':                 wiki('Rajasthan_Royals_Logo.svg'),
    'rr':                               wiki('Rajasthan_Royals_Logo.svg'),
    'punjab kings':                     wiki('Punjab_Kings_Logo.svg'),
    'pbks':                             wiki('Punjab_Kings_Logo.svg'),
    'lucknow super giants':             wiki('Lucknow_Super_Giants_Logo.png'),
    'lsg':                              wiki('Lucknow_Super_Giants_Logo.png'),
    'gujarat titans':                   wiki('Gujarat_Titans_Logo.svg'),
    'gt':                               wiki('Gujarat_Titans_Logo.svg'),

    // ── WPL (Women's Premier League) ─────────────────────────────────────────
    'royal challengers bengaluru women': wiki('Royal_Challengers_Bengaluru_logo.svg'),
    'rcb-w':                             wiki('Royal_Challengers_Bengaluru_logo.svg'),
    'delhi capitals women':              wiki('Delhi_Capitals.svg'),
    'dc-w':                              wiki('Delhi_Capitals.svg'),
    'mumbai indians women':              wiki('Mumbai_Indians_Logo.svg'),
    'mi-w':                              wiki('Mumbai_Indians_Logo.svg'),
    'up warriorz':                       wiki('UP_Warriorz_logo.png'),
    'gujarat giants':                    wiki('Gujarat_Giants_WPL.png'),

    // ── PSL (Pakistan Super League) ───────────────────────────────────────────
    'karachi kings':                    wiki('Karachi_Kings_official_logo.svg'),
    'kk':                               wiki('Karachi_Kings_official_logo.svg'),
    'lahore qalandars':                 wiki('Lahore_Qalandars_official_logo.svg'),
    'lq':                               wiki('Lahore_Qalandars_official_logo.svg'),
    'islamabad united':                 wiki('Islamabad_United_official_logo.svg'),
    'iu':                               wiki('Islamabad_United_official_logo.svg'),
    'peshawar zalmi':                   wiki('Peshawar_Zalmi_official_logo.svg'),
    'pz':                               wiki('Peshawar_Zalmi_official_logo.svg'),
    'multan sultans':                   wiki('Multan_Sultans_logo.svg'),
    'ms':                               wiki('Multan_Sultans_logo.svg'),
    'quetta gladiators':                wiki('Quetta_Gladiators_official_logo.svg'),
    'qg':                               wiki('Quetta_Gladiators_official_logo.svg'),

    // ── BBL (Big Bash League — Australia) ─────────────────────────────────────
    'sydney sixers':                    wiki('Sydney_Sixers_logo.png'),
    'sys':                              wiki('Sydney_Sixers_logo.png'),
    'sydney thunder':                   wiki('Sydney_Thunder_logo.png'),
    'syt':                              wiki('Sydney_Thunder_logo.png'),
    'melbourne stars':                  wiki('Melbourne_Stars_logo.png'),
    'mls':                              wiki('Melbourne_Stars_logo.png'),
    'melbourne renegades':              wiki('Melbourne_Renegades_logo.png'),
    'mrs':                              wiki('Melbourne_Renegades_logo.png'),
    'brisbane heat':                    wiki('Brisbane_Heat_logo.png'),
    'bh':                               wiki('Brisbane_Heat_logo.png'),
    'hobart hurricanes':                wiki('Hobart_Hurricanes_logo.png'),
    'ht':                               wiki('Hobart_Hurricanes_logo.png'),
    'perth scorchers':                  wiki('Perth_Scorchers_logo.png'),
    'ps':                               wiki('Perth_Scorchers_logo.png'),
    'adelaide strikers':                wiki('Adelaide_Strikers_logo.png'),
    'as':                               wiki('Adelaide_Strikers_logo.png'),

    // ── CPL (Caribbean Premier League) ────────────────────────────────────────
    'trinbago knight riders':           wiki('Trinbago_Knight_Riders_logo.png'),
    'tkr':                              wiki('Trinbago_Knight_Riders_logo.png'),
    'guyana amazon warriors':           wiki('Guyana_Amazon_Warriors_logo.png'),
    'guy':                              wiki('Guyana_Amazon_Warriors_logo.png'),
    'jamaica tallawahs':                wiki('Jamaica_Tallawahs_logo.png'),
    'jam':                              wiki('Jamaica_Tallawahs_logo.png'),
    'barbados royals':                  wiki('Barbados_Royals_logo.png'),
    'bar':                              wiki('Barbados_Royals_logo.png'),
    'saint lucia kings':                wiki('Saint_Lucia_Kings_logo.png'),
    'st lucia kings':                   wiki('Saint_Lucia_Kings_logo.png'),
    'slk':                              wiki('Saint_Lucia_Kings_logo.png'),
    'st kitts and nevis patriots':      wiki('St_Kitts_and_Nevis_Patriots_logo.png'),
    'saint kitts and nevis patriots':   wiki('St_Kitts_and_Nevis_Patriots_logo.png'),
    'snp':                              wiki('St_Kitts_and_Nevis_Patriots_logo.png'),

    // ── The Hundred (England) ──────────────────────────────────────────────────
    'oval invincibles':                 wiki('Oval_Invincibles_logo.svg'),
    'ovi':                              wiki('Oval_Invincibles_logo.svg'),
    'manchester originals':             wiki('Manchester_Originals_logo.svg'),
    'mnr':                              wiki('Manchester_Originals_logo.svg'),
    'birmingham phoenix':               wiki('Birmingham_Phoenix_logo.svg'),
    'bhp':                              wiki('Birmingham_Phoenix_logo.svg'),
    'trent rockets':                    wiki('Trent_Rockets_logo.svg'),
    'trf':                              wiki('Trent_Rockets_logo.svg'),
    'london spirit':                    wiki('London_Spirit_logo.svg'),
    'lns':                              wiki('London_Spirit_logo.svg'),
    'northern superchargers':           wiki('Northern_Superchargers_logo.svg'),
    'nhs':                              wiki('Northern_Superchargers_logo.svg'),
    'welsh fire':                       wiki('Welsh_Fire_logo.svg'),
    'wef':                              wiki('Welsh_Fire_logo.svg'),
    'southern brave':                   wiki('Southern_Brave_logo.svg'),
    'sbs':                              wiki('Southern_Brave_logo.svg'),

    // ── SA20 (South Africa) ────────────────────────────────────────────────────
    'joburg super kings':               wiki('Joburg_Super_Kings_logo.png'),
    'jbg':                              wiki('Joburg_Super_Kings_logo.png'),
    'durban super giants':              wiki('Durban_Super_Giants_logo.png'),
    'durban sg':                        wiki('Durban_Super_Giants_logo.png'),
    'dur':                              wiki('Durban_Super_Giants_logo.png'),
    'mi cape town':                     wiki('MI_Cape_Town_logo.png'),
    'mi-ct':                            wiki('MI_Cape_Town_logo.png'),
    'pretoria capitals':                wiki('Pretoria_Capitals_logo.png'),
    'pre':                              wiki('Pretoria_Capitals_logo.png'),
    'paarl royals':                     wiki('Paarl_Royals_logo.png'),
    'paa':                              wiki('Paarl_Royals_logo.png'),
    'sunrisers eastern cape':           wiki('Sunrisers_Eastern_Cape_logo.png'),
    'sec sunrisers eastern cape':       wiki('Sunrisers_Eastern_Cape_logo.png'),
    'sec':                              wiki('Sunrisers_Eastern_Cape_logo.png'),

    // ── ILT20 (International League T20 — UAE) ─────────────────────────────────
    'dubai capitals':                   wiki('Dubai_Capitals_logo.png'),
    'dsc':                              wiki('Dubai_Capitals_logo.png'),
    'abu dhabi knight riders':          wiki('Abu_Dhabi_Knight_Riders_logo.png'),
    'ab':                               wiki('Abu_Dhabi_Knight_Riders_logo.png'),
    'gulf giants':                      wiki('Gulf_Giants_logo.png'),
    'guw':                              wiki('Gulf_Giants_logo.png'),
    'sharjah warriorz':                 wiki('Sharjah_Warriorz_logo.png'),
    'shj':                              wiki('Sharjah_Warriorz_logo.png'),
    'desert vipers':                    wiki('Desert_Vipers_logo.png'),
    'dvl':                              wiki('Desert_Vipers_logo.png'),

    // ── BPL (Bangladesh Premier League) ───────────────────────────────────────
    'fortune barishal':                 wiki('Fortune_Barishal_logo.png'),
    'comilla victorians':               wiki('Comilla_Victorians_logo.png'),
    'rangpur riders':                   wiki('Rangpur_Riders_logo.png'),
    'sylhet strikers':                  wiki('Sylhet_Strikers_logo.png'),
    'chattogram challengers':           wiki('Chattogram_Challengers_logo.png'),
    'khulna tigers':                    wiki('Khulna_Tigers_logo.png'),
    'dhaka dominators':                 wiki('Dhaka_Dominators_logo.png'),

    // ── LPL (Lanka Premier League) ─────────────────────────────────────────────
    'jaffna kings':                     wiki('Jaffna_Kings_logo.png'),
    'jaffna stallions':                 wiki('Jaffna_Kings_logo.png'),
    'js':                               wiki('Jaffna_Kings_logo.png'),
    'colombo strikers':                 wiki('Colombo_Strikers_logo.png'),
    'galle gladiators':                 wiki('Galle_Gladiators_logo.png'),
    'dambulla aura':                    wiki('Dambulla_Aura_logo.png'),
    'dambulla giants':                  wiki('Dambulla_Aura_logo.png'),
    'kandy falcons':                    wiki('Kandy_Falcons_logo.png'),
    'kandy warriors':                   wiki('Kandy_Falcons_logo.png'),

    // ── MLC (Major League Cricket — USA) ──────────────────────────────────────
    'mi new york':                      wiki('MI_New_York_logo.png'),
    'miny':                             wiki('MI_New_York_logo.png'),
    'los angeles knight riders':        wiki('Los_Angeles_Knight_Riders_logo.png'),
    'la knight riders':                 wiki('Los_Angeles_Knight_Riders_logo.png'),
    'lat':                              wiki('Los_Angeles_Knight_Riders_logo.png'),
    'seattle orcas':                    wiki('Seattle_Orcas_logo.png'),
    'sei':                              wiki('Seattle_Orcas_logo.png'),
    'san francisco unicorns':           wiki('San_Francisco_Unicorns_logo.png'),
    'sft':                              wiki('San_Francisco_Unicorns_logo.png'),
    'washington freedom':               wiki('Washington_Freedom_logo.png'),
    'wsh':                              wiki('Washington_Freedom_logo.png'),
    'texas super kings':                wiki('Texas_Super_Kings_logo.png'),
    'txs':                              wiki('Texas_Super_Kings_logo.png'),

    // ── English County Cricket ─────────────────────────────────────────────────
    'surrey':                           wiki('Surrey_CCC_Logo.svg'),
    'essex':                            wiki('UntitledEC.jpg'),
    'kent':                             wiki('Kent_CCC_Logo.svg'),
    'hampshire':                        wiki('Hampshire_CCC_logo.svg'),
    'lancashire':                       wiki('Lancashire_CCC_Logo.svg'),
    'yorkshire':                        wiki('Yorkshire_CCC_Logo.svg'),
    'middlesex':                        wiki('Middlesex_CCC_Logo.svg'),
    'nottinghamshire':                  wiki('NottinghamshireCountyCricketClubLogo.svg'),
    'sussex':                           wiki('Sussex_CCC_Logo.svg'),
    'warwickshire':                     wiki('Warwickshire_CCC_Logo.svg'),
    'worcestershire':                   wiki('Worcestershire_CCC_Logo.svg'),
    'derbyshire':                       wiki('Derbyshire_CCC_Logo.svg'),
    'durham':                           wiki('Durham_CCC_Logo.svg'),
    'glamorgan':                        wiki('Glamorgan_Cricket_Logo.svg'),
    'gloucestershire':                  wiki('Gloucestershire_CCC_Logo.svg'),
    'leicestershire':                   wiki('Leicestershire_County_Cricket_Club_logo.svg'),
    'northamptonshire':                 wiki('Northamptonshire_CCC_Logo.svg'),
    'somerset':                         wiki('Somerset_CCC_Logo.svg'),
    // Common county abbreviations used by Cricbuzz
    'leic':                             wiki('Leicestershire_County_Cricket_Club_logo.svg'),
    'ess':                              wiki('UntitledEC.jpg'),
    'surr':                             wiki('Surrey_CCC_Logo.svg'),
    'yorks':                            wiki('Yorkshire_CCC_Logo.svg'),
    'lancs':                            wiki('Lancashire_CCC_Logo.svg'),
    'kent ccc':                         wiki('Kent_CCC_Logo.svg'),
    'mdx':                              wiki('Middlesex_CCC_Logo.svg'),
    'notts':                            wiki('NottinghamshireCountyCricketClubLogo.svg'),
    'suss':                             wiki('Sussex_CCC_Logo.svg'),
    'warks':                            wiki('Warwickshire_CCC_Logo.svg'),
    'worcs':                            wiki('Worcestershire_CCC_Logo.svg'),
    'derb':                             wiki('Derbyshire_CCC_Logo.svg'),
    'dur-cc':                           wiki('Durham_CCC_Logo.svg'),
    'glam':                             wiki('Glamorgan_Cricket_Logo.svg'),
    'glos':                             wiki('Gloucestershire_CCC_Logo.svg'),
    'nhants':                           wiki('Northamptonshire_CCC_Logo.svg'),
    'somer':                            wiki('Somerset_CCC_Logo.svg'),
    'hamp':                             wiki('Hampshire_CCC_logo.svg'),
    'ham':                              wiki('Hampshire_CCC_logo.svg'),

    // ── South African Domestic ─────────────────────────────────────────────────
    'lions':                            wiki('Highveld_Lions_cricket_logo.svg'),
    'titans':                           wiki('Titans_Cricket_Logo.svg'),
    'dolphins':                         wiki('Dolphins_Cricket_Logo.svg'),
    'warriors':                         wiki('Warriors_Cricket_Logo.svg'),
    'cape cobras':                      wiki('Cape_Cobras_Cricket_Logo.svg'),
    'western province':                 wiki('Cape_Cobras_Cricket_Logo.svg'),
    'knights':                          wiki('Knights_Cricket_Logo.svg'),

    // ── New Zealand Domestic ───────────────────────────────────────────────────
    'auckland':                         wiki('Auckland_Aces_cricket_logo.svg'),
    'auckland aces':                    wiki('Auckland_Aces_cricket_logo.svg'),
    'wellington':                       wiki('Wellington_Firebirds_cricket_logo.svg'),
    'wellington firebirds':             wiki('Wellington_Firebirds_cricket_logo.svg'),
    'central districts':                wiki('Central_Stags_cricket_logo.svg'),
    'central stags':                    wiki('Central_Stags_cricket_logo.svg'),
    'canterbury':                       wiki('Canterbury_Cricket_Logo.png'),
    'otago':                            wiki('Otago_Volts_cricket_logo.svg'),
    'otago volts':                      wiki('Otago_Volts_cricket_logo.svg'),
    'northern districts':               wiki('Northern_Knights_cricket_logo.svg'),
    'northern knights':                 wiki('Northern_Knights_cricket_logo.svg'),

    // ── Australian Domestic ────────────────────────────────────────────────────
    'new south wales':                  wiki('New_South_Wales_Blues_cricket_logo.png'),
    'nsw blues':                        wiki('New_South_Wales_Blues_cricket_logo.png'),
    'victoria':                         wiki('Victoria_Bushrangers_cricket_logo.png'),
    'victoria bushrangers':             wiki('Victoria_Bushrangers_cricket_logo.png'),
    'queensland':                       wiki('Queensland_Bulls_cricket_logo.png'),
    'queensland bulls':                 wiki('Queensland_Bulls_cricket_logo.png'),
    'south australia':                  wiki('South_Australia_Redbacks_cricket_logo.png'),
    'sa redbacks':                      wiki('South_Australia_Redbacks_cricket_logo.png'),
    'western australia':                wiki('Western_Australia_Warriors_cricket_logo.png'),
    'wa warriors':                      wiki('Western_Australia_Warriors_cricket_logo.png'),
    'tasmania':                         wiki('Tasmania_Tigers_cricket_logo.png'),
    'tasmania tigers':                  wiki('Tasmania_Tigers_cricket_logo.png'),
};

// ─── Local Downloaded Flag/Logo Map ──────────────────────────────────────────
// Maps team names to locally stored PNG files in /public/flags/
// Priority: AFTER Flagpedia (international countries) but BEFORE Wikipedia CDN.
// Keys are LOWERCASE full name OR common abbreviation exactly as Cricbuzz sends them.
const localFlagMap = {

    // ── England / England Lions ──────────────────────────────────────────────
    'england lions':                '/flags/england.png',
    'enga':                         '/flags/england.png',
    'england a':                    '/flags/england.png',
    'england':                      '/flags/england.png',

    // ── Sri Lanka / Sri Lanka A ──────────────────────────────────────────────
    'sri lanka':                    '/flags/srilanka.png',
    'sl':                           '/flags/srilanka.png',
    'sri lanka a':                  '/flags/srilanka.png',
    'sla':                          '/flags/srilanka.png',
    'sri lanka women':              '/flags/srilanka.png',
    'slw':                          '/flags/srilanka.png',
    'sri lanka w':                  '/flags/srilanka.png',

    // ── T20 Mumbai 2026 ───────────────────────────────────────────────────────
    'aakash tigers mws':            '/flags/t20_mumbai_2026/atmws.png',
    'atmws':                        '/flags/t20_mumbai_2026/atmws.png',
    'msc maratha royals':           '/flags/t20_mumbai_2026/mscmr.png',
    'mscmr':                        '/flags/t20_mumbai_2026/mscmr.png',
    'bandra blasters':              '/flags/t20_mumbai_2026/bb.png',
    'eagle thane strikers':         '/flags/t20_mumbai_2026/ets.png',
    // Additional T20 Mumbai teams (may appear later in season)
    'north mumbai panthers':        '/flags/t20_mumbai_2026/atmws.png',
    'triumphs knights mne':         '/flags/t20_mumbai_2026/ets.png',

    // ── IPL 2026 ─────────────────────────────────────────────────────────────
    'chennai super kings':          '/flags/ipl_2026/csk.png',
    'csk':                          '/flags/ipl_2026/csk.png',
    'mumbai indians':               '/flags/ipl_2026/mi.png',
    'mi':                           '/flags/ipl_2026/mi.png',
    'royal challengers bengaluru':  '/flags/ipl_2026/rcb.png',
    'royal challengers bangalore':  '/flags/ipl_2026/rcb.png',
    'rcb':                          '/flags/ipl_2026/rcb.png',
    'kolkata knight riders':        '/flags/ipl_2026/kkr.png',
    'kkr':                          '/flags/ipl_2026/kkr.png',
    'delhi capitals':               '/flags/ipl_2026/dc.png',
    'dc':                           '/flags/ipl_2026/dc.png',
    'sunrisers hyderabad':          '/flags/ipl_2026/srh.png',
    'srh':                          '/flags/ipl_2026/srh.png',
    'rajasthan royals':             '/flags/ipl_2026/rr.png',
    'rr':                           '/flags/ipl_2026/rr.png',
    'punjab kings':                 '/flags/ipl_2026/pbks.png',
    'pbks':                         '/flags/ipl_2026/pbks.png',
    'lucknow super giants':         '/flags/ipl_2026/lsg.png',
    'lsg':                          '/flags/ipl_2026/lsg.png',
    'gujarat titans':               '/flags/ipl_2026/gt.png',
    'gt':                           '/flags/ipl_2026/gt.png',

    // ── T20 Blast 2026 (English County — Men) ────────────────────────────────
    'surrey':                       '/flags/t20_blast_2026/surrey.png',
    'kent':                         '/flags/t20_blast_2026/kent.png',
    'derbyshire':                   '/flags/t20_blast_2026/derbyshire.png',
    'essex':                        '/flags/t20_blast_2026/essex.png',
    'durham':                       '/flags/t20_blast_2026/durham.png',
    'nottinghamshire':              '/flags/t20_blast_2026/notts.png',
    'warwickshire':                 '/flags/t20_blast_2026/warks.png',
    'northamptonshire':             '/flags/t20_blast_2026/nhants.png',
    'middlesex':                    '/flags/t20_blast_2026/mdx.png',
    'hampshire':                    '/flags/t20_blast_2026/hamp.png',
    'gloucestershire':              '/flags/t20_blast_2026/glos.png',
    'yorkshire':                    '/flags/t20_blast_2026/yorks.png',
    'sussex':                       '/flags/t20_blast_2026/suss.png',
    'somerset':                     '/flags/t20_blast_2026/somer.png',
    'glamorgan':                    '/flags/t20_blast_2026/glam.png',
    'lancashire':                   '/flags/t20_blast_2026/lancs.png',
    'leicestershire':               '/flags/t20_blast_2026/leic.png',
    'worcestershire':               '/flags/t20_blast_2026/worcs.png',

    // ── Women's T20 Blast 2026 ────────────────────────────────────────────────
    'surrey women':                 '/flags/womens_t20_blast_2026/surrey_w.png',
    'somerset women':               '/flags/womens_t20_blast_2026/somerset_w.png',
    'lancashire women':             '/flags/womens_t20_blast_2026/lancashire_w.png',
    'essex women':                  '/flags/womens_t20_blast_2026/essex_w.png',
    'the blaze women':              '/flags/womens_t20_blast_2026/the_blaze_w.png',
    'durham women':                 '/flags/womens_t20_blast_2026/durham_w.png',
    'yorkshire women':              '/flags/womens_t20_blast_2026/yorkshire_w.png',
    'hampshire women':              '/flags/womens_t20_blast_2026/hampshire_w.png',
    'warwickshire women':           '/flags/womens_t20_blast_2026/warwickshire_w.png',

    // ── Women's T20 Blast League Two 2026 ────────────────────────────────────
    'sussex women':                 '/flags/womens_t20_blast_league_two_2026/sussex_w.png',
    'glamorgan women':              '/flags/womens_t20_blast_league_two_2026/glamorgan_w.png',
    'worcestershire women':         '/flags/womens_t20_blast_league_two_2026/worcestershire_w.png',
    'derbyshire women':             '/flags/womens_t20_blast_league_two_2026/derbyshire_w.png',
    'northamptonshire women':       '/flags/womens_t20_blast_league_two_2026/northamptonshire_w.png',
    'middlesex women':              '/flags/womens_t20_blast_league_two_2026/middlesex_w.png',
    'gloucestershire women':        '/flags/womens_t20_blast_league_two_2026/gloucestershire_w.png',
    'kent women':                   '/flags/womens_t20_blast_league_two_2026/kent_w.png',

    // ── ICC Africa T20 WC Qualifier 2026 (teams NOT on Flagpedia) ────────────
    // Note: Rwanda, Botswana, Sierra Leone, Kenya, Cameroon are on Flagpedia — left unchanged
    'mali':                         '/flags/t20_wc_africa_qualifier_a_2026/mli.png',
    'ivory coast':                  '/flags/t20_wc_africa_qualifier_a_2026/civ.png',
    "cote d'ivoire":                '/flags/t20_wc_africa_qualifier_a_2026/civ.png',
};

// ─── UI Avatars Initials Badge Generator ─────────────────────────────────────
// Professional, colorful fallback for any team not in the logo map.
// Uses a deterministic color based on team name hash so the same team
// always gets the same color across refreshes.
const getInitialsBadge = (teamName) => {
    if (!teamName) return null;
    let hash = 0;
    for (let i = 0; i < teamName.length; i++) {
        hash = teamName.charCodeAt(i) + ((hash << 5) - hash);
    }
    const c = (hash & 0x00FFFFFF).toString(16).toUpperCase();
    const color = '000000'.substring(0, 6 - c.length) + c;
    
    // Scale down the font-size for acronyms longer than 2 characters
    // so they perfectly fit inside the circle without overflowing
    let fontSize = 0.5; // default for 1-2 chars
    if (teamName.length === 3) fontSize = 0.4;
    else if (teamName.length === 4) fontSize = 0.33;
    else if (teamName.length >= 5) fontSize = 0.28;

    return `https://ui-avatars.com/api/?name=${encodeURIComponent(teamName)}&background=${color}&color=fff&rounded=true&bold=true&size=128&font-size=${fontSize}`;
};

// ─── Comprehensive mapping of team names to ISO country codes for Flagpedia ──
const teamToCountryCode = {
    // International Teams (Full names)
    'india': 'in',
    'australia': 'au',
    'england': 'gb',
    'pakistan': 'pk',
    'new zealand': 'nz',
    'south africa': 'za',
    'sri lanka': 'lk',
    'bangladesh': 'bd',
    'afghanistan': 'af',
    'zimbabwe': 'zw',
    'ireland': 'ie',
    'netherlands': 'nl',
    'scotland': 'gb-sct',
    'usa': 'us',
    'united states': 'us',
    'united states of america': 'us',
    'canada': 'ca',
    'namibia': 'na',
    'oman': 'om',
    'nepal': 'np',
    'uae': 'ae',
    'united arab emirates': 'ae',
    'hong kong': 'hk',
    'papua new guinea': 'pg',
    'kenya': 'ke',
    'bermuda': 'bm',
    'italy': 'it',
    'germany': 'de',
    'jersey': 'je',
    'belgium': 'be',
    'france': 'fr',
    'spain': 'es',
    'denmark': 'dk',
    'singapore': 'sg',
    'malaysia': 'my',
    'uganda': 'ug',
    'tanzania': 'tz',
    'rwanda': 'rw',
    'botswana': 'bw',

    // West Indies
    'west indies': 'jm',
    'windies': 'jm',

    // ── Common 3-letter Abbreviations ─────────────────────────────────────────
    'ind': 'in',
    'aus': 'au',
    'eng': 'gb-eng',
    'pak': 'pk',
    'nz': 'nz',
    'rsa': 'za',
    'sa': 'za',
    'sl': 'lk',
    'ban': 'bd',
    'afg': 'af',
    'zim': 'zw',
    'ire': 'ie',
    'ned': 'nl',
    'sco': 'gb-sct',
    'nam': 'na',
    'ita': 'it',
    'it': 'it',
    'ger': 'de',
    'ue': 'ae',
    'oma': 'om',
    'nep': 'np',
    'hk': 'hk',
    'png': 'pg',
    'ken': 'ke',
    'ber': 'bm',
    'can': 'ca',
    'sin': 'sg',
    'mal': 'my',
    'uga': 'ug',
    'wi': 'jm',
    'us': 'us',

    // ── Associate / Emerging Cricket Nations ──────────────────────────────────
    // Europe
    'sweden': 'se',
    'swe': 'se',
    'malta': 'mt',
    'mlt': 'mt',
    'slovenia': 'si',
    'slv': 'si',
    'slo': 'si',
    'guernsey': 'gg',
    'ggy': 'gg',
    'jersey': 'je',
    'jey': 'je',
    'norway': 'no',
    'nor': 'no',
    'finland': 'fi',
    'fin': 'fi',
    'austria': 'at',
    'aut': 'at',
    'czech republic': 'cz',
    'czechia': 'cz',
    'cze': 'cz',
    'croatia': 'hr',
    'cro': 'hr',
    'hungary': 'hu',
    'hun': 'hu',
    'luxembourg': 'lu',
    'lux': 'lu',
    'portugal': 'pt',
    'por': 'pt',
    'switzerland': 'ch',
    'sui': 'ch',
    'greece': 'gr',
    'gre': 'gr',
    'romania': 'ro',
    'rom': 'ro',
    'bulgaria': 'bg',
    'bul': 'bg',
    'serbia': 'rs',
    'srb': 'rs',
    'turkey': 'tr',
    'tur': 'tr',
    'estonia': 'ee',
    'est': 'ee',
    'latvia': 'lv',
    'lat': 'lv',
    'lithuania': 'lt',
    'lit': 'lt',
    'cyprus': 'cy',
    'cyp': 'cy',
    'isle of man': 'im',
    'iom': 'im',
    'gibraltar': 'gi',
    'gib': 'gi',
    // Africa
    'nigeria': 'ng',
    'nig': 'ng',
    'ghana': 'gh',
    'gha': 'gh',
    'sierra leone': 'sl',
    'sle': 'sl',
    'cameroon': 'cm',
    'cam': 'cm',
    'mozambique': 'mz',
    'moz': 'mz',
    'lesotho': 'ls',
    'les': 'ls',
    'malawi': 'mw',
    'mwi': 'mw',
    'eswatini': 'sz',
    'swaziland': 'sz',
    'swz': 'sz',
    'ethiopia': 'et',
    'eth': 'et',
    // Asia/Pacific
    'maldives': 'mv',
    'mdv': 'mv',
    'bahrain': 'bh',
    'bhr': 'bh',
    'kuwait': 'kw',
    'kwt': 'kw',
    'qatar': 'qa',
    'qat': 'qa',
    'thailand': 'th',
    'tha': 'th',
    'vanuatu': 'vu',
    'van': 'vu',
    'samoa': 'ws',
    'sam': 'ws',
    'indonesia': 'id',
    'idn': 'id',
    'philippines': 'ph',
    'phi': 'ph',
    'japan': 'jp',
    'jpn': 'jp',
    'south korea': 'kr',
    'kor': 'kr',
    'china': 'cn',
    'chn': 'cn',
    'bhutan': 'bt',
    'bhu': 'bt',
    'myanmar': 'mm',
    'mya': 'mm',
    // Americas
    'cayman islands': 'ky',
    'cay': 'ky',
    'panama': 'pa',
    'pan': 'pa',
    'argentina': 'ar',
    'arg': 'ar',
    'brazil': 'br',
    'bra': 'br',
    'mexico': 'mx',
    'mex': 'mx',
    'belize': 'bz',
    'blz': 'bz',

    // ── National Sub-teams (U19, A, Women's) ──────────────────────────────────
    'india a': 'in',
    'india u19': 'in',
    'in19': 'in',
    'ina': 'in',
    'india women': 'in',
    'india w': 'in',
    'england u19': 'gb-eng',
    'england women': 'gb-eng',
    'england w': 'gb-eng',
    'australia u19': 'au',
    'australia a': 'au',
    'australia women': 'au',
    'australia w': 'au',
    'pakistan a': 'pk',
    'pakistan women': 'pk',
    'pakistan w': 'pk',
    'afghanistan u19': 'af',
    'af19': 'af',
    'new zealand women': 'nz',
    'new zealand w': 'nz',
    'nzwa': 'nz',
    'nz women': 'nz',
    'sri lanka women': 'lk',
    'sri lanka w': 'lk',
    'slwa': 'lk',
    'sl women': 'lk',
    'south africa women': 'za',
    'south africa w': 'za',
    'bangladesh women': 'bd',
    'bangladesh w': 'bd',
    'west indies women': 'jm',
    'wi women': 'jm',
};

// ─── Indian State Teams ────────────────────────────────────────────────────────
const indianStateTeams = new Set([
    'madhya pradesh', 'jammu and kashmir', 'jharkhand', 'uttarakhand',
    'mumbai', 'delhi', 'karnataka', 'tamil nadu', 'bengal', 'baroda',
    'saurashtra', 'vidarbha', 'rajasthan', 'gujarat', 'punjab', 'haryana',
    'andhra', 'kerala', 'hyderabad', 'uttar pradesh', 'odisha', 'assam',
    'goa', 'himachal pradesh', 'services', 'railways', 'chandigarh',
    'chhattisgarh', 'tripura', 'meghalaya', 'manipur', 'nagaland',
    'mizoram', 'arunachal pradesh', 'sikkim', 'puducherry',
    // Shortcodes
    'mp', 'jk', 'jhkd', 'utk', 'mum', 'del', 'kar', 'tn', 'ben', 'bar',
    'sau', 'vid', 'raj', 'guj', 'pun', 'har', 'ap', 'ker', 'hyd', 'up'
]);

/**
 * Check if a team is a state-level team (domestic Indian)
 */
export const isStateTeam = (teamName) => {
    if (!teamName) return false;
    return indianStateTeams.has(teamName.toLowerCase().trim());
};

/**
 * Get locally downloaded flag/logo URL for a team.
 * Only exact matches — no fuzzy matching to avoid false positives.
 * @param {string} teamName
 * @returns {string|null}
 */
export const getLocalFlagUrl = (teamName) => {
    if (!teamName) return null;
    const n = teamName.toLowerCase().trim();
    
    // 1. Exact match
    if (localFlagMap[n]) return localFlagMap[n];

    // 2. Partial match — if team name contains a key
    for (const [key, path] of Object.entries(localFlagMap)) {
        if (key.length >= 3 && n.includes(key)) return path;
    }

    return null;
};

/**
 * Get league/franchise team logo from the static dictionary.
 * Checks both exact match and partial/contains match.
 * @param {string} teamName
 * @returns {string|null}
 */
export const getLeagueLogoUrl = (teamName) => {
    if (!teamName) return null;
    const n = teamName.toLowerCase().trim();

    // 1. Exact match (most reliable — covers full names and known abbreviations)
    if (leagueTeamLogoMap[n]) return leagueTeamLogoMap[n];

    // 2. Partial match — check if the full team name CONTAINS a known key
    // Only use keys that are long enough (>= 4 chars) to avoid false positives
    for (const [key, url] of Object.entries(leagueTeamLogoMap)) {
        if (key.length >= 4 && n.includes(key)) return url;
    }

    return null;
};

/**
 * Get Flagpedia URL for international teams.
 * Skips fuzzy match if the team is known to be a league/franchise team.
 * @param {string} teamName
 * @returns {string|null}
 */
export const getFlagUrl = (teamName) => {
    if (!teamName) return null;

    const normalizedName = teamName.toLowerCase().trim();

    // Don't map state teams to Flagpedia
    if (isStateTeam(normalizedName)) return null;

    // Special handling for West Indies
    const westIndiesVariants = ['west indies', 'windies', 'wi'];
    if (westIndiesVariants.some(v => normalizedName === v || normalizedName.includes('west indies'))) {
        return WEST_INDIES_FLAG_URL;
    }

    // 1. Exact match (short codes like 'ind', 'aus', 'ban')
    const countryCode = teamToCountryCode[normalizedName];
    if (countryCode) return `https://flagcdn.com/w80/${countryCode}.png`;

    // 2. GUARD: If this is a known league/franchise team, do NOT fuzzy-match against
    //    country names. E.g. 'Mumbai Indians' contains 'india' but is NOT India.
    if (leagueTeamLogoMap[normalizedName]) return null;
    // Also check partial league key match to catch names like 'Mumbai Indians Women'
    for (const key of Object.keys(leagueTeamLogoMap)) {
        if (key.length >= 4 && normalizedName.includes(key)) return null;
    }

    // 3. Safe partial/fuzzy Flagpedia match (only long keys to prevent false positives)
    for (const [key, code] of Object.entries(teamToCountryCode)) {
        if (key.length <= 3) continue;
        if (normalizedName.includes(key)) return `https://flagcdn.com/w80/${code}.png`;
    }

    return null;
};

/**
 * Get just the country code for a team
 */
export const getCountryCode = (teamName) => {
    if (!teamName) return null;
    return teamToCountryCode[teamName.toLowerCase().trim()] || null;
};

/**
 * Attach flag/logo URLs to a match object's teams.
 *
 * Priority (per team):
 *   1. Flagpedia country flag  → International teams
 *   2. League logo dictionary  → IPL, BBL, PSL, County, etc.
 *   3. API-provided image      → Any img URL from teamInfo
 *   4. Initials badge          → Clean professional fallback, never broken
 */
export const attachFlagsToMatch = (match) => {
    if (!match) return match;

    const team1Name = match.teams?.[0] || match.teamInfo?.[0]?.name || match.t1 || '';
    const team2Name = match.teams?.[1] || match.teamInfo?.[1]?.name || match.t2 || '';

    // API-provided images (from teamInfo.img, if any)
    const team1ApiImg = match.teamInfo?.[0]?.img || null;
    const team2ApiImg = match.teamInfo?.[1]?.img || null;

    const resolveFlag = (name, apiImg) => {
        if (!name) return getInitialsBadge('?');

        // 1. International country flag via Flagpedia CDN (never overridden)
        const countryFlag = getFlagUrl(name);
        if (countryFlag) return countryFlag;

        // 2. Locally downloaded flag/logo (served from our own server — most reliable)
        const localFlag = getLocalFlagUrl(name);
        if (localFlag) return localFlag;

        // 3. League/franchise Wikipedia CDN logo (fallback for unmapped teams)
        const leagueLogo = getLeagueLogoUrl(name);
        if (leagueLogo) return leagueLogo;

        // 4. API-provided image URL
        if (apiImg) return apiImg;

        // 5. Professional initials badge — deterministic color, always works
        return getInitialsBadge(name);
    };

    const team1Flag = resolveFlag(team1Name, team1ApiImg);
    const team2Flag = resolveFlag(team2Name, team2ApiImg);

    return {
        ...match,
        team1Flag,
        team2Flag,
    };
};

export default {
    getFlagUrl,
    getLeagueLogoUrl,
    getLocalFlagUrl,
    getCountryCode,
    attachFlagsToMatch,
    isStateTeam,
};
