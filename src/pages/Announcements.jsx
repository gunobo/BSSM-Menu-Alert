import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../styles/announcements.css";
import bssmLogo from "../assets/bssmlogo.png";
import Footer from "./footer";
import Navbar from "./Navbar"
import ReportModal from "../modal/ReportModal"

const API_BASE_URL = import.meta.env.VITE_API_URL;

export default function Announcements() {
  const navigate = useNavigate();
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportTarget, setReportTarget] = useState(null);
  

  const todayStr = useMemo(() => {
      const now = new Date();
      const offset = now.getTimezoneOffset() * 60000;
      return new Date(now.getTime() - offset).toISOString().slice(0, 10);
    }, []);
  const [selectedDate, setSelectedDate] = useState(todayStr);

  useEffect(() => {
    const fetchNotices = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/notifications/all`);
        setNotices(res.data);
      } catch (err) {
        console.error("공지사항 로드 실패:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchNotices();
  }, []);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = notices.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(notices.length / itemsPerPage);

  return (
    <div className="notice-page">
      <Navbar selectedDate={selectedDate} setSelectedDate={setSelectedDate} />

      <header className="notice-header">
        <div className="container">
          <h1>📢 공지사항</h1>
          <p>학교 급식 및 서비스 관련 소식을 전해드립니다.</p>
        </div>
      </header>

      <main className="container">
        <div className="notice-list-card">
          {/* ✅ 셀렉트 박스를 카드 안쪽 상단으로 이동 */}
          <div className="list-top-bar">
            <div className="total-count">
              전체 공지 <strong>{notices.length}</strong>건
            </div>
            <select 
              value={itemsPerPage} 
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="per-page-select"
            >
              <option value={10}>10개씩 보기</option>
              <option value={30}>30개씩 보기</option>
              <option value={50}>50개씩 보기</option>
            </select>
          </div>

          {loading ? (
            <p className="loading-msg">공지사항을 불러오는 중입니다...</p>
          ) : currentItems.length > 0 ? (
            <>
              <div className="notice-table">
                <div className="table-header">
                  <span className="col-title">제목</span>
                  <span className="col-date">작성일</span>
                </div>
                {currentItems.map((notice, index) => (
                  <div 
                    key={notice.id} 
                    className="table-row"
                    onClick={() => navigate(`/announcements/${notice.id}`)}
                  >
                    <span className="col-title">{notice.title}</span>
                    <span className="col-date">{notice.createdAt?.slice(0, 10)}</span>
                  </div>
                ))}
              </div>

              <div className="pagination">
                <button 
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="page-btn"
                >
                  &lt;
                </button>
                {[...Array(totalPages)].map((_, i) => (
                  <button
                    key={i + 1}
                    onClick={() => setCurrentPage(i + 1)}
                    className={`page-number ${currentPage === i + 1 ? "active" : ""}`}
                  >
                    {i + 1}
                  </button>
                ))}
                <button 
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="page-btn"
                >
                  &gt;
                </button>
              </div>
            </>
          ) : (
            <div className="empty-notice">
              <p>등록된 공지사항이 없습니다.</p>
            </div>
          )}
        </div>
      </main>
      <Footer />
      {showReportModal && <ReportModal target={reportTarget} onClose={() => setShowReportModal(false)} />}
    </div>
  );
}