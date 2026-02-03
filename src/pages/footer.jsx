import React from "react";
import { useNavigate } from "react-router-dom"; // 어드민 이동을 위해 추가
import "../styles/footer.css";
import githublogo from "../assets/github.png";

export default function Footer() {
  const navigate = useNavigate();

  return (
    <footer className="footer">
      <div className="container footer-content">
        <div className="footer-left">
          <h2 className="footer-logo">BSSM Meal</h2>
          <div className="footer-info">
            <p>제작 : 임제민  |  관리자 : 임제민  |  문의 : 01082964077(문자만받음)</p>
            <p>주소 : 부산광역시 강서구 가락대로 1393 (부산소프트웨어마이스터고등학교)</p>
            <p>데이터 제공 : NEIS 교육행정정보시스템</p>
            <p>본 서비스는 학교 급식 정보를 실시간으로 제공하며, 비영리 목적으로 운영됩니다.</p>
            <p className="copyright">Copyright © BSSM Meal Alimi. All Rights Reserved.</p>
          </div>
        </div>

        <div className="footer-right">
          {/* ✅ 아이콘 링크 그룹 (깃허브, 위키, 어드민) */}
          <div className="footer-icons">
            <a href="https://github.com/gunobo" target="_blank" rel="noreferrer" title="GitHub">
              <img src={githublogo} alt="GitHub" className="footer-icon-img" />
            </a>
            {/* 위키 버튼 (예: 깃허브 위키나 노션) */}
            <button onClick={() => window.open("https://www.notion.so/BSSM-2f4989ca644280d69691d37de08e486a?source=copy_link", "_blank")} className="icon-btn" title="Wiki">
              📖 위키
            </button>
            {/* 어드민 페이지 이동 버튼 */}
            <button onClick={() => navigate("/adminpages")} className="icon-btn admin-link" title="Admin">
              ⚙️ 관리자
            </button>
          </div>

          <select className="family-service" onChange={(e) => e.target.value && window.open(e.target.value, "_blank")}>
            <option value="">관련 링크</option>
            <option value="https://school.busanedu.net/bssm-h">BSSM 홈페이지</option>
            <option value="https://library.busanedu.net/bssm">BSSM 도서관</option>
          </select>
        </div>
      </div>
    </footer>
  );
}