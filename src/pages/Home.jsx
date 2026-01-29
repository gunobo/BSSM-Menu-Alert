import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import "../styles/home.css";
import bssmLogo from "../assets/bssmlogo.png";
import { getMonthMeals, extractAllergyFromDish } from "../api/NeisApi";
import { getUser, logout, isLoggedIn } from "../api/auth";

export default function Home() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [meals, setMeals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [flipped, setFlipped] = useState([]);

  useEffect(() => {
    async function loadUser() {
      if (!isLoggedIn()) return;
      const userData = await getUser();
      if (userData) {
        console.log("DB 원본 데이터:", userData.allergies);
        setUser(userData);
      }
    }
    loadUser();
  }, []);

  const userAllergy = user?.allergies || [];

  // 🔴 핵심 수정: normalize("NFC")를 사용하여 한글 유니코드 강제 일치
  const hasMyAllergy = (mealAllergyList) => {
    if (!userAllergy || userAllergy.length === 0) return false;

    // 1. 내 알레르기 리스트 정제 (정규화 + 공백제거)
    const cleanUserList = userAllergy.map(a => 
      String(a).normalize("NFC").trim().replace(/\s+/g, "")
    );

    // 2. 급식 알레르기 리스트와 비교
    return mealAllergyList.some(m => {
      const cleanMealAllergy = String(m).normalize("NFC").trim().replace(/\s+/g, "");
      
      // 로그로 데이터 타입과 내용 상세 확인
      console.log(`비교 중: [${cleanMealAllergy}] vs [${cleanUserList}]`);
      
      const isMatch = cleanUserList.includes(cleanMealAllergy);
      if (isMatch) console.log("🎯🎯🎯 일치 발견!!! 🎯🎯🎯");
      return isMatch;
    });
  };

  const handleCardClick = (idx) => {
    setFlipped((prev) =>
      prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
    );
  };

  useEffect(() => {
    fetchMonthMeals(date);
    setFlipped([]);
  }, [date]);

  async function fetchMonthMeals(selectedDate) {
    const [year, month] = selectedDate.split("-").map(Number);
    setLoading(true);
    try {
      const monthData = await getMonthMeals(year, month);
      setMeals(monthData[selectedDate] || []);
    } catch (err) {
      console.error("급식 데이터 로드 실패:", err);
    }
    setLoading(false);
  }

  return (
    <>
      <nav className="navbar">
        <div className="nav-logo" onClick={() => navigate("/")} style={{cursor:'pointer'}}>
          <img src={bssmLogo} alt="BSSM" />
          <h2>BSSM 급식 알리미</h2>
        </div>
        <div className="nav-buttons">
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="date-input" />
          {!user ? (
            <button className="nav-btn" onClick={() => navigate("/login")}>로그인</button>
          ) : (
            <>
              <button className="nav-btn" onClick={() => navigate("/mypage")}>마이페이지</button>
              <button className="nav-btn" onClick={() => { logout(); setUser(null); navigate("/"); }}>로그아웃</button>
            </>
          )}
        </div>
      </nav>

      <section className="hero">
        <div className="container">
          <h1>오늘의 급식</h1>
          <div className="selected-date-box"><p className="selected-date">{date}</p></div>
        </div>
      </section>

      <main className="container">
        <div className="main-card">
          {loading && <p className="no-meal">로딩 중...</p>}
          {!loading && meals.length === 0 && <p className="no-meal">해당 날짜에 급식 정보가 없습니다.</p>}
          <div className="meal-grid">
            {meals.map((meal, idx) => {
              const mealAllergyList = extractAllergyFromDish(meal.DDISH_NM);
              const danger = hasMyAllergy(mealAllergyList);
              const isFlipped = flipped.includes(idx);

              return (
                <div key={idx} className={`meal-card-wrapper ${isFlipped ? "flipped" : ""} ${danger ? "danger" : ""}`}
                  onClick={() => handleCardClick(idx)}
                >
                  <div className="card-inner">
                    <div className="card-front">
                      <h3>{meal.MMEAL_SC_NM}</h3>
                      <p className="meal-text">{meal.DDISH_NM.replace(/<br\/>/g, "\n")}</p>
                      {danger && <div className="danger-badge">⚠️ 알레르기 주의</div>}
                    </div>
                    <div className="card-back">
                      <h3>상세 알레르기</h3>
                      <div className="allergy-info-list">
                        {mealAllergyList.map((a, i) => (
                          <span key={i} className={`allergy-tag ${userAllergy.some(ua => ua.includes(a)) ? "my-allergy" : ""}`}
                            style={userAllergy.some(ua => ua.includes(a)) ? {backgroundColor: '#ff4d4f', color: 'white'} : {}}
                          >{a}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>
    </>
  );
}