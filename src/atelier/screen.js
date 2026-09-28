/*
 * screen.js — L'écran qui tape du code en direct, et le clavier qui suit.
 * L'écran est un <canvas> 2D redessiné à chaque nouvelle lettre ;
 * à chaque frappe, il prévient le clavier qui enfonce une touche.
 */
import * as THREE from 'three'

/* ========== LE CODE QUI S'ÉCRIT À L'ÉCRAN ========== */
const CODE = [
  '// projets.js — Bi Chrys',
  "import { Developpeur } from './boli'",
  '',
  'const moi = new Developpeur({',
  "  nom: 'Boli Bi Saint Chryst',",
  "  role: 'Dev & Data Analyst junior',",
  "  ville: 'Abidjan',",
  "  stack: ['React', 'Next.js', 'Flutter', 'Python'],",
  "  data: ['Power BI', 'MySQL', 'Excel'],",
  '})',
  '',
  'const projets = [',
  "  { nom: 'KARHON Assurances', tech: 'Next.js' },",
  "  { nom: 'Appli bancaire', tech: 'Flutter + Firebase' },",
  "  { nom: 'Prototype de gestion', tech: 'Flutter' },",
  "  { nom: 'Portfolio 3D', tech: 'Three.js' },",
  ']',
  '',
  'projets.forEach((projet) => {',
  '  moi.construire(projet)',
  '})',
  '',
  'export default moi',
]

/* ========== COLORATION SYNTAXIQUE ========== */
const COLORS = {
  keyword: '#c792ea', // violet : mots-clés
  string: '#e6c07b', // doré : textes entre guillemets
  number: '#f78c6c', // orange : nombres
  punctuation: '#89ddff', // cyan : ponctuation
  comment: '#5c6370', // gris : commentaires
  default: '#d8dee9', // blanc cassé : le reste
}

const KEYWORDS = ['import', 'from', 'const', 'new', 'export', 'default', 'function', 'return']

// Découpe une ligne en morceaux ("tokens") qui ont chacun leur couleur
function tokenize(line) {
  if (line.trim().startsWith('//')) return [{ text: line, color: COLORS.comment }]

  const tokens = []
  // Chaque groupe entre parenthèses reconnaît un type de morceau
  const regex = /('[^']*')|(\b\d+\b)|(\b[a-zA-Z_]\w*\b)|(\s+)|([^\w\s'])/g
  let match
  while ((match = regex.exec(line)) !== null) {
    const [text, string, number, word, , punctuation] = match
    let color = COLORS.default
    if (string) color = COLORS.string
    else if (number) color = COLORS.number
    else if (word && KEYWORDS.includes(word)) color = COLORS.keyword
    else if (punctuation) color = COLORS.punctuation
    tokens.push({ text, color })
  }
  return tokens
}

// Nombre d'espaces au début d'une ligne (l'indentation)
function indentOf(line) {
  return line.search(/\S|$/)
}

/* ========== L'ÉCRAN VIVANT ========== */
export function createLiveScreen() {
  const canvas = document.createElement('canvas')
  canvas.width = 1024
  canvas.height = 576
  const ctx = canvas.getContext('2d')

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace

  const lines = CODE.map(tokenize) // on découpe tout une seule fois, au départ
  const LINE_HEIGHT = 34
  const MAX_VISIBLE = 13 // au-delà, le texte défile vers le haut

  // L'état de la frappe : où en est-on ?
  const state = {
    line: 0, // ligne en cours
    char: 0, // nombre de caractères déjà tapés sur cette ligne
    timer: 0.8, // temps avant la prochaine frappe
    pause: 0, // pause à la fin du fichier
    caretVisible: true,
    caretTimer: 0,
  }

  // Les fonctions à prévenir à chaque frappe (le clavier, par exemple)
  const keystrokeListeners = []
  function emit(type) {
    keystrokeListeners.forEach((listener) => listener(type))
  }

  function draw() {
    const { width, height } = canvas

    // Fond
    const gradient = ctx.createLinearGradient(0, 0, 0, height)
    gradient.addColorStop(0, '#0d1b33')
    gradient.addColorStop(1, '#050a14')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, width, height)

    // Barre de titre + pastilles
    ctx.fillStyle = 'rgba(255, 255, 255, 0.04)'
    ctx.fillRect(0, 0, width, 64)
    const dots = ['#ff5f56', '#ffbd2e', '#27c93f']
    dots.forEach((color, i) => {
      ctx.fillStyle = color
      ctx.beginPath()
      ctx.arc(40 + i * 30, 32, 9, 0, Math.PI * 2)
      ctx.fill()
    })

    // Onglet du fichier
    ctx.fillStyle = 'rgba(255, 255, 255, 0.07)'
    ctx.fillRect(140, 12, 180, 52)
    ctx.fillStyle = '#d4af37'
    ctx.font = '600 22px Consolas, "Courier New", monospace'
    ctx.fillText('projets.js', 160, 46)

    // Les lignes de code visibles
    ctx.font = '24px Consolas, "Courier New", monospace'
    const lastLine = Math.min(state.line, CODE.length - 1)
    const firstLine = Math.max(0, lastLine - MAX_VISIBLE + 1)

    for (let i = firstLine; i <= lastLine; i++) {
      const y = 110 + (i - firstLine) * LINE_HEIGHT

      // Numéro de ligne, aligné à droite
      ctx.fillStyle = '#3b4252'
      ctx.textAlign = 'right'
      ctx.fillText(String(i + 1), 70, y)
      ctx.textAlign = 'left'

      // Les lignes déjà finies s'affichent en entier, la ligne en cours partiellement
      const visibleChars = i < state.line ? Infinity : state.char
      let x = 95
      let count = 0
      for (const token of lines[i]) {
        if (count >= visibleChars) break
        const text = token.text.slice(0, visibleChars - count)
        ctx.fillStyle = token.color
        ctx.fillText(text, x, y)
        x += ctx.measureText(text).width
        count += token.text.length
      }

      // Le curseur de frappe
      if (i === state.line && state.caretVisible) {
        ctx.fillStyle = '#d4af37'
        ctx.fillRect(x + 2, y - 22, 12, 28)
      }
    }
  }

  // Tape UNE étape : un caractère, ou un retour à la ligne
  function typeNext() {
    const current = CODE[state.line]

    if (state.char < current.length) {
      const character = current[state.char]
      state.char++
      // Rythme humain : chaque frappe a un délai un peu différent
      state.timer += character === ' ' ? 0.03 : 0.035 + Math.random() * 0.06
      emit(character === ' ' ? 'space' : 'char')
    } else {
      // Fin de ligne : touche Entrée
      state.line++
      emit('enter')
      state.timer += 0.2 + Math.random() * 0.3 // petit temps de "réflexion"

      if (state.line >= CODE.length) {
        state.pause = 3.5 // fichier terminé : on admire 3,5 s
      } else {
        // Comme un vrai éditeur, l'indentation apparaît toute seule
        state.char = indentOf(CODE[state.line])
      }
    }

    // Pendant la frappe, le curseur reste allumé
    state.caretVisible = true
    state.caretTimer = 0
  }

  function update(delta) {
    delta = Math.min(delta, 0.1) // si l'onglet était caché, on évite de tout taper d'un coup
    let changed = false

    // Clignotement du curseur toutes les 0,5 s
    state.caretTimer += delta
    if (state.caretTimer > 0.5) {
      state.caretTimer = 0
      state.caretVisible = !state.caretVisible
      changed = true
    }

    if (state.pause > 0) {
      state.pause -= delta
      if (state.pause <= 0) {
        // On recommence depuis le début
        state.line = 0
        state.char = 0
        state.timer = 0.5
        changed = true
      }
    } else {
      state.timer -= delta
      // "while" : si l'image a duré longtemps, on rattrape plusieurs frappes
      while (state.timer <= 0 && state.pause <= 0) {
        typeNext()
        changed = true
      }
    }

    // On ne redessine (et on ne renvoie à la carte graphique) que si quelque chose a changé
    if (changed) {
      draw()
      texture.needsUpdate = true
    }
  }

  draw()

  return {
    texture,
    update,
    onKeystroke: (listener) => keystrokeListeners.push(listener),
  }
}

/* ========== LE CLAVIER SYNCHRONISÉ ========== */
export function createKeyboardAnimator({ keys, rows, cols }) {
  const count = rows * cols
  const press = new Float32Array(count) // 0 = touche relevée, 1 = enfoncée

  // On lit la position de repos de chaque touche dans sa matrice
  const matrix = new THREE.Matrix4()
  const basePositions = []
  for (let i = 0; i < count; i++) {
    keys.getMatrixAt(i, matrix)
    basePositions.push(new THREE.Vector3().setFromMatrixPosition(matrix))
  }

  const dummy = new THREE.Object3D()
  const baseColor = new THREE.Color('#2b2b30')
  const glowColor = new THREE.Color('#d4af37')
  const tempColor = new THREE.Color()

  // Numéro d'une touche à partir de sa rangée et de sa colonne
  const keyIndex = (row, col) => row * cols + col

  function onKeystroke(type) {
    if (type === 'space') {
      // Barre d'espace : 4 touches du rang avant, au centre
      for (let col = 5; col <= 8; col++) press[keyIndex(rows - 1, col)] = 1
    } else if (type === 'enter') {
      press[keyIndex(1, cols - 1)] = 1 // à droite, comme la touche Entrée
    } else {
      // Une lettre : une touche au hasard dans les 3 premières rangées
      press[Math.floor(Math.random() * cols * (rows - 1))] = 1
    }
  }

  function update(delta) {
    let changed = false

    for (let i = 0; i < count; i++) {
      if (press[i] <= 0) continue // touche au repos : rien à faire

      press[i] = Math.max(0, press[i] - delta * 8) // remonte en environ 0,12 s

      // Position : la touche descend de 1,2 cm quand press = 1
      dummy.position.copy(basePositions[i])
      dummy.position.y -= press[i] * 0.012
      dummy.updateMatrix()
      keys.setMatrixAt(i, dummy.matrix)

      // Couleur : la touche s'illumine légèrement en doré
      tempColor.copy(baseColor).lerp(glowColor, press[i] * 0.6)
      keys.setColorAt(i, tempColor)

      changed = true
    }

    // On prévient la carte graphique uniquement si une touche a bougé
    if (changed) {
      keys.instanceMatrix.needsUpdate = true
      keys.instanceColor.needsUpdate = true
    }
  }

  return { onKeystroke, update }
}
