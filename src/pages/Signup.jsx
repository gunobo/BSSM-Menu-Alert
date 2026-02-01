import React from "react";
import { useNavigate } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";

export default function Signup() {
  const navigate = useNavigate();

  const handleSignupSuccess = async (credentialResponse) => {
    try {
      if (!credentialResponse.credential) return;

      // 1. 토큰 디코딩 (화면 표시 및 데이터 확인용)
      const base64Payload = credentialResponse.credential.split('.')[1];
      const decoded = JSON.parse(atob(base64Payload));
      console.log("구글 정보 디코딩:", decoded);

      // 2. 백엔드 전송
      const res = await fetch('https://api.imjemin.co.kr/auth/signup/google', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: credentialResponse.credential, // 백엔드 body.get("token")과 일치
          email: decoded.email,
          name: decoded.name
        }),
      });

      // 3. 결과 처리
      const data = await res.json();

      if (res.ok) {
        alert(`${data.name}님, 환영합니다!`);
        navigate("/");
      } else {
        alert(`오류 발생: ${data.message || '알 수 없는 에러'}`);
      }
    } catch (e) {
      console.error("Fetch Error:", e);
      alert("서버 연결에 실패했습니다.");
    }
  };

  const handleSignupError = () => {
    alert("구글 로그인에 실패했습니다.");
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '100px' }}>
      <h2>Google 계정으로 회원가입</h2>
      <div style={{ marginTop: '20px' }}>
        <GoogleLogin
          onSuccess={handleSignupSuccess}
          onError={handleSignupError}
        />
      </div>
    </div>
  );
}