// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// vite.config.js
export default defineConfig({
  plugins: [react()],
  server: {
    fs: {
      cachedChecks: false
    },
    port: 5173, // Port du serveur Vite
    proxy: {
      '/api': {
        target: 'http://localhost:8888', // Port du serveur Express
        changeOrigin: true,
        secure: false,
      },
    },
  },
  resolve: {
    alias: {
      '@': '/src', //  Définit un alias pour le répertoire src, permettant d'importer des modules plus facilement
    },
  },
});