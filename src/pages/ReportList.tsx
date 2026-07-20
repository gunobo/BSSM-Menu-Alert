import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { getUser } from "../api/auth";
import Navbar from "./Navbar";
import type { User, Report } from "../types";

const API_BASE_URL = import.meta.env.VITE_API_URL;

export default function ReportList() {
  const navigate = useNavigate();
  const [reports, setReports] = useState<Report[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  const token = sessionStorage.getItem("accessToken") || localStorage.getItem("accessToken");

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const userData = await getUser();
      if (!userData) {
        alert("로그인 세션이 만료되었습니다.");
        navigate("/login");
        return;
      }
      setUser(userData);

      const res = await axios.get(`${API_BASE_URL}/reports/my`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const sortedData = (res.data as Report[]).sort((a, b) => new Date(b.createdAt ?? "").getTime() - new Date(a.createdAt ?? "").getTime());
      setReports(sortedData);
    } catch (err) {
      console.error("데이터 로딩 중 에러:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, [navigate]);

  const handleSelect = (e: React.SyntheticEvent, id: number) => {
    e.stopPropagation(); // 행 클릭(상세 이동) 방지
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(reports.map(r => r.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.length === 0) return alert("삭제할 항목을 선택해주세요.");
    if (!window.confirm(`선택한 ${selectedIds.length}개의 내역을 삭제하시겠습니까?`)) return;

    try {
      await Promise.all(
        selectedIds.map(id => 
          axios.delete(`${API_BASE_URL}/reports/my/${id}`, {
            headers: { Authorization: `Bearer ${token}` }
          })
        )
      );
      alert("삭제되었습니다.");
      setSelectedIds([]);
      loadInitialData();
    } catch (err) {
      alert("삭제 실패");
    }
  };

  if (loading) return <div className="notice-page" style={{textAlign: 'center', padding: '100px'}}>데이터를 불러오는 중...</div>;

  return (
    <>
    <Navbar />
    <div className="notice-page">
        {/* 주신 디자인 헤더 */}
        <div className="notice-header">
            <h1>나의 건의 내역</h1>
            <p>{user?.name}님의 건의함입니다.</p>
        </div>

        {/* 주신 디자인 카드 */}
        <div className="notice-list-card">
            <div className="list-top-bar">
            <div className="total-count">
                총 <strong>{reports.length}</strong>건의 내역
            </div>
            
            {/* 삭제 버튼 - 디자인에 맞춰 back-btn 스타일 활용 */}
            {selectedIds.length > 0 && (
                <button 
                className="list-back-btn" 
                style={{marginTop: 0, color: '#ff4d4d', borderColor: '#ff4d4d'}}
                onClick={handleDeleteSelected}
                >
                선택 삭제 ({selectedIds.length})
                </button>
            )}
            </div>

            <div className="notice-table">
            {/* 테이블 헤더 - 주신 CSS 활용 */}
            <div className="table-header">
                <div style={{ width: '50px', textAlign: 'center' }}>
                <input 
                    type="checkbox" 
                    onChange={handleSelectAll} 
                    checked={selectedIds.length === reports.length && reports.length > 0} 
                />
                </div>
                <div className="col-id">분류</div>
                <div className="col-title">내용</div>
                <div className="col-date">날짜</div>
            </div>

            {/* 테이블 행 - 주신 CSS 활용 */}
            {reports.length > 0 ? (
                reports.map((report) => (
                <div 
                    key={report.id} 
                    className="table-row" 
                    onClick={() => navigate(`/my-report/${report.id}`)}
                >
                    <div style={{ width: '50px', textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                    <input 
                        type="checkbox" 
                        checked={selectedIds.includes(report.id)} 
                        onChange={(e) => handleSelect(e, report.id)} 
                    />
                    </div>
                    <div className="col-id">{report.type}</div>
                    <div className="col-title">{report.reason || report.content}</div>
                    <div className="col-date">{report.createdAt?.slice(0, 10)}</div>
                </div>
                ))
            ) : (
                <div style={{textAlign: 'center', padding: '50px', color: '#94a3b8'}}>내역이 없습니다.</div>
            )}
            </div>
        </div>
    </div>
    </>
  );
}