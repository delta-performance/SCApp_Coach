/* ═══════════════════════════════════════════════════════
   SCA Albi iPad App — Theme Toggle (Dark / Light)
   Persists choice in localStorage across all pages
   ═══════════════════════════════════════════════════════ */

(function () {
  const STORAGE_KEY = 'sca-ipad-theme';

  function getStoredTheme() {
    try { return localStorage.getItem(STORAGE_KEY) || 'dark'; }
    catch (e) { return 'dark'; }
  }

  function applyTheme(theme) {
    const html = document.documentElement;
    if (theme === 'light') {
      html.setAttribute('data-theme', 'light');
    } else {
      html.removeAttribute('data-theme');
    }
    updateToggleButtons(theme);
  }

  function updateToggleButtons(theme) {
    document.querySelectorAll('.theme-toggle-btn').forEach(function (btn) {
      const icon = btn.querySelector('.theme-icon');
      const label = btn.querySelector('.theme-label');
      if (theme === 'light') {
        if (icon) icon.textContent = '🌙';
        if (label) label.textContent = 'Sombre';
        btn.title = 'Passer en thème sombre';
      } else {
        if (icon) icon.textContent = '☀️';
        if (label) label.textContent = 'Clair';
        btn.title = 'Passer en thème clair';
      }
    });
  }

  function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
    const next = current === 'light' ? 'dark' : 'light';
    try { localStorage.setItem(STORAGE_KEY, next); } catch (e) {}
    applyTheme(next);
  }

  // Apply immediately (before DOMContentLoaded to avoid flash)
  applyTheme(getStoredTheme());

  // Expose globally
  window.toggleTheme = toggleTheme;
  window.applyTheme = applyTheme;
  window.getStoredTheme = getStoredTheme;

  // Wire up buttons after DOM is ready
  function initButtons() {
    document.querySelectorAll('.theme-toggle-btn').forEach(function (btn) {
      if (!btn.dataset.themeWired) {
        btn.addEventListener('click', toggleTheme);
        btn.dataset.themeWired = '1';
      }
    });
    updateToggleButtons(getStoredTheme());
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initButtons);
  } else {
    initButtons();
  }
})();
