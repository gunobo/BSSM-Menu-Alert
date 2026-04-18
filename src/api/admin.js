import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

// 모든 요청에 관리자 토큰 자동 삽입
API.interceptors.request.use((config) => {
  const token = sessionStorage.getItem("accessToken"); // 로그인 시 저장한 토큰 키값 확인
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const getAllUsers = async () => {
  try {
    // 백엔드의 실제 엔드포인트 주소로 수정하세요 (예: /admin/users 또는 /api/users)
    const response = await API.get("/admin/users");
    return response.data; // 서버에서 보내주는 데이터 구조(Array) 반환
  } catch (error) {
    console.error("사용자 목록 로드 에러:", error.response?.data || error.message);
    throw error;
  }
};

