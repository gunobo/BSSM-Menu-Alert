import { initializeApp } from "firebase/app";
import { getMessaging, isSupported } from "firebase/messaging";

const firebaseConfig = {
  apiKey: "AIzaSyC8mTc2ZECs9ZfGlAoHHUCjV_wHT2jz7xY",
  authDomain: "bssm-meal-alerter.firebaseapp.com",
  projectId: "bssm-meal-alerter",
  storageBucket: "bssm-meal-alerter.firebasestorage.app",
  messagingSenderId: "392151699714",
  appId: "1:392151699714:web:f8084fd2f21a94b725721b",
};

// 1. Firebase 앱 초기화
const app = initializeApp(firebaseConfig);

// 2. 가짜(Mock) 메시징 객체 정의 (최종 방어형)
const mockMessaging = {
  _isMock: true,
  app: app,
  onMessage: () => () => {},
  // ⭐️ getToken 호출 시 Reject를 반환하여 라이브러리 내부의 'endpoint' 참조 로직을 차단합니다.
  getToken: () => Promise.reject(new Error("FCM_DISABLED_IN_WEBVIEW")),
  deleteToken: () => Promise.resolve(true),
  swRegistration: {
    pushManager: {
      // null 대신 Reject를 주어 라이브러리가 이후의 .endpoint 접근을 하지 못하게 함
      getSubscription: () => Promise.reject(new Error("MOCK_NO_SUBSCRIPTION")),
      subscribe: () => Promise.reject(new Error("MOCK_SUBSCRIBE_NOT_ALLOWED")),
    },
  },
};

// 3. 메시징 객체 초기화 로직
const initializeMessaging = async () => {
  // SSR 환경 대응
  if (typeof window === "undefined") return mockMessaging;

  // ✅ 안드로이드 앱 환경(WebView)인 경우 즉시 가짜 객체 반환
  if (window.Android) {
    console.log("Android WebView detected: skipping FCM messaging initialization.");
    return mockMessaging;
  }

  try {
    // 브라우저가 FCM을 지원하는지 확인
    const supported = await isSupported();
    
    // Notification API가 존재하고 지원되는 경우에만 실제 messaging 생성
    if (supported && ("Notification" in window)) {
      return getMessaging(app);
    }
  } catch (err) {
    console.warn("FCM Support check failed, falling back to mock:", err);
  }
  
  // 지원되지 않는 환경이면 가짜 객체 반환
  return mockMessaging;
};

// Top-level await를 사용하여 초기화
const messaging = await initializeMessaging().catch((err) => {
  console.error("Messaging init failed:", err);
  return mockMessaging;
});

export { messaging };