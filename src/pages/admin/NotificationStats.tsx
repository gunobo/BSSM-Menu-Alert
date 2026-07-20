import React, { useState, useEffect } from "react";
import axios from "axios";
import "../../styles/NotificationStats.css";

export default function NotificationStats() {
  const [stats, setStats] = useState({
    recentLogs: [],
    totalSentCount: 0,
  });
  const [loading, setLoading] = useState(true);
  
  // ✅ 페이지네이션 관련 상태 추가
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10); // 기본 10개씩

  const BaseURL = import.meta.env.VITE_API_URL;

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${BaseURL}/admin/notification/stats`, {
        withCredentials: true
      });
      
      setStats({
        recentLogs: response.data.recentLogs || [],
        totalSentCount: response.data.totalSentCount || 0
      });
      setCurrentPage(1); // 데이터 새로고침 시 1페이지로 이동
    } catch (error) {
      console.error("통계 데이터 로드 실패:", error);
      alert("데이터를 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // ✅ 페이지네이션 계산 로직
  const indexOfLastLog = currentPage * rowsPerPage;
  const indexOfFirstLog = indexOfLastLog - rowsPerPage;
  const currentLogs = stats.recentLogs.slice(indexOfFirstLog, indexOfLastLog);
  const totalPages = Math.ceil(stats.recentLogs.length / rowsPerPage);

  const calculateSuccessRate = (success, total) => {
    if (!total || total === 0) return "0%";
    return ((success / total) * 100).toFixed(1) + "%";
  };

  if (loading) return <div className="stats-loading">데이터를 불러오는 중...</div>;

  return (
    <div className="stats-container">
      {/* 요약 카드 섹션 */}
      <div className="stats-summary-cards">
        <div className="summary-card">
          <span className="card-label">누적 발송 횟수</span>
          <span className="card-value">{(stats.totalSentCount || 0).toLocaleString()}건</span>
        </div>
        <div className="summary-card">
          <span className="card-label">전체 로그 수</span>
          <span className="card-value">{stats.recentLogs.length}개</span>
        </div>
        <div className="summary-card">
          <span className="card-label">시스템 상태</span>
          <span className="card-value" style={{ color: "#2ecc71" }}>정상</span>
        </div>
      </div>

      <div className="stats-table-wrapper">
        <div className="table-header-flex">
          <div className="header-left">
            <h3>최근 알림 발송 내역</h3>
            {/* ✅ 페이지당 항목 수 선택 Select 추가 */}
            <select 
              className="rows-per-page-select"
              value={rowsPerPage} 
              onChange={(e) => {
                setRowsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
            >
              <option value={10}>10개씩 보기</option>
              <option value={30}>30개씩 보기</option>
              <option value={50}>50개씩 보기</option>
            </select>
          </div>
          <button className="refresh-btn" onClick={fetchStats}>🔄 새로고침</button>
        </div>
        
        <table className="admin-table">
          <thead>
            <tr>
              <th>발송 일시</th><th>발송자</th><th>알림 제목</th><th>타입</th><th>대상</th><th>성공</th><th>실패</th><th>성공률</th>
            </tr>
          </thead>
          <tbody>
            {currentLogs.length > 0 ? (
              currentLogs.map((log, index) => (
                <tr key={log.id || `log-${index}`}> 
                  <td>{log.sentAt ? new Date(log.sentAt).toLocaleString() : "-"}</td>
                  <td>
                    <span className="sender-badge">{log.senderEmail || "SYSTEM"}</span>
                  </td>
                  <td className="text-left"><strong>{log.title}</strong></td>
                  <td>
                    <span className={`badge ${log.targetType === "ALL" ? "badge-all" : "badge-target"}`}>
                      {log.targetType}
                    </span>
                  </td>
                  <td>{log.totalCount}</td>
                  <td className="text-success">{log.successCount}</td>
                  <td className="text-danger">{log.failureCount}</td>
                  <td>
                    <div className="progress-bar-container">
                      <div 
                        className="progress-bar-fill" 
                        style={{ width: calculateSuccessRate(log.successCount, log.totalCount) }}
                      ></div>
                      <span className="rate-text">{calculateSuccessRate(log.successCount, log.totalCount)}</span>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={8} className="no-data">발송 내역이 존재하지 않습니다.</td>
              </tr>
            )}
          </tbody>
        </table>

        {/* ✅ 페이지네이션 컨트롤 추가 */}
        {stats.recentLogs.length > 0 && (
          <div className="pagination-container">
            <button 
              className="page-btn" 
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => prev - 1)}
            >
              이전
            </button>
            
            <div className="page-numbers">
              {[...Array(totalPages)].map((_, i) => (
                <button 
                  key={i + 1}
                  className={`page-number ${currentPage === i + 1 ? "active" : ""}`}
                  onClick={() => setCurrentPage(i + 1)}
                >
                  {i + 1}
                </button>
              ))}
            </div>

            <button 
              className="page-btn" 
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(prev => prev + 1)}
            >
              다음
            </button>
          </div>
        )}
      </div>
    </div>
  );
}