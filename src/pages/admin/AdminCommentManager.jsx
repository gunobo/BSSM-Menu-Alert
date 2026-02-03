import React, { useState, useEffect } from "react";
import axios from "axios";

export default function AdminCommentManager() {
  const [comments, setComments] = useState([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);

  // 필터 상태 관리
  const [searchType, setSearchType] = useState("username");
  const [keyword, setKeyword] = useState("");
  const [filterDate, setFilterDate] = useState(""); // "yyyy-MM-dd" 형식 유지용
  const [filterType, setFilterType] = useState("");

  // 1. 댓글 목록 불러오기
  const fetchComments = async (pageNum = 0) => {
    setLoading(true);
    try {
      const token = localStorage.getItem("accessToken");

      // ✅ 핵심: 서버가 원하는 형식(20260203)으로 변환, 날짜가 없으면 빈 문자열
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

  // 2. 댓글 삭제 처리
  const handleDelete = async (id) => {
    if (!window.confirm("이 댓글을 삭제하시겠습니까? 복구할 수 없습니다.")) return;
    try {
      const token = localStorage.getItem("accessToken");
      await axios.delete(`${import.meta.env.VITE_API_URL}/comments/admin/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert("삭제되었습니다.");
      fetchComments(page); // 현재 페이지 유지하며 갱신
    } catch (err) {
      alert("삭제 실패");
    }
  };

  return (
    <div className="admin-section" style={{ padding: "20px" }}>
      {/* 🔍 검색 및 필터 영역 */}
      <div
        className="filter-bar"
        style={{
          display: "flex",
          gap: "10px",
          marginBottom: "20px",
          flexWrap: "wrap",
          background: "#f8f9fa",
          padding: "15px",
          borderRadius: "8px",
          alignItems: "center",
        }}
      >
        {/* 이름/이메일 검색 */}
        <select
          value={searchType}
          onChange={(e) => setSearchType(e.target.value)}
          style={{ padding: "8px", borderRadius: "4px", border: "1px solid #ddd" }}
        >
          <option value="username">이름</option>
          <option value="email">이메일</option>
        </select>
        <input
          type="text"
          placeholder="검색어 입력..."
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          style={{ padding: "8px", borderRadius: "4px", border: "1px solid #ddd", width: "180px" }}
        />

        <div style={{ borderLeft: "1px solid #ccc", height: "24px", margin: "0 5px" }}></div>

        {/* 날짜/식사구분 필터 */}
        <input
          type="date"
          value={filterDate} // "yyyy-MM-dd" 형식을 유지해야 에러가 안 남
          onChange={(e) => setFilterDate(e.target.value)}
          style={{ padding: "8px", borderRadius: "4px", border: "1px solid #ddd" }}
        />
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          style={{ padding: "8px", borderRadius: "4px", border: "1px solid #ddd" }}
        >
          <option value="">식사 전체</option>
          <option value="조식">조식</option>
          <option value="중식">중식</option>
          <option value="석식">석식</option>
        </select>

        <button
          onClick={() => fetchComments(0)}
          style={{ background: "#4e73df", color: "white", border: "none", padding: "8px 15px", borderRadius: "4px", cursor: "pointer" }}
        >
          검색
        </button>
        <button
          onClick={() => {
            setKeyword("");
            setFilterDate("");
            setFilterType("");
            fetchComments(0);
          }}
          style={{ background: "#666", color: "white", border: "none", padding: "8px 15px", borderRadius: "4px", cursor: "pointer" }}
        >
          초기화
        </button>
      </div>

      {/* 📋 테이블 영역 */}
      <div style={{ background: "white", borderRadius: "12px", boxShadow: "0 4px 12px rgba(0,0,0,0.05)", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
          <thead style={{ background: "#f1f3f5", borderBottom: "2px solid #dee2e6" }}>
            <tr>
              <th style={{ padding: "12px", width: "15%" }}>급식 정보</th>
              <th style={{ padding: "12px", width: "15%" }}>작성자</th>
              <th style={{ padding: "12px", width: "55%" }}>댓글 내용</th>
              <th style={{ padding: "12px", width: "15%", textAlign: "center" }}>관리</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="4" style={{ padding: "40px", textAlign: "center" }}>데이터 로딩 중...</td></tr>
            ) : comments.length > 0 ? (
              comments.map((c) => (
                <tr key={c.id} style={{ borderBottom: "1px solid #f1f1f1" }}>
                  <td style={{ padding: "12px", fontSize: "0.85rem" }}>
                    {c.mealDate} <br />
                    <span style={{ color: "#4e73df", fontWeight: "bold" }}>{c.mealType}</span>
                  </td>
                  <td style={{ padding: "12px" }}>
                    <div style={{ fontWeight: "600" }}>{c.username}</div>
                    <div style={{ fontSize: "0.75rem", color: "#999" }}>{c.email}</div>
                  </td>
                  <td style={{ padding: "12px", lineHeight: "1.5", whiteSpace: "pre-wrap" }}>{c.content}</td>
                  <td style={{ padding: "12px", textAlign: "center" }}>
                    <button
                      onClick={() => handleDelete(c.id)}
                      style={{ background: "#ff4d4f", color: "white", border: "none", padding: "6px 12px", borderRadius: "4px", cursor: "pointer" }}
                    >
                      삭제
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan="4" style={{ padding: "40px", textAlign: "center", color: "#999" }}>조회된 댓글이 없습니다.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* 🔢 페이지네이션 */}
      {totalPages > 0 && (
        <div style={{ marginTop: "20px", display: "flex", justifyContent: "center", gap: "5px" }}>
          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i}
              onClick={() => fetchComments(i)}
              style={{
                padding: "6px 12px",
                borderRadius: "4px",
                border: "1px solid #ddd",
                background: page === i ? "#4e73df" : "white",
                color: page === i ? "white" : "#333",
                cursor: "pointer",
              }}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}