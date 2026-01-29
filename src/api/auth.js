// 1. 토큰 저장 (로그인 성공 시 호출)
export const saveToken = (token) => {
  localStorage.setItem("accessToken", token);
};

// 2. 토큰 가져오기
export const getToken = () => {
  return localStorage.getItem("accessToken");
};

// 3. 로그아웃 (토큰 삭제)
export const logout = () => {
  localStorage.removeItem("accessToken");
};

// 4. 로그인 여부 확인
export const isLoggedIn = () => {
  const token = getToken();
  return !!token;
};

// 5. 유저 정보 가져오기 (조회)
// src/api/auth.js
export const getUser = async () => {
  const token = getToken();
  if (!token) return null;

  try {
    // 🔴 여기가 "http://localhost:8080/user/me" 처럼 서버 주소여야 합니다.
    // 만약 localStorage.getItem("user") 이런 식으로 되어 있다면 DB 데이터를 안 가져오는 겁니다.
    const res = await fetch("http://localhost:8080/user/me", {
      headers: { "Authorization": `Bearer ${token}` }
    });
    return await res.json(); 
  } catch (error) {
    return null;
  }
};

// 6. 유저 정보 업데이트 (마이페이지 저장용)
export const updateUserInfo = async (data) => {
  const token = getToken();
  if (!token) return { success: false, message: "로그인이 필요합니다." };

  try {
    const res = await fetch("http://localhost:8080/user/update-info", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!res.ok) throw new Error("서버 업데이트 실패");
    return await res.json();
  } catch (error) {
    console.error("정보 업데이트 실패:", error);
    throw error;
  }
};