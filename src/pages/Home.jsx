import React from "react";
import { useNavigate } from "react-router-dom";
import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import axios from "axios";
import "../styles/home.css";
import bssmLogo from "../assets/bssmlogo.png";
import { getMonthMeals, extractAllergyFromDish, allergyMap } from "../api/NeisApi";
import { getUser, isLoggedIn, logout } from "../api/auth";
import ReportModal from "../modal/ReportModal";
import NoticeModal from "../modal/NoticeModal";
import CommentModal from "../modal/CommentModal";
import Footer from "./footer";

const API_BASE_URL = import.meta.env.VITE_API_URL;

export default function Home() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isAuth, setIsAuth] = useState(isLoggedIn());
  const sseRef = useRef(null);

  const todayStr = useMemo(() => {
    const now = new Date();
    const offset = now.getTimezoneOffset() * 60000;
    return new Date(now.getTime() - offset).toISOString().slice(0, 10);
  }, []);

  const weekLaterStr = useMemo(() => {
    const now = new Date();
    const offset = now.getTimezoneOffset() * 60000;
    const d = new Date(now.getTime() - offset);
    d.setDate(d.getDate() + 7);
    return d.toISOString().slice(0, 10);
  }, []);

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

  const [showCommentModal, setShowCommentModal] = useState(false);
  const [commentTarget, setCommentTarget] = useState(null);

  const handleLogoClick = () => {
    window.open("https://school.busanedu.net/bssm-h", "_blank");
  };

  const formatRankingDate = (dateStr) => {
    if (!dateStr) return "";
    const cleanDate = dateStr.replace(/-/g, "");
    return `${parseInt(cleanDate.substring(4, 6))}월 ${parseInt(cleanDate.substring(6, 8))}일`;
  };

  const subscribeToNotifications = useCallback((userId) => {
    if (!userId || userId === "undefined") return;
    try {
      if (sseRef.current) sseRef.current.close();
      const eventSource = new EventSource(`${API_BASE_URL}/notifications/subscribe/${userId}`, {
        withCredentials: true 
      });

      eventSource.addEventListener("notice", (event) => {
        const data = JSON.parse(event.data);
        setActiveNotice(data);
        setShowNoticeModal(true);
        if (Notification.permission === "granted") {
          new Notification(`📢 실시간 공지: ${data.title}`, { body: data.content, icon: bssmLogo });
        }
      });

      eventSource.onopen = () => console.log("✅ 알림 서버 연결 성공");
      eventSource.onerror = () => eventSource.close();
      sseRef.current = eventSource;
    } catch (err) {
      console.error("SSE 구독 중 오류 발생:", err);
    }
  }, []);

  const fetchMyLikes = useCallback(async (userId) => {
    try {
      const token = sessionStorage.getItem("accessToken");
      if (!token || !userId) return;
      const res = await axios.get(`${API_BASE_URL}/likes/user/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (Array.isArray(res.data)) setMyLikes(res.data);
    } catch (e) {
      console.error("좋아요 목록 로드 실패:", e);
    }
  }, []);

  useEffect(() => {
    const checkStatus = async () => {
      const token = sessionStorage.getItem("accessToken");
      const loggedIn = !!token;
      setIsAuth(loggedIn);

      if (loggedIn) {
        const u = await getUser();
        if (u) {
          setUser(u);
          const identifier = u.id || u.email;
          if (identifier && identifier !== "undefined") {
            await fetchMyLikes(identifier); 
            setTimeout(() => subscribeToNotifications(identifier), 500);
          }
        }
      } else {
        setUser(null);
        setMyLikes([]);
        if (sseRef.current) sseRef.current.close();
      }
    };
    checkStatus();
    window.addEventListener("authChange", checkStatus);
    return () => window.removeEventListener("authChange", checkStatus);
  }, [subscribeToNotifications, fetchMyLikes]);

  const fetchLatestNotice = useCallback(async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/notifications/latest`);
      if (res.data) {
        const lastReadId = localStorage.getItem("lastReadNoticeId");
        const dontShowUntil = localStorage.getItem("dontShowNoticeUntil");
        const isNewNotice = lastReadId ? Number(res.data.id) > Number(lastReadId) : true;
        const isDayPassed = !dontShowUntil || dontShowUntil <= todayStr;
        if (isDayPassed || isNewNotice) {
          setActiveNotice(res.data);
          setShowNoticeModal(true);
        }
      }
    } catch (err) {
      console.error("최근 공지 로드 실패:", err);
    }
  }, [todayStr]);

  const handleCloseNotice = () => {
    setShowNoticeModal(false);
  };

  const fetchRanking = useCallback(async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/likes/ranking`);
      setDbRanking(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("랭킹 로드 실패:", err);
      setDbRanking([]);
    }
  }, []);

  useEffect(() => {
    const initData = async () => {
      setLoading(true);
      await Promise.all([fetchLatestNotice(), fetchRanking()]);
      setLoading(false);
    };
    initData();
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
    return () => { if (sseRef.current) sseRef.current.close(); };
  }, [fetchRanking, fetchLatestNotice]);

  const handleLike = async (e, mealKey, mealType) => {
    e.stopPropagation();
    const token = sessionStorage.getItem("accessToken");
    const userIdentifier = user?.id || user?.email;
    if (!token || !userIdentifier) {
      alert("로그인 후 이용 가능합니다!");
      navigate("/login");
      return;
    }
    const formattedDate = selectedDate.replace(/-/g, "");
    const currentLikeKey = `${formattedDate}_${mealType}_${mealKey}`;
    try {
      const res = await axios.post(
        `${API_BASE_URL}/likes/toggle`,
        { userId: String(userIdentifier), mealDate: formattedDate, mealType, mealKey },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data === "liked") {
        setMyLikes((prev) => [...new Set([...prev, currentLikeKey])]);
      } else {
        setMyLikes((prev) => prev.filter((k) => k !== currentLikeKey));
      }
      fetchRanking(); 
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        logout();
        navigate("/login");
      }
    }
  };

  const handleOpenComment = (e, meal) => {
    e.stopPropagation(); 
    const mealKey = meal.DDISH_NM.split("(")[0].trim();
    const mealType = meal.MMEAL_SC_NM;
    const formattedDate = selectedDate.replace(/-/g, "");

    setCommentTarget({ mealKey, mealType, mealDate: formattedDate });
    setShowCommentModal(true);
  };

  useEffect(() => {
    const [year, month] = selectedDate.split("-").map(Number);
    async function fetchMonthData(y, m) {
      try {
        const data = await getMonthMeals(y, m);
        setMonthData(data || {});
      } catch (err) { console.error("급식 데이터 로드 실패:", err); }
    }
    fetchMonthData(year, month);
  }, [selectedDate.slice(0, 7)]);

  useEffect(() => {
    const cleanDate = selectedDate.replace(/-/g, "");
    const foundMeals = monthData[selectedDate] || monthData[cleanDate] || [];
    setMeals(foundMeals);
    setFlipped([]);
  }, [selectedDate, monthData]);

  const handleSearch = () => {
    if (!searchTerm.trim()) return alert("검색어를 입력해주세요!");
    const foundDate = Object.keys(monthData).find((date) =>
      monthData[date].some((meal) => meal.DDISH_NM.includes(searchTerm))
    );
    if (foundDate) setSelectedDate(foundDate.includes("-") ? foundDate : `${foundDate.slice(0,4)}-${foundDate.slice(4,6)}-${foundDate.slice(6,8)}`);
    else alert(`해당 메뉴가 포함된 급식이 없습니다.`);
  };

  const handleNavReport = () => {
    if (!isLoggedIn()) return alert("로그인 후 이용 가능합니다!");
    setReportTarget({ id: 0, type: "ETC", name: "서비스 건의 및 신고" });
    setShowReportModal(true);
  };

  const todayFavorites = useMemo(() => {
    const cleanToday = todayStr.replace(/-/g, "");
    const targetMeals = monthData[todayStr] || monthData[cleanToday] || [];
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
        <div className="nav-left">
          <div className="nav-logo" style={{ cursor: 'pointer' }}>
            <img src={bssmLogo} alt="BSSM 홈페이지 이동" onClick={handleLogoClick} />
            <h2 onClick={() => navigate("/")}>BSSM 급식알리미</h2>
          </div>
          <div className="nav-menu">
            <button className="menu-item active" onClick={() => navigate("/")}>급식확인</button>
            <button className="menu-item" onClick={() => navigate("/timetable")}>시간표</button>
            <button className="menu-item" onClick={() => navigate("/announcements")}>공지게시판</button>
            <button className="menu-item" onClick={() => navigate("/appdownload")}>어플 다운로드</button>
          </div>
        </div>

        <div className="nav-right">
          {/* ✅ 데스크톱 전용 날짜 선택 */}
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="nav-date-input desktop-only"
          />
          <div className="nav-buttons">
            <button className="nav-report-btn" onClick={handleNavReport}>🚨 건의</button>
            {isAuth ? (
              <button className="nav-btn" onClick={() => navigate("/mypage")}>마이페이지</button>
            ) : (
              <button className="nav-btn" onClick={() => navigate("/login")}>로그인</button>
            )}
          </div>
        </div>
      </nav>

      {/* ✅ 모바일 전용 날짜 선택 (검색창 위) */}
      

      <section className="hero">
        <div className="container">
          <h1>BSSM 급식알리미</h1>
          <div className="mobile-date-selector mobile-only">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="mobile-date-input"
              />
            </div>
          <div className="search-bar">
            <input
              type="text"
              placeholder="오늘 메뉴가 궁금하다면?"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
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
                <p className="alert-desc">
                  <b>{todayFavorites.map((f) => f.name).join(", ")}</b>이(가) 나옵니다!
                </p>
              </div>
            </div>
          )}

          <div className="selected-day-info">
            <h2>{selectedDate} 식단</h2>
            <button className="noti-request-btn" onClick={() => Notification.requestPermission()}>🔔 알림 권한</button>
          </div>

          {loading ? (
            <p className="status-msg">정보를 불러오는 중...</p>
          ) : (
            <div className="meal-grid">
              {meals.length > 0 ? (
                meals.map((meal, idx) => {
                  const allergyList = extractAllergyFromDish(meal.DDISH_NM);
                  const danger = user?.allergies ? allergyList.some((a) => user.allergies.includes(a)) : false;
                  const mealKey = meal.DDISH_NM.split("(")[0].trim();
                  const mealType = meal.MMEAL_SC_NM;
                  const cleanSelectedDate = selectedDate.replace(/-/g, "");
                  const isLiked = isAuth && myLikes.includes(`${cleanSelectedDate}_${mealType}_${mealKey}`);

                  return (
                    <div
                      key={idx}
                      className={`meal-card-wrapper ${flipped.includes(idx) ? "flipped" : ""} ${danger ? "danger" : ""}`}
                      onClick={() => setFlipped((prev) => (prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]))}
                    >
                      <div className="card-inner">
                        <div className="card-front">
                          <div className="card-header">
                            <span className="meal-type">{mealType}</span>
                            <div className="card-header-right">
                              <button 
                                className="comment-icon-btn" 
                                onClick={(e) => handleOpenComment(e, meal)}
                                title="댓글 쓰기"
                              >
                                💬
                              </button>
                              <button
                                className={`like-btn ${isLiked ? "active" : ""}`}
                                onClick={(e) => handleLike(e, mealKey, mealType)}
                              >
                                {isLiked ? "❤️" : "🤍"}
                              </button>
                            </div>
                          </div>
                          <div className="meal-text-container">
                            {meal.DDISH_NM.split("<br/>").map((line, i) => {
                              const isFav = user?.favoriteMenus?.some((fav) => line.includes(fav.trim()));
                              return (
                                <div key={i} className={`menu-line ${isFav ? "fav-highlight" : ""}`}>
                                  {line} {isFav && <span className="menu-star">⭐</span>}
                                </div>
                              );
                            })}
                          </div>
                          <p className="click-info-text">💡 클릭하여 성분을 확인하세요</p>
                          {danger && <div className="danger-badge">⚠️ 알레르기 주의</div>}
                        </div>
                        <div className="card-back">
                          <h3>성분 정보</h3>
                          <div className="allergy-list-container">
                            {allergyList.length > 0 ? (
                              allergyList.map((name, i) => {
                                const allergyNum = Object.keys(allergyMap).find(
                                  (key) => allergyMap[key] === name
                                );
                                return (
                                  <div key={i} className="allergy-row">
                                    <span className="allergy-detail-item">
                                      {name}{allergyNum ? `(${allergyNum})` : ""}
                                    </span>
                                  </div>
                                );
                              })
                            ) : (
                              <p className="status-msg">없음</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="status-msg">해당 날짜에 급식 정보가 없습니다.</p>
              )}
            </div>
          )}
        </div>

        <section className="ranking-section">
          <div className="ranking-header">
            <span className="ranking-icon">🏆</span>
            <h3>가장 잘나온 급식 TOP 5</h3>
          </div>
          <div className="ranking-list">
            {dbRanking.length > 0 ? (
              dbRanking.slice(0, 5).map((item, idx) => (
                <div key={idx} className="ranking-item">
                  <div className="rank-num">
                    {idx < 3
                      ? ["🥇", "🥈", "🥉"][idx]
                      : <span className="rank-num-badge">{idx + 1}</span>}
                  </div>
                  <div className="rank-info">
                    <span className="rank-name">{formatRankingDate(item.mealDate)} - {item.mealType}</span>
                  </div>
                  <div className="rank-count">❤️ {item.likeCount}</div>
                </div>
              ))
            ) : (
              <p className="status-msg">좋아요 데이터가 없습니다.</p>
            )}
          </div>
        </section>
      </main>

      <Footer />

      {showReportModal && <ReportModal target={reportTarget} onClose={() => setShowReportModal(false)} />}
      <NoticeModal notice={activeNotice} onClose={handleCloseNotice} />
      
      {showCommentModal && (
        <CommentModal 
          {...commentTarget} 
          onClose={() => setShowCommentModal(false)} 
        />
      )}
    </>
  );
}