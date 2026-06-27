import axios from 'axios';

let BACKEND_URL = import.meta.env.VITE_API_URL || '';
if (import.meta.env.PROD) {
    if (!BACKEND_URL || BACKEND_URL.includes('localhost') || BACKEND_URL.includes('127.0.0.1')) {
        BACKEND_URL = '/api';
    }
} else {
    if (!BACKEND_URL) {
        BACKEND_URL = '/api';
    }
}

export const footballApiClient = axios.create({
  baseURL: `${BACKEND_URL}/football/proxy`,
});

export const transfersApiClient = axios.create({
  baseURL: `${BACKEND_URL}/football/proxy`,
});

export const internalApiClient = axios.create({
  baseURL: `${BACKEND_URL}/football`,
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
