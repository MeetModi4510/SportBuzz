import axios from 'axios';

axios.get('https://www.cricbuzz.com/cricket-match/live-scores', {headers:{'User-Agent':'Mozilla/5.0'}})
    .then(async res => {
        const dataStr = typeof res.data === 'string' ? res.data : JSON.stringify(res.data);
        const idx = dataStr.indexOf('Bhopal');
        if (idx !== -1) {
            console.log(dataStr.substring(idx - 200, idx + 500));
        } else {
            console.log("Bhopal not found!");
        }
    });
