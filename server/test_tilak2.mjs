import axios from 'axios';
async function run() {
    try {
        const res = await axios.get('https://www.cricbuzz.com/profiles/14504/tilak-varma', {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
        });
        const match = res.data.match(/https:\/\/static\.cricbuzz\.com\/a\/img\/v1\/i1\/c[0-9]+\/tilak-varma\.jpg/i);
        console.log("TILAK VARMA CDN:", match ? match[0] : "Not found");
    } catch(e) { console.error(e.message); }
}
run();
