import { initializeApp, getFirestore, doc, onSnapshot } from './supabase-adapter.js'

const firebaseConfig = {
  apiKey: "AIzaSyCvMs-5LX9Ivk3OkzUR3iz9Kk1E5b9_7Vk",
  authDomain: "delta-rugby-app.firebaseapp.com",
  projectId: "delta-rugby-app",
  storageBucket: "delta-rugby-app.firebasestorage.app",
  messagingSenderId: "61187079762",
  appId: "1:61187079762:web:56cd1eaa8beb9e1a2ee98b"
}

const IPAD_APP_VERSION = '1.0.0'

function compareVersions(local, remote) {
  const l = local.split('.').map(Number)
  const r = remote.split('.').map(Number)
  for (let i = 0; i < Math.max(l.length, r.length); i++) {
    const lv = l[i] || 0
    const rv = r[i] || 0
    if (rv > lv) return -1
    if (rv < lv) return 1
  }
  return 0
}

function showUpdateBannerIpad(remoteVersion, notes) {
  if (document.getElementById('ipad-update-banner')) return
  if (window._ipadUpdateDismissed) return

  if (!document.getElementById('ipad-banner-style')) {
    const style = document.createElement('style')
    style.id = 'ipad-banner-style'
    style.textContent = `@keyframes ipadBannerSlide { from { transform: translateY(-100%); } to { transform: translateY(0); } }`
    document.head.appendChild(style)
  }

  const banner = document.createElement('div')
  banner.id = 'ipad-update-banner'
  banner.style.cssText = `
    position: fixed; top: 0; left: 0; right: 0; z-index: 99999;
    background: linear-gradient(90deg, #FECC00, #f5b800);
    color: #0f0f0f; display: flex; align-items: center; justify-content: center; gap: 10px;
    padding: 10px 16px; font-size: 13px; font-weight: 600;
    box-shadow: 0 2px 12px rgba(0,0,0,0.5);
    animation: ipadBannerSlide .3s ease-out;
  `
  banner.innerHTML = `
    <span style="font-size:16px;">🔄</span>
    <span style="flex:1;text-align:center;">
      Mise à jour disponible — <b>v${remoteVersion}</b>
      ${notes ? `<span style="font-size:11px;opacity:0.7;font-weight:500;"> · ${notes}</span>` : ''}
    </span>
    <button onclick="location.reload(true)" style="padding:6px 14px;border-radius:6px;border:none;background:#0f0f0f;color:#FECC00;font-size:12px;font-weight:700;cursor:pointer;white-space:nowrap;">Recharger</button>
    <button onclick="this.parentElement.remove();window._ipadUpdateDismissed=true" style="background:none;border:none;color:#0f0f0f;font-size:16px;cursor:pointer;opacity:0.5;padding:0 4px;">✕</button>
  `
  document.body.insertBefore(banner, document.body.firstChild)
}

try {
  const fbApp = initializeApp(firebaseConfig)
  const db = getFirestore(fbApp)

  onSnapshot(doc(db, 'config', 'app_version'), (docSnap) => {
    if (!docSnap.exists()) return
    const data = docSnap.data()
    const remoteVersion = data.version || '0.0.0'
    if (compareVersions(IPAD_APP_VERSION, remoteVersion) < 0) {
      showUpdateBannerIpad(remoteVersion, data.notes || '')
    }
  }, (error) => {
    console.error('Erreur écoute version (iPad):', error)
  })
} catch (e) {
  console.error('Update check init error:', e)
}
