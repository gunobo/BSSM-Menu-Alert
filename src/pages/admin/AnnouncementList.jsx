import { useEffect, useState } from "react";
import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL;

export default function AnnouncementList({ onEdit }) { // ✅ AdminPage에서 넘겨준 onEdit 프롭스
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotices = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE_URL}/notifications/all`);
      setNotices(res.data);
    } catch (err) {
      console.error("공지 로드 실패:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchNotices(); }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("정말로 삭제하시겠습니까?")) return;
    try {
      await axios.delete(`${API_BASE_URL}/notifications/${id}`);
      alert("삭제되었습니다.");
      fetchNotices();
    } catch (err) {
      alert("삭제 실패");
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
              <th>제목</th>
              <th>작성일</th>
              <th>관리</th>
            </tr>
          </thead>
          <tbody>
            {notices.map((notice, index) => (
              <tr key={notice.id}>
                <td className="td-id">{notices.length - index}</td>
                <td className="td-title">{notice.title}</td>
                <td className="td-date">{notice.createdAt?.slice(0, 10)}</td>
                <td className="td-actions">
                  {/* ✅ 여기서 onEdit(notice)를 호출하면 AdminPage가 에디터를 열고 내용을 채웁니다 */}
                  <button className="edit-btn" onClick={() => onEdit(notice)}>
                    수정
                  </button>
                  <button className="delete-btn" onClick={() => handleDelete(notice.id)}>
                    삭제
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}