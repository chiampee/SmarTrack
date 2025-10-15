import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  base: './',
  build: {
    outDir: 'dist-extension',
    rollupOptions: {
      input: {
        popup: resolve(__dirname, 'extension/popup.html'),
        background: resolve(__dirname, 'extension/background.js'),
        contentScript: resolve(__dirname, 'extension/contentScript.js'),
      },
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: '[name].js',
        assetFileNames: '[name].[ext]',
      },
    },
  },
  define: {
    'process.env.NODE_ENV': '"production"',
  },
}); 