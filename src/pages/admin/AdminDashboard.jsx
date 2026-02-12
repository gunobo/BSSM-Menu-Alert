import { useEffect, useState } from "react";
import axios from "axios";
import "../../styles/admin.css";

// ⭐ Chart.js 필수 컴포넌트 임포트
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

// Chart.js 등록
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0, todayLikes: 0, totalComments: 0,
    reportedReviews: [], popularMenus: [], topCommentedMenus: [], dailyStats: []
  });

  // ✅ 앱 다운로드 통계 상태 추가
  const [appStats, setAppStats] = useState([]);
  
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
      // 1. 기존 대시보드 통계 로드
      const res = await axios.get(`${API_BASE_URL}/admin/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(res.data);

      // 2. ✅ 앱 다운로드 통계 로드
      const appRes = await axios.get(`${API_BASE_URL}/admin/app/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAppStats(appRes.data);
    } catch (err) { 
      console.error("데이터 로드 실패:", err); 
    }
  };

  useEffect(() => { fetchStats(); }, [token]);

  // 📊 Chart.js 데이터 설정
  const chartData = {
    labels: stats.dailyStats?.map(d => d.dayOfWeek.split('(')[0]) || [],
    datasets: [
      {
        label: '좋아요',
        data: stats.dailyStats?.map(d => d.likeCount) || [],
        backgroundColor: '#6366f1',
        borderRadius: 5,
      },
      {
        label: '댓글',
        data: stats.dailyStats?.map(d => d.commentCount) || [],
        backgroundColor: '#10b981',
        borderRadius: 5,
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { backgroundColor: '#1e293b' }
    },
    scales: {
      y: { beginAtZero: true, grid: { color: '#f1f5f9' } },
      x: { grid: { display: false } }
    }
  };

  // --- 기존 핸들러 함수들 ---
  const handleProcessReport = async (status) => {
    if (!processMessage.trim()) return alert("사유를 입력하세요.");
    try {
      await axios.post(`${API_BASE_URL}/admin/reports/${selectedReport.id}/process`, {
        status, message: processMessage, userEmail: selectedReport.userEmail
      }, { headers: { Authorization: `Bearer ${token}` } });
      alert("처리 완료");
      setStats(prev => ({ ...prev, reportedReviews: prev.reportedReviews.filter(r => r.id !== selectedReport.id) }));
      closeModal();
    } catch (err) { alert("오류 발생"); }
  };

  const openModal = (report) => { setSelectedReport(report); setShowModal(true); };
  const closeModal = () => { setSelectedReport(null); setProcessMessage(""); setShowModal(false); };
  
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) { setImageFile(file); setPreviewUrl(URL.createObjectURL(file)); }
  };

  const handleSendNotice = async (e) => {
    e.preventDefault();
    if (!notice.title || !notice.content) return alert("내용 입력 필수");
    setIsSending(true);
    const formData = new FormData();
    formData.append("title", notice.title); 
    formData.append("content", notice.content); 
    formData.append("type", "ALARM");
    if (imageFile) formData.append("file", imageFile);
    try {
      await axios.post(`${API_BASE_URL}/admin/notifications`, formData, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" }
      });
      alert("발송 완료"); setNotice({ title: "", content: "" }); setImageFile(null); setPreviewUrl(null);
    } catch (err) { alert("발송 실패"); } finally { setIsSending(false); }
  };

  // ✅ 누적 다운로드 합계 계산
  const totalDownloads = appStats.reduce((acc, curr) => acc + curr.downloadCount, 0);

  return (
    <div className="admin-container">
      <header className="admin-header">
        <h1>🛠️ 관리자 컨트롤 타워</h1>
        <p>서비스 현황 및 앱 배포 상태를 실시간으로 확인합니다.</p>
      </header>

      {/* 💳 통계 카드 섹션 */}
      <div className="stats-grid">
        <div className="stat-card blue"><div className="stat-info"><h3>전체 사용자</h3><p className="count">{(stats.totalUsers || 0).toLocaleString()} 명</p></div></div>
        <div className="stat-card pink"><div className="stat-info"><h3>오늘의 좋아요</h3><p className="count">{(stats.todayLikes || 0).toLocaleString()} 개</p></div></div>
        
        {/* ✅ 누적 앱 다운로드 카드 추가 */}
        <div className="stat-card green">
            <div className="stat-info">
                <h3>누적 앱 다운로드</h3>
                <p className="count">{totalDownloads.toLocaleString()} 회</p>
            </div>
        </div>

        <div className="stat-card yellow"><div className="stat-info"><h3>미처리 신고</h3><p className="count">{stats.reportedReviews?.length || 0} 건</p></div></div>
      </div>

      {/* 📊 차트 섹션 */}
      <section className="chart-container-main">
        <div className="section-header">
          <h3>📊 주간 피드백 추이</h3>
          <div className="chart-legend-top">
            <span className="legend-item"><i className="dot-blue"></i> 좋아요</span>
            <span className="legend-item"><i className="dot-green"></i> 댓글</span>
          </div>
        </div>
        <div style={{ height: '300px', width: '100%' }}>
          <Bar data={chartData} options={chartOptions} />
        </div>
      </section>

      <div className="dashboard-middle-row">
        {/* 📢 알림 전송 섹션 */}
        <section className="admin-section">
          <h3>📢 전체 알림 전송</h3>
          <form onSubmit={handleSendNotice} className="admin-form">
            <input type="text" placeholder="제목" value={notice.title} onChange={(e) => setNotice({ ...notice, title: e.target.value })} />
            <div className="file-input-wrapper">
                <input type="file" onChange={handleFileChange} />
            </div>
            {previewUrl && <img src={previewUrl} alt="미리보기" style={{width: '100%', borderRadius: '8px', marginBottom: '10px'}} />}
            <textarea placeholder="내용" value={notice.content} onChange={(e) => setNotice({ ...notice, content: e.target.value })} />
            <button type="submit" disabled={isSending}>{isSending ? "전송 중..." : "발송하기"}</button>
          </form>
        </section>

        {/* ✅ 앱 상세 다운로드 통계 섹션 추가 */}
        <section className="admin-section">
          <h3>📱 앱 플랫폼별 통계</h3>
          <div className="app-stats-list">
            {appStats.length > 0 ? appStats.map((app, i) => (
              <div key={i} className="app-stat-item" style={{
                  display: 'flex', justifyContent: 'space-between', padding: '15px', 
                  backgroundColor: '#f8fafc', borderRadius: '10px', marginBottom: '10px'
              }}>
                <div>
                  <strong style={{fontSize: '1.1rem', color: app.appType === 'APK' ? '#3b82f6' : '#ef4444'}}>
                      {app.appType}
                  </strong>
                  <p style={{fontSize: '0.85rem', color: '#64748b', marginTop: '4px'}}>
                      최근 다운로드: {app.lastDownloadedAt ? new Date(app.lastDownloadedAt).toLocaleString() : '기록 없음'}
                  </p>
                </div>
                <div style={{textAlign: 'right'}}>
                  <span style={{fontSize: '1.2rem', fontWeight: 'bold'}}>{app.downloadCount.toLocaleString()}회</span>
                </div>
              </div>
            )) : <p>다운로드 기록이 없습니다.</p>}
          </div>
          
          <div style={{marginTop: '20px'}}>
              <h3 style={{fontSize: '1rem', marginBottom: '10px'}}>🔥 인기 메뉴 TOP 5</h3>
              <ul className="rank-list">
                {stats.popularMenus?.map((menu, i) => (
                  <li key={i} className="rank-item">
                    <span className={`rank-badge rank-${i+1}`}>{i+1}</span>
                    {menu.date} {menu.type} (❤️ {menu.votes})
                  </li>
                ))}
              </ul>
          </div>
        </section>
      </div>

      {/* 🚨 신고 내역 테이블 */}
      <section className="admin-section">
        <h3>🚨 최근 신고 내역</h3>
        <table className="admin-table">
          <thead><tr><th>신고자</th><th>내용</th><th>사유</th><th>관리</th></tr></thead>
          <tbody>
            {stats.reportedReviews.map(r => (
              <tr key={r.id}><td>{r.userName}</td><td>{r.content}</td><td>{r.reason}</td><td><button onClick={() => openModal(r)}>처리</button></td></tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* 신고 처리 모달 */}
      {showModal && (
        <div className="admin-modal-overlay">
          <div className="admin-modal">
            <h3>🚨 신고 처리</h3>
            <p>"{selectedReport?.content}"</p>
            <textarea value={processMessage} onChange={(e) => setProcessMessage(e.target.value)} placeholder="처리 사유 입력..." />
            <div className="modal-actions">
              <button className="btn-resolve" onClick={() => handleProcessReport("RESOLVED")}>승인</button>
              <button className="btn-reject" onClick={() => handleProcessReport("REJECTED")}>반려</button>
              <button className="btn-close" onClick={closeModal}>취소</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}