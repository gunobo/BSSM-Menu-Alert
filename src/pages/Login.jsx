import React from "react";
import { GoogleLogin } from "@react-oauth/google";
import { useNavigate } from "react-router-dom";
import { saveToken } from "../api/auth";
import "../styles/auth.css";

export default function Login() {
  const navigate = useNavigate();

  const handleLoginSuccess = async (credentialResponse) => {
    if (!credentialResponse.credential) return;

    try {
      const res = await fetch("http://localhost:8080/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: credentialResponse.credential }),
      });

      if (res.ok) {
        const data = await res.json();
        // 백엔드에서 준 token과 name 사용
        if (data.token) {
          saveToken(data.token); 
          alert(`환영합니다, ${data.name}님!`);
          navigate("/"); 
        }
      } else {
        alert("로그인 처리 중 오류가 발생했습니다.");
      }
    } catch (error) {
      console.error("서 bir 통신 에러:", error);
      alert("서버와 연결할 수 없습니다.");
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
            useOneTap={false} // COOP 에러 방지를 위해 비활성화 권장
          />
        </div>
      </div>
    </div>
  );
}