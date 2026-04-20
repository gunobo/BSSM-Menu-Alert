import axios from 'axios';

const instance = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
    withCredentials: true
});

// 🚀 요청 인터셉터: 모든 요청이 나가기 전 "가로채서" 토큰을 붙임
instance.interceptors.request.use(
    (config) => {
        const token = sessionStorage.getItem("accessToken") || localStorage.getItem("accessToken");
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export default instance;