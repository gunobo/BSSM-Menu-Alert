#!/bin/sh
# Docker 컨테이너 상태 변화 감지 → Discord 알림

apk add --no-cache curl docker-cli > /dev/null 2>&1

send_discord() {
  local message="$1"
  curl -s -X POST "$DISCORD_WEBHOOK" \
    -H "Content-Type: application/json" \
    -d "{\"content\": \"$message\"}"
}

echo "👀 Docker 이벤트 감시 시작..."

docker events \
  --filter "container=bssm_frontend" \
  --filter "container=bssm_backend" \
  --filter "event=start" \
  --filter "event=stop" \
  --filter "event=die" \
  --filter "event=kill" \
  --format "{{.Actor.Attributes.name}} {{.Action}}" \
| while read container action; do
    case "$container" in
      bssm_frontend) label="🖥️ 프론트엔드" ;;
      bssm_backend)  label="⚙️ 백엔드" ;;
      *)             label="$container" ;;
    esac

    case "$action" in
      start) send_discord "<@945179735003127851> ✅ **[$label]** 서버가 시작되었습니다." ;;
      stop)  send_discord "<@945179735003127851> 🔴 **[$label]** 서버가 중지되었습니다." ;;
      die)   send_discord "<@945179735003127851> 💀 **[$label]** 서버가 예기치 않게 종료되었습니다!" ;;
      kill)  send_discord "<@945179735003127851> ⚠️ **[$label]** 서버가 강제 종료되었습니다." ;;
    esac
  done
