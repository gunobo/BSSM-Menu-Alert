import { useState } from "react";
import AdminDashboard from "./admin/AdminDashboard";
import AnnouncementEditor from "./admin/AnnouncementEditor"; 
import AnnouncementList from "./admin/AnnouncementList";     
import UserManagement from "./admin/UserManagement";
import UserSearch from "./admin/UserSearchPage";
import AdminCommentManager from "./admin/AdminCommentManager"; 
import PushNotificationManager from "./admin/PushNotificationManager"; 
import NotificationStats from "./admin/NotificationStats"; 
import AppFileManager from "./admin/AppFileManager"; // ✅ 신규 추가: 앱 파일 업로드 관리
import "../styles/admin.css";

export default function AdminPage() {
  const [activeMenu, setActiveMenu] = useState("dashboard");
  const [isNoticeOpen, setIsNoticeOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isPushMenuOpen, setIsPushMenuOpen] = useState(false);
  const [isAppMenuOpen, setIsAppMenuOpen] = useState(false); // ✅ 앱 관리 메뉴 상태 추가
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
          
          {/* 유저 관리 */}
          <div className={`menu-group ${isUserMenuOpen ? "open" : ""}`}>
            <button 
              className={`group-title ${activeMenu.includes("user") ? "active" : ""}`}
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            >
              👥 유저 관리 <span className="arrow">{isUserMenuOpen ? "▲" : "▼"}</span>
            </button>
            {isUserMenuOpen && (
              <div className="sub-menu-list">
                <button className={activeMenu === "users" ? "active" : ""} onClick={() => handleMenuClick("users")}>
                  └ 유저 목록
                </button>
                <button className={activeMenu === "user-search" ? "active" : ""} onClick={() => handleMenuClick("user-search")}>
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

          {/* 🔔 푸시 알림 */}
          <div className={`menu-group ${isPushMenuOpen ? "open" : ""}`}>
            <button 
              className={`group-title ${activeMenu.includes("push") || activeMenu.includes("stats") ? "active" : ""}`}
              onClick={() => setIsPushMenuOpen(!isPushMenuOpen)}
            >
              🔔 푸시 알림 <span className="arrow">{isPushMenuOpen ? "▲" : "▼"}</span>
            </button>
            {isPushMenuOpen && (
              <div className="sub-menu-list">
                <button className={activeMenu === "push-notis" ? "active" : ""} onClick={() => handleMenuClick("push-notis")}>
                  └ 알림 전송
                </button>
                <button className={activeMenu === "push-stats" ? "active" : ""} onClick={() => handleMenuClick("push-stats")}>
                  └ 알림 통계/내역
                </button>
              </div>
            )}
          </div>

          {/* 📢 공지 관리 */}
          <div className={`menu-group ${isNoticeOpen ? "open" : ""}`}>
            <button 
              className={`group-title ${activeMenu.includes("announcement") ? "active" : ""}`}
              onClick={() => setIsNoticeOpen(!isNoticeOpen)}
            >
              📢 공지 관리 <span className="arrow">{isNoticeOpen ? "▲" : "▼"}</span>
            </button>
            {isNoticeOpen && (
              <div className="sub-menu-list">
                <button className={activeMenu === "announcement-write" ? "active" : ""} onClick={() => handleMenuClick("announcement-write")}>
                  └ {selectedNotice ? "공지 수정" : "공지 게시"}
                </button>
                <button className={activeMenu === "announcement-manage" ? "active" : ""} onClick={() => handleMenuClick("announcement-manage")}>
                  └ 공지글 관리
                </button>
              </div>
            )}
          </div>

          {/* 📱 앱 관리 (✅ 신규 메뉴) */}
          <div className={`menu-group ${isAppMenuOpen ? "open" : ""}`}>
            <button 
              className={`group-title ${activeMenu.includes("app") ? "active" : ""}`}
              onClick={() => setIsAppMenuOpen(!isAppMenuOpen)}
            >
              📱 앱 관리 <span className="arrow">{isAppMenuOpen ? "▲" : "▼"}</span>
            </button>
            {isAppMenuOpen && (
              <div className="sub-menu-list">
                <button 
                  className={activeMenu === "app-upload" ? "active" : ""} 
                  onClick={() => handleMenuClick("app-upload")}
                >
                  └ 설치 파일 업로드
                </button>
                {/* 추후 스토어 링크 관리 등을 추가할 수 있습니다 */}
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
              activeMenu === "push-notis" ? "푸시 알림 전송" :
              activeMenu === "push-stats" ? "알림 통계 및 내역" : 
              activeMenu === "app-upload" ? "앱 설치 파일 관리" : // ✅ 헤더 타이틀 추가
              activeMenu === "announcement-write" ? (selectedNotice ? "공지사항 수정" : "공지사항 등록") : "공지사항 관리"
            }</h1>
            <p>BSSM 급식알리미 서비스의 통합 관리 도구입니다.</p>
          </header>

          <div className="admin-main-content">
            {activeMenu === "dashboard" && <AdminDashboard />}
            {activeMenu === "users" && <UserManagement />}
            {activeMenu === "user-search" && <UserSearch />}
            {activeMenu === "comments" && <AdminCommentManager />}
            {activeMenu === "push-notis" && <PushNotificationManager />}
            {activeMenu === "push-stats" && <NotificationStats />}
            
            {/* ✅ 앱 파일 업로드 컴포넌트 연결 */}
            {activeMenu === "app-upload" && <AppFileManager />}
            
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