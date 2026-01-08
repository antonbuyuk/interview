import { defineConfig, type Plugin } from 'vite';
import vue from '@vitejs/plugin-vue';
import { fileURLToPath, URL } from 'node:url';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

// Base URL для GitHub Pages (имя репозитория)
// В production используем /interview/, в dev - /
const base = process.env.NODE_ENV === 'production' || process.env.CI ? '/interview/' : '/';

// Плагин для копирования index.html в 404.html после сборки
const copy404Plugin = (): Plugin => {
  let outDir = 'dist';

  return {
    name: 'copy-404',
    configResolved(config) {
      outDir = config.build.outDir || 'dist';
    },
    closeBundle() {
      const indexPath = join(outDir, 'index.html');
      const notFoundPath = join(outDir, '404.html');

      try {
        const indexContent = readFileSync(indexPath, 'utf-8');
        writeFileSync(notFoundPath, indexContent, 'utf-8');
        console.log('✓ Copied index.html to 404.html');
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.warn('Could not copy index.html to 404.html:', errorMessage);
      }
    },
  };
};

export default defineConfig({
  base,
  plugins: [vue(), copy404Plugin()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    host: '0.0.0.0', // Доступно по локальной сети
    port: 3000,
    open: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
  publicDir: 'public',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  },
});
