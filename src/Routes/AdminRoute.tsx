import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { isLoggedIn, getUser } from "../api/auth";
import type { User } from "../types";

export default function AdminRoute({ children }: React.PropsWithChildren) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const userData = await getUser();
        setUser(userData);
      } catch (err) {
        console.error("유저 정보를 가져오는데 실패했습니다.", err);
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

  if (loading) return <div style={{ padding: "20px" }}>권한 확인 중...</div>;

  if (!isLoggedIn() || !user) {
    alert("로그인이 필요합니다.");
    return <Navigate to="/login" replace />;
  }

  const allowedRoles = ["ROLE_ADMIN", "ADMIN", "ROLE_MODERATOR", "MODERATOR", "ROLE_TEACHER"];
  if (!allowedRoles.includes(user.role)) {
    alert(`관리자 권한이 없습니다. (현재: ${user.role || "권한없음"})`);
    return <Navigate to="/" replace />;
  }

  return children;
}
