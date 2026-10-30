import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  root: 'src/frontend',
  build: { outDir: '../../dist/web', emptyOutDir: true },
  server: {
    proxy: { '/api': 'http://localhost:3001' },
  },
});