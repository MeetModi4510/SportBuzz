import axios from 'axios';

// Ensure you set VITE_API_FOOTBALL_KEY in your .env or hosting environment (e.g., Render)
const API_KEY = import.meta.env.VITE_API_FOOTBALL_KEY || '2e6cf2df8e934e9946f0f085aba5f0ed';
const API_HOST = 'v3.football.api-sports.io';

export const footballApiClient = axios.create({
  baseURL: `https://${API_HOST}`,
  headers: {
    'x-rapidapi-host': API_HOST,
    'x-rapidapi-key': API_KEY,
    'x-apisports-key': API_KEY, // Critical for direct api-sports.io domain
  },
});

const TRANSFERS_API_KEY = import.meta.env.VITE_FOOTBALL_TRANSFERS_API_KEY || '';

export const transfersApiClient = axios.create({
  baseURL: `https://${API_HOST}`,
  headers: {
    'x-rapidapi-host': API_HOST,
    'x-rapidapi-key': TRANSFERS_API_KEY,
    'x-apisports-key': TRANSFERS_API_KEY,
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
    return Promise.reject(error);
  }
);

transfersApiClient.interceptors.response.use(
  (response) => {
    if (response.data?.errors && Object.keys(response.data.errors).length > 0) {
      console.error('Transfers API Error:', response.data.errors);
      return Promise.reject(new Error('Transfers API Error: ' + JSON.stringify(response.data.errors)));
    }
    return response;
  },
  (error) => {
    console.error('Transfers API Request Failed:', error);
    return Promise.reject(error);
  }
);
