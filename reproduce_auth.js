
const API_URL = 'http://127.0.0.1:5000/api/auth';

const post = async (url, data) => {
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    });
    const json = await response.json();
    if (!response.ok) {
        throw new Error(json.message || response.statusText);
    }
    return json;
};

const testAuth = async () => {
    const user = {
        fullName: 'Test User ' + Date.now(),
        email: `test${Date.now()}@example.com`,
        password: 'password123'
    };

    console.log('Testing Signup with:', user);

    try {
        // 1. Signup
        const signupRes = await post(`${API_URL}/signup`, user);
        console.log('✅ Signup Successful:', signupRes);

        // 2. Login
        console.log('Testing Login...');
        const loginRes = await post(`${API_URL}/login`, {
            email: user.email,
            password: user.password
        });
        console.log('✅ Login Successful:', loginRes);

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
};

testAuth();
