import axios from 'axios';
import { fetchLiveMatchesScraped } from './services/cricbuzzScraperService.js';

axios.get('https://www.cricbuzz.com/cricket-match/live-scores', {headers:{'User-Agent':'Mozilla/5.0', 'RSC': '1'}})
    .then(res => {
        let dataStr = typeof res.data === 'string' ? res.data : JSON.stringify(res.data);
        dataStr = dataStr.replace(/\\"/g, '"');
        const regex = new RegExp(`"match"\\s*:\\s*\\{`, 'g');
        let count = 0;
        let match;
        while ((match = regex.exec(dataStr)) !== null) {
            count++;
        }
        console.log('Matches found with match regex:', count);
        
        const infoRegex = new RegExp(`"matchInfo"\\s*:\\s*\\{`, 'g');
        let countInfo = 0;
        while ((match = infoRegex.exec(dataStr)) !== null) {
            countInfo++;
        }
        console.log('Matches found with matchInfo regex:', countInfo);
    });
