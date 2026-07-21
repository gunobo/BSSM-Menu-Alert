import { useState, useEffect } from "react";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL as string;

interface Exam {
  id: number;
  title: string;
  startDate: string;
  endDate: string;
  description?: string;
  grade1: boolean;
  grade2: boolean;
  grade3: boolean;
}

function fmtDate(ymd: string) {
  return `${ymd.slice(0,4)}-${ymd.slice(4,6)}-${ymd.slice(6,8)}`;
}

export default function ExamScheduleManager() {
  const token = sessionStorage.getItem("accessToken");
  const headers = { Authorization: `Bearer ${token}` };

  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    title: "",
    startDate: "",
    endDate: "",
    grade1: true,
    grade2: true,
    grade3: true,
    description: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchExams = async () => {
    setLoading(true);
    try {
      // 해당 월 전학년 조회 (grade=1로 하되, 전체 목록은 관리자 전용으로 별도 처리)
      const results = await Promise.all([1,2,3].map(g =>
        axios.get(`${API_URL}/schedule/exams?year=${year}&month=${month}&grade=${g}`, { headers })
          .then(r => r.data as Exam[])
          .catch(() => [] as Exam[])
      ));
      // 중복 제거 (id 기준)
      const map = new Map<number, Exam>();
      results.flat().forEach(e => map.set(e.id, e));
      setExams([...map.values()].sort((a,b) => a.startDate.localeCompare(b.startDate)));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchExams(); }, [year, month]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.startDate || !form.endDate) return alert("제목과 날짜를 입력하세요.");
    if (!form.grade1 && !form.grade2 && !form.grade3) return alert("학년을 하나 이상 선택하세요.");
    setSubmitting(true);
    try {
      await axios.post(`${API_URL}/schedule/exams`, {
        title: form.title,
        startDate: form.startDate.replace(/-/g, ""),
        endDate: form.endDate.replace(/-/g, ""),
        grade1: form.grade1,
        grade2: form.grade2,
        grade3: form.grade3,
        description: form.description || null,
      }, { headers });
      setForm({ title: "", startDate: "", endDate: "", grade1: true, grade2: true, grade3: true, description: "" });
      await fetchExams();
    } catch {
      alert("등록 실패");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("삭제하시겠습니까?")) return;
    try {
      await axios.delete(`${API_URL}/schedule/exams/${id}`, { headers });
      setExams(prev => prev.filter(e => e.id !== id));
    } catch {
      alert("삭제 실패");
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* 등록 폼 */}
      <section className="admin-section">
        <h3>시험 일정 등록</h3>
        <form onSubmit={handleSubmit} className="admin-form" style={{ gap: "12px" }}>
          <input
            type="text"
            placeholder="시험 제목 (예: 1학기 중간고사)"
            value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
          />
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: "140px" }}>
              <label style={{ fontSize: "0.8rem", color: "#64748b", display: "block", marginBottom: "4px" }}>시작일</label>
              <input type="date" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} style={{ width: "100%" }} />
            </div>
            <div style={{ flex: 1, minWidth: "140px" }}>
              <label style={{ fontSize: "0.8rem", color: "#64748b", display: "block", marginBottom: "4px" }}>종료일</label>
              <input type="date" value={form.endDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} style={{ width: "100%" }} />
            </div>
          </div>
          <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
            <span style={{ fontSize: "0.88rem", color: "#64748b" }}>대상 학년:</span>
            {([1,2,3] as const).map(g => (
              <label key={g} style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "0.9rem", cursor: "pointer" }}>
                <input type="checkbox" checked={form[`grade${g}` as "grade1"|"grade2"|"grade3"]}
                  onChange={e => setForm(f => ({ ...f, [`grade${g}`]: e.target.checked }))} />
                {g}학년
              </label>
            ))}
          </div>
          <textarea
            placeholder="비고 (선택)"
            value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            rows={2}
          />
          <button type="submit" disabled={submitting}>{submitting ? "등록 중..." : "등록하기"}</button>
        </form>
      </section>

      {/* 목록 */}
      <section className="admin-section">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "8px" }}>
          <h3>등록된 시험 일정</h3>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <button onClick={() => { if (month === 1) { setYear(y => y-1); setMonth(12); } else setMonth(m => m-1); }} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "1rem" }}>◀</button>
            <span style={{ fontWeight: 600 }}>{year}년 {month}월</span>
            <button onClick={() => { if (month === 12) { setYear(y => y+1); setMonth(1); } else setMonth(m => m+1); }} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "1rem" }}>▶</button>
          </div>
        </div>
        {loading ? (
          <p style={{ color: "#94a3b8" }}>불러오는 중...</p>
        ) : exams.length === 0 ? (
          <p style={{ color: "#94a3b8" }}>등록된 시험 일정이 없습니다.</p>
        ) : (
          <table className="admin-table">
            <thead>
              <tr><th>제목</th><th>기간</th><th>대상</th><th>비고</th><th>삭제</th></tr>
            </thead>
            <tbody>
              {exams.map(e => (
                <tr key={e.id}>
                  <td>{e.title}</td>
                  <td style={{ whiteSpace: "nowrap" }}>{fmtDate(e.startDate)} ~ {fmtDate(e.endDate)}</td>
                  <td>{[e.grade1 && "1학년", e.grade2 && "2학년", e.grade3 && "3학년"].filter(Boolean).join(", ")}</td>
                  <td>{e.description || "-"}</td>
                  <td><button onClick={() => handleDelete(e.id)} style={{ background: "#ef4444", color: "white", border: "none", borderRadius: "6px", padding: "4px 10px", cursor: "pointer" }}>삭제</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
