import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { logout, isLoggedIn } from "../api/auth";
import "../styles/delete-account.css";

const API_BASE_URL = import.meta.env.VITE_API_URL;

export default function DeleteAccount() {
  const navigate = useNavigate();
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!isLoggedIn()) {
      alert("로그인이 필요합니다.");
      navigate("/login");
      return;
    }

    fetchUserInfo();
  }, []);

  const fetchUserInfo = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      const res = await axios.get(`${API_BASE_URL}/user/info`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUserInfo(res.data);
    } catch (error) {
      console.error("사용자 정보 조회 실패:", error);
      alert("사용자 정보를 불러올 수 없습니다.");
      navigate("/");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (confirmText !== "회원탈퇴") {
      alert('"회원탈퇴"를 정확히 입력해주세요.');
      return;
    }

    if (!window.confirm("정말로 탈퇴하시겠습니까? 이 작업은 되돌릴 수 없습니다.")) {
      return;
    }

    setIsDeleting(true);

    try {
      const token = localStorage.getItem("accessToken");
      await axios.delete(`${API_BASE_URL}/user/delete`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      alert("회원 탈퇴가 완료되었습니다. 이용해주셔서 감사합니다.");
      
      // 로그아웃 처리
      logout();
      navigate("/");

    } catch (error) {
      console.error("계정 삭제 실패:", error);
      alert(error.response?.data?.message || "계정 삭제 중 오류가 발생했습니다.");
    } finally {
      setIsDeleting(false);
      setShowConfirmModal(false);
    }
  };

  if (loading) {
    return (
      <div className="delete-account-container">
        <div className="loading">정보를 불러오는 중...</div>
      </div>
    );
  }

  return (
    <div className="delete-account-container">
      <div className="delete-account-card">
        <h1 className="delete-title">🗑️ 회원 탈퇴</h1>
        <p className="delete-subtitle">
          계정을 삭제하기 전에 아래 내용을 확인해주세요.
        </p>

        {/* 사용자 정보 */}
        <div className="user-info-section">
          <h2>현재 계정 정보</h2>
          <div className="user-info-grid">
            <div className="info-item">
              <span className="info-label">이메일</span>
              <span className="info-value">{userInfo?.email}</span>
            </div>
            <div className="info-item">
              <span className="info-label">이름</span>
              <span className="info-value">{userInfo?.name}</span>
            </div>
            <div className="info-item">
              <span className="info-label">프로필</span>
              <span className="info-value">
                {userInfo?.picture ? (
                  <img src={userInfo.picture} alt="프로필" style={{ width: "40px", height: "40px", borderRadius: "50%" }} />
                ) : (
                  "없음"
                )}
              </span>
            </div>
            <div className="info-item">
              <span className="info-label">좋아요</span>
              <span className="info-value">{userInfo?.likeCount}개</span>
            </div>
            <div className="info-item">
              <span className="info-label">댓글</span>
              <span className="info-value">{userInfo?.commentCount}개</span>
            </div>
          </div>
        </div>

        {/* 경고 사항 */}
        <div className="warning-section">
          <h2>⚠️ 탈퇴 시 삭제되는 정보</h2>
          <ul>
            <li>계정 정보 (이메일, 이름, 프로필)</li>
            <li>좋아요 {userInfo?.likeCount}개</li>
            <li>댓글 {userInfo?.commentCount}개</li>
            <li>취향 메뉴 설정</li>
            <li>알레르기 정보</li>
            <li>알림 설정</li>
          </ul>
          <p className="warning-text">
            <strong>탈퇴 후에는 데이터를 복구할 수 없습니다.</strong>
          </p>
        </div>

        {/* 법적 고지 */}
        <div className="legal-notice">
          <h3>법령에 따른 정보 보관</h3>
          <p>
            전자상거래법 등 관련 법령에 따라 일부 정보는 일정 기간 보관됩니다:
          </p>
          <ul>
            <li>소비자 불만 또는 분쟁 처리 기록: 3년</li>
            <li>접속 로그 기록: 3개월</li>
          </ul>
        </div>

        {/* 버튼 */}
        <div className="action-buttons">
          <button className="cancel-btn" onClick={() => navigate("/mypage")}>
            취소
          </button>
          <button
            className="delete-btn"
            onClick={() => setShowConfirmModal(true)}
          >
            회원 탈퇴
          </button>
        </div>
      </div>

      {/* 확인 모달 */}
      {showConfirmModal && (
        <div className="modal-overlay" onClick={() => setShowConfirmModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>정말로 탈퇴하시겠습니까?</h2>
            <p>
              탈퇴를 진행하려면 아래 입력란에 <strong>"회원탈퇴"</strong>를 입력해주세요.
            </p>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="회원탈퇴"
              className="confirm-input"
              autoFocus
            />
            <div className="modal-buttons">
              <button
                className="modal-cancel-btn"
                onClick={() => {
                  setShowConfirmModal(false);
                  setConfirmText("");
                }}
                disabled={isDeleting}
              >
                취소
              </button>
              <button
                className="modal-delete-btn"
                onClick={handleDeleteAccount}
                disabled={isDeleting || confirmText !== "회원탈퇴"}
              >
                {isDeleting ? "처리 중..." : "탈퇴하기"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}