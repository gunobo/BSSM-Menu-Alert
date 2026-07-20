import axios from "axios";
import type { User } from "../types";

const getBaseUrl = (): string => {
  let url = import.meta.env.VITE_API_URL || "";
  if (url.endsWith("/")) url = url.slice(0, -1);
  return url;
};

const API_BASE_URL = getBaseUrl();

const isAndroidWebView = (): boolean => !!(window.Android);

export const saveToken = (token: string): void => {
  if (token) {
    if (isAndroidWebView()) {
      localStorage.setItem("accessToken", token);
    } else {
      sessionStorage.setItem("accessToken", token);
    }
    window.dispatchEvent(new Event("authChange"));
  }
};

export const getToken = (): string | null =>
  sessionStorage.getItem("accessToken") || localStorage.getItem("accessToken") || null;

export const logout = async (fcmToken?: string): Promise<void> => {
  sessionStorage.removeItem("accessToken");
  localStorage.removeItem("accessToken");
  window.dispatchEvent(new Event("authChange"));
  try {
    await axios.post("/user/logout-device", { token: fcmToken });
  } finally {
    window.location.href = "/";
  }
};

export const logoutDevice = async (userId: number): Promise<unknown> => {
  const response = await axios.post(`/admin/users/${userId}/logout`);
  return response.data;
};

export const isLoggedIn = (): boolean => {
  const token = getToken();
  return !!token && token !== "undefined" && token !== "null" && token.includes(".");
};

export const getUser = async (): Promise<User | null> => {
  const token = getToken();
  if (!isLoggedIn()) return null;

  try {
    const res = await axios.get<User>(`${API_BASE_URL}/user/me`, {
      headers: { Authorization: `Bearer ${token!.replace(/\s/g, "")}` },
    });

    if (typeof res.data === "string" && (res.data as string).includes("<!doctype html>")) {
      throw new Error("HTML_RETURNED");
    }

    return res.data;
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      console.error("❌ 유저 정보 로드 에러:", error.response?.status || error.message);
    }
    return null;
  }
};

export const updateUserInfo = async (data: Record<string, unknown>): Promise<unknown> => {
  const token = getToken();
  if (!isLoggedIn()) throw new Error("로그인이 필요합니다.");

  const res = await axios.post(`${API_BASE_URL}/user/update-info`, data, {
    headers: {
      Authorization: `Bearer ${token!.trim()}`,
      "Content-Type": "application/json",
    },
  });

  if (typeof res.data === "string" && (res.data as string).includes("<!doctype html>")) {
    throw new Error("잘못된 API 경로 (HTML 반환)");
  }

  return res.data;
};

export const saveFcmToken = async (token: string, deviceType: "MOBILE" | "WEB" = "MOBILE"): Promise<unknown> => {
  const response = await axios.post("/user/fcm/token", { token, deviceType });
  return response.data;
};
