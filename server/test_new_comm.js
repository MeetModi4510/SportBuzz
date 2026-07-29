import axios from 'axios';

async function test() {
    const matchId = 129480;
    const url = `https://www.cricbuzz.com/live-cricket-full-commentary/${matchId}/match?_t=${Date.now()}`;
    const res = await axios.get(url, {
        headers: {
            'User-Agent': 'Mozilla/5.0',
            'RSC': '1',
            'x-nextjs-data': '1'
        }
    });
    
    let payloadStr = typeof res.data === 'string' ? res.data : JSON.stringify(res.data);
    const lines = payloadStr.split('\n');
    let comms = [];
    
    const searchObj = (obj) => {
        if (!obj) return;
        if (obj.commentaryList) {
            comms = obj.commentaryList;
            return true;
        }
        if (Array.isArray(obj)) {
            for(let item of obj) if(searchObj(item)) return true;
        } else if (typeof obj === 'object') {
            for(let key in obj) if(searchObj(obj[key])) return true;
        } else if (typeof obj === 'string' && obj.includes('"commentaryList"')) {
            try {
                let p = JSON.parse(obj);
                if(searchObj(p)) return true;
            } catch(e) {}
        }
        return false;
    };
    
    for (const line of lines) {
        const colonIdx = line.indexOf(':');
        if (colonIdx !== -1) {
            const jsonStr = line.substring(colonIdx + 1);
            try {
                let parsed = JSON.parse(jsonStr);
                if(searchObj(parsed)) break;
            } catch(e) { }
        }
    }
    
    console.log("Comms length:", comms.length);
    if (comms.length > 0) {
        console.log("Found:", JSON.stringify(comms[0]).substring(0, 100));
    }
}
test();
