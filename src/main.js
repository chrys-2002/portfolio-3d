import './style.css'
import * as THREE from 'three'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import GUI from 'lil-gui'

gsap.registerPlugin(ScrollTrigger)

/* ========== 0. PARAMÈTRES ========== */
// Toutes les valeurs réglables sont rassemblées ici
const params = {
  color: '#d4af37',
  rotationSpeed: 0.3,
  particlesCount: 1500,
  particlesSize: 0.02,
  particlesSpread: 20,
  parallax: 0.6,
  smoothness: 0.05,
}

/* ========== 1. BASE ========== */
const canvas = document.querySelector('#webgl')
const scene = new THREE.Scene()

const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
}

/* ========== 2. CAMÉRA ========== */
// Le groupe suit la souris (parallaxe), la caméra reste à sa place dedans
const cameraGroup = new THREE.Group()
scene.add(cameraGroup)

const camera = new THREE.PerspectiveCamera(45, sizes.width / sizes.height, 0.1, 100)
camera.position.z = 6
cameraGroup.add(camera)

/* ========== 3. RENDERER ========== */
const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  alpha: true,
})
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
renderer.toneMapping = THREE.ACESFilmicToneMapping

/* ========== 4. OBJET PRINCIPAL ========== */
// heroGroup est déplacé par le scroll, mesh tourne sur lui-même
const heroGroup = new THREE.Group()
scene.add(heroGroup)

const geometry = new THREE.TorusKnotGeometry(1, 0.35, 200, 32)
const material = new THREE.MeshStandardMaterial({
  color: params.color,
  metalness: 0.85,
  roughness: 0.25,
})
const mesh = new THREE.Mesh(geometry, material)
heroGroup.add(mesh)

/* ========== 5. LUMIÈRES ========== */
const ambientLight = new THREE.AmbientLight('#ffffff', 0.4)
scene.add(ambientLight)

const keyLight = new THREE.DirectionalLight('#ffffff', 2.5)
keyLight.position.set(3, 4, 5)
scene.add(keyLight)

const rimLight = new THREE.PointLight('#4f7cff', 30)
rimLight.position.set(-4, -2, 2)
scene.add(rimLight)

/* ========== 6. PARTICULES ========== */
let particlesGeometry = null
let particlesMaterial = null
let particles = null

function generateParticles() {
  // Si des particules existent déjà, on les détruit proprement
  if (particles !== null) {
    particlesGeometry.dispose()
    particlesMaterial.dispose()
    scene.remove(particles)
  }

  const positions = new Float32Array(params.particlesCount * 3)

  for (let i = 0; i < params.particlesCount * 3; i++) {
    positions[i] = (Math.random() - 0.5) * params.particlesSpread
  }

  particlesGeometry = new THREE.BufferGeometry()
  particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))

  particlesMaterial = new THREE.PointsMaterial({
    size: params.particlesSize,
    color: '#ffffff',
    transparent: true,
    opacity: 0.6,
  })

  particles = new THREE.Points(particlesGeometry, particlesMaterial)
  scene.add(particles)
}

generateParticles()

/* ========== 7. SOURIS ========== */
const cursor = { x: 0, y: 0 }

window.addEventListener('mousemove', (event) => {
  // Valeurs entre -0.5 et 0.5, 0 au centre de l'écran
  cursor.x = event.clientX / sizes.width - 0.5
  cursor.y = event.clientY / sizes.height - 0.5
})

/* ========== 8. REDIMENSIONNEMENT ========== */
window.addEventListener('resize', () => {
  sizes.width = window.innerWidth
  sizes.height = window.innerHeight

  camera.aspect = sizes.width / sizes.height
  camera.updateProjectionMatrix()

  renderer.setSize(sizes.width, sizes.height)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})

/* ========== 9. ANIMATION AU SCROLL ========== */
const tl = gsap.timeline({
  scrollTrigger: {
    trigger: '.content',
    start: 'top top',
    end: 'bottom bottom',
    scrub: 1,
  },
})

tl.to(heroGroup.position, { x: -2, ease: 'none' })
  .to(heroGroup.scale, { x: 0.8, y: 0.8, z: 0.8, ease: 'none' }, '<')
  .to(heroGroup.position, { x: 2, ease: 'none' })
  .to(material.color, { r: 0.8, g: 0.8, b: 0.85, ease: 'none' }, '<')
  .to(heroGroup.position, { x: 0, z: -2, ease: 'none' })
  .to(heroGroup.scale, { x: 1, y: 1, z: 1, ease: 'none' }, '<')

/* ========== 10. BOUCLE D'ANIMATION ========== */
let previousTime = 0

renderer.setAnimationLoop((time) => {
  const elapsed = time / 500
  const delta = elapsed - previousTime // temps depuis l'image précédente
  previousTime = elapsed

  mesh.rotation.x += delta * params.rotationSpeed * 0.66
  mesh.rotation.y += delta * params.rotationSpeed

  particles.rotation.y += delta * 0.02

  // Parallaxe : on rattrape la cible d'un petit pourcentage à chaque image (lerp)
  const targetX = cursor.x * params.parallax
  const targetY = -cursor.y * params.parallax
  cameraGroup.position.x += (targetX - cameraGroup.position.x) * params.smoothness
  cameraGroup.position.y += (targetY - cameraGroup.position.y) * params.smoothness

  renderer.render(scene, camera)
})

/* ========== 11. PANNEAU DE RÉGLAGES ========== */
// Le panneau n'existe qu'en développement, jamais sur le site en ligne
if (import.meta.env.DEV) {
  const gui = new GUI({ title: 'Réglages' })

  // --- Objet ---
  const objectFolder = gui.addFolder('Objet')
  objectFolder
    .addColor(params, 'color')
    .name('Couleur')
    .onChange(() => material.color.set(params.color))
  objectFolder.add(material, 'metalness', 0, 1, 0.01).name('Métal')
  objectFolder.add(material, 'roughness', 0, 1, 0.01).name('Rugosité')
  objectFolder.add(params, 'rotationSpeed', 0, 2, 0.01).name('Vitesse de rotation')
  objectFolder.add(material, 'wireframe').name('Fil de fer')

  // --- Lumières ---
  const lightsFolder = gui.addFolder('Lumières')
  lightsFolder.add(ambientLight, 'intensity', 0, 3, 0.01).name('Ambiante')
  lightsFolder.add(keyLight, 'intensity', 0, 10, 0.1).name('Principale')
  lightsFolder.add(keyLight.position, 'x', -10, 10, 0.1).name('Principale : X')
  lightsFolder.add(keyLight.position, 'y', -10, 10, 0.1).name('Principale : Y')
  lightsFolder.add(rimLight, 'intensity', 0, 100, 1).name('Contour')

  // --- Particules ---
  const particlesFolder = gui.addFolder('Particules')
  particlesFolder
    .add(params, 'particlesCount', 100, 10000, 100)
    .name('Nombre')
    .onFinishChange(generateParticles)
  particlesFolder
    .add(params, 'particlesSpread', 5, 50, 1)
    .name('Étendue')
    .onFinishChange(generateParticles)
  particlesFolder
    .add(params, 'particlesSize', 0.005, 0.1, 0.001)
    .name('Taille')
    .onChange(() => {
      particlesMaterial.size = params.particlesSize
    })

  // --- Caméra ---
  const cameraFolder = gui.addFolder('Caméra')
  cameraFolder.add(params, 'parallax', 0, 2, 0.01).name('Parallaxe')
  cameraFolder.add(params, 'smoothness', 0.01, 0.3, 0.01).name('Fluidité')
  cameraFolder
    .add(camera, 'fov', 20, 90, 1)
    .name('Champ de vision')
    .onChange(() => camera.updateProjectionMatrix())

  // Touche H : afficher ou cacher le panneau
  let guiVisible = true
  window.addEventListener('keydown', (event) => {
    if (event.key === 'h') {
      guiVisible = !guiVisible
      gui.show(guiVisible)
    }
  })
}
