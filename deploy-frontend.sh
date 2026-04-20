#!/bin/bash
# 프론트엔드 배포 스크립트
# 사용법: ~/bssmMenu/BSSM-Menu-Alert 폴더에서 실행

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
FRONTEND_DIR="$HOME/frontend"

echo "📦 최신 코드 가져오는 중..."
cd "$SCRIPT_DIR"
git pull

echo "🔨 빌드 중..."
npm ci --silent
npm run build

echo "🚀 배포 중..."
rm -rf "$FRONTEND_DIR"/*
cp -r "$SCRIPT_DIR/dist/"* "$FRONTEND_DIR/"

echo "✅ 배포 완료!"
