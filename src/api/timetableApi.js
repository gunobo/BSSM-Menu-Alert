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
  // { subjects, teachers } 모두 반환
  return data ?? null;
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
    // { subjects[][], teachers[][] } 형태로 반환
    if (!data?.subjects) return null;
    return { subjects: data.subjects, teachers: data.teachers ?? null };
  } catch {
    return null;
  }
}

// ─────────────────────────────────────────────
// 기본 시간표 저장  POST /admin/timetable
// 변경 감지 및 이력 기록은 백엔드에서 처리
// ─────────────────────────────────────────────
export async function saveBaseTimetable(grade, classNum, subjects, adminName, teachers = null) {
  const res = await fetch(`${API_BASE_URL}/admin/timetable`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ grade, classNum, subjects, teachers }),
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
// 교사 매핑 조회 (학생용, 인증 불필요)
// GET /timetable/teacher-map?grade=&classNum=
// returns: { teacherMap: {[subject]: string[]}, subjectAlias: {[subject]: string} } | null
// ─────────────────────────────────────────────
export async function getPublicTeacherMap(grade, classNum) {
  try {
    const res = await fetch(
      `${API_BASE_URL}/timetable/teacher-map?grade=${grade}&classNum=${classNum}`
    );
    if (!res.ok) return null;
    const data = await res.json();
    return {
      teacherMap: data.teacherMap ?? {},
      subjectAlias: data.subjectAlias ?? {},
    };
  } catch {
    return null;
  }
}

// ─────────────────────────────────────────────
// 교사 매핑 조회 (관리자용)  GET /admin/teacher-map?grade=
// returns: { grade, teacherMap, subjectAlias } | null
// ─────────────────────────────────────────────
export async function getTeacherMap(grade) {
  const res = await fetch(
    `${API_BASE_URL}/admin/teacher-map?grade=${grade}`,
    { headers: authHeaders() }
  );
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return await res.json(); // { grade, teacherMap, subjectAlias }
}

// ─────────────────────────────────────────────
// 교사 매핑 저장  POST /admin/teacher-map
// teacherMap: { [subject]: { [classNum]: string[] } }
// subjectAlias: { [subject]: string }
// ─────────────────────────────────────────────
export async function saveTeacherMap(grade, teacherMap, subjectAlias) {
  const res = await fetch(`${API_BASE_URL}/admin/teacher-map`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ grade, teacherMap, subjectAlias }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status}${text ? `: ${text}` : ""}`);
  }
}

// ─────────────────────────────────────────────
// 전체 교사 목록 조회 (학생용)  GET /timetable/teacher-list
// returns: string[]
// ─────────────────────────────────────────────
export async function getTeacherList() {
  try {
    const res = await fetch(`${API_BASE_URL}/timetable/teacher-list`);
    if (!res.ok) return [];
    const data = await res.json();
    return data.teachers ?? [];
  } catch {
    return [];
  }
}

// ─────────────────────────────────────────────
// 교사 시간표 조회 (학생용)  GET /timetable/teacher-schedule?name=
// returns: [{ period, dayIdx, grade, classNum, subject }]
// ─────────────────────────────────────────────
export async function getTeacherSchedule(teacherName) {
  try {
    const res = await fetch(
      `${API_BASE_URL}/timetable/teacher-schedule?name=${encodeURIComponent(teacherName)}`
    );
    if (!res.ok) return [];
    const data = await res.json();
    return data.schedule ?? [];
  } catch {
    return [];
  }
}

// ─────────────────────────────────────────────
// 교직원 목록 조회  GET /admin/teachers
// returns: [{id, name, department}]
// ─────────────────────────────────────────────
export async function getTeacherRoster() {
  const res = await fetch(`${API_BASE_URL}/admin/teachers`, { headers: authHeaders() });
  if (!res.ok) return [];
  return await res.json();
}

// ─────────────────────────────────────────────
// 교직원 추가  POST /admin/teachers
// ─────────────────────────────────────────────
export async function addTeacherRoster(name, department = "") {
  const res = await fetch(`${API_BASE_URL}/admin/teachers`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ name, department }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return await res.json();
}

// ─────────────────────────────────────────────
// 교직원 수정  PUT /admin/teachers/{id}
// ─────────────────────────────────────────────
export async function updateTeacherRoster(id, name, department = "") {
  const res = await fetch(`${API_BASE_URL}/admin/teachers/${id}`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify({ name, department }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return await res.json();
}

// ─────────────────────────────────────────────
// 교직원 삭제  DELETE /admin/teachers/{id}
// ─────────────────────────────────────────────
export async function deleteTeacherRoster(id) {
  const res = await fetch(`${API_BASE_URL}/admin/teachers/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
}

// ─────────────────────────────────────────────
// 백엔드에서 학년 과목 목록 조회  GET /timetable/subjects?grade=
// returns: string[]
// ─────────────────────────────────────────────
export async function getGradeSubjectsFromBackend(grade) {
  try {
    const res = await fetch(`${API_BASE_URL}/timetable/subjects?grade=${grade}`);
    if (!res.ok) return [];
    const data = await res.json();
    return data.subjects ?? [];
  } catch {
    return [];
  }
}

// ─────────────────────────────────────────────
// 컴시간 알리미 이번 주 시간표 (교시별 교사 포함)
// GET /timetable/comcigan?grade=&classNum=
// returns: { "yyyyMMdd": [{period, subject, teacher}] } | null
// ─────────────────────────────────────────────
export async function getComciganTimetable(grade, classNum) {
  try {
    const res = await fetch(
      `${API_BASE_URL}/timetable/comcigan?grade=${grade}&classNum=${classNum}`
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data.available ? data.timetable : null;
  } catch {
    return null;
  }
}

// ─────────────────────────────────────────────
// 날짜별 교시 교사 오버라이드 조회 (학생용, 인증 불필요)
// GET /timetable/overrides?grade=&classNum=&from=yyyyMMdd&to=yyyyMMdd
// returns: { "yyyyMMdd": { period(number): { teacher, subject } } }
// ─────────────────────────────────────────────
export async function getPublicOverrides(grade, classNum, from, to) {
  try {
    const res = await fetch(
      `${API_BASE_URL}/timetable/overrides?grade=${grade}&classNum=${classNum}&from=${from}&to=${to}`
    );
    if (!res.ok) return {};
    return await res.json();
  } catch {
    return {};
  }
}

// ─────────────────────────────────────────────
// 날짜별 교시 교사 오버라이드 조회 (관리자용)
// GET /admin/timetable/overrides?grade=&classNum=&from=&to=
// ─────────────────────────────────────────────
export async function getOverrides(grade, classNum, from, to) {
  const res = await fetch(
    `${API_BASE_URL}/admin/timetable/overrides?grade=${grade}&classNum=${classNum}&from=${from}&to=${to}`,
    { headers: authHeaders() }
  );
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return await res.json(); // TimetableOverride[]
}

// ─────────────────────────────────────────────
// NEIS 변경 교시 교사 오버라이드 저장/업서트 (관리자용)
// POST /admin/timetable/overrides
// teacher 빈 문자열이면 해당 항목 삭제
// ─────────────────────────────────────────────
export async function saveOverride(grade, classNum, date, period, subject, teacher) {
  const res = await fetch(`${API_BASE_URL}/admin/timetable/overrides`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ grade, classNum, date, period, subject, teacher }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
}

// ─────────────────────────────────────────────
// 기본 시간표 기준 교시 과목 오버라이드 저장/업서트 (관리자용)
// POST /admin/timetable/overrides
// overrideSubject: "" = 수업없음, "시험" 등 = 해당 문자열로 표시
// overrideSubject = undefined → 초기화(삭제)
// ─────────────────────────────────────────────
export async function saveBaseOverride(grade, classNum, date, period, overrideSubject) {
  const body = { grade, classNum, date, period, subject: null, teacher: "" };
  // undefined이면 키 자체를 보내지 않음 → 백엔드에서 null로 인식 → 삭제 처리
  if (overrideSubject !== undefined) body.overrideSubject = overrideSubject;
  const res = await fetch(`${API_BASE_URL}/admin/timetable/overrides`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
}

// ─────────────────────────────────────────────
// 유틸: dayIdx → 요일 이름
// ─────────────────────────────────────────────
export function dayName(idx) {
  return DAY_NAMES[idx] ?? "";
}
