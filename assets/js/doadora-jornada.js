/* ==========================================================
   Lactare — Perfil da doadora: estado REAL vindo da API.
   Nada aqui é fixo: tudo é derivado de triagem, exame médico
   e coletas da doadora autenticada.

   derive(raw)  -> função pura (testável em Node), sem DOM.
   render(doc)  -> aplica o resultado no perfil (nutriz.html).
   ========================================================== */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.LactareJornada = factory();
})(typeof self !== 'undefined' ? self : this, function () {

  // Coleta "realizada": o Back-end não define enum; REALIZADA é o termo do fluxo
  // e RECEBIDA é o que o import.sql usa para coletas concluídas.
  var COLETA_REALIZADA = ['REALIZADA', 'RECEBIDA'];
  var COLETA_ABERTA = ['AGENDADA', 'PENDENTE', 'CONFIRMADA'];
  var COLETA_CANCELADA = ['CANCELADA', 'CANCELADO'];

  function up(s) { return String(s || '').toUpperCase(); }
  function isIn(list, s) { return list.indexOf(up(s)) !== -1; }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  var DIAS = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
  var MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

  function partesData(iso) {
    var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || '');
    return m ? { y: +m[1], m: +m[2], d: +m[3] } : null;
  }
  function fmtData(iso) {
    var p = partesData(iso);
    return p ? String(p.d).padStart(2, '0') + '/' + String(p.m).padStart(2, '0') + '/' + p.y : '—';
  }
  function fmtDataCurta(iso) {
    var p = partesData(iso);
    return p ? String(p.d).padStart(2, '0') + ' ' + MESES[p.m - 1] + ' ' + p.y : '—';
  }
  function diaSemana(iso) {
    var p = partesData(iso);
    return p ? DIAS[new Date(p.y, p.m - 1, p.d).getDay()] : '';
  }
  // LocalDateTime do Back-end ("2026-09-28T10:15:00") -> "28/09/2026, 10:15"
  function fmtDataHora(dt) {
    var m = /^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2})/.exec(dt || '');
    return m ? fmtData(m[1]) + ', ' + m[2] + ':' + m[3] : '';
  }
  function fmtHorario(h) { return String(h || '').replace(/^(\d{1,2}):(\d{2}).*$/, function (_, a, b) { return String(a).padStart(2, '0') + ':' + b; }); }
  function fmtMl(v) { return Number(v || 0).toLocaleString('pt-BR', { maximumFractionDigits: 2 }) + ' ml'; }
  function horaCurta(h) { var m = /^(\d{1,2}):(\d{2})/.exec(h || ''); return m ? String(m[1]).padStart(2, '0') + 'h' + m[2] : ''; }

  /* ---------- Chaves de notificação ---------- */
  function temId(id) { return id !== null && id !== undefined && id !== ''; }
  // <entidade>-<id real>-<evento>. Sem ID real devolve null (o evento não é listado).
  function chaveEvento(entidade, id, evento) { return temId(id) ? entidade + '-' + id + '-' + evento : null; }
  function chaveLegada(prefixo, id) { return temId(id) ? prefixo + id : null; }
  // Status do Back-end -> nome do evento na chave (ENTREGUE -> entregue, EM_PREPARACAO -> em-preparacao).
  function slugEvento(status) { return String(status || '').toLowerCase().replace(/_/g, '-'); }
  function estaLida(n, lidas) {
    lidas = lidas || [];
    return lidas.indexOf(n.key) !== -1 || (!!n.legado && lidas.indexOf(n.legado) !== -1);
  }
  function contarNaoLidas(notifications, lidas) {
    return (notifications || []).filter(function (n) { return !estaLida(n, lidas); }).length;
  }

  /* ---------- Derivação do estado ---------- */
  function derive(raw) {
    raw = raw || {};
    var triagem = raw.triagem || null;
    var exame = raw.exame || null;
    var kit = raw.kit || null;
    var doadora = raw.doadora || null;
    var coletas = (raw.coletas || []).slice();

    var tStatus = triagem ? up(triagem.status) : 'NAO_ENVIADA';
    var tAprovada = tStatus === 'APROVADA';
    var tRecusada = tStatus === 'NAO_APROVADA';
    var tEmAnalise = tStatus === 'PENDENTE' || tStatus === 'EM_ANALISE';

    var eStatus = exame ? up(exame.status) : '';
    var eAprovado = eStatus === 'APROVADA';
    var eReagendavel = !exame || eStatus === 'CANCELADA' || eStatus === 'NAO_APROVADA';

    var kStatus = kit ? up(kit.status) : '';
    var kitEntregue = kStatus === 'ENTREGUE';
    var kitEnviado = kStatus === 'ENVIADO';
    var kitPreparando = kStatus === 'EM_PREPARACAO';
    var kitAguardando = kStatus === 'AGUARDANDO_PREPARACAO';

    var realizadas = coletas.filter(function (c) { return isIn(COLETA_REALIZADA, c.status); });
    var abertas = coletas.filter(function (c) { return isIn(COLETA_ABERTA, c.status); });
    var recebidas = coletas.filter(function (c) { return up(c.status) === 'RECEBIDA'; });
    var naoCanceladas = coletas.filter(function (c) { return !isIn(COLETA_CANCELADA, c.status); });
    var coletaAberta = abertas[0] || null;
    var coletaStatus = coletaAberta ? up(coletaAberta.status) : '';
    var coletaConfirmada = coletaStatus === 'CONFIRMADA';

    var ml = realizadas.reduce(function (s, c) { return s + Number(c.volume || 0); }, 0);
    var metrics = {
      doacoes: realizadas.length,
      ml: ml,
      coletasRealizadas: realizadas.length,
      agendamentos: naoCanceladas.length
    };

    var exameQuando = exame ? fmtData(exame.data) + ' às ' + fmtHorario(exame.horario) : '';
    var coletaQuando = coletaAberta ? fmtData(coletaAberta.data) + (coletaAberta.turno ? ' (' + coletaAberta.turno + ')' : '') : '';
    var kitQuando = kit && kit.atualizadoEm ? fmtDataHora(kit.atualizadoEm) : '';

    /* Etapas: Cadastro -> Triagem -> Exame -> Kit -> Coleta -> Doação */
    var stages = [];
    stages.push({ key: 'cadastro', label: 'Cadastro', state: 'done', text: 'Concluído' });
    stages.push({
      key: 'triagem', label: 'Triagem',
      state: tAprovada ? 'done' : tRecusada ? 'refused' : tEmAnalise ? 'review' : 'next',
      text: tAprovada ? 'Aprovada' : tRecusada ? 'Não aprovada' : tEmAnalise ? 'Em análise' : 'Próxima etapa'
    });

    var ex;
    if (!tAprovada) ex = { state: 'locked', text: tEmAnalise ? 'Aguardando aprovação' : 'Bloqueado' };
    else if (eAprovado) ex = { state: 'done', text: 'Aprovado' };
    else if (eReagendavel) ex = { state: 'next', text: eStatus === 'NAO_APROVADA' ? 'Não aprovado — reagende' : 'Próxima etapa' };
    else ex = { state: 'scheduled', text: 'Agendado — ' + exameQuando };
    stages.push({ key: 'exame', label: 'Exame médico', state: ex.state, text: ex.text });

    var ks;
    if (!eAprovado) ks = { state: 'locked', text: tAprovada ? 'Aguardando exame' : 'Bloqueado' };
    else if (kitEntregue) ks = { state: 'done', text: 'Entregue' };
    else if (kitEnviado) ks = { state: 'scheduled', text: 'Enviado' };
    else if (kitPreparando) ks = { state: 'scheduled', text: 'Em preparação' };
    else ks = { state: 'next', text: 'Aguardando preparação' };
    stages.push({ key: 'kit', label: 'Kit de coleta', state: ks.state, text: ks.text });

    var co;
    if (!kitEntregue) co = { state: 'locked', text: eAprovado ? 'Aguardando kit' : 'Bloqueada' };
    else if (coletaConfirmada) co = { state: 'scheduled', text: 'Confirmada — ' + coletaQuando };
    else if (coletaAberta) co = { state: 'scheduled', text: (coletaStatus === 'PENDENTE' ? 'Pendente — ' : 'Agendada — ') + coletaQuando };
    else if (realizadas.length) co = { state: 'done', text: 'Realizada com sucesso' };
    else co = { state: 'next', text: 'Próxima etapa' };
    stages.push({ key: 'coleta', label: 'Coleta', state: co.state, text: co.text });

    stages.push({
      key: 'doacao', label: 'Doação',
      state: realizadas.length ? 'done' : 'locked',
      text: realizadas.length ? 'Registrada' : (kitEntregue ? 'Aguardando coleta' : 'Bloqueada')
    });

    /* As 5 etapas visuais do card "Sua jornada de doação" */
    var circles = {
      exame: { state: ex.state === 'scheduled' ? 'wait' : ex.state, text: ex.state === 'scheduled' ? 'Agendado ' + fmtData(exame.data) : ex.text },
      kit: !eAprovado ? { state: 'locked', text: 'Aguardando exame' }
        : kitEntregue ? { state: 'done', text: 'Entregue' }
        : kitEnviado ? { state: 'wait', text: 'Enviado' }
        : kitPreparando ? { state: 'wait', text: 'Em preparação' }
        : { state: 'next', text: 'Próxima etapa' },
      agenda: !kitEntregue ? { state: 'locked', text: eAprovado ? 'Aguardando kit' : 'Bloqueada' }
        : coletaAberta ? { state: 'done', text: 'Agendada ' + fmtData(coletaAberta.data) }
        : realizadas.length ? { state: 'done', text: 'Concluída' }
        : { state: 'next', text: 'Próxima etapa' },
      coleta: realizadas.length ? { state: 'done', text: 'Realizada com sucesso' }
        : coletaConfirmada ? { state: 'wait', text: 'Confirmada — aguardando coleta' }
        : coletaAberta ? { state: 'wait', text: 'Aguardando confirmação' }
        : { state: 'locked', text: 'Bloqueada' },
      final: recebidas.length ? { state: 'done', text: 'Recebida' }
        : realizadas.length ? { state: 'wait', text: 'Aguardando chegada' }
        : { state: 'locked', text: 'Bloqueada' }
    };

    /* Cartão de status no topo da jornada */
    var ultima = realizadas[0] || null;
    var status;
    if (realizadas.length && !coletaAberta) {
      status = { tone: 'aprovada', icon: '✓', title: 'Coleta realizada com sucesso!',
        text: 'A equipe Lactare confirmou que sua coleta foi realizada' + (ultima && ultima.volume ? ' de ' + fmtMl(ultima.volume) : '') + '. Obrigado por contribuir com a jornada Lactare.', pill: 'Realizada' };
    } else if (coletaConfirmada) {
      status = { tone: '', icon: '✓', title: 'Coleta confirmada!',
        text: 'A equipe Lactare confirmou sua coleta para ' + coletaQuando + '.', pill: 'Confirmada' };
    } else if (coletaAberta) {
      var pend = coletaStatus === 'PENDENTE';
      status = { tone: '', icon: '📅', title: pend ? 'Coleta pendente' : 'Coleta agendada',
        text: 'Retirada em ' + coletaQuando + (doadora && doadora.endereco ? ' — ' + doadora.endereco : '') + '.', pill: pend ? 'Pendente' : 'Agendada' };
    } else if (eAprovado && kitEntregue) {
      status = { tone: 'aprovada', icon: '✓', title: 'Kit entregue!',
        text: 'Seu kit de coleta foi entregue. Agora você pode agendar sua coleta.', pill: 'Kit entregue' };
    } else if (eAprovado && kitEnviado) {
      status = { tone: '', icon: '📦', title: 'Seu kit foi enviado!',
        text: 'A equipe Lactare enviou seu kit de coleta. Aguarde a entrega.', pill: 'Enviado' };
    } else if (eAprovado && kitPreparando) {
      status = { tone: '', icon: '📦', title: 'Seu kit está sendo preparado',
        text: 'A equipe Lactare está preparando o kit para a sua coleta.', pill: 'Em preparação' };
    } else if (eAprovado) {
      status = { tone: 'aprovada', icon: '✓', title: 'Exame médico aprovado!',
        text: 'Você já pode seguir para a próxima etapa. A equipe Lactare irá preparar seu kit de coleta.', pill: 'Aprovado' };
    } else if (tAprovada && exame && !eReagendavel) {
      status = { tone: '', icon: '📅', title: 'Exame médico agendado',
        text: 'Seu exame está marcado para ' + fmtData(exame.data) + ' às ' + fmtHorario(exame.horario) + '.', pill: 'Agendado' };
    } else if (tAprovada) {
      status = { tone: 'aprovada', icon: '✓', title: 'Triagem aprovada!',
        text: 'Sua triagem foi aprovada. Continue sua jornada guiada para realizar o agendamento do exame médico.', pill: 'Aprovada' };
    } else if (tRecusada) {
      status = { tone: 'recusada', icon: '!', title: 'Triagem não aprovada',
        text: 'A equipe Lactare analisou sua triagem. Entre em contato com a equipe para receber orientações sobre os próximos passos.', pill: 'Não aprovada' };
    } else if (tStatus === 'EM_ANALISE') {
      status = { tone: '', icon: '◷', title: 'Triagem em análise',
        text: 'Sua triagem está sendo analisada pela equipe Lactare.', pill: 'Em análise' };
    } else if (tStatus === 'PENDENTE') {
      status = { tone: '', icon: '⏳', title: 'Triagem enviada',
        text: 'Triagem aguardando análise.', pill: 'Aguardando análise' };
    } else {
      status = { tone: '', icon: '→', title: 'Próxima etapa: triagem',
        text: 'Responda à triagem para que a equipe Lactare possa iniciar a análise.', pill: 'Próxima etapa' };
    }

    /* Cartão "Próxima etapa" (dashboard) */
    var next;
    if (coletaConfirmada) next = { title: fmtDataCurta(coletaAberta.data), sub: 'Coleta confirmada' };
    else if (coletaAberta) next = { title: fmtDataCurta(coletaAberta.data), sub: coletaAberta.turno || 'Coleta agendada' };
    else if (realizadas.length) next = { title: 'Coleta realizada', sub: 'Realizada com sucesso' };
    else if (eAprovado && !kitEntregue) next = { title: 'Kit de coleta', sub: kitEnviado ? 'Kit enviado' : kitPreparando ? 'Kit em preparação' : 'Aguardando preparação' };
    else if (eAprovado) next = { title: 'Coleta', sub: realizadas.length ? 'Agende uma nova coleta' : 'Agende sua coleta' };
    else if (tAprovada && exame && !eReagendavel) next = { title: fmtDataCurta(exame.data), sub: horaCurta(exame.horario) || 'Exame médico' };
    else if (tAprovada) next = { title: 'Exame médico', sub: 'Agende seu exame' };
    else if (tRecusada) next = { title: 'Triagem', sub: 'Não aprovada' };
    else if (tEmAnalise) next = { title: 'Em análise', sub: 'Triagem com a equipe' };
    else next = { title: 'Triagem', sub: 'Envie suas respostas' };

    /* Notificações: só eventos que realmente aconteceram, em ordem cronológica lógica.
       Cada evento tem chave única <entidade>-<ID real>-<evento> (ex.: triagem-123-aprovada),
       para que uma nova triagem/exame/kit/coleta nunca herde o "lida" de outra.
       Sem ID real vindo da API não há identidade única: o evento não é listado (nunca inventamos ID).
       "legado" = chave antiga que já identificava a MESMA entidade (só existia com ID): preserva o
       "lida" já gravado no banco. Chaves genéricas antigas (triagem-aprovada etc.) NÃO são aceitas. */
    var ev = [];
    function addEv(item) { if (item.key) ev.push(item); }
    if (triagem) {
      var tId = triagem.id;
      addEv({ key: chaveEvento('triagem', tId, 'enviada'), cat: 'resultados', cor: 'blue', icon: 'file', titulo: 'Triagem enviada',
        texto: 'Estamos aguardando a análise da equipe Lactare.', quando: fmtDataHora(triagem.dataEnvio) });
      if (tStatus === 'EM_ANALISE') addEv({ key: chaveEvento('triagem', tId, 'analise'), cat: 'resultados', cor: 'yellow', icon: 'lab', titulo: 'Triagem em análise',
        texto: 'Sua triagem está sendo analisada pela equipe Lactare.', quando: fmtDataHora(triagem.analisadaEm) });
      if (tAprovada) addEv({ key: chaveEvento('triagem', tId, 'aprovada'), cat: 'resultados', cor: 'green', icon: 'file', titulo: 'Triagem aprovada!',
        texto: 'Sua triagem foi aprovada. Continue sua jornada guiada para realizar o agendamento do exame médico.', quando: fmtDataHora(triagem.analisadaEm) });
      if (tRecusada) addEv({ key: chaveEvento('triagem', tId, 'recusada'), cat: 'resultados', cor: 'pink', icon: 'file', titulo: 'Triagem não aprovada',
        texto: 'A equipe Lactare analisou sua triagem. Entre em contato com a equipe para receber orientações.', quando: fmtDataHora(triagem.analisadaEm) });
    }
    if (exame && tAprovada) {
      addEv({ key: chaveEvento('exame', exame.id, 'agendado'), legado: chaveLegada('exame-agendado-', exame.id), cat: 'agendamentos', cor: 'blue', icon: 'calendar', titulo: 'Exame médico agendado',
        texto: 'Seu exame está marcado para ' + fmtData(exame.data) + ' às ' + fmtHorario(exame.horario) + '.', quando: '' });
      if (eAprovado) addEv({ key: chaveEvento('exame', exame.id, 'aprovado'), legado: chaveLegada('exame-aprovado-', exame.id), cat: 'resultados', cor: 'green', icon: 'lab', titulo: 'Exame médico aprovado!',
        texto: 'Você já pode seguir para a próxima etapa.', quando: '' });
    }
    if (kit && eAprovado) {
      var kitTitulo = kitEntregue ? 'Kit de coleta entregue!' : kitEnviado ? 'Kit de coleta enviado!' : kitPreparando ? 'Kit de coleta em preparação' : 'Kit de coleta aguardando preparação';
      var kitTexto = kitEntregue ? 'Seu kit foi entregue. Agora você pode agendar sua coleta.' : kitEnviado ? 'A equipe Lactare enviou seu kit. Aguarde a entrega.' : kitPreparando ? 'A equipe Lactare está preparando seu kit para a coleta.' : 'A equipe Lactare recebeu a solicitação e iniciará a preparação do seu kit.';
      addEv({ key: chaveEvento('kit', kit.id, slugEvento(kStatus)), legado: kit.id == null ? null : 'kit-' + kit.id + '-' + kStatus, cat: 'agendamentos', cor: kitEntregue ? 'green' : 'blue', icon: 'truck', titulo: kitTitulo, texto: kitTexto, quando: kitQuando });
    }
    coletas.slice().sort(function (a, b) { return String(a.data).localeCompare(String(b.data)) || (a.id - b.id); }).forEach(function (c) {
      if (isIn(COLETA_CANCELADA, c.status)) return;
      if (isIn(COLETA_ABERTA, c.status)) {
        var cs = up(c.status);
        addEv({ key: chaveEvento('coleta', c.id, slugEvento(cs)), legado: c.id == null ? null : 'coleta-agendada-' + c.id + '-' + cs, cat: 'agendamentos', cor: cs === 'CONFIRMADA' ? 'green' : 'blue', icon: 'calendar',
          titulo: cs === 'CONFIRMADA' ? 'Coleta confirmada!' : (cs === 'PENDENTE' ? 'Coleta pendente' : 'Coleta agendada'),
          texto: cs === 'CONFIRMADA' ? 'A equipe Lactare confirmou sua coleta para ' + fmtData(c.data) + (c.turno ? ' (' + c.turno + ')' : '') + '.' : 'Sua coleta está marcada para ' + fmtData(c.data) + (c.turno ? ' (' + c.turno + ')' : '') + '.', quando: '' });
      } else if (isIn(COLETA_REALIZADA, c.status)) {
        addEv({ key: chaveEvento('coleta', c.id, 'realizada'), legado: chaveLegada('doacao-', c.id), cat: 'coletas', cor: 'green', icon: 'truck', titulo: 'Coleta realizada com sucesso!',
          texto: 'A equipe Lactare confirmou que sua coleta foi realizada' + (c.volume ? ' de ' + fmtMl(c.volume) : '') + '. Obrigado por contribuir com a jornada Lactare.', quando: fmtData(c.data) });
      }
    });
    var notifications = ev.reverse();

    return {
      stages: stages, circles: circles, status: status, next: next, metrics: metrics,
      realizadas: realizadas, notifications: notifications,
      podeAgendarExame: tAprovada && eReagendavel,
      podeAgendarColeta: eAprovado && kitEntregue && !coletaAberta,
      coletaAberta: coletaAberta,
      kit: kit,
      kitStatus: kStatus,
      kitEntregue: kitEntregue,
      coletaStatus: coletaStatus,
      coletaConfirmada: coletaConfirmada,
      exameQuando: exameQuando, coletaQuando: coletaQuando,
      triagemAprovada: tAprovada, exameAprovado: eAprovado
    };
  }

  /* ---------- Carga dos dados (somente da doadora logada) ---------- */
  // 404 = "ainda não existe" (estado vazio legítimo). Qualquer outro erro é propagado
  // para a tela NÃO mostrar zeros como se fossem dados reais.
  function vazioSe404(promise, vazio) {
    return promise.catch(function (e) { if (e && e.status === 404) return vazio; throw e; });
  }
  async function carregar(api) {
    var s = api.session();
    if (!s || s.perfil !== 'DOADORA' || !s.usuarioId) return null;
    var id = s.usuarioId;
    await migrarLidasLocais(api, id);
    var r = await Promise.all([
      vazioSe404(api.triagemDoadora(id), null),
      vazioSe404(api.exameDoadora(id), null),
      vazioSe404(api.coletasDoadora(id), []),
      vazioSe404(api.kitDoadora(id), null),
      api.doadora(id).catch(function () { return null; }),
      // Falha ao ler o estado lida/não lida não pode derrubar a jornada inteira:
      // null = "desconhecido" e o render mantém o último estado confirmado pela API.
      api.notificacoesLidas(id).then(function (x) { return (x && x.chaves) || []; }).catch(function (e) { return e && e.status === 404 ? [] : null; })
    ]);
    return { triagem: r[0], exame: r[1], coletas: r[2] || [], kit: r[3], doadora: r[4], lidas: r[5] };
  }

  // Versões anteriores guardavam o "lida" no localStorage. Envia uma única vez para a API
  // (fonte da verdade) e remove a chave local, para não reaparecer como não lida.
  async function migrarLidasLocais(api, id) {
    var ls, chave = lidasKey(id), antigas;
    try { ls = (typeof self !== 'undefined' ? self : globalThis).localStorage; antigas = JSON.parse(ls.getItem(chave) || '[]'); } catch (_) { return; }
    if (!Array.isArray(antigas)) { try { ls.removeItem(chave); } catch (_) {} return; }
    antigas = antigas.filter(function (k) { return typeof k === 'string' && k && k.length <= 120; }).slice(-200);
    if (!antigas.length) { try { ls.removeItem(chave); } catch (_) {} return; }
    try { await api.marcarNotificacoesLidas(id, antigas); ls.removeItem(chave); } catch (_) { /* tenta de novo no próximo ciclo */ }
  }

  /* ---------- Renderização (DOM) ---------- */
  var ICONES = { file: 'icon-file', lab: 'icon-lab', calendar: 'icon-calendar', truck: 'icon-truck', heart: 'icon-heart' };
  var ESTADO_ICONE = { done: '✓', next: '→', review: '⏳', scheduled: '⏳', refused: '✕', locked: '🔒' };

  function setText(doc, id, txt) { var el = doc.getElementById(id); if (el) el.textContent = txt; }

  // Chave legada (localStorage) — usada apenas para migrar para a API.
  function lidasKey(doadoraId) { return 'lactare_notif_lidas_' + doadoraId; }
  // Último estado "lida" confirmado pela API (usado se uma leitura falhar).
  var ultimasLidas = [];

  function render(doc, m, ctx) {
    ctx = ctx || {};
    // 1) cartão de status
    var card = doc.getElementById('doadoraTriagemStatusCard');
    if (card) {
      card.classList.remove('aprovada', 'recusada');
      if (m.status.tone) card.classList.add(m.status.tone);
      setText(doc, 'doadoraStatusIcon', m.status.icon);
      setText(doc, 'doadoraStatusKicker', 'STATUS DA JORNADA');
      setText(doc, 'doadoraStatusTitle', m.status.title);
      setText(doc, 'doadoraStatusText', m.status.text);
      setText(doc, 'doadoraStatusPill', m.status.pill);
    }

    // 2) etapas (Cadastro -> Doação)
    var ol = doc.getElementById('jornadaEtapas');
    if (ol) {
      ol.innerHTML = m.stages.map(function (s) {
        return '<li class="jetapa is-' + s.state + '"><span class="jetapa-ico">' + ESTADO_ICONE[s.state] + '</span>' +
          '<span class="jetapa-nome">' + esc(s.label) + '</span><span class="jetapa-txt">' + esc(s.text) + '</span></li>';
      }).join('');
    }

    // 3) círculos do card visual
    ['exame', 'kit', 'agenda', 'coleta', 'final'].forEach(function (k) {
      var step = doc.querySelector('#screen-perfil-nutriz .step-' + k);
      if (!step) return;
      var c = m.circles[k];
      step.classList.remove('is-done', 'is-next', 'is-wait', 'is-locked');
      step.classList.add('is-' + c.state);
      var cap = step.querySelector('.jstate');
      if (!cap) { cap = doc.createElement('div'); cap.className = 'jstate'; step.appendChild(cap); }
      cap.textContent = c.text;
      var title = step.querySelector('.jtitle');
      if (title) {
        if (k === 'kit') title.textContent = m.kitEntregue ? 'Kit entregue' : m.kitStatus === 'ENVIADO' ? 'Kit enviado' : m.kitStatus === 'EM_PREPARACAO' ? 'Kit em preparação' : 'Kit de coleta';
        if (k === 'agenda') title.textContent = m.coletaAberta ? 'Coleta agendada' : 'Agendar coleta';
        if (k === 'coleta') title.textContent = m.realizadas.length ? 'Coleta realizada' : m.coletaAberta && String(m.coletaAberta.status).toUpperCase() === 'CONFIRMADA' ? 'Coleta confirmada' : 'Coleta realizada';
      }
    });

    // 4) dashboard
    setText(doc, 'statColetasRealizadas', String(m.metrics.coletasRealizadas));
    setText(doc, 'nextStepTitle', m.next.title);
    setText(doc, 'nextStepSub', m.next.sub);

    // 5) histórico
    setText(doc, 'histTotalDoacoes', String(m.metrics.doacoes));
    setText(doc, 'histTotalMl', fmtMl(m.metrics.ml));
    setText(doc, 'histColetasRealizadas', String(m.metrics.coletasRealizadas));
    setText(doc, 'histAgendamentos', String(m.metrics.agendamentos));
    var tb = doc.getElementById('histTbody');
    if (tb) {
      if (!m.realizadas.length) {
        tb.innerHTML = '<tr><td colspan="3" class="history-empty">Nenhuma coleta realizada ainda.</td></tr>';
      } else {
        tb.innerHTML = m.realizadas.map(function (c) {
          var recebida = up(c.status) === 'RECEBIDA';
          return '<tr>' +
            '<td><span class="history-date"><svg><use href="#icon-calendar"></use></svg><span><strong>' + esc(fmtData(c.data)) + '</strong><small>' + esc(diaSemana(c.data) + (c.turno ? ' · ' + c.turno : '')) + '</small></span></span></td>' +
            '<td><span class="history-volume"><svg><use href="#icon-bottles"></use></svg>' + (c.volume ? esc(fmtMl(c.volume)) : 'Volume não informado') + '</span></td>' +
            '<td><span class="history-status history-status-success"><svg><use href="#icon-heart"></use></svg><span><strong>' + (recebida ? 'Recebida com sucesso!' : 'Realizada') + '</strong><small>Obrigada pela sua doação!</small></span></span></td>' +
            '</tr>';
        }).join('');
      }
    }
    setText(doc, 'histFooter', m.realizadas.length
      ? 'Mostrando ' + m.realizadas.length + ' de ' + m.realizadas.length + (m.realizadas.length === 1 ? ' doação' : ' doações')
      : 'Nenhuma doação registrada ainda.');

    // 6) notificações
    if (Array.isArray(ctx.lidas)) ultimasLidas = ctx.lidas;
    var lidas = ultimasLidas;
    var list = doc.getElementById('notifList');
    if (list) {
      list.innerHTML = m.notifications.length ? m.notifications.map(function (n) {
        var lida = estaLida(n, lidas);
        return '<article class="notification-card' + (lida ? ' is-read' : ' unread') + '" role="button" tabindex="0" data-category="' + n.cat + '" data-key="' + esc(n.key) + '">' +
          '<div class="notification-icon notification-icon-' + n.cor + '"><svg><use href="#' + ICONES[n.icon] + '"></use></svg></div>' +
          '<div class="notification-copy"><strong>' + esc(n.titulo) + '</strong><p>' + esc(n.texto) + '</p></div>' +
          '<time>' + esc(n.quando) + '</time><span class="notification-status-dot' + (lida ? ' muted' : '') + '"></span><span class="notification-arrow">›</span></article>';
      }).join('') : '<div class="notifications-empty">Você ainda não possui notificações.</div>';
    }
    var cont = { todas: m.notifications.length, coletas: 0, agendamentos: 0, resultados: 0, mensagens: 0 };
    m.notifications.forEach(function (n) { cont[n.cat] = (cont[n.cat] || 0) + 1; });
    Object.keys(cont).forEach(function (k) {
      var sp = doc.querySelector('#screen-perfil-nutriz .notification-filter[data-filter="' + k + '"] span');
      if (sp) sp.textContent = String(cont[k]);
    });
    // mantém o filtro ativo aplicado após re-render
    var ativo = doc.querySelector('#screen-perfil-nutriz .notification-filter.active');
    if (ativo && list) {
      var sel = ativo.getAttribute('data-filter');
      list.querySelectorAll('.notification-card').forEach(function (c) {
        c.style.display = (sel === 'todas' || c.getAttribute('data-category') === sel) ? '' : 'none';
      });
    }
    // Sino: o ponto vermelho existe enquanto houver ao menos uma notificação real não lida.
    var naoLidas = contarNaoLidas(m.notifications, lidas);
    var dot = doc.querySelector('#screen-perfil-nutriz .bell-dot');
    if (dot) dot.style.display = naoLidas > 0 ? '' : 'none';
    var bell = doc.querySelector('#screen-perfil-nutriz .bell-btn');
    if (bell) bell.setAttribute('aria-label', naoLidas > 0 ? 'Notificações (' + naoLidas + (naoLidas === 1 ? ' não lida)' : ' não lidas)') : 'Notificações');

    // 7) feedback: só coletas realizadas reais
    var sel2 = doc.getElementById('feedbackColetaSelect');
    if (sel2) {
      sel2.innerHTML = m.realizadas.length ? m.realizadas.map(function (c) {
        return '<option value="' + esc(c.id) + '">Coleta — ' + esc(fmtData(c.data)) + (c.volume ? ' (' + esc(fmtMl(c.volume)) + ')' : '') + '</option>';
      }).join('') : '<option>Nenhuma coleta realizada ainda</option>';
    }

    // 8) portões dos formulários de agendamento
    var btnExame = doc.getElementById('btnAgendarConsulta'), gateExame = doc.getElementById('consultaGateMessage');
    if (btnExame) btnExame.disabled = !m.podeAgendarExame;
    if (gateExame) gateExame.textContent = m.podeAgendarExame ? ''
      : m.exameAprovado ? 'Seu exame médico já foi aprovado.'
      : m.triagemAprovada ? 'Você já possui um exame médico agendado para ' + m.exameQuando + '.'
      : 'O exame médico será liberado após a aprovação da triagem.';
    var btnColeta = doc.getElementById('btnAgendarColeta'), gateColeta = doc.getElementById('agendamentoGateMessage');
    if (btnColeta) btnColeta.disabled = !m.podeAgendarColeta;
    if (gateColeta) gateColeta.textContent = m.podeAgendarColeta ? ''
      : m.coletaAberta ? 'Você já possui uma coleta agendada para ' + m.coletaQuando + '.'
      : m.exameAprovado && !m.kitEntregue ? 'A coleta será liberada depois que a equipe Lactare entregar o kit de coleta.'
      : m.triagemAprovada ? 'A coleta será liberada após a aprovação do exame médico e a entrega do kit.'
      : 'A coleta será liberada após a aprovação da triagem, do exame médico e a entrega do kit.';
  }

  return { derive: derive, carregar: carregar, render: render, fmtData: fmtData, lidasKey: lidasKey, migrarLidasLocais: migrarLidasLocais, estaLida: estaLida, contarNaoLidas: contarNaoLidas };
});
