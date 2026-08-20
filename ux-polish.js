// Solar Consultoria EC — operational UX for new sales/clients
(function(){
  const _solarUxRenderClients=renderClients;
  renderClients=function(){
    _solarUxRenderClients();
    const btn=$('#newClient');
    if(btn) btn.innerHTML=`${icon('badge-plus')} Nova venda / cliente`;
    refreshIcons();
  };

  function solarSaleSuccess(data){
    const totalRate=Number(state.commissionSettings?.total_rate||0.02);
    const recurringRate=Number(state.commissionSettings?.recurring_rate||0.018999);
    const recurringMonths=Number(state.commissionSettings?.recurring_months||13);
    const finalRate=Number(state.commissionSettings?.final_rate||0.001001);
    const total=Number(data.credit||0)*totalRate;
    const monthly=Number(data.credit||0)*recurringRate/recurringMonths;
    const finalValue=Number(data.credit||0)*finalRate;
    const m=document.createElement('div');m.className='modal-backdrop';
    m.innerHTML=`<div class="modal solar-sale-success" style="max-width:620px"><div class="modal-body"><div class="solar-success-icon">${icon('circle-check-big',34)}</div><div class="solar-success-kicker">CADASTRO CONCLUÍDO</div><h2>Venda cadastrada com sucesso</h2><p>Confira o resumo antes de encerrar.</p><div class="solar-success-client"><strong>${esc(data.name)}</strong><span>${esc(data.product)} • Grupo ${data.group} • Cota ${data.quota}</span></div><div class="solar-success-grid"><div><span>Valor da carta</span><strong>${fmtBRL(data.credit)}</strong></div><div><span>Comissão total • ${(totalRate*100).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:4})}%</span><strong>${fmtBRL(total)}</strong></div><div><span>Recorrência estimada / mês</span><strong>${fmtBRL(monthly)}</strong><small>${recurringMonths} competências</small></div><div><span>Parcela final estimada</span><strong>${fmtBRL(finalValue)}</strong><small>componente residual</small></div></div><div class="alert-note">${icon('info')}<span>A comissão total gerada e o caixa recebido são indicadores diferentes. O Dashboard Executivo acompanha os dois separadamente.</span></div></div><div class="modal-foot"><button class="btn btn-primary w100 solar-close-success">Concluir</button></div></div>`;
    document.body.appendChild(m);$('.solar-close-success',m).onclick=()=>m.remove();refreshIcons();
  }

  const _solarUxOpenClientModal=openClientModal;
  openClientModal=function(quota=null){
    _solarUxOpenClientModal(quota);
    const editing=!!quota;
    const c=quota?getClient(quota.client_id):{};
    const modal=[...document.querySelectorAll('.modal-backdrop')].pop();
    if(!modal) return;
    const title=modal.querySelector('.modal-head h3');
    if(title) title.textContent=editing?'Cliente 360 / Editar venda':'Nova venda / cliente';
    const catLabel=$('#mCat',modal)?.closest('.field')?.querySelector('label');
    if(catLabel) catLabel.textContent='Grupo do sorteio *';
    const requiredLabels=[['mName','Nome *'],['mGroup','Grupo *'],['mQuota','Cota *'],['mCredit','Valor da carta *'],['mConsult','Consultor *'],['mProd','Tipo de crédito *'],['mFin','Situação financeira *']];
    requiredLabels.forEach(([id,text])=>{const label=$('#'+id,modal)?.closest('.field')?.querySelector('label');if(label)label.textContent=text});

    const payField=$('#mPay',modal)?.closest('.field');
    if(payField&&!$('#mSaleDate',modal)){
      const field=document.createElement('div');field.className='field';
      const defaultDate=quota?.sale_date||new Date().toISOString().slice(0,10);
      field.innerHTML=`<label>Data da venda *</label><input class="input" id="mSaleDate" type="date" value="${esc(defaultDate)}">`;
      payField.after(field);
    }

    const creditField=$('#mCredit',modal)?.closest('.field');
    if(creditField&&!modal.querySelector('.solar-live-commission')){
      const preview=document.createElement('div');preview.className='solar-live-commission span2';
      creditField.parentElement.appendChild(preview);
      const updatePreview=()=>{const credit=Number($('#mCredit',modal)?.value||0),rate=Number(state.commissionSettings?.total_rate||0.02),monthly=credit*Number(state.commissionSettings?.recurring_rate||0.018999)/Number(state.commissionSettings?.recurring_months||13);preview.innerHTML=`<span>Comissão estimada desta venda</span><strong>${fmtBRL(credit*rate)}</strong><small>${(rate*100).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:4})}% total • recorrência estimada ${fmtBRL(monthly)}/mês</small>`};
      $('#mCredit',modal)?.addEventListener('input',updatePreview);updatePreview();
    }

    const oldSave=$('#saveClient',modal);
    if(!oldSave) return;
    const save=oldSave.cloneNode(true);oldSave.replaceWith(save);save.innerHTML=editing?`${icon('save')} Salvar alterações`:`${icon('badge-check')} Salvar venda`;
    save.onclick=async()=>{
      const name=$('#mName',modal).value.trim(),group=Number($('#mGroup',modal).value),quotaNumber=Number($('#mQuota',modal).value),cat=Number($('#mCat',modal).value),credit=Number($('#mCredit',modal).value),consultant=$('#mConsult',modal).value.trim(),saleDate=$('#mSaleDate',modal)?.value,product=$('#mProd',modal).value,financial=$('#mFin',modal).value;
      if(!name||!group||!quotaNumber||!cat||!credit||!consultant||!saleDate||!product||!financial){return toast('Preencha todos os campos obrigatórios marcados com *','error')}
      if(![1000,2000,3333,5000,9999].includes(cat)) return toast('Selecione um grupo do sorteio válido','error');
      if(!editing){const {data:dup,error:dupErr}=await sb.from('aguia_client_quotas').select('id').eq('organization_id',state.member.organization_id).eq('group_number',group).eq('quota_number',quotaNumber).eq('status','ATIVA').limit(1);if(dupErr)return toast(dupErr.message,'error');if(dup?.length)return toast('Já existe uma cota ativa com este Grupo + Cota','error')}
      save.disabled=true;save.textContent='Salvando…';
      let clientId=c.id;
      if(!editing){
        const {data:existing}=await sb.from('aguia_clients').select('id').eq('organization_id',state.member.organization_id).ilike('name',name).limit(1);
        if(existing?.[0]) clientId=existing[0].id;
        else{
          clientId=crypto.randomUUID();
          const {error}=await sb.from('aguia_clients').insert({id:clientId,organization_id:state.member.organization_id,name,phone:$('#mPhone',modal).value.trim()||null,email:$('#mEmail',modal).value.trim()||null,consultant_label:consultant,status:'ATIVO'});
          if(error){save.disabled=false;save.innerHTML=`${icon('badge-check')} Salvar venda`;refreshIcons();return toast(error.message,'error')}
        }
      }else{
        const {error}=await sb.from('aguia_clients').update({name,phone:$('#mPhone',modal).value.trim()||null,email:$('#mEmail',modal).value.trim()||null,consultant_label:consultant}).eq('id',clientId);
        if(error){save.disabled=false;return toast(error.message,'error')}
      }
      const payload={organization_id:state.member.organization_id,client_id:clientId,group_number:group,quota_number:quotaNumber,participants_category:cat,credit_value:credit,consultant_label:consultant,financial_status:financial,product_type:product,payment_method:$('#mPay',modal).value.trim()||null,payment_note:$('#mNote',modal).value.trim()||null,sale_date:saleDate,status:'ATIVA'};
      const res=editing?await sb.from('aguia_client_quotas').update(payload).eq('id',quota.id):await sb.from('aguia_client_quotas').insert({...payload,id:crypto.randomUUID()});
      if(res.error){save.disabled=false;return toast(res.error.message,'error')}
      modal.remove();await loadCore();renderClients();
      if(editing) toast('Venda atualizada','success'); else solarSaleSuccess({name,group,quota:quotaNumber,credit,product,consultant,saleDate});
    };
    refreshIcons();
  };
})();