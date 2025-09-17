import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'fix-viem-sourcemaps',
      configureServer(server) {
        server.middlewares.use('/node_modules', (req, res, next) => {
          if (req.url && req.url.includes('viem/_esm/') && req.url.endsWith('.js.map')) {
            res.statusCode = 404;
            res.end('Not found');
            return;
          }
          next();
        });
      }
    }
  ],
  server: {
    host: '0.0.0.0',
    port: Number(process.env.PORT) || 5000,
    strictPort: true,
    allowedHosts: true,
    hmr: false
  },
  define: {
    global: 'globalThis',
  },
  build: {
    sourcemap: false
  }
})