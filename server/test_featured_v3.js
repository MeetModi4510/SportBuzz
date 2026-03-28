import axios from 'axios';

const LOCAL_URL = 'http://localhost:5000/api/featured/matches';

const testFeaturedMatches = async () => {
    console.log("Testing /api/featured/matches endpoint...\n");
    try {
        const response = await axios.get(LOCAL_URL);
        const data = response.data;

        if (data.success && data.data.cricket) {
            console.log("✅ Endpoint returned success!\n");

            ['test', 'odi', 't20'].forEach(format => {
                const category = data.data.cricket[format];
                console.log(`=== ${format.toUpperCase()} Matches ===`);

                if (category.liveMatch) {
                    console.log(`  [LIVE] ${category.liveMatch.name} (${category.liveMatch.status})`);
                } else {
                    console.log(`  [LIVE] None`);
                }

                if (category.completedMatch) {
                    console.log(`  [COMPLETED] ${category.completedMatch.name} (${category.completedMatch.status})`);
                } else {
                    console.log(`  [COMPLETED] None`);
                }

                if (category.upcomingMatch) {
                    console.log(`  [UPCOMING] ${category.upcomingMatch.name} (${category.upcomingMatch.date})`);
                } else {
                    console.log(`  [UPCOMING] None`);
                }
                console.log('');
            });

        } else {
            console.error("❌ Endpoint returned failure:", data);
        }

    } catch (error) {
        console.error("❌ Error calling endpoint:", error.message);
    }
};

testFeaturedMatches();
