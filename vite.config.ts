import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import sitemapMiddleware from './server/sitemap';

export default defineConfig({
  plugins: [react()],
  server: {
    middleware: [
      sitemapMiddleware
    ]
  }
});
