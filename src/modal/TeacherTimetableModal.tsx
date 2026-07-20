import React, { useState, useEffect } from "react";
import { getTeacherList, getTeacherSchedule } from "../api/timetableApi";
import type { TeacherScheduleEntry } from "../types";

const DAY_NAMES = ["월", "화", "수", "목", "금"];
const MAX_PERIODS = 7;

interface TeacherTimetableModalProps {
  onClose: () => void;
}

export default function TeacherTimetableModal({ onClose }: TeacherTimetableModalProps) {
  const [teachers, setTeachers] = useState<string[]>([]);
  const [selectedTeacher, setSelectedTeacher] = useState("");
  const [schedule, setSchedule] = useState<TeacherScheduleEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [listLoading, setListLoading] = useState(true);

  useEffect(() => {
    setListLoading(true);
    getTeacherList()
      .then((list) => { setTeachers(list); })
      .finally(() => setListLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedTeacher) { setSchedule([]); return; }
    setLoading(true);
    getTeacherSchedule(selectedTeacher)
      .then(setSchedule)
      .finally(() => setLoading(false));
  }, [selectedTeacher]);

  // schedule 배열 → period/dayIdx 기준 맵으로 변환
  const scheduleMap: Record<number, Record<number, { grade: number; classNum: number; subject: string }>> = {};
  schedule.forEach(({ period, dayIdx, grade, classNum, subject }) => {
    if (!scheduleMap[period]) scheduleMap[period] = {};
    scheduleMap[period][dayIdx] = { grade, classNum, subject };
  });

  const maxPeriod = Math.max(MAX_PERIODS, ...Object.keys(scheduleMap).map(Number));

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content tt-teacher-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2>👩‍🏫 교사 시간표</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="tt-teacher-modal-body">
          {/* 교사 선택 */}
          <div className="tt-teacher-select-row">
            {listLoading ? (
              <p style={{ color: "#94a3b8", fontSize: "0.9rem" }}>교사 목록 불러오는 중...</p>
            ) : teachers.length === 0 ? (
              <p style={{ color: "#94a3b8", fontSize: "0.9rem" }}>등록된 교사가 없습니다.</p>
            ) : (
              <select
                className="tt-admin-select"
                style={{ minWidth: "160px" }}
                value={selectedTeacher}
                onChange={(e) => setSelectedTeacher(e.target.value)}
              >
                <option value="">교사 선택</option>
                {teachers.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            )}
          </div>

          {/* 시간표 */}
          {selectedTeacher && (
            loading ? (
              <p style={{ textAlign: "center", padding: "40px 0", color: "#94a3b8" }}>불러오는 중...</p>
            ) : (
              <div className="tt-admin-table-wrapper" style={{ marginTop: "16px" }}>
                <table className="tt-admin-table">
                  <thead>
                    <tr>
                      <th className="tt-admin-period-header">교시</th>
                      {DAY_NAMES.map((d) => (
                        <th key={d} className="tt-admin-day-header">{d}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {Array.from({ length: maxPeriod }, (_, i) => i + 1).map((period) => (
                      <tr key={period} className={period % 2 === 0 ? "even" : ""}>
                        <td className="tt-admin-period-cell">{period}교시</td>
                        {Array.from({ length: 5 }, (_, dayIdx) => {
                          const slot = scheduleMap[period]?.[dayIdx];
                          return (
                            <td key={dayIdx} className="tt-admin-subject-cell">
                              {slot ? (
                                <div className="tt-teacher-slot">
                                  <span className="tt-teacher-slot-class">
                                    {slot.grade}-{slot.classNum}
                                  </span>
                                  <span className="tt-teacher-slot-subject">
                                    {slot.subject}
                                  </span>
                                </div>
                              ) : (
                                <span style={{ color: "#cbd5e1" }}>-</span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}
