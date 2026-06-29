const { fetchESPN } = require('./services/espnStatsguruScraper.js');
const classId = '1'; const gid = '61';
const BASE = 'https://stats.espncricinfo.com/ci/engine/stats/index.html';
const aggUrl = `${BASE}?class=${classId};ground=${gid};template=results;type=aggregate`;
const agg2Url = `${aggUrl};innings_number=2`;
console.log('agg2Url:', agg2Url);
fetchESPN(agg2Url).then(res => console.log('res status:', res.status, 'html len:', res.html.length)).catch(console.error);
