import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import express from 'express';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/sitemap.xml': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      }
    }
  }
});
