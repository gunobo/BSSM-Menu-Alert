import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../styles/announcements.css";
import bssmLogo from "../assets/bssmlogo.png";

const API_BASE_URL = import.meta.env.VITE_API_URL;

export default function Announcements() {
  const navigate = useNavigate();
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNotices = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/notifications/all`); // 전체 공지 호출 API
        setNotices(res.data);
      } catch (err) {
        console.error("공지사항 로드 실패:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchNotices();
  }, []);

  const handleLogoClick = () => navigate("/");

  return (
    <div className="notice-page">
      {/* Home과 동일한 네비바 구조 */}
      <nav className="navbar">
        <div className="nav-left">
          <div className="nav-logo" onClick={handleLogoClick} style={{ cursor: "pointer" }}>
            <img src={bssmLogo} alt="BSSM Logo" />
            <h2>BSSM 급식알리미</h2>
          </div>
        </div>

        <div className="nav-menu">
          <button className="menu-item" onClick={() => navigate("/")}>급식확인</button>
          <button className="menu-item active" onClick={() => navigate("/announcements")}>공지게시판</button>
        </div>

        <div className="nav-right">
          <button className="nav-btn" onClick={() => navigate(-1)}>뒤로가기</button>
        </div>
      </nav>

      <header className="notice-header">
        <div className="container">
          <h1>📢 공지사항</h1>
          <p>학교 급식 및 서비스 관련 소식을 전해드립니다.</p>
        </div>
      </header>

      <main className="container">
        <div className="notice-list-card">
          {loading ? (
            <p className="loading-msg">공지사항을 불러오는 중입니다...</p>
          ) : notices.length > 0 ? (
            <div className="notice-table">
              <div className="table-header">
                <span className="col-id">번호</span>
                <span className="col-title">제목</span>
                <span className="col-date">작성일</span>
              </div>
              {notices.map((notice, index) => (
                <div 
                  key={notice.id} 
                  className="table-row"
                  onClick={() => navigate(`/announcements/${notice.id}`)}
                >
                  <span className="col-id">{notices.length - index}</span>
                  <span className="col-title">{notice.title}</span>
                  <span className="col-date">{notice.createdAt?.slice(0, 10)}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-notice">
              <p>등록된 공지사항이 없습니다.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}