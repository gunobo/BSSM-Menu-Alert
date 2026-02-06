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

export default function App() {
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // 🔥 .env 파일에 VITE_FCM_VAPID_KEY가 없으면 콘솔에 에러가 뜹니다. 확인해주세요.
  const VAPID_KEY = import.meta.env.VITE_FCM_VAPID_KEY;
  const Base_URL = import.meta.env.VITE_API_URL

  useEffect(() => {
    const syncFCMToken = async () => {
      try {
        // 1. 서비스 워커 지원 여부 확인
        if (!('serviceWorker' in navigator)) {
          console.warn("이 브라우저는 서비스 워커를 지원하지 않습니다.");
          return;
        }

        // 2. 알림 권한 요청
        const permission = await Notification.requestPermission();
        if (permission !== "granted") {
          console.warn("⚠️ 알림 권한이 거부되었습니다.");
          return;
        }

        // 3. 최신 FCM 토큰 가져오기
        if (!VAPID_KEY) {
          console.error("❌ VAPID_KEY가 설정되지 않았습니다. .env 파일을 확인하세요.");
          return;
        }

        const token = await getToken(messaging, { vapidKey: VAPID_KEY });

        if (token) {
          console.log("✅ 현재 FCM 토큰:", token);
          
          // 4. 로컬 스토리지에서 JWT 토큰 가져오기
          // 💡 팁: 로그인 시 저장한 키 이름이 'accessToken'인지 'token'인지 꼭 확인하세요!
          const jwtToken = localStorage.getItem("accessToken") || localStorage.getItem("token");

          if (jwtToken) {
            console.log("🚀 서버(8080)로 토큰 전송 시도...");
            
            // ✅ 절대 경로(http://localhost:8080)를 사용하여 404 에러를 방지합니다.
            await axios.post(`${Base_URL}/user/fcm-token`, 
              { token: token }, 
              {
                headers: { 
                  Authorization: `Bearer ${jwtToken}`,
                  "Content-Type": "application/json"
                }
              }
            );
            console.log("✅ 서버에 FCM 토큰 저장 완료!");
          } else {
            console.warn("⚠️ 로그인 토큰이 없어 서버에 FCM 토큰을 보내지 않았습니다.");
          }
        }
      } catch (error) {
        // 여기서 404가 계속 뜬다면 axios의 기본 설정(baseURL)을 확인해야 합니다.
        console.error("❌ FCM 토큰 갱신 실패:", error);
      }
    };

    syncFCMToken();
    setLoading(false);

    // 포그라운드 알림 수신 리스너
    const unsubscribe = onMessage(messaging, (payload) => {
      console.log("🔥 [App.jsx] 알림 수신:", payload);

      if (Notification.permission === "granted") {
        const { title, body, image } = payload.notification;
        const targetDate = payload.data?.targetDate;

        const notification = new Notification(title, {
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

    return () => unsubscribe();
  }, [navigate, VAPID_KEY]);

  if (loading) return <div>로딩 중...</div>;

  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/mypage" element={<MyPage />} />
      <Route path="/announcements" element={<Announcements />} />
      <Route path="/announcements/:id" element={<AnnouncementDetail />} />
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