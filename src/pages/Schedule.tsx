import { useState, useEffect, useMemo } from "react";
import Navbar from "./Navbar";
import Footer from "./footer";
import "../styles/schedule.css";

const API_BASE_URL = import.meta.env.VITE_API_URL as string;
const GRADES = [1, 2, 3];
const MONTH_NAMES = ["1월","2월","3월","4월","5월","6월","7월","8월","9월","10월","11월","12월"];
const DAY_NAMES = ["일","월","화","수","목","금","토"];

interface ScheduleEvent {
  date: string;
  name: string;
  type: "academic" | "exam";
  examId?: number;
  startDate?: string;
  endDate?: string;
}

export default function Schedule() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [grade, setGrade] = useState(1);
  const [events, setEvents] = useState<ScheduleEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch(`${API_BASE_URL}/schedule/academic?year=${year}&month=${month}&grade=${grade}`).then(r => r.ok ? r.json() : []),
      fetch(`${API_BASE_URL}/schedule/exams?year=${year}&month=${month}&grade=${grade}`).then(r => r.ok ? r.json() : []),
    ]).then(([academic, exams]) => {
      const examEvents: ScheduleEvent[] = [];
      for (const exam of exams) {
        let d = new Date(exam.startDate.slice(0,4) + "-" + exam.startDate.slice(4,6) + "-" + exam.startDate.slice(6,8));
        const end = new Date(exam.endDate.slice(0,4) + "-" + exam.endDate.slice(4,6) + "-" + exam.endDate.slice(6,8));
        while (d <= end) {
          const ymd = d.toISOString().slice(0,10).replace(/-/g,"");
          examEvents.push({ date: ymd, name: exam.title, type: "exam", examId: exam.id, startDate: exam.startDate, endDate: exam.endDate });
          d.setDate(d.getDate() + 1);
        }
      }
      const all = [...academic, ...examEvents];
      setEvents(all);
      // 현재 달이 오늘 달이면 오늘 날짜에 이벤트가 있을 때 자동 선택
      const ty = today.getFullYear(), tm = today.getMonth() + 1;
      if (year === ty && month === tm) {
        const todayHasEvent = all.some(e => e.date === `${ty}${String(tm).padStart(2,"0")}${String(today.getDate()).padStart(2,"0")}`);
        if (todayHasEvent) {
          setSelected(`${ty}${String(tm).padStart(2,"0")}${String(today.getDate()).padStart(2,"0")}`);
        }
      }
    }).finally(() => setLoading(false));
  }, [year, month, grade]);

  const firstDay = new Date(year, month - 1, 1).getDay();
  const lastDate = new Date(year, month, 0).getDate();

  const cells = useMemo(() => {
    const arr: (number | null)[] = [];
    for (let i = 0; i < firstDay; i++) arr.push(null);
    for (let d = 1; d <= lastDate; d++) arr.push(d);
    return arr;
  }, [year, month, firstDay, lastDate]);

  const eventsByDate = useMemo(() => {
    const map: Record<string, ScheduleEvent[]> = {};
    for (const e of events) {
      if (!map[e.date]) map[e.date] = [];
      map[e.date].push(e);
    }
    return map;
  }, [events]);

  const toYMD = (d: number) => `${year}${String(month).padStart(2,"0")}${String(d).padStart(2,"0")}`;
  const todayYMD = `${today.getFullYear()}${String(today.getMonth()+1).padStart(2,"0")}${String(today.getDate()).padStart(2,"0")}`;

  const prevMonth = () => { if (month === 1) { setYear(y => y-1); setMonth(12); } else setMonth(m => m-1); };
  const nextMonth = () => { if (month === 12) { setYear(y => y+1); setMonth(1); } else setMonth(m => m+1); };

  const selectedEvents = selected ? (eventsByDate[selected] ?? []) : [];

  return (
    <>
      <Navbar selectedDate={new Date()} setSelectedDate={() => {}} />

      <section className="hero sc-hero">
        <div className="container">
          <h1>학사일정</h1>
        </div>
      </section>

      <main className="sc-container">
        {/* 학년 선택 + 월 네비 */}
        <div className="sc-toolbar">
          <div className="sc-month-nav">
            <button className="sc-nav-btn" onClick={prevMonth}>◀</button>
            <span className="sc-month-label">{year}년 {MONTH_NAMES[month-1]}</span>
            <button className="sc-nav-btn" onClick={nextMonth}>▶</button>
          </div>
          <div className="sc-grade-tabs">
            {GRADES.map(g => (
              <button key={g} className={`sc-grade-btn ${grade === g ? "active" : ""}`} onClick={() => setGrade(g)}>
                {g}학년
              </button>
            ))}
          </div>
        </div>

        {/* 범례 */}
        <div className="sc-legend">
          <span className="sc-legend-item"><span className="sc-dot academic" />학사일정</span>
          <span className="sc-legend-item"><span className="sc-dot exam" />시험</span>
        </div>

        {/* 달력 */}
        <div className="sc-card">
          {loading ? (
            <p className="status-msg">불러오는 중...</p>
          ) : (
            <>
              <div className="sc-cal-grid">
                {DAY_NAMES.map(d => (
                  <div key={d} className={`sc-day-name ${d === "일" ? "sun" : d === "토" ? "sat" : ""}`}>{d}</div>
                ))}
                {cells.map((d, i) => {
                  if (!d) return <div key={`e-${i}`} className="sc-cell empty" />;
                  const ymd = toYMD(d);
                  const dayEvents = eventsByDate[ymd] ?? [];
                  const isToday = ymd === todayYMD;
                  const isSelected = ymd === selected;
                  const dow = (firstDay + d - 1) % 7;
                  const visibleChips = dayEvents.slice(0, 2);
                  const extraCount = dayEvents.length - visibleChips.length;
                  return (
                    <div
                      key={ymd}
                      className={`sc-cell ${isToday ? "today" : ""} ${isSelected ? "selected" : ""} ${dow === 0 ? "sun" : dow === 6 ? "sat" : ""}`}
                      onClick={() => setSelected(isSelected ? null : ymd)}
                    >
                      <span className={`sc-date-num ${isToday ? "today-num" : ""}`}>{d}</span>
                      <div className="sc-cell-events">
                        {visibleChips.map((e, idx) => (
                          <span key={idx} className={`sc-chip ${e.type}`}>{e.name}</span>
                        ))}
                        {extraCount > 0 && <span className="sc-chip-more">+{extraCount}개</span>}
                      </div>
                    </div>
                  );
                })}
              </div>

            </>
          )}
        </div>

        {/* 선택한 날 이벤트 — 달력 카드 바깥 */}
        {selected && (
          <div className="sc-detail">
            <h3 className="sc-detail-title">
              {parseInt(selected.slice(4,6))}월 {parseInt(selected.slice(6,8))}일
            </h3>
            {selectedEvents.length === 0 ? (
              <p className="sc-detail-empty">이 날은 등록된 일정이 없습니다.</p>
            ) : (
              <ul className="sc-event-list">
                {selectedEvents.map((e, i) => (
                  <li key={i} className="sc-event-item">
                    <span className={`sc-event-badge ${e.type}`}>{e.type === "exam" ? "시험" : "학사"}</span>
                    {e.name}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </main>

      <Footer />
    </>
  );
}
