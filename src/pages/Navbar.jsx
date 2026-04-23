import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import bssmLogo from "../assets/bssmlogo.png";
import { getUser, isLoggedIn } from "../api/auth";
import ReportModal from "../modal/ReportModal";
import NoticeModal from "../modal/NoticeModal";
import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL;

export default function Navbar({ selectedDate, setSelectedDate }) {
  const navigate = useNavigate();
  const location = useLocation(); // 현재 경로 확인용
  const [user, setUser] = useState(null);
  const [isAuth, setIsAuth] = useState(isLoggedIn());
  const sseRef = useRef(null);

  // 모달 상태
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportTarget, setReportTarget] = useState(null);
  const [activeNotice, setActiveNotice] = useState(null);
  const [showNoticeModal, setShowNoticeModal] = useState(false);

  const handleLogoClick = () => {
    window.open("https://school.busanedu.net/bssm-h", "_blank");
  };

  // 실시간 알림 구독 로직
  const subscribeToNotifications = useCallback((userId) => {
    if (!userId || userId === "undefined") return;
    try {
      if (sseRef.current) sseRef.current.close();
      const eventSource = new EventSource(`${API_BASE_URL}/notifications/subscribe/${userId}`, {
        withCredentials: true 
      });

      eventSource.addEventListener("notice", (event) => {
        const data = JSON.parse(event.data);
        setActiveNotice(data);
        setShowNoticeModal(true);
        if (Notification.permission === "granted") {
          new Notification(`📢 실시간 공지: ${data.title}`, { 
            body: data.content, 
            icon: bssmLogo 
          });
        }
      });

      sseRef.current = eventSource;
    } catch (err) {
      console.error("SSE 구독 중 오류 발생:", err);
    }
  }, []);

  // 인증 및 유저 정보 체크
  useEffect(() => {
    const checkStatus = async () => {
      const token = sessionStorage.getItem("accessToken");
      const loggedIn = !!token;
      setIsAuth(loggedIn);

      if (loggedIn) {
        const u = await getUser();
        if (u) {
          setUser(u);
          const identifier = u.id || u.email;
          if (identifier && identifier !== "undefined") {
            setTimeout(() => subscribeToNotifications(identifier), 500);
          }
        }
      } else {
        setUser(null);
        if (sseRef.current) sseRef.current.close();
      }
    };

    checkStatus();
    window.addEventListener("authChange", checkStatus);
    return () => {
      window.removeEventListener("authChange", checkStatus);
      if (sseRef.current) sseRef.current.close();
    };
  }, [subscribeToNotifications]);

  const handleNavReport = () => {
    if (!isLoggedIn()) return alert("로그인 후 이용 가능합니다!");
    setReportTarget({ id: 0, type: "ETC", name: "서비스 건의 및 신고" });
    setShowReportModal(true);
  };

  // 현재 활성화된 메뉴인지 확인하는 함수
  const isActive = (path) => (location.pathname === path ? "active" : "");

  return (
    <>
      <nav className="navbar">
        <div className="nav-left">
          <div className="nav-logo" style={{ cursor: 'pointer' }}>
            <img src={bssmLogo} alt="BSSM 홈페이지 이동" onClick={handleLogoClick} />
            <h2 onClick={() => navigate("/")}>BSSM 급식알리미</h2>
          </div>
          <div className="nav-menu">
            <button className={`menu-item ${isActive("/")}`} onClick={() => navigate("/")}>급식확인</button>
            <button className={`menu-item ${isActive("/timetable")}`} onClick={() => navigate("/timetable")}>시간표</button>
            <button className={`menu-item ${isActive("/announcements")}`} onClick={() => navigate("/announcements")}>공지게시판</button>
          </div>
        </div>

        <div className="nav-right">
          {/* 급식확인 페이지("/")에서만 날짜 선택기를 보여줌 */}
          {location.pathname === "/" && selectedDate && (
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="nav-date-input desktop-only"
            />
          )}
          <div className="nav-buttons">
            <button className="nav-report-btn" onClick={handleNavReport}>🚨 건의</button>
            {isAuth ? (
              <button className="nav-btn" onClick={() => navigate("/mypage")}>마이페이지</button>
            ) : (
              <button className="nav-btn" onClick={() => navigate("/login")}>로그인</button>
            )}
          </div>
        </div>
      </nav>

      {/* 모달 렌더링 */}
      {showReportModal && <ReportModal target={reportTarget} onClose={() => setShowReportModal(false)} />}
      <NoticeModal notice={activeNotice} onClose={() => setShowNoticeModal(false)} />
    </>
  );
}