const SUPABASE_URL='https://joqevubzqbvshqkoctyu.supabase.co';
const SUPABASE_KEY='sb_publishable_RD_ejgkH9YBeg2-iiHECBg_UIorBfK-';
const ORG_ID='594a7b56-d002-43de-9313-2a1586b076a5';
const AUG_DRAWING_ID='0116ed67-da6e-400c-b2e1-166f5a212a26';
const sb=window.supabase.createClient(SUPABASE_URL,SUPABASE_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
const state={session:null,member:null,page:'dashboard',clients:[],quotas:[],matches:[],drawings:[],drawNumbers:[],contemplations:[],members:[],invites:[],audit:[],searchResults:[],currentDrawing:AUG_DRAWING_ID,loading:false};
const $=(s,ctx=document)=>ctx.querySelector(s); const $$=(s,ctx=document)=>[...ctx.querySelectorAll(s)];
const fmtBRL=v=>new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL',maximumFractionDigits:2}).format(Number(v||0));
const fmtDate=v=>v?new Intl.DateTimeFormat('pt-BR').format(new Date(v+'T12:00:00')):'—';
const norm=s=>(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
const esc=s=>String(s??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
function toast(msg,type=''){const el=document.createElement('div');el.className='toast '+(type==='error'?'bad':type==='success'?'good':'');el.textContent=msg;$('#toasts').appendChild(el);setTimeout(()=>el.remove(),4200)}
function icon(name,size=16){return `<i data-lucide="${name}" style="width:${size}px;height:${size}px"></i>`}
function refreshIcons(){if(window.lucide) lucide.createIcons()}
function roleLabel(r){return ({OWNER:'Proprietário',ADMINISTRATIVO:'Administrativo',GESTOR:'Gestor',CONSULTOR:'Consultor',AUDITOR:'Auditor'})[r]||r||'—'}
function canEdit(){return ['OWNER','ADMINISTRATIVO'].includes(state.member?.role)} function isOwner(){return state.member?.role==='OWNER'}
function canSeeAudit(){return ['OWNER','ADMINISTRATIVO','GESTOR','AUDITOR'].includes(state.member?.role)}
function statusBadge(s){const map={EM_DIA:['Em dia','b-green'],PAGO:['Pago','b-blue'],INADIMPLENTE:['Inadimplente','b-red'],REVISAO:['Revisão','b-yellow'],ATIVA:['Ativa','b-green'],CANCELADA:['Cancelada','b-gray'],CONFIRMADA:['Confirmada','b-green'],A_CONFIRMAR:['A confirmar','b-yellow']};const a=map[s]||[s,'b-gray'];return `<span class="badge ${a[1]}">${a[0]}</span>`}
function classBadge(c){const m={MATCH_EXATO:['Match exato','b-blue'],CRITICO:['Crítico ≤20','b-red'],ALTO:['Alto 21–50','b-orange'],RADAR:['Radar 51–100','b-yellow'],MONITORAMENTO:['Monitoramento','b-gray']};const a=m[c]||[c,'b-gray'];return `<span class="badge ${a[1]}">${a[0]}</span>`}
function getClient(id){return state.clients.find(x=>x.id===id)||{name:'Cliente'} }
function quotaEligible(q){return q.financial_status!=='INADIMPLENTE'&&q.status==='ATIVA'}

function renderAuth(message=''){
 document.getElementById('root').innerHTML=`<div class="auth-shell"><section class="auth-brand"><div class="brand-mark"><div class="mark">AC</div><div><div class="brand-title">ÁGUIA COMMAND</div><div class="brand-sub">Inteligência de Carteira</div></div></div><div class="auth-copy"><h1>Carteira, sorteios e risco em uma única visão.</h1><p>Controle operacional com acesso individual, auditoria, radar de cotas e confirmação humana dos resultados.</p></div><div class="auth-foot">Ambiente interno • dados protegidos por autenticação e RLS</div></section><section class="auth-card-wrap"><div class="auth-card"><h2>Acessar painel</h2><p>Use seu e-mail individual. Não compartilhe credenciais.</p><form id="loginForm"><div class="field"><label>E-mail</label><input class="input" id="loginEmail" type="email" autocomplete="email" required placeholder="nome@empresa.com"></div><div class="field"><label>Senha</label><input class="input" id="loginPass" type="password" autocomplete="current-password" minlength="6" required placeholder="••••••••"></div><button class="btn btn-primary w100" type="submit">${icon('log-in')} Entrar</button></form><div class="row between" style="margin-top:14px"><button class="btn btn-soft btn-sm" id="signupBtn">Criar conta</button><button class="btn btn-soft btn-sm" id="resetBtn">Esqueci a senha</button></div>${message?`<div class="success">${esc(message)}</div>`:''}<div id="authMsg"></div></div></section></div>`;
 $('#loginForm').onsubmit=async e=>{e.preventDefault();$('#authMsg').innerHTML='';const {error}=await sb.auth.signInWithPassword({email:$('#loginEmail').value.trim(),password:$('#loginPass').value});if(error)$('#authMsg').innerHTML=`<div class="error">${esc(error.message)}</div>`};
 $('#signupBtn').onclick=async()=>{const email=$('#loginEmail').value.trim(),password=$('#loginPass').value;if(!email||password.length<6){$('#authMsg').innerHTML='<div class="error">Informe e-mail e senha com ao menos 6 caracteres.</div>';return}const {error}=await sb.auth.signUp({email,password});$('#authMsg').innerHTML=error?`<div class="error">${esc(error.message)}</div>`:'<div class="success">Conta criada. Se a confirmação de e-mail estiver ativa, confirme o e-mail e depois entre.</div>'};
 $('#resetBtn').onclick=async()=>{const email=$('#loginEmail').value.trim();if(!email){$('#authMsg').innerHTML='<div class="error">Informe o e-mail primeiro.</div>';return}const {error}=await sb.auth.resetPasswordForEmail(email,{redirectTo:location.origin+location.pathname});$('#authMsg').innerHTML=error?`<div class="error">${esc(error.message)}</div>`:'<div class="success">Se o e-mail estiver cadastrado, você receberá instruções de recuperação.</div>'}; refreshIcons();
}
function renderActivation(){document.getElementById('root').innerHTML=`<div class="auth-shell"><section class="auth-brand"><div class="brand-mark"><div class="mark">AC</div><div><div class="brand-title">ÁGUIA COMMAND</div><div class="brand-sub">Ativação de acesso</div></div></div><div class="auth-copy"><h1>Conta autenticada.</h1><p>Agora precisamos associar este usuário à organização. Convites são vinculados pelo mesmo e-mail usado no cadastro.</p></div><div class="auth-foot">${esc(state.session?.user?.email||'')}</div></section><section class="auth-card-wrap"><div class="auth-card"><h2>Ativar acesso</h2><p>Se você recebeu um convite, tente ativá-lo. O primeiro proprietário usa o código de implantação uma única vez.</p><button class="btn btn-dark w100" id="claimInvite">${icon('mail-check')} Ativar convite por e-mail</button><div style="height:1px;background:#e7e9ed;margin:20px 0"></div><div class="field"><label>Código de implantação do primeiro OWNER</label><input class="input" id="bootstrapCode" placeholder="AGUIA-XXXX-XXXX"></div><button class="btn btn-primary w100" id="claimBootstrap">${icon('key-round')} Ativar como proprietário</button><div id="actMsg"></div><button class="btn btn-soft w100" style="margin-top:14px" id="actLogout">Sair</button></div></section></div>`;
 $('#claimInvite').onclick=async()=>{const {error}=await sb.rpc('aguia_claim_invite');if(error)$('#actMsg').innerHTML=`<div class="error">${esc(error.message)}</div>`;else{toast('Convite ativado','success');await bootApp()}};
 $('#claimBootstrap').onclick=async()=>{const code=$('#bootstrapCode').value.trim();const {error}=await sb.rpc('aguia_claim_bootstrap',{p_code:code});if(error)$('#actMsg').innerHTML=`<div class="error">${esc(error.message)}</div>`;else{toast('Proprietário ativado','success');await bootApp()}};
 $('#actLogout').onclick=()=>sb.auth.signOut();refreshIcons();
}
async function loadMembership(){const uid=state.session?.user?.id;if(!uid)return null;const {data}=await sb.from('aguia_members').select('*').eq('user_id',uid).eq('active',true).limit(1);state.member=data?.[0]||null;return state.member}
async function loadCore(){if(!state.member)return; const org=state.member.organization_id;
 const [c,q,m,d,dn,co]=await Promise.all([
  sb.from('aguia_clients').select('id,name,phone,email,consultant_user_id,consultant_label,indicator,status,notes').eq('organization_id',org).order('name'),
  sb.from('aguia_client_quotas').select('*').eq('organization_id',org).order('created_at'),
  sb.from('aguia_matches').select('*').eq('organization_id',org).order('distance'),
  sb.from('aguia_drawings').select('*').eq('organization_id',org).order('competency',{ascending:false}),
  sb.from('aguia_drawing_numbers').select('*').eq('organization_id',org).order('participants_category').order('prize_position'),
  sb.from('aguia_contemplations').select('*').eq('organization_id',org).order('created_at',{ascending:false})
 ]);
 [c,q,m,d,dn,co].forEach(x=>{if(x.error)console.warn(x.error)});state.clients=c.data||[];state.quotas=q.data||[];state.matches=m.data||[];state.drawings=d.data||[];state.drawNumbers=dn.data||[];state.contemplations=co.data||[];state.currentDrawing=state.drawings[0]?.id||AUG_DRAWING_ID;
 if(isOwner()){const [mem,inv]=await Promise.all([sb.from('aguia_members').select('*').eq('organization_id',org).order('created_at'),sb.from('aguia_invites').select('*').eq('organization_id',org).order('created_at',{ascending:false})]);state.members=mem.data||[];state.invites=inv.data||[]}
 if(canSeeAudit()){const a=await sb.from('aguia_audit_logs').select('*').eq('organization_id',org).order('created_at',{ascending:false}).limit(150);state.audit=a.data||[]}
}
async function bootApp(){const {data:{session}}=await sb.auth.getSession();state.session=session;if(!session){state.member=null;renderAuth();return}await loadMembership();if(!state.member){renderActivation();return}await loadCore();renderShell()}
