import { useNavigate } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import "../styles/home.css";
import bssmLogo from "../assets/bssmlogo.png";
import { getMonthMeals, parseAllergy } from "../api/NeisApi.js";

export default function Home() {
  const navigate = useNavigate();
  const user = localStorage.getItem("user");

  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [meals, setMeals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [flipped, setFlipped] = useState([]);
  const [cardHeights, setCardHeights] = useState([]);
  const monthCache = useRef({});
  const skeletonCount = 6;

  const toggleFlip = (idx) => {
    const newFlipped = [...flipped];
    newFlipped[idx] = !newFlipped[idx];
    setFlipped(newFlipped);
  };

  // 카드 높이 계산
  const cardRefs = useRef([]);

  useEffect(() => {
    if (!meals.length) return;
    const heights = cardRefs.current.map(ref => ref?.scrollHeight || 180);
    setCardHeights(heights);
  }, [meals]);

  useEffect(() => {
    if (monthCache.current[date]) {
      setMeals(monthCache.current[date]);
      setFlipped(new Array(monthCache.current[date].length).fill(false));
    } else {
      fetchMonthMeals(date);
    }
  }, [date]);

  async function fetchMonthMeals(selectedDate) {
    const [year, month] = selectedDate.split("-").map(Number);
    const cacheKey = `${year}-${month}`;

    if (monthCache.current[cacheKey]) {
      setMeals(monthCache.current[date] || []);
      setFlipped(new Array(monthCache.current[date]?.length || 0).fill(false));
      return;
    }

    setLoading(true);
    try {
      const monthData = await getMonthMeals(year, month);
      monthCache.current = { ...monthCache.current, ...monthData };
      setMeals(monthCache.current[date] || []);
      setFlipped(new Array(monthCache.current[date]?.length || 0).fill(false));
    } catch (err) {
      console.error("월별 급식 fetch 실패:", err);
      setMeals([]);
      setFlipped([]);
    }
    setLoading(false);
  }

  return (
    <>
      <nav className="navbar">
        <div className="nav-logo">
          <img src={bssmLogo} alt="BSSM 로고" />
          <h2>BSSM 급식 알리미</h2>
        </div>
        <div className="nav-buttons">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="date-input"
          />
          {!user ? (
            <>
              <button onClick={() => navigate("/login")} className="nav-btn">로그인</button>
              <button onClick={() => navigate("/signup")} className="nav-btn">회원가입</button>
            </>
          ) : (
            <button
              onClick={() => { localStorage.removeItem("user"); window.location.reload(); }}
              className="nav-btn"
            >
              로그아웃
            </button>
          )}
        </div>
      </nav>

      <section className="hero">
        <div className="container hero-container">
          <h1>오늘의 급식</h1>
          <p>부산소프트웨어마이스터고 급식 알리미</p>
          <p className="selected-date">선택한 날짜: {date}</p>
        </div>
      </section>

      <main className="container">
        <div className="main-card">
          {loading && (
            <div className="meal-grid">
              {[...Array(skeletonCount)].map((_, idx) => (
                <div key={idx} className="skeleton-card" />
              ))}
            </div>
          )}

          {!loading && meals.length > 0 && (
            <>
              <div className="meal-grid">
                {meals.map((meal, idx) => {
                  const allergyList = parseAllergy(meal.ALLERGY || meal.ALLERGY_INFO || "");
                  const height = cardHeights[idx] || 180;

                  return (
                    <div key={idx} className="meal-card-wrapper" style={{ minHeight: height + 40 }}>
                      <div
                        className={`meal-card ${flipped[idx] ? "flipped" : ""}`}
                        onClick={() => toggleFlip(idx)}
                      >
                        <div className="card-inner" ref={el => cardRefs.current[idx] = el}>
                          <div className="card-front">
                            <h3>{meal.MMEAL_SC_NM}</h3>
                            <p className="meal-text">
                              {meal.DDISH_NM.replace(/<br\/>/g, "\n").replace(/\(\d+(\.\d+)*\)/g, "")}
                            </p>
                          </div>
                          <div className="card-back">
                            <h3>알레르기 정보</h3>
                            <p className="meal-text">
                              {allergyList.length ? allergyList.join(", ") : "정보 없음"}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              {/* 안내 문구: 카드 아래 한 번만 */}
              <p className="meal-note-left">
                ※ 급식카드를 누르면 관련 알레르기 정보가 표시됩니다
              </p>
            </>
          )}

          {!loading && meals.length === 0 && (
            <p className="no-meal">해당 날짜의 급식 정보가 없습니다.</p>
          )}
        </div>
      </main>
    </>
  );
}
