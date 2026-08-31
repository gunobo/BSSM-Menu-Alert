import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { getWeekTimetable } from "../../api/NeisApi";
import { getPublicBaseTimetable, getPublicOverrides } from "../../api/timetableApi";
import type { BaseTimetableData } from "../../api/timetableApi";
import bssmLogo from "../../assets/bssmlogo_rmbg.png";

// ── 상수 ──────────────────────────────────────────────────────────────────────
const GRADES = [1, 2, 3];
const MAX_CLASSES = 4;
const MAX_PERIODS = 7;
const DAY_NAMES = ["월", "화", "수", "목", "금"];
const PRINT_TYPES = ["학급별", "시간표 비교", "전체 학급"] as const;
type PrintType = (typeof PRINT_TYPES)[number];

// ── 날짜 유틸 ─────────────────────────────────────────────────────────────────
function toYMD(date: Date) {
  const off = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - off).toISOString().slice(0, 10).replace(/-/g, "");
}
function getWeekDays(date: Date) {
  const d = new Date(date);
  const diff = d.getDay() === 0 ? -6 : 1 - d.getDay();
  const mon = new Date(d);
  mon.setDate(d.getDate() + diff);
  return Array.from({ length: 5 }, (_, i) => {
    const dd = new Date(mon);
    dd.setDate(mon.getDate() + i);
    return toYMD(dd);
  });
}
function weekLabel(days: string[]) {
  const s = days[0], e = days[4];
  return `${s.slice(0, 4)}.${s.slice(4, 6)}.${s.slice(6, 8)} ~ ${e.slice(4, 6)}.${e.slice(6, 8)}`;
}
function fmtDate(ymd: string) {
  return `${parseInt(ymd.slice(4, 6))}/${parseInt(ymd.slice(6, 8))}`;
}
function today() { return new Date().toLocaleDateString("ko-KR"); }

// ── 타입 ──────────────────────────────────────────────────────────────────────
type NeisMap = Record<string, Array<{ period: number; subject: string }>>;
type OverrideMap = Record<string, Record<number, { teacher: string; subject: string }>>;
type CellInfo = { subject: string; teacher: string; changed: boolean; baseSubject: string };

function buildGrid(
  base: BaseTimetableData | null,
  neis: NeisMap,
  overrides: OverrideMap,
  weekDays: string[],
): CellInfo[][] {
  return Array.from({ length: MAX_PERIODS }, (_, pi) =>
    weekDays.map((date, di) => {
      const baseSubject = base?.subjects?.[pi]?.[di] ?? "";
      const neisSlots = neis[date] ?? [];
      const neisSlot = neisSlots.find((s) => s.period === pi + 1);
      const neisSubject = neisSlot?.subject ?? "";
      const changed = !!(neisSubject && baseSubject && neisSubject !== baseSubject);
      const ovr = overrides[date]?.[pi + 1];
      const baseTeacher = base?.teachers?.[pi]?.[di] ?? "";
      let subject = baseSubject;
      let teacher = baseTeacher;
      if (changed) { subject = neisSubject; teacher = ovr?.teacher ?? ""; }
      else if (ovr?.subject !== undefined) { subject = ovr.subject || "수업없음"; }
      return { subject, teacher, changed, baseSubject };
    })
  );
}

// ── 데이터 훅 ─────────────────────────────────────────────────────────────────
function useClassData(grade: number, classNum: number, weekDays: string[]) {
  const [base, setBase] = useState<BaseTimetableData | null>(null);
  const [neis, setNeis] = useState<NeisMap>({});
  const [overrides, setOverrides] = useState<OverrideMap>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    const from = weekDays[0], to = weekDays[4];
    Promise.all([
      getPublicBaseTimetable(grade, classNum).catch(() => null),
      getWeekTimetable(grade, classNum, from, to).catch(() => ({})),
      getPublicOverrides(grade, classNum, from, to).catch(() => ({})),
    ]).then(([b, n, o]) => {
      setBase(b);
      setNeis(n as NeisMap);
      setOverrides(o as unknown as OverrideMap);
    }).finally(() => setLoading(false));
  }, [grade, classNum, weekDays[0]]);

  const grid = useMemo(() => buildGrid(base, neis, overrides, weekDays), [base, neis, overrides, weekDays]);
  return { base, grid, loading };
}

// ── A4 공통 스타일 ────────────────────────────────────────────────────────────
const A4_W = 794;   // px at 96dpi
const A4_H = 1123;

// ── 학급별 시간표 템플릿 (사용자 커스터마이징 영역) ──────────────────────────
function ClassTemplate({
  grade, classNum, weekDays,
}: { grade: number; classNum: number; weekDays: string[] }) {
  const { grid, loading } = useClassData(grade, classNum, weekDays);
  if (loading) return <div style={{ padding: 40, textAlign: "center", color: "#94a3b8" }}>불러오는 중…</div>;

  const wk = weekDays[0];
  const wkEnd = weekDays[4];
  const wkLabel = `${parseInt(wk.slice(4,6))}월 ${parseInt(wk.slice(6,8))}일 ~ ${parseInt(wkEnd.slice(4,6))}월 ${parseInt(wkEnd.slice(6,8))}일`;

  return (
    <div style={{
      width: "100%", height: "100%",
      boxSizing: "border-box",
      padding: "48px 44px 36px",
      fontFamily: "'Apple SD Gothic Neo','Malgun Gothic',sans-serif",
      display: "flex", flexDirection: "column",
      position: "relative",
    }}>
      {/* 배경 워터마크 로고 */}
      <img src={bssmLogo} alt="" aria-hidden style={{
        position: "absolute",
        top: "50%", left: "50%",
        transform: "translate(-50%, -50%)",
        width: 320, height: 320,
        objectFit: "contain",
        opacity: 0.045,
        pointerEvents: "none",
        userSelect: "none",
      }} />
      {/* ── 상단 타이틀 (가운데 정렬) ── */}
      <div style={{ textAlign: "center", marginBottom: 20 }}>
        <div style={{ fontSize: 24, fontWeight: 800, color: "#0f172a", letterSpacing: "-0.02em", lineHeight: 1.15 }}>
          {grade}학년 {classNum}반 시간표
        </div>
        <div style={{ fontSize: 11, color: "#64748b", marginTop: 6, fontWeight: 500 }}>
          기간: {wkLabel}
        </div>
      </div>

      {/* ── 시간표 테이블 ── */}
      <div style={{ flex: 1 }}>
        <table style={{ borderCollapse: "collapse", width: "100%", height: "100%", tableLayout: "fixed" }}>
          <thead>
            <tr>
              <th style={{ background: "#0f172a", color: "#fff", fontWeight: 700, fontSize: 10, padding: "8px 4px", textAlign: "center", width: 42 }}>교시</th>
              {DAY_NAMES.map((d, i) => (
                <th key={d} style={{ background: "#0f172a", color: "#fff", fontWeight: 700, fontSize: 11, padding: "8px 4px", textAlign: "center" }}>
                  {d}
                  <div style={{ fontWeight: 400, fontSize: 9, color: "#64748b", marginTop: 2 }}>{fmtDate(weekDays[i])}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {grid.map((row, pi) => (
              <tr key={pi}>
                <td style={{ background: "#f1f5f9", color: "#475569", fontWeight: 700, fontSize: 9, textAlign: "center", border: "1px solid #e2e8f0", padding: "5px 3px" }}>
                  {pi + 1}
                </td>
                {row.map((cell, di) => (
                  <td key={di} style={{
                    border: "1px solid #e2e8f0",
                    padding: "7px 5px",
                    textAlign: "center",
                    verticalAlign: "middle",
                    background: cell.changed ? "#fffbeb" : "#fff",
                    borderColor: cell.changed ? "#fbbf24" : "#e2e8f0",
                  }}>
                    <div style={{ fontSize: 10.5, fontWeight: 500, color: "#0f172a" }}>
                      {cell.changed ? cell.baseSubject : cell.subject || "—"}
                    </div>
                    {cell.changed && (
                      <div style={{ fontSize: 9, color: "#b45309", fontWeight: 700, marginTop: 3 }}>
                        → {cell.subject}
                      </div>
                    )}
                    {cell.teacher && (
                      <div style={{ fontSize: 8.5, color: "#64748b", marginTop: 2, borderTop: "1px dashed #e2e8f0", paddingTop: 2 }}>
                        {cell.teacher}
                      </div>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── 하단 브랜드 (가운데 정렬) ── */}
      <div style={{ textAlign: "center", marginTop: 28 }}>
        <div style={{ fontSize: 15, fontWeight: 800, color: "#0f172a", letterSpacing: "-0.01em" }}>BSSM급식알리미</div>
        <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 3 }}>https://alert.bssm.dev</div>
      </div>
    </div>
  );
}

// ── 시간표 비교 템플릿 ────────────────────────────────────────────────────────
function CompareTemplate({
  grade, classes, weekDays, viewDay,
}: { grade: number; classes: number[]; weekDays: string[]; viewDay: number | null }) {
  // 훅은 항상 고정 개수(4개)로 호출 — classes 길이에 무관하게
  const d1 = useClassData(grade, 1, weekDays);
  const d2 = useClassData(grade, 2, weekDays);
  const d3 = useClassData(grade, 3, weekDays);
  const d4 = useClassData(grade, 4, weekDays);
  const allData = [d1, d2, d3, d4]; // index 0 = 1반, index 1 = 2반, ...
  const grids = classes.map((c) => allData[c - 1]);
  const loading = grids.some((g) => g.loading);
  const days = viewDay !== null ? [viewDay] : [0, 1, 2, 3, 4];

  if (loading) return <div style={{ padding: 40, textAlign: "center", color: "#94a3b8" }}>불러오는 중…</div>;

  return (
    <div style={{ width: "100%", height: "100%", boxSizing: "border-box", padding: "28px 24px", fontFamily: "'Apple SD Gothic Neo','Malgun Gothic',sans-serif" }}>
      <div style={{ borderBottom: "3px solid #1e40af", paddingBottom: 8, marginBottom: 14, display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>
          <div style={{ fontSize: 9, color: "#64748b", marginBottom: 2 }}>부산소프트웨어마이스터고등학교</div>
          <div style={{ fontSize: 17, fontWeight: 700, color: "#0f172a" }}>{grade}학년 시간표 비교 ({classes.map(c => `${c}반`).join(" vs ")})</div>
        </div>
        <div style={{ textAlign: "right", fontSize: 9, color: "#64748b", lineHeight: 1.7 }}>
          <div>{weekLabel(weekDays)}</div>
          <div>출력일: {today()}</div>
        </div>
      </div>

      {days.map((di) => (
        <div key={di} style={{ marginBottom: 16 }}>
          <div style={{ fontWeight: 700, fontSize: 11, color: "#1e40af", marginBottom: 6, background: "#eff6ff", padding: "4px 8px", borderRadius: 4 }}>
            {DAY_NAMES[di]}요일 ({fmtDate(weekDays[di])})
          </div>
          <table style={{ borderCollapse: "collapse", width: "100%", tableLayout: "fixed" }}>
            <thead>
              <tr>
                <th style={{ ...TH_PERIOD, fontSize: 9, padding: "5px 4px" }}>교시</th>
                {classes.map((c) => <th key={c} style={{ ...TH_DAY, fontSize: 9, padding: "5px 4px" }}>{c}반</th>)}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: MAX_PERIODS }, (_, pi) => {
                const subjects = classes.map((_, ci) => grids[ci]?.grid[pi]?.[di]?.subject ?? "");
                const allSame = subjects.every((s) => s === subjects[0]);
                return (
                  <tr key={pi}>
                    <td style={{ ...TD_PERIOD, fontSize: 9, padding: "5px 4px" }}>{pi + 1}</td>
                    {classes.map((_, ci) => {
                      const cell = grids[ci]?.grid[pi]?.[di];
                      const isDiff = !allSame && !!cell?.subject;
                      return (
                        <td key={ci} style={{ ...TD_CELL, fontSize: 9.5, padding: "5px 6px", background: cell?.changed ? "#fffbeb" : isDiff ? "#eff6ff" : pi % 2 === 1 ? "#f8fafc" : "#fff", borderColor: cell?.changed ? "#fbbf24" : "#e2e8f0" }}>
                          <div style={{ fontWeight: (cell?.changed || isDiff) ? 600 : 400 }}>{cell?.subject || "—"}</div>
                          {cell?.changed && <div style={{ fontSize: 7, color: "#b45309" }}>← {cell.baseSubject}</div>}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}

// ── 전체 학급 템플릿 ──────────────────────────────────────────────────────────
function AllClassTemplate({ grade, weekDays }: { grade: number; weekDays: string[] }) {
  // 훅은 항상 고정 4개
  const d1 = useClassData(grade, 1, weekDays);
  const d2 = useClassData(grade, 2, weekDays);
  const d3 = useClassData(grade, 3, weekDays);
  const d4 = useClassData(grade, 4, weekDays);
  const grids = [d1, d2, d3, d4];
  const loading = grids.some((g) => g.loading);
  if (loading) return <div style={{ padding: 40, textAlign: "center", color: "#94a3b8" }}>불러오는 중…</div>;

  return (
    <div style={{ width: "100%", height: "100%", boxSizing: "border-box", padding: "24px 20px", fontFamily: "'Apple SD Gothic Neo','Malgun Gothic',sans-serif" }}>
      <div style={{ borderBottom: "3px solid #1e40af", paddingBottom: 8, marginBottom: 14, display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>
          <div style={{ fontSize: 9, color: "#64748b", marginBottom: 2 }}>부산소프트웨어마이스터고등학교</div>
          <div style={{ fontSize: 17, fontWeight: 700, color: "#0f172a" }}>{grade}학년 전체 학급 시간표</div>
        </div>
        <div style={{ textAlign: "right", fontSize: 9, color: "#64748b", lineHeight: 1.7 }}>
          <div>{weekLabel(weekDays)}</div><div>출력일: {today()}</div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        {Array.from({ length: MAX_CLASSES }, (_, i) => {
          const classNum = i + 1;
          const { grid } = grids[i];
          return (
            <div key={classNum}>
              <div style={{ fontWeight: 700, fontSize: 11, color: "#1e40af", marginBottom: 5, background: "#eff6ff", padding: "3px 8px", borderRadius: 4 }}>
                {classNum}반
              </div>
              <table style={{ borderCollapse: "collapse", width: "100%", tableLayout: "fixed" }}>
                <thead>
                  <tr>
                    <th style={{ ...TH_PERIOD, fontSize: 8, padding: "4px 3px", width: 28 }}>교시</th>
                    {DAY_NAMES.map((d, di) => (
                      <th key={d} style={{ ...TH_DAY, fontSize: 8, padding: "4px 3px" }}>
                        {d}<br /><span style={{ fontWeight: 400, fontSize: 7, opacity: 0.85 }}>{fmtDate(weekDays[di])}</span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {grid.map((row, pi) => (
                    <tr key={pi}>
                      <td style={{ ...TD_PERIOD, fontSize: 8, padding: "4px 3px" }}>{pi + 1}</td>
                      {row.map((cell, di) => (
                        <td key={di} style={{ ...TD_CELL, fontSize: 8.5, padding: "4px 4px", background: cell.changed ? "#fffbeb" : pi % 2 === 1 ? "#f8fafc" : "#fff", borderColor: cell.changed ? "#fbbf24" : "#e2e8f0" }}>
                          <div style={{ fontWeight: cell.changed ? 600 : 400 }}>{cell.subject || "—"}</div>
                          {cell.changed && <div style={{ fontSize: 6.5, color: "#b45309" }}>← {cell.baseSubject}</div>}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: 10, fontSize: 8, color: "#64748b", borderTop: "1px solid #e2e8f0", paddingTop: 6, display: "flex", gap: 16 }}>
        <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <span style={{ display: "inline-block", width: 8, height: 8, background: "#fffbeb", border: "1px solid #fbbf24", borderRadius: 2 }} />
          NEIS 기준 변경 교시
        </span>
        <span style={{ marginLeft: "auto" }}>부산소프트웨어마이스터고 · {grade}학년 전체</span>
      </div>
    </div>
  );
}

// ── td/th 공통 스타일 ─────────────────────────────────────────────────────────
const TH_PERIOD: React.CSSProperties = { background: "#0f172a", color: "#fff", fontSize: 10, fontWeight: 700, padding: "7px 4px", textAlign: "center", border: "1px solid #0f172a", width: 36 };
const TH_DAY: React.CSSProperties = { background: "#1e40af", color: "#fff", fontSize: 10, fontWeight: 600, padding: "7px 4px", textAlign: "center", border: "1px solid #1e3a8a" };
const TD_PERIOD: React.CSSProperties = { background: "#1e293b", color: "#fff", fontWeight: 700, fontSize: 10, padding: "8px 4px", textAlign: "center", border: "1px solid #0f172a" };
const TD_CELL: React.CSSProperties = { border: "1px solid #e2e8f0", padding: "8px 6px", textAlign: "center", verticalAlign: "middle", lineHeight: 1.4 };

// ── 메인 컴포넌트 ─────────────────────────────────────────────────────────────
export default function TimetablePrintPage() {
  const [printType, setPrintType] = useState<PrintType>("학급별");
  const [grade, setGrade] = useState(1);
  const [classNum, setClassNum] = useState(1);
  const [compareClasses, setCompareClasses] = useState<number[]>([1, 2]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewDay, setViewDay] = useState<number | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const outerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.6);

  const weekDays = useMemo(() => getWeekDays(selectedDate), [selectedDate]);

  // 미리보기 스케일 계산
  useEffect(() => {
    function calcScale() {
      if (outerRef.current) {
        const w = outerRef.current.clientWidth - 32;
        setScale(Math.min(w / A4_W, 0.85));
      }
    }
    calcScale();
    window.addEventListener("resize", calcScale);
    return () => window.removeEventListener("resize", calcScale);
  }, []);

  const toggleCompareClass = (c: number) => {
    setCompareClasses((prev) =>
      prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c].sort()
    );
  };

  const handlePrint = () => {
    const el = previewRef.current;
    if (!el) return;
    // 스케일 일시 제거 후 인쇄
    el.style.transform = "none";
    el.style.transformOrigin = "initial";
    window.print();
    el.style.transform = `scale(${scale})`;
    el.style.transformOrigin = "top left";
  };

  return (
    <div style={{ display: "flex", gap: 0, height: "100%", minHeight: 600 }}>
      {/* ── 인쇄 CSS ─────────────────────────────────────────────────────── */}
      <style>{`
        @media print {
          @page { size: A4; margin: 0; }
          body * { visibility: hidden !important; }
          #tt-print-a4, #tt-print-a4 * { visibility: visible !important; }
          #tt-print-a4 {
            position: fixed !important;
            left: 0 !important; top: 0 !important;
            width: 210mm !important; height: 297mm !important;
            transform: none !important;
            transform-origin: initial !important;
            background: #fff !important;
          }
        }
      `}</style>

      {/* ── 왼쪽 컨트롤 패널 ─────────────────────────────────────────────── */}
      <div style={{ width: 240, flexShrink: 0, borderRight: "1px solid #e2e8f0", padding: "20px 16px", display: "flex", flexDirection: "column", gap: 20, background: "#f8fafc" }}>
        {/* 인쇄 타입 */}
        <div>
          <label style={LABEL}>인쇄 유형</label>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 8 }}>
            {PRINT_TYPES.map((t) => (
              <button key={t} onClick={() => setPrintType(t)}
                style={{ padding: "8px 12px", borderRadius: 8, border: "1.5px solid", textAlign: "left", fontSize: "0.87rem", fontWeight: 600, cursor: "pointer", background: printType === t ? "#1e40af" : "#fff", color: printType === t ? "#fff" : "#374151", borderColor: printType === t ? "#1e40af" : "#e2e8f0" }}>
                {t === "학급별" ? "📋 학급별 시간표" : t === "시간표 비교" ? "📊 시간표 비교" : "📑 전체 학급 시간표"}
              </button>
            ))}
          </div>
        </div>

        {/* 학년 */}
        <div>
          <label style={LABEL}>학년</label>
          <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
            {GRADES.map((g) => (
              <button key={g} onClick={() => setGrade(g)} style={CHIP(grade === g)}>{g}학년</button>
            ))}
          </div>
        </div>

        {/* 반 선택 (학급별) */}
        {printType === "학급별" && (
          <div>
            <label style={LABEL}>반</label>
            <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
              {Array.from({ length: MAX_CLASSES }, (_, i) => i + 1).map((c) => (
                <button key={c} onClick={() => setClassNum(c)} style={CHIP(classNum === c)}>{c}반</button>
              ))}
            </div>
          </div>
        )}

        {/* 반 선택 (비교 — 다중) */}
        {printType === "시간표 비교" && (
          <div>
            <label style={LABEL}>비교할 반 (다중 선택)</label>
            <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
              {Array.from({ length: MAX_CLASSES }, (_, i) => i + 1).map((c) => (
                <button key={c} onClick={() => toggleCompareClass(c)} style={CHIP(compareClasses.includes(c))}>{c}반</button>
              ))}
            </div>
          </div>
        )}

        {/* 요일 (비교) */}
        {printType === "시간표 비교" && (
          <div>
            <label style={LABEL}>요일</label>
            <div style={{ display: "flex", gap: 5, marginTop: 8, flexWrap: "wrap" }}>
              <button onClick={() => setViewDay(null)} style={CHIP(viewDay === null)}>전체</button>
              {DAY_NAMES.map((d, i) => (
                <button key={d} onClick={() => setViewDay(i)} style={CHIP(viewDay === i)}>{d}</button>
              ))}
            </div>
          </div>
        )}

        {/* 주 이동 */}
        <div>
          <label style={LABEL}>주간</label>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 8 }}>
            <button onClick={() => { const d = new Date(selectedDate); d.setDate(d.getDate() - 7); setSelectedDate(d); }}
              style={{ ...CHIP(false), padding: "6px 10px" }}>◀</button>
            <span style={{ fontSize: "0.78rem", color: "#475569", flex: 1, textAlign: "center", lineHeight: 1.4 }}>{weekLabel(weekDays)}</span>
            <button onClick={() => { const d = new Date(selectedDate); d.setDate(d.getDate() + 7); setSelectedDate(d); }}
              style={{ ...CHIP(false), padding: "6px 10px" }}>▶</button>
          </div>
        </div>

        {/* 인쇄 버튼 */}
        <button
          onClick={handlePrint}
          style={{ marginTop: "auto", padding: "12px", borderRadius: 10, background: "#1e40af", color: "#fff", border: "none", cursor: "pointer", fontWeight: 700, fontSize: "0.95rem", letterSpacing: "0.03em" }}>
          🖨️ 인쇄
        </button>
      </div>

      {/* ── 오른쪽 A4 미리보기 ───────────────────────────────────────────── */}
      <div ref={outerRef} style={{ flex: 1, background: "#94a3b8", padding: 16, overflowY: "auto", display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
        {/* 안내 레이블 */}
        <div style={{ fontSize: "0.75rem", color: "#e2e8f0", marginBottom: 10, userSelect: "none" }}>
          A4 미리보기 (축소율 {Math.round(scale * 100)}%)
        </div>

        {/* A4 페이지 */}
        <div style={{ width: A4_W * scale, height: A4_H * scale, flexShrink: 0 }}>
          <div
            id="tt-print-a4"
            ref={previewRef}
            style={{
              width: A4_W, height: A4_H,
              background: "#fff",
              boxShadow: "0 4px 24px rgba(0,0,0,0.25)",
              overflow: "hidden",
              transform: `scale(${scale})`,
              transformOrigin: "top left",
            }}
          >
            {printType === "학급별" && (
              <ClassTemplate grade={grade} classNum={classNum} weekDays={weekDays} />
            )}
            {printType === "시간표 비교" && compareClasses.length >= 2 && (
              <CompareTemplate grade={grade} classes={compareClasses} weekDays={weekDays} viewDay={viewDay} />
            )}
            {printType === "시간표 비교" && compareClasses.length < 2 && (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "#94a3b8", fontSize: 14 }}>
                비교할 반을 2개 이상 선택하세요
              </div>
            )}
            {printType === "전체 학급" && (
              <AllClassTemplate grade={grade} weekDays={weekDays} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── 스타일 헬퍼 ───────────────────────────────────────────────────────────────
const LABEL: React.CSSProperties = { fontSize: "0.78rem", fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.06em" };
const CHIP = (active: boolean): React.CSSProperties => ({
  padding: "5px 10px", borderRadius: 6, border: "1.5px solid",
  fontSize: "0.82rem", fontWeight: 600, cursor: "pointer",
  background: active ? "#1e40af" : "#fff",
  color: active ? "#fff" : "#374151",
  borderColor: active ? "#1e40af" : "#e2e8f0",
});
