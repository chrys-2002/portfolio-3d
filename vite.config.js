/*
 * vite.config.js — Configuration de Vite.
 * Vite lit ce fichier automatiquement au démarrage de "npm run dev" et de "npm run build".
 */
import { defineConfig } from 'vite'
import { fileURLToPath } from 'node:url'

// Transforme un chemin relatif à CE fichier en chemin absolu sur le disque
const page = (file) => fileURLToPath(new URL(file, import.meta.url))

export default defineConfig({
  build: {
    rolldownOptions: {
      // Par défaut, Vite ne construit que index.html.
      // On lui liste TOUTES les pages du site pour qu'il les construise.
      input: {
        main: page('index.html'), // l'atelier : page d'accueil
        noeud: page('noeud-dore.html'), // l'ancienne scène, gardée en bonus
      },
    },
  },
})
