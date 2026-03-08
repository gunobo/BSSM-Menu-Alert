// VITE_ 접두어 환경변수 사용
const API_KEY = import.meta.env.VITE_REACT_APP_NEIS_API_KEY;
const ATPT_OFCDC_SC_CODE = "C10";
const SD_SCHUL_CODE = "7150658";

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
  18: "조개류"
};

/* =====================
   기존: 알레르기 코드 문자열 → 배열
   (NEIS ALLERGY 필드용)
===================== */
export function parseAllergy(codeStr) {
  if (!codeStr) return [];
  return codeStr
    .split(",")
    .map(code => allergyMap[Number(code)])
    .filter(Boolean);
}

/* =====================
   급식 메뉴 문자열에서
   알레르기 숫자 자동 추출
   (DDISH_NM 기반)
===================== */
export function extractAllergyFromDish(dishText) {
  if (!dishText) return [];

  const cleaned = dishText
    .replaceAll("<br/>", " ")
    .replaceAll("·", ".");

  const matches = cleaned.match(/\d+/g);
  if (!matches) return [];

  return [...new Set(matches.map(Number))]
    .map(code => allergyMap[code])
    .filter(Boolean);
}

/* =====================
   날짜 기준 급식 가져오기
===================== */
export async function getMealsByDate(date) {
  const ymd = date.replaceAll("-", "");
  const url = `https://open.neis.go.kr/hub/mealServiceDietInfo?KEY=${API_KEY}&Type=json&ATPT_OFCDC_SC_CODE=${ATPT_OFCDC_SC_CODE}&SD_SCHUL_CODE=${SD_SCHUL_CODE}&MLSV_YMD=${ymd}`;

  try {
    const res = await fetch(url);
    const data = await res.json();
    console.log("가져온 정보:", data);

    if (data.mealServiceDietInfo && data.mealServiceDietInfo[1]?.row) {
      return data.mealServiceDietInfo[1].row;
    }
    return [];
  } catch (err) {
    console.error("NEIS fetch error:", err);
    return [];
  }
}

/* =====================
   월 단위 급식 가져오기
===================== */
export async function getMonthMeals(year, month) {
  const result = {};
  const lastDay = new Date(year, month, 0).getDate();

  for (let day = 1; day <= lastDay; day++) {
    const ymd = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const meals = await getMealsByDate(ymd);
    if (meals.length > 0) {
      result[ymd] = meals;
    }
  }

  return result;
}

/* =====================
   주간 날짜 범위 계산 (월~금)
===================== */
export function getWeekRange(baseDate = new Date()) {
  const day = baseDate.getDay(); // 0=일, 1=월, ..., 6=토
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

  return {
    start: days[0],
    end: days[4],
    days,
  };
}

/* =====================
   주간 시간표 가져오기
===================== */
export async function getWeekTimetable(grade, classNum, startDate, endDate) {
  const url =
    `https://open.neis.go.kr/hub/hisTimetable` +
    `?KEY=${API_KEY}` +
    `&Type=json` +
    `&pIndex=1` +
    `&pSize=200` +
    `&ATPT_OFCDC_SC_CODE=${ATPT_OFCDC_SC_CODE}` +
    `&SD_SCHUL_CODE=${SD_SCHUL_CODE}` +
    `&GRADE=${grade}` +
    `&CLASS_NM=${classNum}` +
    `&TI_FROM_YMD=${startDate}` +
    `&TI_TO_YMD=${endDate}`;

  try {
    const res = await fetch(url);
    const json = await res.json();

    const resultCode = json?.hisTimetable?.[0]?.head?.[1]?.RESULT?.CODE;
    if (resultCode && resultCode !== "INFO-000") {
      console.warn("시간표 API 결과:", json?.hisTimetable?.[0]?.head?.[1]?.RESULT?.MESSAGE);
      return {};
    }

    const rows = json?.hisTimetable?.[1]?.row || [];
    const result = {};

    rows.forEach((item) => {
      const date = item.ALL_TI_YMD; // YYYYMMDD
      const period = Number(item.PERIO);
      const subject = item.ITRT_CNTNT?.trim() || "";

      if (!result[date]) result[date] = [];
      result[date][period - 1] = { period, subject };
    });

    // 빈 슬롯 제거
    Object.keys(result).forEach((date) => {
      result[date] = result[date].filter(Boolean);
      console.log("빈 슬롯 제거!")
    });

    return result;
  } catch (err) {
    console.error("시간표 API 오류:", err);
    return {};
  }
}