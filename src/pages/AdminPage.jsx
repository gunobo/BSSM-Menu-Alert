import { useState } from "react";
import AdminDashboard from "./admin/AdminDashboard";
import AnnouncementEditor from "./admin/AnnouncementEditor";
import UserManagement from "./admin/UserManagement";
import "../styles/admin.css";

export default function AdminPage() {
  const [activeMenu, setActiveMenu] = useState("dashboard");

  return (
    <div className="admin-layout">
      {/* 사이드바 영역 */}
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
            className={activeMenu === "users" ? "active" : ""} 
            onClick={() => setActiveMenu("users")}
          >
            👥 사용자 관리
          </button>
          <button 
            className={activeMenu === "announcement" ? "active" : ""} 
            onClick={() => setActiveMenu("announcement")}
          >
            📝 공지게시판 글쓰기
          </button>
        </nav>
      </aside>

      {/* 메인 영역 */}
      <main className="admin-main">
        <div className="admin-container">
          <header className="admin-header">
            <h1>{
              activeMenu === "dashboard" ? "통계 및 관리" : 
              activeMenu === "users" ? "사용자 관리" : "공지사항 등록"
            }</h1>
            <p>BSSM 급식알리미 서비스의 통합 관리 도구입니다.</p>
          </header>

          <div className="admin-main-content">
            {activeMenu === "dashboard" && <AdminDashboard />}
            {activeMenu === "users" && <UserManagement />}
            {activeMenu === "announcement" && <AnnouncementEditor />}
          </div>
        </div>
      </main>
    </div>
  );
}