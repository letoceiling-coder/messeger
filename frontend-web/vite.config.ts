import { defineConfig, Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { resolve } from 'path'

// Плагин для вставки BUILD_ID в sw.js и index.html
const buildVersionPlugin = (): Plugin => {
  const buildId = `v${Date.now()}`;
  
  return {
    name: 'build-version',
    transformIndexHtml(html) {
      // Добавляем мета-тег с версией сборки
      return html.replace(
        '<meta http-equiv="Expires" content="0" />',
        `<meta http-equiv="Expires" content="0" />\n    <meta name="build-version" content="${buildId}" />`
      );
    },
    closeBundle() {
      // Обрабатываем sw.js после копирования из public/
      try {
        const swPath = resolve(process.cwd(), 'dist/sw.js');
        if (existsSync(swPath)) {
          let swContent = readFileSync(swPath, 'utf-8');
          swContent = swContent.replace(/__BUILD_ID__/g, buildId);
          writeFileSync(swPath, swContent);
          console.log(`✅ Build version injected: ${buildId}`);
        }
      } catch (e) {
        console.error('Failed to process sw.js:', e);
      }
    }
  };
};

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), buildVersionPlugin()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
  build: {
    // Добавляем timestamp к именам файлов для обхода кеша
    rollupOptions: {
      output: {
        // Имена файлов с хешем контента (уже есть по умолчанию)
        entryFileNames: `assets/[name]-[hash].js`,
        chunkFileNames: `assets/[name]-[hash].js`,
        assetFileNames: `assets/[name]-[hash].[ext]`
      }
    },
    // Очищаем dist перед каждой сборкой
    emptyOutDir: true,
  },
})
