import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getTeacherList, getTeacherSchedule } from "../api/timetableApi";
import Navbar from "./Navbar";
import Footer from "./footer";
import "../styles/home.css";
import type { TeacherScheduleEntry } from "../types";

const DAY_NAMES = ["월", "화", "수", "목", "금"];
const MAX_PERIODS = 7;

export default function TeacherTimetable() {
  const navigate = useNavigate();
  const [teachers, setTeachers] = useState<string[]>([]);
  const [selectedTeacher, setSelectedTeacher] = useState(() =>
    localStorage.getItem("tt_teacher") ?? ""
  );
  const [schedule, setSchedule] = useState<TeacherScheduleEntry[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setListLoading(true);
    getTeacherList()
      .then(setTeachers)
      .finally(() => setListLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedTeacher) { setSchedule([]); return; }
    localStorage.setItem("tt_teacher", selectedTeacher);
    setLoading(true);
    getTeacherSchedule(selectedTeacher)
      .then(setSchedule)
      .finally(() => setLoading(false));
  }, [selectedTeacher]);

  const scheduleMap: Record<number, Record<number, { grade: number; classNum: number; subject: string }>> = {};
  schedule.forEach(({ period, dayIdx, grade, classNum, subject }) => {
    if (!scheduleMap[period]) scheduleMap[period] = {};
    scheduleMap[period][dayIdx] = { grade, classNum, subject };
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
          {/* 교사 선택 */}
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
                              <div className="tt-subject-chip">
                                <span className="tt-teacher-class-badge">{slot.grade}-{slot.classNum}</span>
                                {slot.subject}
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
