import { useState, useEffect } from "react";
import axios from "axios";

const API = import.meta.env.VITE_API_URL as string;

interface Period {
  id?: number;
  period: number;
  label: string;
  start_time: string;
  end_time: string;
}

const DEFAULT_PERIODS: Period[] = [
  { period: 1, label: "1교시", start_time: "09:00", end_time: "09:45" },
  { period: 2, label: "2교시", start_time: "09:55", end_time: "10:40" },
  { period: 3, label: "3교시", start_time: "10:50", end_time: "11:35" },
  { period: 4, label: "4교시", start_time: "11:45", end_time: "12:30" },
  { period: 5, label: "5교시", start_time: "13:20", end_time: "14:05" },
  { period: 6, label: "6교시", start_time: "14:15", end_time: "15:00" },
  { period: 7, label: "7교시", start_time: "15:10", end_time: "15:55" },
];

export default function ClassPeriodManager() {
  const token = sessionStorage.getItem("accessToken");
  const headers = { Authorization: `Bearer ${token}` };

  const [periods, setPeriods] = useState<Period[]>(DEFAULT_PERIODS);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const [overrideDate, setOverrideDate] = useState(new Date().toISOString().slice(0, 10));
  const [overridePeriods, setOverridePeriods] = useState<Period[]>([]);
  const [overrideSaving, setOverrideSaving] = useState(false);
  const [overrideLoaded, setOverrideLoaded] = useState(false);

  useEffect(() => {
    axios
      .get(`${API}/class-periods`, { params: { target_date: new Date().toISOString().slice(0, 10) } })
      .then((r) => {
        if (r.data && r.data.length > 0) setPeriods(r.data);
      })
      .catch(() => {});
  }, []);

  const updatePeriod = (idx: number, field: keyof Period, value: string) => {
    setPeriods((prev) => prev.map((p, i) => (i === idx ? { ...p, [field]: value } : p)));
  };

  const addPeriod = () => {
    const next = periods.length + 1;
    setPeriods((prev) => [
      ...prev,
      { period: next, label: `${next}교시`, start_time: "00:00", end_time: "00:00" },
    ]);
  };

  const removePeriod = (idx: number) => {
    setPeriods((prev) => prev.filter((_, i) => i !== idx).map((p, i) => ({ ...p, period: i + 1 })));
  };

  const saveDefault = async () => {
    setSaving(true);
    setMsg(null);
    try {
      await axios.put(`${API}/class-periods/default`, periods, { headers });
      setMsg({ type: "ok", text: "기본 교시가 저장되었습니다." });
    } catch {
      setMsg({ type: "err", text: "저장 실패. 권한을 확인하세요." });
    } finally {
      setSaving(false);
    }
  };

  const loadOverride = async () => {
    try {
      const r = await axios.get(`${API}/class-periods`, { params: { target_date: overrideDate } });
      setOverridePeriods(r.data.length > 0 ? r.data : periods.map((p) => ({ ...p, id: undefined })));
      setOverrideLoaded(true);
    } catch {
      setOverridePeriods(periods.map((p) => ({ ...p, id: undefined })));
      setOverrideLoaded(true);
    }
  };

  const updateOverride = (idx: number, field: keyof Period, value: string) => {
    setOverridePeriods((prev) => prev.map((p, i) => (i === idx ? { ...p, [field]: value } : p)));
  };

  const saveOverride = async () => {
    setOverrideSaving(true);
    try {
      await axios.put(`${API}/class-periods/override/${overrideDate}`, overridePeriods, { headers });
      setMsg({ type: "ok", text: `${overrideDate} 특별 교시가 저장되었습니다.` });
    } catch {
      setMsg({ type: "err", text: "특별 교시 저장 실패." });
    } finally {
      setOverrideSaving(false);
    }
  };

  const deleteOverride = async () => {
    if (!confirm(`${overrideDate} 특별 교시를 삭제하고 기본 교시로 되돌리겠습니까?`)) return;
    try {
      await axios.delete(`${API}/class-periods/override/${overrideDate}`, { headers });
      setMsg({ type: "ok", text: "삭제되었습니다." });
      setOverrideLoaded(false);
      setOverridePeriods([]);
    } catch {
      setMsg({ type: "err", text: "삭제 실패." });
    }
  };

  return (
    <div style={{ maxWidth: 680 }}>
      {msg && (
        <div
          style={{
            padding: "10px 16px",
            borderRadius: 8,
            marginBottom: 20,
            background: msg.type === "ok" ? "#f0fdf4" : "#fff1f2",
            color: msg.type === "ok" ? "#15803d" : "#be123c",
            fontWeight: 600,
            fontSize: "0.9rem",
          }}
        >
          {msg.text}
        </div>
      )}

      {/* 기본 교시 */}
      <section className="admin-section">
        <h3>⏰ 기본 교시 설정</h3>
        <p style={{ fontSize: "0.85rem", color: "#64748b", marginBottom: 16 }}>
          매일 적용되는 기본 교시 시간입니다. 특별한 날은 아래 날짜별 설정에서 따로 지정하세요.
        </p>

        <table className="admin-table">
          <thead>
            <tr>
              <th>교시</th>
              <th>이름</th>
              <th>시작</th>
              <th>종료</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {periods.map((p, i) => (
              <tr key={i}>
                <td style={{ width: 50, textAlign: "center", color: "#64748b" }}>{p.period}</td>
                <td>
                  <input
                    value={p.label}
                    onChange={(e) => updatePeriod(i, "label", e.target.value)}
                    style={{ width: "100%", padding: "4px 8px", border: "1px solid #e2e8f0", borderRadius: 6 }}
                  />
                </td>
                <td>
                  <input
                    type="time"
                    value={p.start_time}
                    onChange={(e) => updatePeriod(i, "start_time", e.target.value)}
                    style={{ padding: "4px 8px", border: "1px solid #e2e8f0", borderRadius: 6 }}
                  />
                </td>
                <td>
                  <input
                    type="time"
                    value={p.end_time}
                    onChange={(e) => updatePeriod(i, "end_time", e.target.value)}
                    style={{ padding: "4px 8px", border: "1px solid #e2e8f0", borderRadius: 6 }}
                  />
                </td>
                <td>
                  <button
                    onClick={() => removePeriod(i)}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#e11d48",
                      cursor: "pointer",
                      fontSize: "1rem",
                    }}
                  >
                    ✕
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
          <button onClick={addPeriod} style={{ padding: "8px 16px", borderRadius: 8, border: "1.5px dashed #cbd5e1", background: "transparent", cursor: "pointer", color: "#64748b" }}>
            + 교시 추가
          </button>
          <button
            onClick={saveDefault}
            disabled={saving}
            style={{ padding: "8px 20px", borderRadius: 8, background: "#5b7cff", color: "#fff", border: "none", cursor: "pointer", fontWeight: 600 }}
          >
            {saving ? "저장 중..." : "기본 교시 저장"}
          </button>
        </div>
      </section>

      {/* 날짜별 특별 교시 */}
      <section className="admin-section" style={{ marginTop: 32 }}>
        <h3>📅 날짜별 특별 교시</h3>
        <p style={{ fontSize: "0.85rem", color: "#64748b", marginBottom: 16 }}>
          수련회, 시험 등 특정 날에만 다른 교시를 적용할 때 사용합니다.
        </p>

        <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
          <input
            type="date"
            value={overrideDate}
            onChange={(e) => { setOverrideDate(e.target.value); setOverrideLoaded(false); setOverridePeriods([]); }}
            style={{ padding: "7px 12px", border: "1.5px solid #e2e8f0", borderRadius: 8 }}
          />
          <button
            onClick={loadOverride}
            style={{ padding: "7px 16px", borderRadius: 8, background: "#f1f5f9", border: "1px solid #e2e8f0", cursor: "pointer", fontWeight: 600 }}
          >
            불러오기
          </button>
          {overrideLoaded && (
            <button
              onClick={deleteOverride}
              style={{ padding: "7px 16px", borderRadius: 8, background: "#fff1f2", border: "1px solid #fecdd3", color: "#be123c", cursor: "pointer", fontWeight: 600 }}
            >
              삭제
            </button>
          )}
        </div>

        {overrideLoaded && (
          <>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>교시</th>
                  <th>이름</th>
                  <th>시작</th>
                  <th>종료</th>
                </tr>
              </thead>
              <tbody>
                {overridePeriods.map((p, i) => (
                  <tr key={i}>
                    <td style={{ width: 50, textAlign: "center", color: "#64748b" }}>{p.period}</td>
                    <td>
                      <input
                        value={p.label}
                        onChange={(e) => updateOverride(i, "label", e.target.value)}
                        style={{ width: "100%", padding: "4px 8px", border: "1px solid #e2e8f0", borderRadius: 6 }}
                      />
                    </td>
                    <td>
                      <input
                        type="time"
                        value={p.start_time}
                        onChange={(e) => updateOverride(i, "start_time", e.target.value)}
                        style={{ padding: "4px 8px", border: "1px solid #e2e8f0", borderRadius: 6 }}
                      />
                    </td>
                    <td>
                      <input
                        type="time"
                        value={p.end_time}
                        onChange={(e) => updateOverride(i, "end_time", e.target.value)}
                        style={{ padding: "4px 8px", border: "1px solid #e2e8f0", borderRadius: 6 }}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button
              onClick={saveOverride}
              disabled={overrideSaving}
              style={{ marginTop: 14, padding: "8px 20px", borderRadius: 8, background: "#5b7cff", color: "#fff", border: "none", cursor: "pointer", fontWeight: 600 }}
            >
              {overrideSaving ? "저장 중..." : `${overrideDate} 특별 교시 저장`}
            </button>
          </>
        )}
      </section>
    </div>
  );
}
