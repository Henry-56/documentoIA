import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    plugins: [react()],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY || '')
    },
    build: {
      outDir: 'dist',
      sourcemap: false, // No incluir sourcemaps en producción por seguridad
      minify: 'esbuild', // Usar esbuild (más rápido y compatible)
      rollupOptions: {
        output: {
          manualChunks: {
            'react-vendor': ['react', 'react-dom'],
            'db-vendor': ['dexie', 'dexie-react-hooks'],
            'gemini-vendor': ['@google/genai']
          }
        }
      }
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    }
  };
});
