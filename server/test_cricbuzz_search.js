import axios from 'axios';

async function testCricbuzzPublicSearch() {
    try {
        const query = 'Wankhede';
        // Trying various public cricbuzz search APIs
        const url = `https://www.cricbuzz.com/api/search/results?q=${query}`;
        // Note: Cricbuzz uses a different structure for search, let's try the mobile API if known,
        // or just try rapidapi's global search?
        
        // Let's see if RapidAPI has a global search
        // There is usually a /stats/v1/search or something? No.
        
        // Wait, how about Google Programmable Search Engine / Custom Search API if the user has it? No.
        
        // Let's try Google Search via a FREE API like google-it (npm module) or duckduckgo-images or similar? No, duckduckgo-html is dead.
        
        // How about we try a Wikipedia API to get the list, and then we manually map the top 30?
        console.log("No easy search API. We will curate the top venues.");
    } catch(e) {
        console.log(e.message);
    }
}
testCricbuzzPublicSearch();
