import React from "react";
import "../styles/footer.css"; // 푸터 전용 CSS를 따로 관리하는 게 좋습니다.
import githublogo from "../assets/github.png"

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-content">
        <div className="footer-left">
          <h2 className="footer-logo">BSSM Meal</h2>
          <div className="footer-info">
            </div>
            <p>제작 : 임제민  |  관리자 : 임제민  |  문의 : startea0716@gmail.com</p>
            <p>주소 : 부산광역시 강서구 가락대로 1393 (부산소프트웨어마이스터고등학교)</p>
            <p>데이터 제공 : NEIS 교육행정정보시스템</p>
            <p>본 서비스는 학교 급식 정보를 실시간으로 제공하며, 비영리 목적으로 운영됩니다.</p>
            {/* <p>Copyright © BSSM Meal Alimi. All Rights Reserved.</p> */}
          </div>

        <div className="footer-right">
          <select className="family-service">
            <option>관련 링크</option>
            <option onClick={() => window.open("https://school.busanedu.net/bssm-h", "_blank")}>
              BSSM 홈페이지
            </option>
            <option onClick={() => window.open("https://library.busanedu.net/bssm", "_blank")}>
              BSSM 도서관
            </option>
          </select>
        </div>
      </div>
    </footer>
  );
}