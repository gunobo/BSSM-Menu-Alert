# 방학 TODO

## 🔁 마이그레이션

### 프론트엔드 → TypeScript (TSX)
- [ ] `tsconfig.json` 설정 및 Vite TypeScript 플러그인 추가
- [ ] `.jsx` → `.tsx` 전환 (컴포넌트별 순서대로)
- [ ] API 응답 타입 정의 (`src/types/` 디렉토리)
  - [ ] `User`, `LoginHistory`, `MealMenu`, `Timetable`, `AdminStats` 등
- [ ] `auth.js` → `auth.ts` (토큰 관련 함수 타입 추가)
- [ ] Axios 인스턴스 타입 제네릭 적용
- [ ] Props 타입 정의 (각 컴포넌트 인터페이스)
- [ ] `any` 없애기 (ESLint `@typescript-eslint/no-explicit-any` 규칙 적용)

### 백엔드 → FastAPI (Python)
- [ ] 프로젝트 초기 세팅 (`pyproject.toml` / `uv` 패키지 매니저)
- [ ] DB 연결 — SQLAlchemy 2.x + Alembic 마이그레이션
- [ ] 인증 — Google ID 토큰 검증 (`google-auth` 라이브러리) + JWT 발급 (`python-jose`)
- [ ] 기존 엔드포인트 포팅
  - [ ] `POST /auth/google`
  - [ ] `GET /user/me`, `POST /user/update-info`
  - [ ] NEIS API 프록시 (급식, 시간표)
  - [ ] 관리자 API (`/admin/*`)
  - [ ] FCM 푸시 알림 (`firebase-admin` Python SDK)
- [ ] Pydantic 스키마로 요청/응답 타입 정의
- [ ] 기존 MySQL 스키마 그대로 유지 (Alembic으로 마이그레이션)
- [ ] 서버 배포 — `uvicorn` + `systemd` 서비스 등록 (현재 JAR 대체)

---

## ✨ 기능 개선

### 학교 홈페이지 크롤링 (FastAPI 전환 시 같이 구현)
> URL 패턴: `https://school.busanedu.net/bssm-h/na/ntt/selectNttList.do?mi=XXX&bbsId=XXX`  
> `requests` + `BeautifulSoup` 로 파싱, 공개 페이지라 로그인 불필요

- [ ] **공지사항 크롤링** — `mi=1019343&bbsId=5095183` / 제목·날짜·링크 추출
- [ ] **가정통신문 크롤링** — `mi=1040045&bbsId=5156418` (학부모마당) / 동일 파싱
- [ ] **크롤링 캐시** — 1시간 단위 캐싱 (과도한 요청 방지)
- [ ] **프론트 공지 페이지** — 학교 공지 + 가정통신문 탭 UI, 상세 링크 연결
---

- [ ] **다크모드 토글** — 현재 시스템 설정 따라가는데 수동 전환 버튼 추가
- [ ] **급식 즐겨찾기** — 특정 메뉴 즐겨찾기 / 알레르기 필터 저장
- [ ] **JWT 자동 갱신** — 만료 시 자동 재로그인 or Refresh Token 도입
- [ ] **접속 이력 페이지** — 기간 필터 추가 (오늘 / 이번 주 / 전체)
- [ ] **관리자 알림** — 새 신고 접수 시 관리자에게 FCM 푸시

---

## 🛠️ 코드 품질

- [ ] **컴포넌트 분리** — `AdminPage.jsx` 하나에 너무 많은 로직 → 각 기능별 분리
- [ ] **React Query 도입** — Axios + `useState` 조합을 캐싱/자동갱신 지원으로 교체
- [ ] **에러 바운더리** 추가 — 페이지 단위 에러 처리
- [ ] **ESLint + Prettier** 설정 정비 (TypeScript 전환 후)
- [ ] **httpOnly Cookie** 전환 — sessionStorage JWT → 백엔드 쿠키 발급으로 XSS 원천 차단 (FastAPI 전환 시 같이)

---

## 🏗️ 인프라

- [ ] **nginx 자동 시작** — `sudo systemctl enable nginx` 서버 재부팅 시 자동 실행
- [ ] **백엔드 자동 시작** — `systemd` 서비스 등록 (재부팅해도 자동 실행)
- [ ] **배포 스크립트 개선** — `bssmupdate.sh` git stash 자동 처리 추가
- [ ] **GitHub Actions CI** — push 시 자동 빌드 검증
