import { initializeApp, type FirebaseApp } from "firebase/app";
import { getMessaging, isSupported, type Messaging } from "firebase/messaging";

const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
};

const isConfigured = !!firebaseConfig.apiKey && !!firebaseConfig.projectId;
const app: FirebaseApp | null = isConfigured ? initializeApp(firebaseConfig) : null;

type MockMessaging = {
  _isMock: true;
  app: FirebaseApp | null;
};

const mockMessaging: MockMessaging = { _isMock: true, app };

export let messaging: Messaging | MockMessaging = mockMessaging;

(async () => {
  if (typeof window === "undefined" || !app || window.Android) return;
  try {
    const supported = await isSupported();
    if (supported && "Notification" in window) {
      messaging = getMessaging(app);
    }
  } catch (err: unknown) {
    if (err instanceof Error) console.warn("FCM init skipped:", err.message);
  }
})();
