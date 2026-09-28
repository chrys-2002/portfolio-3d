/*
 * card.js — La carte de visite 3D.
 * Elle sort du téléphone quand on arrive sur la section Contact.
 * On la retourne d'un clic (ou d'un tap), ou on la fait tourner en la glissant.
 */
import * as THREE from 'three'
import gsap from 'gsap'

const GOLD = '#d4af37'
const WIDTH = 1024 // taille des images de la carte (proportions d'une carte : 85 x 55 mm)
const HEIGHT = 662

/* ========== LE RECTO ========== */
function drawFront(ctx, qrImage) {
  // Fond noir légèrement dégradé
  const gradient = ctx.createLinearGradient(0, 0, WIDTH, HEIGHT)
  gradient.addColorStop(0, '#17171c')
  gradient.addColorStop(1, '#050507')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, WIDTH, HEIGHT)

  // Filet doré
  ctx.strokeStyle = GOLD
  ctx.lineWidth = 3
  ctx.strokeRect(26, 26, WIDTH - 52, HEIGHT - 52)

  // Logo "BiChrys" en Syne : "Bi" en blanc, "Chrys" en or
  ctx.font = '800 54px Syne, sans-serif'
  ctx.fillStyle = '#f2f2f2'
  ctx.fillText('Bi', 72, 132)
  ctx.fillStyle = GOLD
  ctx.fillText('Chrys', 72 + ctx.measureText('Bi').width, 132)

  // Nom et titre
  ctx.fillStyle = '#f2f2f2'
  ctx.font = '800 40px Syne, sans-serif'
  ctx.fillText('BOLI BI SAINT CHRYST', 72, 290)
  ctx.fillStyle = GOLD
  ctx.font = '28px Inter, sans-serif'
  ctx.fillText('Développeur & Data Analyst junior', 72, 338)

  // Coordonnées
  ctx.fillStyle = '#b9b9c2'
  ctx.font = '26px Inter, sans-serif'
  ctx.fillText('bolichrist2002@gmail.com', 72, 470)
  ctx.fillText('+225 05 46 17 51 85', 72, 512)
  ctx.fillText("Abidjan, Côte d'Ivoire", 72, 554)

  // QR code (dessiné seulement une fois l'image chargée)
  if (qrImage) ctx.drawImage(qrImage, WIDTH - 316, HEIGHT - 340, 240, 240)
}

/* ========== LE VERSO ========== */
function drawBack(ctx) {
  // Fond doré
  const gradient = ctx.createLinearGradient(0, 0, WIDTH, HEIGHT)
  gradient.addColorStop(0, '#e2c25a')
  gradient.addColorStop(1, '#a8841f')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, WIDTH, HEIGHT)

  ctx.textAlign = 'center'
  ctx.fillStyle = '#0a0a0c'
  ctx.font = '800 110px Syne, sans-serif'
  ctx.fillText('BiChrys', WIDTH / 2, 300)

  ctx.font = '600 28px Inter, sans-serif'
  ctx.fillText('portfolio-3d-brown-eight.vercel.app', WIDTH / 2, 420)
  ctx.fillText('github.com/chrys-2002', WIDTH / 2, 466)
  ctx.textAlign = 'left'
}

// upsideDown : le verso d'une boîte est "vu de dessous" ; une fois la carte
// retournée, son image serait à l'envers : on la tourne de 180°
function createCardTexture(draw, upsideDown = false) {
  const canvas = document.createElement('canvas')
  canvas.width = WIDTH
  canvas.height = HEIGHT
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = 8 // reste net même vue de biais
  if (upsideDown) {
    texture.center.set(0.5, 0.5)
    texture.rotation = Math.PI
  }

  // redraw() peut être rappelée plus tard (police ou QR code chargés)
  const redraw = (...args) => {
    draw(canvas.getContext('2d'), ...args)
    texture.needsUpdate = true
  }
  return { texture, redraw }
}

/* ========== LA CARTE ========== */
export function createBusinessCard({ phone }) {
  const front = createCardTexture(drawFront)
  const back = createCardTexture(drawBack, true)
  front.redraw(null)
  back.redraw()

  // Quand la police Syne et le QR code sont prêts, on redessine
  const qrImage = new Image()
  qrImage.src = '/images/qr-portfolio.png'
  Promise.all([document.fonts.load('800 40px Syne'), qrImage.decode()])
    .catch(() => {}) // hors connexion : on garde la police de secours
    .finally(() => {
      front.redraw(qrImage.complete ? qrImage : null)
      back.redraw()
    })

  const edge = new THREE.MeshStandardMaterial({ color: GOLD, metalness: 1, roughness: 0.3 })
  const card = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.008, 0.582), [
    edge,
    edge,
    new THREE.MeshStandardMaterial({ map: front.texture, roughness: 0.35, metalness: 0.15 }), // +y : recto
    new THREE.MeshStandardMaterial({ map: back.texture, roughness: 0.3, metalness: 0.4 }), // -y : verso
    edge,
    edge,
  ])
  card.castShadow = true

  // root : position et inclinaison (face à la caméra)
  // spin : rotation pour retourner la carte (autour de son axe vertical à l'écran)
  const root = new THREE.Group()
  const spin = new THREE.Group()
  spin.add(card)
  root.add(spin)
  root.visible = false

  // Au-dessus et un peu en arrière du téléphone : on voit toujours l'écran du téléphone
  const restPosition = phone.position.clone().add(new THREE.Vector3(0.08, 0.55, -0.4))
  const hiddenPosition = phone.position.clone().add(new THREE.Vector3(0, 0.03, 0))
  root.position.copy(hiddenPosition)
  root.rotation.set(0.93, -0.12, 0) // inclinée vers la caméra
  root.scale.setScalar(0.2)

  /* ----- Apparition / disparition ----- */
  const reveal = gsap.timeline({
    paused: true,
    onStart: () => (root.visible = true),
    onReverseComplete: () => (root.visible = false),
  })
  reveal
    .to(root.position, { ...restPosition, duration: 1.1, ease: 'power3.out' }, 0)
    .to(root.scale, { x: 1, y: 1, z: 1, duration: 0.9, ease: 'back.out(1.6)' }, 0.1)
    .fromTo(spin.rotation, { z: -Math.PI * 2 }, { z: 0, duration: 1.3, ease: 'power3.out' }, 0)

  /* ----- Retourner la carte ----- */
  let side = 0 // 0 = recto, 1 = verso

  function flip() {
    side = 1 - side
    gsap.to(spin.rotation, { z: side * Math.PI, duration: 0.8, ease: 'back.out(1.4)', overwrite: true })
  }

  /* ----- Glisser pour faire tourner (souris) ----- */
  const drag = { active: false, startX: 0, lastX: 0, moved: 0 }

  function isHit(raycaster) {
    return root.visible && raycaster.intersectObject(card).length > 0
  }

  function pointerDown(event, raycaster) {
    if (!isHit(raycaster)) return false
    drag.active = true
    drag.startX = drag.lastX = event.clientX
    drag.moved = 0
    gsap.killTweensOf(spin.rotation)
    return true
  }

  function pointerMove(event) {
    if (!drag.active) return
    const dx = event.clientX - drag.lastX
    drag.lastX = event.clientX
    drag.moved += Math.abs(dx)
    spin.rotation.z += dx * 0.012
  }

  function pointerUp() {
    if (!drag.active) return
    drag.active = false
    if (drag.moved < 6) {
      flip() // presque pas bougé : c'était un clic
      return
    }
    // Sinon, on se cale sur la face la plus proche (multiple de π)
    const turns = Math.round(spin.rotation.z / Math.PI)
    side = ((turns % 2) + 2) % 2
    gsap.to(spin.rotation, { z: turns * Math.PI, duration: 0.6, ease: 'power3.out' })
  }

  /* ----- Flottement ----- */
  function update(elapsed) {
    if (!root.visible || reveal.isActive()) return
    root.position.y = restPosition.y + Math.sin(elapsed * 1.4) * 0.015
  }

  return {
    group: root,
    show: () => reveal.timeScale(1).play(),
    hide: () => reveal.timeScale(1.8).reverse(),
    isHit,
    pointerDown,
    pointerMove,
    pointerUp,
    isDragging: () => drag.active,
    update,
  }
}
