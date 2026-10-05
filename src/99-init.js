/* =====================================================================
   INIT
   ===================================================================== */
(function init() {
  document.documentElement.lang = 'en';
  if (!document.getElementById('sr-live')) { const l = document.createElement('div'); l.id = 'sr-live'; l.className = 'sr'; l.setAttribute('aria-live', 'polite'); document.body.appendChild(l); }
  const h = (location.hash || '').slice(1);
  const authRoutes = ['login', 'signup', 'forgot', 'reset', 'verify', 'onboarding'];
  if (authRoutes.includes(h)) S.ui.auth = h;
  else if (h && ROUTE_NAMES[h]) S.ui.route = h;
  else S.ui.route = S.prefs.home || 'home';
  render();
})();
