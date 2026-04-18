import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  getBaseTimetable,
  saveBaseTimetable,
  getChangeLog,
  dayName,
} from "../../api/timetableApi";
import { getUser } from "../../api/auth";
import { getGradeSubjects } from "../../api/NeisApi";

const DAY_NAMES = ["월", "화", "수", "목", "금"];
const MAX_PERIODS = 7;
const GRADES = [1, 2, 3];
const MAX_CLASSES = 4;

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
  const [subjectOptions, setSubjectOptions] = useState([]); // NEIS에서 불러온 과목 목록
  const [optionsLoading, setOptionsLoading] = useState(false);
  const [adminName, setAdminName] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [changeLog, setChangeLog] = useState([]);
  const [logLoading, setLogLoading] = useState(false);

  // 저장 직전 Firestore에 있던 subjects (변경 전 비교용)
  const savedSubjectsRef = useRef(makeEmpty());

  // 관리자 이름 로드
  useEffect(() => {
    getUser().then((u) => { if (u?.name) setAdminName(u.name); });
  }, []);

  // 학년 변경 시 NEIS에서 과목 목록 불러오기
  useEffect(() => {
    setOptionsLoading(true);
    setSubjectOptions([]);
    getGradeSubjects(grade)
      .then(setSubjectOptions)
      .catch(() => setSubjectOptions([]))
      .finally(() => setOptionsLoading(false));
  }, [grade]);

  const loadChangeLog = useCallback(async () => {
    setLogLoading(true);
    try {
      const logs = await getChangeLog(grade, classNum, 30);
      setChangeLog(logs);
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
      const merged = makeEmpty();
      if (Array.isArray(data)) {
        data.forEach((row, pi) => {
          if (pi < MAX_PERIODS && Array.isArray(row)) {
            row.forEach((subj, di) => {
              if (di < 5) merged[pi][di] = subj ?? "";
            });
          }
        });
      }
      setSubjects(merged);
      savedSubjectsRef.current = merged.map((row) => [...row]);
    } catch (err) {
      console.error("시간표 불러오기 실패:", err);
      setSubjects(makeEmpty());
      savedSubjectsRef.current = makeEmpty();
      if (err?.code === "permission-denied") {
        setMessage({ type: "error", text: "Firestore 권한 오류 — Firebase Console에서 보안 규칙을 확인하세요." });
      }
    } finally {
      setLoading(false);
    }
  }, [grade, classNum]);

  useEffect(() => {
    loadTimetable();
    loadChangeLog();
  }, [loadTimetable, loadChangeLog]);

  const handleChange = (periodIdx, dayIdx, value) => {
    setSubjects((prev) => {
      const next = prev.map((row) => [...row]);
      next[periodIdx][dayIdx] = value;
      return next;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      await saveBaseTimetable(grade, classNum, subjects, adminName);
      // 저장 성공 후 savedSubjectsRef 갱신
      savedSubjectsRef.current = subjects.map((row) => [...row]);
      setMessage({ type: "success", text: `${grade}학년 ${classNum}반 기본 시간표가 저장되었습니다.` });
      // 이력 새로고침
      await loadChangeLog();
    } catch (err) {
      console.error("시간표 저장 실패:", err);
      const msg = err?.code === "permission-denied"
        ? "Firestore 권한 오류 — Firebase Console에서 보안 규칙을 확인하세요."
        : err?.message
          ? `저장 실패: ${err.message}`
          : "저장 중 오류가 발생했습니다. 다시 시도해주세요.";
      setMessage({ type: "error", text: msg });
    } finally {
      setSaving(false);
    }
  };

  const handleClear = () => {
    if (!window.confirm(`${grade}학년 ${classNum}반 시간표를 모두 초기화할까요?`)) return;
    setSubjects(makeEmpty());
  };

  return (
    <div>
      <div className="admin-section">
        <h3>📅 기본 시간표 관리</h3>
        <p style={{ color: "#64748b", marginBottom: "20px", fontSize: "0.9rem" }}>
          학년·반별 기본 시간표를 설정하면, 학생 페이지에서 NEIS 시간표와 비교해 변경된 칸을 노란색으로 표시합니다.
        </p>

        {/* 학년/반 선택 */}
        <div className="tt-admin-selector">
          <div className="tt-admin-selector-group">
            <span className="tt-admin-selector-label">학년</span>
            {GRADES.map((g) => (
              <button
                key={g}
                className={`tt-admin-cls-btn ${grade === g ? "active" : ""}`}
                onClick={() => setGrade(g)}
              >
                {g}학년
              </button>
            ))}
          </div>
          <div className="tt-admin-selector-group">
            <span className="tt-admin-selector-label">반</span>
            {Array.from({ length: MAX_CLASSES }, (_, i) => i + 1).map((c) => (
              <button
                key={c}
                className={`tt-admin-cls-btn ${classNum === c ? "active" : ""}`}
                onClick={() => setClassNum(c)}
              >
                {c}반
              </button>
            ))}
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
                  {subjects.map((row, periodIdx) => (
                    <tr key={periodIdx} className={periodIdx % 2 === 1 ? "even" : ""}>
                      <td className="tt-admin-period-cell">{periodIdx + 1}교시</td>
                      {row.map((subj, dayIdx) => {
                        const isDirty = subj !== (savedSubjectsRef.current?.[periodIdx]?.[dayIdx] ?? "");
                        // 저장된 값이 드롭다운 목록에 없으면 직접 추가
                        const extraOption = subj && !subjectOptions.includes(subj) ? subj : null;
                        return (
                          <td key={dayIdx} className="tt-admin-subject-cell">
                            <select
                              className={`tt-admin-select ${isDirty ? "dirty" : ""}`}
                              value={subj}
                              onChange={(e) => handleChange(periodIdx, dayIdx, e.target.value)}
                            >
                              <option value="">-</option>
                              {extraOption && (
                                <option value={extraOption}>{extraOption}</option>
                              )}
                              {subjectOptions.map((s) => (
                                <option key={s} value={s}>{s}</option>
                              ))}
                            </select>
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

        {/* 피드백 메시지 */}
        {message && (
          <div className={`tt-admin-msg ${message.type}`}>
            {message.type === "success" ? "✅ " : "❌ "}{message.text}
          </div>
        )}

        {/* 버튼 영역 */}
        <div className="tt-admin-actions">
          <button className="tt-admin-btn-clear" onClick={handleClear} disabled={saving || loading}>
            초기화
          </button>
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
          <p style={{ textAlign: "center", padding: "24px 0", color: "#cbd5e1", fontSize: "0.9rem" }}>
            아직 변경 이력이 없습니다.
          </p>
        ) : (
          <div className="admin-table-wrapper">
            <table className="admin-table tt-log-table">
              <thead>
                <tr>
                  <th>날짜/시간</th>
                  <th>학년/반</th>
                  <th>요일</th>
                  <th>교시</th>
                  <th>변경 전</th>
                  <th>변경 후</th>
                  <th>관리자</th>
                </tr>
              </thead>
              <tbody>
                {changeLog.map((log) => (
                  <tr key={log.id}>
                    <td className="tt-log-date">{formatDateTime(log.changedAt)}</td>
                    <td>{log.grade}학년 {log.classNum}반</td>
                    <td>{dayName(log.dayIdx)}</td>
                    <td>{log.period}교시</td>
                    <td>
                      <span className="tt-log-before">{log.before || "-"}</span>
                    </td>
                    <td>
                      <span className="tt-log-after">{log.after || "-"}</span>
                    </td>
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
