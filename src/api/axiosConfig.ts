import axios from "axios";
import { saveToken, logout } from "./auth";

const instance = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
});

instance.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem("accessToken") || localStorage.getItem("accessToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

let refreshing = false;
let queue: Array<{ resolve: (token: string) => void; reject: (err: unknown) => void }> = [];

function processQueue(token: string | null, err: unknown = null) {
  queue.forEach((p) => (token ? p.resolve(token) : p.reject(err)));
  queue = [];
}

instance.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;

    // refresh 요청 자체가 401이면 로그아웃
    if (original?.url?.includes("/auth/refresh")) {
      logout();
      return Promise.reject(error);
    }

    if (error.response?.status !== 401 || original._retry) {
      return Promise.reject(error);
    }

    original._retry = true;

    if (refreshing) {
      return new Promise((resolve, reject) => {
        queue.push({
          resolve: (token) => {
            original.headers.Authorization = `Bearer ${token}`;
            resolve(instance(original));
          },
          reject,
        });
      });
    }

    refreshing = true;
    try {
      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/auth/refresh`,
        {},
        { withCredentials: true }
      );
      const newToken: string = res.data.token;
      saveToken(newToken);
      instance.defaults.headers.common.Authorization = `Bearer ${newToken}`;
      processQueue(newToken);
      original.headers.Authorization = `Bearer ${newToken}`;
      return instance(original);
    } catch (err) {
      processQueue(null, err);
      logout();
      return Promise.reject(err);
    } finally {
      refreshing = false;
    }
  }
);

export default instance;
