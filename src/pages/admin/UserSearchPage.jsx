import { useEffect, useState } from "react";
import axios from "axios";
import "../../styles/admin-search.css";

export default function UserSearchPage() {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchType, setSearchType] = useState("username"); // 검색 타입 추가 (이름 기본)
  const [loading, setLoading] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL;
  const token = localStorage.getItem("accessToken");

  // 검색 로직
  const handleSearch = async () => {
    // 검색어가 없으면 전체 목록을 불러오거나 리턴
    setLoading(true);
    try {
      // 1. 주소 수정: /users/search -> /users
      // 2. 파라미터 수정: q -> type, keyword (백엔드와 일치)
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

  // 페이지 처음 로드 시 전체 사용자 목록을 보여주고 싶다면 추가
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
        <div style={{ display: 'flex', gap: '10px' }}>
          {/* 검색 타입 선택 추가 */}
          <select 
            value={searchType} 
            onChange={(e) => setSearchType(e.target.value)}
            className="filter-select"
            style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
          >
            <option value="username">이름</option>
            <option value="email">이메일</option>
          </select>

          <input 
            type="text" 
            className="admin-input-premium" 
            placeholder="검색어를 입력하세요..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            style={{ flex: 1 }}
          />
          <button className="btn-refresh" onClick={handleSearch} style={{ width: '100px' }}>
            검색
          </button>
        </div>
      </section>

      <div className="dashboard-middle-row" style={{ display: 'flex', gap: '20px' }}>
        {/* 검색 결과 리스트 */}
        <div className="admin-section admin-table-wrapper" style={{ flex: 2 }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>사용자</th>
                <th>상태</th>
                <th>작업</th>
              </tr>
            </thead>
            <tbody>
              {users.length > 0 ? users.map((u) => (
                <tr key={u.email} onClick={() => setSelectedUser(u)} style={{ cursor: 'pointer' }}>
                  <td className="table-user">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <img src={u.picture || "/default-profile.png"} style={{ width: '30px', height: '30px', borderRadius: '50%' }} alt="" />
                      <div style={{ textAlign: 'left' }}>
                        <div style={{ fontWeight: 'bold' }}>{u.userName}</div>
                        <div style={{ fontSize: '10px', color: '#888' }}>{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="table-status">
                    <span className={`badge ${u.banned ? 'danger' : 'success'}`}>
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
                  <td colSpan="3" style={{ padding: '50px', color: '#ccc', textAlign: 'center' }}>
                    {loading ? "검색 중..." : "검색 결과가 없습니다."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* 선택된 사용자 상세 정보 패널 */}
        {selectedUser && (
          <div className="admin-section user-detail-panel" style={{ flex: 1, padding: '20px', background: '#fff', borderRadius: '8px' }}>
            <div className="profile-card" style={{ textAlign: 'center' }}>
              <img src={selectedUser.picture || "/default-profile.png"} alt="profile" style={{ width: '80px', height: '80px', borderRadius: '50%', marginBottom: '10px' }} />
              <h4 style={{ margin: '10px 0 5px' }}>{selectedUser.userName}</h4>
              <p style={{ fontSize: '12px', color: '#666', marginBottom: '20px' }}>{selectedUser.email}</p>
            </div>
            
            <hr style={{ border: '0', borderTop: '1px solid #eee', margin: '20px 0' }} />

            <div className="info-group">
              <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '10px' }}>알레르기 정보</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                {selectedUser.allergies && selectedUser.allergies.length > 0 ? (
                  selectedUser.allergies.map(a => <span key={a} className="badge" style={{ background: '#f0f0f0', padding: '2px 8px', borderRadius: '4px', fontSize: '12px' }}>{a}</span>)
                ) : (
                  <span style={{ color: '#aaa', fontSize: '12px' }}>정보 없음</span>
                )}
              </div>
            </div>

            <button className="btn-push-submit" style={{ marginTop: '30px', width: '100%', padding: '12px', background: '#4e73df', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
              관리자 조치하기
            </button>
          </div>
        )}
      </div>
    </div>
  );
}