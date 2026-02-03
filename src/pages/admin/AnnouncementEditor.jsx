import { useState, useEffect } from "react";
import axios from "axios";
import MdEditor from "react-markdown-editor-lite";
import MarkdownIt from "markdown-it";
import "react-markdown-editor-lite/lib/index.css";
import "../../styles/Editor.css";

const mdParser = new MarkdownIt();

export default function AnnouncementEditor({ editData, onComplete }) {
  const [data, setData] = useState({ title: "", content: "" });
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const API_BASE_URL = import.meta.env.VITE_API_URL;
  const token = localStorage.getItem("accessToken");

  // ✅ 수정 모드일 경우 전달받은 데이터로 초기값 설정
  useEffect(() => {
    if (editData) {
      setData({
        title: editData.title || "",
        content: editData.content || "",
      });
      // 기존 이미지가 있다면 미리보기에 표시 (서버에서 주는 이미지 URL 구조에 따라 수정 필요)
      if (editData.imageUrl) {
        setPreviewUrl(editData.imageUrl);
      }
    } else {
      // 신규 작성이면 초기화
      setData({ title: "", content: "" });
      setPreviewUrl(null);
    }
  }, [editData]);

  const handleEditorChange = ({ text }) => {
    setData((prev) => ({ ...prev, content: text }));
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setPreviewUrl(URL.createObjectURL(selectedFile));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!data.title || !data.content) return alert("제목과 내용을 모두 채워주세요.");
    
    setIsSubmitting(true);
    const formData = new FormData();
    formData.append("title", data.title);
    formData.append("content", data.content);
    formData.append("type", "NOTICE");
    if (file) formData.append("file", file);

    try {
      if (editData) {
        // 💡 수정 모드 (PUT)
        await axios.put(`${API_BASE_URL}/notifications/${editData.id}`, formData, {
          headers: { 
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data" 
          }
        });
        alert("✅ 공지사항이 수정되었습니다.");
      } else {
        // 💡 등록 모드 (POST)
        await axios.post(`${API_BASE_URL}/notifications`, formData, {
          headers: { 
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data" 
          }
        });
        alert("✅ 공지사항이 등록되었습니다.");
      }

      // 완료 후 리스트로 이동 (AdminPage에서 넘겨준 함수)
      if (onComplete) onComplete();
      
      // 초기화
      setData({ title: "", content: "" });
      setFile(null);
      setPreviewUrl(null);
    } catch (err) {
      console.error(err);
      alert("처리 실패: " + (err.response?.data?.message || err.message));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="admin-container">
      <header className="admin-header">
        <h1>{editData ? "📝 공지사항 수정" : "📝 공지게시판 글쓰기 (Markdown)"}</h1>
        <p>{editData ? "내용을 수정하고 저장 버튼을 누르세요." : "마크다운 문법을 사용하여 공지를 자유롭게 꾸며보세요."}</p>
      </header>
      
      <section className="admin-section full-width">
        <form onSubmit={handleSubmit} className="admin-form">
          <div className="input-group">
            <label>공지 제목</label>
            <input 
              type="text" 
              placeholder="공지사항의 제목을 입력하세요" 
              value={data.title}
              onChange={(e) => setData({...data, title: e.target.value})}
            />
          </div>
          
          <div className="input-group">
            <label>대표 이미지 {editData ? "변경" : "첨부"} (선택)</label>
            <input type="file" accept="image/*" onChange={handleFileChange} />
            {previewUrl && (
              <div className="image-preview" style={{ marginTop: "10px" }}>
                <img src={previewUrl} alt="미리보기" style={{ width: "200px", borderRadius: "8px" }} />
              </div>
            )}
          </div>

          <div className="input-group">
            <label>공지 상세 내용 (Markdown)</label>
            <div style={{ marginTop: "10px" }}>
              <MdEditor 
                style={{ height: "500px" }} 
                renderHTML={(text) => mdParser.render(text)} 
                onChange={handleEditorChange} 
                value={data.content}
                placeholder="내용을 작성하세요..."
              />
            </div>
          </div>

          <button type="submit" className="btn-send" disabled={isSubmitting} style={{ marginTop: "20px" }}>
            {isSubmitting ? "처리 중..." : editData ? "수정 완료하기" : "게시판에 등록하기"}
          </button>
        </form>
      </section>
    </div>
  );
}