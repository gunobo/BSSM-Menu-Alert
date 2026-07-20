import { useState } from "react";
import axios from "axios"; 
import "../../styles/AppFileManager.css";

export default function AppFileManager() {
  const [file, setFile] = useState(null);
  const [type, setType] = useState("apk");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleUpload = async () => {
    if (!file) return alert("업로드할 파일을 선택해주세요.");
    
    const formData = new FormData();
    formData.append("file", file);
    formData.append("type", type);

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // ✅ 로컬 스토리지에서 관리자 토큰 추출
      const token = sessionStorage.getItem("accessToken");

      // ✅ 헤더에 Authorization 추가 (Bearer 토큰)
      await axios.post("/api/admin/app/upload", formData, {
        headers: { 
          "Content-Type": "multipart/form-data",
          "Authorization": `Bearer ${token}` // 이 줄이 403 에러를 해결하는 핵심입니다.
        },
        timeout: 0, 
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          setUploadProgress(percentCompleted);
        },
      });

      alert(`${type.toUpperCase()} 파일이 성공적으로 교체되었습니다!`);
      setFile(null);
      // 파일 input 초기화를 위해 수동 조작이 필요할 수 있습니다.
      (document.getElementById("appFile") as HTMLInputElement).value = "";
      setUploadProgress(0);
    } catch (err) {
      console.error("업로드 실패 상세:", err.response || err);
      // 403 에러 발생 시 더 구체적인 메시지 출력
      if (err.response?.status === 403) {
        alert("권한이 없거나 로그인이 만료되었습니다. 다시 로그인해주세요.");
      } else {
        alert("업로드 중 오류가 발생했습니다. (파일 용량 혹은 네트워크 확인)");
      }
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="admin-container app-management-page">
      <section className="search-header-section">
        <div className="section-title-area">
          <h3>설치 파일 업데이트</h3>
          <p>새로운 APK 또는 IPA 파일을 업로드하면 사용자 다운로드 링크가 즉시 갱신됩니다.</p>
        </div>
        
        <div className="search-input-group app-upload-form">
          <select 
            className="admin-input-premium select-type" 
            value={type}
            onChange={(e) => {
                setType(e.target.value);
                setFile(null);
                (document.getElementById("appFile") as HTMLInputElement).value = "";
            }}
          >
            <option value="apk">Android (APK)</option>
            <option value="ipa">iOS (IPA)</option>
          </select>

          <div className="file-input-wrapper">
            <input 
              type="file" 
              id="appFile"
              className="admin-input-premium"
              accept={type === "apk" ? ".apk" : ".ipa"}
              onChange={(e) => setFile(e.target.files[0])}
            />
          </div>

          <button 
            className={`nav-btn btn-push-submit ${isUploading ? 'loading' : ''}`} 
            onClick={handleUpload}
            disabled={isUploading}
          >
            {isUploading ? "업로드 중..." : "🚀 서버 전송"}
          </button>
        </div>

        {isUploading && (
          <div className="upload-progress-container" style={{ width: '100%', marginTop: '20px' }}>
            <div className="progress-text" style={{ marginBottom: '8px', fontSize: '14px', fontWeight: 'bold', color: '#6366f1' }}>
              서버로 전송 중... {uploadProgress}%
            </div>
            <div className="progress-bar-bg" style={{ width: '100%', height: '12px', backgroundColor: '#e2e8f0', borderRadius: '6px', overflow: 'hidden' }}>
              <div 
                className="progress-bar-fill" 
                style={{ 
                  width: `${uploadProgress}%`, 
                  height: '100%', 
                  backgroundColor: '#6366f1', 
                  transition: 'width 0.3s ease-out' 
                }} 
              />
            </div>
          </div>
        )}
      </section>

      <div className="dashboard-middle-row">
        <div className="admin-table-wrapper">
          <h4>파일 배포 규칙</h4>
          <table className="admin-table">
            <thead>
              <tr>
                <th>플랫폼</th>
                <th>대상 확장자</th>
                <th>저장 위치 (서버)</th>
                <th>상태</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Android</strong></td>
                <td>.apk</td>
                <td><code>/uploads/apk/</code></td>
                <td><span className="badge success">활성화</span></td>
              </tr>
              <tr>
                <td><strong>iOS (iPhone)</strong></td>
                <td>.ipa</td>
                <td><code>/uploads/ipa/</code></td>
                <td><span className="badge success">활성화</span></td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="user-detail-panel">
          <div className="profile-card">
            <span className="badge danger">주의사항</span>
            <p style={{fontSize: '13px', color: '#666', marginTop: '10px', lineHeight: '1.6'}}>
              1. 파일명은 서버에서 자동으로 <strong>BSSM_Meal_Latest</strong>로 변경됩니다.<br/>
              2. 덮어쓰기 방식으로 저장되므로 백업에 주의하세요.<br/>
              3. 용량이 큰 경우 네트워크 환경에 따라 시간이 걸릴 수 있습니다.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}