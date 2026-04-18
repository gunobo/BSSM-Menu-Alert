import React, { useEffect, useState } from "react";
import { GoogleLogin } from "@react-oauth/google";
import { useNavigate } from "react-router-dom";
import { saveToken, saveFcmToken } from "../api/auth";
import axios from "axios";
import { messaging } from "../firebase-config";
import { getToken } from "firebase/messaging";
import "../styles/auth.css";

export default function Login() {
  const navigate = useNavigate();
  // ✅ 로딩 상태 관리 (기본값: false)
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const BaseUrl = import.meta.env.VITE_API_URL;
  const ServerUrl = import.meta.env.VITE_BASE_URL;
  const FcmVapidKey = import.meta.env.VITE_FCM_VAPID_KEY;

  // ✅ 안드로이드에서 보낸 로그인 성공 신호 받기
  useEffect(() => {
    window.onNativeLoginSuccess = (idToken) => {
      console.log("✅ 안드로이드 네이티브 토큰 수신 완료");
      handleLoginSuccess({ credential: idToken });
    };

    return () => {
      delete window.onNativeLoginSuccess;
    };
  }, []);

  // ✅ FCM 토큰 등록 로직
  const registerFcm = async (accessToken) => {
    try {
      console.log("🔔 FCM 등록 시작...");
      
      // 1. 환경 판단
      const isAndroid = !!(window.Android && window.Android.googleLogin);
      const deviceType = isAndroid ? "MOBILE" : "WEB";
      
      console.log("📱 디바이스 타입:", deviceType);

      let fcmToken = null;

      if (isAndroid) {
        // ✅ 앱 환경: 안드로이드가 토큰을 전달할 때까지 대기
        console.log("📱 앱 환경 - 안드로이드 토큰 대기 중...");
        
        // 안드로이드에 토큰 요청
        if (window.Android.requestFcmToken) {
          window.Android.requestFcmToken();
        }
        
        // 최대 10초 대기
        for (let i = 0; i < 10; i++) {
          await new Promise(resolve => setTimeout(resolve, 1000));
          fcmToken = localStorage.getItem("fcmToken");
          
          if (fcmToken) {
            console.log("✅ localStorage에서 토큰 발견:", fcmToken.substring(0, 30) + "...");
            break;
          }
          console.log(`⏳ 토큰 대기 중... ${i + 1}/10초`);
        }
        
        if (!fcmToken) {
          console.warn("⚠️ 안드로이드 토큰을 받지 못했습니다 (10초 타임아웃)");
          return;
        }
      } else {
        // ✅ 웹 환경: Firebase로 토큰 생성
        console.log("💻 웹 환경 - Firebase 토큰 생성 중...");
        
        const permission = await Notification.requestPermission();
        if (permission !== "granted") {
          console.warn("🔔 알림 권한이 거부되었습니다.");
          return;
        }
        
        fcmToken = await getToken(messaging, { 
          vapidKey: FcmVapidKey?.trim() 
        });
        
        if (fcmToken) {
          console.log("✅ Firebase 토큰 생성 완료:", fcmToken.substring(0, 30) + "...");
          localStorage.setItem("fcmToken", fcmToken);
        }
      }

      if (fcmToken) {
        // ✅ 서버로 토큰 전송 (auth.js의 saveFcmToken 사용)
        console.log("📤 서버로 토큰 전송 중...");
        
        try {
          await saveFcmToken(fcmToken, deviceType);
          console.log(`✅ FCM 등록 성공 (${deviceType})`);
        } catch (error) {
          console.error("❌ 서버 토큰 저장 실패:", error);
          
          // ✅ fallback: 기존 방식으로 재시도
          try {
            await axios.post(`${BaseUrl}/fcm/subscribe`, 
              { 
                token: fcmToken,
                deviceType: deviceType
              },
              {
                headers: {
                  'Authorization': `Bearer ${accessToken}`,
                  'Content-Type': 'application/json'
                }
              }
            );
            console.log("✅ FCM 등록 성공 (fallback)");
          } catch (fallbackError) {
            console.error("❌ fallback도 실패:", fallbackError);
          }
        }
      }
    } catch (error) {
      console.error("❌ FCM 등록 에러:", error);
    }
  };

  // ✅ 공통 로그인 처리 함수
  const handleLoginSuccess = async (credentialResponse) => {
    if (!credentialResponse.credential) return;

    // 🚀 로딩 시작
    setIsLoggingIn(true);

    try {
      console.log("🔐 로그인 처리 시작...");
      
      const res = await fetch(`${ServerUrl}/auth/google`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: credentialResponse.credential }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.token) {
          console.log("✅ 로그인 성공");
          
          saveToken(data.token);
          axios.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
          
          // ✅ 로그인 성공 후 FCM 등록 실행 (여기서 대기 시간이 발생함)
          await registerFcm(data.token);
          
          alert(`환영합니다, ${data.name}님!`);
          // 페이지 이동 시 로딩은 자동으로 해제됨 (새로고침 효과)
          window.location.href = "/";
        }
      } else {
        alert("로그인 처리 중 오류가 발생했습니다.");
        setIsLoggingIn(false); // 실패 시 로딩 해제
      }
    } catch (error) {
      console.error("❌ 로그인 에러:", error);
      alert("서버 연결에 실패했습니다.");
      setIsLoggingIn(false); // 에러 발생 시 로딩 해제
    }
  };

  // ✅ 앱 전용 클릭 핸들러
  const handleNativeLoginRequest = () => {
    if (window.Android && window.Android.googleLogin) {
      console.log("🚀 앱 인터페이스 호출: window.Android.googleLogin()");
      window.Android.googleLogin();
    }
  };

  return (
    <div className="auth-bg">
      {/* ✅ 로딩 레이어: 로딩 중일 때만 표시됨 */}
      {isLoggingIn && (
        <div className="login-loading-overlay">
          <div className="spinner"></div>
          <p>사용자 정보를 확인하고 있습니다.<br/>잠시만 기다려 주세요...</p>
        </div>
      )}

      <div className="auth-box">
        <h2>BSSM 급식 알리미</h2>
        <div 
          className="google-login-container" 
          style={{ position: 'relative', display: 'inline-block' }}
        >
          {window.Android && (
            <div 
              onClick={!isLoggingIn ? handleNativeLoginRequest : null}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: 9999,
                cursor: isLoggingIn ? 'default' : 'pointer',
                backgroundColor: 'transparent'
              }}
            />
          )}

          <GoogleLogin
            onSuccess={handleLoginSuccess}
            onError={() => alert("구글 로그인 실패")}
            ux_mode="popup" 
            useOneTap={false}
            disabled={isLoggingIn} // 로딩 중 버튼 비활성화
          />
          <p onClick={() => navigate("/privacy")}>
            로그인 시 
            <strong> 개인정보처리방침</strong>에 
            동의한 것으로 간주합니다.
          </p>
        </div>
      </div>
    </div>
  );
}