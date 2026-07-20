import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import "../styles/announcements.css"; 
import Footer from "./footer";
import Navbar from "./Navbar";

const API_BASE_URL = import.meta.env.VITE_API_URL;

export default function ReportDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  // ✅ 수정 모드 상태 관리
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({ reason: "", content: "" });

  const token = sessionStorage.getItem("accessToken") || localStorage.getItem("accessToken");

  const fetchReportDetail = async () => {
    if (!id || id === "undefined") {
      navigate("/my-report");
      return;
    }

    try {
      if (!token) {
        alert("로그인이 필요합니다.");
        navigate("/login");
        return;
      }

      const res = await axios.get(`${API_BASE_URL}/reports/my/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setReport(res.data);
      // ✅ 수정 초기값 세팅
      setEditData({ reason: res.data.reason, content: res.data.content });
    } catch (err) {
      console.error("상세 정보 로드 실패:", err);
      alert("존재하지 않거나 권한이 없는 게시물입니다.");
      navigate("/my-report");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportDetail();
  }, [id, navigate]);

  // ✅ 수정 저장 함수
  const handleUpdate = async () => {
    if (!editData.reason.trim()) return alert("제목을 입력해주세요.");
    
    try {
      await axios.put(`${API_BASE_URL}/reports/my/${id}`, editData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert("성공적으로 수정되었습니다.");
      setIsEditing(false);
      fetchReportDetail(); // 수정 후 데이터 새로고침
    } catch (err) {
      console.error("수정 실패:", err);
      alert("수정 권한이 없거나 서버 오류가 발생했습니다.");
    }
  };

  if (loading) return <div className="loading-msg">내용을 불러오는 중입니다...</div>;
  if (!report) return null;

  return (
    <div className="notice-page">
      <Navbar />

      <header className="notice-header">
        <div className="container">
          <h1>📄 건의 상세 내역</h1>
        </div>
      </header>

      <main className="container">
        <div className="notice-detail-card">
          
          <div className="detail-header">
            <div className="type-tag-wrapper" style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span className="type-badge">
                {report.type || "일반 건의"}
              </span>
              {/* ✅ 수정/취소 버튼 배치 */}
              <div className="action-buttons">
                {!isEditing ? (
                  <button className="back-btn" style={{ padding: '5px 15px', fontSize: '14px' }} onClick={() => setIsEditing(true)}>수정하기</button>
                ) : (
                  <>
                    <button className="back-btn" style={{ padding: '5px 15px', fontSize: '14px', backgroundColor: '#5b7cff', color: '#fff', marginRight: '5px' }} onClick={handleUpdate}>저장</button>
                    <button className="back-btn" style={{ padding: '5px 15px', fontSize: '14px' }} onClick={() => setIsEditing(false)}>취소</button>
                  </>
                )}
              </div>
            </div>

            {/* ✅ 수정 모드 분기 (제목) */}
            {!isEditing ? (
              <h2 className="detail-title">{report.reason || "건의 내용 상세"}</h2>
            ) : (
              <input 
                type="text" 
                className="detail-title"
                style={{ width: '100%', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '10px', marginTop: '10px' }}
                value={editData.reason}
                onChange={(e) => setEditData({...editData, reason: e.target.value})}
              />
            )}

            <div className="detail-meta">
              <span>작성일: {report.createdAt?.slice(0, 10)}</span> <br />
              <span>번호: {report.id}</span>
            </div>
          </div>

          {/* ✅ 수정 모드 분기 (본문) */}
          <div className="detail-body">
            {!isEditing ? (
              report.content
            ) : (
              <textarea 
                style={{ width: '100%', minHeight: '200px', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '15px', fontSize: '16px', lineHeight: '1.6' }}
                value={editData.content}
                onChange={(e) => setEditData({...editData, content: e.target.value})}
              />
            )}
          </div>

          {(report.targetId || report.isReported) && (
            <div className="extra-info-box">
               <h4>⚠️ 관련 정보</h4>
               <p>- 대상 ID: {report.targetId || "없음"}</p>
               <p>- 신고 여부: {report.isReported ? "예" : "아니오"}</p>
            </div>
          )}

          <div className="detail-footer">
            <button className="back-btn" onClick={() => navigate("/my-report")}>
              목록으로 돌아가기
            </button>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}