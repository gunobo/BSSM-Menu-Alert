import { useState } from "react";
import AdminDashboard from "./admin/AdminDashboard";
import AnnouncementEditor from "./admin/AnnouncementEditor"; 
import AnnouncementList from "./admin/AnnouncementList";     
import UserManagement from "./admin/UserManagement";
import "../styles/admin.css";

export default function AdminPage() {
  const [activeMenu, setActiveMenu] = useState("dashboard");
  const [isNoticeOpen, setIsNoticeOpen] = useState(false);
  
  // 💡 수정을 위해 선택된 공지사항 데이터 상태
  const [selectedNotice, setSelectedNotice] = useState(null);

  console.log("Admin Page Updated!");

  // 메뉴 클릭 핸들러
  const handleMenuClick = (menu) => {
    setActiveMenu(menu);
    setSelectedNotice(null); // 다른 메뉴로 이동 시 수정 데이터 초기화
  };

  // 💡 리스트에서 수정 버튼을 눌렀을 때 실행될 함수
  const handleEditNotice = (notice) => {
    setSelectedNotice(notice);      // 수정할 데이터 저장
    setActiveMenu("announcement-write"); // 에디터(공지 게시) 메뉴로 이동
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
          
          <button 
            className={activeMenu === "users" ? "active" : ""} 
            onClick={() => handleMenuClick("users")}
          >
            👥 사용자 관리
          </button>

          {/* 공지사항 그룹 메뉴 */}
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
              activeMenu === "announcement-write" ? (selectedNotice ? "공지사항 수정" : "공지사항 등록") : "공지사항 관리"
            }</h1>
            <p>BSSM 급식알리미 서비스의 통합 관리 도구입니다.</p>
          </header>

          <div className="admin-main-content">
            {activeMenu === "dashboard" && <AdminDashboard />}
            {activeMenu === "users" && <UserManagement />}
            
            {/* ✅ 에디터 컴포넌트에 selectedNotice(수정데이터) 전달 */}
            {activeMenu === "announcement-write" && (
              <AnnouncementEditor 
                editData={selectedNotice} 
                onComplete={() => handleMenuClick("announcement-manage")} 
              />
            )}
            
            {/* ✅ 리스트 컴포넌트에 handleEditNotice(수정핸들러) 전달 */}
            {activeMenu === "announcement-manage" && (
              <AnnouncementList onEdit={handleEditNotice} />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}