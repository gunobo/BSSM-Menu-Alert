import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getUser, updateUserInfo, logout } from "../api/auth";
import "../styles/mypage.css";
import bssmLogo from "../assets/bssmlogo.png";
import Footer from "./footer";

export default function MyPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  
  // 상태 관리
  const [user, setUser] = useState(null);
  const [allergies, setAllergies] = useState([]);
  const [favoriteMenus, setFavoriteMenus] = useState("");

  const allergyOptions = [
    "난류", "우유", "메밀", "땅콩", "대두", "밀", "고등어", "게", "새우", 
    "돼지고기", "복숭아", "토마토", "아황산류", "호두", "닭고기", "쇠고기", "오징어", "조개류"
  ];

  useEffect(() => {
    async function loadData() {
      try {
        const userData = await getUser();
        if (userData) {
          setUser(userData);
          setAllergies(userData.allergies || []);
          setFavoriteMenus(userData.favoriteMenus?.join(", ") || "");
        } else {
          alert("로그인 세션이 만료되었습니다.");
          navigate("/login");
        }
      } catch (err) {
        console.error("데이터 로드 중 에러:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [navigate]);

  const handleAllergyChange = (allergy) => {
    setAllergies((prev) =>
      prev.includes(allergy) ? prev.filter((a) => a !== allergy) : [...prev, allergy]
    );
  };

  const handleSave = async () => {
    // 1. 선호 메뉴 가공 (배열 변환)
    const favoriteArray = favoriteMenus
      .split(",")
      .map((item) => item.trim())
      .filter((item) => item !== "");

    // 2. 서버 DTO 구조에 맞게 데이터 구성
    const data = {
      allergies: allergies,
      favoriteMenus: favoriteArray
    };

    console.log("🚀 서버 전송 데이터:", data);

    try {
      // 3. auth.js에서 수정된 API 호출 (PUT /api/user/update)
      await updateUserInfo(data);
      alert("성공적으로 저장되었습니다! ✅");
      navigate("/"); 
    } catch (err) {
      console.error("저장 실패 상세:", err);
      // 4. 403 에러 대응
      if (err.response?.status === 403) {
        alert("수정 권한이 없습니다 (403). 보안 설정 혹은 로그인을 확인해 주세요.");
      } else {
        alert("저장에 실패했습니다. 콘솔을 확인해주세요.");
      }
    }
  };

  if (loading) return <div className="container" style={{padding: "100px"}}>데이터를 불러오는 중입니다...</div>;

  return (
    <>
      <nav className="navbar">
        <div className="nav-logo" onClick={() => navigate("/")} style={{cursor:'pointer'}}>
          <img src={bssmLogo} alt="BSSM" />
          <h2>BSSM 급식알리미</h2>
        </div>
        <div className="nav-right">
          <button className="nav-btn" onClick={() => navigate("/")}>홈으로</button>
          <button className="nav-btn" style={{background: '#ff4d4f', color: 'white'}} onClick={logout}>로그아웃</button>
        </div>
      </nav>

      <div className="mypage-wrapper" style={{ paddingTop: "80px" }}>
        <main className="container">
          <div className="main-card">
            <h2 style={{ marginBottom: "20px" }}>마이페이지</h2>
            
            <div className="profile-section" style={{ background: "#f8f9fa", padding: "20px", borderRadius: "12px", marginBottom: "30px" }}>
              <p><strong>이름:</strong> {user?.name}</p>
              <p><strong>이메일:</strong> {user?.email}</p>
            </div>

            <hr style={{ margin: "20px 0", opacity: 0.1 }} />

            <section className="settings-section">
              <h3>알레르기 설정</h3>
              <p style={{ fontSize: "0.9rem", color: "#666", marginBottom: "15px" }}>
                체크된 성분이 포함된 급식은 빨간색으로 강조됩니다.
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))", gap: "10px" }}>
                {allergyOptions.map((item) => (
                  <label key={item} className="allergy-label" style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", padding: "5px" }}>
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

            <hr style={{ margin: "30px 0", opacity: 0.1 }} />

            <section className="settings-section">
              <h3>선호 메뉴 설정 (⭐)</h3>
              <p style={{ fontSize: "0.9rem", color: "#666", marginBottom: "10px" }}>
                쉼표(,)로 구분해서 입력해 주세요.
              </p>
              <input
                type="text"
                value={favoriteMenus}
                onChange={(e) => setFavoriteMenus(e.target.value)}
                placeholder="예: 돈까스, 고기, 치킨"
                style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #ddd", fontSize: "1rem" }}
              />
            </section>

            <button 
              onClick={handleSave} 
              className="save-btn" 
              style={{ width: "100%", marginTop: "40px", padding: "15px", fontSize: "1.1rem", background: "#007bff", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer" }}
            >
              설정 저장하기
            </button>
          </div>
        </main>
      </div>
      <Footer />
    </>
  );
}