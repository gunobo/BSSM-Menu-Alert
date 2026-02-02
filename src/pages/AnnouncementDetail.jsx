import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import ReactMarkdown from "react-markdown"; // ✅ 마크다운 렌더러 추가
import "../styles/announcements.css"; 
import bssmLogo from "../assets/bssmlogo.png";

const API_BASE_URL = import.meta.env.VITE_API_URL;

export default function AnnouncementDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [notice, setNotice] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNoticeDetail = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/notifications/${id}`);
        setNotice(res.data);
      } catch (err) {
        console.error("공지사항 상세 로드 실패:", err);
        alert("존재하지 않거나 삭제된 게시글입니다.");
        navigate("/announcements");
      } finally {
        setLoading(false);
      }
    };
    fetchNoticeDetail();
  }, [id, navigate]);

  return (
    <div className="notice-page">
      <nav className="navbar">
        <div className="nav-left">
          <div className="nav-logo" onClick={() => navigate("/")} style={{ cursor: "pointer" }}>
            <img src={bssmLogo} alt="BSSM Logo" />
            <h2>BSSM 급식알리미</h2>
          </div>
        </div>
        <div className="nav-menu">
          <button className="menu-item" onClick={() => navigate("/")}>급식확인</button>
          <button className="menu-item active" onClick={() => navigate("/announcements")}>공지게시판</button>
        </div>
        <div className="nav-right">
          <button className="nav-btn" onClick={() => navigate("/announcements")}>목록으로</button>
        </div>
      </nav>

      <header className="notice-header small">
        <div className="container">
          <h1>📢 공지사항 상세내용</h1>
        </div>
      </header>

      <main className="container">
        <div className="notice-detail-card">
          {loading ? (
            <p className="loading-msg">내용을 불러오는 중입니다...</p>
          ) : notice ? (
            <>
              <div className="detail-header">
                <h2 className="detail-title">{notice.title}</h2>
                <div className="detail-info">
                  <span className="info-date">작성일: {notice.createdAt?.slice(0, 10)}</span>
                </div>
              </div>

              {/* ✅ 이미지 노출 로직 추가 (이미지가 있을 경우) */}
              {notice.imageUrl && (
                <div className="detail-image" style={{ textAlign: 'center', marginBottom: '20px' }}>
                  <img 
                    src={`http://localhost:8080${notice.imageUrl}`} 
                    alt="공지 이미지" 
                    style={{ maxWidth: '100%', borderRadius: '8px' }} 
                  />
                </div>
              )}

              <div className="detail-content">
                {/* ✅ 마크다운 렌더링 적용 */}
                <div className="content-text markdown-body">
                  <ReactMarkdown>{notice.content}</ReactMarkdown>
                </div>
              </div>

              <div className="detail-footer">
                <button className="list-back-btn" onClick={() => navigate("/announcements")}>
                  목록으로 돌아가기
                </button>
              </div>
            </>
          ) : null}
        </div>
      </main>
    </div>
  );
}