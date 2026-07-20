const API_BASE_URL = import.meta.env.VITE_API_URL as string;
const DAY_NAMES = ["월", "화", "수", "목", "금"] as const;

function authHeaders(): Record<string, string> {
  const token = sessionStorage.getItem("accessToken");
  return { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
}

export interface BaseTimetableData {
  subjects: string[][];
  teachers: string[][] | null;
}

export interface TeacherMapData {
  teacherMap: Record<string, string[]>;
  subjectAlias: Record<string, string>;
}

export interface TeacherScheduleEntry {
  period: number;
  dayIdx: number;
  grade: number;
  classNum: number;
  subject: string;
}

export interface TeacherRosterEntry {
  id: number;
  name: string;
  department: string;
}

export interface ChangeLogEntry {
  id: string;
  grade: number;
  classNum: number;
  adminName: string;
  changedAt: Date | null;
  dayIdx: number;
  period: number;
  before: string;
  after: string;
}

export async function getBaseTimetable(grade: number, classNum: number): Promise<BaseTimetableData | null> {
  const res = await fetch(`${API_BASE_URL}/admin/timetable?grade=${grade}&classNum=${classNum}`, { headers: authHeaders() });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return (await res.json()) ?? null;
}

export async function getPublicBaseTimetable(grade: number, classNum: number): Promise<BaseTimetableData | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/timetable/base?grade=${grade}&classNum=${classNum}`);
    if (res.status === 404 || !res.ok) return null;
    const data = await res.json();
    if (!data?.subjects) return null;
    return { subjects: data.subjects, teachers: data.teachers ?? null };
  } catch { return null; }
}

export async function saveBaseTimetable(
  grade: number, classNum: number, subjects: string[][],
  adminName: string, teachers: string[][] | null = null
): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/admin/timetable`, {
    method: "POST", headers: authHeaders(),
    body: JSON.stringify({ grade, classNum, subjects, teachers }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status}${text ? `: ${text}` : ""}`);
  }
}

export async function getChangeLog(grade: number, classNum: number, limitCount = 30): Promise<ChangeLogEntry[]> {
  const res = await fetch(
    `${API_BASE_URL}/admin/timetable/logs?grade=${grade}&classNum=${classNum}&limit=${limitCount}`,
    { headers: authHeaders() }
  );
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  return data.map((log: ChangeLogEntry & { changedAt: string }) => ({
    ...log, changedAt: log.changedAt ? new Date(log.changedAt) : null,
  }));
}

export async function getPublicTeacherMap(grade: number, classNum: number): Promise<TeacherMapData | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/timetable/teacher-map?grade=${grade}&classNum=${classNum}`);
    if (!res.ok) return null;
    const data = await res.json();
    return { teacherMap: data.teacherMap ?? {}, subjectAlias: data.subjectAlias ?? {} };
  } catch { return null; }
}

export async function getTeacherMap(grade: number): Promise<TeacherMapData | null> {
  const res = await fetch(`${API_BASE_URL}/admin/teacher-map?grade=${grade}`, { headers: authHeaders() });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return await res.json();
}

export async function saveTeacherMap(
  grade: number, teacherMap: Record<string, unknown>, subjectAlias: Record<string, string>
): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/admin/teacher-map`, {
    method: "POST", headers: authHeaders(),
    body: JSON.stringify({ grade, teacherMap, subjectAlias }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
}

export async function getTeacherList(): Promise<string[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/timetable/teacher-list`);
    if (!res.ok) return [];
    const data = await res.json();
    return data.teachers ?? [];
  } catch { return []; }
}

export async function getTeacherSchedule(teacherName: string): Promise<TeacherScheduleEntry[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/timetable/teacher-schedule?name=${encodeURIComponent(teacherName)}`);
    if (!res.ok) return [];
    const data = await res.json();
    return data.schedule ?? [];
  } catch { return []; }
}

export async function getTeacherRoster(): Promise<TeacherRosterEntry[]> {
  const res = await fetch(`${API_BASE_URL}/admin/teachers`, { headers: authHeaders() });
  if (!res.ok) return [];
  return await res.json();
}

export async function addTeacherRoster(name: string, department = ""): Promise<TeacherRosterEntry> {
  const res = await fetch(`${API_BASE_URL}/admin/teachers`, {
    method: "POST", headers: authHeaders(), body: JSON.stringify({ name, department }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return await res.json();
}

export async function updateTeacherRoster(id: number, name: string, department = ""): Promise<TeacherRosterEntry> {
  const res = await fetch(`${API_BASE_URL}/admin/teachers/${id}`, {
    method: "PUT", headers: authHeaders(), body: JSON.stringify({ name, department }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return await res.json();
}

export async function deleteTeacherRoster(id: number): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/admin/teachers/${id}`, { method: "DELETE", headers: authHeaders() });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
}

export async function getGradeSubjectsFromBackend(grade: number): Promise<string[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/timetable/subjects?grade=${grade}`);
    if (!res.ok) return [];
    const data = await res.json();
    return data.subjects ?? [];
  } catch { return []; }
}

export async function getComciganTimetable(grade: number, classNum: number): Promise<Record<string, unknown[]> | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/timetable/comcigan?grade=${grade}&classNum=${classNum}`);
    if (!res.ok) return null;
    const data = await res.json();
    return data.available ? data.timetable : null;
  } catch { return null; }
}

export async function getPublicOverrides(
  grade: number, classNum: number, from: string, to: string
): Promise<Record<string, Record<number, { teacher: string; subject: string }>>> {
  try {
    const res = await fetch(`${API_BASE_URL}/timetable/overrides?grade=${grade}&classNum=${classNum}&from=${from}&to=${to}`);
    if (!res.ok) return {};
    return await res.json();
  } catch { return {}; }
}

export async function getOverrides(grade: number, classNum: number, from: string, to: string): Promise<unknown[]> {
  const res = await fetch(
    `${API_BASE_URL}/admin/timetable/overrides?grade=${grade}&classNum=${classNum}&from=${from}&to=${to}`,
    { headers: authHeaders() }
  );
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return await res.json();
}

export async function saveOverride(
  grade: number, classNum: number, date: string, period: number, subject: string, teacher: string
): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/admin/timetable/overrides`, {
    method: "POST", headers: authHeaders(),
    body: JSON.stringify({ grade, classNum, date, period, subject, teacher }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
}

export async function saveBaseOverride(
  grade: number, classNum: number, date: string, period: number, overrideSubject?: string
): Promise<void> {
  const body: Record<string, unknown> = { grade, classNum, date, period, subject: null, teacher: "" };
  if (overrideSubject !== undefined) body.overrideSubject = overrideSubject;
  const res = await fetch(`${API_BASE_URL}/admin/timetable/overrides`, {
    method: "POST", headers: authHeaders(), body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
}

export function dayName(idx: number): string {
  return DAY_NAMES[idx] ?? "";
}
