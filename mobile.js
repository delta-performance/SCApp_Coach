window.addEventListener('DOMContentLoaded', () => {
  // Bouton retour vers l'accueil iPad
  if (!document.getElementById('ipad-back-btn')) {
    const back = document.createElement('a')
    back.id = 'ipad-back-btn'
    back.href = '../index.html'
    back.textContent = '← Accueil'
    back.style.cssText = `
      position: fixed;
      top: 8px;
      left: 8px;
      z-index: 99999;
      padding: 8px 12px;
      background: #222;
      color: #FECC00;
      border: 1px solid #333;
      border-radius: 8px;
      font-family: -apple-system, BlinkMacSystemFont, sans-serif;
      font-size: 13px;
      font-weight: 600;
      text-decoration: none;
    `
    document.body.appendChild(back)
  }

  // Masquer toute sidebar
  document.querySelectorAll('.sidebar').forEach(el => {
    el.style.display = 'none'
  })

  // Forcer le conteneur principal en pleine largeur
  document.querySelectorAll('.main').forEach(el => {
    el.style.width = '100%'
    el.style.margin = '0'
    el.style.paddingTop = '44px'
    el.style.maxWidth = '100vw'
  })
})
