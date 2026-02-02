import { useEffect, useState } from "react";
import axios from "axios";

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    todayLikes: 0,
    reportedReviews: [],
    popularMenus: []
  });

  const [selectedReport, setSelectedReport] = useState(null); 
  const [processMessage, setProcessMessage] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [notice, setNotice] = useState({ title: "", content: "" });
  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isSending, setIsSending] = useState(false);

  const API_BASE_URL = import.meta.env.VITE_API_URL;
  const token = localStorage.getItem("accessToken");

  // 관리자 통계 데이터 로드
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
  }, [token]);

  // 신고 처리 로직
  const handleProcessReport = async (status) => {
    if (!processMessage.trim()) return alert("사용자에게 보낼 답변 사유를 입력해주세요.");
    try {
      await axios.post(`${API_BASE_URL}/admin/reports/${selectedReport.id}/process`, {
        status, message: processMessage, userEmail: selectedReport.userEmail
      }, { headers: { Authorization: `Bearer ${token}` } });
      alert("처리가 완료되었습니다.");
      setStats(prev => ({
        ...prev,
        reportedReviews: prev.reportedReviews.filter(r => r.id !== selectedReport.id)
      }));
      closeModal();
    } catch (err) { alert("처리 실패"); }
  };

  const openModal = (report) => { setSelectedReport(report); setShowModal(true); };
  const closeModal = () => { setSelectedReport(null); setProcessMessage(""); setShowModal(false); };

  // 📸 이미지 파일 선택 및 미리보기 로직
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) { 
      setImageFile(file); 
      setPreviewUrl(URL.createObjectURL(file)); 
    }
  };

  // 📢 전체 알림 전송 로직 (이미지 포함)
  const handleSendNotice = async (e) => {
    e.preventDefault();
    if (!notice.title || !notice.content) return alert("제목과 내용을 입력해주세요.");
    
    setIsSending(true);
    const formData = new FormData();
    formData.append("title", notice.title);
    formData.append("content", notice.content);
    formData.append("type", "ALARM");
    
    // ✅ 사진 구멍: 파일이 있을 때만 추가
    if (imageFile) {
      formData.append("file", imageFile);
    }

    try {
      await axios.post(`${API_BASE_URL}/admin/notifications`, formData, {
        headers: { 
          Authorization: `Bearer ${token}`, 
          "Content-Type": "multipart/form-data" 
        }
      });
      alert("📢 전체 알림 및 이미지 전송 완료!");
      
      // 폼 초기화
      setNotice({ title: "", content: "" });
      setImageFile(null); 
      setPreviewUrl(null);
    } catch (err) { 
      console.error(err);
      alert("알림 전송에 실패했습니다."); 
    } finally { 
      setIsSending(false); 
    }
  };

  return (
    <div className="admin-container">
      <header className="admin-header">
        <h1>🛠️ 관리자 컨트롤 타워</h1>
      </header>
      
      {/* 스탯 카드 섹션 */}
      <div className="stats-grid">
         <div className="stat-card blue">
           <div className="stat-info"><h3>전체 사용자</h3><p className="count">{(stats.totalUsers || 0).toLocaleString()}명</p></div>
         </div>
         <div className="stat-card pink">
           <div className="stat-info"><h3>오늘의 좋아요</h3><p className="count">{(stats.todayLikes || 0).toLocaleString()}개</p></div>
         </div>
         <div className="stat-card yellow">
           <div className="stat-info"><h3>미처리 신고</h3><p className="count">{stats.reportedReviews?.length || 0}건</p></div>
         </div>
      </div>

      <div className="admin-main-content">
        {/* 📢 알림 전송 섹션 (이미지 구멍 추가됨) */}
        <section className="admin-section notice-section">
          <h3>📢 전체 알림(푸시) 전송</h3>
          <form onSubmit={handleSendNotice} className="admin-form">
            <input 
              type="text" 
              placeholder="제목을 입력하세요" 
              value={notice.title} 
              onChange={(e) => setNotice({...notice, title: e.target.value})} 
            />
            
            <div className="admin-file-input-wrapper">
              <label htmlFor="notice-image" className="file-label">🖼️ 이미지 첨부 (선택)</label>
              <input 
                id="notice-image"
                type="file" 
                accept="image/*" 
                onChange={handleFileChange} 
              />
              {previewUrl && (
                <div className="preview-container">
                  <img src={previewUrl} alt="미리보기" className="image-preview-img" style={{ width: '150px', borderRadius: '8px', marginTop: '10px' }} />
                  <button type="button" className="remove-img-btn" onClick={() => {setImageFile(null); setPreviewUrl(null);}}>X</button>
                </div>
              )}
            </div>

            <textarea 
              placeholder="알림 내용을 입력하세요..." 
              rows="5" 
              value={notice.content} 
              onChange={(e) => setNotice({...notice, content: e.target.value})} 
            />
            <button type="submit" disabled={isSending}>
              {isSending ? "🚀 전송 중..." : "전송하기"}
            </button>
          </form>
        </section>

        {/* 인기 메뉴 섹션 */}
        <section className="admin-section">
          <h3>🔥 실시간 인기 메뉴 TOP 5</h3>
          <ul className="rank-list">
              {stats.popularMenus && stats.popularMenus.length > 0 ? (
              stats.popularMenus.map((menu, i) => (
                  <li key={i} className="rank-item">
                  <div className="rank-left">
                      <span className={`rank-badge rank-${i + 1}`}>{i + 1}</span>
                      <span className="rank-name">
                      <strong>{menu.date}</strong> {menu.type}
                      </span>
                  </div>
                  <div className="rank-right">
                      <span className="rank-votes">❤️ {menu.votes}표</span>
                  </div>
                  </li>
              ))
              ) : (
              <p className="empty-msg">인기 메뉴 데이터가 아직 없습니다.</p>
              )}
          </ul>
        </section>

        {/* 신고 내역 섹션 */}
        <section className="admin-section full-width">
          <h3>🚨 최근 신고 내역</h3>
          <table className="admin-table">
            <thead><tr><th>신고자</th><th>내용</th><th>사유</th><th>관리</th></tr></thead>
            <tbody>
              {stats.reportedReviews?.map(r => (
                <tr key={r.id}>
                  <td>{r.userName}</td>
                  <td>{r.content}</td>
                  <td><span className="badge danger">{r.reason}</span></td>
                  <td><button className="action-process" onClick={() => openModal(r)}>처리</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>

      {/* 신고 처리 모달 */}
      {showModal && (
        <div className="admin-modal-overlay">
          <div className="admin-modal">
            <h3>🚨 신고 처리 (이메일 발송)</h3>
            <textarea value={processMessage} onChange={(e) => setProcessMessage(e.target.value)} rows="5" placeholder="답변 내용 입력..." />
            <div className="modal-actions">
              <button className="btn-resolve" onClick={() => handleProcessReport("RESOLVED")}>✅ 승인</button>
              <button className="btn-reject" onClick={() => handleProcessReport("REJECTED")}>❌ 반려</button>
              <button className="btn-close" onClick={closeModal}>닫기</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}