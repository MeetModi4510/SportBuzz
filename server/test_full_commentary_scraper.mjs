import { scrapeFullCommentary } from './services/cricbuzzScraperService.js';

// 129480 is a completed match
scrapeFullCommentary('129480', 'rsa-vs-sri-1st-test-sri-lanka-tour-of-south-africa-2024')
    .then(data => {
        console.log("Got commentary data:", JSON.stringify(data, null, 2));
    })
    .catch(console.error);
