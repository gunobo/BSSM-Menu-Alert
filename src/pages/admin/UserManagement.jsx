import { useEffect, useState } from "react";
import axios from "axios";

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // --- 모달 관련 상태 ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [banReason, setBanReason] = useState("");
  const [banDays, setBanDays] = useState(7); // 기본 7일

  // 사용자 목록 가져오기
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("accessToken");
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/admin/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(response.data);
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

  // 차단/해제 실행
  const handleBanSubmit = async () => {
    const isBanning = !selectedUser.isBanned;
    
    if (isBanning && !banReason.trim()) {
      alert("차단 사유를 입력해주세요.");
      return;
    }

    try {
      const token = localStorage.getItem("accessToken");
      await axios.patch(
        `${import.meta.env.VITE_API_URL}/admin/users/${selectedUser.email}/ban`,
        null,
        {
          params: { 
            status: isBanning, 
            reason: isBanning ? banReason : "",
            days: isBanning ? banDays : null 
          },
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      alert(isBanning ? `${banDays === 999 ? '영구' : banDays + '일'} 차단되었습니다.` : "차단 해제되었습니다.");
      
      fetchUsers();
      setIsModalOpen(false);
      setBanReason("");
      setSelectedUser(null);
    } catch (err) {
      console.error(err);
      alert("요청 처리 중 오류가 발생했습니다.");
    }
  };

  if (loading) return <div className="admin-loading">사용자 데이터를 불러오는 중...</div>;

  return (
    <div className="admin-container" style={{ display: 'flex', gap: '20px', padding: '20px', height: 'calc(100vh - 40px)' }}>
      
      {/* 1. 사용자 목록 섹션 (내부 스크롤 적용) */}
      <section className="admin-section" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
          <h3>사용자 목록 ({users.length}명)</h3>
          <button onClick={fetchUsers} className="btn-refresh">🔄 새로고침</button>
        </div>

        {/* ✅ 테이블 스크롤 영역 */}
        <div className="table-scroll-container" style={{ flex: 1, overflowY: 'auto', border: '1px solid #f0f0f0', borderRadius: '8px' }}>
          <table className="admin-table" style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0 }}>
            <thead style={{ position: 'sticky', top: 0, zIndex: 10, backgroundColor: '#fafafa', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
              <tr>
                <th style={{ padding: '12px' }}>계정(이메일)</th>
                <th style={{ padding: '12px' }}>상태</th>
                <th style={{ padding: '12px' }}>작업</th>
              </tr>
            </thead>
            <tbody>
              {users.length > 0 ? (
                users.map((u) => (
                  <tr key={u.email} className={selectedUser?.email === u.email ? "active" : ""}>
                    <td style={{ padding: '12px' }}>{u.email}</td>
                    <td style={{ padding: '12px' }}>
                      {u.isBanned ? (
                        <span className="badge danger">차단됨</span>
                      ) : (
                        <span className="badge success">정상</span>
                      )}
                    </td>
                    <td style={{ padding: '12px' }}>
                      <button className="action-process" onClick={() => setSelectedUser(u)}>
                        상세보기
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan="3" style={{ textAlign: 'center', padding: '50px', color: '#999' }}>사용자가 없습니다.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* 2. 상세 정보 섹션 (고정) */}
      <section className="admin-section" style={{ width: '400px', height: 'fit-content' }}>
        <h3>상세 정보</h3>
        {selectedUser ? (
          <div className="user-detail-panel">
            <div className="info-group">
              <label>이메일</label>
              <p>{selectedUser.email}</p>
            </div>
            <div className="info-group">
              <label>알레르기 정보</label>
              <p>{selectedUser.allergies?.join(", ") || "없음"}</p>
            </div>
            {selectedUser.isBanned && (
              <div className="info-group ban-info">
                <label>🚫 차단 사유</label>
                <p>{selectedUser.banReason}</p>
              </div>
            )}
            
            <button 
              className={selectedUser.isBanned ? "btn-resolve" : "btn-reject"}
              style={{ width: '100%', marginTop: '20px', padding: '12px', cursor: 'pointer', border: 'none', borderRadius: '8px' }}
              onClick={() => setIsModalOpen(true)}
            >
              {selectedUser.isBanned ? "차단 해제 설정" : "사용자 차단 설정"}
            </button>
          </div>
        ) : (
          <p className="empty-msg">목록에서 사용자를 선택해 주세요.</p>
        )}
      </section>

      {/* 3. 차단 설정 모달 */}
      {isModalOpen && (
        <div className="admin-modal-overlay">
          <div className="admin-modal">
            <h3 style={{ color: selectedUser.isBanned ? '#1cc88a' : '#e74a3b' }}>
              {selectedUser.isBanned ? "🔓 차단 해제" : "🚫 사용자 차단"}
            </h3>
            <div className="modal-info">
                <strong>대상:</strong> {selectedUser.email}
            </div>
            
            {!selectedUser.isBanned ? (
              <div style={{ marginTop: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '13px', fontWeight: 'bold' }}>차단 기간</label>
                <select 
                  className="admin-select"
                  value={banDays} 
                  onChange={(e) => setBanDays(Number(e.target.value))}
                >
                  <option value={1}>1일 (24시간)</option>
                  <option value={7}>7일 (1주일)</option>
                  <option value={30}>30일 (1개월)</option>
                  <option value={999}>영구 차단</option>
                </select>

                <label style={{ display: 'block', marginBottom: '5px', fontSize: '13px', fontWeight: 'bold' }}>차단 사유</label>
                <textarea 
                  className="admin-textarea"
                  placeholder="사용자에게 전송될 차단 사유를 입력하세요."
                  value={banReason}
                  onChange={(e) => setBanReason(e.target.value)}
                  style={{ height: '100px' }}
                />
              </div>
            ) : (
              <p style={{ padding: '20px 0', textAlign: 'center' }}>이 사용자의 차단을 해제하시겠습니까?</p>
            )}

            <div className="modal-actions">
              <button className="btn-close" onClick={() => setIsModalOpen(false)}>취소</button>
              <button 
                className={selectedUser.isBanned ? "btn-resolve" : "btn-reject"}
                onClick={handleBanSubmit}
              >
                {selectedUser.isBanned ? "해제 확정" : "차단 확정"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}