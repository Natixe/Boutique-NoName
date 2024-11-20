// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// vite.config.js
export default defineConfig({
  plugins: [react()],
  base: "/",
  server: {
    host: '0.0.0.0',
    port: 5173, // Port du serveur Vite
    fs: {
      cachedChecks: false
    },
    proxy: {
      '/api': {
        target: 'http://localhost:8888', // Port du serveur Express
        changeOrigin: true,
        secure: false,
      },
    },
  },
  preview: {
    port: 5173, // Port pour vite preview
  },
  resolve: {
    alias: {
      '@': './src', //  Définit un alias pour le répertoire src, permettant d'importer des modules plus facilement
    },
  },
  build: {
    outDir: 'dist', // Répertoire de sortie
  },
});