// Solar Consultoria EC — authenticated account security controls
(function(){
  const baseRenderShell = renderShell;
  renderShell = function(){
    baseRenderShell();
    const profile = document.querySelector('.side-profile');
    if(!profile || profile.querySelector('#solarChangePassword')) return;
    const btn = document.createElement('button');
    btn.id = 'solarChangePassword';
    btn.className = 'btn btn-soft btn-sm w100';
    btn.style.marginTop = '10px';
    btn.innerHTML = `${icon('key-round')} Alterar senha`;
    btn.onclick = openPasswordModal;
    profile.appendChild(btn);
    refreshIcons();
  };

  function openPasswordModal(){
    const m=document.createElement('div');
    m.className='modal-backdrop';
    m.innerHTML=`<div class="modal" style="max-width:520px"><div class="modal-head"><div><h3>Alterar senha</h3><div class="small muted">Sua sessão atual permanece autenticada após a troca.</div></div><button class="close">${icon('x')}</button></div><div class="modal-body"><div class="field"><label>Nova senha</label><input class="input" id="solarNewPassword" type="password" minlength="8" autocomplete="new-password" placeholder="Mínimo de 8 caracteres"></div><div class="field"><label>Confirmar nova senha</label><input class="input" id="solarConfirmPassword" type="password" minlength="8" autocomplete="new-password" placeholder="Repita a nova senha"></div><div id="solarPasswordMsg"></div></div><div class="modal-foot"><button class="btn btn-soft close2">Cancelar</button><button class="btn btn-primary" id="solarSavePassword">${icon('shield-check')} Atualizar senha</button></div></div>`;
    document.body.appendChild(m);
    $('.close',m).onclick=$('.close2',m).onclick=()=>m.remove();
    $('#solarSavePassword',m).onclick=async()=>{
      const p=$('#solarNewPassword',m).value,c=$('#solarConfirmPassword',m).value,msg=$('#solarPasswordMsg',m);
      if(p.length<8){msg.innerHTML='<div class="error">Use uma senha com pelo menos 8 caracteres.</div>';return}
      if(p!==c){msg.innerHTML='<div class="error">As senhas não conferem.</div>';return}
      const btn=$('#solarSavePassword',m);btn.disabled=true;
      const {error}=await sb.auth.updateUser({password:p});
      btn.disabled=false;
      if(error){msg.innerHTML=`<div class="error">${esc(error.message)}</div>`;return}
      m.remove();toast('Senha atualizada com sucesso','success');
    };
    refreshIcons();
  }
})();
