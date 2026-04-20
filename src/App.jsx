// ⭐️ 1. 라이브러리 로드 전 Notification 에러 방지 (최상단 유지)
if (typeof window !== 'undefined' && !('Notification' in window)) {
  window.Notification = {
    permission: 'granted',
    requestPermission: () => Promise.resolve('granted'),
    addEventListener: () => {},
    removeEventListener: () => {},
  };
  console.log("✅ [System] 안드로이드 웹뷰 환경을 위해 가짜 Notification 객체가 생성되었습니다.");
}

import React, { useEffect, useState } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import axios from "axios";
import { messaging } from "./firebase-config";
import { onMessage, getToken } from "firebase/messaging";
import Login from "./pages/Login.jsx";
import Home from "./pages/Home.jsx";
import MyPage from "./pages/MyPage.jsx";
import AdminRoute from "./Routes/AdminRoute.jsx";
import AdminPage from "./pages/AdminPage.jsx";
import Announcements from "./pages/Announcements.jsx";
import AnnouncementDetail from "./pages/AnnouncementDetail.jsx";
import NotFound from "./pages/NOTFOUND.jsx";
import AppDownload from "./pages/AppDownload.jsx";
import PrivacyPolicy from "./pages/Privacypolicy.jsx";
import DeleteAccount from "./pages/Deleteaccount.jsx";
import TimetablePage from "./pages/Timetable.jsx";

export default function App() {
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const VAPID_KEY = import.meta.env.VITE_FCM_VAPID_KEY;
  const Base_URL = import.meta.env.VITE_API_URL;

  const checkAppUpdate = async () => {
    try {
      // 안드로이드 브릿지가 있을 때만 실행
      if (window.Android && typeof window.Android.checkUpdate === 'function') {
        window.Android.checkUpdate();
      } else {
        console.log("ℹ️ 브라우저 환경이거나 업데이트 체크 브릿지가 없습니다.");
      }
    } catch (e) {
      console.warn("App update check failed:", e);
    }
  }

  useEffect(() => {
    // 딥링크 핸들러
    window.onDeepLink = (date, action) => {
      if (date) navigate(`/?date=${date}`);
    };
    
    // 앱 업데이트 체크
    checkAppUpdate();
    // --- 네이티브 앱에서 알림 클릭 시 전달된 날짜 처리 ---
    const checkNativeTargetDate = () => {
      const params = new URLSearchParams(window.location.search);
      const targetDate = params.get("date");
      if (targetDate) {
        console.log("📍 네이티브 알림을 통해 진입: ", targetDate);
        // 필요한 경우 여기서 특정 날짜로 이동 로직 수행
        // navigate(`/?date=${targetDate}`); 
      }
    };
    checkNativeTargetDate();

    window.addEventListener('beforeinstallprompt', (e) => {
      // 안드로이드 등에서 뜨는 자동 설치 팝업을 차단
      e.preventDefault();
      return false;
    });

    // 아이폰인지 확인
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    // 이미 홈 화면으로 접속했는지 확인
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;

    if (isIOS && !isStandalone) {
      alert("아이폰 유저분들은 사파리 하단의 '공유' 버튼을 누른 뒤 '홈 화면에 추가'를 선택하시면 앱처럼 사용 가능합니다! 🍱");
    }

    const syncFCMToken = async () => {
      // ✅ 1. 앱 환경(WebView)이거나 가짜 객체(Mock)인 경우 브라우저 FCM 로직 완전히 생략
      if (window.Android || !messaging || messaging._isMock) {
        console.log("🚀 앱 환경이므로 브라우저 FCM 로직을 생략합니다.");
        return;
      }

      try {
        // 2. 브라우저 환경 검사
        if (!('serviceWorker' in navigator) || !('Notification' in window)) {
          return;
        }

        const registration = await navigator.serviceWorker.ready;
        if (!registration || !registration.pushManager) {
          console.log("⚠️ PushManager를 지원하지 않는 브라우저입니다.");
          return;
        }

        const permission = await window.Notification.requestPermission();
        if (permission !== "granted") return;

        if (!VAPID_KEY) {
          console.warn("VAPID_KEY 설정이 필요합니다.");
          return;
        }

        // 3. getToken 실행
        const token = await getToken(messaging, { 
          vapidKey: VAPID_KEY,
          serviceWorkerRegistration: registration 
        });
        
        if (token) {
          console.log("✅ 브라우저 FCM 토큰 생성 성공:", token);
          const jwtToken = sessionStorage.getItem("accessToken") || sessionStorage.getItem("accessToken");

          if (jwtToken && Base_URL) {
            await axios.post(`${Base_URL}/user/fcm-token`, 
              { token: token }, 
              {
                headers: { 
                  Authorization: `Bearer ${jwtToken}`,
                  "Content-Type": "application/json"
                }
              }
            );
            console.log("✅ 서버에 브라우저 FCM 토큰 저장 완료!");
          }
        }
      } catch (error) {
        // ✅ [수정] 의도된 가짜 에러(MOCK_...)인 경우 로그를 깔끔하게 처리합니다.
        const silentErrors = ["MOCK_NO_SUBSCRIPTION", "FCM_DISABLED", "endpoint"];
        if (silentErrors.some(msg => error.message?.includes(msg))) {
          console.info("ℹ️ FCM 브라우저 로직이 이 환경에서 안전하게 건너뛰어졌습니다.");
        } else {
          console.warn("FCM registration process error:", error.message);
        }
      }
    };

    syncFCMToken();
    setLoading(false);

    // ✅ 4. 포그라운드 리스너 가드 (진짜 브라우저 환경일 때만)
    let unsubscribe = () => {};
    
    if (!window.Android && messaging && !messaging._isMock && ("Notification" in window)) {
      try {
        unsubscribe = onMessage(messaging, (payload) => {
          console.log("🔥 [App.jsx] 브라우저 알림 수신:", payload);

          if (window.Notification && window.Notification.permission === "granted") {
            const { title, body, image } = payload.notification;
            const targetDate = payload.data?.targetDate;

            const notification = new window.Notification(title, {
              body: body,
              icon: image || "/logo192.png",
              data: { targetDate: targetDate }
            });

            notification.onclick = (event) => {
              event.preventDefault();
              window.focus();
              const clickedTargetDate = event.notification.data?.targetDate;
              const targetPath = clickedTargetDate ? `/?date=${clickedTargetDate}` : "/";
              navigate(targetPath);
              notification.close();
            };
          }
        });
      } catch (e) {
        console.warn("Foreground message listener setup skipped:", e.message);
      }
    }

    return () => {
      if (typeof unsubscribe === "function") unsubscribe();
    };
  }, [navigate, VAPID_KEY, Base_URL]);

  if (loading) return <div>로딩 중...</div>;

  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/mypage" element={<MyPage />} />
      <Route path="/announcements" element={<Announcements />} />
      <Route path="/announcements/:id" element={<AnnouncementDetail />} />
      <Route path="/appdownload" element={<AppDownload />}/>
      <Route path="/privacy" element={<PrivacyPolicy />} /> {/* 추가 */}
      <Route path="/delete-account" element={<DeleteAccount />} />
      <Route path="/timetable" element={<TimetablePage />}/>
      <Route
        path="/adminpages"
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