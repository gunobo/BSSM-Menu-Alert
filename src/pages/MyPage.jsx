import "../styles/mypage.css";
import { getUser, logout } from "../utils/auth";
import { useNavigate } from "react-router-dom";
import bssmLogo from "../assets/bssmlogo.png";

export default function MyPage() {
  const user = getUser();
  const navigate = useNavigate();

  return (
    <>
    <nav className="navbar">
            <div className="nav-logo">
              <img
                src={bssmLogo}
                alt="BSSM 로고"
                onClick={() => window.location.href = "https://school.busanedu.net/bssm-h"}
              />
              <h2 onClick={() => navigate("/")}>BSSM 급식 알리미</h2>
            </div>
            <div className="nav-buttons">
                <>
                  <button
                    onClick={() => navigate("/mypage")}
                    className="nav-btn"
                  >
                    마이페이지
                  </button>
                </>
            </div>
          </nav>
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

          <div className="info-item">
            <span>좋아하는 메뉴</span>
            <div>{user.menu}</div>
          </div>

          <div className="info-item">
            <span>알레르기</span>
            <div>{user.menu}</div>
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
    </>
  );
}
