import { sentryVitePlugin } from "@sentry/vite-plugin";
// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import dotenv from 'dotenv';

dotenv.config();
// vite.config.js
export default defineConfig({
  plugins: [react(), sentryVitePlugin({
    org: "freepbyh",
    project: "javascript-react"
  })],
  base: "/",
  server: {
    host: '0.0.0.0',
    port: 3000, // Port du serveur Vite
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
  resolve: {
    alias: {
      '@': './src', //  Définit un alias pour le répertoire src, permettant d'importer des modules plus facilement
    },
  },
  build: {
    // Répertoire de sortie
    outDir: 'dist',

    sourcemap: true
  },
});