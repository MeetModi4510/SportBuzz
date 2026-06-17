import axios from 'axios';

async function testTeamImage() {
    const urlsToTry = [
        'https://static.cricbuzz.com/a/img/v1/i1/c776177/i.jpg',
        'https://static.cricbuzz.com/a/img/v1/i1/c776177/team.jpg',
        'https://static.cricbuzz.com/a/img/v1/i1/c776177/flag.jpg',
        'https://static.cricbuzz.com/a/img/v1/152x152/i1/c776177/afghanistan.jpg'
    ];
    
    for (const url of urlsToTry) {
        try {
            const res = await axios.head(url);
            console.log(`Success: ${url} (Status: ${res.status})`);
        } catch(e) {
            console.log(`Failed: ${url} (${e.message})`);
        }
    }
}

testTeamImage();
