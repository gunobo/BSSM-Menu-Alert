import React, { useState, useEffect } from "react";
import axios from "axios";
import "../../styles/adminComment.css";

export default function AdminCommentManager() {
  const [comments, setComments] = useState([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);

  const [searchType, setSearchType] = useState("username");
  const [keyword, setKeyword] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [filterType, setFilterType] = useState("");

  const fetchComments = async (pageNum = 0) => {
    setLoading(true);
    try {
      const token = sessionStorage.getItem("accessToken");
      const formattedDate = filterDate ? filterDate.replace(/-/g, "") : "";

      const res = await axios.get(`${import.meta.env.VITE_API_URL}/comments/admin/all`, {
        params: {
          page: pageNum,
          size: 10,
          type: searchType,
          keyword: keyword,
          mealDate: formattedDate,
          mealType: filterType,
        },
        headers: { Authorization: `Bearer ${token}` },
      });

      setComments(res.data.content || []);
      setTotalPages(res.data.totalPages || 0);
      setPage(pageNum);
    } catch (err) {
      console.error("데이터 로드 실패:", err);
      alert("데이터를 불러오는 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("이 댓글을 삭제하시겠습니까? 복구할 수 없습니다.")) return;
    try {
      const token = sessionStorage.getItem("accessToken");
      await axios.delete(`${import.meta.env.VITE_API_URL}/comments/admin/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert("삭제되었습니다.");
      fetchComments(page);
    } catch (err) {
      alert("삭제 실패");
    }
  };

  return (
    <div className="comment-manager-container">
      {/* 🔍 검색 및 필터 영역 */}
      <div className="comment-filter-bar">
        <select
          className="filter-select"
          value={searchType}
          onChange={(e) => setSearchType(e.target.value)}
        >
          <option value="username">이름</option>
          <option value="email">이메일</option>
        </select>
        <input
          className="filter-input"
          type="text"
          placeholder="검색어 입력..."
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
        />

        <div className="filter-divider"></div>

        <input
          className="filter-date"
          type="date"
          value={filterDate}
          onChange={(e) => setFilterDate(e.target.value)}
        />
        <select
          className="filter-select"
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
        >
          <option value="">식사 전체</option>
          <option value="조식">조식</option>
          <option value="중식">중식</option>
          <option value="석식">석식</option>
        </select>

        <button className="btn-search" onClick={() => fetchComments(0)}>검색</button>
        <button
          className="btn-reset"
          onClick={() => {
            setKeyword("");
            setFilterDate("");
            setFilterType("");
            fetchComments(0);
          }}
        >
          초기화
        </button>
      </div>

      {/* 📋 테이블 영역 */}
      <div className="comment-table-wrapper">
        <table className="comment-table">
          <thead>
            <tr>
              <th className="col-info">급식 정보</th>
              <th className="col-author">작성자</th>
              <th className="col-content">댓글 내용</th>
              <th className="col-action">관리</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={4} className="msg-cell">데이터 로딩 중...</td></tr>
            ) : comments.length > 0 ? (
              comments.map((c) => (
                <tr key={c.id}>
                  <td className="info-cell">
                    {c.mealDate} <br />
                    <span className="meal-type-tag">{c.mealType}</span>
                  </td>
                  <td className="author-cell">
                    <div className="author-name">{c.username}</div>
                    <div className="author-email">{c.email}</div>
                  </td>
                  <td className="content-cell">{c.content}</td>
                  <td className="action-cell">
                    <button className="btn-delete" onClick={() => handleDelete(c.id)}>삭제</button>
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan={4} className="msg-cell empty">조회된 댓글이 없습니다.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* 🔢 페이지네이션 */}
      {totalPages > 0 && (
        <div className="pagination-container">
          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i}
              className={`page-btn ${page === i ? "active" : ""}`}
              onClick={() => fetchComments(i)}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}