import axios from 'axios';

axios.get('https://www.cricbuzz.com/cricket-match/live-scores', {headers:{'User-Agent':'Mozilla/5.0', 'RSC': '1'}})
    .then(res => {
        let dataStr = typeof res.data === 'string' ? res.data : JSON.stringify(res.data);
        dataStr = dataStr.replace(/\\"/g, '"');
        
        const infoRegex = new RegExp(`"matchInfo"\\s*:\\s*\\{`, 'g');
        let match;
        while ((match = infoRegex.exec(dataStr)) !== null) {
            let openBraces = 0;
            let startObjIdx = match.index + match[0].length - 1;
            let endObjIdx = -1;
            for (let i = startObjIdx; i < dataStr.length; i++) {
                if (dataStr[i] === '{') openBraces++;
                if (dataStr[i] === '}') openBraces--;
                if (openBraces === 0) { endObjIdx = i; break; }
            }
            if (endObjIdx !== -1) {
                let jsonStr = dataStr.substring(startObjIdx, endObjIdx + 1);
                try {
                    let info = JSON.parse(jsonStr);
                    if (info.team1?.teamName?.includes('Bhopal') || info.team2?.teamName?.includes('Bhopal')) {
                        console.log("FOUND Bhopal matchInfo:", JSON.stringify(info, null, 2));
                        // See what is around this matchInfo!
                        console.log("Surrounding data:", dataStr.substring(match.index - 50, match.index + 20));
                    }
                } catch(e) {}
            }
        }
    });
