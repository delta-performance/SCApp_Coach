const fs = require('fs')
const path = require('path')

const ROOT = __dirname
const RENDERER = path.join(ROOT, '..', 'renderer')
const PAGES_DIR = path.join(ROOT, 'pages')
const MANIFEST = path.join(ROOT, 'pages.json')

// Pages du renderer à ne pas exposer dans l'iPad app
const BLACKLIST = [
  'shell.html',
  'login.html',
  'splash.html',
  'change-password.html',
  'reset-password.html',
  'admin-ipad.html',
  'error-toast.js' // js, mais par sécurité
]

// Déduction par défaut des groupes de permissions en fonction du fichier
const GROUP_MAP = {
  'index.html': 'roster',
  'absences.html': 'planning',
  'planning.html': 'planning',
  'planning-blesses.html': 'medical',
  'medical.html': 'medical',
  'wellness.html': 'wellness',
  'suivi-poids.html': 'wellness',
  'seances.html': 'muscu',
  'exercices.html': 'muscu',
  'performances.html': 'muscu',
  'profil-force-vitesse.html': 'muscu',
  'fiches-seances.html': 'fiches',
  'equipes.html': 'equipes',
  'gps.html': 'gps',
  'gps-match.html': 'gps',
  'gps-planif.html': 'gps',
  'tv.html': null,
  'change-password.html': null,
  'reset-password.html': null
}

// Mapping icône par nom de fichier (améliorable au besoin)
const ICON_MAP = {
  'index.html': '👤',
  'planning.html': '📅',
  'absences.html': '🚫',
  'planning-blesses.html': '🩺',
  'medical.html': '🏥',
  'wellness.html': '💚',
  'suivi-poids.html': '⚖️',
  'seances.html': '🏋️',
  'exercices.html': '📝',
  'performances.html': '⚡',
  'profil-force-vitesse.html': '📈',
  'fiches-seances.html': '🏉',
  'equipes.html': '👥',
  'gps.html': '📊',
  'gps-match.html': '🏆',
  'gps-planif.html': '📡',
  'tv.html': '📺',
  'energetique.html': '🏃'
}

const COLOR_PALETTE = ['#FECC00', '#4CAF8F', '#5B9CF6', '#F08055', '#C778DD', '#378ADD', '#E24B4A', '#9CCC65', '#FF8A65']

if (!fs.existsSync(PAGES_DIR)) fs.mkdirSync(PAGES_DIR, { recursive: true })

function metaValue(html, name) {
  const m = html.match(new RegExp(`<meta[^>]+name=["']${name}["'][^>]+content=["']([^"']*)["']`, 'i'))
  return m ? m[1] : null
}

function escapeHtmlTitle(title) {
  return title.replace(/[<>]/g, '')
}

function titleCase(str) {
  return str.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
}

// 1. Scanner automatiquement le renderer
const files = fs.readdirSync(RENDERER)
  .filter(f => f.endsWith('.html') && !BLACKLIST.includes(f) && !f.includes('.bak') && !f.includes('.backup') && !f.includes(' '))
  .sort()

const pages = files.map((file, index) => {
  const src = path.join(RENDERER, file)
  const html = fs.readFileSync(src, 'utf8')

  const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i)
  const rawTitle = (titleMatch ? titleMatch[1] : file.replace(/\.html$/, '')).trim()

  const title = metaValue(html, 'ipad-title') || rawTitle || titleCase(file.replace(/\.html$/, ''))
  const icon = metaValue(html, 'ipad-icon') || ICON_MAP[file] || '▶'
  const color = metaValue(html, 'ipad-color') || COLOR_PALETTE[index % COLOR_PALETTE.length]

  const groupMeta = metaValue(html, 'ipad-group')
  let group = null
  if (groupMeta !== null) {
    group = groupMeta === 'none' ? null : groupMeta
  } else {
    group = GROUP_MAP[file] !== undefined ? GROUP_MAP[file] : null
  }

  const sub = metaValue(html, 'ipad-sub') || ''

  return { file, title: escapeHtmlTitle(title), icon, color, group, sub }
})

// 2. Écrire le manifeste automatique
fs.writeFileSync(MANIFEST, JSON.stringify(pages, null, 2))
console.log(`[build] ${pages.length} pages découvertes → ${MANIFEST}`)

// 3. Copier / filtrer chaque page
for (const page of pages) {
  const src = path.join(RENDERER, page.file)
  const dest = path.join(PAGES_DIR, page.file)

  if (!fs.existsSync(src)) {
    console.warn(`[build] source manquante: ${src}`)
    continue
  }

  let html = fs.readFileSync(src, 'utf8')

  // Base href pour les ressources statiques
  if (!/<base\s+href=/i.test(html)) {
    html = html.replace(/<head([^>]*)>/i, (m, attrs) => `<head${attrs}>\n  <base href="../renderer/">`)
  } else {
    html = html.replace(/<base\s+href="[^"]*"/i, '<base href="../renderer/"')
  }

  // Viewport / Apple
  if (!/name="viewport"/i.test(html)) {
    html = html.replace(/<head([^>]*)>/i, (m, attrs) => `<head${attrs}>\n  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">`)
  }
  if (!/apple-mobile-web-app-capable/i.test(html)) {
    html = html.replace(/<head([^>]*)>/i, (m, attrs) => `<head${attrs}>\n  <meta name="apple-mobile-web-app-capable" content="yes">`)
  }

  // Auth guard
  if (!/auth-guard\.js/.test(html)) {
    html = html.replace(/<\/head>/i, '  <script type="module" src="../auth-guard.js"></script>\n</head>')
  }

  // Différer onAuthStateChanged pour que les pages définissent leurs fonctions avant exécution
  if (!/__deferredOnAuthStateChanged/.test(html)) {
    html = html.replace(/<\/head>/i, '  <script type="module">import { onAuthStateChanged as __o } from \'../supabase-adapter.js\'; window.__deferredOnAuthStateChanged = (auth, cb) => __o(auth, (user) => setTimeout(() => cb(user), 0));</script>\n</head>')
    html = html.replace(/\bonAuthStateChanged\s*\(/g, 'window.__deferredOnAuthStateChanged(')
  }

  // Filtre iPad / iPhone (chemins relatifs à la racine SCApp_Coach)
  if (!/mobile\.css/.test(html)) {
    html = html.replace(/<\/head>/i, '  <link rel="stylesheet" href="../mobile.css">\n</head>')
  }
  if (!/mobile\.js/.test(html)) {
    html = html.replace(/<\/head>/i, '  <script type="module" src="../mobile.js"></script>\n</head>')
  }

  // Les liens internes .html restent relatifs au dossier pages/
  // (les pages copiées sont au même niveau, pas besoin de viewer intermédiaire)

  // Réécriture des import ES modules : supabase-adapter passe par le bundle ipad-app,
  // les autres modules restent dans renderer/
  html = html.replace(/from\s+(['"])\.\/supabase-adapter\.js\1/g, 'from $1../supabase-adapter.js$1')
  html = html.replace(/from\s+(['"])\.\/([^'"]*)\1/g, 'from $1../renderer/$2$1')
  html = html.replace(/import\s*\(\s*(['"])\.\/supabase-adapter\.js\1\s*\)/g, 'import($1../supabase-adapter.js$1)')
  html = html.replace(/import\s*\(\s*(['"])\.\/([^'"]*)\1\s*\)/g, 'import($1../renderer/$2$1)')

  // Ajouter getApp uniquement dans l'import supabase-adapter qui contient initializeApp
  html = html.replace(/import\s*\{\s*([^}]*initializeApp[^}]*)\}\s*from\s+(['"])([^'"]*supabase-adapter[^'"]*)\2/g, (m, items, quote, src) => {
    if (/\bgetApp\b/.test(items)) return m
    return `import { getApp, ${items} } from ${quote}${src}${quote}`
  })

  // Empêcher le double init Firebase : initializeApp(firebaseConfig) devient idempotent
  html = html.replace(/initializeApp\s*\(\s*firebaseConfig\s*\)/g, "(() => { try { return getApp() } catch(e) { return initializeApp(firebaseConfig) } })()")

  // Titre
  const escapedTitle = escapeHtmlTitle(page.title)
  if (/<title>.*?<\/title>/i.test(html)) {
    html = html.replace(/<title>.*?<\/title>/i, `<title>${escapedTitle}</title>`)
  } else {
    html = html.replace(/<\/head>/i, `  <title>${escapedTitle}</title>\n</head>`)
  }

  fs.writeFileSync(dest, html)
  console.log(`[build] ${page.file} → pages/${page.file}`)
}

// 4. Nettoyer les pages qui n'existent plus dans le renderer
const builtFiles = fs.readdirSync(PAGES_DIR)
for (const f of builtFiles) {
  if (f.endsWith('.html') && !files.includes(f)) {
    fs.unlinkSync(path.join(PAGES_DIR, f))
    console.log(`[build] supprimé: pages/${f}`)
  }
}

// 5. Générer un manifest.json adapté à SCApp_Coach (GitHub Pages racine)
const ipadManifest = {
  name: "SCA Albi Performance - iPad",
  short_name: "SCA iPad",
  description: "Application iPad pour le Sporting Club Albigeois",
  start_url: "./index.html",
  scope: "./",
  display: "standalone",
  orientation: "any",
  background_color: "#0f0f0f",
  theme_color: "#FECC00",
  lang: "fr",
  dir: "ltr",
  icons: [
    { src: "icon-192.png", sizes: "192x192", type: "image/png" },
    { src: "icon-512.png", sizes: "512x512", type: "image/png" }
  ]
}
fs.writeFileSync(path.join(ROOT, 'manifest.json'), JSON.stringify(ipadManifest, null, 2))
console.log('[build] manifest.json généré')

// 6. Copier les icônes du player-app à la racine de l'app iPad
const icon192 = path.join(ROOT, '..', 'player-app', 'icon-192.png')
const icon512 = path.join(ROOT, '..', 'player-app', 'icon-512.png')
if (fs.existsSync(icon192)) fs.copyFileSync(icon192, path.join(ROOT, 'icon-192.png'))
if (fs.existsSync(icon512)) fs.copyFileSync(icon512, path.join(ROOT, 'icon-512.png'))
console.log('[build] icônes copiées')

console.log('[build] terminé')
