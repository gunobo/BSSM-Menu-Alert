import React, { useState, useEffect } from "react";
import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL;

export default function CommentModal({ mealKey, mealType, mealDate, onClose }) {
  const [comment, setComment] = useState("");
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);

  // 댓글 목록 가져오기
  const fetchComments = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/comments`, {
        params: { mealDate, mealType, mealKey },
      });
      setComments(res.data);
    } catch (err) {
      console.error("댓글 로드 실패:", err);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [mealKey, mealType, mealDate]);

  // 댓글 제출
  const handleSubmit = async () => {
    if (!comment.trim()) return alert("내용을 입력해주세요!");
    setLoading(true);
    try {
      const token = localStorage.getItem("accessToken");
      await axios.post(
        `${API_BASE_URL}/comments`,
        { mealDate, mealType, mealKey, content: comment },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setComment("");
      fetchComments(); // 등록 후 목록 새로고침
    } catch (err) {
      alert("로그인 후 이용 가능합니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="report-modal" onClick={(e) => e.stopPropagation()}>
        <h2>💬 급식 한줄평</h2>
        
        <div className="target-info">
          {mealDate.slice(0, 4)}-{mealDate.slice(4, 6)}-{mealDate.slice(6, 8)} | {mealType} <br />
        </div>

        {/* 1. 댓글 작성란 (위로 이동) */}
        <div className="form-group" style={{ marginBottom: "20px" }}>
          <label>의견 남기기</label>
          <textarea
            placeholder="맛있었나요? 의견을 나눠주세요! 단, 부적절한 언어를 사용할 경우 3일정지와 댓글삭제 조치가 이루어집니다!"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            style={{ height: "80px" }}
          />
          <button 
            className="submit-btn" 
            style={{ 
              background: "#4e73df", 
              marginTop: "8px", 
              width: "100%",
              border: "none"
            }} 
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? "등록 중..." : "한줄평 등록"}
          </button>
        </div>

        <hr style={{ border: "0", borderTop: "1px solid #eee", margin: "20px 0" }} />

        {/* 2. 댓글 목록 (아래로 이동) */}
        <label style={{ fontSize: "0.9rem", fontWeight: "600", marginBottom: "10px", display: "block" }}>
          최근 댓글
        </label>
        <div className="comment-list-container" style={{ maxHeight: "180px", overflowY: "auto" }}>
          {comments.length > 0 ? (
            comments.map((c, idx) => (
              <div key={idx} style={{ 
                padding: "10px", 
                borderBottom: "1px solid #f8f9fa", 
                fontSize: "0.9rem",
                backgroundColor: "#fcfcfc",
                borderRadius: "8px",
                marginBottom: "5px"
              }}>
                <div style={{ fontWeight: "bold", color: "#4e73df", marginBottom: "3px" }}>
                  {c.username || "익명"}
                </div>
                <div style={{ color: "#444" }}>{c.content}</div>
              </div>
            ))
          ) : (
            <p style={{ textAlign: "center", color: "#999", fontSize: "0.85rem", padding: "20px 0" }}>
              아직 작성된 한줄평이 없습니다.
            </p>
          )}
        </div>

        <div className="modal-btns">
          <button className="cancel-btn" onClick={onClose} style={{ width: "100%", border: "none" }}>
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}