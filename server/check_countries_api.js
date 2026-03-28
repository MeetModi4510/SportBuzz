import axios from 'axios';

const API_KEY = '3609207a-ed09-4b47-9c3b-4adcd8e25176';
const API_URL = `https://api.cricapi.com/v1/countries?apikey=${API_KEY}&offset=0`;

const checkCountriesAPI = async () => {
    console.log("Fetching countries from CricketData.org API...\n");
    try {
        const response = await axios.get(API_URL);
        const countries = response.data.data || [];

        console.log(`Found ${countries.length} countries/teams\n`);
        console.log("Sample entries:\n");

        // Show first 20 entries
        countries.slice(0, 20).forEach((country, idx) => {
            console.log(`[${idx + 1}] ID: ${country.id}`);
            console.log(`    Name: ${country.name}`);
            console.log(`    Generic Name: ${country.genericName}`);
            console.log(`    Image: ${country.image || 'NO IMAGE'}`);
            console.log('');
        });

        // Also look for state teams specifically
        console.log("\n=== Looking for Indian State Teams ===\n");
        const stateTeams = countries.filter(c =>
            ['madhya pradesh', 'karnataka', 'mumbai', 'delhi', 'bengal', 'jharkhand', 'uttarakhand', 'jammu']
                .some(state => c.name?.toLowerCase().includes(state))
        );

        if (stateTeams.length > 0) {
            stateTeams.forEach(team => {
                console.log(`State Team: ${team.name}`);
                console.log(`  Image: ${team.image || 'NO IMAGE'}`);
            });
        } else {
            console.log("No state teams found in /countries endpoint");
        }

    } catch (error) {
        console.error("Error:", error.message);
    }
};

checkCountriesAPI();
