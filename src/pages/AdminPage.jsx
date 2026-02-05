import { useState } from "react";
import AdminDashboard from "./admin/AdminDashboard";
import AnnouncementEditor from "./admin/AnnouncementEditor"; 
import AnnouncementList from "./admin/AnnouncementList";     
import UserManagement from "./admin/UserManagement";
import UserSearch from "./admin/UserSearchPage"; // 유저 검색 컴포넌트 추가
import AdminCommentManager from "./admin/AdminCommentManager"; 
import "../styles/admin.css";

export default function AdminPage() {
  const [activeMenu, setActiveMenu] = useState("dashboard");
  const [isNoticeOpen, setIsNoticeOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false); // 유저 메뉴 열림 상태
  const [selectedNotice, setSelectedNotice] = useState(null);

  // 메뉴 클릭 핸들러
  const handleMenuClick = (menu) => {
    setActiveMenu(menu);
    setSelectedNotice(null); 
  };

  // 공지 수정 핸들러
  const handleEditNotice = (notice) => {
    setSelectedNotice(notice);      
    setActiveMenu("announcement-write"); 
  };

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
            onClick={() => handleMenuClick("dashboard")}
          >
            📊 대시보드
          </button>
          
          {/* 유저 관리 그룹 */}
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

          {/* 공지 관리 그룹 */}
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

      {/* 메인 영역 */}
      <main className="admin-main">
        <div className="admin-container">
          <header className="admin-header">
            <h1>{
              activeMenu === "dashboard" ? "통계 및 관리" : 
              activeMenu === "users" ? "사용자 관리" : 
              activeMenu === "user-search" ? "사용자 검색" : 
              activeMenu === "comments" ? "전체 댓글 관리" : 
              activeMenu === "announcement-write" ? (selectedNotice ? "공지사항 수정" : "공지사항 등록") : "공지사항 관리"
            }</h1>
            <p>BSSM 급식알리미 서비스의 통합 관리 도구입니다.</p>
          </header>

          <div className="admin-main-content">
            {activeMenu === "dashboard" && <AdminDashboard />}
            
            {activeMenu === "users" && <UserManagement />}

            {activeMenu === "user-search" && <UserSearch />}
            
            {activeMenu === "comments" && <AdminCommentManager />}
            
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