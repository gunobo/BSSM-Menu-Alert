import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/auth.css";

export default function Signup() {
  const [id, setId] = useState("");
  const [pw, setPw] = useState("");
  const navigate = useNavigate();

  const handleSignup = () => {
    if (!id || !pw) {
      alert("모든 항목을 입력하세요");
      return;
    }

    alert("회원가입 완료 (임시)");
    navigate("/login");
  };

  return (
    <div className="auth-bg">
      <div className="auth-box">
        <h2>회원가입</h2>
        <input placeholder="아이디" value={id} onChange={e => setId(e.target.value)} />
        <input type="password" placeholder="비밀번호" value={pw} onChange={e => setPw(e.target.value)} />
        <button onClick={handleSignup}>회원가입</button>
      </div>
    </div>
  );
}
