/**
 * NeisApi.js
 * NEIS 데이터를 백엔드 프록시를 통해 조회합니다.
 * API 키는 백엔드 환경변수에서만 사용되며 클라이언트에 노출되지 않습니다.
 */

const API_BASE_URL = import.meta.env.VITE_API_URL;

/* =====================
   알레르기 코드 매핑
===================== */
export const allergyMap = {
  1: "난류",
  2: "우유",
  3: "메밀",
  4: "땅콩",
  5: "대두",
  6: "밀",
  7: "고등어",
  8: "게",
  9: "새우",
  10: "돼지고기",
  11: "복숭아",
  12: "토마토",
  13: "아황산류",
  14: "호두",
  15: "닭고기",
  16: "쇠고기",
  17: "오징어",
  18: "조개류",
};

/* =====================
   알레르기 코드 문자열 → 배열
===================== */
export function parseAllergy(codeStr) {
  if (!codeStr) return [];
  return codeStr
    .split(",")
    .map((code) => allergyMap[Number(code)])
    .filter(Boolean);
}

/* =====================
   급식 메뉴 문자열에서 알레르기 숫자 자동 추출
   (DDISH_NM 기반)
===================== */
export function extractAllergyFromDish(dishText) {
  if (!dishText) return [];
  const cleaned = dishText.replaceAll("<br/>", " ").replaceAll("·", ".");
  const matches = cleaned.match(/\d+/g);
  if (!matches) return [];
  return [...new Set(matches.map(Number))]
    .map((code) => allergyMap[code])
    .filter(Boolean);
}

/* =====================
   월 단위 급식 가져오기 (백엔드 프록시)
   반환: { "yyyy-MM-dd": [{ DDISH_NM, MMEAL_SC_NM, ... }] }
===================== */
export async function getMonthMeals(year, month) {
  try {
    const res = await fetch(
      `${API_BASE_URL}/meals/month?year=${year}&month=${month}`
    );
    if (!res.ok) return {};
    return await res.json();
  } catch (err) {
    console.error("급식 데이터 로드 실패:", err);
    return {};
  }
}

/* =====================
   주간 날짜 범위 계산 (월~금)
===================== */
export function getWeekRange(baseDate = new Date()) {
  const day = baseDate.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(baseDate);
  monday.setDate(baseDate.getDate() + diffToMonday);

  const days = [];
  for (let i = 0; i < 5; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const offset = d.getTimezoneOffset() * 60000;
    const local = new Date(d.getTime() - offset);
    days.push(local.toISOString().slice(0, 10).replace(/-/g, ""));
  }
  return { start: days[0], end: days[4], days };
}

/* =====================
   주간 시간표 가져오기 (백엔드 프록시)
   반환: { "yyyyMMdd": [{ period, subject }] }
===================== */
export async function getWeekTimetable(grade, classNum, startDate, endDate) {
  try {
    const res = await fetch(
      `${API_BASE_URL}/timetable/week` +
      `?grade=${grade}&classNum=${classNum}&from=${startDate}&to=${endDate}`
    );
    if (!res.ok) return {};
    return await res.json();
  } catch (err) {
    console.error("시간표 API 오류:", err);
    return {};
  }
}

/* =====================
   학년 전체 과목 목록 수집 (백엔드 프록시)
   - localStorage에 오늘 날짜 기준으로 캐싱
===================== */
export async function getGradeSubjects(grade, classNum = 1) {
  const today = new Date().toISOString().slice(0, 10);
  const cacheKey = `neis_subjects_${grade}_${classNum}_${today}`;

  const cached = localStorage.getItem(cacheKey);
  if (cached) {
    try {
      return JSON.parse(cached);
    } catch {
      // 파싱 실패 시 재조회
    }
  }

  try {
    // 백엔드 /api/timetable/subjects 엔드포인트 사용 (이미 프록시됨)
    const res = await fetch(`${API_BASE_URL}/timetable/subjects?grade=${grade}`);
    if (!res.ok) return [];
    const data = await res.json();
    const subjects = data.subjects ?? [];

    localStorage.setItem(cacheKey, JSON.stringify(subjects));

    // 이전 날짜 캐시 정리
    Object.keys(localStorage)
      .filter(
        (k) =>
          k.startsWith(`neis_subjects_${grade}_${classNum}_`) && k !== cacheKey
      )
      .forEach((k) => localStorage.removeItem(k));

    return subjects;
  } catch (err) {
    console.error("과목 목록 로드 실패:", err);
    return [];
  }
}
