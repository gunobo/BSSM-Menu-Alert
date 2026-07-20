import React, { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import {
  getTeacherMap, saveTeacherMap, getTeacherRoster, getGradeSubjectsFromBackend,
  type TeacherRosterEntry,
} from "../../api/timetableApi";

const GRADES = [1, 2, 3];
const CLASS_NUMS = [1, 2, 3, 4]; // 저장 시 모든 반에 동일하게 적용 (내부용)

interface StatusMessage { type: string; text: string; }

// ─── 태그 방식 교사 멀티 선택 컴포넌트 ──────────────────────────────
function TeacherTagSelect({ value = [] as string[], onChange, roster = [] as TeacherRosterEntry[] }: {
  value?: string[];
  onChange: (tags: string[]) => void;
  roster?: TeacherRosterEntry[];
}) {
  const [open, setOpen] = useState(false);
  const [inputVal, setInputVal] = useState("");
  const [dropPos, setDropPos] = useState({ top: 0, left: 0, width: 0 });
  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const rosterNames = roster.map((r) => r.name);

  const calcPos = () => {
    if (wrapRef.current) {
      const r = wrapRef.current.getBoundingClientRect();
      setDropPos({ top: r.bottom + 4, left: r.left, width: Math.max(r.width, 180) });
    }
  };

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (!open) return;
    const handler = () => calcPos();
    window.addEventListener("scroll", handler, true);
    window.addEventListener("resize", handler);
    return () => {
      window.removeEventListener("scroll", handler, true);
      window.removeEventListener("resize", handler);
    };
  }, [open]);

  const addTeacher = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed || value.includes(trimmed)) return;
    onChange([...value, trimmed]);
    setInputVal("");
  };

  const removeTeacher = (name: string) => onChange(value.filter((t) => t !== name));

  const suggestions = rosterNames
    .filter((n) => !value.includes(n) && n.includes(inputVal))
    .slice(0, 10);
  const showAddNew = inputVal.trim() && !rosterNames.includes(inputVal.trim()) && !value.includes(inputVal.trim());

  const dropdown = (open && (suggestions.length > 0 || showAddNew))
    ? createPortal(
        <div
          className="tm-dropdown"
          style={{ position: "fixed", top: dropPos.top, left: dropPos.left, width: dropPos.width, zIndex: 9999 }}
        >
          {suggestions.map((name) => (
            <div key={name} className="tm-dropdown-item"
              onMouseDown={(e) => { e.preventDefault(); addTeacher(name); }}>
              {name}
            </div>
          ))}
          {showAddNew && (
            <div className="tm-dropdown-item tm-dropdown-new"
              onMouseDown={(e) => { e.preventDefault(); addTeacher(inputVal); }}>
              ＋ "{inputVal.trim()}" 직접 추가
            </div>
          )}
        </div>,
        document.body
      )
    : null;

  return (
    <>
      <div className="tm-tag-wrap" ref={wrapRef}>
        <div className="tm-tags" onClick={() => { calcPos(); setOpen(true); inputRef.current?.focus(); }}>
          {value.map((t) => (
            <span key={t} className="tm-tag">
              {t}
              <button className="tm-tag-remove" tabIndex={-1}
                onClick={(e) => { e.stopPropagation(); removeTeacher(t); }}>×</button>
            </span>
          ))}
          <input ref={inputRef} className="tm-tag-input"
            placeholder={value.length === 0 ? "선생님 선택 또는 입력" : ""}
            value={inputVal}
            onChange={(e) => { setInputVal(e.target.value); calcPos(); setOpen(true); }}
            onFocus={() => { calcPos(); setOpen(true); }}
            onKeyDown={(e) => {
              if ((e.key === "Enter" || e.key === ",") && inputVal.trim()) {
                e.preventDefault(); addTeacher(inputVal);
              } else if (e.key === "Backspace" && !inputVal && value.length > 0) {
                removeTeacher(value[value.length - 1]);
              } else if (e.key === "Escape") {
                setOpen(false);
              }
            }}
          />
        </div>
      </div>
      {dropdown}
    </>
  );
}

// ────────────────────────────────────────────────────────────────────
export default function TeacherMapManager() {
  const [grade, setGrade] = useState(1);
  const [subjects, setSubjects] = useState<string[]>([]);
  // { [subject]: string[] } — 반 구분 없이 과목당 교사 목록
  const [teacherTags, setTeacherTags] = useState<Record<string, string[]>>({});
  // { [subject]: "표시명" }
  const [aliasInputs, setAliasInputs] = useState<Record<string, string>>({});
  const [roster, setRoster] = useState<TeacherRosterEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<StatusMessage | null>(null);
  const [newSubject, setNewSubject] = useState("");
  const [showAddSubject, setShowAddSubject] = useState(false);

  useEffect(() => {
    getTeacherRoster().then(setRoster).catch(() => setRoster([]));
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setMessage(null);
    try {
      const [subjectList, saved] = await Promise.all([
        getGradeSubjectsFromBackend(grade),
        getTeacherMap(grade),
      ]);

      // 이전에 수동으로 추가한 과목도 포함
      const savedSubjects = saved?.teacherMap ? Object.keys(saved.teacherMap) : [];
      const merged = [...new Set([...subjectList, ...savedSubjects])].sort((a, b) => a.localeCompare(b, "ko"));
      setSubjects(merged);

      const tTags: Record<string, string[]> = {};
      const aInputs: Record<string, string> = {};
      merged.forEach((subj) => {
        // 반 구분 없이: "1"반 데이터 기준으로 불러오고, 없으면 다른 반에서라도 합집합
        const allTeachers = new Set<string>();
        CLASS_NUMS.forEach((c) => {
          (((saved?.teacherMap as Record<string, Record<string, string[]>> | undefined)?.[subj]?.[String(c)]) ?? []).forEach((t) => allTeachers.add(t));
        });
        tTags[subj] = [...allTeachers];
        aInputs[subj] = (saved?.subjectAlias as Record<string, string> | undefined)?.[subj] ?? "";
      });
      setTeacherTags(tTags);
      setAliasInputs(aInputs);
    } catch {
      setSubjects([]);
    } finally {
      setLoading(false);
    }
  }, [grade]);

  useEffect(() => { load(); }, [load]);

  const handleTagChange = (subject: string, newTags: string[]) =>
    setTeacherTags((prev) => ({ ...prev, [subject]: newTags }));

  const handleAliasChange = (subject: string, val: string) =>
    setAliasInputs((prev) => ({ ...prev, [subject]: val }));

  const handleAddSubject = () => {
    const subj = newSubject.trim();
    if (!subj || subjects.includes(subj)) { setNewSubject(""); return; }
    setSubjects((prev) => [...prev, subj].sort((a, b) => a.localeCompare(b, "ko")));
    setTeacherTags((prev) => ({ ...prev, [subj]: [] }));
    setAliasInputs((prev) => ({ ...prev, [subj]: "" }));
    setNewSubject("");
    setShowAddSubject(false);
  };

  const handleRemoveSubject = (subj: string) => {
    if (!window.confirm(`"${subj}" 과목을 목록에서 삭제할까요?`)) return;
    setSubjects((prev) => prev.filter((s) => s !== subj));
    setTeacherTags((prev) => { const n = { ...prev }; delete n[subj]; return n; });
    setAliasInputs((prev) => { const n = { ...prev }; delete n[subj]; return n; });
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      // 백엔드 형식: { subject: { classNum: string[] } }
      // 반 구분 없으므로 모든 반에 동일하게 저장
      const teacherMap: Record<string, Record<string, string[]>> = {};
      Object.entries(teacherTags).forEach(([subj, arr]) => {
        const filtered = (arr ?? []).filter(Boolean);
        if (filtered.length > 0) {
          const classMap: Record<string, string[]> = {};
          CLASS_NUMS.forEach((c) => { classMap[String(c)] = filtered; });
          teacherMap[subj] = classMap;
        }
      });

      const subjectAlias: Record<string, string> = {};
      Object.entries(aliasInputs).forEach(([subj, alias]) => {
        if (alias?.trim()) subjectAlias[subj] = alias.trim();
      });

      await saveTeacherMap(grade, teacherMap, subjectAlias);
      setMessage({ type: "success", text: `${grade}학년 교사 매핑이 저장되었습니다.` });
    } catch (err) {
      setMessage({ type: "error", text: (err as Error)?.message ?? "저장 중 오류가 발생했습니다." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="admin-section">
        <h3>👩‍🏫 교사 매핑 관리</h3>
        <p style={{ color: "#64748b", marginBottom: 16, fontSize: "0.9rem" }}>
          과목별 담당 교사를 등록하세요. 등록된 교사는 시간표 관리에서 교시별로 선택할 수 있습니다.
          과목이 누락되면 <strong>+ 과목 직접 추가</strong>로 추가하세요.
        </p>

        {/* 학년 선택 */}
        <div className="tt-admin-selector" style={{ marginBottom: 20 }}>
          <div className="tt-admin-selector-group">
            <span className="tt-admin-selector-label">학년</span>
            {GRADES.map((g) => (
              <button key={g}
                className={`tt-admin-cls-btn ${grade === g ? "active" : ""}`}
                onClick={() => setGrade(g)}>
                {g}학년
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <p style={{ textAlign: "center", padding: "40px 0", color: "#94a3b8" }}>불러오는 중...</p>
        ) : (
          <>
            {subjects.length === 0 && (
              <div style={{
                textAlign: "center", padding: "32px 20px", background: "#fafafa",
                borderRadius: 10, border: "1px dashed #e2e8f0", marginBottom: 16
              }}>
                <p style={{ color: "#94a3b8", fontSize: "0.9rem", marginBottom: 12 }}>
                  {grade}학년 과목을 나이스에서 불러오지 못했습니다.<br />
                  기본 시간표가 저장돼 있거나 나이스에 데이터가 있으면 자동으로 불러옵니다.<br />
                  과목을 직접 추가해서 사용하세요.
                </p>
              </div>
            )}

            {/* 수동 과목 추가 */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
              {showAddSubject ? (
                <>
                  <input type="text" className="tt-admin-select" style={{ width: 180 }}
                    placeholder="과목명 입력" value={newSubject}
                    onChange={(e) => setNewSubject(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAddSubject()}
                    autoFocus />
                  <button className="tt-admin-btn-save btn-submit"
                    style={{ padding: "6px 14px", fontSize: "0.85rem" }}
                    onClick={handleAddSubject}>추가</button>
                  <button className="tt-admin-btn-clear"
                    style={{ padding: "6px 14px", fontSize: "0.85rem" }}
                    onClick={() => { setShowAddSubject(false); setNewSubject(""); }}>취소</button>
                </>
              ) : (
                <button className="tt-admin-cls-btn"
                  onClick={() => setShowAddSubject(true)}
                  style={{ fontSize: "0.83rem" }}>
                  ＋ 과목 직접 추가
                </button>
              )}
            </div>

            {subjects.length > 0 && (
              <div className="admin-table-wrapper" style={{ overflowX: "auto" }}>
                <table className="admin-table tt-teacher-map-table">
                  <thead>
                    <tr>
                      <th style={{ minWidth: 140 }}>과목명</th>
                      <th style={{ minWidth: 110 }}>표시명</th>
                      <th style={{ minWidth: 320 }}>담당 교사</th>
                      <th style={{ minWidth: 40 }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {subjects.map((subject) => (
                      <tr key={subject}>
                        <td style={{ fontWeight: 500, fontSize: "0.88rem", whiteSpace: "nowrap" }}>
                          {subject}
                        </td>
                        <td>
                          <input type="text" className="tt-admin-select" style={{ width: "100%" }}
                            placeholder="표시 이름"
                            value={aliasInputs[subject] ?? ""}
                            onChange={(e) => handleAliasChange(subject, e.target.value)} />
                        </td>
                        <td>
                          <TeacherTagSelect
                            value={teacherTags[subject] ?? []}
                            onChange={(tags) => handleTagChange(subject, tags)}
                            roster={roster}
                          />
                        </td>
                        <td style={{ textAlign: "center" }}>
                          <button className="tm-remove-subject" title="과목 삭제"
                            onClick={() => handleRemoveSubject(subject)}>🗑</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {message && (
          <div className={`tt-admin-msg ${message.type}`} style={{ marginTop: 16 }}>
            {message.type === "success" ? "✅ " : "❌ "}{message.text}
          </div>
        )}

        {subjects.length > 0 && (
          <div className="tt-admin-actions">
            <button className="tt-admin-btn-save btn-submit"
              onClick={handleSave} disabled={saving || loading}>
              {saving ? "저장 중..." : "교사 매핑 저장"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
