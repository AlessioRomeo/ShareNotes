import axios from 'axios';

const api = axios.create({
    baseURL: 'http://127.0.0.1:8080/api'
})

api.interceptors.request.use((config) => {
    const token = window.localStorage.getItem('token');
    if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default api;
