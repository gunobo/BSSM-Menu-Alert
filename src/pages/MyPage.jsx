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
  const [allowNotifications, setAllowNotifications] = useState(false); // 알림 상태 추가

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
          setAllowNotifications(userData.allowNotifications || false); // 서버에서 알림 설정값 로드
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
    // 알림을 켰을 때 브라우저 권한 요청
    if (allowNotifications && Notification.permission !== "granted") {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        alert("알림 권한이 거부되었습니다. 메뉴 알림을 받으려면 브라우저 설정에서 알림을 허용해주세요.");
        return;
      }
    }

    const favoriteArray = favoriteMenus
      .split(",")
      .map((item) => item.trim())
      .filter((item) => item !== "");

    const data = {
      allergies: allergies,
      favoriteMenus: favoriteArray,
      allowNotifications: allowNotifications // 알림 설정값 추가
    };

    try {
      await updateUserInfo(data);
      alert("성공적으로 저장되었습니다! ✅");
      
      // 테스트용 알림 (저장 성공 시 한 번 띄워줌)
      if (allowNotifications) {
        new Notification("BSSM 급식알리미", {
          body: "이제 선호 메뉴가 나오는 날 아침에 알림을 보내드릴게요!",
          icon: bssmLogo
        });
      }
      navigate("/"); 
    } catch (err) {
      console.error("저장 실패:", err);
      alert("저장에 실패했습니다.");
    }
  };

  if (loading) return <div className="mypage-wrapper">데이터를 불러오는 중입니다...</div>;

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

      <div className="mypage-wrapper">
        <main className="main-card">
          <h2>마이페이지</h2>
          
          <div className="profile-section">
            <p><strong>이름:</strong> {user?.name}</p>
            <p><strong>이메일:</strong> {user?.email}</p>
          </div>

          <hr style={{ margin: "20px 0", opacity: 0.1 }} />

          {/* 추가된 알림 설정 섹션 */}
          <section className="settings-section">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3>선호 메뉴 알림 (Push)</h3>
                <p style={{ fontSize: "0.85rem", color: "#666", marginTop: "4px" }}>
                  선호 메뉴가 포함된 급식이 나오는 날 아침에 알림을 보냅니다.
                </p>
              </div>
              <label className="switch">
                <input 
                  type="checkbox" 
                  checked={allowNotifications} 
                  onChange={(e) => setAllowNotifications(e.target.checked)} 
                />
                <span className="slider round"></span>
              </label>
            </div>
          </section>

          <hr style={{ margin: "25px 0", opacity: 0.1 }} />

          <section className="settings-section">
            <h3>알레르기 설정</h3>
            <p style={{ fontSize: "0.9rem", color: "#666", marginBottom: "15px" }}>
              체크된 성분이 포함된 급식은 빨간색으로 강조됩니다.
            </p>
            <div className="allergy-option">
              {allergyOptions.map((item) => (
                <label key={item} className="allergy-label">
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
            <div className="favorite-input-wrapper">
              <input
                type="text"
                value={favoriteMenus}
                onChange={(e) => setFavoriteMenus(e.target.value)}
                placeholder="예: 돈까스, 고기, 치킨"
                className="favorite-input"
              />
            </div>
          </section>

          <button onClick={handleSave} className="save-btn">
            설정 저장하기
          </button>
        </main>
      </div>
      <Footer />
    </>
  );
}