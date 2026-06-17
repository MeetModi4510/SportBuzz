import { fetchLiveMatchesScraped } from './services/cricbuzzScraperService.js';

fetchLiveMatchesScraped().then(matches => {
    matches.forEach(m => {
        console.log(m.name, '| State:', m.state, '| Status:', m.status, '| MatchStarted:', m.matchStarted);
    });
});
