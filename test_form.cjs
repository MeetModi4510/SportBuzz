const fs = require('fs');
const html = fs.readFileSync('cricbuzz_facts.html', 'utf8');
const idx = html.indexOf('Recent Form');
if (idx !== -1) {
    const snippet = html.substring(idx, idx + 2000);
    const cleanText = snippet.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
    console.log(cleanText.substring(0, 500));
} else {
    console.log("Not found in text");
}
