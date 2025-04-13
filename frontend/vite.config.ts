import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    open: true,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
    // 添加historyApiFallback配置，确保所有路由都返回index.html
    historyApiFallback: true
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
  // 添加base配置，确保资源路径正确
  base: './'
})
