import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import bssmLogo from "../assets/bssmlogo.png";
import { isLoggedIn, getUser } from "../api/auth";
import { getWeekTimetable } from "../api/NeisApi";
import { getPublicBaseTimetable } from "../api/timetableApi";
import Footer from "./footer";
import "../styles/home.css";

const GRADES = [1, 2, 3];
const MAX_CLASSES = 4;
const DAY_NAMES = ["월", "화", "수", "목", "금"];
const CAL_DAYS = ["일", "월", "화", "수", "목", "금", "토"];

function toYMD(date) {
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 10).replace(/-/g, "");
}

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

export default function Timetable() {
  const navigate = useNavigate();
  const [isAuth, setIsAuth] = useState(isLoggedIn());
  const [user, setUser] = useState(null);

  const [grade, setGrade] = useState(() => {
    const saved = localStorage.getItem("tt_grade");
    return saved ? Number(saved) : 1;
  });
  const [classNum, setClassNum] = useState(() => {
    const saved = localStorage.getItem("tt_class");
    return saved ? Number(saved) : 1;
  });

  const [timetable, setTimetable] = useState({});
  const [baseTimetable, setBaseTimetable] = useState(null); // subjects[periodIdx][dayIdx]
  const [loading, setLoading] = useState(false);

  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [showCalendar, setShowCalendar] = useState(false);
  const [calYear, setCalYear] = useState(() => new Date().getFullYear());
  const [calMonth, setCalMonth] = useState(() => new Date().getMonth());
  const calRef = useRef(null);

  const todayStr = useMemo(() => toYMD(new Date()), []);
  const weekDays = useMemo(() => getWeekDays(selectedDate), [selectedDate]);
  const weekStart = weekDays[0];
  const weekEnd = weekDays[4];

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

  // 인증 체크 + 학반 초기화
  useEffect(() => {
    const check = async () => {
      const token = sessionStorage.getItem("accessToken");
      setIsAuth(!!token);
      if (token) {
        const u = await getUser();
        setUser(u);
        const savedGrade = localStorage.getItem("tt_grade");
        const savedClass = localStorage.getItem("tt_class");
        if (savedGrade) setGrade(Number(savedGrade));
        else if (u?.class) setGrade(Number(u.class));
        if (savedClass) setClassNum(Number(savedClass));
        else if (u?.classnum) setClassNum(Number(u.classnum));
      } else {
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

  // 기본 시간표 불러오기 (학년/반 바뀔 때)
  useEffect(() => {
    setBaseTimetable(null);
    getPublicBaseTimetable(grade, classNum).then(setBaseTimetable);
  }, [grade, classNum]);

  // NEIS에서 시간표 불러오기
  const fetchTimetable = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getWeekTimetable(grade, classNum, weekStart, weekEnd);
      setTimetable(data);
    } catch {
      setTimetable({});
    } finally {
      setLoading(false);
    }
  }, [grade, classNum, weekStart, weekEnd]);

  useEffect(() => {
    fetchTimetable();
  }, [fetchTimetable]);

  // 기본 시간표에서 특정 칸 과목 가져오기
  const getBaseSubject = useCallback((periodIdx, dayIdx) => {
    return baseTimetable?.[periodIdx]?.[dayIdx] ?? "";
  }, [baseTimetable]);

  const handleGradeChange = (g) => { setGrade(g); localStorage.setItem("tt_grade", g); };
  const handleClassChange = (c) => { setClassNum(c); localStorage.setItem("tt_class", c); };

  const maxPeriods = useMemo(() => {
    let max = 7;
    Object.values(timetable).forEach((p) => { if (p.length > max) max = p.length; });
    return max;
  }, [timetable]);

  const calDates = useMemo(() => {
    const firstDay = new Date(calYear, calMonth, 1).getDay();
    const lastDate = new Date(calYear, calMonth + 1, 0).getDate();
    const cells = [];
    for (let i = 0; i < firstDay; i++) cells.push(null);
    for (let d = 1; d <= lastDate; d++) cells.push(new Date(calYear, calMonth, d));
    return cells;
  }, [calYear, calMonth]);

  const isInSelectedWeek = (date) => {
    if (!date) return false;
    return weekDays.includes(toYMD(date));
  };

  const isToday = (date) => date && toYMD(date) === todayStr;

  const handleCalDateClick = (date) => {
    if (!date) return;
    setSelectedDate(date);
    setShowCalendar(false);
  };

  const [showClassPopup, setShowClassPopup] = useState(false);
  const classPopupRef = useRef(null);

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
        {/* 학반 선택 */}
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
                    <button key={g} className={`tt-class-cell ${grade === g ? "active" : ""}`}
                      onClick={() => handleGradeChange(g)}>
                      {g}학년
                    </button>
                  ))}
                </div>
                <div className="tt-class-popup-title" style={{ marginTop: "0.75rem" }}>반 선택</div>
                <div className="tt-class-grid">
                  {Array.from({ length: MAX_CLASSES }, (_, i) => i + 1).map((c) => (
                    <button key={c} className={`tt-class-cell ${classNum === c ? "active" : ""}`}
                      onClick={() => { handleClassChange(c); setShowClassPopup(false); }}>
                      {c}반
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 주 선택 */}
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
                      {weekDays.map((day, dayIdx) => {
                        const isTodayCol = day === todayStr;
                        const periods = timetable[day] || [];
                        const slot = periods.find((p) => p.period === periodIdx + 1);
                        const neisSubject = slot?.subject || "";
                        const baseSubject = getBaseSubject(periodIdx, dayIdx);

                        // NEIS 데이터 없고 기본 시간표 있으면 기본 시간표로 대체
                        const displaySubject = neisSubject || baseSubject;
                        // NEIS 데이터가 있고 기본 시간표와 다르면 변경된 것
                        const isChanged = neisSubject && baseSubject && neisSubject !== baseSubject;
                        // NEIS 데이터 없이 기본 시간표만 표시 중
                        const isBaseOnly = !neisSubject && !!baseSubject;

                        return (
                          <td key={day} className={`tt-subject-cell ${isTodayCol ? "today-col" : ""}`}>
                            {displaySubject ? (
                              <div
                                className={`tt-subject-chip ${isChanged ? "changed" : ""} ${isBaseOnly ? "base-only" : ""}`}
                                title={isChanged ? `기준: ${baseSubject}` : isBaseOnly ? "기본 시간표" : ""}
                              >
                                {displaySubject}
                                {isChanged && <span className="tt-changed-badge">변경</span>}
                              </div>
                            ) : (
                              <span className="tt-empty">-</span>
                            )}
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
          {weekDays.map((day, dayIdx) => {
            const isTodayCol = day === todayStr;
            const neisPeriods = timetable[day] || [];

            // 기본 시간표로 전체 슬롯 구성 (최대 7교시)
            const allPeriods = Array.from({ length: maxPeriods }, (_, pi) => {
              const neisSlot = neisPeriods.find((p) => p.period === pi + 1);
              const neisSubject = neisSlot?.subject || "";
              const baseSubject = getBaseSubject(pi, dayIdx);
              const displaySubject = neisSubject || baseSubject;
              const isChanged = neisSubject && baseSubject && neisSubject !== baseSubject;
              const isBaseOnly = !neisSubject && !!baseSubject;
              return { period: pi + 1, displaySubject, isChanged, isBaseOnly };
            }).filter((s) => s.displaySubject);

            return (
              <div key={day} className={`tt-mobile-day-card ${isTodayCol ? "today" : ""}`}>
                <div className="tt-mobile-day-header">
                  <span className="tt-mobile-day-name">{DAY_NAMES[dayIdx]}</span>
                  <span className="tt-mobile-day-date">{parseInt(day.slice(4,6))}/{parseInt(day.slice(6,8))}</span>
                  {isTodayCol && <span className="tt-today-badge">오늘</span>}
                </div>
                <div className="tt-mobile-periods">
                  {loading ? (
                    <p className="status-msg" style={{ fontSize: "0.8rem" }}>로딩 중...</p>
                  ) : allPeriods.length > 0 ? (
                    allPeriods.map((slot) => (
                      <div key={slot.period} className={`tt-mobile-slot ${slot.isChanged ? "changed" : ""}`}>
                        <span className="tt-mobile-period">{slot.period}</span>
                        <div className="tt-mobile-subject">
                          {slot.displaySubject}
                          {slot.isChanged && <span className="tt-changed-badge">변경</span>}
                        </div>
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
