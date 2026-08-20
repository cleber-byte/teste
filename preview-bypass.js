// TEMPORARY PRIVATE HOMOLOGATION MODE
// This file intentionally bypasses login only for the current private preview.
// Before team/production release, remove this script and revoke the preview anon policies.

const AGUIA_PREVIEW_MODE = true;
const AGUIA_PREVIEW_MEMBER = {
  id: 'preview-owner',
  organization_id: ORG_ID,
  user_id: null,
  role: 'OWNER',
  display_name: 'Cleber • Homologação',
  active: true
};

const _aguiaRenderShell = renderShell;
renderShell = function(){
  _aguiaRenderShell();

  document.title = 'CONTROLE CLEBER E ERIKA ÁGUIA — Inteligência de Carteira';
  document.querySelectorAll('.brand-title').forEach(el => {
    el.textContent = 'CONTROLE CLEBER E ERIKA ÁGUIA';
  });
  document.querySelectorAll('.mark').forEach(el => {
    el.textContent = 'CE';
  });

  const env = document.querySelector('.top-title span');
  if(env) env.textContent = 'Homologação privada • acesso total temporário';
  const logout = document.getElementById('logoutBtn');
  if(logout) logout.style.display = 'none';
  const badge = document.createElement('span');
  badge.className = 'badge b-yellow';
  badge.textContent = 'MODO HOMOLOGAÇÃO';
  const topRight = document.querySelector('.topbar > .row:last-child');
  if(topRight && !document.getElementById('previewModeBadge')){
    badge.id = 'previewModeBadge';
    topRight.prepend(badge);
  }
};

renderAuth = function(){
  setTimeout(() => bootApp(), 0);
};

renderActivation = function(){
  setTimeout(() => bootApp(), 0);
};

bootApp = async function(){
  state.session = { user: { id: null, email: 'homologacao@aguia.local' } };
  state.member = { ...AGUIA_PREVIEW_MEMBER };
  await loadCore();
  renderShell();
};
