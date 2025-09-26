import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
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
    sourcemap: false,
    chunkSizeWarningLimit: 3000,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          wallet: ['@privy-io/react-auth', 'ethers']
        }
      }
    }
  },
  resolve: {
    dedupe: ['react', 'react-dom', 'styled-components'],
    alias: {
      '@assets': new URL('./attached_assets', import.meta.url).pathname
    }
  }
})