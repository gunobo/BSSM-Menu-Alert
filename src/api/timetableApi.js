/**
 * timetableApi.js
 * Spring Boot 백엔드 REST API로 시간표 데이터를 관리합니다.
 * Redis 캐싱은 백엔드에서 처리합니다.
 */

const API_BASE_URL = import.meta.env.VITE_API_URL;
const DAY_NAMES = ["월", "화", "수", "목", "금"];

function authHeaders() {
  const token = sessionStorage.getItem("accessToken");
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

// ─────────────────────────────────────────────
// 기본 시간표 조회 (관리자용)  GET /admin/timetable?grade=&classNum=
// returns: string[][] | null
// ─────────────────────────────────────────────
export async function getBaseTimetable(grade, classNum) {
  const res = await fetch(
    `${API_BASE_URL}/admin/timetable?grade=${grade}&classNum=${classNum}`,
    { headers: authHeaders() }
  );
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  return data.subjects ?? null;
}

// ─────────────────────────────────────────────
// 기본 시간표 조회 (학생용, 인증 불필요)  GET /timetable/base?grade=&classNum=
// returns: string[][] | null
// ─────────────────────────────────────────────
export async function getPublicBaseTimetable(grade, classNum) {
  try {
    const res = await fetch(
      `${API_BASE_URL}/timetable/base?grade=${grade}&classNum=${classNum}`
    );
    if (res.status === 404) return null;
    if (!res.ok) return null;
    const data = await res.json();
    return data.subjects ?? null;
  } catch {
    return null;
  }
}

// ─────────────────────────────────────────────
// 기본 시간표 저장  POST /admin/timetable
// 변경 감지 및 이력 기록은 백엔드에서 처리
// ─────────────────────────────────────────────
export async function saveBaseTimetable(grade, classNum, subjects, adminName) {
  const res = await fetch(`${API_BASE_URL}/admin/timetable`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ grade, classNum, subjects }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status}${text ? `: ${text}` : ""}`);
  }
}

// ─────────────────────────────────────────────
// 변경 이력 조회  GET /admin/timetable/logs?grade=&classNum=&limit=
// ─────────────────────────────────────────────
export async function getChangeLog(grade, classNum, limitCount = 30) {
  const res = await fetch(
    `${API_BASE_URL}/admin/timetable/logs?grade=${grade}&classNum=${classNum}&limit=${limitCount}`,
    { headers: authHeaders() }
  );
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  return data.map((log) => ({
    ...log,
    changedAt: log.changedAt ? new Date(log.changedAt) : null,
  }));
}

// ─────────────────────────────────────────────
// 유틸: dayIdx → 요일 이름
// ─────────────────────────────────────────────
export function dayName(idx) {
  return DAY_NAMES[idx] ?? "";
}
