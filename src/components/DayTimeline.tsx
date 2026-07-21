import { useState, useEffect, useRef } from "react";
import "../styles/day-timeline.css";

const API = import.meta.env.VITE_API_URL as string;

interface Period {
  period: number;
  label: string;
  start_time: string;
  end_time: string;
}

interface MealTime {
  type: string;
  label: string;
  start_time: string;
  end_time: string;
}

interface Block {
  label: string;
  start: number; // minutes from 00:00
  end: number;
  kind: "period" | "break" | "meal";
  mealType?: string;
}

function toMin(t: string) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function nowMin() {
  const n = new Date();
  return n.getHours() * 60 + n.getMinutes() + n.getSeconds() / 60;
}

function minToLabel(m: number) {
  const h = Math.floor(m / 60);
  const min = Math.floor(m % 60);
  return `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
}

const MEAL_COLORS: Record<string, string> = {
  breakfast: "#f97316",
  lunch: "#16a34a",
  dinner: "#7c3aed",
};

export default function DayTimeline() {
  const [periods, setPeriods] = useState<Period[]>([]);
  const [meals, setMeals] = useState<MealTime[]>([]);
  const [now, setNow] = useState(nowMin());
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    fetch(`${API}/class-periods?target_date=${today}`)
      .then((r) => r.ok ? r.json() : [])
      .then(setPeriods)
      .catch(() => {});
    fetch(`${API}/meal-times`)
      .then((r) => r.ok ? r.json() : [])
      .then(setMeals)
      .catch(() => {});
  }, []);

  useEffect(() => {
    const t = setInterval(() => setNow(nowMin()), 10000);
    return () => clearInterval(t);
  }, []);

  // 현재 시간 기준으로 스크롤
  useEffect(() => {
    if (!containerRef.current || (periods.length === 0 && meals.length === 0)) return;
    const el = containerRef.current;
    const totalMin = viewEnd - viewStart;
    const pct = (now - viewStart) / totalMin;
    const scrollX = pct * el.scrollWidth - el.clientWidth / 2;
    el.scrollLeft = Math.max(0, scrollX);
  }, [periods, meals]);

  if (periods.length === 0 && meals.length === 0) return null;

  // 전체 뷰 범위 계산
  const allStarts = [
    ...periods.map((p) => toMin(p.start_time)),
    ...meals.map((m) => toMin(m.start_time)),
  ];
  const allEnds = [
    ...periods.map((p) => toMin(p.end_time)),
    ...meals.map((m) => toMin(m.end_time)),
  ];
  const viewStart = Math.max(0, Math.min(...allStarts) - 30);
  const viewEnd = Math.min(1440, Math.max(...allEnds) + 30);
  const totalMin = viewEnd - viewStart;

  const TIMELINE_PX = 2400;
  const pct = (min: number) => ((min - viewStart) / totalMin) * TIMELINE_PX;

  // 교시 블록 + 쉬는시간 생성
  const periodBlocks: Block[] = [];
  for (let i = 0; i < periods.length; i++) {
    const p = periods[i];
    periodBlocks.push({
      label: p.label,
      start: toMin(p.start_time),
      end: toMin(p.end_time),
      kind: "period",
    });
    if (i < periods.length - 1) {
      const breakStart = toMin(p.end_time);
      const breakEnd = toMin(periods[i + 1].start_time);
      if (breakEnd > breakStart) {
        periodBlocks.push({
          label: "쉬는 시간",
          start: breakStart,
          end: breakEnd,
          kind: "break",
        });
      }
    }
  }

  const mealBlocks: Block[] = meals.map((m) => ({
    label: m.label,
    start: toMin(m.start_time),
    end: toMin(m.end_time),
    kind: "meal",
    mealType: m.type,
  }));

  // 시간 눈금 (30분 단위)
  const ticks: number[] = [];
  for (let m = Math.ceil(viewStart / 30) * 30; m <= viewEnd; m += 30) {
    ticks.push(m);
  }

  const nowX = pct(now);
  const isInView = now >= viewStart && now <= viewEnd;

  return (
    <div className="dtl-outer">
      <div className="dtl-scroll" ref={containerRef}>
        <div className="dtl-canvas" style={{ width: TIMELINE_PX }}>
          {/* 시간 눈금 */}
          {ticks.map((t) => (
            <div
              key={t}
              className="dtl-tick"
              style={{ left: pct(t) }}
            >
              <span className="dtl-tick-label">{minToLabel(t)}</span>
            </div>
          ))}

          {/* 급식 행 */}
          <div className="dtl-row dtl-row--meal">
            {mealBlocks.map((b, i) => {
              const color = MEAL_COLORS[b.mealType ?? "lunch"] ?? "#64748b";
              return (
                <div
                  key={i}
                  className="dtl-block dtl-block--meal"
                  style={{
                    left: pct(b.start),
                    width: pct(b.end) - pct(b.start),
                    background: color + "22",
                    borderColor: color,
                    color,
                  }}
                >
                  <span className="dtl-block-label">{b.label}</span>
                  <span className="dtl-block-time">{minToLabel(b.start)}–{minToLabel(b.end)}</span>
                </div>
              );
            })}
          </div>

          {/* 교시 행 */}
          <div className="dtl-row dtl-row--period">
            {periodBlocks.map((b, i) => (
              <div
                key={i}
                className={`dtl-block dtl-block--${b.kind}`}
                style={{
                  left: pct(b.start),
                  width: pct(b.end) - pct(b.start),
                }}
              >
                <span className="dtl-block-label">{b.label}</span>
                {b.kind !== "break" && (
                  <span className="dtl-block-time">{minToLabel(b.start)}–{minToLabel(b.end)}</span>
                )}
              </div>
            ))}
          </div>

          {/* 현재 시간 인디케이터 */}
          {isInView && (
            <div className="dtl-now" style={{ left: nowX }}>
              <span className="dtl-now-label">{minToLabel(now)}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
