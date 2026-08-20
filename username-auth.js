// Solar Consultoria EC — username/password authentication layer
(function(){
  const USER_DOMAIN='users.solar-consultoria-ec.app';
  const normalizeUsername=value=>String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toLowerCase().replace(/\s+/g,'.').replace(/[^a-z0-9._-]/g,'').replace(/\.{2,}/g,'.').replace(/^\.|\.$/g,'');
  const emailFor=username=>`${normalizeUsername(username)}@${USER_DOMAIN}`;

  async function firstOwnerAvailable(){
    const {data,error}=await sb.rpc('solar_first_owner_available');
    if(error){ console.warn(error); return false; }
    return data===true;
  }

  renderAuth = async function(message=''){
    const allowFirst=await firstOwnerAvailable();
    document.getElementById('root').innerHTML=`<div class="auth-shell"><section class="auth-brand"><div class="brand-mark"><div class="mark">SC</div><div><div class="brand-title">Solar Consultoria EC</div><div class="brand-sub">Carteira & Contemplações</div></div></div><div class="auth-copy"><h1>Gestão da carteira em uma única visão.</h1><p>Clientes, vendas, comissão, inadimplência, sorteios, lances e contemplações com rastreabilidade.</p></div><div class="auth-foot">Acesso interno • usuário individual</div></section><section class="auth-card-wrap"><div class="auth-card"><h2>Acessar painel</h2><p>Entre apenas com seu usuário e senha.</p><form id="solarLoginForm"><div class="field"><label>Usuário</label><input class="input" id="solarUsername" autocomplete="username" required placeholder="ex.: cleber"></div><div class="field"><label>Senha</label><div class="solar-password-wrap"><input class="input" id="solarPassword" type="password" autocomplete="current-password" minlength="8" required placeholder="••••••••"><button type="button" class="solar-eye" id="solarEye" aria-label="Mostrar senha">${icon('eye')}</button></div></div><button class="btn btn-primary w100" type="submit">${icon('log-in')} Entrar</button></form>${allowFirst?`<div class="solar-first-access"><span>Primeiro acesso da Solar Consultoria EC?</span><button class="btn btn-soft w100" id="solarCreateFirst">Criar usuário proprietário</button></div>`:''}${message?`<div class="success">${esc(message)}</div>`:''}<div id="solarAuthMsg"></div></div></section></div>`;
    $('#solarEye').onclick=()=>{const input=$('#solarPassword');input.type=input.type==='password'?'text':'password';$('#solarEye').innerHTML=icon(input.type==='password'?'eye':'eye-off');refreshIcons()};
    $('#solarLoginForm').onsubmit=async e=>{e.preventDefault();const username=normalizeUsername($('#solarUsername').value),password=$('#solarPassword').value;if(username.length<3){$('#solarAuthMsg').innerHTML='<div class="error">Use um usuário com pelo menos 3 caracteres.</div>';return}const {error}=await sb.auth.signInWithPassword({email:emailFor(username),password});if(error)$('#solarAuthMsg').innerHTML='<div class="error">Usuário ou senha inválidos.</div>'};
    $('#solarCreateFirst')?.addEventListener('click',async()=>{const username=normalizeUsername($('#solarUsername').value),password=$('#solarPassword').value;if(username.length<3||password.length<8){$('#solarAuthMsg').innerHTML='<div class="error">Defina um usuário com 3+ caracteres e senha com no mínimo 8 caracteres.</div>';return}const {data,error}=await sb.auth.signUp({email:emailFor(username),password,options:{data:{username,app:'solar-consultoria-ec'}}});if(error){$('#solarAuthMsg').innerHTML=`<div class="error">${esc(error.message)}</div>`;return}if(!data.session){$('#solarAuthMsg').innerHTML='<div class="error">A conta foi criada, mas a sessão não iniciou. Tente entrar com o mesmo usuário e senha.</div>';return}const claim=await sb.rpc('solar_claim_first_owner',{p_display_name:username});if(claim.error){$('#solarAuthMsg').innerHTML=`<div class="error">${esc(claim.error.message)}</div>`;return}toast('Primeiro proprietário criado','success');await bootApp()});
    refreshIcons();
  };

  renderActivation = function(){
    document.getElementById('root').innerHTML=`<div class="auth-shell"><section class="auth-brand"><div class="brand-mark"><div class="mark">SC</div><div><div class="brand-title">Solar Consultoria EC</div><div class="brand-sub">Ativação de acesso</div></div></div><div class="auth-copy"><h1>Usuário autenticado.</h1><p>Este acesso ainda precisa ser associado ao painel.</p></div></section><section class="auth-card-wrap"><div class="auth-card"><h2>Ativar acesso</h2><button class="btn btn-primary w100" id="solarActivateFirst">Ativar como proprietário inicial</button><div id="solarActMsg"></div><button class="btn btn-soft w100" style="margin-top:12px" id="solarActLogout">Sair</button></div></section></div>`;
    $('#solarActivateFirst').onclick=async()=>{const username=String(state.session?.user?.user_metadata?.username||'Proprietário');const {error}=await sb.rpc('solar_claim_first_owner',{p_display_name:username});if(error){$('#solarActMsg').innerHTML=`<div class="error">${esc(error.message==='first_owner_already_exists'?'Este usuário ainda não possui permissão. Solicite acesso ao proprietário.':error.message)}</div>`;return}await bootApp()};
    $('#solarActLogout').onclick=()=>sb.auth.signOut();refreshIcons();
  };
})();