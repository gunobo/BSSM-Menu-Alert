import { useNavigate } from "react-router-dom";
import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import axios from "axios";
import "../styles/home.css";
import bssmLogo from "../assets/bssmlogo.png";
import { getMonthMeals, extractAllergyFromDish } from "../api/NeisApi";
import { getUser, isLoggedIn, logout } from "../api/auth";
import ReportModal from "../modal/ReportModal";
import NoticeModal from "../modal/NoticeModal";

const API_BASE_URL = import.meta.env.VITE_API_URL;

export default function Home() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const sseRef = useRef(null);

  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [monthData, setMonthData] = useState({});
  const [meals, setMeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [flipped, setFlipped] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  const [dbRanking, setDbRanking] = useState([]);
  const [myLikes, setMyLikes] = useState([]);

  const [showReportModal, setShowReportModal] = useState(false);
  const [reportTarget, setReportTarget] = useState(null);

  const [activeNotice, setActiveNotice] = useState(null);
  const [showNoticeModal, setShowNoticeModal] = useState(false);

  // --- 1. 공지사항 로직 ---
  const fetchLatestNotice = useCallback(async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/notifications/latest`);
      if (res.data) {
        const lastReadId = localStorage.getItem("lastReadNoticeId");
        const dontShowUntil = localStorage.getItem("dontShowNoticeUntil");
        const isNewNotice = lastReadId ? Number(res.data.id) > Number(lastReadId) : true;
        const isDayPassed = dontShowUntil !== todayStr;

        if (isDayPassed || isNewNotice) {
          setActiveNotice(res.data);
          setShowNoticeModal(true);
        }
      }
    } catch (err) {
      console.error("최근 공지 로드 실패:", err);
    }
  }, [todayStr]);

  const handleCloseNotice = (isDontShowToday) => {
    if (activeNotice) {
      if (isDontShowToday) {
        localStorage.setItem("lastReadNoticeId", String(activeNotice.id));
        localStorage.setItem("dontShowNoticeUntil", todayStr);
      } else {
        localStorage.removeItem("dontShowNoticeUntil");
      }
    }
    setShowNoticeModal(false);
  };

  // --- 2. 실시간 알림(SSE) 구독 ---
  const subscribeToNotifications = useCallback((userId) => {
    if (!userId) return;
    if (sseRef.current) sseRef.current.close();

    const eventSource = new EventSource(`${API_BASE_URL}/notifications/subscribe/${userId}`);
    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setActiveNotice(data);
      setShowNoticeModal(true);
    };
    eventSource.onerror = () => eventSource.close();
    sseRef.current = eventSource;
  }, []);

  // --- 3. 랭킹 데이터 로드 ---
  const fetchRanking = useCallback(async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/likes/ranking`);
      setDbRanking(res.data || []);
    } catch (err) {
      console.error("랭킹 로드 실패:", err);
    }
  }, []);

  // --- 4. 초기 데이터 로드 (인증 포함) ---
  useEffect(() => {
    const initData = async () => {
      setLoading(true);
      
      // 공통 데이터 로드
      await Promise.all([fetchLatestNotice(), fetchRanking()]);

      if (isLoggedIn()) {
        try {
          const u = await getUser();
          if (u) {
            setUser(u);
            const userId = u.id || u.userId || u.email;
            
            if (userId) {
              subscribeToNotifications(userId);
              const token = localStorage.getItem("accessToken");
              const res = await axios.get(`${API_BASE_URL}/likes/user/${userId}`, {
                headers: { Authorization: `Bearer ${token}` },
              });
              setMyLikes(res.data || []);
            }
          }
        } catch (err) {
          console.error("인증 데이터 로드 실패:", err);
        }
      }
      setLoading(false);
    };

    initData();

    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }

    return () => {
      if (sseRef.current) sseRef.current.close();
    };
  }, [fetchRanking, fetchLatestNotice, subscribeToNotifications]);

  // --- 5. 좋아요 토글 핸들러 ---
  const handleLike = async (e, mealKey, mealType) => {
    e.stopPropagation();

    if (!user) {
      alert("로그인 후 이용 가능합니다!");
      navigate("/login");
      return;
    }

    const userId = user.id || user.userId || user.email;
    const currentLikeKey = `${selectedDate}_${mealType}_${mealKey}`;
    const token = localStorage.getItem("accessToken");

    try {
      const res = await axios.post(
        `${API_BASE_URL}/likes/toggle`,
        {
          userId: String(userId),
          mealDate: selectedDate,
          mealType: mealType,
          mealKey: mealKey,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data === "liked") {
        setMyLikes((prev) => [...new Set([...prev, currentLikeKey])]);
      } else {
        setMyLikes((prev) => prev.filter((k) => k !== currentLikeKey));
      }
      fetchRanking();
    } catch (err) {
      console.error("좋아요 토글 에러:", err);
    }
  };

  // --- 6. 급식 데이터 및 검색 로직 ---
  useEffect(() => {
    const [year, month] = selectedDate.split("-").map(Number);
    getMonthMeals(year, month).then(setMonthData).catch(console.error);
  }, [selectedDate]);

  useEffect(() => {
    setMeals(monthData[selectedDate] || []);
    setFlipped([]);
  }, [selectedDate, monthData]);

  const handleSearch = () => {
    if (!searchTerm.trim()) return alert("검색어를 입력해주세요!");
    const foundDate = Object.keys(monthData).find((date) =>
      monthData[date].some((meal) => meal.DDISH_NM.includes(searchTerm))
    );
    if (foundDate) setSelectedDate(foundDate);
    else alert(`해당 메뉴가 포함된 급식이 없습니다.`);
  };

  const handleNavReport = () => {
    if (!user) return alert("로그인 후 이용 가능합니다!");
    setReportTarget({ id: 0, type: "ETC", name: "서비스 건의 및 신고" });
    setShowReportModal(true);
  };

  const todayFavorites = useMemo(() => {
    const targetMeals = monthData[todayStr] || [];
    if (!user || !user.favoriteMenus || targetMeals.length === 0) return [];
    const found = [];
    targetMeals.forEach((meal) => {
      const menuLines = meal.DDISH_NM.split("<br/>");
      menuLines.forEach((line) => {
        user.favoriteMenus.forEach((fav) => {
          if (line.includes(fav.trim())) {
            found.push({ type: meal.MMEAL_SC_NM, name: line.split("(")[0].trim() });
          }
        });
      });
    });
    return found;
  }, [monthData, user, todayStr]);

  return (
    <>
      <nav className="navbar">
        <div className="nav-logo" onClick={() => navigate("/")}>
          <img src={bssmLogo} alt="BSSM" onClick={(e) => { e.stopPropagation(); window.open("https://school.busanedu.net/bssm-h", "_blank"); }} />
          <h2>BSSM 급식알리미</h2>
        </div>
        <div className="nav-right">
          <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="nav-date-input" />
          <div className="nav-buttons">
            <button className="nav-report-btn" onClick={handleNavReport}>🚨 신고</button>
            {user ? (
              <button className="nav-btn" onClick={() => navigate("/mypage")}>마이페이지</button>
            ) : (
              <button className="nav-btn" onClick={() => navigate("/login")}>로그인</button>
            )}
          </div>
        </div>
      </nav>

      <section className="hero">
        <div className="container">
          <h1>BSSM 급식알리미</h1>
          <div className="search-bar">
            <input type="text" placeholder="오늘 메뉴가 궁금하다면?" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSearch()} />
            <button onClick={handleSearch}>검색</button>
          </div>
        </div>
      </section>

      <main className="container">
        <div className="main-card">
          {selectedDate === todayStr && todayFavorites.length > 0 && (
            <div className="favorite-alert-banner">
              <div className="alert-icon">🎊</div>
              <div className="alert-content">
                <span className="alert-title">오늘의 취향저격 식단!</span>
                <p className="alert-desc"><b>{todayFavorites.map((f) => f.name).join(", ")}</b>이(가) 나옵니다.</p>
              </div>
            </div>
          )}

          <div className="selected-day-info">
            <h2>{selectedDate} 식단</h2>
            <button className="noti-request-btn" onClick={() => Notification.requestPermission()}>🔔 알림 허용</button>
          </div>

          {loading ? <p className="status-msg">로딩 중...</p> : (
            <div className="meal-grid">
              {meals.length > 0 ? meals.map((meal, idx) => {
                const allergyList = extractAllergyFromDish(meal.DDISH_NM);
                const danger = user?.allergies ? allergyList.some((a) => user.allergies.includes(a)) : false;
                const mealKey = meal.DDISH_NM.split("(")[0].trim();
                const mealType = meal.MMEAL_SC_NM;
                const isLiked = myLikes.includes(`${selectedDate}_${mealType}_${mealKey}`);

                return (
                  <div key={idx} className={`meal-card-wrapper ${flipped.includes(idx) ? "flipped" : ""} ${danger ? "danger" : ""}`} onClick={() => setFlipped((prev) => (prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]))}>
                    <div className="card-inner">
                      <div className="card-front">
                        <div className="card-header">
                          <span className="meal-type">{mealType}</span>
                          <button className={`like-btn ${isLiked ? "active" : ""}`} onClick={(e) => handleLike(e, mealKey, mealType)}>
                            {isLiked ? "❤️" : "🤍"}
                          </button>
                        </div>
                        <div className="meal-text-container">
                          {meal.DDISH_NM.split("<br/>").map((line, i) => {
                            const isFav = user?.favoriteMenus?.some((fav) => line.includes(fav.trim()));
                            return (
                              <div key={i} className={`menu-line ${isFav ? "fav-highlight" : ""}`}>
                                {line} {isFav && <span className="menu-star"> ⭐</span>}
                              </div>
                            );
                          })}
                        </div>
                        {danger && <div className="danger-badge">⚠️ 알레르기 주의</div>}
                        <div className="flip-hint">상세 성분 보기</div>
                      </div>
                      <div className="card-back">
                        <h3>성분 정보</h3>
                        <p className="allergy-list-text">{allergyList.join(", ") || "없음"}</p>
                      </div>
                    </div>
                  </div>
                );
              }) : <p className="status-msg">식단 정보가 없습니다.</p>}
            </div>
          )}
        </div>

        <section className="ranking-section">
          <div className="ranking-header">
            <span className="ranking-icon">🏆</span>
            <h3>가장 잘나온 급식 TOP 5</h3>
          </div>
          <div className="ranking-list">
            {dbRanking.slice(0, 5).map((item, idx) => (
              <div key={idx} className="ranking-item">
                <div className="rank-num">{idx + 1}</div>
                <div className="rank-info">
                  <span className="rank-name">{item.mealKey}</span>
                  <span className="rank-date">{item.mealDate}</span>
                </div>
                <div className="rank-count">❤️ {item.likeCount}</div>
              </div>
            ))}
          </div>
        </section>
      </main>

      {showReportModal && <ReportModal target={reportTarget} onClose={() => setShowReportModal(false)} />}
      {showNoticeModal && <NoticeModal notice={activeNotice} onClose={handleCloseNotice} />}
    </>
  );
}