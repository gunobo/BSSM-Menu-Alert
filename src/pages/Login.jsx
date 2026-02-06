import React from "react";
import { GoogleLogin } from "@react-oauth/google";
import { useNavigate } from "react-router-dom";
import { saveToken } from "../api/auth";
import axios from "axios";
import { messaging } from "../firebase-config";
import { getToken } from "firebase/messaging";
import "../styles/auth.css";

export default function Login() {
  const navigate = useNavigate();

  // 1. 환경변수 로드 (예: https://api.imjemin.co.kr/api)
  const BaseUrl = import.meta.env.VITE_API_URL;
  const FcmVapidKey = import.meta.env.VITE_FCM_VAPID_KEY;

  // 2. BaseUrl에서 /api를 제거하여 구글 로그인용 URL 생성
  // replace를 사용하면 '/api' 부분만 쏙 빠집니다.
  const GoogleUrl = BaseUrl?.replace("/api", "");

  // Login.jsx 내부 registerFcm 함수
  const registerFcm = async (accessToken) => {
  console.log("1️⃣ registerFcm 실행됨 (accessToken 유무):", !!accessToken);
  
  try {
    // 1. 권한 요청 확인
    const permission = await Notification.requestPermission();
    console.log("2️⃣ 알림 권한 상태:", permission);
    
    if (permission !== "granted") {
      console.warn("⚠️ 알림 권한이 거부되었습니다.");
      return;
    }

    // 2. getToken 호출 전 로그
    console.log("3️⃣ FCM 토큰 추출 시도 중... (VAPID KEY 확인):", FcmVapidKey);

    const fcmToken = await getToken(messaging, { 
      vapidKey: FcmVapidKey?.trim() 
    });

    if (fcmToken) {
      console.log("4️⃣ ⭐ FCM 토큰 추출 성공!:", fcmToken);

      const response = await axios.post(`${BaseUrl}/fcm/subscribe`, 
        { token: fcmToken },
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );
      console.log("5️⃣ 서버 등록 결과:", response.data);
    } else {
      console.warn("⚠️ fcmToken이 생성되지 않았습니다 (null).");
    }
  } catch (error) {
    console.error("❌ FCM 단계 중 에러 발생:", error);
    // 에러 상세 내용 출력
    if (error.code) console.error("에러 코드:", error.code);
    if (error.message) console.error("에러 메시지:", error.message);
  }
};

  const handleLoginSuccess = async (credentialResponse) => {
    if (!credentialResponse.credential) return;

    try {
      const res = await fetch(`${GoogleUrl}/auth/google`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: credentialResponse.credential }),
      });

      if (res.ok) {
        const data = await res.json();
        
        if (data.token) {
          // 1. 토큰 저장
          saveToken(data.token); 
          
          // 2. FCM 등록 (비동기로 실행하되 끝날 때까지 기다림)
          console.log("🚀 FCM 등록 시작...");
          axios.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
          await registerFcm(data.token);
          console.log("✅ FCM 등록 프로세스 종료");

          // 3. [핵심] navigate 대신 강제 페이지 이동
          // 이렇게 하면 모든 컴포넌트가 초기화되면서 localStorage의 토큰을 정상적으로 읽습니다.
          alert(`환영합니다, ${data.name}님!`);
          navigate("/");
        }
      } else {
        alert("로그인 처리 중 오류가 발생했습니다.");
      }
    } catch (error) {
      console.error("로그인 프로세스 에러:", error);
    }
  };

  return (
    <div className="auth-bg">
      <div className="auth-box">
        <h2>BSSM 급식 알리미</h2>
        <div className="google-login-container">
          <GoogleLogin
            onSuccess={handleLoginSuccess}
            onError={() => alert("구글 로그인 실패")}
            ux_mode="popup" 
            useOneTap={false} 
          />
        </div>
      </div>
    </div>
  );
}