import { useState } from "react";

export default function NoticeModal({ notice, onClose }) {
  const [dontShowToday, setDontShowToday] = useState(false);

  if (!notice) return null;

  /**
   * ✅ 문제 해결의 핵심
   * VITE_API_URL은 보통 끝에 /api가 붙어있습니다.
   * 이미지는 API를 타지 않으므로 서버의 '순수 주소'만 필요합니다.
   */
  const API_URL = import.meta.env.VITE_API_URL; // 예: http://localhost:8080/api
  const IMAGE_BASE_URL = API_URL.replace("/api", ""); // http://localhost:8080 으로 변경

  // 이미지 경로 정제
  const imageUrl = notice.imageUrl?.startsWith('/') 
    ? `${IMAGE_BASE_URL}${notice.imageUrl}` 
    : `${IMAGE_BASE_URL}/${notice.imageUrl}`;

  return (
    <div className="modal-overlay" onClick={() => onClose(dontShowToday)}>
      <div className="notice-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>📢 공지사항</h2>
          <button className="close-btn" onClick={() => onClose(dontShowToday)}>&times;</button>
        </div>
        
        <div className="notice-body">
          {notice.imageUrl && (
            <div className="notice-image-container">
              <img 
                src={imageUrl} 
                alt="공지 이미지" 
                className="notice-img" 
                onError={(e) => {
                  console.error("이미지 로드 실패 주소 확인:", imageUrl);
                  e.target.closest('.notice-image-container').style.display = 'none';
                }} 
              />
            </div>
          )}
          
          <h3 className="notice-title-text">{notice.title}</h3>
          <p className="notice-description">{notice.content}</p>
        </div>

        <div className="notice-footer">
          <label className="dont-show-label">
            <input 
              type="checkbox" 
              checked={dontShowToday} 
              onChange={(e) => setDontShowToday(e.target.checked)}
            />
            오늘 하루 그만 보기
          </label>
          
          <button className="notice-confirm-btn" onClick={() => onClose(dontShowToday)}>
            확인
          </button>
        </div>
      </div>
    </div>
  );
}