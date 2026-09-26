/*
 * vite.config.js — Configuration de Vite.
 * Vite lit ce fichier automatiquement au démarrage de "npm run dev".
 */
import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    // Page ouverte par la touche "o" (et par "npm run dev -- --open")
    open: '/atelier.html',
  },
})
