import { useState, useEffect } from "react";
import { getUser } from "../api/auth"; // API 호출 함수 임포트 확인
import AdminDashboard from "./admin/AdminDashboard";
import AnnouncementEditor from "./admin/AnnouncementEditor"; 
import AnnouncementList from "./admin/AnnouncementList";     
import UserManagement from "./admin/UserManagement";
import UserSearch from "./admin/UserSearchPage";
import AdminCommentManager from "./admin/AdminCommentManager"; 
import PushNotificationManager from "./admin/PushNotificationManager"; 
import NotificationStats from "./admin/NotificationStats"; 
import AppFileManager from "./admin/AppFileManager";
import "../styles/admin.css";

export default function AdminPage() {
  const [activeMenu, setActiveMenu] = useState("dashboard");
  const [isNoticeOpen, setIsNoticeOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isPushMenuOpen, setIsPushMenuOpen] = useState(false);
  const [isAppMenuOpen, setIsAppMenuOpen] = useState(false);
  const [selectedNotice, setSelectedNotice] = useState(null);
  
  // ✅ 사용자 상태 관리
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        setLoading(true);
        const userData = await getUser(); 
        setUser(userData);
      } catch (err) {
        console.error("유저 정보를 가져오는데 실패했습니다.", err);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  // ✅ 편의를 위해 user 객체에서 role 추출 (ROLE_ 접두사 대응)
  const userRole = user?.role || "ROLE_USER";

  // ✅ 권한별 접근 가능한 메뉴 정의
  const hasAccess = (menu) => {
    // ADMIN은 모든 메뉴 접근 가능
    if (userRole === "ROLE_ADMIN" || userRole === "ADMIN") return true;

    // MODERATOR(운영자) 접근 가능 메뉴
    const moderatorMenus = [
      "dashboard",           // 대시보드
      "comments",            // 댓글 관리
      "push-notis",          // 푸시 알림 전송
      "push-stats",          // 알림 통계
      "announcement-write",  // 공지 작성
      "announcement-manage", // 공지 관리
    ];

    return moderatorMenus.includes(menu);
  };

  // ✅ 권한별 메뉴 표시 여부 (사이드바 노출 제어)
  const isAdmin = userRole === "ROLE_ADMIN" || userRole === "ADMIN";
  const canSeeUserMenu = isAdmin; 
  const canSeeAppMenu = isAdmin;

  const handleMenuClick = (menu) => {
    if (!hasAccess(menu)) {
      alert("⚠️ 해당 메뉴에 대한 접근 권한이 없습니다.");
      return;
    }
    setActiveMenu(menu);
    setSelectedNotice(null); 
  };

  const handleEditNotice = (notice) => {
    if (!hasAccess("announcement-write")) {
      alert("⚠️ 수정 권한이 없습니다.");
      return;
    }
    setSelectedNotice(notice);      
    setActiveMenu("announcement-write"); 
  };

  // ✅ 권한 표시 배지
  const getRoleBadge = () => {
    const badges = {
      "ROLE_ADMIN": { text: "관리자", color: "#e67700" },
      "ADMIN": { text: "관리자", color: "#e67700" },
      "ROLE_MODERATOR": { text: "운영자", color: "#4c6ef5" },
      "MODERATOR": { text: "운영자", color: "#4c6ef5" },
      "ROLE_USER": { text: "일반", color: "#868e96" }
    };
    
    const badge = badges[userRole] || badges["ROLE_USER"];
    
    return (
      <span style={{
          display: "inline-block",
          padding: "4px 12px",
          borderRadius: "12px",
          fontSize: "11px",
          fontWeight: "600",
          backgroundColor: badge.color,
          color: "white",
          marginLeft: "8px",
          verticalAlign: "middle"
        }}>
        {badge.text}
      </span>
    );
  };

  // ✅ 로딩 중 화면 처리
  if (loading) {
    return <div className="admin-loading">권한 확인 중...</div>;
  }

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="sidebar-logo">
          <h2>BSSM Admin</h2>
          <div style={{ fontSize: "12px", color: "#adb5bd", marginTop: "4px" }}>
            권한: {getRoleBadge()}
          </div>
        </div>
        <nav className="sidebar-nav">
          <button 
            className={activeMenu === "dashboard" ? "active" : ""} 
            onClick={() => handleMenuClick("dashboard")}
          >
            📊 대시보드
          </button>
          
          {/* 유저 관리 - 관리자만 노출 */}
          {canSeeUserMenu && (
            <div className={`menu-group ${isUserMenuOpen ? "open" : ""}`}>
              <button 
                className={`group-title ${activeMenu.includes("user") || activeMenu === "users" ? "active" : ""}`}
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              >
                👥 유저 관리 
                <span className="arrow">{isUserMenuOpen ? "▲" : "▼"}</span>
              </button>
              {isUserMenuOpen && (
                <div className="sub-menu-list">
                  <button 
                    className={activeMenu === "users" ? "active" : ""} 
                    onClick={() => handleMenuClick("users")}
                  >
                    └ 유저 목록
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
          )}

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
                <button 
                  className={activeMenu === "push-notis" ? "active" : ""} 
                  onClick={() => handleMenuClick("push-notis")}
                >
                  └ 알림 전송
                </button>
                <button 
                  className={activeMenu === "push-stats" ? "active" : ""} 
                  onClick={() => handleMenuClick("push-stats")}
                >
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

          {/* 📱 앱 관리 - 관리자만 노출 */}
          {canSeeAppMenu && (
            <div className={`menu-group ${isAppMenuOpen ? "open" : ""}`}>
              <button 
                className={`group-title ${activeMenu.includes("app") ? "active" : ""}`}
                onClick={() => setIsAppMenuOpen(!isAppMenuOpen)}
              >
                📱 앱 관리 
                <span className="arrow">{isAppMenuOpen ? "▲" : "▼"}</span>
              </button>
              {isAppMenuOpen && (
                <div className="sub-menu-list">
                  <button 
                    className={activeMenu === "app-upload" ? "active" : ""} 
                    onClick={() => handleMenuClick("app-upload")}
                  >
                    └ 설치 파일 업로드
                  </button>
                </div>
              )}
            </div>
          )}
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
              activeMenu === "app-upload" ? "앱 설치 파일 관리" :
              activeMenu === "announcement-write" ? (selectedNotice ? "공지사항 수정" : "공지사항 등록") : "공지사항 관리"
            }</h1>
            <p>BSSM 급식알리미 서비스 통합 관리 시스템</p>
          </header>

          <div className="admin-main-content">
            {/* 권한이 있는 경우에만 각 컴포넌트 렌더링 */}
            {hasAccess(activeMenu) ? (
              <>
                {activeMenu === "dashboard" && <AdminDashboard />}
                {activeMenu === "users" && <UserManagement />}
                {activeMenu === "user-search" && <UserSearch />}
                {activeMenu === "comments" && <AdminCommentManager />}
                {activeMenu === "push-notis" && <PushNotificationManager />}
                {activeMenu === "push-stats" && <NotificationStats />}
                {activeMenu === "app-upload" && <AppFileManager />}
                {activeMenu === "announcement-write" && (
                  <AnnouncementEditor 
                    editData={selectedNotice} 
                    onComplete={() => setActiveMenu("announcement-manage")} 
                  />
                )}
                {activeMenu === "announcement-manage" && (
                  <AnnouncementList onEdit={handleEditNotice} />
                )}
              </>
            ) : (
              /* 권한이 없는 메뉴에 접근 시 출력 (주로 URL 조작 등 대응) */
              <div style={{ textAlign: "center", padding: "100px 0" }}>
                <h2 style={{ color: "#fa5252" }}>🔒 접근 권한이 없습니다.</h2>
                <p>관리자에게 문의하시거나 권한을 확인해주세요.</p>
                <button 
                  onClick={() => setActiveMenu("dashboard")}
                  style={{ marginTop: "20px", padding: "10px 20px", cursor: "pointer" }}
                >
                  대시보드로 돌아가기
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}