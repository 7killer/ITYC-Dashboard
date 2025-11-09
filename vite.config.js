import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';


export default defineConfig(({ mode }) => ({
  base: '',
 /* plugins: [
    react(),
  ],*/
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@background': path.resolve(__dirname, 'src/background'),
      '@webapp': path.resolve(__dirname, 'src/dashboard')

    }
  },
  build: {
    minify: mode === 'production',
    sourcemap: mode !== 'production',
    rollupOptions: {
      input: {
          app: "/dashboard.html",
          worker: 'src/background/worker.js',
          offscreen: 'src/offscreen/offscreen.html'
        // Points d'entrée multiples avec chemins absolus

      },
      output: {
        // Modification des noms de fichiers de sortie
        entryFileNames: (chunkInfo) => {
          if (chunkInfo.name === 'worker') return 'assets/background.js';
        //  if (chunkInfo.name === 'app') return 'dashboard.html';
        //  if (chunkInfo.name === 'contentScriptIframe') return 'contentScriptIframe.js';
          return 'assets/[name].js';
        },
        //chunkFileNames: 'assets/[name]-[hash].js',
        //assetFileNames: 'assets/[name].[ext]'
      }
    }
  },
  server: {
    port: 5173,
    strictPort: true,
    hmr: {
      port: 5173,
//      overlay: false,
    },
/*    fs: {
      strict: false,
    },
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
      'Access-Control-Allow-Headers': 'X-Requested-With, Content-Type, Authorization',
      'Access-Control-Allow-Private-Network': 'true',
    },*/
  },
 /* optimizeDeps: {
    include: ['yup'],
  }*/
}));