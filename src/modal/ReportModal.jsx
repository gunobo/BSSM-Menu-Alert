import { useState } from "react";
import axios from "axios";
import "../styles/report.css"; 

export default function ReportModal({ target, onClose }) {
  const [reason, setReason] = useState("부적절한 정보");
  const [content, setContent] = useState("");
  const API_BASE_URL = import.meta.env.VITE_API_URL;

  const handleSubmit = async () => {
    // ✅ 이 줄을 추가해서 토큰을 가져와야 합니다!
    const token = sessionStorage.getItem("accessToken") || sessionStorage.getItem("accessToken");
    console.log("실제 토큰 값:", token);

    if (!token) return alert("로그인이 필요합니다.");

    const reportData = {
      reason: reason,
      content: content,
      targetId: target.id,
      type: target.type === "ETC" ? "REVIEW" : target.type.toUpperCase(),
      isReported: true
    };

    console.log("전송 데이터 확인:", reportData);

    try {
      const res = await axios.post(`${API_BASE_URL}/reports`, reportData, {
        headers: { 
          Authorization: `Bearer ${token}`, 
          "Content-Type": "application/json"
        }
      });

      if (res.status === 200 || res.status === 201) {
        alert("🚨 건의가 정상 접수되었습니다. 건의 결과는 이메일로 발송됩니다.");
        onClose();
      }
    } catch (err) {
      console.error("건의 에러 상세:", err.response?.data || err.message);
      alert(`건의 제출 실패: ${err.response?.data?.message || "서버 오류"}`);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      {/* ✅ CSS 클래스명을 report-modal로 일치시킴 */}
      <div className="report-modal" onClick={(e) => e.stopPropagation()}>
        <h2>🚨 건의하기</h2>
        <p className="target-info">대상: {target.name}</p>
        
        <div className="form-group">
          <label>건의 사유</label>
          <select value={reason} onChange={(e) => setReason(e.target.value)}>
            <option value="부적절한 정보">부적절한 정보</option>
            <option value="오타 및 오류">오타 및 오류</option>
            <option value="기능 오류">기능 오류</option>
            <option value="급식 건의">급식 건의</option>
            <option value="기타">기타</option>
          </select>
        </div>

        <div className="form-group">
          <label>상세 내용 (선택)</label>
          <textarea 
            placeholder="상세 내용을 입력해주세요..." 
            value={content} 
            onChange={(e) => setContent(e.target.value)}
          />
        </div>

        <div className="modal-btns">
          <button className="submit-btn" onClick={handleSubmit}>제출</button>
          <button className="cancel-btn" onClick={onClose}>취소</button>
        </div>
      </div>
    </div>
  );
}