import { fetchLiveMatchesScraped } from './services/cricbuzzScraperService.js';
fetchLiveMatchesScraped().then(res => {
    const withScore = res.find(m => m.score && m.score.length > 0);
    console.log(JSON.stringify(withScore, null, 2));
});
