import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const testAdminAPI = async () => {
    try {
        const adminEmail = 'admin@sportbuzz.com';
        const adminPassword = 'AdminPassword123!';
        const baseURL = 'http://localhost:5000/api';

        console.log('--- Step 1: Login to get token ---');
        const loginRes = await axios.post(`${baseURL}/auth/login`, {
            email: adminEmail,
            password: adminPassword
        });

        if (!loginRes.data.success) {
            console.error('Login failed:', loginRes.data.message);
            return;
        }

        const token = loginRes.data.data.token;
        console.log('Login successful. Token obtained.');

        const config = {
            headers: {
                Authorization: `Bearer ${token}`
            }
        };

        console.log('\n--- Step 2: Test /admin/stats ---');
        try {
            const statsRes = await axios.get(`${baseURL}/admin/stats`, config);
            console.log('Stats Success:', JSON.stringify(statsRes.data, null, 2));
        } catch (e) {
            console.error('Stats Failed:', e.response?.data || e.message);
        }

        console.log('\n--- Step 3: Test /admin/users ---');
        try {
            const usersRes = await axios.get(`${baseURL}/admin/users`, config);
            console.log('Users Success:', `Found ${usersRes.data.data?.users?.length} users`);
            // console.log(JSON.stringify(usersRes.data, null, 2));
        } catch (e) {
            console.error('Users Failed:', e.response?.data || e.message);
        }

    } catch (error) {
        console.error('Test script error:', error.message);
    }
};

testAdminAPI();
