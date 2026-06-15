import axios from 'axios';

const TOKEN_KEY = 'puntodeventa_token';

const api = axios.create({
    // URL base de tu servidor Django local
    baseURL: 'http://localhost:8000/api/',
    headers: {
        'Content-Type': 'application/json',
    }
});

export const getAuthToken = () => {
    if (typeof window === 'undefined') {
        return null;
    }

    return window.localStorage.getItem(TOKEN_KEY);
};

export const setAuthToken = (token: string) => {
    if (typeof window === 'undefined') {
        return;
    }

    window.localStorage.setItem(TOKEN_KEY, token);
    api.defaults.headers.common.Authorization = `Token ${token}`;
};

export const clearAuthToken = () => {
    if (typeof window !== 'undefined') {
        window.localStorage.removeItem(TOKEN_KEY);
    }

    delete api.defaults.headers.common.Authorization;
};

if (typeof window !== 'undefined') {
    const storedToken = getAuthToken();

    if (storedToken) {
        api.defaults.headers.common.Authorization = `Token ${storedToken}`;
    }
}

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error?.response?.status === 401) {
            clearAuthToken();
        }

        return Promise.reject(error);
    }
);

export default api;