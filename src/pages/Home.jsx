import { useNavigate } from "react-router-dom";
import { useEffect, useState, useMemo } from "react";
import axios from "axios";
import "../styles/home.css";
import bssmLogo from "../assets/bssmlogo.png";
import { getMonthMeals, extractAllergyFromDish } from "../api/NeisApi";
import { getUser, isLoggedIn } from "../api/auth";

const API_BASE_URL = import.meta.env.VITE_API_URL;

export default function Home() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  
  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [monthData, setMonthData] = useState({}); 
  const [meals, setMeals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [flipped, setFlipped] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  const [dbRanking, setDbRanking] = useState([]); 
  const [myLikes, setMyLikes] = useState([]);    

  // 1. 초기 데이터 로드
  useEffect(() => {
    const initData = async () => {
      if (isLoggedIn()) {
        const u = await getUser();
        setUser(u);
        try {
          const res = await axios.get(`${API_BASE_URL}/likes/user/${u.id}`);
          setMyLikes(res.data);
        } catch (err) {
          console.error("좋아요 내역 로드 실패:", err);
        }
      }
      fetchRanking();
    };
    initData();
    
    // 알림 권한 요청 (처음 접속 시)
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  const fetchRanking = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/likes/ranking`);
      setDbRanking(res.data);
    } catch (err) {
      console.error("랭킹 로드 실패:", err);
    }
  };

  // ✅ 오늘의 최애 메뉴 요약
  const todayFavorites = useMemo(() => {
    const targetMeals = monthData[todayStr] || [];
    if (!user || !user.favoriteMenus || targetMeals.length === 0) return [];
    
    const found = [];
    targetMeals.forEach(meal => {
      const menuLines = meal.DDISH_NM.split("<br/>");
      menuLines.forEach(line => {
        user.favoriteMenus.forEach(fav => {
          if (line.includes(fav.trim())) {
            found.push({ type: meal.MMEAL_SC_NM, name: line.split("(")[0].trim() });
          }
        });
      });
    });
    return found;
  }, [monthData, user, todayStr]);

  // ✅ 알림 전송 함수
  const sendMealNotification = () => {
    if (todayFavorites.length > 0) {
      const menuNames = todayFavorites.map(f => f.name).join(", ");
      new Notification("🍴 오늘의 최애 메뉴 도착!", {
        body: `오늘 식단에 [${menuNames}]이(가) 포함되어 있습니다!`,
        icon: bssmLogo
      });
    }
  };

  // ✅ 특정 시간 알림 체크 (스케줄러 역할)
  useEffect(() => {
    const NOTI_TIME = "08:00"; // 알림을 보낼 시간 (오전 8시)
    
    const timer = setInterval(() => {
      const now = new Date();
      const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      
      // 설정한 시간이고, 오늘 알림을 보낸 적이 없다면 실행
      const lastSent = localStorage.getItem("lastNotiDate");
      if (currentTime === NOTI_TIME && lastSent !== todayStr) {
        sendMealNotification();
        localStorage.setItem("lastNotiDate", todayStr); // 중복 알림 방지
      }
    }, 30000); // 30초마다 체크

    return () => clearInterval(timer);
  }, [todayFavorites, todayStr]);

  const userAllergy = user?.allergies || [];
  const hasMyAllergy = (mealAllergyList) => {
    if (!userAllergy.length) return false;
    const cleanUserList = userAllergy.map(a => String(a).normalize("NFC").trim());
    return mealAllergyList.some(m => cleanUserList.includes(String(m).normalize("NFC").trim()));
  };

  const handleLike = async (e, mealKey, mealType) => {
    e.stopPropagation(); 
    if (!user) return alert("로그인 후 이용 가능합니다!");
    const currentLikeKey = `${selectedDate}_${mealType}_${mealKey}`;
    try {
      await axios.post(`${API_BASE_URL}/likes/toggle`, {
        userId: user.id,
        mealDate: selectedDate,
        mealType: mealType,
        mealKey: mealKey
      });
      setMyLikes(prev => 
        prev.includes(currentLikeKey) ? prev.filter(k => k !== currentLikeKey) : [...prev, currentLikeKey]
      );
      fetchRanking();
    } catch (err) {
      alert("서버 통신 중 오류가 발생했습니다.");
    }
  };

  useEffect(() => {
    const [year, month] = selectedDate.split("-").map(Number);
    fetchMonthData(year, month);
  }, [selectedDate.split("-")[1]]); 

  useEffect(() => {
    setMeals(monthData[selectedDate] || []);
    setFlipped([]);
  }, [selectedDate, monthData]);

  async function fetchMonthData(y, m) {
    setLoading(true);
    try {
      const data = await getMonthMeals(y, m);
      setMonthData(data);
    } catch (err) { console.error(err); }
    setLoading(false);
  }

  const handleSearch = () => {
    if (!searchTerm.trim()) return alert("검색어를 입력하세요!");
    const foundDate = Object.keys(monthData).find(date => 
      monthData[date].some(meal => meal.DDISH_NM.includes(searchTerm))
    );
    if (foundDate) setSelectedDate(foundDate);
    else alert(`이번 달 급식에는 '${searchTerm}' 메뉴가 없습니다.`);
  };

  return (
    <>
      <nav className="navbar">
        <div className="nav-logo" onClick={() => navigate("/")} style={{cursor:'pointer'}}>
          <img src={bssmLogo} alt="BSSM" />
          <h2>BSSM 급식</h2>
        </div>
        <div className="nav-right">
          <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="nav-date-input" />
          <div className="nav-buttons">
            {user ? <button className="nav-btn" onClick={() => navigate("/mypage")}>마이페이지</button> 
                  : <button className="nav-btn" onClick={() => navigate("/login")}>로그인</button>}
          </div>
        </div>
      </nav>

      <section className="hero">
        <div className="container">
          <h1>메뉴 검색 & 좋아요</h1>
          <div className="search-bar">
            <input type="text" placeholder="오늘 메뉴가 궁금하다면?" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSearch()}/>
            <button onClick={handleSearch}>검색</button>
          </div>
        </div>
      </section>

      <main className="container">
        <div className="main-card">
          {/* ✅ 상단 알림 배너 */}
          {selectedDate === todayStr && todayFavorites.length > 0 && (
            <div className="favorite-alert-banner">
              <div className="alert-icon">🎊</div>
              <div className="alert-content">
                <span className="alert-title">오늘의 취향저격 식단!</span>
                <p className="alert-desc">
                  {todayFavorites.map((f, i) => (
                    <span key={i} className="alert-item">
                      <strong>{f.type}</strong>에 <b>{f.name}</b>{i !== todayFavorites.length - 1 ? ", " : ""}
                    </span>
                  ))}
                  이(가) 나옵니다. 맛있는 식사 되세요!
                </p>
              </div>
            </div>
          )}

          <div className="selected-day-info">
            <h2>{selectedDate} 식단</h2>
            <button className="noti-request-btn" onClick={() => Notification.requestPermission()}>🔔 알림 권한 허용</button>
          </div>

          {loading ? <p className="status-msg">로딩 중...</p> : (
            <div className="meal-grid">
              {meals.map((meal, idx) => {
                const allergyList = extractAllergyFromDish(meal.DDISH_NM);
                const danger = hasMyAllergy(allergyList);
                const mealKey = meal.DDISH_NM.split("(")[0].trim();
                const mealType = meal.MMEAL_SC_NM; 
                const isLiked = myLikes.includes(`${selectedDate}_${mealType}_${mealKey}`); 

                return (
                  <div key={idx} className={`meal-card-wrapper ${flipped.includes(idx) ? "flipped" : ""} ${danger ? "danger" : ""}`}
                    onClick={() => setFlipped(prev => prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx])}>
                    <div className="card-inner">
                      <div className="card-front">
                        <div className="card-header">
                          <span className="meal-type">{mealType}</span>
                          <button className={`like-btn ${isLiked ? 'active' : ''}`} onClick={(e) => handleLike(e, mealKey, mealType)}>❤️</button>
                        </div>
                        <div className="meal-text-container">
                          {meal.DDISH_NM.split("<br/>").map((line, i) => {
                            const isFav = user?.favoriteMenus?.some(fav => line.includes(fav.trim()));
                            return (
                              <div key={i} className={`menu-line ${isFav ? "fav-highlight" : ""}`}>
                                {line} {isFav && <span className="menu-star"> ⭐</span>}
                              </div>
                            );
                          })}
                        </div>
                        {danger && <div className="danger-badge">⚠️ 알레르기 주의</div>}
                      </div>
                      <div className="card-back">
                        <h3>성분 정보</h3>
                        <p className="allergy-list-text">{allergyList.join(", ") || "없음"}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </>
  );
}