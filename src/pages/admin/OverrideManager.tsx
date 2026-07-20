import React, { useState, useEffect, useCallback, useMemo } from "react";
import { getWeekTimetable } from "../../api/NeisApi";
import {
  getPublicBaseTimetable,
  getPublicTeacherMap,
  getOverrides,
  saveOverride,
  saveBaseOverride,
} from "../../api/timetableApi";

const GRADES = [1, 2, 3];
const MAX_CLASSES = 4;
const MAX_PERIODS = 7;
const DAY_NAMES = ["월", "화", "수", "목", "금"];

const BASE_OVERRIDE_PRESETS = [
  { label: "수업없음", value: "" },
  { label: "시험", value: "시험" },
  { label: "자습", value: "자습" },
];

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

function weekLabel(days: string[]) {
  const s = days[0], e = days[4];
  return `${s.slice(0, 4)}년 ${parseInt(s.slice(4, 6))}월 ${parseInt(s.slice(6, 8))}일 ~ ${parseInt(e.slice(4, 6))}월 ${parseInt(e.slice(6, 8))}일`;
}

function formatDate(ymd: string) {
  return `${parseInt(ymd.slice(4, 6))}/${parseInt(ymd.slice(6, 8))}`;
}

export default function OverrideManager() {
  const [grade, setGrade] = useState(1);
  const [classNum, setClassNum] = useState(1);
  const [selectedDate, setSelectedDate] = useState(new Date());

  const weekDays = useMemo(() => getWeekDays(selectedDate), [selectedDate]);
  const weekFrom = weekDays[0];
  const weekTo = weekDays[4];

  interface OverrideRecord { id?: number; teacher: string; overrideSubject: string | null | undefined; }
  interface StatusMessage { type: string; text: string; }

  const [baseTimetable, setBaseTimetable] = useState<import("../../api/timetableApi").BaseTimetableData | null>(null);
  const [neisTimetable, setNeisTimetable] = useState<Record<string, Array<{ period: number; subject: string }>>>({});
  const [teacherMap, setTeacherMap] = useState<Record<string, string[]>>({});   // subject → string[]
  const [savedOverrides, setSavedOverrides] = useState<Record<string, OverrideRecord>>({}); // "date_period" → { id, teacher, overrideSubject }
  // 입력값 (NEIS 변경 교시): { "date_period": string } → teacher
  const [inputs, setInputs] = useState<Record<string, string>>({});
  // 입력값 (기본 시간표 수정): { "date_period": string } → overrideSubject
  const [baseInputs, setBaseInputs] = useState<Record<string, string>>({});

  const [loading, setLoading] = useState(false);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [message, setMessage] = useState<StatusMessage | null>(null);
  const [baseMessage, setBaseMessage] = useState<StatusMessage | null>(null);

  const key = (date: string, period: number) => `${date}_${period}`;

  const load = useCallback(async () => {
    setLoading(true);
    setMessage(null);
    setBaseMessage(null);
    try {
      const [base, neis, teacherRes, overrides] = await Promise.all([
        getPublicBaseTimetable(grade, classNum),
        getWeekTimetable(grade, classNum, weekFrom, weekTo).catch(() => ({})),
        getPublicTeacherMap(grade, classNum).catch(() => null),
        getOverrides(grade, classNum, weekFrom, weekTo).catch(() => []),
      ]);

      setBaseTimetable(base);
      setNeisTimetable((neis ?? {}) as Record<string, Array<{ period: number; subject: string }>>);
      setTeacherMap(teacherRes?.teacherMap ?? {});

      interface OverrideItem { date: string; period: number; id?: number; teacher?: string; overrideSubject?: string | null; }
      const saved: Record<string, OverrideRecord> = {};
      ((overrides ?? []) as OverrideItem[]).forEach((o) => {
        saved[key(o.date, o.period)] = {
          id: o.id,
          teacher: o.teacher ?? "",
          overrideSubject: o.overrideSubject,  // null | "" | "시험" 등
        };
      });
      setSavedOverrides(saved);

      // 입력값 초기화
      const initInputs: Record<string, string> = {};
      const initBaseInputs: Record<string, string> = {};
      ((overrides ?? []) as OverrideItem[]).forEach((o) => {
        const k = key(o.date, o.period);
        if (o.overrideSubject !== null && o.overrideSubject !== undefined) {
          // 기본 시간표 수정 오버라이드
          initBaseInputs[k] = o.overrideSubject ?? "";
        } else {
          // NEIS 변경 교시 교사 등록
          initInputs[k] = o.teacher ?? "";
        }
      });
      setInputs(initInputs);
      setBaseInputs(initBaseInputs);
    } catch (e) {
      setMessage({ type: "error", text: "데이터 로드 실패: " + ((e as Error)?.message ?? "") });
    } finally {
      setLoading(false);
    }
  }, [grade, classNum, weekFrom, weekTo]);

  useEffect(() => { load(); }, [load]);

  type ChangedSlot = { date: string; dayIdx: number; period: number; baseSubject: string; neisSubject: string; key: string; };
  type BaseOnlySlot = { date: string; dayIdx: number; period: number; baseSubject: string; key: string; };

  // 변경된 교시 목록 계산 (NEIS vs 기본)
  const changedSlots = useMemo<ChangedSlot[]>(() => {
    if (!baseTimetable) return [];
    const result: ChangedSlot[] = [];
    weekDays.forEach((date, dayIdx) => {
      const neisSlots = neisTimetable[date] ?? [];
      for (let p = 1; p <= MAX_PERIODS; p++) {
        const baseSubject = baseTimetable?.subjects?.[p - 1]?.[dayIdx] ?? "";
        const neisSlot = neisSlots.find((s) => s.period === p);
        const neisSubject = neisSlot?.subject ?? "";
        if (neisSubject && baseSubject && neisSubject !== baseSubject) {
          const k = key(date, p);
          result.push({ date, dayIdx, period: p, baseSubject, neisSubject, key: k });
        }
      }
    });
    return result;
  }, [baseTimetable, neisTimetable, weekDays]);

  // 기본 시간표 기준(NEIS 미등록) 교시 목록 계산
  const baseOnlySlots = useMemo<BaseOnlySlot[]>(() => {
    if (!baseTimetable) return [];
    const result: BaseOnlySlot[] = [];
    weekDays.forEach((date, dayIdx) => {
      const neisSlots = neisTimetable[date] ?? [];
      for (let p = 1; p <= MAX_PERIODS; p++) {
        const baseSubject = baseTimetable?.subjects?.[p - 1]?.[dayIdx] ?? "";
        const neisSlot = neisSlots.find((s) => s.period === p);
        const neisSubject = neisSlot?.subject ?? "";
        // base-only: 기본 시간표에만 있고 NEIS에는 없는 교시
        if (baseSubject && !neisSubject) {
          const k = key(date, p);
          result.push({ date, dayIdx, period: p, baseSubject, key: k });
        }
      }
    });
    return result;
  }, [baseTimetable, neisTimetable, weekDays]);

  // NEIS 변경 교시 교사 저장
  const handleSave = async (slot: ChangedSlot) => {
    const { date, period, neisSubject, key: k } = slot;
    const teacher = (inputs[k] ?? "").trim();
    setSavingKey(k);
    setMessage(null);
    try {
      await saveOverride(grade, classNum, date, period, neisSubject, teacher);
      setSavedOverrides((prev) => {
        const next = { ...prev };
        if (teacher) next[k] = { teacher, overrideSubject: null };
        else delete next[k];
        return next;
      });
      setMessage({
        type: "success",
        text: `${DAY_NAMES[slot.dayIdx]}요일 ${period}교시 (${neisSubject}) ${teacher ? `"${teacher}" 저장 완료` : "교사 등록 취소"}`,
      });
    } catch (e) {
      setMessage({ type: "error", text: (e as Error)?.message ?? "저장 실패" });
    } finally {
      setSavingKey(null);
    }
  };

  // 기본 시간표 수정 저장
  const handleBaseOverrideSave = async (slot: BaseOnlySlot, overrideSubject: string | undefined) => {
    const { date, period, baseSubject, key: k } = slot;
    setSavingKey("base_" + k);
    setBaseMessage(null);
    try {
      await saveBaseOverride(grade, classNum, date, period, overrideSubject);
      setSavedOverrides((prev) => {
        const next = { ...prev };
        if (overrideSubject !== undefined) {
          next[k] = { teacher: "", overrideSubject };
        } else {
          delete next[k];
        }
        return next;
      });
      const label = overrideSubject === undefined
        ? "초기화됨"
        : overrideSubject === ""
        ? '"수업없음"으로 설정됨'
        : `"${overrideSubject}"으로 설정됨`;
      setBaseMessage({
        type: "success",
        text: `${DAY_NAMES[slot.dayIdx]}요일 ${period}교시 (${baseSubject}) ${label}`,
      });
    } catch (e) {
      setBaseMessage({ type: "error", text: (e as Error)?.message ?? "저장 실패" });
    } finally {
      setSavingKey(null);
    }
  };

  const handleWeekMove = (delta: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + delta * 7);
    setSelectedDate(d);
  };

  const todayStr = useMemo(() => toYMD(new Date()), []);

  return (
    <div>
      {/* ── NEIS 변경 교시 교사 등록 ── */}
      <div className="admin-section">
        <h3>📝 변경 교시 교사 등록</h3>
        <p style={{ color: "#64748b", marginBottom: 12, fontSize: "0.9rem" }}>
          나이스에서 변경된 수업의 담당 교사를 등록하세요. 저장하면 학생 시간표에 즉시 반영됩니다.
          교사를 비워서 저장하면 등록이 취소됩니다.
        </p>

        {/* 안내 */}
        <div className="ov-guide">
          <div className="ov-guide-item">
            <span className="ov-badge-changed">변경</span>
            <span>나이스 기준으로 수업이 바뀐 교시만 표시됩니다</span>
          </div>
          <div className="ov-guide-item">
            <span className="ov-guide-saved">✓ 저장됨</span>
            <span>이미 교사가 등록된 교시 — 학생 시간표에 표시 중</span>
          </div>
          <div className="ov-guide-item">
            <span style={{ fontSize: "0.78rem", color: "#94a3b8" }}>드롭다운</span>
            <span>해당 과목에 등록된 교사 목록에서 선택 가능, 직접 입력도 됩니다</span>
          </div>
        </div>

        {/* 학년/반/주 선택 */}
        <div className="tt-admin-selector" style={{ marginBottom: 16 }}>
          <div className="tt-admin-selector-group">
            <span className="tt-admin-selector-label">학년</span>
            {GRADES.map((g) => (
              <button key={g} className={`tt-admin-cls-btn ${grade === g ? "active" : ""}`}
                onClick={() => setGrade(g)}>{g}학년</button>
            ))}
          </div>
          <div className="tt-admin-selector-group">
            <span className="tt-admin-selector-label">반</span>
            {Array.from({ length: MAX_CLASSES }, (_, i) => i + 1).map((c) => (
              <button key={c} className={`tt-admin-cls-btn ${classNum === c ? "active" : ""}`}
                onClick={() => setClassNum(c)}>{c}반</button>
            ))}
          </div>
          <div className="tt-admin-selector-group" style={{ alignItems: "center", gap: 8 }}>
            <button className="tt-admin-cls-btn" onClick={() => handleWeekMove(-1)}>◀</button>
            <span style={{ fontSize: "0.85rem", color: "#475569", fontWeight: 600 }}>{weekLabel(weekDays)}</span>
            <button className="tt-admin-cls-btn" onClick={() => handleWeekMove(1)}>▶</button>
          </div>
        </div>

        {message && (
          <div className={`tt-admin-msg ${message.type}`} style={{ marginBottom: 12 }}>
            {message.type === "success" ? "✅ " : "❌ "}{message.text}
          </div>
        )}

        {loading ? (
          <p style={{ textAlign: "center", padding: "40px 0", color: "#94a3b8" }}>불러오는 중...</p>
        ) : changedSlots.length === 0 ? (
          <div className="ov-empty-state">
            <span style={{ fontSize: "1.5rem" }}>✅</span>
            <p>이번 주 {grade}학년 {classNum}반은 변경된 수업이 없습니다.</p>
            <p style={{ fontSize: "0.82rem", color: "#94a3b8" }}>나이스 시간표와 기본 시간표가 일치합니다.</p>
          </div>
        ) : (
          <div className="ov-list">
            {changedSlots.map((slot) => {
              const { date, dayIdx, period, baseSubject, neisSubject, key: k } = slot;
              const isSaved = !!savedOverrides[k]?.teacher;
              const isSaving = savingKey === k;
              const isToday = date === todayStr;
              const teacherOptions = teacherMap[neisSubject] ?? [];

              return (
                <div key={k} className={`ov-row ${isSaved ? "ov-row-saved" : ""} ${isToday ? "ov-row-today" : ""}`}>
                  <div className="ov-row-meta">
                    <span className={`ov-row-day ${isToday ? "today" : ""}`}>
                      {DAY_NAMES[dayIdx]}
                      {isToday && <span className="tt-today-badge" style={{ marginLeft: 4 }}>오늘</span>}
                    </span>
                    <span className="ov-row-date">{formatDate(date)}</span>
                    <span className="ov-row-period">{period}교시</span>
                  </div>

                  <div className="ov-row-change">
                    <span className="ov-row-before">{baseSubject}</span>
                    <span className="ov-row-arrow">→</span>
                    <span className="ov-row-after">{neisSubject}</span>
                    <span className="ov-badge-changed">변경</span>
                  </div>

                  <div className="ov-row-teacher">
                    <label className="ov-row-teacher-label">담당 교사</label>
                    <div className="ov-input-row">
                      {teacherOptions.length > 0 ? (
                        <>
                          <datalist id={`tl-${k}`}>
                            {teacherOptions.map((t) => <option key={t} value={t} />)}
                          </datalist>
                          <input
                            type="text"
                            list={`tl-${k}`}
                            className={`ov-teacher-input ${isSaved ? "ov-saved" : ""}`}
                            placeholder={`${teacherOptions.slice(0, 2).join(" / ")} 등`}
                            value={inputs[k] ?? ""}
                            onChange={(e) => setInputs((p) => ({ ...p, [k]: e.target.value }))}
                            onKeyDown={(e) => e.key === "Enter" && handleSave(slot)}
                          />
                        </>
                      ) : (
                        <input
                          type="text"
                          className={`ov-teacher-input ${isSaved ? "ov-saved" : ""}`}
                          placeholder="교사 이름 직접 입력"
                          value={inputs[k] ?? ""}
                          onChange={(e) => setInputs((p) => ({ ...p, [k]: e.target.value }))}
                          onKeyDown={(e) => e.key === "Enter" && handleSave(slot)}
                        />
                      )}
                      <button
                        className={`ov-save-btn ${isSaved ? "saved" : ""}`}
                        disabled={isSaving}
                        onClick={() => handleSave(slot)}
                      >
                        {isSaving ? "…" : isSaved ? "✓ 저장됨" : "저장"}
                      </button>
                    </div>
                    {isSaved && (
                      <div className="ov-row-saved-info">
                        학생 시간표에 <strong>{savedOverrides[k]?.teacher}</strong> 표시 중
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── 기본 시간표 수정 ── */}
      <div className="admin-section" style={{ marginTop: "24px" }}>
        <h3>📋 기본 시간표 수정</h3>
        <p style={{ color: "#64748b", marginBottom: 12, fontSize: "0.9rem" }}>
          나이스에 등록되지 않은 교시(기본 시간표 기준)를 수정하세요.
          시험·자습·수업없음 등으로 표시하거나, 초기화하면 기본 시간표로 돌아갑니다.
        </p>

        <div className="ov-guide">
          <div className="ov-guide-item">
            <span className="tt-legend-dot base-only" style={{ display: "inline-block", width: 10, height: 10, borderRadius: "50%", background: "#cbd5e1", marginRight: 4 }} />
            <span>기본 시간표 기준 — 나이스 미등록 교시</span>
          </div>
          <div className="ov-guide-item">
            <span className="ov-guide-saved">✓ 저장됨</span>
            <span>수정이 적용된 교시 — 학생 시간표에 즉시 반영</span>
          </div>
        </div>

        {baseMessage && (
          <div className={`tt-admin-msg ${baseMessage.type}`} style={{ marginBottom: 12 }}>
            {baseMessage.type === "success" ? "✅ " : "❌ "}{baseMessage.text}
          </div>
        )}

        {loading ? null : baseOnlySlots.length === 0 ? (
          <div className="ov-empty-state">
            <span style={{ fontSize: "1.5rem" }}>📭</span>
            <p>이번 주 {grade}학년 {classNum}반은 기본 시간표 기준 교시가 없습니다.</p>
            <p style={{ fontSize: "0.82rem", color: "#94a3b8" }}>모든 교시가 나이스에 등록되어 있습니다.</p>
          </div>
        ) : (
          <div className="ov-list">
            {baseOnlySlots.map((slot) => {
              const { date, dayIdx, period, baseSubject, key: k } = slot;
              const saved = savedOverrides[k];
              // base override인 경우: overrideSubject가 null이 아닌 것 (undefined가 아닌 것)
              const hasBaseOverride = saved && saved.overrideSubject !== null && saved.overrideSubject !== undefined;
              const savedOverrideSubject = hasBaseOverride ? saved.overrideSubject : undefined;
              const isSaving = savingKey === "base_" + k;
              const isToday = date === todayStr;

              const currentInput = baseInputs[k];

              return (
                <div key={k} className={`ov-row ${hasBaseOverride ? "ov-row-saved" : ""} ${isToday ? "ov-row-today" : ""}`}>
                  <div className="ov-row-meta">
                    <span className={`ov-row-day ${isToday ? "today" : ""}`}>
                      {DAY_NAMES[dayIdx]}
                      {isToday && <span className="tt-today-badge" style={{ marginLeft: 4 }}>오늘</span>}
                    </span>
                    <span className="ov-row-date">{formatDate(date)}</span>
                    <span className="ov-row-period">{period}교시</span>
                  </div>

                  <div className="ov-row-change">
                    <span className="ov-row-before">{baseSubject}</span>
                    <span className="ov-row-arrow">→</span>
                    {hasBaseOverride ? (
                      savedOverrideSubject === ""
                        ? <span className="ov-row-after" style={{ color: "#94a3b8" }}>수업없음</span>
                        : <span className="ov-row-after">{savedOverrideSubject}</span>
                    ) : (
                      <span style={{ color: "#94a3b8", fontSize: "0.82rem" }}>미수정</span>
                    )}
                  </div>

                  <div className="ov-row-teacher">
                    <label className="ov-row-teacher-label">수정 내용</label>
                    <div className="ov-base-preset-row">
                      {BASE_OVERRIDE_PRESETS.map((preset) => (
                        <button
                          key={preset.label}
                          className={`ov-preset-btn ${(currentInput !== undefined ? currentInput : savedOverrideSubject) === preset.value && hasBaseOverride ? "active" : ""}`}
                          onClick={() => {
                            setBaseInputs((p) => ({ ...p, [k]: preset.value }));
                            handleBaseOverrideSave(slot, preset.value);
                          }}
                          disabled={isSaving}
                        >
                          {preset.label}
                        </button>
                      ))}
                      {/* 직접 입력 */}
                      <div className="ov-input-row" style={{ flex: 1 }}>
                        <input
                          type="text"
                          className={`ov-teacher-input ${hasBaseOverride && savedOverrideSubject && !BASE_OVERRIDE_PRESETS.some(p => p.value === savedOverrideSubject) ? "ov-saved" : ""}`}
                          placeholder="직접 입력 (예: 보충수업)"
                          value={currentInput !== undefined && !BASE_OVERRIDE_PRESETS.some(p => p.value === currentInput) ? currentInput : ""}
                          onChange={(e) => setBaseInputs((p) => ({ ...p, [k]: e.target.value }))}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && (baseInputs[k] ?? "").trim()) {
                              handleBaseOverrideSave(slot, (baseInputs[k] ?? "").trim());
                            }
                          }}
                        />
                        <button
                          className="ov-save-btn"
                          disabled={isSaving || !(baseInputs[k] ?? "").trim() || BASE_OVERRIDE_PRESETS.some(p => p.value === (baseInputs[k] ?? ""))}
                          onClick={() => {
                            const v = (baseInputs[k] ?? "").trim();
                            if (v) handleBaseOverrideSave(slot, v);
                          }}
                        >
                          {isSaving ? "…" : "저장"}
                        </button>
                      </div>
                    </div>
                    {hasBaseOverride && (
                      <div className="ov-row-saved-info" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span>
                          학생 시간표에{" "}
                          <strong>{savedOverrideSubject === "" ? "수업없음(공란)" : savedOverrideSubject}</strong>
                          으로 표시 중
                        </span>
                        <button
                          className="ov-reset-btn"
                          disabled={isSaving}
                          onClick={() => {
                            setBaseInputs((p) => { const next = { ...p }; delete next[k]; return next; });
                            handleBaseOverrideSave(slot, undefined);
                          }}
                        >
                          초기화
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
