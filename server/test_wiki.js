import axios from 'axios';

async function testWiki() {
    try {
        const title = encodeURIComponent('Hardik Pandya');
        const url = `https://en.wikipedia.org/w/api.php?action=query&titles=${title}&prop=pageimages&format=json&pithumbsize=500`;
        const res = await axios.get(url, {
            headers: {
                'User-Agent': 'SportBuzz/1.0 (pranshu87809@gmail.com)'
            }
        });
        const pages = res.data.query.pages;
        const pageId = Object.keys(pages)[0];
        console.log("Image URL:", pages[pageId].thumbnail?.source);
    } catch(e) {
        console.log("Error:", e.message);
    }
}
testWiki();
