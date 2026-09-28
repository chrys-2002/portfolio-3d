/*
 * details.js — Les petits détails animés qui rendent la scène vivante :
 * le carnet qui s'ouvre et le café qui ondule.
 */
import gsap from 'gsap'

/* ========== LE CARNET QUI S'OUVRE ========== */
export function createNotebookAnimation({ cover, pages }) {
  // Une timeline "en pause" : on la jouera en avant (ouvrir) ou en arrière (fermer)
  const timeline = gsap.timeline({ paused: true, defaults: { ease: 'power2.inOut' } })

  // 1. La couverture pivote sur la reliure et se pose à gauche (presque 180°)
  timeline.to(cover.rotation, { z: Math.PI - 0.04, duration: 1.1 }, 0)

  // 2. Les pages suivent, l'une après l'autre (décalage de 0,15 s)
  //    Chaque page s'arrête un peu plus haut que la précédente pour former une pile
  pages.forEach((page, i) => {
    timeline.to(page.rotation, { z: Math.PI - 0.07 - i * 0.015, duration: 0.8 }, 0.35 + i * 0.15)
  })

  return {
    open: () => timeline.timeScale(1).play(),
    close: () => timeline.timeScale(1.6).reverse(), // on referme un peu plus vite
  }
}

/* ========== LE CAFÉ QUI ONDULE ========== */
export function createCoffeeRipples(coffee) {
  const geometry = coffee.geometry
  const positions = geometry.attributes.position
  const count = positions.count

  // On mémorise la distance au centre de chaque sommet (elle ne change jamais)
  const radii = new Float32Array(count)
  for (let i = 0; i < count; i++) {
    radii[i] = Math.hypot(positions.getX(i), positions.getY(i))
  }

  const ripples = [] // les ondes en cours : chacune a son heure de départ
  let currentTime = 0 // mis à jour à chaque image par update()
  const WAVE_SPEED = 0.12 // vitesse de propagation (unités par seconde)
  const WAVE_NUMBER = 180 // nombre de vagues par unité de distance (vagues serrées)
  const AMPLITUDE = 0.004 // hauteur des vagues : 4 mm
  const LIFETIME = 3 // durée de vie d'une onde en secondes

  // Une goutte tombe au centre : on ajoute une onde qui part "maintenant"
  function splash() {
    ripples.push({ start: currentTime })
  }

  function update(time) {
    currentTime = time
    // On oublie les ondes trop vieilles
    while (ripples.length > 0 && time - ripples[0].start > LIFETIME) ripples.shift()

    for (let i = 0; i < count; i++) {
      const r = radii[i]

      // Toujours un léger frémissement : un liquide n'est jamais parfaitement immobile
      let height = Math.sin(r * 90 - time * 2) * 0.0003

      for (const ripple of ripples) {
        const age = time - ripple.start
        const front = age * WAVE_SPEED // jusqu'où l'onde est arrivée
        if (r > front) continue // l'onde n'a pas encore atteint ce point

        const fade = Math.exp(-age * 1.4) // l'onde s'affaiblit avec le temps
        const behindFront = Math.exp(-(front - r) * 25) // plus forte près du front
        height += Math.sin((front - r) * WAVE_NUMBER) * AMPLITUDE * fade * behindFront
      }

      // Le disque est dessiné dans le plan XY : la hauteur est donc sur Z
      positions.setZ(i, height)
    }

    positions.needsUpdate = true
    geometry.computeVertexNormals() // recalcule l'orientation de la surface pour les reflets
  }

  return { splash, update }
}
