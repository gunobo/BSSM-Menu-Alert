import { useState, useEffect } from "react";
import axios from "axios";
import "../styles/report.css";
import type { Notice } from "../types";

interface NoticeModalProps {
  notice: Notice | null;
  onClose: () => void;
}

export default function NoticeModal({ notice: propsNotice, onClose }: NoticeModalProps) {
  const [localNotice, setLocalNotice] = useState<Notice | null>(null);
  const API_BASE_URL = import.meta.env.VITE_API_URL;
  const todayStr = new Date().toISOString().slice(0, 10);
  const weekLaterStr = (() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().slice(0, 10);
  })();

  useEffect(() => {
    // 1. props로 전달받은 알림이 있으면 그걸 사용
    if (propsNotice) {
      setLocalNotice(propsNotice);
      return;
    }

    // 2. props가 없으면(새로고침 시) 서버에서 직접 조회
    const fetchLatest = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/notifications/latest`);
        const data = res.data;

        if (data && data.type === "ALARM") {
          const dontShowUntil = localStorage.getItem("dontShowNoticeUntil");
          const lastReadId = localStorage.getItem("lastReadNoticeId");

          // 1주일 안보기 체크 혹은 아예 새로운 ID의 공지라면 보여줌
          if (!dontShowUntil || dontShowUntil <= todayStr || (lastReadId && Number(data.id) > Number(lastReadId))) {
            setLocalNotice(data);
          }
        }
      } catch (err) {
        console.error("공지 로딩 실패:", err);
      }
    };
    fetchLatest();
  }, [propsNotice, API_BASE_URL, todayStr]);

  // 보여줄 공지가 없으면 렌더링 안함
  if (!localNotice) return null;

  // 이미지 경로 처리 (백엔드 URL 결합)
  const getImageUrl = () => {
    if (!localNotice.imageUrl) return null;
    if (localNotice.imageUrl.startsWith("http")) return localNotice.imageUrl;
    const SERVER_URL = API_BASE_URL.replace(/\/api$/, "");
    return `${SERVER_URL}/${localNotice.imageUrl.replace(/^\//, "")}`;
  };

  const imageUrl = getImageUrl();

  return (
    <div className="modal-overlay" onClick={() => onClose()}>
      <div className="notice-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>📢 공지사항 알림</h2>
          <button className="close-btn" onClick={() => onClose()}>&times;</button>
        </div>
        
        <div className="notice-body">
          {imageUrl && (
            <div className="notice-image-area" style={{ textAlign: 'center', marginBottom: '15px' }}>
              <img src={imageUrl} alt="공지" style={{ maxWidth: '100%', borderRadius: '8px' }} />
            </div>
          )}
          <div className="notice-text-area">
            <h3 style={{ marginBottom: '10px' }}>{localNotice.title}</h3>
            <p style={{ whiteSpace: "pre-wrap", color: '#444' }}>{localNotice.content}</p>
          </div>
        </div>

        <div className="notice-footer" style={{ marginTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <label style={{ fontSize: '14px', cursor: 'pointer' }}>
            <input type="checkbox" onChange={(e) => {
              if(e.target.checked) {
                localStorage.setItem("dontShowNoticeUntil", weekLaterStr);
                localStorage.setItem("lastReadNoticeId", String(localNotice.id));
              }
            }} /> 1주일 보지 않기
          </label>
          <button className="confirm-btn" onClick={() => {
             setLocalNotice(null);
             onClose();
          }}>닫기</button>
        </div>
      </div>
    </div>
  );
}