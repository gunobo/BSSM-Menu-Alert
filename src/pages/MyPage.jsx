import "../styles/mypage.css";
import { getUser, logout } from "../utils/auth";
import { useNavigate } from "react-router-dom";

export default function MyPage() {
  const user = getUser();
  const navigate = useNavigate();

  return (
    <div className="mypage-wrapper">
      <div className="mypage-card">
        <h2>마이페이지</h2>

        <div className="info-box">
          <div className="info-item">
            <span>아이디</span>
            <div>{user.id}</div>
          </div>

          <div className="info-item">
            <span>권한</span>
            <div>{user.role}</div>
          </div>
        </div>

        <div className="mypage-actions">
          <button
            className="btn-secondary"
            onClick={() => alert("추후 구현 예정")}
          >
            비밀번호 변경
          </button>

          <button
            className="btn-danger"
            onClick={() => {
              logout();
              navigate("/");
            }}
          >
            로그아웃
          </button>
        </div>
      </div>
    </div>
  );
}
