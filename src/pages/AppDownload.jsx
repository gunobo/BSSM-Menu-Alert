import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import bssmLogo from "../assets/bssmlogo.png";
import { isLoggedIn } from "../api/auth";
import "../styles/AppDownload.css";
import Footer from "./footer";

const AppDownload = () => {
  const navigate = useNavigate();
  const [isAuth, setIsAuth] = useState(isLoggedIn());

  // ✅ API 베이스 경로 설정
  const API_BASE_URL = import.meta.env.VITE_API_URL || "";
  
  const getDownloadUrl = (type) => {
    const base = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;
    if (base.endsWith('/api')) {
      return `${base}/admin/app/download/${type}`;
    }
    return `${base}/api/admin/app/download/${type}`;
  };

  const handleLogoClick = () => {
    window.open("https://school.busanedu.net/bssm-h", "_blank");
  };

  /**
   * ✅ [핵심 수정] Mixed Content 이슈 해결을 위한 다운로드 로직
   */
  const handleAppDownload = (type) => {
    if (type === 'apk') {
      alert("Android 설치 파일(APK) 다운로드를 시작합니다.");
    }

    const downloadApiUrl = getDownloadUrl(type);

    // 1. 숨겨진 <a> 태그 생성
    const link = document.createElement('a');
    
    // 2. 중요: API URL을 그대로 사용하되, 브라우저가 이를 '다운로드'로 인식하게 함
    link.href = downloadApiUrl;
    
    // 3. 브라우저에게 현재 HTTPS 환경을 유지하도록 명시 (rel 속성)
    link.rel = "noopener noreferrer";
    
    // 4. 파일명 지정 (브라우저가 리다이렉트된 최종 파일명을 쓰도록 유도)
    link.setAttribute('download', ''); 

    // 5. 클릭 후 제거
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleStoreClick = (platform) => {
    if (platform === 'ios') {
      alert("App Store 출시 준비중입니다! 아래 설치법을 참고하여 앱을 설치해주세요.");
    } else {
      alert("Google Play 출시 준비중입니다! 아래 APK 다운로드를 이용해주세요.");
    }
  };

  const handleGuideClick = () => {
    window.open("https://www.notion.so/IOS-304989ca644280638a09d7f6a13dd369", "_blank");
  };

  return (
    <>
    <div className="download-page-wrapper">
      <nav className="navbar">
        <div className="nav-left">
          <div className="nav-logo" style={{ cursor: 'pointer' }}>
            <img src={bssmLogo} alt="BSSM 홈페이지 이동" onClick={handleLogoClick} />
            <h2 onClick={() => navigate("/")}>BSSM 급식알리미</h2>
          </div>
          <div className="nav-menu">
            <button className="menu-item" onClick={() => navigate("/")}>급식확인</button>
            <button className="menu-item" onClick={() => navigate("/timetable")}>시간표</button>
            <button className="menu-item" onClick={() => navigate("/announcements")}>공지게시판</button>
            <button className="menu-item active" onClick={() => navigate("/appdownload")}>어플 다운로드</button>
          </div>
        </div>

        <div className="nav-right">
          <div className="nav-buttons">
            <button className="nav-report-btn" onClick={() => navigate("/")}>🚨 건의</button>
            {isAuth ? (
              <button className="nav-btn" onClick={() => navigate("/mypage")}>마이페이지</button>
            ) : (
              <button className="nav-btn" onClick={() => navigate("/login")}>로그인</button>
            )}
          </div>
        </div>
      </nav>

      <section className="hero">
        <div className="container">
          <h1>앱 다운로드</h1>
          <p className="hero-desc">BSSM 급식알리미를 앱으로 더 편리하게 이용하세요</p>
        </div>
      </section>

      <main className="container">
        <div className="main-card download-card">
          <div className="selected-day-info">
            <h2>플랫폼 선택</h2>
          </div>

          <div className="meal-grid">
            <div className="meal-card-wrapper download-item">
              <div className="card-inner">
                <div className="card-front android-theme">
                  <span className="meal-type">Android</span>
                  <div className="download-footer-area">
                    <button className="nav-btn download-action-btn" onClick={() => handleStoreClick('android')}>
                      Google Play로 이동
                    </button>
                    <button 
                      className="nav-btn download-action-btn" 
                      onClick={handleAppDownload}
                    >
                      apk 다운로드 받기
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="meal-card-wrapper download-item">
              <div className="card-inner">
                <div className="card-front ios-theme">
                  <span className="meal-type">iOS (iPhone)</span>
                  <div className="download-footer-area">
                    <button className="nav-btn download-action-btn" onClick={() => handleStoreClick('ios')}>
                      App Store로 이동
                    </button>
                    <button 
                      className="nav-btn download-action-btn" 
                      onClick={handleGuideClick}
                    >
                      설치법 보러가기
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <p className="click-info-text" style={{ textAlign: 'center', marginTop: '30px' }}>
            💡 iOS의 경우 IPA 설치를 위해 PC 연결 혹은 별도의 사이드로딩 도구가 필요할 수 있습니다.
          </p>
        </div>
      </main>
    </div>
    <Footer />
    </>
  );
};

export default AppDownload;