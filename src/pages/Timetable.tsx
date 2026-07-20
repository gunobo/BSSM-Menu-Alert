import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import bssmLogo from "../assets/bssmlogo.png";
import { isLoggedIn, getUser } from "../api/auth";
import { getWeekTimetable } from "../api/NeisApi";
import { getPublicBaseTimetable, getPublicTeacherMap, getPublicOverrides } from "../api/timetableApi";
import Footer from "./footer";
import "../styles/home.css";
import Navbar from "./Navbar";
import ReportModal from "../modal/ReportModal";
import TeacherTimetableModal from "../modal/TeacherTimetableModal";
import type { User, ReportTarget } from "../types";

interface BaseTimetableData {
  subjects: string[][];
  teachers: string[][];
}

interface TimetableSlot {
  period: number;
  subject: string;
  teacher?: string;
}

interface OverrideInfo {
  teacher?: string;
  overrideSubject?: string | null;
}

const GRADES = [1, 2, 3];
const MAX_CLASSES = 4;
const DAY_NAMES = ["월", "화", "수", "목", "금"];
const CAL_DAYS = ["일", "월", "화", "수", "목", "금", "토"];

function toYMD(date: Date) {
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 10).replace(/-/g, "");
}

function getWeekDays(date: Date) {
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
  const [user, setUser] = useState<User | null>(null);

  const [grade, setGrade] = useState(() => {
    const saved = localStorage.getItem("tt_grade");
    return saved ? Number(saved) : 1;
  });
  const [classNum, setClassNum] = useState(() => {
    const saved = localStorage.getItem("tt_class");
    return saved ? Number(saved) : 1;
  });

  const [timetable, setTimetable] = useState<Record<string, TimetableSlot[]>>({});
  const [baseTimetable, setBaseTimetable] = useState<BaseTimetableData | null>(null);   // { subjects[][], teachers[][] }
  const [teacherMap, setTeacherMap] = useState<Record<string, string>>({});           // subjectAlias 로드용 (교사 표시에는 미사용)
  const [subjectAlias, setSubjectAlias] = useState<Record<string, string>>({});
  const [overrides, setOverrides] = useState<Record<string, Record<number, OverrideInfo>>>({});             // { date: { period: { teacher, subject } } }
  const [loading, setLoading] = useState(false);

  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [showCalendar, setShowCalendar] = useState(false);
  const [calYear, setCalYear] = useState(() => new Date().getFullYear());
  const [calMonth, setCalMonth] = useState(() => new Date().getMonth());
  const calRef = useRef<HTMLDivElement | null>(null);

  const todayStr = useMemo(() => toYMD(new Date()), []);
  const weekDays = useMemo(() => getWeekDays(selectedDate), [selectedDate]);
  const weekStart = weekDays[0];
  const weekEnd = weekDays[4];

  const [showReportModal, setShowReportModal] = useState(false);
  const [reportTarget, setReportTarget] = useState<ReportTarget | null>(null);
  const [showTeacherModal, setShowTeacherModal] = useState(false);

  const weekLabel = useMemo(() => {
    const s = weekStart;
    const e = weekEnd;
    return `${s.slice(0, 4)}년 ${parseInt(s.slice(4, 6))}월 ${parseInt(s.slice(6, 8))}일 ~ ${parseInt(e.slice(4, 6))}월 ${parseInt(e.slice(6, 8))}일`;
  }, [weekStart, weekEnd]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (calRef.current && !calRef.current.contains(e.target as Node)) {
        setShowCalendar(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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

  useEffect(() => {
    setBaseTimetable(null);
    setTeacherMap({});
    setSubjectAlias({});
    // baseTimetable = { subjects[][], teachers[][] }
    getPublicBaseTimetable(grade, classNum).then((data) => setBaseTimetable(data as BaseTimetableData | null));
    getPublicTeacherMap(grade, classNum).then((res) => {
      if (res) {
        setTeacherMap((res.teacherMap ?? {}) as unknown as Record<string, string>);
        setSubjectAlias((res.subjectAlias ?? {}) as unknown as Record<string, string>);
      }
    });
  }, [grade, classNum]);

  const fetchTimetable = useCallback(async () => {
    setLoading(true);
    try {
      const [data, ov] = await Promise.all([
        getWeekTimetable(grade, classNum, weekStart, weekEnd).catch(() => ({})),
        getPublicOverrides(grade, classNum, weekStart, weekEnd).catch(() => ({})),
      ]);
      setTimetable((data ?? {}) as Record<string, TimetableSlot[]>);
      setOverrides((ov ?? {}) as Record<string, Record<number, OverrideInfo>>);
    } catch {
      setTimetable({});
      setOverrides({});
    } finally {
      setLoading(false);
    }
  }, [grade, classNum, weekStart, weekEnd]);

  useEffect(() => {
    fetchTimetable();
  }, [fetchTimetable]);

  const getBaseSubject = useCallback((periodIdx: number, dayIdx: number) => {
    return baseTimetable?.subjects?.[periodIdx]?.[dayIdx] ?? "";
  }, [baseTimetable]);

  const getBaseTeacher = useCallback((periodIdx: number, dayIdx: number) => {
    return baseTimetable?.teachers?.[periodIdx]?.[dayIdx] ?? "";
  }, [baseTimetable]);

  const handleGradeChange = (g: number) => { setGrade(g); localStorage.setItem("tt_grade", String(g)); };
  const handleClassChange = (c: number) => { setClassNum(c); localStorage.setItem("tt_class", String(c)); };

  const maxPeriods = useMemo(() => {
    let max = 7;
    Object.values(timetable as Record<string, unknown[]>).forEach((p) => { if (p.length > max) max = p.length; });
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

  const isInSelectedWeek = (date: Date | null) => {
    if (!date) return false;
    return weekDays.includes(toYMD(date));
  };

  const isToday = (date: Date | null) => date && toYMD(date) === todayStr;

  const handleCalDateClick = (date: Date | null) => {
    if (!date) return;
    setSelectedDate(date);
    setShowCalendar(false);
  };

  const [showClassPopup, setShowClassPopup] = useState(false);
  const classPopupRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (classPopupRef.current && !classPopupRef.current.contains(e.target as Node)) {
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
      <Navbar selectedDate={selectedDate} setSelectedDate={setSelectedDate} />

      <section className="hero tt-hero">
        <div className="container">
          <h1>BSSM 시간표</h1>
        </div>
      </section>

      <main className="container tt-container">
        {/* 학반 & 날짜 설정 영역 */}
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
          <div className="tt-controls">
            <button className="tt-teacher" onClick={() => navigate("/timetable/t")}>
              👩‍🏫 교사 시간표
            </button>
          </div>
        </div>

        {/* 범례 */}
        <div className="tt-legend">
          <span className="tt-legend-item">
            <span className="tt-changed-badge">변경</span>
            나이스 기준 수업 변경됨
          </span>
          <span className="tt-legend-item">
            <span className="tt-legend-dot base-only" />
            기본 시간표 기준 (나이스 미등록)
          </span>
        </div>

        {/* 시간표 카드 */}
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
                          <span className="tt-day-date">{parseInt(day.slice(4, 6))}/{parseInt(day.slice(6, 8))}</span>
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
                        const periods: TimetableSlot[] = timetable[day] || [];
                        const slot = periods.find((p) => p.period === periodIdx + 1);
                        const neisSubject = slot?.subject || "";
                        const baseSubject = getBaseSubject(periodIdx, dayIdx);
                        const overrideInfo = overrides?.[day]?.[periodIdx + 1];

                        // 기본 시간표 기준 교시에 대한 관리자 수정 오버라이드
                        // overrideInfo.overrideSubject: null=미수정, ""=수업없음, "시험" 등
                        const hasBaseOverride = !neisSubject &&
                          overrideInfo &&
                          overrideInfo.overrideSubject !== undefined &&
                          overrideInfo.overrideSubject !== null;
                        // 실제 표시할 기본 시간표 과목 (오버라이드 있으면 그걸 사용, "" = 수업없음)
                        const effectiveBase = hasBaseOverride ? (overrideInfo.overrideSubject ?? "") : baseSubject;

                        const displaySubject = neisSubject || effectiveBase;
                        const isChanged = neisSubject && baseSubject && neisSubject !== baseSubject;
                        // base-only: NEIS 없고, 기본 시간표는 있고, 관리자 수정 없는 경우에만 회색 점 표시
                        const isBaseOnly = !neisSubject && !!displaySubject && !hasBaseOverride;
                        const displayName = subjectAlias[displaySubject] || displaySubject;

                        // 교사 표시 우선순위:
                        // - 수업 변경 시: 오버라이드 교사만 (기본 교사는 다른 과목 담당이므로 숨김)
                        // - 정상 수업 시: 오버라이드 교사 → 기본 시간표 교사
                        const overrideTeacher = overrideInfo?.teacher ?? "";
                        const baseTeacher = getBaseTeacher(periodIdx, dayIdx);
                        const teacherLabel = isChanged
                          ? overrideTeacher
                          : (overrideTeacher || baseTeacher);

                        return (
                          <td key={day} className={`tt-subject-cell ${isTodayCol ? "today-col" : ""}`}>
                            {displaySubject ? (
                              <div
                                className={`tt-subject-chip ${isChanged ? "changed" : ""} ${isBaseOnly ? "base-only" : ""}`}
                                title={
                                  isChanged
                                    ? `기존: ${baseSubject}`
                                    : isBaseOnly
                                    ? "기본 시간표"
                                    : displayName !== displaySubject
                                    ? `원과목명: ${displaySubject}`
                                    : ""
                                }
                              >
                                {displayName}
                                {isChanged && <span className="tt-changed-badge">변경</span>}
                                {teacherLabel && (
                                  <span className="tt-teacher-name">{teacherLabel}</span>
                                )}
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
      </main>

      <Footer />
      {showReportModal && reportTarget && <ReportModal target={reportTarget} onClose={() => setShowReportModal(false)} />}
      {showTeacherModal && <TeacherTimetableModal onClose={() => setShowTeacherModal(false)} />}
    </>
  );
}