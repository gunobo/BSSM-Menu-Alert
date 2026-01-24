import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/auth.css";

export default function Signup() {
  const [id, setId] = useState("");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const navigate = useNavigate();

  const handleSignup = () => {
    if (!id || !pw || !pw2) {
      alert("모든 항목을 입력하세요");
      return;
    }
    if (pw !== pw2) {
      alert("비밀번호가 일치하지 않습니다");
      return;
    }

    alert("회원가입 완료!");
    navigate("/login");
  };

  return (
    <div className="auth-bg">
      <div className="auth-box">
        <h2>회원가입</h2>

        <input placeholder="아이디" value={id} onChange={e => setId(e.target.value)} />
        <input type="password" placeholder="비밀번호" value={pw} onChange={e => setPw(e.target.value)} />
        <input type="password" placeholder="비밀번호 확인" value={pw2} onChange={e => setPw2(e.target.value)} />

        <button onClick={handleSignup}>회원가입</button>

        <p onClick={() => navigate("/login")}>
          이미 계정이 있나요? 로그인
        </p>
      </div>
    </div>
  );
}
