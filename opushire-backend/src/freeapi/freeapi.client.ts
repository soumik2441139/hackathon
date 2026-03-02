import axios from 'axios';

/**
 * Base client for FreeAPI (https://freeapi.app)
 */
export const freeApiClient = axios.create({
    baseURL: 'https://api.freeapi.app/api/v1',
    timeout: 15000,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
});

/**
 * Configure global interceptors for logging or auth if needed.
 * Currently, we pass the Bearer token in the service methods directly
 * because different endpoints might require different users' tokens.
 */
freeApiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        console.error('❌ [FreeAPI] Request Failed:', {
            url: error.config?.url,
            status: error.response?.status,
            data: error.response?.data,
        });
        return Promise.reject(error);
    }
);
