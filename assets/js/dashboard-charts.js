(function () {
  "use strict";

  const MESES = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
  const ANOS = [2015,2016,2017,2018,2019,2020,2021,2022,2023,2024,2025,2026];
  const grafico = {};
  const azul = "#54B2E3";
  const escuro = "#0A2540";
  const cinza = "#8CA3B8";

  function baseOptions() {
    return {responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false},tooltip:{backgroundColor:escuro,titleColor:"#fff",bodyColor:"#fff",displayColors:false}},scales:{x:{grid:{display:false},ticks:{color:cinza}},y:{beginAtZero:true,grid:{color:"rgba(84,178,227,.10)"},ticks:{color:cinza}}}};
  }
  function setMessage(id,text){var el=document.getElementById(id);if(el)el.innerHTML='<div style="height:100%;display:flex;align-items:center;justify-content:center;text-align:center;padding:20px;color:#7f9caf;font-size:12px;">'+text+'</div>';}
  function bar(id,labels,data){var el=document.getElementById(id);if(!el||typeof Chart==='undefined')return;el.innerHTML='<canvas></canvas>';grafico[id]=new Chart(el.querySelector('canvas'),{type:'bar',data:{labels:labels,datasets:[{data:data,backgroundColor:azul,hoverBackgroundColor:escuro,borderRadius:7}]},options:baseOptions()});}
  function line(id,labels,data){var el=document.getElementById(id);if(!el||typeof Chart==='undefined')return;el.innerHTML='<canvas></canvas>';grafico[id]=new Chart(el.querySelector('canvas'),{type:'line',data:{labels:labels,datasets:[{data:data,borderColor:azul,backgroundColor:"rgba(84,178,227,.15)",fill:true,tension:.3}]},options:baseOptions()});}

  function renderColetas(coletas){
    const byMonth=Array(12).fill(0), byYear=Array(12).fill(0);
    const totalLitros = coletas.reduce((sum,c)=>sum + (Number(c.volume)||0),0);
    const litrosEl = document.getElementById('totalLitrosColetados');
    const doacoesEl = document.getElementById('totalDoacoesRegistradas');
    if(litrosEl) litrosEl.textContent = totalLitros + ' L';
    if(doacoesEl) doacoesEl.textContent = coletas.length;
    coletas.forEach(c=>{if(!c.data)return;const d=new Date(c.data+'T00:00:00');const y=d.getFullYear();const m=d.getMonth();if(c.volume!=null)byMonth[m]+=Number(c.volume)||0;if(["RECEBIDA","Recebida com sucesso","EM_ANALISE_LABORATORIAL","Em analise laboratorial"].includes(c.status))byYear[ANOS.indexOf(y)>=0?ANOS.indexOf(y):11]++;});
    bar('barColetaMes',MESES,byMonth);
    bar('barColetaAno',ANOS.map(String),byYear);
    setMessage('chartBancos','Distribuição por banco de leite: o modelo atual não possui entidade/relacionamento de banco de leite.');
  }

  function renderDoadoras(doadoras){
    var total=document.getElementById('metricDoadorasCadastradas');if(total)total.textContent=doadoras.length;
    var novos=document.getElementById('metricNovosCadastros');if(novos)novos.textContent='—';
    var ret=document.getElementById('metricRetencao');if(ret)ret.textContent='—';
    setMessage('chartDoadorasEvolucao','Histórico temporal indisponível: DOADORA não possui data de criação no modelo atual.');
    var body=document.getElementById('doadorasPeriodoBody');if(body)body.innerHTML='<tr><td colspan="4">Histórico de novos cadastros, ativas e retenção indisponível no modelo atual.</td></tr>';
  }

  function renderConsultas(consultas){
    var total=document.getElementById('metricAtendimentos');if(total)total.textContent=consultas.length;
    var ag=consultas.filter(c=>String(c.status||'').toUpperCase()==='AGENDADA').length;var re=consultas.filter(c=>String(c.status||'').toUpperCase()==='REALIZADA').length;
    var e=document.getElementById('metricAgendamentos');if(e)e.textContent=ag;var r=document.getElementById('metricRealizados');if(r)r.textContent=re;
    var counts={};consultas.forEach(c=>{var k=c.motivo||'Não informado';counts[k]=(counts[k]||0)+1;});
    var labels=Object.keys(counts).slice(0,8), vals=labels.map(k=>counts[k]);
    if(labels.length)bar('chartTiposSuporte',labels,vals);else setMessage('chartTiposSuporte','Nenhum atendimento disponível na API.');
    var body=document.getElementById('consultasRecentesBody');if(body){var recent=consultas.slice().sort((a,b)=>String(b.data||'').localeCompare(String(a.data||''))).slice(0,5);body.innerHTML=recent.length?recent.map(c=>'<tr><td>'+((c.motivo||'Não informado'))+'</td><td>'+((c.data||'—'))+'</td><td><span class="status status-active">'+((c.status||'—'))+'</span></td></tr>').join(''):'<tr><td colspan="3">Nenhum atendimento encontrado.</td></tr>';}
  }

  async function iniciar(){
    try {
      const [coletas,doadoras,consultas]=await Promise.all([LactareAPI.coletas(),LactareAPI.doadoras(),LactareAPI.consultas()]);
      renderColetas(Array.isArray(coletas)?coletas:[]);renderDoadoras(Array.isArray(doadoras)?doadoras:[]);renderConsultas(Array.isArray(consultas)?consultas:[]);
    } catch(e) {
      setMessage('barColetaMes','Não foi possível carregar dados reais da API.');
      setMessage('barColetaAno','Não foi possível carregar dados reais da API.');
      setMessage('chartBancos','Dados indisponíveis.');
      setMessage('chartDoadorasEvolucao','Dados indisponíveis.');
      setMessage('chartTiposSuporte','Dados indisponíveis.');
      setMessage('barImpactoMes','Indicador não disponível no modelo atual.');
      setMessage('barImpactoAno','Indicador não disponível no modelo atual.');
    }
    setMessage('barImpactoMes','Indicador não disponível no modelo atual do banco.');
    setMessage('barImpactoAno','Indicador não disponível no modelo atual do banco.');
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',iniciar);else iniciar();
  window.LactareCharts={atualizar:iniciar};
})();
