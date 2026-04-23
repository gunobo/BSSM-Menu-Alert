import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getUser, updateUserInfo, logout, saveFcmToken } from "../api/auth";
import "../styles/mypage.css";
import bssmLogo from "../assets/bssmlogo.png";
import Footer from "./footer";

export default function MyPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  
  const [user, setUser] = useState(null);
  const [allergies, setAllergies] = useState([]);
  const [favoriteMenus, setFavoriteMenus] = useState("");

  const [allowNotifications, setAllowNotifications] = useState(false);
  const [allowAllergyNotifications, setAllowAllergyNotifications] = useState(false);
  const [allowFavoriteNotifications, setAllowFavoriteNotifications] = useState(false);

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
          
          setAllowNotifications(
            userData.allowNotifications ?? userData.allow_notifications ?? false
          );
          setAllowAllergyNotifications(
            userData.allowAllergyNotifications ?? userData.allow_allergy_notifications ?? false
          );
          setAllowFavoriteNotifications(
            userData.allowFavoriteNotifications ?? userData.allow_favorite_notifications ?? false
          );
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

  const requestNotificationPermission = async () => {
    // 1. 앱 환경이면 즉시 통과
    if (window.Android) return true;

    // 2. 브라우저 환경에서 Notification 존재 여부 체크
    if (typeof window === "undefined" || !("Notification" in window)) {
      console.warn("이 브라우저는 알림 기능을 지원하지 않습니다.");
      return false;
    }

    try {
      if (window.Notification.permission !== "granted") {
        const permission = await window.Notification.requestPermission();
        return permission === "granted";
      }
      return true;
    } catch (e) {
      console.error("권한 요청 에러:", e);
      return false;
    }
  };

  const handleToggle = async (type, isChecked) => {
    if (isChecked) {
      const hasPermission = await requestNotificationPermission();
      if (!hasPermission && !window.Android) { 
        alert("알림 권한이 필요합니다. 설정에서 알림을 허용해주세요.");
        return;
      }
    }
    if (type === "meal") setAllowNotifications(isChecked);
    if (type === "allergy") setAllowAllergyNotifications(isChecked);
    if (type === "favorite") setAllowFavoriteNotifications(isChecked);
  };

  const handleAllergyChange = (allergy) => {
    setAllergies((prev) =>
      prev.includes(allergy) ? prev.filter((a) => a !== allergy) : [...prev, allergy]
    );
  };

  const handleSave = async () => {
    const favoriteArray = favoriteMenus
      .split(",")
      .map((item) => item.trim())
      .filter((item) => item !== "");

    const data = {
      allergies: allergies,
      favoriteMenus: favoriteArray,
      allow_notifications: allowNotifications,
      allow_allergy_notifications: allowAllergyNotifications,
      allow_favorite_notifications: allowFavoriteNotifications,
      students_class: user?.students_class,
      students_class_num: user?.students_class_num
    }

    let isSuccess = false;

    try {
      await updateUserInfo(data);
      isSuccess = true;

      // ✅ 안드로이드 앱인 경우
      if (window.Android && typeof window.Android.requestFcmToken === "function") {
        console.log("🔔 안드로이드에 FCM 토큰 요청");
        window.Android.requestFcmToken();
        
        // ✅ 토큰이 도착할 때까지 대기 (App.jsx의 onReceiveFcmToken이 처리함)
        await new Promise((resolve) => {
          let attempts = 0;
          const checkToken = setInterval(() => {
            attempts++;
            const token = localStorage.getItem("fcmToken");
            
            if (token) {
              clearInterval(checkToken);
              console.log("💾 localStorage에서 토큰 확인:", token.substring(0, 30) + "...");
              console.log("✅ 토큰이 App.jsx에서 자동으로 서버에 저장됩니다");
              resolve();
            } else if (attempts >= 10) {
              clearInterval(checkToken);
              console.warn("⚠️ 토큰을 찾을 수 없음 (10초 대기)");
              resolve();
            } else {
              console.log(`⏳ 토큰 대기 중... ${attempts}/10초`);
            }
          }, 1000);
        });
      } 
      // PC 브라우저 환경
      else if (typeof window !== "undefined" && "Notification" in window && window.Notification.permission === "granted") {
        const shouldNotify = allowNotifications || allowAllergyNotifications || allowFavoriteNotifications;
        if (shouldNotify) {
          new window.Notification("BSSM 급식알리미", {
            body: "설정이 저장되었습니다! 🍱",
            icon: bssmLogo
          });
        }
      }

    } catch (err) {
      console.error("저장 에러:", err);
      alert("저장에 실패했습니다. ❌");
      return;
    }

    if (isSuccess) {
      setTimeout(() => {
        alert("성공적으로 저장되었습니다! ✅");
        if (window.Android) {
          window.location.href = "/";
        } else {
          window.location.href = "/";
        }
      }, 100);
    }
  };

  const handleLogout = async () => {
    if (!window.confirm("로그아웃 하시겠습니까?")) return;

    if (window.Android) {
      Android.logout();
    }
    
    const fcmToken = localStorage.getItem("fcmToken");
    
    // 비동기로 서버에 알리지만, 실패해도 무시
    logout(fcmToken).catch(err => {
      console.error("서버 로그아웃 실패 (무시):", err);
    });
    
    // 토큰 즉시 정리 (sessionStorage + localStorage 모두)
    sessionStorage.removeItem("accessToken");
    localStorage.removeItem("accessToken");
    localStorage.removeItem("fcmToken");
    window.dispatchEvent(new Event("authChange"));
    
    // 즉시 리다이렉트
    alert("로그아웃 되었습니다.");
    
    if (window.Android) {
      window.location.href = "/";
    } else {
      navigate("/");
    }
  };

  const handleDeleteAccount = () => {
    if (window.confirm("정말로 탈퇴하시겠습니까? 모든 데이터가 삭제됩니다.")) {
      navigate("/delete-account");
    }
  }

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
          <button className="nav-btn" style={{background: '#ff4d4f', color: 'white'}} onClick={handleLogout}>
            로그아웃
          </button>
        </div>
      </nav>

      <div className="mypage-wrapper">
        <main className="main-card">
          <h2>마이페이지</h2>
          <div className="profile-section">
            <p><strong>이름:</strong> {user?.name}</p>
            <p><strong>이메일:</strong> {user?.email}</p>
          </div>
          <div className="profile-under-btns">
            <button className="nav-btn" onClick={() => navigate("/privacy")}>
              개인정보처리방침 보기
            </button>
            <button className="nav-btn" onClick={() => navigate("/my-report")}>
              건의 관리하기
            </button>
          </div>
          

          <hr style={{ margin: "20px 0", opacity: 0.1 }} />

          <section className="settings-section">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3>기본 급식 알림 (Push)</h3>
                <p style={{ fontSize: "0.85rem", color: allowNotifications ? "#2ecc71" : "#666", marginTop: "4px" }}>
                  {allowNotifications ? "✨ 매일 정해진 시간에 급식 메뉴를 알려드려요." : "알림을 켜면 메뉴 정보를 보내드려요."}
                </p>
              </div>
              <label className="switch">
                <input type="checkbox" checked={allowNotifications} onChange={(e) => handleToggle("meal", e.target.checked)} />
                <span className="slider round"></span>
              </label>
            </div>
          </section>

          <section className="settings-section">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3>알레르기 주의 알림</h3>
                <p style={{ fontSize: "0.85rem", color: allowAllergyNotifications ? "#e67e22" : "#666", marginTop: "4px" }}>
                  {allowAllergyNotifications ? "⚠️ 설정한 알레르기 메뉴 포함 시 알려드려요." : "내 알레르기가 포함된 식단을 체크해드려요."}
                </p>
              </div>
              <label className="switch">
                <input type="checkbox" checked={allowAllergyNotifications} onChange={(e) => handleToggle("allergy", e.target.checked)} />
                <span className="slider round"></span>
              </label>
            </div>
          </section>

          <section className="settings-section">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3>선호 메뉴 등장 알림</h3>
                <p style={{ fontSize: "0.85rem", color: allowFavoriteNotifications ? "#f1c40f" : "#666", marginTop: "4px" }}>
                  {allowFavoriteNotifications ? "⭐ 좋아하는 메뉴가 나오는 날 알려드려요!" : "선호 메뉴가 나오는 날에 맞춰 알려드려요."}
                </p>
              </div>
              <label className="switch">
                <input type="checkbox" checked={allowFavoriteNotifications} onChange={(e) => handleToggle("favorite", e.target.checked)} />
                <span className="slider round"></span>
              </label>
            </div>
          </section>

          <hr style={{ margin: "25px 0", opacity: 0.1 }} />

          <section className="settings-section">
            <h3>알레르기 설정</h3>
            <div className="allergy-option">
              {allergyOptions.map((item) => (
                <label key={item} className="allergy-label">
                  <input type="checkbox" checked={allergies.includes(item)} onChange={() => handleAllergyChange(item)} />
                  {item}
                </label>
              ))}
            </div>
          </section>

          <hr style={{ margin: "30px 0", opacity: 0.1 }} />

          <section className="settings-section">
            <h3>선호 메뉴 설정 (⭐)</h3>
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
          <button className="danger-btn" onClick={handleDeleteAccount}>
            회원 탈퇴
          </button>
        </main>
      </div>
      <Footer />
    </>
  );
}