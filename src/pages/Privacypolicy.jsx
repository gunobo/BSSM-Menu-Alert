import React from "react";
import { useNavigate } from "react-router-dom";
import "../styles/privacy.css";
import bssmLogo from "../assets/bssmlogo.png";

export default function PrivacyPolicy() {
  const navigate = useNavigate();

  const handleLogoClick = () => {
    window.open("https://school.busanedu.net/bssm-h", "_blank");
  };

  return (
    <>
      <nav className="navbar">
        <div className="nav-left">
          <div className="nav-logo" style={{ cursor: 'pointer' }}>
            <img src={bssmLogo} alt="BSSM 홈페이지 이동" onClick={handleLogoClick} />
            <h2 onClick={() => navigate("/")}>BSSM 급식알리미</h2>
          </div>
        </div>

        <div className="nav-right">
          <button className="nav-btn" onClick={() => navigate("/")}>홈으로</button>
        </div>
      </nav>

      <main className="privacy-container">
        <div className="privacy-card">
          <h1 className="privacy-title">개인정보처리방침</h1>
          <p className="privacy-subtitle">BSSM 급식알리미는 이용자의 개인정보를 소중히 다룹니다.</p>

          <div className="privacy-section">
            <h2>1. 개인정보의 수집 및 이용 목적</h2>
            <p>BSSM 급식알리미는 다음의 목적을 위해 개인정보를 수집 및 이용합니다:</p>
            <ul>
              <li><strong>회원 가입 및 관리:</strong> Google 계정을 통한 회원 가입, 본인 확인, 회원 식별</li>
              <li><strong>서비스 제공:</strong> 급식 정보 조회, 좋아요 기능, 댓글 작성, 취향 메뉴 설정</li>
              <li><strong>알림 서비스:</strong> 실시간 공지사항 및 급식 정보 푸시 알림 전송</li>
              <li><strong>서비스 개선:</strong> 이용 통계 분석, 맞춤형 서비스 제공</li>
            </ul>
          </div>

          <div className="privacy-section">
            <h2>2. 수집하는 개인정보 항목</h2>
            
            <h3>가. 필수 수집 항목 (Google OAuth 로그인 시)</h3>
            <ul>
              <li>이메일 주소</li>
              <li>프로필 정보 (이름, 프로필 사진)</li>
              <li>Google 계정 ID</li>
            </ul>

            <h3>나. 선택 수집 항목</h3>
            <ul>
              <li>알레르기 정보 (사용자가 직접 입력 시)</li>
              <li>취향 메뉴 (사용자가 직접 설정 시)</li>
              <li>FCM 토큰 (푸시 알림 수신 동의 시)</li>
            </ul>

            <h3>다. 자동 수집 항목</h3>
            <ul>
              <li>서비스 이용 기록 (좋아요, 댓글 작성 내역)</li>
              <li>접속 로그, IP 주소, 쿠키</li>
              <li>기기 정보 (모바일 앱 사용 시)</li>
            </ul>
          </div>

          <div className="privacy-section">
            <h2>3. 개인정보의 보유 및 이용 기간</h2>
            <p>이용자의 개인정보는 다음과 같이 보유 및 이용됩니다:</p>
            <ul>
              <li><strong>회원 탈퇴 시:</strong> 지체 없이 파기 (단, 관련 법령에 따라 보존이 필요한 경우 예외)</li>
              <li><strong>서비스 제공 기간:</strong> 회원 가입 시부터 탈퇴 시까지</li>
              <li><strong>법령에 따른 보존:</strong>
                <ul>
                  <li>소비자 불만 또는 분쟁 처리 기록: 3년 (전자상거래법)</li>
                  <li>접속 로그 기록: 3개월 (통신비밀보호법)</li>
                </ul>
              </li>
            </ul>
          </div>

          <div className="privacy-section">
            <h2>4. 개인정보의 제3자 제공</h2>
            <p>BSSM 급식알리미는 원칙적으로 이용자의 개인정보를 제3자에게 제공하지 않습니다.</p>
            <p>다만, 다음의 경우에는 예외로 합니다:</p>
            <ul>
              <li>이용자가 사전에 동의한 경우</li>
              <li>법령의 규정에 의거하거나 수사 목적으로 법령에 정해진 절차와 방법에 따라 수사기관의 요구가 있는 경우</li>
            </ul>
          </div>

          <div className="privacy-section">
            <h2>5. 개인정보 처리 위탁</h2>
            <p>BSSM 급식알리미는 서비스 제공을 위해 다음과 같이 개인정보 처리를 위탁하고 있습니다:</p>
            
            <div className="delegation-table">
              <table>
                <thead>
                  <tr>
                    <th>위탁 업체</th>
                    <th>위탁 업무 내용</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Google LLC</td>
                    <td>Google OAuth 로그인 서비스</td>
                  </tr>
                  <tr>
                    <td>Google Firebase</td>
                    <td>푸시 알림 서비스 (FCM)</td>
                  </tr>
                  <tr>
                    <td>나이스 교육정보 개방 포털</td>
                    <td>급식 정보 제공</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="privacy-section">
            <h2>6. 이용자의 권리와 행사 방법</h2>
            <p>이용자는 언제든지 다음과 같은 권리를 행사할 수 있습니다:</p>
            <ul>
              <li><strong>개인정보 열람 요구:</strong> 마이페이지에서 본인의 정보 확인</li>
              <li><strong>개인정보 수정:</strong> 마이페이지에서 알레르기 정보, 취향 메뉴 수정</li>
              <li><strong>개인정보 삭제 및 회원 탈퇴:</strong> 마이페이지에서 회원 탈퇴 가능</li>
              <li><strong>개인정보 처리 정지 요구:</strong> 서비스 이용 중단 또는 회원 탈퇴</li>
            </ul>

            <div className="delete-account-box">
              <h3>🗑️ 계정 및 데이터 삭제 요청</h3>
              <p>BSSM 급식알리미 서비스 이용 중 수집된 모든 개인정보 및 데이터를 삭제하고 싶으시다면 아래 방법으로 요청하실 수 있습니다:</p>
              
              <div className="delete-methods">
                <div className="delete-method">
                  <h4>방법 1: 직접 삭제 (즉시 처리)</h4>
                  <p>마이페이지에서 회원 탈퇴 버튼을 클릭하시면 즉시 계정 및 모든 데이터가 삭제됩니다.</p>
                  <button 
                    className="delete-request-btn direct"
                    onClick={() => navigate("/mypage")}
                  >
                    마이페이지에서 탈퇴하기
                  </button>
                </div>
                <br />

                <div className="delete-method">
                  <h4>방법 2: 이메일 요청 (3영업일 이내 처리)</h4>
                  <p>로그인이 불가능하거나 도움이 필요한 경우 아래 이메일로 요청해주세요:</p>
                  <a 
                    href="startea0716@gmail.com?subject=계정 삭제 요청&body=안녕하세요,%0D%0A%0D%0A계정 삭제를 요청합니다.%0D%0A%0D%0A- 이메일: [가입 시 사용한 이메일 주소]%0D%0A- 요청 사유: [선택사항]%0D%0A%0D%0A감사합니다."
                    className="delete-request-btn email"
                  >
                    📧 이메일로 삭제 요청하기
                  </a>
                  <p className="email-address">
                    <strong>담당자 이메일:</strong> startea0716@gmail.com
                  </p>
                </div>
              </div>

              <div className="delete-info">
                <h4>⚠️ 삭제 시 유의사항</h4>
                <ul>
                  <li>계정 삭제 시 모든 개인정보, 좋아요, 댓글, 설정 정보가 <strong>영구적으로 삭제</strong>되며 복구가 불가능합니다.</li>
                  <li>법령에 따라 보관이 필요한 정보는 일정 기간 보관 후 파기됩니다.</li>
                  <li>삭제 처리는 요청 후 즉시 또는 3영업일 이내에 완료됩니다.</li>
                  <li>삭제 완료 시 등록하신 이메일로 확인 메일이 발송됩니다.</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="privacy-section">
            <h2>7. 개인정보의 파기 절차 및 방법</h2>
            
            <h3>가. 파기 절차</h3>
            <p>이용자가 회원 가입 시 제공한 정보는 목적이 달성된 후 별도의 DB로 옮겨져 내부 방침 및 관련 법령에 따라 일정 기간 저장된 후 파기됩니다.</p>

            <h3>나. 파기 방법</h3>
            <ul>
              <li><strong>전자적 파일:</strong> 복구 및 재생이 불가능한 기술적 방법으로 완전 삭제</li>
              <li><strong>종이 문서:</strong> 분쇄기로 분쇄하거나 소각</li>
            </ul>
          </div>

          <div className="privacy-section">
            <h2>8. 개인정보 보호를 위한 기술적·관리적 대책</h2>
            
            <h3>가. 기술적 대책</h3>
            <ul>
              <li>개인정보는 암호화되어 저장 및 전송됩니다</li>
              <li>HTTPS 프로토콜을 사용하여 안전하게 전송됩니다</li>
              <li>해킹이나 바이러스 등에 의한 개인정보 유출 및 훼손을 막기 위한 보안 프로그램을 설치 및 운영합니다</li>
            </ul>

            <h3>나. 관리적 대책</h3>
            <ul>
              <li>개인정보에 대한 접근 권한을 최소한의 인원으로 제한합니다</li>
              <li>개인정보 처리 담당자에 대한 정기적인 교육을 실시합니다</li>
              <li>개인정보 처리 시스템에 대한 접근 기록을 보관 및 관리합니다</li>
            </ul>
          </div>

          <div className="privacy-section">
            <h2>9. 쿠키(Cookie)의 운영 및 거부</h2>
            <p>BSSM 급식알리미는 이용자의 편의를 위해 쿠키를 사용합니다.</p>
            
            <h3>가. 쿠키의 사용 목적</h3>
            <ul>
              <li>로그인 상태 유지</li>
              <li>서비스 이용 통계 분석</li>
              <li>맞춤형 서비스 제공</li>
            </ul>

            <h3>나. 쿠키의 설치·운영 및 거부</h3>
            <p>이용자는 웹 브라우저 설정을 통해 쿠키 허용, 차단 등의 설정을 할 수 있습니다.</p>
            <ul>
              <li><strong>Chrome:</strong> 설정 → 개인정보 및 보안 → 쿠키 및 기타 사이트 데이터</li>
              <li><strong>Edge:</strong> 설정 → 쿠키 및 사이트 권한 → 쿠키 및 사이트 데이터 관리</li>
              <li><strong>Safari:</strong> 환경설정 → 개인정보 → 쿠키 및 웹사이트 데이터</li>
            </ul>
            <p className="warning-text">※ 쿠키 저장을 거부할 경우 로그인이 필요한 일부 서비스 이용에 어려움이 있을 수 있습니다.</p>
          </div>

          <div className="privacy-section">
            <h2>10. 개인정보 보호책임자 및 담당자</h2>
            <p>BSSM 급식알리미는 이용자의 개인정보를 보호하고 개인정보와 관련한 불만을 처리하기 위하여 아래와 같이 개인정보 보호책임자를 지정하고 있습니다.</p>
            
            <div className="contact-box">
              <h3>개인정보 보호책임자</h3>
              <ul>
                <li><strong>이름:</strong> 임제민</li>
                <li><strong>소속:</strong> 부산소프트웨어마이스터고등학교</li>
                <li><strong>이메일:</strong> startea0716@gmail.com</li>
              </ul>
              <p>기타 개인정보 침해에 대한 신고나 상담이 필요한 경우 아래 기관에 문의하실 수 있습니다:</p>
              <ul>
                <li>개인정보침해신고센터: (국번없이) 118 (privacy.kisa.or.kr)</li>
                <li>개인정보분쟁조정위원회: (국번없이) 1833-6972 (www.kopico.go.kr)</li>
                <li>대검찰청 사이버범죄수사단: (국번없이) 1301 (cybercid.spo.go.kr)</li>
                <li>경찰청 사이버안전국: (국번없이) 182 (cyberbureau.police.go.kr)</li>
              </ul>
            </div>
          </div>

          <div className="privacy-section">
            <h2>11. 개인정보 처리방침의 변경</h2>
            <p>본 개인정보 처리방침은 법령, 정책 또는 보안기술의 변경에 따라 내용의 추가, 삭제 및 수정이 있을 시에는 변경사항 시행일의 최소 7일 전부터 서비스 내 공지사항을 통해 고지할 것입니다.</p>
            <ul>
              <li><strong>공고일자:</strong> 2026년 2월 12일</li>
              <li><strong>시행일자:</strong> 2026년 2월 12일</li>
            </ul>
          </div>

          <div className="privacy-footer">
            <p>이 개인정보처리방침은 2026년 2월 12일부터 적용됩니다.</p>
            <button className="back-btn" onClick={() => navigate("/")}>홈으로 돌아가기</button>
          </div>
        </div>
      </main>
    </>
  );
}