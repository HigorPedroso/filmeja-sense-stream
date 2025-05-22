import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'sitemap-handler',
      configureServer(server) {
        server.middlewares.use('/sitemap.xml', (req, res, next) => {
          res.writeHead(301, { Location: '/sitemap' });
          res.end();
        });
      }
    }
  ]
});
