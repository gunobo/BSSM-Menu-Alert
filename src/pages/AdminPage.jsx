import { useState } from "react";
import AdminDashboard from "./admin/AdminDashboard";
import AnnouncementEditor from "./admin/AnnouncementEditor"; 
import AnnouncementList from "./admin/AnnouncementList";     
import UserManagement from "./admin/UserManagement";
import UserSearch from "./admin/UserSearchPage";
import AdminCommentManager from "./admin/AdminCommentManager"; 
import PushNotificationManager from "./admin/PushNotificationManager"; // 신규 컴포넌트 추가
import "../styles/admin.css";

export default function AdminPage() {
  const [activeMenu, setActiveMenu] = useState("dashboard");
  const [isNoticeOpen, setIsNoticeOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [selectedNotice, setSelectedNotice] = useState(null);

  const handleMenuClick = (menu) => {
    setActiveMenu(menu);
    setSelectedNotice(null); 
  };

  const handleEditNotice = (notice) => {
    setSelectedNotice(notice);      
    setActiveMenu("announcement-write"); 
  };

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="sidebar-logo">
          <h2>BSSM Admin</h2>
          <p>관리자 시스템</p>
        </div>
        <nav className="sidebar-nav">
          <button 
            className={activeMenu === "dashboard" ? "active" : ""} 
            onClick={() => handleMenuClick("dashboard")}
          >
            📊 대시보드
          </button>
          
          <div className={`menu-group ${isUserMenuOpen ? "open" : ""}`}>
            <button 
              className={`group-title ${activeMenu.includes("user") ? "active" : ""}`}
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            >
              👥 유저 관리 <span className="arrow">{isUserMenuOpen ? "▲" : "▼"}</span>
            </button>
            
            {isUserMenuOpen && (
              <div className="sub-menu-list">
                <button 
                  className={activeMenu === "users" ? "active" : ""} 
                  onClick={() => handleMenuClick("users")}
                >
                  └ 유저 관리
                </button>
                <button 
                  className={activeMenu === "user-search" ? "active" : ""} 
                  onClick={() => handleMenuClick("user-search")}
                >
                  └ 유저 검색
                </button>
              </div>
            )}
          </div>

          <button 
            className={activeMenu === "comments" ? "active" : ""} 
            onClick={() => handleMenuClick("comments")}
          >
            💬 댓글 관리
          </button>

          {/* 🔔 푸시 알림 메뉴 추가 */}
          <button 
            className={activeMenu === "push-notis" ? "active" : ""} 
            onClick={() => handleMenuClick("push-notis")}
          >
            🔔 푸시 알림 전송
          </button>

          <div className={`menu-group ${isNoticeOpen ? "open" : ""}`}>
            <button 
              className={`group-title ${activeMenu.includes("announcement") ? "active" : ""}`}
              onClick={() => setIsNoticeOpen(!isNoticeOpen)}
            >
              📢 공지 관리 <span className="arrow">{isNoticeOpen ? "▲" : "▼"}</span>
            </button>
            
            {isNoticeOpen && (
              <div className="sub-menu-list">
                <button 
                  className={activeMenu === "announcement-write" ? "active" : ""} 
                  onClick={() => handleMenuClick("announcement-write")}
                >
                  └ {selectedNotice ? "공지 수정" : "공지 게시"}
                </button>
                <button 
                  className={activeMenu === "announcement-manage" ? "active" : ""} 
                  onClick={() => handleMenuClick("announcement-manage")}
                >
                  └ 공지글 관리
                </button>
              </div>
            )}
          </div>
        </nav>
      </aside>

      <main className="admin-main">
        <div className="admin-container">
          <header className="admin-header">
            <h1>{
              activeMenu === "dashboard" ? "통계 및 관리" : 
              activeMenu === "users" ? "사용자 관리" : 
              activeMenu === "user-search" ? "사용자 검색" : 
              activeMenu === "comments" ? "전체 댓글 관리" : 
              activeMenu === "push-notis" ? "푸시 알림 관리" : // 헤더 타이틀 추가
              activeMenu === "announcement-write" ? (selectedNotice ? "공지사항 수정" : "공지사항 등록") : "공지사항 관리"
            }</h1>
            <p>BSSM 급식알리미 서비스의 통합 관리 도구입니다.</p>
          </header>

          <div className="admin-main-content">
            {activeMenu === "dashboard" && <AdminDashboard />}
            {activeMenu === "users" && <UserManagement />}
            {activeMenu === "user-search" && <UserSearch />}
            {activeMenu === "comments" && <AdminCommentManager />}
            
            {/* 🔔 푸시 알림 컴포넌트 연결 */}
            {activeMenu === "push-notis" && <PushNotificationManager />}
            
            {activeMenu === "announcement-write" && (
              <AnnouncementEditor 
                editData={selectedNotice} 
                onComplete={() => handleMenuClick("announcement-manage")} 
              />
            )}
            
            {activeMenu === "announcement-manage" && (
              <AnnouncementList onEdit={handleEditNotice} />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}