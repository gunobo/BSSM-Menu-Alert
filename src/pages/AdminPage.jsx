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

  const handleDeleteReport = async (reportId) => {
    if (!window.confirm("정말로 이 리뷰를 삭제하시겠습니까?")) return;
    try {
      await axios.delete(`${API_BASE_URL}/admin/reports/${reportId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert("삭제되었습니다.");
      setStats(prev => ({
        ...prev,
        reportedReviews: prev.reportedReviews.filter(r => r.id !== reportId)
      }));
    } catch (err) {
      alert("삭제 실패");
    }
  };

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
        headers: { 
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data" 
        }
      });
      alert("📢 전송 완료!");
      setNotice({ title: "", content: "" });
      setImageFile(null);
      setPreviewUrl(null);
    } catch (err) {
      alert("전송 실패");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="admin-container">
      <header className="admin-header">
        <h1>🛠️ 관리자 컨트롤 타워</h1>
        <p>서비스 현황 파악 및 전체 공지 관리</p>
      </header>

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
        <section className="admin-section notice-section">
          <h3>📢 전체 알림 전송</h3>
          <form onSubmit={handleSendNotice} className="admin-form">
            <input type="text" placeholder="제목" value={notice.title} onChange={(e) => setNotice({...notice, title: e.target.value})} />
            <textarea placeholder="내용" rows="5" value={notice.content} onChange={(e) => setNotice({...notice, content: e.target.value})} />
            <div className="file-upload-group">
              <input type="file" id="file-input" onChange={handleFileChange} accept="image/*" hidden />
              <label htmlFor="file-input" className="btn-small" style={{backgroundColor: '#4e73df', cursor: 'pointer', textAlign: 'center'}}>📸 이미지 첨부</label>
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

        <section className="admin-section">
          <h3>🔥 인기 메뉴 TOP 5</h3>
          <ul className="rank-list">
            {stats.popularMenus && stats.popularMenus.length > 0 ? (
              stats.popularMenus.map((menu, i) => {
                const rawDate = menu.date || "";
                let formattedDate = "날짜 미상";

                if (rawDate && rawDate.includes("-")) {
                  const parts = rawDate.split("-");
                  formattedDate = `${parseInt(parts[1])}월 ${parseInt(parts[2])}일`;
                }

                return (
                  <li key={i} className="rank-item">
                    <span className="rank-badge">{i + 1}</span>
                    <div className="rank-content">
                      <span className="rank-name">{formattedDate} - {menu.type || "미정"}</span>
                    </div>
                    <span className="rank-votes">{menu.votes}표</span>
                  </li>
                );
              })
            ) : <p className="empty-msg">집계 데이터가 없습니다.</p>}
          </ul>
        </section>

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
                    <td><button className="action-delete" onClick={() => handleDeleteReport(r.id)}>삭제</button></td>
                  </tr>
                ))
              ) : <tr><td colSpan="4" className="empty-msg">신고 내역이 없습니다.</td></tr>}
            </tbody>
          </table>
        </section>
      </div>
    </div>
  );
}