import { getCurrentUser, waitForPermissions, hasPagePermission } from './permissions.js'

async function guard() {
  await waitForPermissions()

  const page = location.pathname.split('/').pop() || 'index.html'

  if (!getCurrentUser()) {
    location.href = 'login.html'
    return
  }

  if (!hasPagePermission(page)) {
    document.body.innerHTML = `
      <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;flex-direction:column;padding:24px;text-align:center;background:#0a0a0a;color:#fff;font-family:system-ui,-apple-system,sans-serif;">
        <div style="font-size:48px;margin-bottom:16px;">🚫</div>
        <h1 style="font-size:18px;margin:0 0 8px;">Accès refusé</h1>
        <p style="color:#888;max-width:360px;">Ton rôle ne te permet pas d'ouvrir cette page.</p>
        <a href="index.html" style="margin-top:24px;color:#FECC00;text-decoration:none;font-weight:600;">← Retour à l'accueil</a>
      </div>
    `
  }
}

guard()
