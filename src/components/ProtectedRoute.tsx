import { Navigate } from "react-router-dom";
import { isLoggedIn } from "../utils/auth";

export default function ProtectedRoute({ children }: React.PropsWithChildren) {
  if (!isLoggedIn()) {
    alert("로그인이 필요합니다!");
    return <Navigate to="/login" replace />;
  }
  return children;
}
