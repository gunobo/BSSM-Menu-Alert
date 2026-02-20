import { useEffect, useState } from "react";
import axios from "axios";
import "../../styles/admin-search.css";

export default function UserSearchPage() {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchType, setSearchType] = useState("username");
  const [loading, setLoading] = useState(false);
  
  // 관리자 ROLE 관리용 state
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState("");
  const [roleLoading, setRoleLoading] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL;
  const token = localStorage.getItem("accessToken");

  // 검색 로직
  const handleSearch = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/admin/users`, {
        params: { 
          type: searchType, 
          keyword: searchTerm 
        },
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(response.data);
    } catch (err) {
      console.error("검색 실패:", err);
      alert("사용자 정보를 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // 관리자 조치 버튼 클릭
  const handleAdminAction = () => {
    if (!selectedUser) return;
    
    // 현재 사용자의 role을 기본값으로 설정
    setSelectedRole(selectedUser.role || "ROLE_USER");
    setShowRoleModal(true);
  };

  // Role 변경 API 호출
  const handleRoleChange = async () => {
    if (!selectedUser || !selectedRole) {
      alert("역할을 선택해주세요.");
      return;
    }

    setRoleLoading(true);
    try {
      await axios.put(
        `${API_URL}/admin/users/${selectedUser.email}/role`,
        { role: selectedRole },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert(`${selectedUser.userName}님의 권한이 ${selectedRole.replace('ROLE_', '')}(으)로 변경되었습니다.`);
      
      // 변경된 정보 반영
      setSelectedUser({ ...selectedUser, role: selectedRole });
      setUsers(users.map(u => 
        u.email === selectedUser.email ? { ...u, role: selectedRole } : u
      ));
      
      setShowRoleModal(false);
    } catch (err) {
      console.error("권한 변경 실패:", err);
      alert(err.response?.data?.message || "권한 변경에 실패했습니다.");
    } finally {
      setRoleLoading(false);
    }
  };

  // 사용자 차단/해제
  const handleBanToggle = async () => {
    if (!selectedUser) return;
    
    const action = selectedUser.banned ? "해제" : "차단";
    if (!confirm(`${selectedUser.userName}님을 ${action}하시겠습니까?`)) return;

    try {
      await axios.put(
        `${API_URL}/admin/users/${selectedUser.email}/ban`,
        { banned: !selectedUser.banned },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert(`${selectedUser.userName}님이 ${action}되었습니다.`);
      
      // 변경된 정보 반영
      setSelectedUser({ ...selectedUser, banned: !selectedUser.banned });
      setUsers(users.map(u => 
        u.email === selectedUser.email ? { ...u, banned: !selectedUser.banned } : u
      ));
    } catch (err) {
      console.error("차단 처리 실패:", err);
      alert("차단 처리에 실패했습니다.");
    }
  };

  // 페이지 처음 로드 시 전체 사용자 목록
  useEffect(() => {
    handleSearch();
  }, []);

  return (
    <div className="admin-container">
      <header className="admin-header">
        <h3>사용자 통합 검색</h3>
        <p>이름 또는 이메일로 사용자를 빠르게 찾으세요.</p>
      </header>

      {/* 검색 섹션 */}
      <section className="admin-section">
        <div className="search-section">
          <select 
            value={searchType} 
            onChange={(e) => setSearchType(e.target.value)}
            className="search-type-select"
          >
            <option value="username">이름</option>
            <option value="email">이메일</option>
          </select>

          <input 
            type="text" 
            className="admin-input-premium search-input" 
            placeholder="검색어를 입력하세요..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          />
          <button className="btn-refresh search-button" onClick={handleSearch}>
            검색
          </button>
        </div>
      </section>

      <div className="dashboard-middle-row user-search-layout">
        {/* 검색 결과 리스트 */}
        <div className="admin-section admin-table-wrapper user-table-section">
          <table className="admin-table user-table">
            <thead>
              <tr>
                <th>사용자</th>
                <th>권한</th>
                <th>상태</th>
                <th>작업</th>
              </tr>
            </thead>
            <tbody>
              {users.length > 0 ? users.map((u) => (
                <tr key={u.email} onClick={() => setSelectedUser(u)}>
                  <td className="table-user">
                    <div className="user-cell">
                      <img src={u.picture || "/default-profile.png"} className="user-avatar" alt="" />
                      <div className="user-info">
                        <div className="user-name">{u.userName}</div>
                        <div className="user-email">{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="table-status">
                    <span className={`role-badge ${
                      u.role === 'ROLE_ADMIN' ? 'admin' : 
                      u.role === 'ROLE_MODERATOR' ? 'moderator' : 'user'
                    }`}>
                      {u.role?.replace('ROLE_', '') || 'USER'}
                    </span>
                  </td>
                  <td className="table-status">
                    <span className={`status-badge ${u.banned ? 'banned' : 'active'}`}>
                      {u.banned ? "차단" : "정상"}
                    </span>
                  </td>
                  <td className="table-btn">
                    <button className="btn-view-small">
                      상세보기
                    </button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="4" className="empty-result">
                    {loading ? "검색 중..." : "검색 결과가 없습니다."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* 선택된 사용자 상세 정보 패널 */}
        {selectedUser && (
          <div className="user-detail-panel">
            <div className="profile-card">
              <img src={selectedUser.picture || "/default-profile.png"} alt="profile" className="profile-avatar" />
              <h4 className="profile-name">{selectedUser.userName}</h4>
              <p className="profile-email">{selectedUser.email}</p>
              
              {/* 현재 권한 표시 */}
              <span className={`role-badge profile-role-badge ${
                selectedUser.role === 'ROLE_ADMIN' ? 'admin' : 
                selectedUser.role === 'ROLE_MODERATOR' ? 'moderator' : 'user'
              }`}>
                {selectedUser.role?.replace('ROLE_', '') || 'USER'}
              </span>
            </div>
            
            <hr className="divider" />

            <div className="info-group">
              <label className="info-label">알레르기 정보</label>
              <div className="info-content">
                {selectedUser.allergies && selectedUser.allergies.length > 0 ? (
                  selectedUser.allergies.map(a => <span key={a} className="allergy-tag">{a}</span>)
                ) : (
                  <span className="no-info">정보 없음</span>
                )}
              </div>
            </div>

            <hr className="divider" />

            {/* 관리자 조치 버튼들 */}
            <div className="action-buttons">
              <button 
                className="btn-change-role" 
                onClick={handleAdminAction}
              >
                권한 변경
              </button>
              
              <button 
                className={selectedUser.banned ? "btn-unban" : "btn-ban"}
                onClick={handleBanToggle}
              >
                {selectedUser.banned ? '차단 해제' : '사용자 차단'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Role 변경 모달 */}
      {showRoleModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 className="modal-title">권한 변경</h3>
            
            <div className="modal-user-info">
              <label className="modal-label">
                사용자: {selectedUser?.userName}
              </label>
              <label className="modal-current-role">
                현재 권한: {selectedUser?.role?.replace('ROLE_', '') || 'USER'}
              </label>
            </div>

            <div className="modal-user-info">
              <label className="modal-label">
                새로운 권한
              </label>
              <select 
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="modal-select"
              >
                <option value="ROLE_USER">일반 사용자 (USER)</option>
                <option value="ROLE_MODERATOR">운영자 (MODERATOR)</option>
                <option value="ROLE_ADMIN">관리자 (ADMIN)</option>
              </select>
            </div>

            <div className="modal-buttons">
              <button
                onClick={() => setShowRoleModal(false)}
                disabled={roleLoading}
                className="btn-modal-cancel"
              >
                취소
              </button>
              <button
                onClick={handleRoleChange}
                disabled={roleLoading}
                className="btn-modal-confirm"
              >
                {roleLoading ? '처리중...' : '변경하기'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}