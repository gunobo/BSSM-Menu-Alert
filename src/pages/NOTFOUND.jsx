import React from "react";
import { useNavigate } from "react-router-dom";
import Footer from "./footer";
import "../styles/notFound.css";

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="not-found-page">
      <div className="not-found-content">
        <h1 className="error-code">404</h1>
        <h2 className="error-message">길을 잃으셨나요?</h2>
        <p className="error-description">
          요청하신 페이지가 존재하지 않거나 삭제되었을 수 있습니다.<br />
          입력하신 주소가 정확한지 다시 한번 확인해 주세요.
        </p>
        <div className="not-found-buttons">
          <button className="go-home-btn" onClick={() => navigate("/")}>
            홈으로 돌아가기
          </button>
          <button className="go-back-btn" onClick={() => navigate(-1)}>
            이전 페이지로
          </button>
        </div>
      </div>
      <Footer />
    </div>
  );
}