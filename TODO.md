# TODO

## ✅ 완료
- [x] `.jsx` → `.tsx` 전체 마이그레이션
- [x] `tsconfig.json` strict 모드 활성화 (에러 0개)
- [x] `src/types/index.ts` 공통 인터페이스 정의
- [x] 보안 — XSS 방어 CSP 헤더 (nginx)
- [x] 보안 — 프로덕션 console.log 제거 (vite esbuild.drop)
- [x] 기기 IP 제거 (Chrome mDNS 차단으로 감지 불가)
- [x] 어드민 URL 라우팅 (`/admin/:menu`) — 뒤로가기/앞으로가기 지원

---

## 🏗️ 인프라 (급함)

- [ ] **nginx 자동 시작** — `sudo systemctl enable nginx`
- [ ] **백엔드 자동 시작** — `systemd` 서비스 등록 (재부팅해도 Spring Boot JAR 자동 실행)
- [ ] **배포 스크립트 개선** — `bssmupdate.sh` git stash 자동 처리

---

## ✨ 기능 추가

### 학교 홈페이지 크롤링
> URL 패턴: `https://school.busanedu.net/bssm-h/na/ntt/selectNttList.do?mi=XXX&bbsId=XXX`

- [ ] **공지사항** — `mi=1019343&bbsId=5095183` 크롤링 (제목·날짜·링크)
- [ ] **가정통신문** — `mi=1040045&bbsId=5156418` 크롤링
- [ ] **크롤링 캐시** — 1시간 단위 (Spring or FastAPI)
- [ ] **프론트 페이지** — 학교 공지 + 가정통신문 탭 UI

### 기타 기능
- [ ] **다크모드 수동 토글** — 현재는 시스템 설정만 따라감
- [ ] **알레르기 필터** — 설정한 알레르기 항목 있는 메뉴 강조/숨기기
- [ ] **JWT 자동 갱신** — 만료 시 자동 재로그인 or Refresh Token
- [ ] **접속 이력 필터** — 기간 필터 추가 (오늘 / 이번 주 / 전체)
- [ ] **관리자 신고 알림** — 새 신고 접수 시 FCM 푸시

---

## 🔁 마이그레이션

> 백엔드 관련 TODO는 `BSSMMEALALERT_bakcend/TODO.md` 참고

- [ ] **httpOnly Cookie 전환** — 백엔드 쿠키 발급 시 프론트 토큰 저장 방식 변경 필요

---

## 🛠️ 코드 품질
- [ ] **React Query 도입** — Axios + useState 조합을 캐싱/자동갱신으로 교체
- [ ] **에러 바운더리** 추가
