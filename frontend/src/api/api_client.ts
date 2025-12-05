// =============================================================================
// FILE: src/api/api_client.ts
// =============================================================================
// Axios client instance with base configuration
// =============================================================================

import axios from 'axios';

// Base URL from environment variable or default to localhost
const BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000/api/v1';

// Create axios instance with default config
const apiClient = axios.create({
    baseURL: BASE_URL,
    timeout: 10000, // 10 seconds
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor for debugging
apiClient.interceptors.request.use(
    (config) => {
        console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`);
        return config;
    },
    (error) => {
        console.error('[API Request Error]', error);
        return Promise.reject(error);
    }
);

// Response interceptor for debugging
apiClient.interceptors.response.use(
    (response) => {
        console.log(`[API Response] ${response.status} ${response.config.url}`);
        return response;
    },
    (error) => {
        console.error('[API Response Error]', error.response?.status, error.message);
        return Promise.reject(error);
    }
);

export default apiClient;