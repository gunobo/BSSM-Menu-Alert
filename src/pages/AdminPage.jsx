import { useEffect, useState } from "react";
import axios from "axios";
import "../styles/admin.css";

export default function AdminPage() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    todayLikes: 0,
    reportedReviews: [],
    popularMenus: []
  });

  // --- [추가] 모달 및 처리 상태 ---
  const [selectedReport, setSelectedReport] = useState(null); 
  const [processMessage, setProcessMessage] = useState("");
  const [showModal, setShowModal] = useState(false);

  const [notice, setNotice] = useState({ title: "", content: "" });
  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isSending, setIsSending] = useState(false);

  const API_BASE_URL = import.meta.env.VITE_API_URL;
  const token = localStorage.getItem("accessToken");

  const fetchStats = async () => {
    if (!token) return;
    try {
      const res = await axios.get(`${API_BASE_URL}/admin/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(res.data);
    } catch (err) {
      console.error("데이터 로드 실패:", err);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [token, API_BASE_URL]);

  // --- [수정] 신고 처리 로직 (이메일 발송 포함) ---
  const handleProcessReport = async (status) => {
    if (!processMessage.trim()) return alert("사용자에게 보낼 답변 사유를 입력해주세요.");
    
    try {
      await axios.post(`${API_BASE_URL}/admin/reports/${selectedReport.id}/process`, {
        status: status, // "RESOLVED" 또는 "REJECTED"
        message: processMessage,
        userEmail: selectedReport.userEmail // 백엔드 DTO와 일치
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      alert(`처리가 완료되었습니다. (${status === "RESOLVED" ? "승인" : "거부"})`);
      
      // 목록 업데이트
      setStats(prev => ({
        ...prev,
        reportedReviews: prev.reportedReviews.filter(r => r.id !== selectedReport.id)
      }));
      
      closeModal();
    } catch (err) {
      console.error("처리 실패:", err);
      alert("처리 중 오류가 발생했습니다.");
    }
  };

  const openModal = (report) => {
    setSelectedReport(report);
    setShowModal(true);
  };

  const closeModal = () => {
    setSelectedReport(null);
    setProcessMessage("");
    setShowModal(false);
  };

  // --- 기존 알림 전송 로직 생략 (유지됨) ---
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSendNotice = async (e) => {
    e.preventDefault();
    if (!notice.title || !notice.content) return alert("제목과 내용을 입력해주세요.");
    if (!token || isSending) return;
    setIsSending(true);
    const formData = new FormData();
    formData.append("title", notice.title);
    formData.append("content", notice.content);
    if (imageFile) formData.append("file", imageFile);
    try {
      await axios.post(`${API_BASE_URL}/admin/notifications`, formData, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" }
      });
      alert("📢 전송 완료!");
      setNotice({ title: "", content: "" });
      setImageFile(null);
      setPreviewUrl(null);
    } catch (err) { alert("전송 실패"); } finally { setIsSending(false); }
  };

  return (
    <div className="admin-container">
      <header className="admin-header">
        <h1>🛠️ 관리자 컨트롤 타워</h1>
        <p>서비스 현황 파악 및 전체 공지 관리</p>
      </header>

      {/* 스탯 카드 그리드 */}
      <div className="stats-grid">
        <div className="stat-card blue">
          <div className="icon">👥</div>
          <div className="stat-info">
            <h3>전체 사용자</h3>
            <p className="count">{(stats.totalUsers || 0).toLocaleString()}명</p>
          </div>
        </div>
        <div className="stat-card pink">
          <div className="icon">❤️</div>
          <div className="stat-info">
            <h3>오늘의 좋아요</h3>
            <p className="count">{(stats.todayLikes || 0).toLocaleString()}개</p>
          </div>
        </div>
        <div className="stat-card yellow">
          <div className="icon">🚨</div>
          <div className="stat-info">
            <h3>미처리 신고</h3>
            <p className="count">{stats.reportedReviews?.length || 0}건</p>
          </div>
        </div>
      </div>

      <div className="admin-main-content">
        {/* 공지사항 전송 */}
        <section className="admin-section notice-section">
          <h3>📢 전체 알림 전송</h3>
          <form onSubmit={handleSendNotice} className="admin-form">
            <input type="text" placeholder="제목" value={notice.title} onChange={(e) => setNotice({...notice, title: e.target.value})} />
            <textarea placeholder="내용" rows="5" value={notice.content} onChange={(e) => setNotice({...notice, content: e.target.value})} />
            <div className="file-upload-group">
              <input type="file" id="file-input" onChange={handleFileChange} accept="image/*" hidden />
              <label htmlFor="file-input" className="btn-small">📸 이미지 첨부</label>
              {previewUrl && (
                <div className="admin-preview-container">
                  <img src={previewUrl} alt="미리보기" className="admin-img-preview" />
                  <button type="button" onClick={() => {setImageFile(null); setPreviewUrl(null);}}>X</button>
                </div>
              )}
            </div>
            <button type="submit" disabled={isSending} className="btn-send">{isSending ? "전송 중..." : "전송하기"}</button>
          </form>
        </section>

        {/* 인기 메뉴 리스트 */}
        <section className="admin-section">
          <h3>🔥 인기 메뉴 TOP 5</h3>
          <ul className="rank-list">
            {stats.popularMenus?.map((menu, i) => (
              <li key={i} className="rank-item">
                <span className="rank-badge">{i + 1}</span>
                <span className="rank-name">{menu.date} - {menu.type}</span>
                <span className="rank-votes">{menu.votes}표</span>
              </li>
            ))}
          </ul>
        </section>

        {/* 신고 내역 테이블 */}
        <section className="admin-section full-width">
          <h3>🚨 최근 신고 내역</h3>
          <table className="admin-table">
            <thead>
              <tr><th>신고자</th><th>내용</th><th>사유</th><th>관리</th></tr>
            </thead>
            <tbody>
              {stats.reportedReviews?.length > 0 ? (
                stats.reportedReviews.map(r => (
                  <tr key={r.id}>
                    <td>{r.userName}</td>
                    <td>{r.content}</td>
                    <td><span className="badge danger">{r.reason}</span></td>
                    <td>
                      {/* [수정] 삭제 대신 '처리' 버튼으로 변경 */}
                      <button className="action-process" onClick={() => openModal(r)}>처리</button>
                    </td>
                  </tr>
                ))
              ) : <tr><td colSpan="4" className="empty-msg">신고 내역이 없습니다.</td></tr>}
            </tbody>
          </table>
        </section>
      </div>

      {/* --- [추가] 신고 처리 모달 창 --- */}
      {showModal && (
        <div className="admin-modal-overlay">
          <div className="admin-modal">
            <h3>🚨 신고 처리 (이메일 발송)</h3>
            <div className="modal-info">
              <p><strong>대상:</strong> {selectedReport.userName} ({selectedReport.userEmail})</p>
              <p><strong>내용:</strong> {selectedReport.content}</p>
            </div>
            <textarea 
              placeholder="사용자에게 보낼 이메일 답변 내용을 입력하세요..." 
              value={processMessage}
              onChange={(e) => setProcessMessage(e.target.value)}
              rows="5"
            />
            <div className="modal-actions">
              <button className="btn-resolve" onClick={() => handleProcessReport("RESOLVED")}>✅ 해결 승인</button>
              <button className="btn-reject" onClick={() => handleProcessReport("REJECTED")}>❌ 반려 거부</button>
              <button className="btn-close" onClick={closeModal}>닫기</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}