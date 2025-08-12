import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    host: 'localhost',
    strictPort: true,
    hmr: {
      overlay: false,
      port: 5174,
      host: 'localhost',
      protocol: 'ws',
    },
    watch: {
      usePolling: false,
      ignored: ['**/extension/**', '**/dist-extension/**', '**/node_modules/**', '**/.git/**'],
    },
  },
  build: {
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
        },
      },
    },
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom'],
  },
});
