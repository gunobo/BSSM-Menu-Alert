import React, { useState, useEffect } from "react";
import axios from "axios";
import "../../styles/PushNotificationManager.css";

export default function PushNotificationManager() {
  const [pushData, setPushData] = useState({
    title: "",
    body: "",
    targetDate: "",
    scheduledTime: "",
    targetType: "ALL", 
    targetEmails: [], 
    // ✅ 추가: 발송 대상 기기 설정 (ALL, MOBILE, WEB)
    deviceTarget: "ALL", 
  });

  const [users, setUsers] = useState([]); 
  const [adminInfo, setAdminInfo] = useState({ email: "", name: "" });
  const [searchTerm, setSearchTerm] = useState("");
  const [searchType, setSearchType] = useState("username");
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);

  const API_BASE_URL = import.meta.env.VITE_API_URL;

  const getAuthHeader = () => {
    const savedToken = sessionStorage.getItem("accessToken"); 
    if (!savedToken) return null;
    return { Authorization: `Bearer ${savedToken}` };
  };

  const decodeAdminToken = () => {
    const token = sessionStorage.getItem("accessToken");
    if (!token) return;
    try {
      const base64Url = token.split('.')[1];
      if (!base64Url) return;
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64).split('').map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')
      );
      const payload = JSON.parse(jsonPayload);
      setAdminInfo({
        email: payload.sub || payload.email || "알 수 없음",
        name: payload.name || "관리자"
      });
    } catch (e) {
      console.error("관리자 정보 파싱 실패:", e);
      setAdminInfo({ email: "error", name: "인증 오류" });
    }
  };

  const handleUserSearch = async () => {
    const headers = getAuthHeader();
    if (!headers) return;
    setSearchLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/admin/users`, {
        params: { type: searchType, keyword: searchTerm },
        headers: headers
      });
      const userData = Array.isArray(response.data) ? response.data : (response.data?.data || []);
      setUsers(userData);
    } catch (err) {
      console.error("유저 로드 실패:", err);
      setUsers([]); 
    } finally {
      setSearchLoading(false);
    }
  };

  useEffect(() => { 
    decodeAdminToken(); 
    handleUserSearch(); 
  }, []);

  const toggleUserSelection = (email) => {
    setPushData((prev) => {
      const isSelected = prev.targetEmails.includes(email);
      const newEmails = isSelected
        ? prev.targetEmails.filter((e) => e !== email)
        : [...prev.targetEmails, email];
      return { ...prev, targetEmails: newEmails };
    });
  };

  const handleSendPush = async () => {
    const headers = getAuthHeader();
    if (!headers) return alert("로그인 세션이 만료되었습니다.");
    if (!pushData.title || !pushData.body) return alert("제목과 내용을 입력해주세요.");
    
    if (pushData.targetType === "SPECIFIC" && pushData.targetEmails.length === 0) {
      return alert("알림을 받을 유저를 최소 한 명 선택해주세요.");
    }

    const deviceText = pushData.deviceTarget === "ALL" ? "모든 기기" : pushData.deviceTarget === "MOBILE" ? "모바일 앱" : "PC 웹";
    const confirmMsg = `[${deviceText}] 대상으로 발송하시겠습니까?`;

    if (!window.confirm(confirmMsg)) return;

    setLoading(true);
    try {
      // ✅ 서버로 pushData 전송 (이제 deviceTarget 포함됨)
      await axios.post(`${API_BASE_URL}/admin/notification/send`, pushData, {
        headers: headers
      });
      alert(`🚀 성공적으로 전송되었습니다!`);
      setPushData({ ...pushData, title: "", body: "", targetEmails: [], targetDate: "", scheduledTime: "" });
    } catch (error) {
      console.error("전송 에러:", error);
      alert("전송 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="push-manager-container">
      <div className="push-card-premium">
        <div className="admin-status-bar">
          <span className="admin-badge">ADMIN</span>
          <span className="admin-email"><strong>{adminInfo.name}</strong> ({adminInfo.email}) 님</span>
        </div>

        <h3 className="push-title">🔔 푸시 알림 통합 발송</h3>
        
        {/* --- 수신 대상 (전체/특정) --- */}
        <div className="push-section">
          <label className="push-label">수신 대상 범위</label>
          <div className="push-toggle-group">
            <button 
              type="button"
              className={pushData.targetType === "ALL" ? "active" : ""} 
              onClick={() => setPushData({...pushData, targetType: "ALL", targetEmails: []})}
            >전체 사용자</button>
            <button 
              type="button"
              className={pushData.targetType === "SPECIFIC" ? "active" : ""} 
              onClick={() => setPushData({...pushData, targetType: "SPECIFIC"})}
            >특정 사용자</button>
          </div>
        </div>

        {/* ✅ 신규: 발송 기기 선택 섹션 */}
        <div className="push-section">
          <label className="push-label">발송 기기 선택</label>
          <div className="push-toggle-group device-selector">
            <button 
              type="button"
              className={pushData.deviceTarget === "ALL" ? "active device-all" : ""} 
              onClick={() => setPushData({...pushData, deviceTarget: "ALL"})}
            >전체 기기</button>
            <button 
              type="button"
              className={pushData.deviceTarget === "MOBILE" ? "active device-mobile" : ""} 
              onClick={() => setPushData({...pushData, deviceTarget: "MOBILE"})}
            >📱 모바일</button>
            <button 
              type="button"
              className={pushData.deviceTarget === "WEB" ? "active device-web" : ""} 
              onClick={() => setPushData({...pushData, deviceTarget: "WEB"})}
            >💻 PC 웹</button>
          </div>
        </div>

        {pushData.targetType === "SPECIFIC" && (
          <div className="push-user-selector animate-fade">
            <div className="push-search-box">
              <select value={searchType} onChange={(e) => setSearchType(e.target.value)} className="push-filter-select">
                <option value="username">이름</option>
                <option value="email">이메일</option>
              </select>
              <input 
                type="text" 
                className="push-input-field" 
                placeholder="유저 검색..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleUserSearch()}
              />
              <button type="button" className="push-btn-search" onClick={handleUserSearch}>검색</button>
            </div>

            <div className="push-user-list">
              {searchLoading ? (
                <p className="push-info-text">검색 중...</p>
              ) : users.length > 0 ? (
                users.map((u) => (
                  <div 
                    key={u.email} 
                    className={`push-user-item ${pushData.targetEmails.includes(u.email) ? "selected" : ""}`}
                    onClick={() => toggleUserSelection(u.email)}
                  >
                    <div className="u-info">
                      <div className="u-checkbox">{pushData.targetEmails.includes(u.email) ? "✅" : "⬜"}</div>
                      <div className="u-text">
                        <div className="u-name">{u.name || u.userName || "이름 없음"}</div>
                        <div className="u-email">{u.email}</div>
                      </div>
                    </div>
                  </div>
                ))
              ) : <p className="push-info-text">유저가 없습니다.</p>}
            </div>
          </div>
        )}

        <hr className="push-divider" />

        {/* --- 제목 및 내용 --- */}
        <div className="push-field-group">
          <label className="push-label">알림 제목</label>
          <input 
            type="text" 
            className="push-input-field"
            value={pushData.title} 
            onChange={(e) => setPushData({...pushData, title: e.target.value})} 
            placeholder="알림 제목을 입력하세요"
          />
        </div>

        <div className="push-field-group">
          <label className="push-label">알림 내용</label>
          <textarea 
            className="push-input-field"
            rows={3} 
            value={pushData.body} 
            onChange={(e) => setPushData({...pushData, body: e.target.value})}
            placeholder="알림 내용을 상세히 입력하세요"
          ></textarea>
        </div>

        {/* --- 시간 및 날짜 --- */}
        <div className="push-grid-row">
          <div className="push-field-group">
            <label className="push-label">식단 날짜</label>
            <input 
              type="date" 
              className="push-input-field"
              value={pushData.targetDate} 
              onChange={(e) => setPushData({...pushData, targetDate: e.target.value})} 
            />
          </div>
          <div className="push-field-group">
            <label className="push-label">예약 발송 시간</label>
            <input 
              type="datetime-local" 
              className="push-input-field"
              value={pushData.scheduledTime} 
              onChange={(e) => setPushData({...pushData, scheduledTime: e.target.value})} 
            />
          </div>
        </div>

        <button className="push-submit-btn" onClick={handleSendPush} disabled={loading}>
          {loading ? "전송 중..." : "🚀 알림 발송하기"}
        </button>
      </div>
    </div>
  );
}