# 🖥️ Pi Manager - 라즈베리파이 원격 관리 대시보드

## 개요
웹사이트에서 라즈베리파이를 등록하고, 실시간으로 시스템 상태를 모니터링할 수 있는 대시보드.

---

## 구조

```
[파이 에이전트] → HTTP POST (stats) → [중앙 서버] ← WebSocket ← [웹 대시보드]
```

---

## 배포 환경
- 중앙 서버(Backend + Frontend + DB)는 **Docker + docker-compose**로 운영
- 서비스 구성:
  ```
  docker-compose
  ├── frontend   (React, Nginx)
  ├── backend    (Spring Boot)
  ├── db         (MariaDB)
  └── redis      (세션/캐시)
  ```
- 파이 에이전트는 파이 로컬에서 systemd 서비스로 실행 (도커 불필요)

---

## 컴포넌트

### 1. 파이 에이전트 (Pi Agent)
- 파이에서 백그라운드로 실행되는 경량 스크립트
- 주기적으로 시스템 정보를 수집해 중앙 서버에 전송
- **수집 데이터:**
  - CPU 사용률 / 온도
  - 메모리 사용량
  - 디스크 사용량
  - 업타임
  - 실행 중인 서비스 상태
- **구현:** Python (`psutil`) 또는 bash
- **전송 주기:** 5초 ~ 30초 (설정 가능)

### 2. 중앙 서버 (Backend)
- 파이 등록 및 토큰 관리
- stats 수신 및 DB 저장
- 웹 대시보드에 WebSocket으로 실시간 데이터 전달
- **스택:** Spring Boot / Node.js
- **DB:** MariaDB (파이 목록, 토큰, stats 이력)

### 3. 웹 대시보드 (Frontend)
- 등록된 파이 목록 및 상태 카드
- 실시간 CPU/메모리/디스크 그래프
- 서비스 상태 표시 (active / inactive / failed)
- **스택:** React + Chart.js

---

## 파이 등록 흐름

```
1. 웹 대시보드에서 파이 이름 입력
2. 서버에서 고유 토큰 발급
3. 파이에서 에이전트 설치 스크립트 실행 (토큰 입력)
4. 에이전트가 토큰으로 서버에 등록 요청
5. 대시보드에서 실시간 stats 확인 가능
```

---

## API 설계

| Method | Endpoint | 설명 |
|--------|----------|------|
| POST | `/api/pi/register` | 파이 등록 (토큰 발급) |
| POST | `/api/pi/stats` | stats 전송 (에이전트 → 서버) |
| GET | `/api/pi/list` | 등록된 파이 목록 조회 |
| GET | `/api/pi/{id}/stats` | 특정 파이 stats 조회 |
| DELETE | `/api/pi/{id}` | 파이 등록 해제 |

---

## 에이전트 설치 (예시)

```bash
curl -s https://pi-manager.example.com/install.sh | bash -s -- --token YOUR_TOKEN
```

---

## 향후 기능
- [ ] 서비스 원격 시작/중지
- [ ] 알림 설정 (CPU 90% 초과 시 디스코드 알림 등)
- [ ] stats 이력 그래프 (시간대별)
- [ ] 다중 파이 비교 뷰
- [ ] SSH 웹 터미널
