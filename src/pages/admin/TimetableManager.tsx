import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  getBaseTimetable,
  saveBaseTimetable,
  getChangeLog,
  getPublicTeacherMap,
  dayName,
} from "../../api/timetableApi";
import { getUser } from "../../api/auth";
import { getGradeSubjects } from "../../api/NeisApi";

const DAY_NAMES = ["월", "화", "수", "목", "금"];
const MAX_PERIODS = 7;
const GRADES = [1, 2, 3];
const MAX_CLASSES = 4;

function getDepartmentLabel(grade, classNum) {
  if (grade === 1) return "공통과정";
  if (classNum <= 2) return "소프트웨어개발과";
  return "임베디드소프트웨어과";
}

function makeEmpty() {
  return Array.from({ length: MAX_PERIODS }, () => Array(5).fill(""));
}

function formatDateTime(date) {
  if (!date) return "-";
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, "0")}.${String(date.getDate()).padStart(2, "0")} ${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

export default function TimetableManager() {
  const [grade, setGrade] = useState(1);
  const [classNum, setClassNum] = useState(1);
  const [subjects, setSubjects] = useState(makeEmpty());
  const [teachers, setTeachers] = useState(makeEmpty()); // 교시별 담당 교사
  const [subjectOptions, setSubjectOptions] = useState([]);
  // { [subject]: string[] } — 해당 반에 등록된 과목별 교사 목록
  const [subjectTeacherMap, setSubjectTeacherMap] = useState({});
  const [optionsLoading, setOptionsLoading] = useState(false);
  const [adminName, setAdminName] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [changeLog, setChangeLog] = useState([]);
  const [logLoading, setLogLoading] = useState(false);

  const savedSubjectsRef = useRef(makeEmpty());

  // 관리자 이름 로드
  useEffect(() => {
    getUser().then((u) => { if (u?.name) setAdminName(u.name); });
  }, []);

  // 학년/반 변경 시 과목 목록 + 과목별 교사 매핑 불러오기
  useEffect(() => {
    setOptionsLoading(true);
    setSubjectOptions([]);
    setSubjectTeacherMap({});
    // 과목 목록 (NEIS)
    getGradeSubjects(grade, classNum)
      .then(setSubjectOptions)
      .catch(() => setSubjectOptions([]))
      .finally(() => setOptionsLoading(false));
    // 과목별 교사 매핑 (해당 반 기준)
    getPublicTeacherMap(grade, classNum)
      .then((res) => setSubjectTeacherMap(res?.teacherMap ?? {}))
      .catch(() => setSubjectTeacherMap({}));
  }, [grade, classNum]);

  const loadChangeLog = useCallback(async () => {
    setLogLoading(true);
    try {
      setChangeLog(await getChangeLog(grade, classNum, 30));
    } catch {
      setChangeLog([]);
    } finally {
      setLogLoading(false);
    }
  }, [grade, classNum]);

  const loadTimetable = useCallback(async () => {
    setLoading(true);
    setMessage(null);
    try {
      const data = await getBaseTimetable(grade, classNum);
      // subjects
      const mergedSubj = makeEmpty();
      if (Array.isArray(data?.subjects)) {
        data.subjects.forEach((row, pi) => {
          if (pi < MAX_PERIODS && Array.isArray(row))
            row.forEach((s, di) => { if (di < 5) mergedSubj[pi][di] = s ?? ""; });
        });
      }
      setSubjects(mergedSubj);
      savedSubjectsRef.current = mergedSubj.map((r) => [...r]);

      // teachers
      const mergedTeacher = makeEmpty();
      if (Array.isArray(data?.teachers)) {
        data.teachers.forEach((row, pi) => {
          if (pi < MAX_PERIODS && Array.isArray(row))
            row.forEach((t, di) => { if (di < 5) mergedTeacher[pi][di] = t ?? ""; });
        });
      }
      setTeachers(mergedTeacher);
    } catch (err) {
      console.error("시간표 불러오기 실패:", err);
      setSubjects(makeEmpty());
      setTeachers(makeEmpty());
      savedSubjectsRef.current = makeEmpty();
    } finally {
      setLoading(false);
    }
  }, [grade, classNum]);

  useEffect(() => {
    loadTimetable();
    loadChangeLog();
  }, [loadTimetable, loadChangeLog]);

  const handleSubjectChange = (pi, di, value) =>
    setSubjects((prev) => {
      const next = prev.map((r) => [...r]);
      next[pi][di] = value;
      return next;
    });

  const handleTeacherChange = (pi, di, value) =>
    setTeachers((prev) => {
      const next = prev.map((r) => [...r]);
      next[pi][di] = value;
      return next;
    });

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      await saveBaseTimetable(grade, classNum, subjects, adminName, teachers);
      savedSubjectsRef.current = subjects.map((r) => [...r]);
      setMessage({ type: "success", text: `${grade}학년 ${classNum}반 기본 시간표가 저장되었습니다.` });
      await loadChangeLog();
    } catch (err) {
      setMessage({ type: "error", text: err?.message ?? "저장 중 오류가 발생했습니다." });
    } finally {
      setSaving(false);
    }
  };

  const handleClear = () => {
    if (!window.confirm(`${grade}학년 ${classNum}반 시간표를 모두 초기화할까요?`)) return;
    setSubjects(makeEmpty());
    setTeachers(makeEmpty());
  };

  return (
    <div>
      <div className="admin-section">
        <h3>📅 기본 시간표 관리</h3>
        <p style={{ color: "#64748b", marginBottom: "20px", fontSize: "0.9rem" }}>
          학년·반별 기본 시간표와 교시별 담당 교사를 입력하세요.
          각 교시에 과목과 선생님을 입력하면 학생 시간표에 그대로 표시됩니다.
        </p>

        {/* 학년/반 선택 */}
        <div className="tt-admin-selector">
          <div className="tt-admin-selector-group">
            <span className="tt-admin-selector-label">학년</span>
            {GRADES.map((g) => (
              <button key={g}
                className={`tt-admin-cls-btn ${grade === g ? "active" : ""}`}
                onClick={() => setGrade(g)}
              >{g}학년</button>
            ))}
          </div>
          <div className="tt-admin-selector-group">
            <span className="tt-admin-selector-label">반</span>
            {Array.from({ length: MAX_CLASSES }, (_, i) => i + 1).map((c) => (
              <button key={c}
                className={`tt-admin-cls-btn ${classNum === c ? "active" : ""}`}
                onClick={() => setClassNum(c)}
              >{c}반</button>
            ))}
          </div>
          <div className="tt-admin-selector-group">
            <span className="tt-admin-dept-badge">🏫 {getDepartmentLabel(grade, classNum)}</span>
          </div>
        </div>

        {/* 시간표 그리드 */}
        {loading ? (
          <p style={{ textAlign: "center", padding: "40px 0", color: "#94a3b8" }}>불러오는 중...</p>
        ) : (
          <>
            {optionsLoading && (
              <p style={{ fontSize: "0.82rem", color: "#94a3b8", marginBottom: "8px" }}>
                ⏳ NEIS에서 {grade}학년 과목 목록을 불러오는 중...
              </p>
            )}
            {!optionsLoading && subjectOptions.length > 0 && (
              <p style={{ fontSize: "0.82rem", color: "#64748b", marginBottom: "8px" }}>
                📚 NEIS 과목 {subjectOptions.length}개 로드됨 — 드롭다운에서 선택하세요
              </p>
            )}
            <div className="tt-admin-table-wrapper">
              <table className="tt-admin-table tt-admin-table-with-teacher">
                <thead>
                  <tr>
                    <th className="tt-admin-period-header">교시</th>
                    {DAY_NAMES.map((d) => (
                      <th key={d} className="tt-admin-day-header">{d}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {subjects.map((row, pi) => (
                    <tr key={pi} className={pi % 2 === 1 ? "even" : ""}>
                      <td className="tt-admin-period-cell">{pi + 1}교시</td>
                      {row.map((subj, di) => {
                        const isDirty = subj !== (savedSubjectsRef.current?.[pi]?.[di] ?? "");
                        const extraOption = subj && !subjectOptions.includes(subj) ? subj : null;
                        const teacher = teachers[pi]?.[di] ?? "";
                        const teacherOptions = subj ? (subjectTeacherMap[subj] ?? []) : [];
                        const extraTeacher = teacher && !teacherOptions.includes(teacher) ? teacher : null;
                        // 교사가 1명 이상이면 드롭다운 표시
                        const needTeacherSelect = teacherOptions.length >= 1 || !!extraTeacher;

                        return (
                          <td key={di} className="tt-admin-subject-cell">
                            <div className="tt-admin-cell-with-teacher">
                              {/* 과목 선택 */}
                              <select
                                className={`tt-admin-select ${isDirty ? "dirty" : ""}`}
                                value={subj}
                                onChange={(e) => {
                                  handleSubjectChange(pi, di, e.target.value);
                                  handleTeacherChange(pi, di, "");
                                }}
                              >
                                <option value="">-</option>
                                {extraOption && <option value={extraOption}>{extraOption}</option>}
                                {subjectOptions.map((s) => (
                                  <option key={s} value={s}>{s}</option>
                                ))}
                              </select>
                              {/* 교사 드롭다운 — 2명 이상일 때만 표시 */}
                              {needTeacherSelect && (
                                <select
                                  className="tt-admin-select tt-admin-teacher-select"
                                  value={teacher}
                                  onChange={(e) => handleTeacherChange(pi, di, e.target.value)}
                                >
                                  <option value="">선생님 선택</option>
                                  {extraTeacher && <option value={extraTeacher}>{extraTeacher}</option>}
                                  {teacherOptions.map((t) => (
                                    <option key={t} value={t}>{t}</option>
                                  ))}
                                </select>
                              )}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {message && (
          <div className={`tt-admin-msg ${message.type}`}>
            {message.type === "success" ? "✅ " : "❌ "}{message.text}
          </div>
        )}

        <div className="tt-admin-actions">
          <button className="tt-admin-btn-clear" onClick={handleClear} disabled={saving || loading}>초기화</button>
          <button className="tt-admin-btn-save btn-submit" onClick={handleSave} disabled={saving || loading}>
            {saving ? "저장 중..." : "기본 시간표 저장"}
          </button>
        </div>
      </div>

      {/* 변경 이력 */}
      <div className="admin-section" style={{ marginTop: "24px" }}>
        <h3>🕓 변경 이력 <span style={{ fontSize: "0.8rem", fontWeight: 500, color: "#94a3b8" }}>최근 30건</span></h3>
        {logLoading ? (
          <p style={{ textAlign: "center", padding: "24px 0", color: "#94a3b8" }}>불러오는 중...</p>
        ) : changeLog.length === 0 ? (
          <p style={{ textAlign: "center", padding: "24px 0", color: "#cbd5e1", fontSize: "0.9rem" }}>아직 변경 이력이 없습니다.</p>
        ) : (
          <div className="admin-table-wrapper">
            <table className="admin-table tt-log-table">
              <thead>
                <tr>
                  <th>날짜/시간</th><th>학년/반</th><th>요일</th><th>교시</th>
                  <th>변경 전</th><th>변경 후</th><th>관리자</th>
                </tr>
              </thead>
              <tbody>
                {changeLog.map((log) => (
                  <tr key={log.id}>
                    <td className="tt-log-date">{formatDateTime(log.changedAt)}</td>
                    <td>{log.grade}학년 {log.classNum}반</td>
                    <td>{dayName(log.dayIdx)}</td>
                    <td>{log.period}교시</td>
                    <td><span className="tt-log-before">{log.before || "-"}</span></td>
                    <td><span className="tt-log-after">{log.after || "-"}</span></td>
                    <td className="tt-log-admin">{log.adminName}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
