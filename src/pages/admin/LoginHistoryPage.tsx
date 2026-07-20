import { useEffect, useState, useCallback } from "react";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

export default function LoginHistoryPage() {
  const [history, setHistory] = useState([]);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(0);
  const [emailFilter, setEmailFilter] = useState("");
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);

  const token = sessionStorage.getItem("accessToken");

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, unknown> = { page, size: 50 };
      if (emailFilter) params.email = emailFilter;
      const res = await axios.get(`${API_URL}/admin/login-history`, {
        headers: { Authorization: `Bearer ${token}` },
        params,
      });
      setHistory(res.data.content);
      setTotalElements(res.data.totalElements);
      setTotalPages(res.data.totalPages);
    } catch (err) {
      console.error("로그인 이력 로딩 실패:", err);
    } finally {
      setLoading(false);
    }
  }, [page, emailFilter, token]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(0);
    setEmailFilter(inputValue.trim());
  };

  const handleReset = () => {
    setInputValue("");
    setEmailFilter("");
    setPage(0);
  };

  const formatDate = (iso) => {
    if (!iso) return "-";
    return new Date(iso).toLocaleString("ko-KR", {
      year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", second: "2-digit",
    });
  };

  return (
    <div className="admin-section" style={{ width: "100%" }}>
      <div className="section-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
        <h3>접속 이력 <span style={{ fontSize: "13px", color: "var(--text-muted)", fontWeight: 400 }}>총 {totalElements.toLocaleString()}건</span></h3>
        <button onClick={fetchHistory} className="btn-refresh">🔄 새로고침</button>
      </div>

      {/* 검색 */}
      <form onSubmit={handleSearch} style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
        <input
          type="text"
          placeholder="이메일로 검색..."
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          style={{
            flex: 1,
            padding: "8px 12px",
            borderRadius: "8px",
            border: "1px solid var(--border-color, #ddd)",
            fontSize: "14px",
            backgroundColor: "var(--input-bg, #fff)",
            color: "var(--text-color, #333)",
          }}
        />
        <button type="submit" className="action-process">검색</button>
        {emailFilter && (
          <button type="button" className="btn-refresh" onClick={handleReset}>초기화</button>
        )}
      </form>

      {loading ? (
        <div className="admin-loading">데이터 로딩 중...</div>
      ) : (
        <>
          <div className="table-scroll-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>이름</th>
                  <th>이메일</th>
                  <th>접속 IP</th>
                  <th>접속 시각</th>
                </tr>
              </thead>
              <tbody>
                {history.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: "center", padding: "40px", color: "#bbb" }}>
                      이력이 없습니다.
                    </td>
                  </tr>
                ) : (
                  history.map((h, idx) => (
                    <tr key={h.id}>
                      <td style={{ color: "var(--text-muted)", fontSize: "12px" }}>
                        {totalElements - (page * 50 + idx)}
                      </td>
                      <td>{h.userName || "-"}</td>
                      <td style={{ fontSize: "13px" }}>{h.email}</td>
                      <td>
                        <code style={{ backgroundColor: "var(--code-bg, #f1f3f5)", padding: "2px 8px", borderRadius: "4px", fontSize: "13px", fontFamily: "monospace" }}>
                          {h.networkIp || "-"}
                        </code>
                      </td>
                      <td style={{ fontSize: "13px", color: "var(--text-muted)" }}>
                        {formatDate(h.loginAt)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* 페이지네이션 */}
          {totalPages > 1 && (
            <div style={{ display: "flex", justifyContent: "center", gap: "8px", marginTop: "20px" }}>
              <button
                className="btn-refresh"
                disabled={page === 0}
                onClick={() => setPage((p) => p - 1)}
              >
                ← 이전
              </button>
              <span style={{ lineHeight: "36px", fontSize: "14px", color: "var(--text-muted)" }}>
                {page + 1} / {totalPages}
              </span>
              <button
                className="btn-refresh"
                disabled={page >= totalPages - 1}
                onClick={() => setPage((p) => p + 1)}
              >
                다음 →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
