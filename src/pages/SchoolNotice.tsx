import { useState, useEffect } from "react";
import Navbar from "./Navbar";
import Footer from "./footer";
import "../styles/school-notice.css";

const API_BASE_URL = import.meta.env.VITE_API_URL as string;

interface NoticeItem {
  title: string;
  date: string;
  url: string;
}

type BoardType = "notice" | "family";

export default function SchoolNotice() {
  const [tab, setTab] = useState<BoardType>("notice");
  const [items, setItems] = useState<NoticeItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [page, setPage] = useState(1);

  useEffect(() => {
    setLoading(true);
    setError(false);
    setItems([]);
    fetch(`${API_BASE_URL}/school-notice/${tab}?page=${page}`)
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(setItems)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [tab, page]);

  const switchTab = (t: BoardType) => {
    setTab(t);
    setPage(1);
  };

  return (
    <>
      <Navbar selectedDate={new Date()} setSelectedDate={() => {}} />

      <section className="sn-hero">
        <h1>학교 알림</h1>
      </section>

      <main className="sn-container">
        <div className="sn-tabs">
          <button
            className={`sn-tab ${tab === "notice" ? "active" : ""}`}
            onClick={() => switchTab("notice")}
          >
            📢 공지사항
          </button>
          <button
            className={`sn-tab ${tab === "family" ? "active" : ""}`}
            onClick={() => switchTab("family")}
          >
            📄 가정통신문
          </button>
        </div>

        <div className="sn-card">
          {loading ? (
            <p className="sn-status">불러오는 중...</p>
          ) : error ? (
            <p className="sn-status sn-error">학교 홈페이지에서 데이터를 가져오지 못했습니다.</p>
          ) : items.length === 0 ? (
            <p className="sn-status">게시글이 없습니다.</p>
          ) : (
            <ul className="sn-list">
              {items.map((item, i) => (
                <li key={i} className="sn-item">
                  <a
                    href={item.url || "https://school.busanedu.net/bssm-h"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="sn-item-title"
                  >
                    {item.title}
                  </a>
                  {item.date && <span className="sn-item-date">{item.date}</span>}
                </li>
              ))}
            </ul>
          )}
        </div>

        {!loading && !error && (
          <div className="sn-pagination">
            <button
              className="sn-page-btn"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              ◀ 이전
            </button>
            <span className="sn-page-label">{page}페이지</span>
            <button
              className="sn-page-btn"
              onClick={() => setPage(p => p + 1)}
              disabled={items.length === 0}
            >
              다음 ▶
            </button>
          </div>
        )}
      </main>

      <Footer />
    </>
  );
}
