import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { logout } from "../api/auth";
import bssmLogo from "../assets/bssmlogo.png";

export default function Navbar({ isAuth, selectedDate, setSelectedDate }) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogoClick = () => {
    window.open("https://school.busanedu.net/bssm-h", "_blank");
  };

  const handleNavReport = () => navigate("/report");

  return (
    <nav className="navbar">
      <div className="nav-left">
        <div className="nav-logo" style={{ cursor: 'pointer' }} onClick={handleLogoClick}>
          <img src={bssmLogo} alt="BSSM 홈페이지 이동" />
          <h2>BSSM 급식알리미</h2>
        </div>
        
        <div className="nav-menu">
          <button 
            className={`menu-item ${location.pathname === "/" ? "active" : ""}`} 
            onClick={() => navigate("/")}
          >
            급식확인
          </button>
          <button 
            className={`menu-item ${location.pathname === "/announcements" ? "active" : ""}`} 
            onClick={() => navigate("/announcements")}
          >
            공지게시판
          </button>
        </div>
      </div>

      <div className="nav-right">
        {/* 홈 화면에서만 날짜 선택창 노출 */}
        {location.pathname === "/" && (
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="nav-date-input"
          />
        )}
        <div className="nav-buttons">
          <button className="nav-report-btn" onClick={handleNavReport}>🚨 신고</button>
          {isAuth ? (
            <>
              <button className="nav-btn" onClick={() => navigate("/mypage")}>마이페이지</button>
              <button className="nav-btn logout" onClick={() => { logout(); navigate("/login"); }}>로그아웃</button>
            </>
          ) : (
            <button className="nav-btn" onClick={() => navigate("/login")}>로그인</button>
          )}
        </div>
      </div>
    </nav>
  );
}