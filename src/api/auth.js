import axios from "axios";

const getBaseUrl = () => {
  let url = import.meta.env.VITE_API_URL || "";
  // 💡 끝에 슬래시가 있다면 제거
  if (url.endsWith("/")) {
    url = url.slice(0, -1);
  }
  return url;
};

const API_BASE_URL = getBaseUrl();

export const saveToken = (token) => {
  if (token) {
    localStorage.setItem("accessToken", token);
    window.dispatchEvent(new Event("authChange"));
  }
};

export const getToken = () => {
  return localStorage.getItem("accessToken");
};

export const logout = async (token) => {
  localStorage.removeItem("accessToken");
  window.dispatchEvent(new Event("authChange"));
  const response = await axios.post('/user/logout-device', { token });
  window.location.href = "/";
  return response.data;
};

export const logoutDevice = async (userId) => {
  const response = await axios.post(`/admin/users/${userId}/logout`);
  return response.data;
};

export const isLoggedIn = () => {
  const token = getToken();
  // 💡 length 체크는 좋으나, 실제 JWT 형태인지 더 엄격하게 체크하면 좋습니다.
  return !!token && token !== "undefined" && token !== "null" && token.includes(".");
};

/**
 * 5. 유저 정보 가져오기
 */
export const getUser = async () => {
  const token = getToken();
  if (!isLoggedIn()) return null;

  try {
    const res = await axios.get(`${API_BASE_URL}/user/me`, {
      headers: { 
        Authorization: `Bearer ${token.replace(/\s/g, "")}` // 💡 혹시 모를 공백 제거
      }
    });

    if (typeof res.data === "string" && res.data.includes("<!doctype html>")) {
      throw new Error("HTML_RETURNED");
    }

    return res.data;
  } catch (error) {
    console.error("❌ 유저 정보 로드 에러:", error.response?.status || error.message);
    return null;
  }
};

/**
 * 6. 유저 정보 업데이트
 */
export const updateUserInfo = async (data) => {
  const token = getToken();
  if (!isLoggedIn()) throw new Error("로그인이 필요합니다.");

  try {
    // 💡 403 에러 방지를 위해 헤더 구성을 더 명확히 합니다.
    const res = await axios.post(`${API_BASE_URL}/user/update-info`, data, {
      headers: {
        Authorization: `Bearer ${token.trim()}`,
        "Content-Type": "application/json",
        // 💡 필요하다면 여기에 추가 인증 헤더를 넣을 수 있습니다.
      },
    });

    if (typeof res.data === "string" && res.data.includes("<!doctype html>")) {
      throw new Error("잘못된 API 경로 (HTML 반환)");
    }

    return res.data;
  } catch (error) {
    // 💡 403 에러 발생 시 로그에 상세 원인 출력
    if (error.response?.status === 403) {
      console.error("❌ 403 Forbidden: 접근 권한이 없습니다. 토큰 만료 여부나 백엔드 설정을 확인하세요.");
    }
    throw error;
  }
};

// ✅ FCM 토큰 저장 함수
export const saveFcmToken = async (token, deviceType = "MOBILE") => {
  console.log("📤 saveFcmToken 호출");
  console.log("📤 토큰:", token ? token.substring(0, 30) + "..." : "없음");
  console.log("📤 디바이스 타입:", deviceType);
  
  try {
    const response = await axios.post('/user/fcm/token', {
      token,
      deviceType
    });
    
    console.log("📥 saveFcmToken 응답:", response.data);
    return response.data;
    
  } catch (error) {
    console.error("❌ saveFcmToken 에러:", error);
    console.error("❌ 에러 상세:", error.response?.data);
    console.error("❌ 에러 상태:", error.response?.status);
    throw error;
  }
};