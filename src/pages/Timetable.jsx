import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import bssmLogo from "../assets/bssmlogo.png";
import { isLoggedIn, getUser } from "../api/auth";
import { getWeekTimetable } from "../api/NeisApi";
import Footer from "./footer";
import "../styles/home.css";

const GRADES = [1, 2, 3];
const MAX_CLASSES = 4;
const DAY_NAMES = ["월", "화", "수", "목", "금"];
const CAL_DAYS = ["일", "월", "화", "수", "목", "금", "토"];

// 날짜 → YYYYMMDD 문자열
function toYMD(date) {
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 10).replace(/-/g, "");
}

// Date → 해당 주 월~금 배열 (YYYYMMDD)
function getWeekDays(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diffToMon = day === 0 ? -6 : 1 - day;
  const monday = new Date(d);
  monday.setDate(d.getDate() + diffToMon);
  return Array.from({ length: 5 }, (_, i) => {
    const dd = new Date(monday);
    dd.setDate(monday.getDate() + i);
    return toYMD(dd);
  });
}

// YYYYMMDD → Date
function ymdToDate(ymd) {
  return new Date(`${ymd.slice(0,4)}-${ymd.slice(4,6)}-${ymd.slice(6,8)}`);
}

export default function Timetable() {
  const navigate = useNavigate();
  const [isAuth, setIsAuth] = useState(isLoggedIn());
  const [user, setUser] = useState(null);

  const [grade, setGrade] = useState(1);
  const [classNum, setClassNum] = useState(1);

  const [timetable, setTimetable] = useState({});
  const [loading, setLoading] = useState(false);

  // 선택된 주의 기준 날짜 (Date 객체)
  const [selectedDate, setSelectedDate] = useState(() => new Date());

  // 달력 팝업 상태
  const [showCalendar, setShowCalendar] = useState(false);
  const [calYear, setCalYear] = useState(() => new Date().getFullYear());
  const [calMonth, setCalMonth] = useState(() => new Date().getMonth()); // 0-based
  const calRef = useRef(null);

  // 오늘 (YYYYMMDD)
  const todayStr = useMemo(() => toYMD(new Date()), []);

  // 선택된 주의 월~금 날짜 배열
  const weekDays = useMemo(() => getWeekDays(selectedDate), [selectedDate]);
  const weekStart = weekDays[0];
  const weekEnd = weekDays[4];

  // 주간 표시 텍스트
  const weekLabel = useMemo(() => {
    const s = weekStart;
    const e = weekEnd;
    return `${s.slice(0,4)}년 ${parseInt(s.slice(4,6))}월 ${parseInt(s.slice(6,8))}일 ~ ${parseInt(e.slice(4,6))}월 ${parseInt(e.slice(6,8))}일`;
  }, [weekStart, weekEnd]);

  // 달력 팝업 외부 클릭 닫기
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (calRef.current && !calRef.current.contains(e.target)) {
        setShowCalendar(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // 인증 체크 + 학반 초기화 (localStorage 우선, 없으면 유저 프로필 사용)
  useEffect(() => {
    const check = async () => {
      const token = localStorage.getItem("accessToken");
      setIsAuth(!!token);
      if (token) {
        const u = await getUser();
        setUser(u);
        const savedGrade = localStorage.getItem("tt_grade");
        const savedClass = localStorage.getItem("tt_class");
        if (savedGrade) {
          setGrade(Number(savedGrade));
        } else if (u?.class) {
          setGrade(Number(u.class));
        }
        if (savedClass) {
          setClassNum(Number(savedClass));
        } else if (u?.classnum) {
          setClassNum(Number(u.classnum));
        }
      } else {
        // 비로그인: localStorage만 복원
        const savedGrade = localStorage.getItem("tt_grade");
        const savedClass = localStorage.getItem("tt_class");
        if (savedGrade) setGrade(Number(savedGrade));
        if (savedClass) setClassNum(Number(savedClass));
      }
    };
    check();
    window.addEventListener("authChange", check);
    return () => window.removeEventListener("authChange", check);
  }, []);

  // 시간표 불러오기
  const fetchTimetable = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getWeekTimetable(grade, classNum, weekStart, weekEnd);
      setTimetable(data);
    } catch (e) {
      setTimetable({});
    } finally {
      setLoading(false);
    }
  }, [grade, classNum, weekStart, weekEnd]);

  useEffect(() => {
    fetchTimetable();
  }, [fetchTimetable]);

  const handleGradeChange = (g) => { setGrade(g); localStorage.setItem("tt_grade", g); };
  const handleClassChange = (c) => { setClassNum(c); localStorage.setItem("tt_class", c); };

  // 최대 교시 수
  const maxPeriods = useMemo(() => {
    let max = 7;
    Object.values(timetable).forEach((p) => { if (p.length > max) max = p.length; });
    return max;
  }, [timetable]);

  // 달력 날짜 목록 생성
  const calDates = useMemo(() => {
    const firstDay = new Date(calYear, calMonth, 1).getDay(); // 0=일
    const lastDate = new Date(calYear, calMonth + 1, 0).getDate();
    const cells = [];
    for (let i = 0; i < firstDay; i++) cells.push(null);
    for (let d = 1; d <= lastDate; d++) cells.push(new Date(calYear, calMonth, d));
    return cells;
  }, [calYear, calMonth]);

  // 날짜가 선택된 주에 속하는지 확인
  const isInSelectedWeek = (date) => {
    if (!date) return false;
    const ymd = toYMD(date);
    return weekDays.includes(ymd);
  };

  const isToday = (date) => date && toYMD(date) === todayStr;

  const handleCalDateClick = (date) => {
    if (!date) return;
    setSelectedDate(date);
    setShowCalendar(false);
  };

  // 학반 팝업 상태
  const [showClassPopup, setShowClassPopup] = useState(false);
  const classPopupRef = useRef(null);

  // 학반 팝업 외부 클릭 닫기
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (classPopupRef.current && !classPopupRef.current.contains(e.target)) {
        setShowClassPopup(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleNavReport = () => {
    if (!isLoggedIn()) return alert("로그인 후 이용 가능합니다!");
  };

  return (
    <>
      <nav className="navbar">
        <div className="nav-left">
          <div className="nav-logo" style={{ cursor: "pointer" }}>
            <img src={bssmLogo} alt="BSSM 홈페이지 이동"
              onClick={() => window.open("https://school.busanedu.net/bssm-h", "_blank")} />
            <h2 onClick={() => navigate("/")}>BSSM 급식알리미</h2>
          </div>
          <div className="nav-menu">
            <button className="menu-item" onClick={() => navigate("/")}>급식확인</button>
            <button className="menu-item active" onClick={() => navigate("/timetable")}>시간표</button>
            <button className="menu-item" onClick={() => navigate("/announcements")}>공지게시판</button>
            <button className="menu-item" onClick={() => navigate("/appdownload")}>어플 다운로드</button>
          </div>
        </div>
        <div className="nav-right">
          <div className="nav-buttons">
            <button className="nav-report-btn" onClick={handleNavReport}>🚨 건의</button>
            {isAuth
              ? <button className="nav-btn" onClick={() => navigate("/mypage")}>마이페이지</button>
              : <button className="nav-btn" onClick={() => navigate("/login")}>로그인</button>}
          </div>
        </div>
      </nav>

      <section className="hero tt-hero">
        <div className="container">
          <h1>BSSM 시간표</h1>
        </div>
      </section>

      <main className="container tt-container">
        {/* 학반 선택 팝업 */}
        <div className="tt-setting">
          <div className="tt-controls" ref={classPopupRef}>
            <span className="tt-week-label">{grade}학년 {classNum}반</span>
            <button className="tt-cal-trigger" onClick={() => setShowClassPopup((v) => !v)}>
              🏫 학반 선택
            </button>

            {showClassPopup && (
              <div className="tt-cal-popup tt-class-popup">
                <div className="tt-class-popup-title">학년 선택</div>
                <div className="tt-class-grid">
                  {GRADES.map((g) => (
                    <button
                      key={g}
                      className={`tt-class-cell ${grade === g ? "active" : ""}`}
                      onClick={() => { handleGradeChange(g); }}
                    >
                      {g}학년
                    </button>
                  ))}
                </div>
                <div className="tt-class-popup-title" style={{ marginTop: "0.75rem" }}>반 선택</div>
                <div className="tt-class-grid">
                  {Array.from({ length: MAX_CLASSES }, (_, i) => i + 1).map((c) => (
                    <button
                      key={c}
                      className={`tt-class-cell ${classNum === c ? "active" : ""}`}
                      onClick={() => { handleClassChange(c); setShowClassPopup(false); }}
                    >
                      {c}반
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 주 선택 (달력 팝업) */}
          <div className="tt-week-nav" ref={calRef}>
            <span className="tt-week-label">{weekLabel}</span>
            <button className="tt-cal-trigger" onClick={() => {
              setCalYear(selectedDate.getFullYear());
              setCalMonth(selectedDate.getMonth());
              setShowCalendar((v) => !v);
            }}>
              📅 주 선택
            </button>

            {showCalendar && (
              <div className="tt-cal-popup">
                {/* 달 이동 */}
                <div className="tt-cal-header">
                  <button className="tt-cal-nav" onClick={() => {
                    if (calMonth === 0) { setCalYear(y => y - 1); setCalMonth(11); }
                    else setCalMonth(m => m - 1);
                  }}>◀</button>
                  <span className="tt-cal-title">{calYear}년 {calMonth + 1}월</span>
                  <button className="tt-cal-nav" onClick={() => {
                    if (calMonth === 11) { setCalYear(y => y + 1); setCalMonth(0); }
                    else setCalMonth(m => m + 1);
                  }}>▶</button>
                </div>

                {/* 요일 헤더 */}
                <div className="tt-cal-grid">
                  {CAL_DAYS.map((d) => (
                    <div key={d} className="tt-cal-day-name">{d}</div>
                  ))}
                  {calDates.map((date, idx) => (
                    <div
                      key={idx}
                      className={[
                        "tt-cal-cell",
                        !date ? "empty" : "",
                        date && isInSelectedWeek(date) ? "selected-week" : "",
                        date && isToday(date) ? "today" : "",
                      ].join(" ")}
                      onClick={() => handleCalDateClick(date)}
                    >
                      {date ? date.getDate() : ""}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
        

        {/* 시간표 테이블 */}
        <div className="tt-card">
          {loading ? (
            <p className="status-msg">시간표를 불러오는 중...</p>
          ) : (
            <div className="tt-table-wrapper">
              <table className="tt-table">
                <thead>
                  <tr>
                    <th className="tt-period-header">교시</th>
                    {weekDays.map((day, i) => {
                      const isTodayCol = day === todayStr;
                      return (
                        <th key={day} className={`tt-day-header ${isTodayCol ? "today" : ""}`}>
                          <span className="tt-day-name">{DAY_NAMES[i]}</span>
                          <span className="tt-day-date">{parseInt(day.slice(4,6))}/{parseInt(day.slice(6,8))}</span>
                          {isTodayCol && <span className="tt-today-badge">오늘</span>}
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: maxPeriods }, (_, periodIdx) => (
                    <tr key={periodIdx} className={`tt-row ${(periodIdx + 1) % 2 === 0 ? "even" : ""}`}>
                      <td className="tt-period-cell">{periodIdx + 1}교시</td>
                      {weekDays.map((day) => {
                        const isTodayCol = day === todayStr;
                        const periods = timetable[day] || [];
                        const slot = periods.find((p) => p.period === periodIdx + 1);
                        const subject = slot?.subject || "";
                        return (
                          <td key={day} className={`tt-subject-cell ${isTodayCol ? "today-col" : ""}`}>
                            {subject
                              ? <div className="tt-subject-chip">{subject}</div>
                              : <span className="tt-empty">-</span>}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* 모바일: 일별 카드 뷰 */}
        <div className="tt-mobile-view">
          {weekDays.map((day, i) => {
            const isTodayCol = day === todayStr;
            const periods = timetable[day] || [];
            return (
              <div key={day} className={`tt-mobile-day-card ${isTodayCol ? "today" : ""}`}>
                <div className="tt-mobile-day-header">
                  <span className="tt-mobile-day-name">{DAY_NAMES[i]}</span>
                  <span className="tt-mobile-day-date">{parseInt(day.slice(4,6))}/{parseInt(day.slice(6,8))}</span>
                  {isTodayCol && <span className="tt-today-badge">오늘</span>}
                </div>
                <div className="tt-mobile-periods">
                  {loading ? (
                    <p className="status-msg" style={{ fontSize: "0.8rem" }}>로딩 중...</p>
                  ) : periods.length > 0 ? (
                    periods.map((slot) => (
                      <div key={slot.period} className="tt-mobile-slot">
                        <span className="tt-mobile-period">{slot.period}</span>
                        <div className="tt-mobile-subject">{slot.subject}</div>
                      </div>
                    ))
                  ) : (
                    <p className="tt-no-class">수업 없음</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </main>

      <Footer />
    </>
  );
}