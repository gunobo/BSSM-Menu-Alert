# ─── Stage 1: Build ──────────────────────────────────────────
FROM node:22-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
# .env 파일이 프로젝트에 있으면 자동으로 포함됨
RUN npm run build

# ─── Stage 2: Serve ──────────────────────────────────────────
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html

# SPA 라우팅을 위한 nginx 설정 (React Router 지원)
RUN echo 'server { \
    listen 80; \
    root /usr/share/nginx/html; \
    index index.html; \
    location / { \
        try_files $uri $uri/ /index.html; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80
