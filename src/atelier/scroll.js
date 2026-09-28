/*
 * scroll.js — Scroll fluide et inertiel avec Lenis.
 * Lenis remplace le défilement "par crans" de la molette par un
 * mouvement continu qui accélère et ralentit en douceur.
 */
import Lenis from 'lenis'
import 'lenis/dist/lenis.css'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

export function createSmoothScroll() {
  const lenis = new Lenis({
    lerp: 0.065, // douceur : plus c'est petit, plus le scroll "glisse"
    wheelMultiplier: 0.8, // sensibilité de la molette : un peu moins que la normale
  })

  // 1. À chaque mouvement de Lenis, ScrollTrigger recalcule ses animations
  lenis.on('scroll', ScrollTrigger.update)

  // 2. Lenis avance au même rythme que GSAP (une seule horloge pour tout)
  gsap.ticker.add((time) => {
    lenis.raf(time * 1000) // GSAP donne des secondes, Lenis attend des millisecondes
  })

  // 3. On désactive le "rattrapage" de GSAP après un ralentissement,
  //    sinon scroll et animations se désynchroniseraient
  gsap.ticker.lagSmoothing(0)

  return lenis
}
