import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// DataMind 开放平台 — 部署到 https://luck14150.github.io/audiobook-app/
// 关键点：
//   1. base = '/audiobook-app/' 确保所有资源引用是绝对路径（避免子路径歧义）
//   2. HashRouter（#/路由） 确保任何静态托管都不会 404
//   3. .nojekyll + 404.html 防止 GitHub 的 Jekyll 处理影响

export default defineConfig({
  plugins: [react()],
  base: '/audiobook-app/',
  server: {
    port: 5175,
    host: '0.0.0.0',
    open: false,
    historyApiFallback: true,
  },
  preview: {
    port: 4173,
    host: '0.0.0.0',
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    chunkSizeWarningLimit: 2000,
  },
})
