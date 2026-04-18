# BSSM 급식 알리미 — 프론트엔드

부산소프트웨어마이스터고등학교 급식 조회, 시간표 확인, 푸시 알림을 제공하는 웹 앱입니다.  
React 19 + Vite 7 SPA 구조이며 안드로이드 WebView 앱과 함께 동작합니다.

---

## 기술 스택

| 분류 | 사용 기술 |
|------|----------|
| 프레임워크 | React 19, Vite 7 |
| 라우팅 | React Router DOM v7 |
| HTTP | Axios |
| 차트 | Chart.js, react-chartjs-2 |
| 인증 | Google OAuth (`@react-oauth/google`) + JWT |
| 푸시 알림 | Firebase Cloud Messaging (웹) |
| NEIS 연동 | NEIS Open API (급식, 시간표) |
| 마크다운 | react-markdown, react-markdown-editor-lite |
| 스타일 | 순수 CSS (모듈별 분리) |

---

## 주요 기능

### 학생 페이지
- **급식 조회** — NEIS API로 날짜별 급식 메뉴 조회, 알레르기 정보 파싱
- **좋아요 / 댓글** — 메뉴별 반응 및 댓글 작성
- **시간표** — NEIS API로 학년·반별 주간 시간표 조회
- **공지사항** — 학교 공지 목록 및 상세 보기
- **푸시 알림** — 급식 알림 수신 설정 (FCM)

### 관리자 페이지 (`/admin`)
| 메뉴 | 설명 |
|------|------|
| 대시보드 | 사용자 수, 좋아요, 신고 통계, 주간 차트 |
| 유저 관리 | 전체 유저 목록, 검색, 권한 관리 |
| 댓글 관리 | 전체 댓글 조회 및 삭제 |
| 푸시 알림 | 전체 알림 전송, 발송 통계 |
| 공지 관리 | 공지사항 작성 · 수정 · 삭제 |
| 기본 시간표 | 학년·반별 시간표 설정 (NEIS 드롭다운, 변경 이력) |
| 앱 관리 | APK 업로드 및 다운로드 통계 |

---

## 프로젝트 구조

```
src/
├── api/
│   ├── auth.js              # JWT 토큰 관리, 유저 정보 조회
│   ├── axiosConfig.js       # Axios 기본 설정
│   ├── NeisApi.js           # NEIS 급식·시간표·과목 API
│   ├── timetableApi.js      # 기본 시간표 REST API (Spring Boot)
│   └── admin.js             # 관리자 API
├── pages/
│   ├── Home.jsx             # 급식 메인 페이지
│   ├── Timetable.jsx        # 시간표 조회
│   ├── Login.jsx            # Google OAuth 로그인
│   ├── MyPage.jsx           # 마이페이지
│   ├── Announcements.jsx    # 공지사항 목록
│   ├── AppDownload.jsx      # 앱 다운로드
│   ├── AdminPage.jsx        # 관리자 레이아웃 (사이드바)
│   └── admin/
│       ├── AdminDashboard.jsx
│       ├── TimetableManager.jsx
│       ├── UserManagement.jsx
│       ├── PushNotificationManager.jsx
│       └── ...
├── styles/
│   ├── home.css
│   ├── admin.css
│   └── auth.css
├── firebase-config.js       # FCM 초기화 (Firestore 미사용)
└── App.jsx
```

---

## 환경변수 설정

`.env` 파일을 프로젝트 루트에 생성합니다.

```env
# Spring Boot 백엔드
VITE_API_URL=http://localhost:8080/api
VITE_BASE_URL=http://localhost:8080

# NEIS Open API (급식·시간표 공통)
VITE_REACT_APP_NEIS_API_KEY=your_neis_api_key

# Firebase (FCM 푸시 알림 전용 — Firestore 미사용)
VITE_FIREBASE_API_KEY=your_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FCM_VAPID_KEY=your_vapid_key
```

> NEIS API 키는 [NEIS Open API](https://open.neis.go.kr) 에서 발급받습니다.  
> Firebase 설정값은 Firebase Console → 프로젝트 설정에서 확인합니다.

---

## 시작하기

```bash
# 의존성 설치
npm install

# 개발 서버 실행 (http://localhost:5173)
npm run dev

# 프로덕션 빌드
npm run build
```

---

## 인증 흐름

```
1. 사용자가 Google 로그인 버튼 클릭
2. Google ID 토큰 → Spring Boot /auth/google 전송
3. 서버가 JWT 발급 → localStorage에 accessToken 저장
4. 이후 모든 API 요청에 Authorization: Bearer {token} 헤더 포함
```

안드로이드 앱 환경에서는 `window.Android.googleLogin()` 네이티브 인터페이스를 통해 동일한 흐름으로 처리됩니다.

---

## 관리자 권한

| 권한 | 접근 가능 메뉴 |
|------|--------------|
| `ROLE_ADMIN` | 전체 메뉴 |
| `ROLE_MODERATOR` | 대시보드, 댓글, 알림, 공지, 시간표 |
| `ROLE_USER` | 관리자 페이지 접근 불가 |
