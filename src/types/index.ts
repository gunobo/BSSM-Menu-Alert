// ── 유저 ──────────────────────────────────────────────────────
export interface User {
  id: number;
  email: string;
  name: string;
  googleId?: string;
  picture?: string;
  role: "ADMIN" | "ROLE_ADMIN" | "MODERATOR" | "ROLE_MODERATOR" | "TEACHER" | "ROLE_TEACHER" | "USER" | "ROLE_USER";
  banned?: boolean;
  bannedReason?: string;
  allergies?: number[];
  favoriteMenus?: string[];
  allowNotifications?: boolean;
  allow_notifications?: boolean;
  allowAllergyNotifications?: boolean;
  allow_allergy_notifications?: boolean;
  allowFavoriteNotifications?: boolean;
  allow_favorite_notifications?: boolean;
  class?: number;
  classnum?: number;
  students_class?: number;
  students_class_num?: number;
  userName?: string;
  banReason?: string;
  banExpiresAt?: string | null;
}

// ── 유저 상세 정보 (탈퇴 페이지용) ────────────────────────────
export interface UserInfo {
  id?: number;
  email?: string;
  name?: string;
  picture?: string;
  likeCount?: number;
  commentCount?: number;
}

// ── 나이스 급식 데이터 ─────────────────────────────────────────
export interface NeisMeal {
  DDISH_NM: string;
  MMEAL_SC_NM: string;
  MMEAL_SC_CODE?: string;
}

// ── 랭킹 아이템 ───────────────────────────────────────────────
export interface RankingItem {
  mealDate: string;
  mealType: string;
  mealKey?: string;
  likeCount: number;
}

// ── 신고/건의 대상 ─────────────────────────────────────────────
export interface ReportTarget {
  id: number;
  type: string;
  name: string;
}

// ── 신고/건의 ─────────────────────────────────────────────────
export interface Report {
  id: number;
  type?: string;
  reason?: string;
  content?: string;
  createdAt?: string;
  targetId?: number;
  isReported?: boolean;
}

// ── 공지 (팝업/상세용) ────────────────────────────────────────
export interface Notice {
  id: number;
  title: string;
  content?: string;
  imageUrl?: string;
  type?: string;
  createdAt?: string;
}

// ── 한줄평 댓글 ───────────────────────────────────────────────
export interface Comment {
  username?: string;
  content: string;
}

// ── 댓글 모달 대상 ────────────────────────────────────────────
export interface CommentTarget {
  mealKey: string;
  mealType: string;
  mealDate: string;
}

// ── 교사 시간표 항목 ──────────────────────────────────────────
export interface TeacherScheduleEntry {
  period: number;
  dayIdx: number;
  grade: number;
  classNum: number;
  subject: string;
}

// ── Navbar Props ──────────────────────────────────────────────
export interface NavbarProps {
  selectedDate?: string | Date;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setSelectedDate?: (date: any) => void;
}

// ── 로그인 이력 ───────────────────────────────────────────────
export interface LoginHistory {
  id: number;
  email: string;
  userName: string;
  networkIp: string | null;
  loginAt: string;
}

// ── 급식 ──────────────────────────────────────────────────────
export interface MealMenu {
  date: string;
  menu: string[];
  calories?: string;
}

// ── 시간표 ────────────────────────────────────────────────────
export interface TimetablePeriod {
  subject: string;
  teacher?: string;
  isChanged?: boolean;
  isOverride?: boolean;
  isEmpty?: boolean;
}

export interface TimetableDay {
  date: string;
  periods: TimetablePeriod[];
}

// ── 공지사항 ──────────────────────────────────────────────────
export interface Announcement {
  id: number;
  title: string;
  content?: string;
  createdAt: string;
  createdBy?: string;
  fileUrl?: string;
}

// ── 관리자 통계 ───────────────────────────────────────────────
export interface AdminStats {
  totalUsers: number;
  totalLikes: number;
  totalReports: number;
  weeklySignups: number[];
}

// ── FCM 알림 ──────────────────────────────────────────────────
export interface NotificationLog {
  id: number;
  sentAt: string;
  senderEmail: string;
  title: string;
  targetType: string;
  totalCount: number;
  successCount: number;
  failureCount: number;
}

// ── 페이지네이션 ──────────────────────────────────────────────
export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
}

// ── Android WebView 인터페이스 ────────────────────────────────
declare global {
  interface Window {
    Android?: {
      googleLogin: () => void;
      requestFcmToken?: () => void;
    };
    onNativeLoginSuccess?: (idToken: string) => void;
  }
}
