if (typeof window !== "undefined" && !("Notification" in window)) {
  (window as unknown as Record<string, unknown>).Notification = {
    permission: "granted",
    requestPermission: () => Promise.resolve("granted"),
    addEventListener: () => {},
    removeEventListener: () => {},
  };
}

import React, { useEffect, useState } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import axios from "axios";
import { messaging } from "./firebase-config";
import { onMessage, getToken, type Messaging } from "firebase/messaging";
import Login from "./pages/Login";
import Home from "./pages/Home";
import MyPage from "./pages/MyPage";
import AdminRoute from "./Routes/AdminRoute";
import AdminPage from "./pages/AdminPage";
import Announcements from "./pages/Announcements";
import AnnouncementDetail from "./pages/AnnouncementDetail";
import NotFound from "./pages/NOTFOUND";
import AppDownload from "./pages/AppDownload";
import PrivacyPolicy from "./pages/Privacypolicy";
import DeleteAccount from "./pages/Deleteaccount";
import TimetablePage from "./pages/Timetable";
import TeacherTimetablePage from "./pages/TeacherTimetable";
import ReportList from "./pages/ReportList";
import ReportDetail from "./pages/ReportDetail";

export default function App() {
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const VAPID_KEY = import.meta.env.VITE_FCM_VAPID_KEY as string | undefined;
  const Base_URL = import.meta.env.VITE_API_URL as string | undefined;

  const checkAppUpdate = () => {
    try {
      if (window.Android && typeof (window.Android as Record<string, unknown>).checkUpdate === "function") {
        (window.Android as Record<string, () => void>).checkUpdate();
      }
    } catch (e) {
      console.warn("App update check failed:", e);
    }
  };

  useEffect(() => {
    (window as unknown as Record<string, unknown>).onDeepLink = (date: string) => {
      if (date) navigate(`/?date=${date}`);
    };

    checkAppUpdate();

    const params = new URLSearchParams(window.location.search);
    params.get("date");

    window.addEventListener("beforeinstallprompt", (e) => {
      e.preventDefault();
      return false;
    });

    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as unknown as Record<string, unknown>).MSStream;
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches;
    if (isIOS && !isStandalone) {
      alert("아이폰 유저분들은 사파리 하단의 '공유' 버튼을 누른 뒤 '홈 화면에 추가'를 선택하시면 앱처럼 사용 가능합니다! 🍱");
    }

    const syncFCMToken = async () => {
      const isMock = "_isMock" in messaging;
      if (window.Android || isMock) return;

      try {
        if (!("serviceWorker" in navigator) || !("Notification" in window)) return;
        const registration = await navigator.serviceWorker.ready;
        if (!registration?.pushManager) return;

        const permission = await window.Notification.requestPermission();
        if (permission !== "granted" || !VAPID_KEY) return;

        const token = await getToken(messaging as Messaging, {
          vapidKey: VAPID_KEY,
          serviceWorkerRegistration: registration,
        });

        if (token) {
          const jwtToken = sessionStorage.getItem("accessToken") || localStorage.getItem("accessToken");
          if (jwtToken && Base_URL) {
            await axios.post(
              `${Base_URL}/user/fcm-token`,
              { token },
              { headers: { Authorization: `Bearer ${jwtToken}`, "Content-Type": "application/json" } }
            );
          }
        }
      } catch (error: unknown) {
        const silentErrors = ["MOCK_NO_SUBSCRIPTION", "FCM_DISABLED", "endpoint"];
        const msg = error instanceof Error ? error.message : "";
        if (!silentErrors.some((s) => msg.includes(s))) {
          console.warn("FCM registration process error:", msg);
        }
      }
    };

    syncFCMToken();
    setLoading(false);

    let unsubscribe: () => void = () => {};
    const isMock = "_isMock" in messaging;
    if (!window.Android && !isMock && "Notification" in window) {
      try {
        unsubscribe = onMessage(messaging as Messaging, (payload) => {
          if (window.Notification?.permission === "granted" && payload.notification) {
            const { title = "", body, image } = payload.notification;
            const targetDate = (payload.data as Record<string, string> | undefined)?.targetDate;
            const notification = new window.Notification(title, {
              body, icon: image || "/logo192.png",
              data: { targetDate },
            });
            notification.onclick = (event) => {
              event.preventDefault();
              window.focus();
              navigate(targetDate ? `/?date=${targetDate}` : "/");
              notification.close();
            };
          }
        });
      } catch (e: unknown) {
        if (e instanceof Error) console.warn("Foreground message listener setup skipped:", e.message);
      }
    }

    return () => unsubscribe();
  }, [navigate, VAPID_KEY, Base_URL]);

  if (loading) return <div>로딩 중...</div>;

  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/mypage" element={<MyPage />} />
      <Route path="/announcements" element={<Announcements />} />
      <Route path="/announcements/:id" element={<AnnouncementDetail />} />
      <Route path="/appdownload" element={<AppDownload />} />
      <Route path="/privacy" element={<PrivacyPolicy />} />
      <Route path="/delete-account" element={<DeleteAccount />} />
      <Route path="/timetable" element={<TimetablePage />} />
      <Route path="/timetable/t" element={<TeacherTimetablePage />} />
      <Route path="/my-report" element={<ReportList />} />
      <Route path="/my-report/:id" element={<ReportDetail />} />
      <Route
        path="/admin"
        element={
          <AdminRoute>
            <AdminPage />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/:menu"
        element={
          <AdminRoute>
            <AdminPage />
          </AdminRoute>
        }
      />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
