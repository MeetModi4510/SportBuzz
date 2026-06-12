import axios from 'axios';

async function test() {
    try {
        const res = await axios.get(
            `https://livescore6.p.rapidapi.com/leagues/v2/get-table`,
            {
                params: { Category: 'soccer', Ccd: 'world-cup-2026' },
                headers: {
                    'x-rapidapi-key':  '8ff59ea88amshe58afcab9114126p143f30jsn45de62fd85e0',
                    'x-rapidapi-host': 'livescore6.p.rapidapi.com',
                },
                timeout: 10000,
            }
        );
        console.log('Status:', res.status);
        console.log('Data keys:', Object.keys(res.data));
        console.log('Stages length:', res.data.Stages?.length);
    } catch (e) {
        console.error('Error:', e.message);
    }
}
test();
