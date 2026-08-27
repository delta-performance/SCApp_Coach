import { initializeApp, getApps, getApp } from './supabase-adapter.js'
import { getAuth, onAuthStateChanged, getFirestore, doc, onSnapshot } from './supabase-adapter.js'

const firebaseConfig = {
  apiKey: "AIzaSyCvMs-5LX9Ivk3OkzUR3iz9Kk1E5b9_7Vk",
  authDomain: "delta-rugby-app.firebaseapp.com",
  projectId: "delta-rugby-app",
  storageBucket: "delta-rugby-app.firebasestorage.app",
  messagingSenderId: "61187079762",
  appId: "1:61187079762:web:56cd1eaa8beb9e1a2ee98b"
}

const app = getApps().length ? getApp() : initializeApp(firebaseConfig)
const auth = getAuth(app)
const db = getFirestore(app)

export const MASTER_ADMIN_EMAILS = ['pellier.david@gmail.com']

export const PERMISSION_GROUPS = {
  roster: { label: "👥 Effectif & Joueurs", pages: ['index.html'], collections: ['joueurs'] },
  muscu: { label: "🏋️ Muscu", pages: ['seances.html', 'exercices.html', 'performances.html', 'profil-force-vitesse.html'], collections: ['seances', 'config_exercices', 'cycles', 'dataPerf', 'fv_profils'], configDocs: ['exercices', 'ratios'] },
  fiches: { label: "📋 Fiches Séances", pages: ['fiches-seances.html'], collections: ['fiches_seances', 'bip_sessions'] },
  wellness: { label: "📈 Wellness & Poids", pages: ['wellness.html', 'suivi-poids.html'], collections: ['wellness', 'poids'] },
  medical: { label: "🩺 Médical", pages: ['medical.html', 'planning-blesses.html'], collections: ['blessures', 'creneauxBlesses', 'objectifsBlesses'] },
  planning: { label: "📅 Planning Club", pages: ['planning.html', 'absences.html'], collections: ['planning', 'absences', 'creneauxBlesses'] },
  equipes: { label: "🏉 Composition Équipes", pages: ['equipes.html'], collections: ['feuillesMatch', 'entrainements', 'groupesConfiguration'] },
  gps: { label: "📊 Données GPS", pages: ['gps.html', 'gps-match.html', 'gps-planif.html'], collections: ['gps', 'planificationsGPS'] }
}

export const DEFAULT_PERMISSIONS = {
  prepa: { roster: true, muscu: true, fiches: true, wellness: true, medical: true, planning: true, equipes: true, gps: true },
  manager: { roster: true, muscu: false, fiches: true, wellness: false, medical: false, planning: true, equipes: true, gps: false },
  team_manager: { roster: true, muscu: false, fiches: true, wellness: false, medical: false, planning: true, equipes: true, gps: false },
  kine: { roster: true, muscu: false, fiches: true, wellness: false, medical: true, planning: true, equipes: false, gps: false },
  analyste: { roster: true, muscu: false, fiches: true, wellness: false, medical: false, planning: true, equipes: true, gps: false }
}

let currentUser = null
let staffRoles = {}
let staffPermissions = {}
let currentRole = 'manager'
let permissionsReady = false

const readyPromise = new Promise(resolve => {
  onAuthStateChanged(auth, user => {
    currentUser = user
    if (!user) {
      currentRole = 'manager'
      resolve()
      return
    }
    const email = user.email.toLowerCase()
    const unsubscribe = onSnapshot(doc(db, 'config', 'staff_roles'), snap => {
      const data = snap.exists() ? snap.data() : {}
      staffRoles = data.roles || {}
      staffPermissions = data.permissions || {}
      currentRole = resolveRole(email)
      permissionsReady = true
      resolve()
    }, err => {
      console.warn('[permissions] staff_roles non lisible', err)
      currentRole = resolveRole(email)
      resolve()
    })
  })
})

function resolveRole(email) {
  if (MASTER_ADMIN_EMAILS.includes(email) || staffRoles[email] === 'owner') return 'owner'
  return staffRoles[email] || 'manager'
}

export function getUserRole() {
  return currentRole
}

export function getCurrentUser() {
  return currentUser
}

export function waitForPermissions() {
  return readyPromise
}

export function hasGroupPermission(groupKey) {
  if (currentRole === 'owner') return true
  const perms = staffPermissions[currentRole] || DEFAULT_PERMISSIONS[currentRole] || DEFAULT_PERMISSIONS.manager
  return perms[groupKey] === true
}

export function hasPagePermission(pageName) {
  if (currentRole === 'owner') return true
  for (const [groupKey, group] of Object.entries(PERMISSION_GROUPS)) {
    if (group.pages && group.pages.includes(pageName)) {
      return hasGroupPermission(groupKey)
    }
  }
  return true
}

export function authInstance() {
  return auth
}
