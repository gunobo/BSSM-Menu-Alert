import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./footer";
import {
  getPublicBaseTimetable,
  getPublicTeacherMap,
  patchTimetableCell,
} from "../api/timetableApi";
import { getWeekTimetable, getWeekRange } from "../api/NeisApi";
import { getUser } from "../api/auth";
import "../styles/teacher-edit.css";

const DAY_NAMES = ["월", "화", "수", "목", "금"];
const MAX_PERIODS = 7;
const GRADES = [1, 2, 3];
const MAX_CLASSES = 4;

function toYMD(d: Date) {
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000)
    .toISOString().slice(0, 10).replace(/-/g, "");
}
function getWeekDays() {
  const today = new Date();
  const day = today.getDay();
  const mon = new Date(today);
  mon.setDate(today.getDate() + (day === 0 ? -6 : 1 - day));
  return Array.from({ length: 5 }, (_, i) => {
    const d = new Date(mon);
    d.setDate(mon.getDate() + i);
    return toYMD(d);
  });
}

type CellInfo = {
  subject: string;
  teacher: string;
  changed: boolean;
  baseSubject: string;
};

export default function TeacherEdit() {
  const navigate = useNavigate();
  const [grade, setGrade] = useState(1);
  const [classNum, setClassNum] = useState(1);
  const [grid, setGrid] = useState<CellInfo[][]>([]);
  const [subjectOptions, setSubjectOptions] = useState<string[]>([]);
  const [teacherMap, setTeacherMap] = useState<Record<string, string[]>>({});
  const [alias, setAlias] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [userName, setUserName] = useState("");

  // 모달
  const [modal, setModal] = useState<{ pi: number; di: number } | null>(null);
  const [editSubject, setEditSubject] = useState("");
  const [editTeacher, setEditTeacher] = useState("");
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState("");

  useEffect(() => {
    getUser().then((u) => {
      if (!u) { navigate("/login"); return; }
      const role = u.role ?? "";
      if (!["ROLE_TEACHER", "ROLE_MODERATOR", "ROLE_ADMIN", "TEACHER", "MODERATOR", "ADMIN"].includes(role)) {
        alert("시간표 담당 교사 또는 관리자만 접근할 수 있습니다.");
        navigate("/");
        return;
      }
      setUserName(u.name ?? "");
    });
  }, [navigate]);

  const weekDays = getWeekDays();
  const { start, end } = getWeekRange();

  const applyAlias = useCallback((s: string) => alias[s] ?? s, [alias]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [base, neis, tm] = await Promise.all([
        getPublicBaseTimetable(grade, classNum).catch(() => null),
        getWeekTimetable(grade, classNum, start, end).catch(() => ({})),
        getPublicTeacherMap(grade, classNum).catch(() => null),
      ]);

      const al = tm?.subjectAlias ?? {};
      setAlias(al);
      setSubjectOptions(Object.keys(al).length ? Object.keys(al) : []);
      // teacherMap: { subject: string[] } — 과목별 교사 목록
      setTeacherMap(tm?.teacherMap ?? {});

      const newGrid: CellInfo[][] = [];
      for (let pi = 0; pi < MAX_PERIODS; pi++) {
        const row: CellInfo[] = [];
        for (let di = 0; di < 5; di++) {
          const baseSubjectRaw = base?.subjects?.[pi]?.[di] ?? "";
          const baseTeacher = base?.teachers?.[pi]?.[di] ?? "";
          const neisSlots =
            (neis as Record<string, Array<{ period: number; subject: string }>>)[
              weekDays[di]
            ] ?? [];
          const neisSlot = neisSlots.find((s) => s.period === pi + 1);
          const neisSubjectRaw = neisSlot?.subject ?? "";
          const changed = !!(
            neisSubjectRaw &&
            baseSubjectRaw &&
            neisSubjectRaw !== baseSubjectRaw
          );
          const subjectRaw = changed ? neisSubjectRaw : baseSubjectRaw;
          row.push({
            subject: (al[subjectRaw] ?? subjectRaw),
            teacher: changed ? "" : baseTeacher,
            changed,
            baseSubject: al[baseSubjectRaw] ?? baseSubjectRaw,
          });
        }
        newGrid.push(row);
      }
      setGrid(newGrid);

      // 과목 목록 = base 시간표에 있는 과목 + alias keys
      const baseSubjs = new Set<string>();
      (base?.subjects ?? []).forEach((row: string[]) =>
        row.forEach((s) => { if (s) baseSubjs.add(s); })
      );
      Object.keys(al).forEach((s) => baseSubjs.add(s));
      setSubjectOptions([...baseSubjs].sort((a, b) => a.localeCompare(b, "ko")));
    } finally {
      setLoading(false);
    }
  }, [grade, classNum, start, end, weekDays.join(",")]);

  useEffect(() => { load(); }, [load]);

  const openModal = (pi: number, di: number) => {
    const cell = grid[pi]?.[di];
    const rawSubject = Object.entries(alias).find(([, v]) => v === cell?.subject)?.[0] ?? cell?.subject ?? "";
    setEditSubject(rawSubject);
    setEditTeacher(cell?.teacher ?? "");
    setModal({ pi, di });
  };

  const handleSave = async () => {
    if (!modal) return;
    setSaving(true);
    try {
      await patchTimetableCell(grade, classNum, modal.pi, modal.di, editSubject, editTeacher);
      setGrid((prev) => {
        const next = prev.map((r) => [...r]);
        next[modal.pi][modal.di] = {
          subject: alias[editSubject] ?? editSubject,
          teacher: editTeacher,
          changed: false,
          baseSubject: alias[editSubject] ?? editSubject,
        };
        return next;
      });
      setSavedMsg(`${DAY_NAMES[modal.di]}요일 ${modal.pi + 1}교시 저장 완료`);
      setTimeout(() => setSavedMsg(""), 3000);
      setModal(null);
    } catch (err) {
      alert((err as Error)?.message ?? "저장 실패");
    } finally {
      setSaving(false);
    }
  };

  const editTeacherOptions = teacherMap[editSubject] ?? [];

  return (
    <>
      <Navbar />
      <main className="te-container">
        <div className="te-header">
          <h2>시간표 수정</h2>
          {userName && <span className="te-user">{userName}</span>}
        </div>

        {/* 학년/반 선택 */}
        <div className="te-selectors">
          <div className="te-selector-group">
            {GRADES.map((g) => (
              <button key={g} className={`te-btn ${grade === g ? "active" : ""}`} onClick={() => setGrade(g)}>
                {g}학년
              </button>
            ))}
          </div>
          <div className="te-selector-group">
            {Array.from({ length: MAX_CLASSES }, (_, i) => i + 1).map((c) => (
              <button key={c} className={`te-btn ${classNum === c ? "active" : ""}`} onClick={() => setClassNum(c)}>
                {c}반
              </button>
            ))}
          </div>
        </div>

        {savedMsg && <div className="te-saved-msg">✅ {savedMsg}</div>}

        {/* 이번 주 시간표 */}
        {loading ? (
          <div className="te-loading">불러오는 중...</div>
        ) : (
          <div className="te-table-wrap">
            <table className="te-table">
              <thead>
                <tr>
                  <th className="te-th-period"></th>
                  {DAY_NAMES.map((d, di) => (
                    <th key={d} className="te-th-day">
                      <div>{d}</div>
                      <div className="te-date">{weekDays[di].slice(4, 6)}/{weekDays[di].slice(6, 8)}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: MAX_PERIODS }, (_, pi) => (
                  <tr key={pi}>
                    <td className="te-td-period">{pi + 1}</td>
                    {Array.from({ length: 5 }, (_, di) => {
                      const cell = grid[pi]?.[di];
                      return (
                        <td
                          key={di}
                          className={`te-td-cell ${cell?.changed ? "changed" : ""}`}
                          onClick={() => openModal(pi, di)}
                        >
                          {cell?.subject ? (
                            <>
                              <div className="te-cell-subject">{cell.subject}</div>
                              {cell.teacher && <div className="te-cell-teacher">{cell.teacher}</div>}
                              {cell.changed && (
                                <div className="te-cell-orig">← {cell.baseSubject}</div>
                              )}
                            </>
                          ) : (
                            <span className="te-cell-empty">—</span>
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

        <p className="te-hint">셀을 탭하면 수정할 수 있습니다. 노란 셀은 NEIS에서 변경된 교시입니다.</p>
      </main>
      <Footer />

      {/* 수정 모달 */}
      {modal && (
        <div className="te-modal-overlay" onClick={() => setModal(null)}>
          <div className="te-modal" onClick={(e) => e.stopPropagation()}>
            <div className="te-modal-title">
              {DAY_NAMES[modal.di]}요일 {modal.pi + 1}교시
              <span className="te-modal-sub">{grade}학년 {classNum}반</span>
            </div>

            <label className="te-modal-label">과목</label>
            <select
              className="te-modal-select"
              value={editSubject}
              onChange={(e) => { setEditSubject(e.target.value); setEditTeacher(""); }}
            >
              <option value="">— 수업없음 —</option>
              {editSubject && !subjectOptions.includes(editSubject) && (
                <option value={editSubject}>{alias[editSubject] ?? editSubject}</option>
              )}
              {subjectOptions.map((s) => (
                <option key={s} value={s}>{alias[s] ?? s}</option>
              ))}
            </select>

            {editSubject && (
              <>
                <label className="te-modal-label">담당 교사</label>
                <select
                  className="te-modal-select"
                  value={editTeacher}
                  onChange={(e) => setEditTeacher(e.target.value)}
                >
                  <option value="">선택</option>
                  {editTeacher && !editTeacherOptions.includes(editTeacher) && (
                    <option value={editTeacher}>{editTeacher}</option>
                  )}
                  {editTeacherOptions.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </>
            )}

            <div className="te-modal-btns">
              <button className="te-btn-cancel" onClick={() => setModal(null)}>취소</button>
              <button className="te-btn-save" onClick={handleSave} disabled={saving}>
                {saving ? "저장 중..." : "저장"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
