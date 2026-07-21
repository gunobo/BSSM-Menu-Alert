import { useState, useEffect } from "react";
import "../styles/period-widget.css";

const API_BASE_URL = import.meta.env.VITE_API_URL as string;

interface Period {
  id: number;
  period: number;
  label: string;
  start_time: string;
  end_time: string;
}

function toMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function nowMinutes(): number {
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes();
}

function getStatus(periods: Period[]) {
  const now = nowMinutes();
  for (let i = 0; i < periods.length; i++) {
    const p = periods[i];
    const start = toMinutes(p.start_time);
    const end = toMinutes(p.end_time);
    if (now >= start && now < end) {
      return { type: "class" as const, period: p, remaining: end - now };
    }
    if (now < start) {
      const prev = periods[i - 1];
      const breakStart = prev ? toMinutes(prev.end_time) : now;
      if (now >= breakStart) {
        return { type: "break" as const, next: p, remaining: start - now };
      }
    }
  }
  const last = periods[periods.length - 1];
  if (last && now >= toMinutes(last.end_time)) {
    return { type: "done" as const };
  }
  if (periods.length > 0 && now < toMinutes(periods[0].start_time)) {
    return { type: "before" as const, next: periods[0] };
  }
  return { type: "done" as const };
}

interface Props {
  grade: number;
  classNum: number;
}

export default function PeriodWidget({ grade, classNum }: Props) {
  const [periods, setPeriods] = useState<Period[]>([]);
  const [status, setStatus] = useState<ReturnType<typeof getStatus> | null>(null);

  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    fetch(`${API_BASE_URL}/class-periods?target_date=${today}`)
      .then(r => r.ok ? r.json() : [])
      .then(setPeriods)
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (periods.length === 0) return;
    const update = () => setStatus(getStatus(periods));
    update();
    const timer = setInterval(update, 30000);
    return () => clearInterval(timer);
  }, [periods]);

  if (!status || periods.length === 0) return null;

  return (
    <div className="pw-widget">
      <span className="pw-class-label">{grade}학년 {classNum}반</span>
      {status.type === "class" && (
        <>
          <span className="pw-badge pw-badge--class">수업 중</span>
          <span className="pw-info">{status.period.label} · {status.remaining}분 남음</span>
        </>
      )}
      {status.type === "break" && (
        <>
          <span className="pw-badge pw-badge--break">쉬는시간</span>
          <span className="pw-info">다음 {status.next.label} · {status.remaining}분 후</span>
        </>
      )}
      {status.type === "before" && (
        <>
          <span className="pw-badge pw-badge--before">수업 전</span>
          <span className="pw-info">{status.next.label} {status.next.start_time} 시작</span>
        </>
      )}
      {status.type === "done" && (
        <>
          <span className="pw-badge pw-badge--done">방과후</span>
          <span className="pw-info">오늘 수업 끝</span>
        </>
      )}
    </div>
  );
}
