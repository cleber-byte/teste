// Solar Consultoria EC — Executive commission & goals layer
state.commissionSettings = null;
state.monthlyGoals = [];

const _solarBaseLoadCore = loadCore;
loadCore = async function(){
  await _solarBaseLoadCore();
  if(!state.member?.organization_id) return;
  const org = state.member.organization_id;
  const [cfg, goals] = await Promise.all([
    sb.from('aguia_commission_settings').select('*').eq('organization_id',org).limit(1),
    sb.from('aguia_monthly_goals').select('*').eq('organization_id',org).order('competency')
  ]);
  if(cfg.error) console.warn(cfg.error);
  if(goals.error) console.warn(goals.error);
  state.commissionSettings = cfg.data?.[0] || null;
  state.monthlyGoals = goals.data || [];
};

function solarMonthStart(v){
  if(v instanceof Date) return new Date(v.getFullYear(),v.getMonth(),1);
  const s=String(v||'').slice(0,10), [y,m]=s.split('-').map(Number);
  return new Date(y,m-1,1);
}
function solarMonthDiff(a,b){
  const x=solarMonthStart(a), y=solarMonthStart(b);
  return (y.getFullYear()-x.getFullYear())*12 + y.getMonth()-x.getMonth();
}
function solarAddMonths(d,n){ const x=solarMonthStart(d); return new Date(x.getFullYear(),x.getMonth()+n,1); }
function solarMonthLabel(d){ return new Intl.DateTimeFormat('pt-BR',{month:'short',year:'numeric'}).format(solarMonthStart(d)).replace('.',''); }
function solarPct(v,d=2){ return (Number(v||0)*100).toLocaleString('pt-BR',{minimumFractionDigits:d,maximumFractionDigits:d})+'%'; }
function solarRateMonthly(cfg){ return Number(cfg.recurring_rate)/Number(cfg.recurring_months); }
function solarCashContribution(credit,saleMonth,targetMonth,cfg){
  const diff=solarMonthDiff(saleMonth,targetMonth);
  let value=0;
  if(diff>=0 && diff<Number(cfg.recurring_months)) value += Number(credit||0)*solarRateMonthly(cfg);
  if(diff===Number(cfg.final_installment)-1) value += Number(credit||0)*Number(cfg.final_rate);
  return value;
}
function solarHistoricalCash(targetMonth,cfg){
  return state.quotas.reduce((sum,q)=>{
    if(!q.sale_date || !q.credit_value) return sum;
    return sum + solarCashContribution(Number(q.credit_value),q.sale_date,targetMonth,cfg);
  },0);
}
function solarGoalMonths(cfg){
  const start=new Date(2026,8,1); // Sep/2026
  const end=solarMonthStart(cfg.target_month || '2027-01-01');
  const out=[]; let d=start;
  while(d<=end && out.length<24){ out.push(new Date(d)); d=solarAddMonths(d,1); }
  return out;
}
function solarPlan(cfg){
  const months=solarGoalMonths(cfg);
  const targetMonth=months[months.length-1];
  const income=Number(cfg.monthly_income_target||15000);
  const ticket=Number(cfg.planning_ticket||100000);
  const existingAtTarget=solarHistoricalCash(targetMonth,cfg);
  const coeff=months.reduce((s,m)=>s+solarCashContribution(1,m,targetMonth,cfg),0);
  const creditTarget=coeff>0?Math.max(0,(income-existingAtTarget)/coeff):0;
  const cardsTarget=ticket>0?Math.ceil(creditTarget/ticket):0;
  const productionCredit=Number(cfg.total_rate)>0?income/Number(cfg.total_rate):0;
  const productionCards=ticket>0?Math.ceil(productionCredit/ticket):0;
  const rows=months.map((m,idx)=>{
    const hist=solarHistoricalCash(m,cfg);
    let planned=0;
    for(let j=0;j<=idx;j++) planned += solarCashContribution(creditTarget,months[j],m,cfg);
    const projected=hist+planned;
    return {month:m,historical:hist,planned,projected,creditTarget,cardsTarget,commissionGenerated:creditTarget*Number(cfg.total_rate),coverage:income?projected/income:0};
  });
  return {months,rows,existingAtTarget,creditTarget,cardsTarget,productionCredit,productionCards,income,ticket};
}
function solarSalesHistory(){
  const map=new Map();
  state.quotas.forEach(q=>{
    if(!q.sale_date || !q.credit_value) return;
    const d=solarMonthStart(q.sale_date);
    if(d.getFullYear()<2025) return; // ignora datas legadas claramente fora da operação atual
    const key=d.toISOString().slice(0,7);
    const cur=map.get(key)||{month:d,credit:0,cards:0};
    cur.credit+=Number(q.credit_value||0); cur.cards+=1; map.set(key,cur);
  });
  return [...map.values()].sort((a,b)=>a.month-b.month);
}
function solarProgressBar(p){ const pct=Math.max(0,Math.min(100,Number(p||0)*100)); return `<div class="solar-progress"><span style="width:${pct}%"></span></div>`; }

async function solarSaveSettings(){
  const cfg=state.commissionSettings;
  if(!cfg) return;
  const income=Number($('#solarIncomeTarget')?.value||0), ticket=Number($('#solarTicketTarget')?.value||0);
  if(income<=0 || ticket<=0) return toast('Meta de renda e ticket precisam ser maiores que zero','error');
  const payload={monthly_income_target:income,planning_ticket:ticket,target_month:'2027-01-01',updated_at:new Date().toISOString()};
  const {error}=await sb.from('aguia_commission_settings').update(payload).eq('id',cfg.id);
  if(error) return toast(error.message,'error');
  state.commissionSettings={...cfg,...payload};
  const plan=solarPlan(state.commissionSettings), org=state.member.organization_id;
  for(const r of plan.rows){
    const competency=`${r.month.getFullYear()}-${String(r.month.getMonth()+1).padStart(2,'0')}-01`;
    await sb.from('aguia_monthly_goals').upsert({organization_id:org,competency,income_target:plan.income,credit_target:r.creditTarget,cards_target:r.cardsTarget,ticket_target:plan.ticket,goal_type:'CASH_RAMP',notes:'Meta para atingir R$ 15 mil/mês de caixa recorrente até jan/2027; modelo 1,8999% em 13 competências + 0,1001% na 15ª parcela.'},{onConflict:'organization_id,competency,goal_type'});
  }
  toast('Planejamento recalculado e salvo','success');
  await loadCore(); renderDashboard();
}

renderDashboard = function(){
  state.page='dashboard';
  $('#topTitle').textContent='Dashboard Executivo';
  const cfg=state.commissionSettings;
  if(!cfg){ $('#page').innerHTML='<div class="empty">Configuração de comissão não encontrada.</div>'; return; }
  const plan=solarPlan(cfg), sales=solarSalesHistory(), best=sales.reduce((a,b)=>!a||b.credit>a.credit?b:a,null);
  const current=sales.find(x=>x.month.getFullYear()===2026&&x.month.getMonth()===7)||{credit:0,cards:0};
  const active=activeQuotas(), inad=active.filter(q=>q.financial_status==='INADIMPLENTE').length;
  const monthlyRate=solarRateMonthly(cfg);
  const maxSales=Math.max(...sales.map(x=>x.credit),1);
  const lastSales=sales.slice(-10);
  $('#page').innerHTML=`
    <div class="page-head"><div><h1>Dashboard Executivo</h1><p>Vendas, comissão, recorrência e metas da Solar Consultoria EC.</p></div><div class="row"><span class="badge b-dark">Meta: ${fmtBRL(plan.income)}/mês</span></div></div>

    <div class="kpis solar-kpis">
      ${kpi('Crédito vendido • Ago/26',fmtBRL(current.credit),'trending-up',`${current.cards} carta(s) registrada(s)`)}
      ${kpi('Comissão gerada • Ago/26',fmtBRL(current.credit*Number(cfg.total_rate)),'percent','2% do crédito vendido')}
      ${kpi('Meta de renda mensal',fmtBRL(plan.income),'target','Objetivo de caixa recorrente')}
      ${kpi('Inadimplentes',inad,'triangle-alert','Cotas ativas com pendência','accent')}
    </div>

    <div class="solar-commission-grid">
      <div class="solar-rate-card primary"><span>COMISSÃO TOTAL</span><strong>${solarPct(cfg.total_rate,4)}</strong><small>sobre o valor total do crédito</small></div>
      <div class="solar-rate-card"><span>RECORRENTE</span><strong>${solarPct(cfg.recurring_rate,4)}</strong><small>distribuída durante ${cfg.recurring_months} meses</small></div>
      <div class="solar-rate-card"><span>PARCELA MENSAL EQUIVALENTE</span><strong>${solarPct(monthlyRate,6)}</strong><small>do crédito por mês × ${cfg.recurring_months}</small></div>
      <div class="solar-rate-card"><span>RESTANTE</span><strong>${solarPct(cfg.final_rate,4)}</strong><small>pago na ${cfg.final_installment}ª parcela</small></div>
    </div>

    <div class="grid2 solar-exec-grid">
      <div class="panel">
        <div class="panel-head"><div><h3>Meta de produção × meta de caixa</h3><div class="small muted">Dois conceitos diferentes para evitar leitura errada de comissão.</div></div></div>
        <div class="panel-body">
          <div class="solar-plan-compare">
            <div class="solar-plan-box"><span>Para GERAR ${fmtBRL(plan.income)} de comissão total</span><strong>${fmtBRL(plan.productionCredit)}</strong><b>${plan.productionCards} cartas/mês</b><small>Usando 2% total e ticket de ${fmtBRL(plan.ticket)}.</small></div>
            <div class="solar-plan-box focus"><span>Para ATINGIR ${fmtBRL(plan.income)}/mês de caixa em Jan/27</span><strong>${fmtBRL(plan.creditTarget)}</strong><b>${plan.cardsTarget} cartas/mês</b><small>Considera recorrência, carteira histórica carregada e meta Set/26 → Jan/27.</small></div>
          </div>
          <div class="alert-note" style="margin-top:14px">${icon('info')}<span><strong>Regra de projeção:</strong> a 1ª fração recorrente é considerada na competência da venda. Se o repasse real começar no mês seguinte, ajustamos um parâmetro e todo o plano recalcula.</span></div>
        </div>
      </div>

      <div class="panel">
        <div class="panel-head"><h3>Configuração da meta</h3><span class="badge b-blue">Editável</span></div>
        <div class="panel-body"><div class="form-grid">
          <div class="field"><label>Renda mensal desejada</label><input class="input" id="solarIncomeTarget" type="number" step="100" value="${Number(cfg.monthly_income_target)}"></div>
          <div class="field"><label>Ticket médio por carta</label><input class="input" id="solarTicketTarget" type="number" step="1000" value="${Number(cfg.planning_ticket).toFixed(2)}"></div>
          <div class="field"><label>Período da meta</label><input class="input" value="Set/2026 → Jan/2027" disabled></div>
          <div class="field"><label>Meta de caixa final</label><input class="input" value="Jan/2027" disabled></div>
        </div><button class="btn btn-primary w100" id="solarSaveGoal">${icon('calculator')} Recalcular e salvar meta</button></div>
      </div>
    </div>

    <div class="panel" style="margin-top:14px">
      <div class="panel-head"><div><h3>Plano mensal • Setembro/2026 a Janeiro/2027</h3><div class="small muted">Quantidade mínima de cartas estimada pelo ticket configurado.</div></div><span class="badge b-dark">Objetivo: ${fmtBRL(plan.income)}/mês</span></div>
      <div class="table-wrap" style="border:0;border-radius:0"><table class="table solar-goal-table"><thead><tr><th>Mês</th><th>Meta de renda</th><th>Crédito a vender</th><th>Meta de cartas</th><th>Comissão total gerada</th><th>Caixa projetado</th><th>% da meta</th></tr></thead><tbody>
        ${plan.rows.map(r=>`<tr><td><strong>${solarMonthLabel(r.month)}</strong></td><td class="money">${fmtBRL(plan.income)}</td><td class="money"><strong>${fmtBRL(r.creditTarget)}</strong></td><td><span class="solar-card-target">${r.cardsTarget}</span></td><td class="money">${fmtBRL(r.commissionGenerated)}</td><td class="money"><strong>${fmtBRL(r.projected)}</strong><div class="small muted">base ${fmtBRL(r.historical)} + novas vendas ${fmtBRL(r.planned)}</div></td><td><strong>${Math.round(r.coverage*100)}%</strong>${solarProgressBar(r.coverage)}</td></tr>`).join('')}
      </tbody></table></div>
    </div>

    <div class="grid2" style="margin-top:14px">
      <div class="panel"><div class="panel-head"><div><h3>Evolução do crédito vendido</h3><div class="small muted">Histórico disponível na base atual.</div></div></div><div class="panel-body">
        <div class="solar-bars">${lastSales.map(s=>`<div class="solar-bar-row"><span>${solarMonthLabel(s.month)}</span><div><i style="width:${Math.max(3,s.credit/maxSales*100)}%"></i></div><strong>${fmtBRL(s.credit)}</strong></div>`).join('')}</div>
      </div></div>
      <div class="panel"><div class="panel-head"><h3>Melhor mês registrado</h3></div><div class="panel-body">
        ${best?`<div class="solar-best"><span>🏆 ${solarMonthLabel(best.month)}</span><strong>${fmtBRL(best.credit)}</strong><b>${best.cards} cartas vendidas</b><small>Comissão total gerada a 2%: ${fmtBRL(best.credit*Number(cfg.total_rate))}</small></div>`:'<div class="empty">Sem histórico de vendas.</div>'}
        <div class="alert-note" style="margin-top:16px">${icon('shield-check')}<span><strong>Comissão gerada ≠ dinheiro recebido.</strong> O dashboard separa produção comercial da projeção de caixa recorrente.</span></div>
      </div></div>
    </div>`;
  $('#solarSaveGoal')?.addEventListener('click',solarSaveSettings);
  refreshIcons();
};
