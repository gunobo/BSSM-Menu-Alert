import React, { useState, useEffect, useMemo } from "react";
import { getWeekTimetable } from "../../api/NeisApi";
import { getPublicBaseTimetable } from "../../api/timetableApi";

const GRADES = [1, 2, 3];
const MAX_CLASSES = 4;
const MAX_PERIODS = 7;
const DAY_NAMES = ["월", "화", "수", "목", "금"];

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

type CellData = { subject: string; changed: boolean; baseSubject: string };
type ClassGrid = CellData[][];  // [period][day]

type Mode = "all" | "pick2";

const thStyle: React.CSSProperties = {
  border: "1px solid #e2e8f0",
  padding: "7px 12px",
  background: "#f1f5f9",
  fontSize: "0.85rem",
  textAlign: "center",
  whiteSpace: "nowrap",
};

const tdStyle: React.CSSProperties = {
  border: "1px solid #e2e8f0",
  padding: "7px 10px",
  textAlign: "center",
  fontSize: "0.85rem",
  verticalAlign: "middle",
  minWidth: 76,
};

export default function TimetableCompare() {
  const [grade, setGrade] = useState(1);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewDay, setViewDay] = useState<number | null>(null);
  const [mode, setMode] = useState<Mode>("all");
  const [pickA, setPickA] = useState(1);
  const [pickB, setPickB] = useState(2);

  const weekDays = useMemo(() => getWeekDays(selectedDate), [selectedDate]);

  const [grids, setGrids] = useState<Record<number, ClassGrid | null>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setGrids({});
    setLoading(true);
    const weekFrom = weekDays[0];
    const weekTo = weekDays[4];

    Promise.all(
      Array.from({ length: MAX_CLASSES }, (_, i) => i + 1).map(async (c) => {
        const [base, neis] = await Promise.all([
          getPublicBaseTimetable(grade, c).catch(() => null),
          getWeekTimetable(grade, c, weekFrom, weekTo).catch(() => ({})),
        ]);
        const grid: ClassGrid = [];
        for (let p = 0; p < MAX_PERIODS; p++) {
          const row: CellData[] = [];
          for (let d = 0; d < 5; d++) {
            const date = weekDays[d];
            const baseSubject = base?.subjects?.[p]?.[d] ?? "";
            const neisSlots = (neis as Record<string, Array<{ period: number; subject: string }>>)[date] ?? [];
            const neisSlot = neisSlots.find((s) => s.period === p + 1);
            const neisSubject = neisSlot?.subject ?? "";
            const changed = !!(neisSubject && baseSubject && neisSubject !== baseSubject);
            row.push({ subject: changed ? neisSubject : baseSubject, changed, baseSubject });
          }
          grid.push(row);
        }
        return { c, grid };
      })
    ).then((results) => {
      const next: Record<number, ClassGrid | null> = {};
      results.forEach(({ c, grid }) => { next[c] = grid; });
      setGrids(next);
    }).finally(() => setLoading(false));
  }, [grade, weekDays]);

  const handleWeekMove = (delta: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + delta * 7);
    setSelectedDate(d);
  };

  const displayDays = viewDay !== null ? [viewDay] : [0, 1, 2, 3, 4];

  // 전체 비교 모드: 1~4반 열
  const allClassCols = Array.from({ length: MAX_CLASSES }, (_, i) => i + 1);
  // 2반 선택 모드
  const pick2Cols = [pickA, pickB];

  function renderTable(cols: number[], dayIdx: number) {
    const colSubjects = cols.map((c) => {
      return Array.from({ length: MAX_PERIODS }, (_, pi) => grids[c]?.[pi]?.[dayIdx]?.subject ?? "");
    });

    return (
      <div className="compare-scroll" style={{ overflowX: "auto" }}>
        <table style={{ borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={{ ...thStyle, width: 48 }}>교시</th>
              {cols.map((c) => (
                <th key={c} style={thStyle}>{c}반</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: MAX_PERIODS }, (_, pi) => {
              const rowSubjects = cols.map((c) => grids[c]?.[pi]?.[dayIdx]?.subject ?? "");
              const allSame = rowSubjects.every((s) => s === rowSubjects[0]);
              return (
                <tr key={pi}>
                  <td style={{ ...tdStyle, fontWeight: 700, background: "#f8fafc", width: 48 }}>{pi + 1}</td>
                  {cols.map((c, ci) => {
                    const cell = grids[c]?.[pi]?.[dayIdx];
                    const isDiff = !allSame && !!cell?.subject;
                    return (
                      <td key={c} style={{
                        ...tdStyle,
                        background: cell?.changed ? "#fef9c3" : isDiff ? "#f0f9ff" : undefined,
                      }}>
                        <span style={{ fontWeight: cell?.changed ? 600 : undefined }}>
                          {cell?.subject || "—"}
                        </span>
                        {cell?.changed && (
                          <span style={{ display: "block", fontSize: "0.72rem", color: "#92400e" }}>
                            기본: {cell.baseSubject}
                          </span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div>
      <div className="admin-section">
        <h3>📊 학반별 시간표 비교</h3>
        <p style={{ color: "#64748b", marginBottom: 12, fontSize: "0.9rem" }}>
          같은 학년 내 반별 시간표를 나란히 비교합니다. 노란 셀은 NEIS 변경 교시, 파란 셀은 반간 차이입니다.
        </p>

        {/* 컨트롤 */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
          {/* 학년 */}
          <div className="tt-admin-selector-group">
            <span className="tt-admin-selector-label">학년</span>
            {GRADES.map((g) => (
              <button key={g} className={`tt-admin-cls-btn ${grade === g ? "active" : ""}`}
                onClick={() => setGrade(g)}>{g}학년</button>
            ))}
          </div>

          {/* 주 이동 */}
          <div className="tt-admin-selector-group" style={{ alignItems: "center", gap: 8 }}>
            <button className="tt-admin-cls-btn" onClick={() => handleWeekMove(-1)}>◀</button>
            <span style={{ fontSize: "0.85rem", color: "#475569", fontWeight: 600 }}>{weekLabel(weekDays)}</span>
            <button className="tt-admin-cls-btn" onClick={() => handleWeekMove(1)}>▶</button>
          </div>

          {/* 요일 */}
          <div className="tt-admin-selector-group">
            <span className="tt-admin-selector-label">요일</span>
            <button className={`tt-admin-cls-btn ${viewDay === null ? "active" : ""}`}
              onClick={() => setViewDay(null)}>전체</button>
            {DAY_NAMES.map((d, i) => (
              <button key={d} className={`tt-admin-cls-btn ${viewDay === i ? "active" : ""}`}
                onClick={() => setViewDay(i)}>{d}</button>
            ))}
          </div>

          {/* 비교 모드 */}
          <div className="tt-admin-selector-group">
            <span className="tt-admin-selector-label">모드</span>
            <button className={`tt-admin-cls-btn ${mode === "all" ? "active" : ""}`}
              onClick={() => setMode("all")}>전체(1~4반)</button>
            <button className={`tt-admin-cls-btn ${mode === "pick2" ? "active" : ""}`}
              onClick={() => setMode("pick2")}>2반 선택</button>
          </div>

          {/* 2반 선택 */}
          {mode === "pick2" && (
            <div className="tt-admin-selector-group" style={{ gap: 6 }}>
              <span className="tt-admin-selector-label">비교</span>
              <select
                value={pickA}
                onChange={(e) => setPickA(Number(e.target.value))}
                style={{ padding: "4px 8px", borderRadius: 6, border: "1px solid #cbd5e1", fontSize: "0.85rem" }}
              >
                {allClassCols.map((c) => <option key={c} value={c}>{c}반</option>)}
              </select>
              <span style={{ fontSize: "0.85rem", color: "#475569" }}>vs</span>
              <select
                value={pickB}
                onChange={(e) => setPickB(Number(e.target.value))}
                style={{ padding: "4px 8px", borderRadius: 6, border: "1px solid #cbd5e1", fontSize: "0.85rem" }}
              >
                {allClassCols.map((c) => <option key={c} value={c}>{c}반</option>)}
              </select>
            </div>
          )}

          {/* 인쇄 */}
          <div className="tt-admin-selector-group" style={{ marginLeft: "auto" }}>
            <button
              onClick={() => window.print()}
              style={{ padding: "6px 14px", borderRadius: 8, background: "#f0f9ff", border: "1px solid #bae6fd", color: "#0369a1", cursor: "pointer", fontWeight: 600, fontSize: "0.85rem" }}
            >
              🖨️ 인쇄
            </button>
          </div>
        </div>

        {loading ? (
          <p style={{ textAlign: "center", padding: "40px 0", color: "#94a3b8" }}>불러오는 중...</p>
        ) : (
          <>
            {displayDays.map((di) => (
              <div key={di} style={{ marginBottom: 24 }}>
                <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "#334155", marginBottom: 8 }}>
                  {DAY_NAMES[di]}요일 ({formatDate(weekDays[di])})
                </div>
                {renderTable(mode === "pick2" ? pick2Cols : allClassCols, di)}
              </div>
            ))}
            <div style={{ marginTop: 4, fontSize: "0.78rem", color: "#64748b", display: "flex", gap: 16 }}>
              <span>🟡 노란 셀 = NEIS 기준 변경</span>
              <span>🔵 파란 셀 = 반간 과목 다름</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
