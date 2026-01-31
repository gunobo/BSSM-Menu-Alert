import axios from "axios";

// .env 파일의 설정을 사용하거나 직접 주소를 입력합니다.
const API_BASE_URL = import.meta.env.VITE_API_URL;

// 1. 토큰 저장
export const saveToken = (token) => {
  localStorage.setItem("accessToken", token);
};

// 2. 토큰 가져오기
export const getToken = () => {
  return localStorage.getItem("accessToken");
};

// 3. 로그아웃
export const logout = () => {
  localStorage.removeItem("accessToken");
  window.location.href = "/login"; // 로그아웃 시 로그인 페이지로 강제 이동
};

// 4. 로그인 여부 확인
export const isLoggedIn = () => {
  return !!getToken();
};

/**
 * 5. 유저 정보 가져오기 (조회)
 * 백엔드 SecurityConfig의 /api/user/** 설정에 맞춰 /api 프리픽스를 추가했습니다.
 */
export const getUser = async () => {
  const token = getToken();
  if (!token) return null;

  try {
    // 💡 백엔드 설정에 맞춰 경로를 /api/user/me로 통일합니다.
    const res = await axios.get(`${API_BASE_URL}/user/me`, {
      headers: { 
        Authorization: `Bearer ${token}` 
      }
    });

    console.log("✅ 유저 정보 가져오기 성공:", res.data);
    return res.data;
  } catch (error) {
    console.error("❌ 유저 정보 로드 에러:", error.response?.status);
    
    // 401(인증안됨) 또는 403(권한없음) 시 세션 만료로 간주
    if (error.response?.status === 401 || error.response?.status === 403) {
      console.warn("세션이 만료되었거나 권한이 없습니다.");
      // logout(); // 필요 시 주석 해제하여 자동 로그아웃 활성화
    }
    return null;
  }
};

/**
 * 6. 유저 정보 업데이트 (마이페이지 저장용)
 * 403 에러 해결을 위해 경로와 헤더를 최적화했습니다.
 */
export const updateUserInfo = async (data) => {
  const token = getToken();
  
  if (!token) {
    console.error("토큰이 없습니다!");
    throw new Error("로그인이 필요합니다.");
  }

  try {
    // 💡 백엔드 SecurityConfig에서 허용한 /api/user/update 경로를 사용합니다.
    const res = await axios.put(`${API_BASE_URL}/user/update`, data, {
      headers: {
        Authorization: `Bearer ${token.trim()}`, // 토큰 앞뒤 공백 제거로 에러 방지
        "Content-Type": "application/json",
      },
    });

    console.log("✅ 정보 업데이트 성공:", res.data);
    return res.data;
  } catch (error) {
    console.error("❌ 정보 업데이트 실패 상세:", {
      status: error.response?.status,
      url: error.config?.url,
      message: error.response?.data || error.message
    });
    throw error;
  }
};