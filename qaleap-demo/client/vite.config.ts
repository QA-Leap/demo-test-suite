import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// Config is invoked from the repo root via `--config client/vite.config.ts`, so the
// client `root` must be set explicitly (otherwise Vite looks for index.html at cwd).
export default defineConfig({
  root: __dirname,
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:3000',
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
});
