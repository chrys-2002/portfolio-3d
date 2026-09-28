/*
 * objects.js — Fabrique de tous les objets 3D de l'atelier.
 * Chaque fonction construit un objet à partir de formes simples
 * et le renvoie, prêt à être placé dans la scène par main.js.
 */
import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'

/* ========== PALETTE COMMUNE ========== */
export const palette = {
  desk: '#2a1d15', // bois sombre
  metal: '#1c1c1f', // métal noir
  gold: '#d4af37', // accents dorés
  paper: '#efe8d8', // pages du carnet
  leather: '#8a4a2a', // cuir du carnet
  ceramic: '#f2f0ea', // tasse
  lamp: '#ffd9a0', // lumière chaude de la lampe
}

/* Active les ombres sur tous les meshes d'un groupe */
function enableShadows(object) {
  object.traverse((child) => {
    if (child.isMesh) {
      child.castShadow = true
      child.receiveShadow = true
    }
  })
}

/* ========== TEXTURES DESSINÉES EN JAVASCRIPT ========== */

// Contenu de l'écran d'ordinateur, dessiné sur un <canvas> 2D
function createScreenTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = 1024
  canvas.height = 576
  const ctx = canvas.getContext('2d')

  // Fond en dégradé bleu nuit
  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height)
  gradient.addColorStop(0, '#0d1b33')
  gradient.addColorStop(1, '#050a14')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  // Les 3 pastilles d'une fenêtre
  const dots = ['#ff5f56', '#ffbd2e', '#27c93f']
  dots.forEach((color, i) => {
    ctx.fillStyle = color
    ctx.beginPath()
    ctx.arc(40 + i * 30, 36, 9, 0, Math.PI * 2)
    ctx.fill()
  })

  // Titre
  ctx.fillStyle = palette.gold
  ctx.font = 'bold 72px Segoe UI, sans-serif'
  ctx.fillText('PROJETS', 60, 170)

  // Fausses lignes de code
  const colors = ['#6ea8ff', '#c792ea', '#89ddff', '#f2f2f2']
  ctx.globalAlpha = 0.7
  for (let i = 0; i < 9; i++) {
    const width = 150 + Math.random() * 500
    ctx.fillStyle = colors[i % colors.length]
    ctx.fillRect(60 + (i % 3) * 40, 230 + i * 34, width, 14)
  }
  ctx.globalAlpha = 1

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace // couleurs fidèles au canvas
  return texture
}

// Contenu de l'écran du téléphone
function createPhoneTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 1024
  const ctx = canvas.getContext('2d')

  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height)
  gradient.addColorStop(0, '#1a1405')
  gradient.addColorStop(1, '#050505')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  // Heure
  ctx.fillStyle = '#f2f2f2'
  ctx.font = '600 120px Segoe UI, sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('09:41', 256, 260)

  // Carte de notification
  ctx.fillStyle = 'rgba(255, 255, 255, 0.08)'
  ctx.beginPath()
  ctx.roundRect(40, 420, 432, 150, 28)
  ctx.fill()

  ctx.textAlign = 'left'
  ctx.fillStyle = palette.gold
  ctx.font = 'bold 38px Segoe UI, sans-serif'
  ctx.fillText('Nouveau message', 80, 485)
  ctx.fillStyle = '#bdbdbd'
  ctx.font = '30px Segoe UI, sans-serif'
  ctx.fillText('Travaillons ensemble ?', 80, 535)

  // Bouton doré
  ctx.fillStyle = palette.gold
  ctx.beginPath()
  ctx.roundRect(156, 860, 200, 70, 35)
  ctx.fill()
  ctx.fillStyle = '#0a0a0c'
  ctx.font = 'bold 30px Segoe UI, sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('CONTACT', 256, 906)

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  return texture
}

/* ========== LE BUREAU ========== */
export function createDesk() {
  const group = new THREE.Group()

  // Plateau : sa surface supérieure est exactement à y = 0
  const top = new THREE.Mesh(
    new RoundedBoxGeometry(4.2, 0.12, 2.1, 4, 0.04),
    new THREE.MeshStandardMaterial({ color: palette.desk, roughness: 0.55, metalness: 0.1 })
  )
  top.position.y = -0.06

  // Fin liseré doré sous le plateau
  const trim = new THREE.Mesh(
    new THREE.BoxGeometry(4.0, 0.02, 1.9),
    new THREE.MeshStandardMaterial({ color: palette.gold, metalness: 1, roughness: 0.3 })
  )
  trim.position.y = -0.13

  group.add(top, trim)
  enableShadows(group)
  return group
}

/* ========== L'ÉCRAN ========== */
// screenTexture : l'image à afficher. Par défaut, l'écran statique "PROJETS"
export function createMonitor(screenTexture = createScreenTexture()) {
  const group = new THREE.Group()
  const dark = new THREE.MeshStandardMaterial({ color: palette.metal, roughness: 0.4, metalness: 0.6 })

  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.25, 0.03, 32), dark)
  base.position.y = 0.015

  const neck = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.45, 0.04), dark)
  neck.position.set(0, 0.24, -0.05)

  const frame = new THREE.Mesh(new RoundedBoxGeometry(1.5, 0.9, 0.05, 4, 0.02), dark)
  frame.position.y = 0.7

  // L'écran lui-même : MeshBasicMaterial n'a pas besoin de lumière,
  // il "brille" tout seul comme un vrai écran
  const screen = new THREE.Mesh(
    new THREE.PlaneGeometry(1.42, 0.82),
    new THREE.MeshBasicMaterial({ map: screenTexture, toneMapped: false })
  )
  screen.position.set(0, 0.7, 0.026)

  group.add(base, neck, frame, screen)
  enableShadows(group)
  screen.castShadow = false

  // On renvoie aussi l'écran : main.js en a besoin pour la lumière réactive
  return { group, screen }
}

/* ========== LE CLAVIER ========== */
export function createKeyboard() {
  const group = new THREE.Group()

  const body = new THREE.Mesh(
    new RoundedBoxGeometry(1.1, 0.04, 0.36, 3, 0.015),
    new THREE.MeshStandardMaterial({ color: palette.metal, roughness: 0.5, metalness: 0.4 })
  )
  body.position.y = 0.02
  group.add(body)

  // 56 touches dessinées en UN SEUL appel grâce à InstancedMesh
  const rows = 4
  const cols = 14
  const keys = new THREE.InstancedMesh(
    new RoundedBoxGeometry(0.062, 0.02, 0.062, 2, 0.01),
    // Matériau blanc : la vraie couleur est donnée touche par touche (setColorAt)
    new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.6 }),
    rows * cols
  )
  const keyColor = new THREE.Color('#2b2b30')

  const dummy = new THREE.Object3D() // objet "gabarit" pour calculer chaque position
  let index = 0
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      dummy.position.set(-0.47 + c * 0.0725, 0.05, -0.11 + r * 0.075)
      dummy.updateMatrix()
      keys.setMatrixAt(index, dummy.matrix)
      keys.setColorAt(index, keyColor) // chaque touche peut avoir sa propre couleur
      index++
    }
  }
  group.add(keys)

  enableShadows(group)
  // On renvoie aussi les touches : screen.js va les animer
  return { group, keys, rows, cols }
}

/* ========== LE CARNET ========== */

// La page de droite, écrite à la main (dessinée sur un canvas)
function createNotebookPageTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 688 // même proportion que la page (0,59 x 0,79)
  const ctx = canvas.getContext('2d')

  // Papier crème
  ctx.fillStyle = '#f3ecdc'
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  // Lignes de cahier
  ctx.strokeStyle = 'rgba(90, 110, 160, 0.25)'
  ctx.lineWidth = 2
  for (let y = 110; y < canvas.height - 30; y += 42) {
    ctx.beginPath()
    ctx.moveTo(40, y)
    ctx.lineTo(canvas.width - 30, y)
    ctx.stroke()
  }

  // Marge rouge
  ctx.strokeStyle = 'rgba(200, 70, 70, 0.4)'
  ctx.beginPath()
  ctx.moveTo(70, 20)
  ctx.lineTo(70, canvas.height - 20)
  ctx.stroke()

  // Texte "manuscrit"
  const write = (text, y, size, color, weight = '') => {
    ctx.fillStyle = color
    ctx.font = `${weight} ${size}px "Segoe Script", "Brush Script MT", cursive`
    ctx.fillText(text, 88, y)
  }
  write('Parcours', 96, 44, '#8a6a12', 'bold')
  write('• Licence 3 MIAGE', 170, 25, '#1f2a44')
  write('UPB — Bingerville, 2025-2026', 208, 19, '#3a4560')
  write('• Baccalauréat 2023', 262, 25, '#1f2a44')
  write('Lycée Moderne 2 Abobo', 300, 19, '#3a4560')
  write('Compétences', 372, 34, '#8a6a12', 'bold')
  write('• React · Next.js · Flutter', 440, 21, '#1f2a44')
  write('• Python · MySQL · Firebase', 482, 21, '#1f2a44')
  write('• Power BI · Excel', 524, 21, '#1f2a44')
  write('• Design Sprint · Agile', 566, 21, '#1f2a44')
  write('À suivre…', 632, 24, '#6b5a3a')

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  return texture
}

// L'intérieur de la couverture (visible une fois le carnet ouvert)
function createNotebookLiningTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 688
  const ctx = canvas.getContext('2d')

  ctx.fillStyle = '#efe6d2'
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  // Cadre doré
  ctx.strokeStyle = '#b8942c'
  ctx.lineWidth = 4
  ctx.strokeRect(36, 36, canvas.width - 72, canvas.height - 72)

  ctx.textAlign = 'center'
  ctx.fillStyle = '#8a6a12'
  ctx.font = 'bold 40px "Segoe Script", "Brush Script MT", cursive'
  ctx.fillText('Carnet de', canvas.width / 2, 300)
  ctx.font = 'bold 56px "Segoe Script", "Brush Script MT", cursive'
  ctx.fillText('Bi Chrys', canvas.width / 2, 380)

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  // La couverture se retourne en s'ouvrant : on tourne l'image de 180° pour qu'elle soit à l'endroit
  texture.center.set(0.5, 0.5)
  texture.rotation = Math.PI
  return texture
}

export function createNotebook() {
  const group = new THREE.Group()
  const leather = new THREE.MeshStandardMaterial({ color: palette.leather, roughness: 0.7 })
  const gold = new THREE.MeshStandardMaterial({ color: palette.gold, metalness: 1, roughness: 0.25 })
  const paper = new THREE.MeshStandardMaterial({ color: palette.paper, roughness: 0.9 })

  // Couverture du dessous : fixe
  const bottomCover = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.012, 0.82), leather)
  bottomCover.position.y = 0.006

  // Bloc de pages : sa face du dessus porte la page écrite.
  // Une BoxGeometry a 6 faces, donc on peut donner 6 matériaux (ordre : +x, -x, +y, -y, +z, -z)
  const writtenPage = new THREE.MeshStandardMaterial({ map: createNotebookPageTexture(), roughness: 0.85 })
  const pageBlock = new THREE.Mesh(new THREE.BoxGeometry(0.59, 0.027, 0.79), [
    paper,
    paper,
    writtenPage, // +y : le dessus
    paper,
    paper,
    paper,
  ])
  pageBlock.position.set(0.005, 0.0255, 0)

  // Pages libres qui vont se tourner. Chaque page est dans un "pivot"
  // placé sur la reliure (à gauche) : tourner le pivot fait tourner la page autour de la reliure
  const pages = []
  for (let i = 0; i < 3; i++) {
    const pivot = new THREE.Group()
    pivot.position.set(-0.29, 0.03975 + i * 0.0015, 0)
    const page = new THREE.Mesh(new THREE.BoxGeometry(0.585, 0.0012, 0.785), paper)
    page.position.x = 0.2925 // la page part de la reliure vers la droite
    pivot.add(page)
    pages.push(pivot)
  }

  // Couverture du dessus : elle aussi dans un pivot sur la reliure
  const cover = new THREE.Group()
  cover.position.set(-0.31, 0.044, 0)

  const topCover = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.012, 0.82), leather)
  topCover.position.set(0.31, 0.006, 0)

  // Élastique doré, attaché à la couverture
  const band = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.014, 0.83), gold)
  band.position.set(0.53, 0.006, 0)

  // Doublure intérieure (face tournée vers le bas quand le carnet est fermé)
  const lining = new THREE.Mesh(
    new THREE.PlaneGeometry(0.6, 0.8),
    new THREE.MeshStandardMaterial({ map: createNotebookLiningTexture(), roughness: 0.85 })
  )
  lining.rotation.x = Math.PI / 2
  lining.position.set(0.31, -0.0005, 0)

  cover.add(topCover, band, lining)

  // Stylo posé à côté
  const pen = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.6, 16), gold)
  pen.rotation.x = Math.PI / 2 // couché sur le bureau
  pen.position.set(0.4, 0.012, 0)

  group.add(bottomCover, pageBlock, ...pages, cover, pen)
  enableShadows(group)

  // On renvoie la couverture et les pages : elles seront animées
  return { group, cover, pages }
}

/* ========== LA TASSE ========== */
export function createMug() {
  const group = new THREE.Group()
  const ceramic = new THREE.MeshStandardMaterial({
    color: palette.ceramic,
    roughness: 0.3,
    side: THREE.DoubleSide, // on voit l'intérieur ET l'extérieur
  })

  // Profil d'une demi-tasse (x = rayon, y = hauteur), qu'on fait tourner autour de l'axe Y
  const profile = [
    new THREE.Vector2(0, 0),
    new THREE.Vector2(0.13, 0),
    new THREE.Vector2(0.14, 0.01),
    new THREE.Vector2(0.15, 0.3), // bord extérieur en haut
    new THREE.Vector2(0.135, 0.3), // bord intérieur en haut
    new THREE.Vector2(0.125, 0.02),
    new THREE.Vector2(0, 0.02),
  ]
  const body = new THREE.Mesh(new THREE.LatheGeometry(profile, 48), ceramic)

  // Le café : un disque découpé en anneaux (RingGeometry) pour pouvoir onduler
  // (un CircleGeometry n'a des sommets qu'au centre et sur le bord)
  const coffee = new THREE.Mesh(
    new THREE.RingGeometry(0, 0.132, 64, 24),
    new THREE.MeshStandardMaterial({ color: '#2b1a10', roughness: 0.12, metalness: 0.1 })
  )
  coffee.rotation.x = -Math.PI / 2 // à plat
  coffee.position.y = 0.25

  // Anse : un demi-tore (arc de 180°)
  const handle = new THREE.Mesh(new THREE.TorusGeometry(0.075, 0.016, 16, 32, Math.PI), ceramic)
  handle.rotation.z = -Math.PI / 2
  handle.position.set(0.145, 0.15, 0)

  // Liseré doré sur le bord
  const rim = new THREE.Mesh(
    new THREE.TorusGeometry(0.1425, 0.004, 8, 64),
    new THREE.MeshStandardMaterial({ color: palette.gold, metalness: 1, roughness: 0.3 })
  )
  rim.rotation.x = Math.PI / 2
  rim.position.y = 0.3

  group.add(body, coffee, handle, rim)
  enableShadows(group)
  coffee.castShadow = false
  // On renvoie aussi le café : ses vaguelettes seront animées
  return { group, coffee }
}

/* ========== LE TÉLÉPHONE ========== */
export function createPhone() {
  const group = new THREE.Group()

  const body = new THREE.Mesh(
    new RoundedBoxGeometry(0.3, 0.025, 0.6, 4, 0.012),
    new THREE.MeshStandardMaterial({ color: palette.metal, roughness: 0.3, metalness: 0.7 })
  )
  body.position.y = 0.0125

  const screen = new THREE.Mesh(
    new THREE.PlaneGeometry(0.27, 0.56),
    new THREE.MeshBasicMaterial({ map: createPhoneTexture(), toneMapped: false })
  )
  screen.rotation.x = -Math.PI / 2 // couché, face vers le haut
  screen.position.y = 0.026

  group.add(body, screen)
  enableShadows(group)
  screen.castShadow = false
  return group
}

/* ========== LE CÂBLE DE L'ÉCRAN ========== */
export function createCable() {
  // Une courbe passe par ces points, le tube suit la courbe
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0.3, -0.58), // derrière l'écran
    new THREE.Vector3(0.2, 0.02, -0.75),
    new THREE.Vector3(0.6, 0.012, -0.95),
    new THREE.Vector3(0.7, 0.0, -1.07), // bord du bureau
    new THREE.Vector3(0.72, -0.35, -1.1),
    new THREE.Vector3(0.68, -1.3, -1.02), // pend dans le vide
  ])

  const cable = new THREE.Mesh(
    new THREE.TubeGeometry(curve, 80, 0.012, 8, false),
    new THREE.MeshStandardMaterial({ color: '#111114', roughness: 0.6 })
  )
  cable.castShadow = true
  return cable
}

/* ========== LA LAMPE ========== */
export function createLamp() {
  const group = new THREE.Group()
  const metal = new THREE.MeshStandardMaterial({
    color: palette.metal,
    metalness: 0.7,
    roughness: 0.35,
    side: THREE.DoubleSide,
  })
  const gold = new THREE.MeshStandardMaterial({ color: palette.gold, metalness: 1, roughness: 0.3 })

  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.2, 0.05, 32), metal)
  base.position.y = 0.025

  // Bras inférieur, légèrement incliné
  const lowerArm = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.8, 12), metal)
  lowerArm.position.set(0.1, 0.44, 0)
  lowerArm.rotation.z = -0.25

  // Articulation dorée
  const joint = new THREE.Mesh(new THREE.SphereGeometry(0.035, 16, 16), gold)
  joint.position.set(0.2, 0.83, 0)

  // Bras supérieur, presque horizontal
  const upperArm = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.6, 12), metal)
  upperArm.position.set(0.48, 0.94, 0)
  upperArm.rotation.z = -1.2

  // Tête : un cône ouvert et doré, tourné vers le bas
  const shade = new THREE.MeshStandardMaterial({
    color: palette.gold,
    metalness: 1,
    roughness: 0.3,
    side: THREE.DoubleSide,
  })
  const head = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.26, 32, 1, true), shade)
  head.position.set(0.78, 1.02, 0)
  head.rotation.z = 0.5

  // Ampoule : sa luminosité (emissive) sera animée
  const bulbMaterial = new THREE.MeshStandardMaterial({
    color: '#fff4dc',
    emissive: '#ffcf87',
    emissiveIntensity: 0,
  })
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.055, 24, 24), bulbMaterial)
  bulb.position.y = -0.07
  head.add(bulb)

  group.add(base, lowerArm, joint, upperArm, head)
  enableShadows(group)
  // La tête et l'ampoule entourent la lumière : elles ne doivent pas bloquer le faisceau
  head.castShadow = false
  bulb.castShadow = false

  // Le faisceau : éteint au départ (intensité 0), allumé par l'intro
  const spotLight = new THREE.SpotLight(palette.lamp, 0, 7, Math.PI / 4, 0.6, 2)
  spotLight.position.set(0.82, 0.95, 0)
  spotLight.target.position.set(1.8, 0, 0) // vise le centre du bureau
  spotLight.castShadow = true
  spotLight.shadow.mapSize.set(1024, 1024)
  spotLight.shadow.bias = -0.0005
  spotLight.shadow.normalBias = 0.02
  group.add(spotLight, spotLight.target)

  return { group, spotLight, bulbMaterial }
}
