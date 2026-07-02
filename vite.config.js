import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  // 환경변수 로드 (VITE_ 로 시작하는 변수들)
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],
    build: {
      minify: 'esbuild',
      target: 'esnext',
    },
    esbuild: {
      drop: mode === 'production' ? ['console', 'debugger'] : [],
    },
    server: {
      headers: {
        "Cross-Origin-Opener-Policy": "same-origin-allow-popups",
        "Cross-Origin-Embedder-Policy": "unsafe-none",
      },
      // 🚨 이 프록시 설정이 없어서 에러가 났던 것입니다!
      proxy: {
        '/api': {
          // 환경변수에 저장된 백엔드 주소 사용, 없으면 기본값 사용
          target: env.VITE_API_URL || 'http://localhost:8080',
          changeOrigin: true,
        }
      }
    }
  }
})