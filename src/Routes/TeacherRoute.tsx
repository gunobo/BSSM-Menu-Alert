import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { isLoggedIn, getUser } from "../api/auth";
import type { User } from "../types";

export default function TeacherRoute({ children }: React.PropsWithChildren) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getUser()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ padding: "20px" }}>권한 확인 중...</div>;

  if (!isLoggedIn() || !user) {
    alert("로그인이 필요합니다.");
    return <Navigate to="/login" replace />;
  }

  const allowed = ["ROLE_TEACHER", "ROLE_MODERATOR", "ROLE_ADMIN", "TEACHER", "MODERATOR", "ADMIN"];
  if (!allowed.includes(user.role ?? "")) {
    alert("시간표 담당 교사 또는 관리자만 접근할 수 있습니다.");
    return <Navigate to="/" replace />;
  }

  return children;
}
