import React, { useState, useEffect } from "react";
import { getTeacherRoster, addTeacherRoster, updateTeacherRoster, deleteTeacherRoster } from "../../api/timetableApi";

export default function TeacherRosterManager() {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [newDept, setNewDept] = useState("");
  const [adding, setAdding] = useState(false);
  const [editId, setEditId] = useState(null);
  const [editName, setEditName] = useState("");
  const [editDept, setEditDept] = useState("");
  const [message, setMessage] = useState(null);

  const load = async () => {
    setLoading(true);
    try { setTeachers(await getTeacherRoster()); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleAdd = async () => {
    if (!newName.trim()) return;
    setAdding(true);
    setMessage(null);
    try {
      await addTeacherRoster(newName.trim(), newDept.trim());
      setNewName(""); setNewDept("");
      await load();
      setMessage({ type: "success", text: "교직원이 추가되었습니다." });
    } catch (e) {
      setMessage({ type: "error", text: e.message });
    } finally { setAdding(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("삭제하시겠습니까?")) return;
    try {
      await deleteTeacherRoster(id);
      setTeachers((prev) => prev.filter((t) => t.id !== id));
      setMessage({ type: "success", text: "삭제되었습니다." });
    } catch (e) {
      setMessage({ type: "error", text: e.message });
    }
  };

  const handleEditSave = async (id) => {
    try {
      await updateTeacherRoster(id, editName, editDept);
      setEditId(null);
      await load();
      setMessage({ type: "success", text: "수정되었습니다." });
    } catch (e) {
      setMessage({ type: "error", text: e.message });
    }
  };

  return (
    <div>
      <div className="admin-section">
        <h3>📋 교직원 관리</h3>
        <p style={{ color: "#64748b", fontSize: "0.9rem", marginBottom: 20 }}>
          교직원 목록을 관리합니다. 여기 등록된 교사 이름이 교사 매핑에서 자동완성으로 제공됩니다.
        </p>

        {/* 추가 폼 */}
        <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
          <input
            className="tt-admin-select"
            placeholder="이름"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            style={{ width: 140 }}
          />
          <input
            className="tt-admin-select"
            placeholder="담당과목/부서 (선택)"
            value={newDept}
            onChange={(e) => setNewDept(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            style={{ width: 200 }}
          />
          <button
            className="tt-admin-btn-save btn-submit"
            onClick={handleAdd}
            disabled={adding || !newName.trim()}
          >
            {adding ? "추가 중..." : "+ 추가"}
          </button>
        </div>

        {message && (
          <div className={`tt-admin-msg ${message.type}`} style={{ marginBottom: 16 }}>
            {message.type === "success" ? "✅ " : "❌ "}{message.text}
          </div>
        )}

        {loading ? (
          <p style={{ color: "#94a3b8", textAlign: "center", padding: "40px 0" }}>불러오는 중...</p>
        ) : teachers.length === 0 ? (
          <p style={{ color: "#cbd5e1", textAlign: "center", padding: "40px 0", fontSize: "0.9rem" }}>
            등록된 교직원이 없습니다.
          </p>
        ) : (
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>이름</th>
                  <th>담당과목/부서</th>
                  <th style={{ width: 120 }}>관리</th>
                </tr>
              </thead>
              <tbody>
                {teachers.map((t) => (
                  <tr key={t.id}>
                    <td>
                      {editId === t.id ? (
                        <input className="tt-admin-select" value={editName}
                          onChange={(e) => setEditName(e.target.value)} style={{ width: "100%" }} />
                      ) : t.name}
                    </td>
                    <td>
                      {editId === t.id ? (
                        <input className="tt-admin-select" value={editDept}
                          onChange={(e) => setEditDept(e.target.value)} style={{ width: "100%" }} />
                      ) : (t.department || "-")}
                    </td>
                    <td>
                      {editId === t.id ? (
                        <div style={{ display: "flex", gap: 6 }}>
                          <button className="tt-admin-btn-save btn-submit"
                            style={{ padding: "4px 10px", fontSize: "0.8rem" }}
                            onClick={() => handleEditSave(t.id)}>저장</button>
                          <button style={{ padding: "4px 10px", fontSize: "0.8rem", cursor: "pointer" }}
                            onClick={() => setEditId(null)}>취소</button>
                        </div>
                      ) : (
                        <div style={{ display: "flex", gap: 6 }}>
                          <button style={{ padding: "4px 10px", fontSize: "0.8rem", cursor: "pointer" }}
                            onClick={() => { setEditId(t.id); setEditName(t.name); setEditDept(t.department || ""); }}>수정</button>
                          <button style={{ padding: "4px 10px", fontSize: "0.8rem", cursor: "pointer", color: "#ef4444", border: "1px solid #ef4444", borderRadius: 6, background: "transparent" }}
                            onClick={() => handleDelete(t.id)}>삭제</button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
