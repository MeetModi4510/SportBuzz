
import axios from 'axios';

const BASE_URL = 'http://localhost:5000/api';

async function testMatch() {
    try {
        const res = await axios.get(`${BASE_URL}/cricket/matches`);
        const matches = res.data.data;
        if (!matches || matches.length === 0) {
            console.log('No matches found');
            return;
        }
        
        const id = matches[0].id;
        console.log('Testing with match ID:', id);
        
        try {
            const res2 = await axios.get(`${BASE_URL}/cricket/match/${id}/info`);
            console.log('Match info response received:', res2.data ? 'YES' : 'NO');
            console.log('Match ID in response:', res2.data?.data?.id);
        } catch (e) {
            console.log('Error fetching match info:', e.message);
            if (e.response) {
                console.log('Response status:', e.response.status);
                console.log('Response data:', e.response.data);
            }
        }
    } catch (e) {
        console.log('Error fetching matches:', e.message);
    }
}

testMatch();
