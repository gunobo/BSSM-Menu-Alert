import { useEffect, useState } from "react";
import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL;

interface NoticeItem {
  id: number;
  type: string;
  title: string;
  createdBy?: string;
  createdAt: string;
}

export default function AnnouncementList({ onEdit }: { onEdit: (notice: NoticeItem) => void }) {
  const [notices, setNotices] = useState<NoticeItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotices = async () => {
    try {
      setLoading(true);
      const token = sessionStorage.getItem("accessToken");
      const res = await axios.get(`${API_BASE_URL}/notifications/all/admin`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotices(res.data);
    } catch (err) {
      console.error("공지 로드 실패:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchNotices(); }, []);

  const handleDelete = async (id: number) => {
    if (!window.confirm("정말로 삭제하시겠습니까?")) return;
    try {
      const token = sessionStorage.getItem("accessToken");
      await axios.delete(`${API_BASE_URL}/notifications/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert("삭제되었습니다.");
      fetchNotices();
    } catch (err) {
      const e = err as { response?: { status?: number; data?: { message?: string } }; message?: string };
      const status = e.response?.status;
      if (status === 401 || status === 403) alert("권한이 없습니다.");
      else alert("삭제 실패: " + (e.response?.data?.message || e.message));
    }
  };

  if (loading) return <div className="loading-msg">로딩 중...</div>;

  return (
    <div className="admin-notice-list">
      <div className="admin-table-wrapper">
        <table className="admin-table2">
          <thead>
            <tr>
              <th>번호</th>
              <th>유형</th>
              <th>제목</th>
              <th>작성자</th>
              <th>작성일</th>
              <th>관리</th>
            </tr>
          </thead>
          <tbody>
            {/* ID 오름차순 정렬 */}
            {[...notices].sort((a, b) => a.id - b.id).map((notice) => (
              <tr key={notice.id}>
                <td className="td-id">{notice.id}</td>
                <td className="td-type">
                  <span className={`notice-type-badge ${notice.type === "ALARM" ? "alarm" : "notice"}`}>
                    {notice.type === "ALARM" ? "📢 알림" : "📋 공지"}
                  </span>
                </td>
                <td className="td-title">{notice.title}</td>
                <td className="td-author">{notice.createdBy || "-"}</td>
                <td className="td-date">{notice.createdAt?.slice(0, 10)}</td>
                <td className="td-actions">
                  <button className="edit-btn" onClick={() => onEdit(notice)}>수정</button>
                  <button className="delete-btn" onClick={() => handleDelete(notice.id)}>삭제</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}