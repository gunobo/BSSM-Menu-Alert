import { useState } from "react";
import axios from "axios";
import MdEditor from "react-markdown-editor-lite";
import MarkdownIt from "markdown-it";
// 에디터 기본 스타일은 필수입니다
import "react-markdown-editor-lite/lib/index.css";

// 마크다운 파서 초기화
const mdParser = new MarkdownIt();

export default function AnnouncementEditor() {
  const [data, setData] = useState({ title: "", content: "" });
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const API_BASE_URL = import.meta.env.VITE_API_URL;
  const token = localStorage.getItem("accessToken");

  // 에디터 내용 변경 핸들러 (MdEditor 전용)
  const handleEditorChange = ({ text }) => {
    setData((prev) => ({ ...prev, content: text }));
  };

  // 이미지 선택 및 미리보기
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
      // ✅ 게시판 등록용 (NoticeController) - sendAlert는 false로 처리됨
      await axios.post(`${API_BASE_URL}/notifications`, formData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data" 
        }
      });
      
      alert("✅ 마크다운 공지사항이 성공적으로 등록되었습니다.");
      
      // 입력 폼 초기화
      setData({ title: "", content: "" });
      setFile(null);
      setPreviewUrl(null);
    } catch (err) {
      console.error(err);
      alert("등록 실패: " + (err.response?.data?.message || err.message));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="admin-container">
      {/* 원래 UI 헤더 그대로 유지 */}
      <header className="admin-header">
        <h1>📝 공지게시판 글쓰기 (Markdown)</h1>
        <p>마크다운 문법을 사용하여 공지를 자유롭게 꾸며보세요.</p>
      </header>
      
      {/* 원래 UI 섹션 및 폼 클래스 그대로 유지 */}
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
            <label>대표 이미지 첨부 (선택)</label>
            <input type="file" accept="image/*" onChange={handleFileChange} />
            {previewUrl && (
              <div className="image-preview" style={{ marginTop: "10px" }}>
                <img src={previewUrl} alt="미리보기" style={{ width: "200px", borderRadius: "8px" }} />
              </div>
            )}
          </div>

          <div className="input-group">
            <label>공지 상세 내용 (Markdown)</label>
            {/* 텍스트에어리어 대신 마크다운 에디터 배치 */}
            <div style={{ marginTop: "10px" }}>
              <MdEditor 
                style={{ height: "500px" }} 
                renderHTML={(text) => mdParser.render(text)} 
                onChange={handleEditorChange} 
                value={data.content}
                placeholder="내용을 작성하세요... (# 제목, **굵게** 등 사용 가능)"
              />
            </div>
          </div>

          {/* 원래 UI 버튼 스타일 그대로 유지 */}
          <button type="submit" className="btn-send" disabled={isSubmitting} style={{ marginTop: "20px" }}>
            {isSubmitting ? "등록 중..." : "게시판에 등록하기"}
          </button>
        </form>
      </section>
    </div>
  );
}