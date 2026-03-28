import axios from 'axios';

async function verify() {
    const IP = '10.19.33.75';
    const URL = `http://${IP}:5000/api/featured/matches`;
    
    console.log(`Checking ${URL}...`);
    try {
        const response = await axios.get(URL);
        const data = response.data;
        
        if (!data.success) {
            console.error('API Error:', data.message);
            return;
        }
        
        const cricket = data.data.cricket;
        console.log('Counts - Test:', cricket.test.length, 'ODI:', cricket.odi.length, 'T20:', cricket.t20.length);
        
        if (cricket.odi.length > 0) {
            console.log('\n--- Sample ODI Match Structure ---');
            console.log(JSON.stringify(cricket.odi[0], null, 2));
        } else {
            // If featured is empty, check internal categories by calling a logic simulation
            console.log('\n--- NO FEATURED MATCHES FOUND ---');
            console.log('This confirms why the frontend is empty. Now checking WHY they were filtered out...');
        }
    } catch (err) {
        console.error('Request failed:', err.message);
    }
}

verify();
