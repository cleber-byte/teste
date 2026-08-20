// Branding override for the current homologation build.
(function(){
  const BRAND = 'Solar Consultoria EC';
  const SHORT = 'SC';
  document.title = BRAND + ' — Inteligência de Carteira';

  function applyBrand(){
    document.querySelectorAll('.brand-title').forEach(el => { el.textContent = BRAND; });
    document.querySelectorAll('.mark').forEach(el => { el.textContent = SHORT; });
  }

  applyBrand();
  const observer = new MutationObserver(applyBrand);
  observer.observe(document.documentElement, { childList: true, subtree: true });
})();
