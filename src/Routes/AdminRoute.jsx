import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { isLoggedIn, getUser } from "../api/auth";

export default function AdminRoute({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // getUser()가 Promise를 반환하므로 반드시 await를 붙여줍니다.
        const userData = await getUser(); 
        console.log("로그인 여부:", isLoggedIn());
        console.log("가져온 유저 데이터:", userData);
        setUser(userData);
      } catch (err) {
        console.error("유저 정보를 가져오는데 실패했습니다.", err);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  // 1. 유저 정보를 가져오는 중일 때 (빈 화면 방지)
  if (loading) {
    return <div style={{ padding: "20px" }}>권한 확인 중...</div>;
    
  }

  // 2. 로그인이 안 되어 있거나 유저 정보가 없을 때
  if (!isLoggedIn() || !user) {
    alert("로그인이 필요합니다.");
    return <Navigate to="/login" replace />;
  }

  // 3. Role이 ROLE_ADMIN이 아닐 때
  // (백엔드 AuthController에서 role을 보내주고 있는지 꼭 확인하세요!)
  if (user.role !== "ROLE_ADMIN" && user.role !== "ADMIN" && user.role !== "ROLE_MODERATOR" && user.role !== "MODERATOR") {
    console.log(user)
    alert(`관리자 권한이 없습니다. (현재: ${user.role || '권한없음'})`);
    return <Navigate to="/" replace />;
  }

  // 4. 모든 조건 통과 시 관리자 페이지 렌더링
  return children;
}