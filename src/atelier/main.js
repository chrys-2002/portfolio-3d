/*
 * main.js — Chef d'orchestre de l'atelier.
 * Il crée la scène, place les objets, gère la lumière,
 * le scroll, la souris et la boucle d'animation.
 */
import './style.css'
import * as THREE from 'three'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import GUI from 'lil-gui'
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js'
import {
  createDesk,
  createMonitor,
  createKeyboard,
  createNotebook,
  createMug,
  createPhone,
  createCable,
  createLamp,
} from './objects.js'

gsap.registerPlugin(ScrollTrigger)

/* ========== 0. PARAMÈTRES ========== */
const params = {
  lampIntensity: 25,
  lampColor: '#ffd9a0',
  ambient: 0.35,
  screenLight: 3,
  exposure: 1.1,
  envIntensity: 0.25,
  parallax: 0.25,
  smoothness: 0.05,
}

/* ========== 1. BASE ========== */
const canvas = document.querySelector('#webgl')
const scene = new THREE.Scene()
scene.fog = new THREE.Fog('#0a0a0c', 7, 16) // le lointain se fond dans le noir

const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
}

/* ========== 2. CAMÉRA ========== */
const cameraGroup = new THREE.Group() // chariot : parallaxe + intro
scene.add(cameraGroup)

const camera = new THREE.PerspectiveCamera(40, sizes.width / sizes.height, 0.1, 50)
cameraGroup.add(camera)

// Le point que la caméra regarde (animé par le scroll)
const lookTarget = new THREE.Vector3()

/* ========== 3. RENDERER ========== */
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true })
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
renderer.toneMapping = THREE.ACESFilmicToneMapping
renderer.toneMappingExposure = params.exposure
renderer.shadowMap.enabled = true // active les ombres
renderer.shadowMap.type = THREE.PCFShadowMap // ombres filtrées (PCFSoftShadowMap a été retiré de Three.js)

// Environnement : une "pièce virtuelle" que les matériaux reflètent.
// Sans lui, les métaux (dorures, lampe) paraissent noirs hors du faisceau.
const pmremGenerator = new THREE.PMREMGenerator(renderer)
scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture
scene.environmentIntensity = params.envIntensity // faible : on garde l'ambiance nocturne

/* ========== 4. L'ATELIER ========== */
// Tout le bureau est dans un groupe, pour le faire flotter d'un bloc
const workshop = new THREE.Group()
scene.add(workshop)

workshop.add(createDesk())
workshop.add(createCable())

const keyboard = createKeyboard()
keyboard.position.set(0, 0, 0.2)
workshop.add(keyboard)

const monitor = createMonitor()
monitor.group.position.set(0, 0, -0.5)
workshop.add(monitor.group)

const notebook = createNotebook()
notebook.position.set(-1.3, 0, 0.25)
notebook.rotation.y = 0.25
workshop.add(notebook)

const mug = createMug()
mug.position.set(1.3, 0, -0.35)
workshop.add(mug)

const phone = createPhone()
phone.position.set(0.95, 0, 0.55)
phone.rotation.y = -0.3
workshop.add(phone)

const lamp = createLamp()
lamp.group.position.set(-1.75, 0, -0.65)
lamp.group.rotation.y = -0.34 // la lampe se tourne vers le centre du bureau
workshop.add(lamp.group)

/* ========== 5. OBJETS INTERACTIFS ========== */
// Chaque objet cliquable est relié à une section du site
const items = [
  { name: 'Projets', stop: 1, object: monitor.group, labelHeight: 1.25 },
  { name: 'Parcours', stop: 2, object: notebook, labelHeight: 0.25 },
  { name: 'Moi', stop: 3, object: mug, labelHeight: 0.5 },
  { name: 'Contact', stop: 4, object: phone, labelHeight: 0.2 },
]

items.forEach((item, index) => {
  item.baseY = item.object.position.y // hauteur de repos
  item.phase = index * 1.7 // décalage : les objets ne flottent pas en même temps
  item.hover = 0 // 0 = pas survolé, 1 = survolé (valeur lissée)
  item.object.userData.item = item // lien retour : objet 3D -> item
})

const interactiveObjects = items.map((item) => item.object)

/* ========== 6. LUMIÈRES ========== */
const ambientLight = new THREE.AmbientLight('#b8c4ff', params.ambient)
scene.add(ambientLight)

// Contre-jour bleuté : détache les silhouettes du fond noir
const rimLight = new THREE.DirectionalLight('#5b7cff', 1.2)
rimLight.position.set(-3, 3, -4)
scene.add(rimLight)

// Lueur de l'écran : son intensité réagit au curseur
const screenLight = new THREE.PointLight('#6ea8ff', params.screenLight, 4)
screenLight.position.set(0, 0.7, -0.1)
workshop.add(screenLight)

/* ========== 7. POUSSIÈRE DANS L'AIR ========== */
const dustCount = 400
const dustPositions = new Float32Array(dustCount * 3)
for (let i = 0; i < dustCount; i++) {
  dustPositions[i * 3] = (Math.random() - 0.5) * 6 // x
  dustPositions[i * 3 + 1] = Math.random() * 3 - 0.5 // y
  dustPositions[i * 3 + 2] = (Math.random() - 0.5) * 4 // z
}
const dustGeometry = new THREE.BufferGeometry()
dustGeometry.setAttribute('position', new THREE.BufferAttribute(dustPositions, 3))

// Un point est carré par défaut : on lui applique une texture ronde et floue
function createDotTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = 64
  canvas.height = 64
  const ctx = canvas.getContext('2d')
  const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32)
  gradient.addColorStop(0, 'rgba(255, 255, 255, 1)')
  gradient.addColorStop(1, 'rgba(255, 255, 255, 0)')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, 64, 64)
  return new THREE.CanvasTexture(canvas)
}

const dust = new THREE.Points(
  dustGeometry,
  new THREE.PointsMaterial({
    size: 0.02,
    color: '#ffe2b0',
    map: createDotTexture(),
    transparent: true,
    opacity: 0.6,
    depthWrite: false,
    blending: THREE.AdditiveBlending, // les points s'illuminent au lieu de se masquer
  })
)
scene.add(dust)

/* ========== 8. LES ARRÊTS DE LA CAMÉRA ========== */
// Crée un point de vue : la caméra se place devant la cible,
// décalée vers la gauche (shift) pour laisser la place au texte
function makeStop(target, { distance, height, shift }) {
  return {
    position: { x: target.x - shift, y: target.y + height, z: target.z + distance },
    target: { x: target.x - shift, y: target.y, z: target.z },
  }
}

const stops = [
  // 0. Vue d'ensemble
  { position: { x: -1, y: 2.4, z: 5.6 }, target: { x: -1, y: 0.3, z: 0 } },
  // 1. L'écran
  makeStop({ x: 0, y: 0.72, z: -0.5 }, { distance: 2.4, height: 0.15, shift: 0.65 }),
  // 2. Le carnet
  makeStop({ x: -1.3, y: 0.05, z: 0.25 }, { distance: 1.5, height: 1.2, shift: 0.5 }),
  // 3. La tasse
  makeStop({ x: 1.3, y: 0.18, z: -0.35 }, { distance: 1.0, height: 0.35, shift: 0.3 }),
  // 4. Le téléphone
  makeStop({ x: 0.95, y: 0.02, z: 0.55 }, { distance: 0.9, height: 0.8, shift: 0.3 }),
]

// Le "rail" : un point de vue invisible que le scroll déplace.
// La caméra le suit, SAUF pendant un vol direct (clic sur un objet).
const rail = {
  position: new THREE.Vector3(stops[0].position.x, stops[0].position.y, stops[0].position.z),
  target: new THREE.Vector3(stops[0].target.x, stops[0].target.y, stops[0].target.z),
}

// Position de départ de la caméra = premier arrêt
camera.position.copy(rail.position)
lookTarget.copy(rail.target)

/* ========== 9. SCROLL : LA VISITE GUIDÉE ========== */
const tour = gsap.timeline({
  scrollTrigger: {
    trigger: '.content',
    start: 'top top',
    end: 'bottom bottom',
    scrub: 1.2,
  },
})

// Une étape par arrêt : le rail (position ET regard) avance avec le scroll
for (let i = 1; i < stops.length; i++) {
  tour
    .to(rail.position, { ...stops[i].position, ease: 'power2.inOut' })
    .to(rail.target, { ...stops[i].target, ease: 'power2.inOut' }, '<')
}

// Chaque section affiche son panneau et allume son lien du menu
document.querySelectorAll('.section').forEach((section) => {
  const panel = section.querySelector('.panel')
  const link = document.querySelector(`.topbar a[href="#${section.id}"]`)

  ScrollTrigger.create({
    trigger: section,
    start: 'top center',
    end: 'bottom center',
    onToggle: (self) => {
      panel.classList.toggle('is-visible', self.isActive)
      if (link) link.classList.toggle('is-active', self.isActive)
    },
  })
})

/* ========== 10. SOURIS ========== */
const pointer = new THREE.Vector2(10, 10) // hors écran au départ
const cursor = { x: 0, y: 0 }

function updatePointer(event) {
  // Coordonnées pour le raycaster : de -1 à 1, y vers le haut
  pointer.x = (event.clientX / sizes.width) * 2 - 1
  pointer.y = -(event.clientY / sizes.height) * 2 + 1
  // Coordonnées pour la parallaxe : de -0.5 à 0.5
  cursor.x = event.clientX / sizes.width - 0.5
  cursor.y = event.clientY / sizes.height - 0.5
}

window.addEventListener('pointermove', updatePointer)

/* ========== 11. RAYCASTER : QUEL OBJET EST SOUS LA SOURIS ? ========== */
const raycaster = new THREE.Raycaster()

// Remonte les parents jusqu'à trouver le groupe relié à un item
function findItem(object) {
  let current = object
  while (current) {
    if (current.userData.item) return current.userData.item
    current = current.parent
  }
  return null
}

function pickItem() {
  raycaster.setFromCamera(pointer, camera)
  const hits = raycaster.intersectObjects(interactiveObjects, true)
  return hits.length > 0 ? findItem(hits[0].object) : null
}

/* ========== 12. VOL DIRECT VERS UN OBJET ========== */
const sections = document.querySelectorAll('.section') // dans le même ordre que stops
const flight = { progress: 0, tween: null } // null = pas de vol en cours
const flightStart = { position: new THREE.Vector3(), target: new THREE.Vector3() }
const flightEnd = { position: new THREE.Vector3(), target: new THREE.Vector3() }

function flyTo(stopIndex) {
  const stop = stops[stopIndex]

  // 1. On mémorise le départ (où est la caméra) et l'arrivée (l'arrêt choisi)
  flightStart.position.copy(camera.position)
  flightStart.target.copy(lookTarget)
  flightEnd.position.set(stop.position.x, stop.position.y, stop.position.z)
  flightEnd.target.set(stop.target.x, stop.target.y, stop.target.z)

  // 2. Hauteur de l'arc : plus le trajet est long, plus la caméra monte
  const arcHeight = flightStart.position.distanceTo(flightEnd.position) * 0.15

  // 3. Si un vol est déjà en cours, on l'arrête avant d'en lancer un autre
  if (flight.tween) flight.tween.kill()
  flight.progress = 0

  flight.tween = gsap.to(flight, {
    progress: 1,
    duration: 1.8,
    ease: 'power3.inOut',
    onUpdate: () => {
      const p = flight.progress
      // Mélange entre départ (p = 0) et arrivée (p = 1)
      camera.position.lerpVectors(flightStart.position, flightEnd.position, p)
      lookTarget.lerpVectors(flightStart.target, flightEnd.target, p)
      // L'arc : 0 au départ, maximum à mi-chemin, 0 à l'arrivée
      camera.position.y += Math.sin(p * Math.PI) * arcHeight
    },
    onComplete: () => {
      flight.tween = null // la caméra se remet à suivre le rail
    },
  })

  // 4. On saute INSTANTANÉMENT à la section : le rail s'y place pendant le vol,
  //    sans que la caméra ne traverse les autres objets
  window.scrollTo({ top: sections[stopIndex].offsetTop, behavior: 'instant' })
}

// Si le visiteur scrolle lui-même pendant un vol, il reprend la main
function cancelFlight() {
  if (flight.tween) {
    flight.tween.kill()
    flight.tween = null
  }
}
window.addEventListener('wheel', cancelFlight, { passive: true })
window.addEventListener('touchstart', cancelFlight, { passive: true })

// Clic sur un objet 3D -> vol direct
window.addEventListener('click', (event) => {
  updatePointer(event)
  const item = pickItem()
  if (item) flyTo(item.stop)
})

// Liens du menu (et logo) -> vol direct aussi
document.querySelectorAll('a[href^="#"]').forEach((link) => {
  link.addEventListener('click', (event) => {
    const index = [...sections].findIndex((section) => `#${section.id}` === link.getAttribute('href'))
    if (index === -1) return
    event.preventDefault() // on bloque le défilement doux du navigateur
    flyTo(index)
  })
})

/* ========== 13. INTRO : LA LAMPE S'ALLUME ========== */
cameraGroup.position.z = 3 // la caméra part de plus loin

const intro = gsap.timeline({ delay: 0.4 })
intro
  .to(cameraGroup.position, { z: 0, duration: 2.4, ease: 'power3.out' }, 0)
  // Grésillement de la lampe avant qu'elle ne s'allume vraiment
  .to(lamp.spotLight, { intensity: params.lampIntensity * 0.8, duration: 0.06 }, 0.6)
  .to(lamp.spotLight, { intensity: 0, duration: 0.08 })
  .to(lamp.spotLight, { intensity: params.lampIntensity, duration: 0.06 })
  .to(lamp.spotLight, { intensity: params.lampIntensity * 0.3, duration: 0.1 })
  .to(lamp.spotLight, { intensity: params.lampIntensity, duration: 0.5, ease: 'power2.out' })
  // Le texte d'intro apparaît élément par élément
  .from('.intro > *', { y: 30, opacity: 0, duration: 0.9, stagger: 0.1, ease: 'power3.out' }, 1)

/* ========== 14. REDIMENSIONNEMENT ========== */
window.addEventListener('resize', () => {
  sizes.width = window.innerWidth
  sizes.height = window.innerHeight

  camera.aspect = sizes.width / sizes.height
  camera.updateProjectionMatrix()

  renderer.setSize(sizes.width, sizes.height)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})

/* ========== 15. BOUCLE D'ANIMATION ========== */
const label = document.querySelector('.label')
const tempVector = new THREE.Vector3() // vecteur réutilisé pour les calculs
let previousTime = 0

renderer.setAnimationLoop((time) => {
  const elapsed = time / 1000
  const delta = elapsed - previousTime
  previousTime = elapsed

  // a) Tout le bureau flotte lentement
  workshop.position.y = Math.sin(elapsed * 0.5) * 0.04

  // b) Survol : quel objet est sous la souris ?
  const hovered = pickItem()
  document.body.style.cursor = hovered ? 'pointer' : ''

  // c) Chaque objet flotte, et se soulève quand on le survole
  items.forEach((item) => {
    const targetHover = item === hovered ? 1 : 0
    item.hover += (targetHover - item.hover) * 0.12 // lerp
    item.object.position.y =
      item.baseY + 0.03 + Math.sin(elapsed * 1.3 + item.phase) * 0.02 + item.hover * 0.06
    item.object.scale.setScalar(1 + item.hover * 0.05)
  })

  // d) L'étiquette HTML suit l'objet survolé
  if (hovered) {
    hovered.object.getWorldPosition(tempVector)
    tempVector.y += hovered.labelHeight
    tempVector.project(camera) // 3D -> coordonnées écran (-1 à 1)
    const x = ((tempVector.x + 1) / 2) * sizes.width
    const y = ((1 - tempVector.y) / 2) * sizes.height
    label.textContent = hovered.name
    label.style.transform = `translate(${x}px, ${y}px) translate(-50%, -100%)`
    label.classList.add('is-visible')
  } else {
    label.classList.remove('is-visible')
  }

  // e) La lumière de l'écran s'intensifie quand le curseur s'en approche
  monitor.screen.getWorldPosition(tempVector)
  tempVector.project(camera)
  const distance = Math.hypot(tempVector.x - pointer.x, tempVector.y - pointer.y)
  const proximity = THREE.MathUtils.clamp(1 - distance / 1.2, 0, 1)
  const targetIntensity = params.screenLight * (0.5 + proximity * 1.5)
  screenLight.intensity += (targetIntensity - screenLight.intensity) * 0.08
  monitor.screen.material.color.setScalar(0.7 + proximity * 0.3)

  // f) L'ampoule brille au même rythme que le faisceau
  lamp.bulbMaterial.emissiveIntensity = (lamp.spotLight.intensity / params.lampIntensity) * 4

  // g) La poussière tourne doucement
  dust.rotation.y += delta * 0.03

  // h) Parallaxe : le chariot de la caméra suit la souris
  cameraGroup.position.x += (cursor.x * params.parallax - cameraGroup.position.x) * params.smoothness
  cameraGroup.position.y += (-cursor.y * params.parallax - cameraGroup.position.y) * params.smoothness

  // i) Hors vol, la caméra rejoint le rail en douceur (lerp)
  if (!flight.tween) {
    camera.position.lerp(rail.position, 0.1)
    lookTarget.lerp(rail.target, 0.1)
  }

  // j) La caméra regarde toujours sa cible
  camera.lookAt(lookTarget)

  renderer.render(scene, camera)
})

/* ========== 16. PANNEAU DE RÉGLAGES (développement uniquement) ========== */
if (import.meta.env.DEV) {
  const gui = new GUI({ title: 'Réglages atelier' })

  gui
    .add(params, 'lampIntensity', 0, 80, 1)
    .name('Lampe')
    .onChange((value) => {
      lamp.spotLight.intensity = value
    })
  gui
    .addColor(params, 'lampColor')
    .name('Couleur lampe')
    .onChange((value) => lamp.spotLight.color.set(value))
  gui.add(ambientLight, 'intensity', 0, 2, 0.01).name('Ambiante')
  gui.add(rimLight, 'intensity', 0, 5, 0.1).name('Contre-jour')
  gui.add(params, 'screenLight', 0, 10, 0.1).name('Lumière écran')
  gui
    .add(params, 'exposure', 0.3, 2.5, 0.01)
    .name('Exposition')
    .onChange((value) => {
      renderer.toneMappingExposure = value
    })
  gui
    .add(params, 'envIntensity', 0, 1.5, 0.01)
    .name('Reflets environnement')
    .onChange((value) => {
      scene.environmentIntensity = value
    })
  gui.add(params, 'parallax', 0, 1, 0.01).name('Parallaxe')

  // Touche H : afficher ou cacher le panneau
  let guiVisible = true
  window.addEventListener('keydown', (event) => {
    if (event.key === 'h') {
      guiVisible = !guiVisible
      gui.show(guiVisible)
    }
  })
}
