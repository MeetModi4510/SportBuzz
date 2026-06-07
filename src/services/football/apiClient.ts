import axios from 'axios';

// Ensure you set VITE_API_FOOTBALL_KEY in your .env or hosting environment (e.g., Render)
const API_KEY = import.meta.env.VITE_API_FOOTBALL_KEY || 'b165c4ce20a61e2395bc8079dcfc30bc';
const API_HOST = 'v3.football.api-sports.io';

export const footballApiClient = axios.create({
  baseURL: `https://${API_HOST}`,
  headers: {
    'x-rapidapi-host': API_HOST,
    'x-rapidapi-key': API_KEY,
    'x-apisports-key': API_KEY, // Critical for direct api-sports.io domain
  },
});

// Interceptor to handle errors globally if needed
footballApiClient.interceptors.response.use(
  (response) => {
    // API-Football often returns 200 OK but with an errors object if there's an issue (e.g., rate limit)
    if (response.data?.errors && Object.keys(response.data.errors).length > 0) {
      console.error('API-Football Error:', response.data.errors);
      return Promise.reject(new Error('API-Football Error: ' + JSON.stringify(response.data.errors)));
    }
    return response;
  },
  (error) => {
    console.error('API-Football Request Failed:', error);
    return Promise.reject(error);
  }
);
