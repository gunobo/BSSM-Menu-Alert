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
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // ✅ 환경 변수 가져오기 (값이 없을 경우를 대비한 기본값 설정)
  const BaseUrl = import.meta.env.VITE_API_URL || "https://api.imjemin.co.kr/api";
  const ServerUrl = import.meta.env.VITE_BASE_URL || "https://api.imjemin.co.kr/api";
  const FcmVapidKey = import.meta.env.VITE_FCM_VAPID_KEY;

  useEffect(() => {
    window.onNativeLoginSuccess = (idToken) => {
      console.log("✅ 안드로이드 네이티브 토큰 수신 완료");
      handleLoginSuccess({ credential: idToken });
    };

    return () => {
      delete window.onNativeLoginSuccess;
    };
  }, []);

  const registerFcm = async (accessToken) => {
    try {
      console.log("🔔 FCM 등록 시작...");
      const isAndroid = !!(window.Android && window.Android.googleLogin);
      const deviceType = isAndroid ? "MOBILE" : "WEB";
      
      let fcmToken = null;

      if (isAndroid) {
        if (window.Android.requestFcmToken) {
          window.Android.requestFcmToken();
        }
        
        for (let i = 0; i < 10; i++) {
          await new Promise(resolve => setTimeout(resolve, 1000));
          fcmToken = localStorage.getItem("fcmToken");
          if (fcmToken) break;
        }
        
        if (!fcmToken) return;
      } else {
        const permission = await Notification.requestPermission();
        if (permission !== "granted") return;
        
        fcmToken = await getToken(messaging, { 
          vapidKey: FcmVapidKey?.trim() 
        });
        
        if (fcmToken) {
          localStorage.setItem("fcmToken", fcmToken);
        }
      }

      if (fcmToken) {
        try {
          await saveFcmToken(fcmToken, deviceType);
          console.log(`✅ FCM 등록 성공 (${deviceType})`);
        } catch (error) {
          // ✅ fallback: 직접 설정한 BaseUrl 사용
          try {
            await axios.post(`${BaseUrl}/fcm/subscribe`, 
              { token: fcmToken, deviceType: deviceType },
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

  const getDeviceIp = () => new Promise((resolve) => {
    try {
      const pc = new RTCPeerConnection({ iceServers: [] });
      pc.createDataChannel("");
      pc.createOffer().then((o) => pc.setLocalDescription(o));
      pc.onicecandidate = (e) => {
        if (e && e.candidate) {
          const match = e.candidate.candidate.match(/(\d+\.\d+\.\d+\.\d+)/);
          if (match && !match[1].startsWith("0.")) {
            resolve(match[1]);
            pc.close();
          }
        }
      };
      setTimeout(() => resolve(null), 1500);
    } catch {
      resolve(null);
    }
  });

  const handleLoginSuccess = async (credentialResponse) => {
    if (!credentialResponse.credential) return;

    setIsLoggingIn(true);

    try {
      console.log("🔐 로그인 처리 시작...");

      const deviceIp = await getDeviceIp();

      // ✅ ServerUrl 변수를 사용하여 요청 (위에서 기본값이 설정됨)
      const res = await fetch(`${ServerUrl}/auth/google`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: credentialResponse.credential, deviceIp }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.token) {
          saveToken(data.token);
          axios.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
          await registerFcm(data.token);
          
          alert(`환영합니다, ${data.name}님!`);
          window.location.href = "/";
        }
      } else {
        alert("로그인 처리 중 오류가 발생했습니다.");
        setIsLoggingIn(false);
      }
    } catch (error) {
      console.error("❌ 로그인 에러:", error);
      alert("서버 연결에 실패했습니다.");
      setIsLoggingIn(false);
    }
  };

  const handleNativeLoginRequest = () => {
    if (window.Android && window.Android.googleLogin) {
      window.Android.googleLogin();
    }
  };

  return (
    <div className="auth-bg">
      {isLoggingIn && (
        <div className="login-loading-overlay">
          <div className="spinner"></div>
          <p>사용자 정보를 확인하고 있습니다.<br/>잠시만 기다려 주세요...</p>
        </div>
      )}

      <div className="auth-box">
        <h2>BSSM 급식 알리미</h2>
        <div className="google-login-container" style={{ position: 'relative', display: 'inline-block' }}>
          {window.Android && (
            <div 
              onClick={!isLoggingIn ? handleNativeLoginRequest : null}
              style={{
                position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                zIndex: 9999, cursor: isLoggingIn ? 'default' : 'pointer',
                backgroundColor: 'transparent'
              }}
            />
          )}

          <GoogleLogin
            onSuccess={handleLoginSuccess}
            onError={() => alert("구글 로그인 실패")}
            ux_mode="popup" 
            useOneTap={false}
            disabled={isLoggingIn}
          />
          <p onClick={() => navigate("/privacy")}>
            로그인 시 <strong> 개인정보처리방침</strong>에 동의한 것으로 간주합니다.
          </p>
        </div>
      </div>
    </div>
  );
}