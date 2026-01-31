import { useState } from "react";
import "../styles/report.css";

export default function NoticeModal({ notice, onClose }) {
  const [dontShowToday, setDontShowToday] = useState(false);

  if (!notice) return null;

  // ✅ 이미지 경로 처리 로직 최적화
  const getImageUrl = () => {
    if (!notice.imageUrl) return "";
    if (notice.imageUrl.startsWith("http")) return notice.imageUrl;

    const API_URL = import.meta.env.VITE_API_URL || "";
    // /api 문자열을 제거하고 기본 베이스 주소만 추출
    const IMAGE_BASE_URL = API_URL.replace(/\/api$/, "").replace(/\/$/, "");
    
    // 경로 시작의 / 여부를 체크하여 결합
    const cleanImagePath = notice.imageUrl.startsWith("/") ? notice.imageUrl : `/${notice.imageUrl}`;
    return `${IMAGE_BASE_URL}${cleanImagePath}`;
  };

  const imageUrl = getImageUrl();

  return (
    <div 
      className="modal-overlay" 
      onClick={() => onClose(dontShowToday)} // 배경 클릭 시 닫기
    >
      <div 
        className="notice-modal-content" 
        onClick={(e) => e.stopPropagation()} // 모달 내부 클릭 시 이벤트 전파 차단
      >
        <div className="modal-header">
          <h2>📢 공지사항</h2>
          <button 
            className="close-btn" 
            onClick={() => onClose(dontShowToday)}
            aria-label="닫기"
          >
            &times;
          </button>
        </div>
        
        <div className="notice-body">
          {notice.imageUrl && (
            <div className="notice-image-container">
              <img 
                src={imageUrl} 
                alt="공지 이미지" 
                className="notice-img" 
                onError={(e) => {
                  console.warn("이미지 로드 실패:", imageUrl);
                  e.target.closest('.notice-image-container').style.display = 'none';
                }} 
              />
            </div>
          )}
          
          <h3 className="notice-title-text">{notice.title || "공지사항"}</h3>
          {/* 💡 개행 문자(\n)를 <br/>로 바꾸지 않아도 pre-wrap 덕분에 줄바꿈이 잘 보입니다. */}
          <p className="notice-description">
            {notice.content}
          </p>
        </div>

        <div className="notice-footer">
          <label className="dont-show-label">
            <input 
              type="checkbox" 
              checked={dontShowToday} 
              onChange={(e) => setDontShowToday(e.target.checked)}
            />
            <span>오늘 하루 그만 보기</span>
          </label>
          
          <button 
            className="notice-confirm-btn" 
            onClick={() => onClose(dontShowToday)}
          >
            확인
          </button>
        </div>
      </div>
    </div>
  );
}