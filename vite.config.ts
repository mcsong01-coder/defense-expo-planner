/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';

// npm run build        → dist/ (Vercel 배포용)
// npm run build:single → dist-single/index.html 한 파일(미리보기·오프라인 공유용)
export default defineConfig(({ mode }) => ({
  plugins: mode === 'single' ? [react(), viteSingleFile()] : [react()],
  build: mode === 'single' ? { outDir: 'dist-single', chunkSizeWarningLimit: 4000 } : { outDir: 'dist' },
  test: { include: ['src/**/*.test.ts'] },
}));
