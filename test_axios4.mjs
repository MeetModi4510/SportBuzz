import axios from 'axios';
const WC_STANDINGS_API_HOST = 'livescore6.p.rapidapi.com';
const apiKey = '8ff59ea88amshe58afcab9114126p143f30jsn45de62fd85e0';
async function test() {
    try {
        const res = await axios.get(
            `https://${WC_STANDINGS_API_HOST}/competitions/get-table`,
            {
                params: { CompId: '734' },
                headers: {
                    'x-rapidapi-key':  apiKey,
                    'x-rapidapi-host': WC_STANDINGS_API_HOST,
                },
                timeout: 10000,
            }
        );
        console.log("Keys:", Object.keys(res.data));
        console.log("Stages:", res.data?.Stages?.length);
    } catch(e) {
        console.log("Error", e);
    }
}
test();
