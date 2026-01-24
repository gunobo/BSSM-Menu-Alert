import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/auth.css";

export default function Login() {
  const [id, setId] = useState("");
  const [pw, setPw] = useState("");
  const navigate = useNavigate();

  const handleLogin = () => {
    if (!id || !pw) {
      alert("아이디와 비밀번호를 입력하세요");
      return;
    }

    localStorage.setItem(
      "user",
      JSON.stringify({ id, role: "USER" })
    );

    navigate("/");
  };

  return (
    <div className="auth-bg">
      <div className="auth-box">
        <h2>로그인</h2>
        <input placeholder="아이디" value={id} onChange={e => setId(e.target.value)} />
        <input type="password" placeholder="비밀번호" value={pw} onChange={e => setPw(e.target.value)} />
        <button onClick={handleLogin}>로그인</button>
        <p onClick={() => navigate("/signup")}>
          아직 회원이 아니신가요? 회원가입
        </p>
      </div>
    </div>
  );
}
