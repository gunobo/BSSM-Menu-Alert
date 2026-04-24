import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getUser, isLoggedIn } from "../api/auth";
import "../styles/footer.css";
import githublogo from "../assets/github.png";

export default function Footer() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      if (isLoggedIn()) {
        const userData = await getUser();
        setUser(userData);
      }
    };
    fetchUser();
    
    window.addEventListener("authChange", fetchUser);
    return () => window.removeEventListener("authChange", fetchUser);
  }, []);

  const hasAdminAccess = user && ["TEACHER", "MODERATOR", "ADMIN","ROLE_TEACHER","ROLE_MODERATOR","ROLE_ADMIN"].includes(user.role);

  // 외부 링크 이동 함수 (window.open 사용)
  const openExternalLink = (url) => {
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <footer className="footer">
      <div className="container footer-content">
        <div className="footer-left">
          <h2 className="footer-logo">BSSM Meal</h2>
          <div className="footer-info">
            <p>제작 : 임제민  |  관리자 : 임제민  |  문의 : 미정</p>
            <p>주소 : 부산광역시 강서구 가락대로 1393 (부산소프트웨어마이스터고등학교)</p>
            <p onClick={() => navigate("/privacy")} className="Privacy">개인정보처리방침</p>
            <p>데이터 제공 : NEIS 교육정보개방포털</p>
            <p>본 서비스는 학교 급식 정보 및 시간표를 실시간으로 제공하며, 비영리 목적으로 운영됩니다.</p>
            <p className="copyright">Copyright © BSSM Meal Alimi. All Rights Reserved.</p>
          </div>
        </div>

        <div className="footer-right">
          <div className="footer-icons">
            <a href="https://github.com/gunobo" target="_blank" rel="noreferrer" title="GitHub">
              <img src={githublogo} alt="GitHub" className="footer-icon-img" />
            </a>
            
            <button 
              onClick={() => openExternalLink("https://www.notion.so/BSSM-2f4989ca644280d69691d37de08e486a?source=copy_link")} 
              className="icon-btn" 
              title="Wiki"
            >
              📖 위키
            </button>

            {hasAdminAccess && (
              <button onClick={() => navigate("/adminpages")} className="icon-btn" title="Admin">
                ⚙️ 관리자
              </button>
            )}
          </div>

          {/* 관련 링크 옵션 대신 하단 버튼으로 변경 */}
          <div className="footer-links">
            <button className="link-btn" onClick={() => openExternalLink("https://school.busanedu.net/bssm-h")}>
              BSSM 홈페이지
            </button>
            <button className="link-btn" onClick={() => openExternalLink("https://library.busanedu.net/bssm")}>
              BSSM 도서관
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}