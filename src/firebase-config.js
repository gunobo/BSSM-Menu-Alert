import { initializeApp } from "firebase/app";
import { getMessaging, isSupported } from "firebase/messaging";

const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
};

// env 변수가 없으면 Firebase를 초기화하지 않고 null 반환
const isConfigured = !!firebaseConfig.apiKey && !!firebaseConfig.projectId;

// 1. Firebase 앱 초기화
const app = isConfigured ? initializeApp(firebaseConfig) : null;

// 2. 가짜(Mock) 메시징 객체 — 즉시 사용 가능한 기본값
const mockMessaging = {
  _isMock: true,
  app: app,
  onMessage: () => () => {},
  getToken: () => Promise.reject(new Error("FCM_DISABLED")),
  deleteToken: () => Promise.resolve(true),
  swRegistration: {
    pushManager: {
      getSubscription: () => Promise.reject(new Error("MOCK_NO_SUBSCRIPTION")),
      subscribe: () => Promise.reject(new Error("MOCK_SUBSCRIBE_NOT_ALLOWED")),
    },
  },
};

// ⭐ top-level await 제거 → 즉시 mockMessaging으로 시작, 백그라운드에서 실제 객체로 교체
export let messaging = mockMessaging;

(async () => {
  if (typeof window === "undefined" || !app || window.Android) return;
  try {
    const supported = await isSupported();
    if (supported && "Notification" in window) {
      messaging = getMessaging(app);
    }
  } catch (err) {
    console.warn("FCM init skipped:", err.message);
  }
})();

