import { useState, useEffect } from "react";
import axios from "axios";
import AdminDashboard from "./admin/AdminDashboard"; // 기존 코드를 대시보드로 분리
import AnnouncementEditor from "./admin/AnnouncementEditor"; // 새로 추가할 공지 작성 컴포넌트
import "../styles/admin.css";

export default function AdminPage() {
  const [activeMenu, setActiveMenu] = useState("dashboard");

  return (
    <div className="admin-layout">
      {/* ⬅️ 왼쪽 사이드바 추가 */}
      <aside className="admin-sidebar">
        <div className="sidebar-logo">
          <h2>BSSM Admin</h2>
          <p>관리자 시스템</p>
        </div>
        <nav className="sidebar-nav">
          <button 
            className={activeMenu === "dashboard" ? "active" : ""} 
            onClick={() => setActiveMenu("dashboard")}
          >
            📊 대시보드 (통계/신고)
          </button>
          <button 
            className={activeMenu === "announcement" ? "active" : ""} 
            onClick={() => setActiveMenu("announcement")}
          >
            📝 공지게시판 글쓰기
          </button>
        </nav>
      </aside>

      {/* ➡️ 오른쪽 메인 영역 */}
      <main className="admin-main">
        {activeMenu === "dashboard" ? (
          <AdminDashboard /> 
        ) : (
          <AnnouncementEditor />
        )}
      </main>
    </div>
  );
}