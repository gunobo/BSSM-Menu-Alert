import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getTeacherList, getTeacherSchedule } from "../api/timetableApi";
import { getWeekTimetable, getWeekRange } from "../api/NeisApi";
import Navbar from "./Navbar";
import Footer from "./footer";
import "../styles/home.css";
import type { TeacherScheduleEntry } from "../types";

const DAY_NAMES = ["월", "화", "수", "목", "금"];
const MAX_PERIODS = 7;

type SlotInfo = {
  grade: number;
  classNum: number;
  subject: string;
  neisSubject: string;
  changed: boolean;
};

export default function TeacherTimetable() {
  const navigate = useNavigate();
  const [teachers, setTeachers] = useState<string[]>([]);
  const [selectedTeacher, setSelectedTeacher] = useState(() =>
    localStorage.getItem("tt_teacher") ?? ""
  );
  const [schedule, setSchedule] = useState<TeacherScheduleEntry[]>([]);
  const [neisData, setNeisData] = useState<Record<string, Record<string, Array<{ period: number; subject: string }>>>>({});
  const [listLoading, setListLoading] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setListLoading(true);
    getTeacherList()
      .then(setTeachers)
      .finally(() => setListLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedTeacher) { setSchedule([]); setNeisData({}); return; }
    localStorage.setItem("tt_teacher", selectedTeacher);
    setLoading(true);
    getTeacherSchedule(selectedTeacher)
      .then(async (entries) => {
        setSchedule(entries);

        // 이 교사가 담당하는 학년/반 조합 추출
        const combos = [...new Set(entries.map((e) => `${e.grade}_${e.classNum}`))];
        const { start, end, days } = getWeekRange();

        const results = await Promise.all(
          combos.map(async (key) => {
            const [g, c] = key.split("_").map(Number);
            const data = await getWeekTimetable(g, c, start, end).catch(() => ({}));
            return { key, data: data as Record<string, Array<{ period: number; subject: string }>> };
          })
        );

        const nd: Record<string, Record<string, Array<{ period: number; subject: string }>>> = {};
        results.forEach(({ key, data }) => {
          // key별로 날짜→슬롯 매핑 저장
          const byDate: Record<string, Array<{ period: number; subject: string }>> = {};
          days.forEach((day, di) => {
            byDate[String(di)] = (data[day] ?? []) as Array<{ period: number; subject: string }>;
          });
          nd[key] = byDate;
        });
        setNeisData(nd);
      })
      .finally(() => setLoading(false));
  }, [selectedTeacher]);

  const scheduleMap: Record<number, Record<number, SlotInfo>> = {};
  schedule.forEach(({ period, dayIdx, grade, classNum, subject }) => {
    if (!scheduleMap[period]) scheduleMap[period] = {};
    const key = `${grade}_${classNum}`;
    const neisSlots = neisData[key]?.[String(dayIdx)] ?? [];
    const neisSlot = neisSlots.find((s) => s.period === period);
    const neisSubject = neisSlot?.subject ?? "";
    const changed = !!(neisSubject && subject && neisSubject !== subject);
    scheduleMap[period][dayIdx] = { grade, classNum, subject, neisSubject, changed };
  });

  const maxPeriod = Math.max(MAX_PERIODS, ...Object.keys(scheduleMap).map(Number), 0);

  return (
    <>
      <Navbar />

      <section className="hero tt-hero">
        <div className="container">
          <h1>교사 시간표</h1>
        </div>
      </section>

      <main className="container tt-container">
        <div className="tt-setting" style={{ marginBottom: 16 }}>
          <div className="tt-controls">
            {listLoading ? (
              <span style={{ color: "#94a3b8", fontSize: "0.9rem" }}>교사 목록 불러오는 중...</span>
            ) : teachers.length === 0 ? (
              <span style={{ color: "#94a3b8", fontSize: "0.9rem" }}>등록된 교사가 없습니다.</span>
            ) : (
              <select
                className="tt-teacher-page-select"
                value={selectedTeacher}
                onChange={(e) => setSelectedTeacher(e.target.value)}
              >
                <option value="">교사를 선택하세요</option>
                {teachers.map((t, i) => (
                  <option key={t} value={t}>{i + 1}. {t}</option>
                ))}
              </select>
            )}
          </div>

          <div className="tt-controls">
            <button className="tt-cal-trigger" onClick={() => navigate("/timetable")}>
              ← 학생 시간표
            </button>
          </div>
        </div>

        <div className="tt-card">
          {!selectedTeacher ? (
            <p className="status-msg">교사를 선택하면 시간표가 표시됩니다.</p>
          ) : loading ? (
            <p className="status-msg">불러오는 중...</p>
          ) : schedule.length === 0 ? (
            <p className="status-msg">기본 시간표에 등록된 수업이 없습니다.</p>
          ) : (
            <div className="tt-table-wrapper">
              <table className="tt-table">
                <thead>
                  <tr>
                    <th className="tt-period-header">교시</th>
                    {DAY_NAMES.map((d) => (
                      <th key={d} className="tt-day-header">
                        <span className="tt-day-name">{d}</span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: maxPeriod }, (_, i) => i + 1).map((period) => (
                    <tr key={period} className={`tt-row ${period % 2 === 0 ? "even" : ""}`}>
                      <td className="tt-period-cell">{period}교시</td>
                      {Array.from({ length: 5 }, (_, dayIdx) => {
                        const slot = scheduleMap[period]?.[dayIdx];
                        return (
                          <td key={dayIdx} className="tt-subject-cell">
                            {slot ? (
                              <div className={`tt-subject-chip ${slot.changed ? "changed" : ""}`}>
                                <span className="tt-teacher-class-badge">{slot.grade}-{slot.classNum}</span>
                                {slot.changed ? slot.neisSubject : slot.subject}
                                {slot.changed && <span className="tt-changed-badge">변경</span>}
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
    </>
  );
}
