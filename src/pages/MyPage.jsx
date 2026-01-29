import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getUser, updateUserInfo, logout } from "../api/auth";
import "../styles/home.css"; // 공통 스타일 사용

export default function MyPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  
  // 1. 상태 정의 (엔티티 필드명과 일치시킴)
  const [allergies, setAllergies] = useState([]);
  const [favoriteMenus, setFavoriteMenus] = useState("");
  const [user, setUser] = useState(null);

  // 알레르기 목록 데이터
  const allergyOptions = [
    "난류", "우유", "메밀", "땅콩", "대두", "밀", "고등어", "게", "새우", 
    "돼지고기", "복숭아", "토마토", "아황산류", "호두", "닭고기", "쇠고기", "오징어", "조개류"
  ];

  useEffect(() => {
    async function loadData() {
      const userData = await getUser();
      if (userData) {
        setUser(userData);
        // 서버에서 받은 데이터 상태에 저장 (오타 주의: allergies)
        setAllergies(userData.allergies || []);
        setFavoriteMenus(userData.favoriteMenus?.join(", ") || "");
      }
      setLoading(false);
    }
    loadData();
  }, []);

  // 체크박스 변경 핸들러
  const handleAllergyChange = (allergy) => {
    setAllergies((prev) =>
      prev.includes(allergy)
        ? prev.filter((a) => a !== allergy)
        : [...prev, allergy]
    );
  };

  // 2. 저장 함수 (로그 추가 및 에러 해결)
  const handleSave = async () => {
    console.log("--- 저장 프로세스 시작 ---");
    
    // 선호 메뉴를 쉼표로 구분하여 배열로 변환
    const favoriteArray = favoriteMenus
      .split(",")
      .map((item) => item.trim())
      .filter((item) => item !== "");

    const data = {
      allergies: allergies, // ✅ ReferenceError 해결: 정의된 변수명 사용
      favoriteMenus: favoriteArray
    };

    console.log("서버로 보낼 데이터:", data);

    try {
      const res = await updateUserInfo(data);
      console.log("서버 응답:", res);
      alert("성공적으로 저장되었습니다! 메인 화면으로 이동합니다.");
      navigate("/"); // 저장 후 홈으로 이동
    } catch (err) {
      console.error("저장 실패 로그:", err);
      alert("저장에 실패했습니다. 콘솔을 확인해주세요.");
    }
  };

  if (loading) return <div className="container">로딩 중...</div>;

  return (
    <>
      <nav className="navbar">
        <div className="nav-logo" onClick={() => navigate("/")} style={{cursor:'pointer'}}>
          <h2>BSSM 급식 알리미</h2>
        </div>
        <div className="nav-buttons">
          <button className="nav-btn" onClick={() => navigate("/")}>홈으로</button>
          <button className="nav-btn" style={{background: '#ff4d4f'}} onClick={logout}>로그아웃</button>
        </div>
      </nav>

      <main className="container" style={{ marginTop: "100px" }}>
        <div className="main-card">
          <h2 style={{ marginBottom: "20px" }}>마이페이지</h2>
          
          <div className="profile-section" style={{ marginBottom: "30px" }}>
            <p><strong>이름:</strong> {user?.name}</p>
            <p><strong>이메일:</strong> {user?.email}</p>
          </div>

          <hr style={{ margin: "20px 0", opacity: 0.2 }} />

          {/* 알레르기 설정 섹션 */}
          <section className="settings-section">
            <h3>알레르기 설정</h3>
            <p style={{ fontSize: "14px", color: "#666", marginBottom: "15px" }}>
              해당하는 성분을 체크해 주세요. 급식 메뉴에서 강조 표시됩니다.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))", gap: "10px" }}>
              {allergyOptions.map((item) => (
                <label key={item} style={{ display: "flex", alignItems: "center", gap: "5px", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={allergies.includes(item)}
                    onChange={() => handleAllergyChange(item)}
                  />
                  {item}
                </label>
              ))}
            </div>
          </section>

          <hr style={{ margin: "30px 0", opacity: 0.2 }} />

          {/* 선호 메뉴 설정 섹션 */}
          <section className="settings-section">
            <h3>선호 메뉴 설정</h3>
            <p style={{ fontSize: "14px", color: "#666", marginBottom: "10px" }}>
              좋아하는 메뉴를 쉼표(,)로 구분해서 적어주세요. (예: 돈까스, 마라탕)
            </p>
            <input
              type="text"
              value={favoriteMenus}
              onChange={(e) => setFavoriteMenus(e.target.value)}
              placeholder="메뉴를 입력하세요"
              style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #ddd" }}
            />
          </section>

          <button 
            onClick={handleSave} 
            className="nav-btn" 
            style={{ width: "100%", marginTop: "40px", padding: "15px", fontSize: "16px" }}
          >
            설정 저장하기
          </button>
        </div>
      </main>
    </>
  );
}