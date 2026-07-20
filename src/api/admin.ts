import axios from "axios";
import type { User } from "../types";

const API = axios.create({ baseURL: import.meta.env.VITE_API_URL });

API.interceptors.request.use((config) => {
  const token = sessionStorage.getItem("accessToken");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const getAllUsers = async (): Promise<User[]> => {
  const response = await API.get<User[]>("/admin/users");
  return response.data;
};
