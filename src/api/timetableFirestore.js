import { db } from "../firebase-config";
import {
  doc,
  getDoc,
  setDoc,
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  Timestamp,
  writeBatch,
} from "firebase/firestore";

/**
 * Firestore 컬렉션 구조
 *
 * [base_timetables]  ← 기본 시간표 원본
 *   doc id: "{grade}_{classNum}"
 *   { grade, classNum, subjects: string[][], updatedAt, updatedBy }
 *
 * [latest_changes]   ← 칸별 최신 변경 정보 (학생 페이지 툴팁용)
 *   doc id: "{grade}_{classNum}"
 *   { "{dayIdx}_{period}": { adminName, changedAt: Timestamp, before, after }, ... }
 *
 * [timetable_change_logs]  ← 전체 변경 이력 (관리자 이력 조회용)
 *   auto-id docs
 *   { grade, classNum, adminName, changedAt, dayIdx, period, before, after }
 *   ※ Firestore 복합 인덱스 필요: (grade ASC, classNum ASC, changedAt DESC)
 */

const COL_BASE      = "base_timetables";
const COL_LATEST    = "latest_changes";
const COL_LOG       = "timetable_change_logs";
const DAY_NAMES     = ["월", "화", "수", "목", "금"];

function baseDocId(grade, classNum) {
  return `${grade}_${classNum}`;
}

// ─────────────────────────────────────────────
// 기본 시간표 조회
// returns: string[][] | null  (문서 없으면 null)
// db가 null이거나 네트워크 오류는 throw → 호출부에서 연결 상태 판단
// ─────────────────────────────────────────────
export async function getBaseTimetable(grade, classNum) {
  if (!db) throw new Error("Firestore not initialized");
  const snap = await getDoc(doc(db, COL_BASE, baseDocId(grade, classNum)));
  if (!snap.exists()) return null;
  return snap.data().subjects ?? null;
}

// ─────────────────────────────────────────────
// 기본 시간표 저장 + 변경 이력 기록
// oldSubjects: 저장 직전 Firestore에 있던 값 (비교용)
// ─────────────────────────────────────────────
export async function saveBaseTimetable(grade, classNum, subjects, adminName = "", oldSubjects = null) {
  if (!db) throw new Error("Firestore not initialized");
  const batch = writeBatch(db);

  // 1) base_timetables 덮어쓰기
  batch.set(doc(db, COL_BASE, baseDocId(grade, classNum)), {
    grade,
    classNum,
    subjects,
    updatedAt: serverTimestamp(),
    updatedBy: adminName,
  });

  // 2) 변경된 칸 찾기
  const now = Timestamp.now();
  const latestUpdates = {};   // latest_changes 문서에 병합할 맵

  if (oldSubjects) {
    for (let pi = 0; pi < 7; pi++) {
      for (let di = 0; di < 5; di++) {
        const before = oldSubjects?.[pi]?.[di] ?? "";
        const after  = subjects?.[pi]?.[di]    ?? "";
        if (before === after) continue;

        const period = pi + 1;

        // 3) timetable_change_logs에 이력 추가
        const logRef = doc(collection(db, COL_LOG));
        batch.set(logRef, {
          grade,
          classNum,
          adminName,
          changedAt: serverTimestamp(),
          dayIdx: di,
          period,
          before,
          after,
        });

        // 4) latest_changes 맵 누적
        latestUpdates[`${di}_${period}`] = { adminName, changedAt: now, before, after };
      }
    }
  }

  // 5) latest_changes 문서 업데이트 (변경분만 merge)
  if (Object.keys(latestUpdates).length > 0) {
    batch.set(
      doc(db, COL_LATEST, baseDocId(grade, classNum)),
      latestUpdates,
      { merge: true }
    );
  }

  await batch.commit();
}

// ─────────────────────────────────────────────
// 칸별 최신 변경자 조회 (학생 페이지 툴팁용)
// returns: { "{dayIdx}_{period}": { adminName, changedAt, before, after }, ... }
// db가 null이거나 네트워크 오류는 throw → 호출부에서 연결 상태 판단
// ─────────────────────────────────────────────
export async function getLatestChanges(grade, classNum) {
  if (!db) throw new Error("Firestore not initialized");
  const snap = await getDoc(doc(db, COL_LATEST, baseDocId(grade, classNum)));
  if (!snap.exists()) return {};
  return snap.data();
}

// ─────────────────────────────────────────────
// 전체 변경 이력 조회 (관리자용)
// ※ Firestore Console에서 복합 인덱스 생성 필요:
//   컬렉션: timetable_change_logs
//   필드: grade ASC, classNum ASC, changedAt DESC
// ─────────────────────────────────────────────
export async function getChangeLog(grade, classNum, limitCount = 50) {
  if (!db) throw new Error("Firestore not initialized");
  try {
    const q = query(
      collection(db, COL_LOG),
      where("grade",    "==", grade),
      where("classNum", "==", classNum),
      orderBy("changedAt", "desc"),
      limit(limitCount)
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        ...data,
        // Firestore Timestamp → JS Date
        changedAt: data.changedAt?.toDate?.() ?? null,
      };
    });
  } catch (e) {
    // 복합 인덱스가 없으면 Firestore가 콘솔에 인덱스 생성 링크를 출력합니다
    console.error("변경 이력 조회 실패 (복합 인덱스 필요):", e);
    return [];
  }
}

// ─────────────────────────────────────────────
// 유틸: dayIdx → 요일 이름
// ─────────────────────────────────────────────
export function dayName(idx) {
  return DAY_NAMES[idx] ?? "";
}
