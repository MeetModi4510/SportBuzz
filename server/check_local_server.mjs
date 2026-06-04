import axios from 'axios';

async function checkLocalServer() {
    console.log('Checking http://localhost:5000/api/featured/matches ...');
    try {
        const res = await axios.get('http://localhost:5000/api/featured/matches');
        const cricket = res.data?.data?.cricket;

        if (!cricket) {
            console.log('No cricket data found in response.');
            return;
        }

        ['test', 'odi', 't20'].forEach(format => {
            console.log(`\n--- ${format.toUpperCase()} ---`);
            const matches = cricket[format] || [];
            console.log(`Count: ${matches.length}`);
            matches.forEach(m => {
                console.log(`  ${m.name} | Status: ${m.status} | Started: ${m.matchStarted} | Ended: ${m.matchEnded}`);
                if (m.name.includes('Zimbabwe') || m.name.includes('AUS')) {
                    console.log('  *** FOUND SUSPECT MATCH ***');
                    console.log('  ID:', m.id);
                    console.log('  Score:', JSON.stringify(m.score));
                }
            });
        });

    } catch (err) {
        console.error('Error fetching from local server:', err.message);
        if (err.response) {
            console.error('Status:', err.response.status);
            console.error('Data:', err.response.data);
        }
    }
}

checkLocalServer();
