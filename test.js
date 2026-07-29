import axios from 'axios';

// Check 270958 CDN
const id = 270958;
const verifyUrl = `https://www.hindustantimes.com/static-content/10s/commentary_${id}_1.json`;
console.log('Testing:', verifyUrl);
try {
    const res = await axios.get(verifyUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0' },
        timeout: 6000,
        validateStatus: s => s < 500
    });
    console.log('Status:', res.status);
    if (res.status === 200) {
        const balls = res.data?.Data?.length || 0;
        console.log('Balls in innings 1:', balls);
        if (balls > 0) console.log('First ball:', JSON.stringify(res.data.Data[0]).substring(0, 200));
    }
} catch(e) {
    console.log('Error:', e.message);
}

// Also try ndtv slug directly
const ndtvUrl = `/cricket/ned-vs-nam-scorecard-live-cricket-score-icc-cwc-league-2-2023-27-match-121-nena07312026270958`;
const fullNdtvUrl = `https://sports.ndtv.com${ndtvUrl}`;
console.log('\nNDTV slug date: July 31 2026 — is HT CDN available for this match ID?');
