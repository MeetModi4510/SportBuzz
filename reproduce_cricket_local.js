
import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

const testCricketAPI = async () => {
    try {
        // 1. Signup to ensure valid user
        console.log('Signing up...');
        const email = `cricket_test_${Date.now()}@example.com`;
        const signupRes = await axios.post(`${API_URL}/auth/signup`, {
            fullName: 'Cricket Tester',
            email: email,
            password: 'password123'
        });
        const token = signupRes.data.data.token;
        console.log('✅ Signup successful');

        const headers = { Authorization: `Bearer ${token}` };

        // 2. Test Live Matches (Expect 0 Matches)
        console.log('\nFetching Live Matches (Expect 0)...');
        const liveRes = await axios.get(`${API_URL}/cricket/matches/live`, { headers });
        console.log('✅ Live Matches:', liveRes.data.count);

        // 3. Test Upcoming Matches (Expect 0 Matches)
        console.log('\nFetching Upcoming Matches (Expect 0)...');
        const upcomingRes = await axios.get(`${API_URL}/cricket/matches/upcoming`, { headers });
        console.log('✅ Upcoming Matches:', upcomingRes.data.count);

        // 4. Test Recent Matches and Scorecard
        console.log('\nFetching Recent Matches (Expect Real History)...');
        const recentRes = await axios.get(`${API_URL}/cricket/matches/recent`, { headers });
        console.log('✅ Recent Matches:', recentRes.data.count);

        if (recentRes.data.data.length > 0) {
            const match = recentRes.data.data[0];
            console.log('   Match 1:', match.homeTeam.name, 'vs', match.awayTeam.name);
            console.log('   ID:', match.id);

            // Test Scorecard
            console.log(`\nFetching Scorecard for ${match.id}...`);
            try {
                const scorecardRes = await axios.get(`${API_URL}/cricket/matches/${match.id}/scorecard`, { headers });
                if (scorecardRes.data.success) {
                    console.log('✅ Scorecard Fetched Successfully');
                    console.log('   Status:', scorecardRes.data.data.matchHeader.status);
                    console.log('   Innings Count:', scorecardRes.data.data.scoreCard.length);
                } else {
                    console.error('❌ Scorecard Failed:', scorecardRes.data);
                }
            } catch (err) {
                console.error('❌ Scorecard Error:', err.response ? err.response.data : err.message);
            }
        }

    } catch (error) {
        if (error.response && error.response.status === 401) {
            // Handle case where user doesn't exist yet
            console.log('⚠️ Login failed, trying to signup first...');
            try {
                const signupRes = await axios.post(`${API_URL}/auth/signup`, {
                    fullName: 'Cricket Tester',
                    email: 'test@example.com',
                    password: 'password123'
                });
                const token = signupRes.data.data.token;
                console.log('✅ Signup successful');
                // Retry tests recursively or just proceed (omitted for brevity, assume manual retry if needed)
            } catch (e) {
                console.error('❌ Signup failed:', e.message);
            }
        } else {
            console.error('❌ Error:', error.response ? error.response.data : error.message);
        }
    }
};

testCricketAPI();
