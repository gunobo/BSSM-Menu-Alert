import { useEffect, useState } from "react";
import axios from "axios";
import "../../styles/admin.css";

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // --- 모달 관련 상태 ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [banReason, setBanReason] = useState("");
  const [banMins, setBanMins] = useState(10);

  const API_URL = import.meta.env.VITE_API_URL;
  const token = localStorage.getItem("accessToken");

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/admin/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(response.data);
      
      if (selectedUser) {
        const updated = response.data.find(u => u.email === selectedUser.email);
        if (updated) setSelectedUser(updated);
      }
    } catch (err) {
      console.error("사용자 목록 로딩 실패:", err);
      alert("목록을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleBanSubmit = async () => {
    const isBanning = !selectedUser.banned; 
    if (isBanning && !banReason.trim()) return alert("차단 사유를 입력해주세요.");

    try {
      await axios.patch(
        `${API_URL}/admin/users/${selectedUser.email}/ban`,
        null,
        {
          params: { 
            status: isBanning, 
            reason: isBanning ? banReason : "",
            min: isBanning ? banMins : null 
          },
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      alert(isBanning ? `${banMins === 999999 ? '영구' : banMins + '분'} 차단되었습니다.` : "차단 해제되었습니다.");
      await fetchUsers();
      setIsModalOpen(false);
      setBanReason("");
    } catch (err) {
      alert("요청 처리 중 오류가 발생했습니다.");
    }
  };

  const getUserDisplayName = (user) => {
    if (!user) return "";
    if (user.userName && user.userName.trim() !== "") return user.userName;
    if (user.email) return user.email.split("@")[0];
    return "이름없음";
  };

  if (loading) return <div className="admin-loading">데이터 로딩 중...</div>;

  return (
    <div className="admin-container" style={{ display: 'flex', gap: '24px' }}>
      
      {/* 1. 사용자 목록 섹션 */}
      <section className="admin-section" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3>사용자 관리 ({users.length}명)</h3>
          <button onClick={fetchUsers} className="btn-refresh">🔄 새로고침</button>
        </div>

        <div className="table-scroll-container" style={{ flex: 1 }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>사용자 정보</th>
                <th style={{ textAlign: 'center' }}>알레르기</th>
                <th style={{ textAlign: 'center' }}>선호 메뉴</th>
                <th style={{ textAlign: 'center' }}>상태</th>
                <th style={{ textAlign: 'center' }}>작업</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr 
                  key={u.email} 
                  className={selectedUser?.email === u.email ? "active" : ""}
                  onClick={() => setSelectedUser(u)}
                >
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      {u.picture ? (
                        <img src={u.picture} referrerPolicy="no-referrer" alt="profile" style={{ width: '38px', height: '38px', borderRadius: '50%' }} />
                      ) : (
                        <div style={{ width: '38px', height: '38px', borderRadius: '50%', backgroundColor: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: '#aaa' }}>No Img</div>
                      )}
                      <div>
                        <div style={{ fontWeight: '700' }}>{getUserDisplayName(u)}</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <button className="btn-view-small">🔍 {u.allergies?.length || 0}개</button>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <button className="btn-view-small">⭐ {u.favoriteMenus?.length || 0}개</button>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <span className={`badge ${u.banned ? 'danger' : 'success'}`}>
                      {u.banned ? "차단" : "정상"}
                    </span>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <button className="action-process" onClick={(e) => { e.stopPropagation(); setSelectedUser(u); }}>관리</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* 2. 우측 상세 정보 패널 */}
      <section className="admin-section" style={{ width: '400px', display: 'flex', flexDirection: 'column' }}>
        <h3>상세 정보</h3>
        {selectedUser ? (
          <div className="user-detail-panel" style={{ flex: 1, overflowY: 'auto' }}>
            <div className="profile-card">
              {selectedUser.picture ? (
                <img src={selectedUser.picture} referrerPolicy="no-referrer" alt="profile" className="profile-img-large" />
              ) : (
                <div style={{ width: '100px', height: '100px', borderRadius: '50%', backgroundColor: '#eee', marginBottom: '15px' }} />
              )}
              <h4 style={{ margin: '5px 0', fontSize: '18px' }}>{getUserDisplayName(selectedUser)}</h4>
              <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>{selectedUser.email}</span>
            </div>

            <div className="info-group">
              <label>🚫 알레르기 정보</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' }}>
                {selectedUser.allergies?.length > 0 ? (
                  selectedUser.allergies.map(a => <span key={a} className="tag-item">{a}</span>)
                ) : <p style={{ color: '#bbb', fontSize: '14px' }}>설정 없음</p>}
              </div>
            </div>

            <div className="info-group">
              <label>💖 선호 메뉴</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' }}>
                {selectedUser.favoriteMenus?.length > 0 ? (
                  selectedUser.favoriteMenus.map(m => <span key={m} className="tag-item-fav">{m}</span>)
                ) : <p style={{ color: '#bbb', fontSize: '14px' }}>등록 없음</p>}
              </div>
            </div>

            {selectedUser.banned && (
              <div className="info-group ban-info">
                <label style={{ color: 'var(--danger-red)' }}>🚫 차단 상세 내역</label>
                <p style={{ marginTop: '8px', fontSize: '14px' }}><strong>사유:</strong> {selectedUser.banReason}</p>
                <p style={{ fontSize: '14px' }}><strong>만료:</strong> {selectedUser.banExpiresAt ? new Date(selectedUser.banExpiresAt).toLocaleString() : '영구'}</p>
              </div>
            )}
            
            <div style={{ marginTop: 'auto', paddingTop: '20px' }}>
              <button 
                className={selectedUser.banned ? "btn-resolve" : "btn-reject"}
                style={{ width: '100%' }}
                onClick={() => setIsModalOpen(true)}
              >
                {selectedUser.banned ? "🔓 차단 해제 설정" : "🚫 사용자 차단 설정"}
              </button>
            </div>
          </div>
        ) : (
          <div className="empty-msg">
            <p>사용자를 선택해주세요.</p>
          </div>
        )}
      </section>

      {/* 3. 차단 설정 모달 */}
      {isModalOpen && (
        <div className="admin-modal-overlay">
          <div className="admin-modal">
            <h3 style={{ color: selectedUser.banned ? 'var(--success-green)' : 'var(--danger-red)', border: 'none' }}>
              {selectedUser.banned ? "🔓 차단 해제" : "🚫 사용자 차단"}
            </h3>
            
            <div className="modal-info">
                <strong>대상:</strong> {getUserDisplayName(selectedUser)}
            </div>
            
            {!selectedUser.banned ? (
              <div className="admin-form">
                <label style={{ fontSize: '14px', fontWeight: '700' }}>차단 기간</label>
                <select className="admin-select" value={banMins} onChange={(e) => setBanMins(Number(e.target.value))}>
                    <option value={10}>10분</option>
                    <option value={30}>30분</option>
                    <option value={60}>1시간</option>
                    <option value={1440}>1일</option>
                    <option value={10080}>7일</option>
                    <option value={999999}>영구 차단</option>
                </select>
                
                <label style={{ fontSize: '14px', fontWeight: '700' }}>차단 사유</label>
                <textarea 
                  className="admin-textarea" 
                  placeholder="사유를 입력하세요." 
                  value={banReason} 
                  onChange={(e) => setBanReason(e.target.value)} 
                />
              </div>
            ) : (
              <p style={{ textAlign: 'center', padding: '20px 0' }}>차단을 해제하시겠습니까?</p>
            )}

            <div className="modal-actions">
              {/* ✅ 취소 버튼: 스타일 충돌 방지를 위해 인라인으로 색상을 명시적으로 고정 */}
              <button 
                className="btn-close" 
                onClick={() => setIsModalOpen(false)}
                style={{ color: '#636e72', backgroundColor: '#f1f2f6' }} 
              >
                취소
              </button>
              <button className={selectedUser.banned ? "btn-resolve" : "btn-reject"} onClick={handleBanSubmit}>
                {selectedUser.banned ? "해제 확정" : "차단 확정"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}