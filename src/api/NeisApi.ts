const API_BASE_URL = import.meta.env.VITE_API_URL as string;

export const allergyMap: Record<number, string> = {
  1: "난류", 2: "우유", 3: "메밀", 4: "땅콩", 5: "대두",
  6: "밀", 7: "고등어", 8: "게", 9: "새우", 10: "돼지고기",
  11: "복숭아", 12: "토마토", 13: "아황산류", 14: "호두",
  15: "닭고기", 16: "쇠고기", 17: "오징어", 18: "조개류",
};

export function parseAllergy(codeStr: string | null | undefined): string[] {
  if (!codeStr) return [];
  return codeStr.split(",").map((code) => allergyMap[Number(code)]).filter(Boolean);
}

export function extractAllergyFromDish(dishText: string | null | undefined): string[] {
  if (!dishText) return [];
  const cleaned = dishText.replaceAll("<br/>", " ").replaceAll("·", ".");
  const matches = cleaned.match(/\d+/g);
  if (!matches) return [];
  return [...new Set(matches.map(Number))].map((code) => allergyMap[code]).filter(Boolean);
}

export async function getMonthMeals(year: number, month: number): Promise<Record<string, unknown[]>> {
  try {
    const res = await fetch(`${API_BASE_URL}/meals/month?year=${year}&month=${month}`);
    if (!res.ok) return {};
    return await res.json();
  } catch {
    return {};
  }
}

export function getWeekRange(baseDate = new Date()): { start: string; end: string; days: string[] } {
  const day = baseDate.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(baseDate);
  monday.setDate(baseDate.getDate() + diffToMonday);

  const days: string[] = [];
  for (let i = 0; i < 5; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const offset = d.getTimezoneOffset() * 60000;
    const local = new Date(d.getTime() - offset);
    days.push(local.toISOString().slice(0, 10).replace(/-/g, ""));
  }
  return { start: days[0], end: days[4], days };
}

export async function getWeekTimetable(
  grade: number,
  classNum: number,
  startDate: string,
  endDate: string
): Promise<Record<string, unknown[]>> {
  try {
    const res = await fetch(
      `${API_BASE_URL}/timetable/week?grade=${grade}&classNum=${classNum}&from=${startDate}&to=${endDate}`
    );
    if (!res.ok) return {};
    return await res.json();
  } catch {
    return {};
  }
}

export async function getGradeSubjects(grade: number, classNum = 1): Promise<string[]> {
  const today = new Date().toISOString().slice(0, 10);
  const cacheKey = `neis_subjects_${grade}_${classNum}_${today}`;

  const cached = localStorage.getItem(cacheKey);
  if (cached) {
    try { return JSON.parse(cached); } catch { /* fall through */ }
  }

  try {
    const res = await fetch(`${API_BASE_URL}/timetable/subjects?grade=${grade}`);
    if (!res.ok) return [];
    const data = await res.json();
    const subjects: string[] = data.subjects ?? [];
    localStorage.setItem(cacheKey, JSON.stringify(subjects));
    Object.keys(localStorage)
      .filter((k) => k.startsWith(`neis_subjects_${grade}_${classNum}_`) && k !== cacheKey)
      .forEach((k) => localStorage.removeItem(k));
    return subjects;
  } catch {
    return [];
  }
}
