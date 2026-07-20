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
