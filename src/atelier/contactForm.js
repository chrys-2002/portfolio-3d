/*
 * contactForm.js — Le formulaire de contact, l'écran du téléphone qui réagit,
 * et l'avion en papier qui s'envole quand le message part.
 */
import * as THREE from 'three'
import gsap from 'gsap'

const GOLD = '#d4af37'

/* ========== L'ÉCRAN DU TÉLÉPHONE, SELON L'ÉTAT DU FORMULAIRE ========== */
// États possibles : 'idle' (repos), 'typing' (en train d'écrire), 'sending', 'sent', 'error'
function drawPhoneScreen(ctx, state, { name = '', length = 0 } = {}) {
  const w = 512
  const h = 1024

  const gradient = ctx.createLinearGradient(0, 0, 0, h)
  gradient.addColorStop(0, '#1a1405')
  gradient.addColorStop(1, '#050505')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, w, h)
  ctx.textAlign = 'center'

  if (state === 'idle') {
    // L'écran d'origine : heure + notification + bouton
    ctx.fillStyle = '#f2f2f2'
    ctx.font = '600 120px Inter, sans-serif'
    ctx.fillText('09:41', w / 2, 260)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.08)'
    ctx.beginPath()
    ctx.roundRect(40, 420, 432, 150, 28)
    ctx.fill()
    ctx.textAlign = 'left'
    ctx.fillStyle = GOLD
    ctx.font = 'bold 38px Inter, sans-serif'
    ctx.fillText('Nouveau message', 80, 485)
    ctx.fillStyle = '#bdbdbd'
    ctx.font = '30px Inter, sans-serif'
    ctx.fillText('Travaillons ensemble ?', 80, 535)
    ctx.textAlign = 'center'
    ctx.fillStyle = GOLD
    ctx.beginPath()
    ctx.roundRect(156, 860, 200, 70, 35)
    ctx.fill()
    ctx.fillStyle = '#0a0a0c'
    ctx.font = 'bold 30px Inter, sans-serif'
    ctx.fillText('CONTACT', w / 2, 906)
    return
  }

  if (state === 'typing') {
    ctx.fillStyle = GOLD
    ctx.font = '800 56px Syne, sans-serif'
    ctx.fillText('Écris-moi', w / 2, 170)
    ctx.fillStyle = '#9a9aa2'
    ctx.font = '30px Inter, sans-serif'
    ctx.fillText(name ? `De : ${name.slice(0, 18)}` : 'Nouveau message', w / 2, 240)

    // Une "bulle" qui grandit avec la longueur du message
    const lines = Math.min(8, 1 + Math.floor(length / 25))
    ctx.fillStyle = 'rgba(255, 255, 255, 0.08)'
    ctx.beginPath()
    ctx.roundRect(50, 320, 412, 60 + lines * 44, 28)
    ctx.fill()
    ctx.fillStyle = 'rgba(242, 242, 242, 0.35)'
    for (let i = 0; i < lines; i++) {
      const width = i === lines - 1 ? 120 + ((length * 7) % 200) : 330
      ctx.beginPath()
      ctx.roundRect(84, 352 + i * 44, width, 16, 8)
      ctx.fill()
    }
    ctx.fillStyle = GOLD
    ctx.font = '30px Inter, sans-serif'
    ctx.fillText(`${length} caractères`, w / 2, 860)
    return
  }

  // Écrans d'état : une icône, un titre, un sous-titre
  const screens = {
    sending: ['…', 'Envoi en cours', 'Ton message décolle'],
    sent: ['✓', 'Envoyé !', 'Merci, je te réponds vite'],
    error: ['!', 'Oups…', "L'envoi a échoué, réessaie"],
  }
  const [icon, title, subtitle] = screens[state]
  ctx.strokeStyle = state === 'error' ? '#ff6b5f' : GOLD
  ctx.lineWidth = 8
  ctx.beginPath()
  ctx.arc(w / 2, 400, 110, 0, Math.PI * 2)
  ctx.stroke()
  ctx.fillStyle = state === 'error' ? '#ff6b5f' : GOLD
  ctx.font = 'bold 120px Inter, sans-serif'
  ctx.fillText(icon, w / 2, 445)
  ctx.fillStyle = '#f2f2f2'
  ctx.font = '800 54px Syne, sans-serif'
  ctx.fillText(title, w / 2, 640)
  ctx.fillStyle = '#9a9aa2'
  ctx.font = '30px Inter, sans-serif'
  ctx.fillText(subtitle, w / 2, 700)
}

export function createPhoneScreen(screenMesh) {
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 1024
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  screenMesh.material.map = texture
  screenMesh.material.needsUpdate = true

  function show(state, details) {
    drawPhoneScreen(canvas.getContext('2d'), state, details)
    texture.needsUpdate = true
  }
  show('idle')
  document.fonts.load('800 40px Syne').then(() => show('idle'), () => {})
  return { show }
}

/* ========== L'AVION EN PAPIER ========== */
function createPaperPlaneGeometry() {
  // 4 triangles : aile gauche, aile droite, et la quille (2 faces)
  // Le nez pointe vers -Z
  const vertices = new Float32Array([
    0, 0, -0.16,   -0.11, 0, 0.09,    0, 0.004, 0.06,
    0, 0, -0.16,    0, 0.004, 0.06,   0.11, 0, 0.09,
    0, 0, -0.16,    0, 0.004, 0.06,   0, -0.035, 0.06,
    0, 0, -0.16,    0, -0.035, 0.06,  0, 0.004, 0.06,
  ])
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3))
  geometry.computeVertexNormals()
  return geometry
}

export function createPaperPlane(scene) {
  const plane = new THREE.Mesh(
    createPaperPlaneGeometry(),
    new THREE.MeshStandardMaterial({
      color: '#f3ecdc',
      side: THREE.DoubleSide,
      roughness: 0.8,
      flatShading: true, // facettes nettes : effet papier plié
      transparent: true,
    })
  )
  plane.castShadow = true
  plane.visible = false
  scene.add(plane)

  // La traînée pointillée dorée
  const TRAIL_POINTS = 120
  const trailGeometry = new THREE.BufferGeometry()
  trailGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(TRAIL_POINTS * 3), 3))
  const trail = new THREE.Line(
    trailGeometry,
    new THREE.LineDashedMaterial({ color: GOLD, dashSize: 0.03, gapSize: 0.025, transparent: true })
  )
  trail.visible = false
  scene.add(trail)

  const tangent = new THREE.Vector3()
  const lookPoint = new THREE.Vector3()

  // start : point de départ (le téléphone), en coordonnées du monde
  function fly(start) {
    // Trajet : monte, s'éloigne vers le fond, puis disparaît dans la nuit
    const curve = new THREE.CatmullRomCurve3([
      start.clone(),
      start.clone().add(new THREE.Vector3(-0.1, 0.3, 0.15)), // petit bond vers le visiteur
      start.clone().add(new THREE.Vector3(-0.45, 0.7, -0.25)), // virage vers le centre du bureau
      start.clone().add(new THREE.Vector3(-0.9, 1.4, -2.3)), // s'éloigne
      start.clone().add(new THREE.Vector3(-2, 2.8, -6.5)), // disparaît dans la nuit
    ])

    // On précalcule la traînée, puis on la "dévoile" au fur et à mesure (setDrawRange)
    trailGeometry.setFromPoints(curve.getPoints(TRAIL_POINTS - 1))
    trail.computeLineDistances()
    trailGeometry.setDrawRange(0, 0)
    trail.material.opacity = 1
    trail.visible = true

    plane.visible = true
    plane.material.opacity = 1
    const flight = { progress: 0 }

    gsap
      .timeline({ onComplete: () => { plane.visible = false; trail.visible = false } })
      // 1. L'avion se "plie" : il passe de plat (ailes à 0) à sa forme finale
      .fromTo(plane.scale, { x: 0.01, y: 1.3, z: 0.4 }, { x: 1.3, z: 1.3, duration: 0.5, ease: 'back.out(2)' }, 0)
      // 2. Il vole le long de la courbe
      .to(flight, {
        progress: 1,
        duration: 4.2,
        ease: 'power1.in', // démarre doucement puis accélère
        onUpdate: () => {
          const p = flight.progress
          curve.getPointAt(p, plane.position)
          curve.getTangentAt(p, tangent)
          // Le nez (axe -Z) suit la direction du vol
          plane.lookAt(lookPoint.copy(plane.position).sub(tangent))
          plane.rotateZ(Math.sin(p * Math.PI * 3) * 0.35) // petits roulis
          trailGeometry.setDrawRange(0, Math.floor(p * TRAIL_POINTS))
        },
      }, 0.3)
      // 3. Il disparaît au loin, la traînée s'efface
      .to(plane.material, { opacity: 0, duration: 0.6 }, 3.9)
      .to(trail.material, { opacity: 0, duration: 1 }, 3.6)
  }

  return { fly }
}

/* ========== LE FORMULAIRE ========== */
export function createContactForm({ form, status, onStateChange }) {
  const accessKey = import.meta.env.VITE_WEB3FORMS_KEY
  const submitButton = form.querySelector('button[type="submit"]')

  function setStatus(text, type = '') {
    status.textContent = text
    status.dataset.type = type // permet de colorer le message en CSS
  }

  // Pendant la saisie, le téléphone 3D affiche un aperçu
  form.addEventListener('input', () => {
    const data = new FormData(form)
    onStateChange('typing', { name: data.get('name') || '', length: (data.get('message') || '').length })
  })

  form.addEventListener('submit', async (event) => {
    event.preventDefault() // on empêche le rechargement de la page

    if (!accessKey) {
      setStatus('Formulaire non configuré (clé manquante).', 'error')
      return
    }

    const data = Object.fromEntries(new FormData(form))
    submitButton.disabled = true
    setStatus('Envoi en cours…')
    onStateChange('sending')

    try {
      const response = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          access_key: accessKey,
          subject: `Nouveau message de ${data.name} (portfolio)`,
          from_name: 'Portfolio Bi Chrys',
          ...data,
        }),
      })
      const result = await response.json()
      if (!result.success) throw new Error(result.message)

      setStatus('Message envoyé, merci ! Je te réponds très vite.', 'success')
      onStateChange('sent')
      form.reset()
    } catch (error) {
      console.error(error)
      setStatus("L'envoi a échoué. Réessaie, ou écris-moi directement par email.", 'error')
      onStateChange('error')
    } finally {
      submitButton.disabled = false
    }
  })
}
