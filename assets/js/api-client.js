(function (window) {
  const API_BASE_URL = window.LACTARE_API_BASE_URL || 'http://localhost:8080/api/v1';

  function token() { return localStorage.getItem('lactare_token') || ''; }
  function session() {
    try { return JSON.parse(localStorage.getItem('lactare_session') || 'null'); } catch (_) { return null; }
  }

  // Sincronização entre abas/janelas: quando um perfil altera um dado pela API,
  // os outros perfis abertos no mesmo navegador podem atualizar sem logout/login.
  const SYNC_KEY = 'lactare_data_changed_at';
  let syncChannel = null;
  try { syncChannel = 'BroadcastChannel' in window ? new BroadcastChannel('lactare-sync') : null; } catch (_) {}
  function notifyDataChanged() {
    const stamp = String(Date.now());
    try { localStorage.setItem(SYNC_KEY, stamp); } catch (_) {}
    try { if (syncChannel) syncChannel.postMessage({ type: 'data-changed', at: stamp }); } catch (_) {}
    try { window.dispatchEvent(new CustomEvent('lactare:data-changed', { detail: { at: stamp } })); } catch (_) {}
  }
  function onDataChanged(callback) {
    if (typeof callback !== 'function') return function() {};
    const handler = function () { callback(); };
    window.addEventListener('lactare:data-changed', handler);
    if (syncChannel) { try { syncChannel.addEventListener('message', function (e) { if (e.data && e.data.type === 'data-changed') callback(); }); } catch (_) {} }
    return function () { window.removeEventListener('lactare:data-changed', handler); };
  }

  async function request(path, options) {
    const opts = Object.assign({ headers: {} }, options || {});
    opts.headers = Object.assign({ 'Content-Type': 'application/json' }, opts.headers || {});
    const t = token();
    if (t) opts.headers.Authorization = 'Bearer ' + t;
    let response;
    try { response = await fetch(API_BASE_URL + path, opts); }
    catch (e) { throw new Error('Não foi possível conectar à API Lactare. Verifique se o Back-end está em execução.'); }
    let body = null;
    try { body = await response.json(); } catch (_) {}
    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem('lactare_token');
        localStorage.removeItem('lactare_session');
      }
      const message = body && (body.message || body.error || body.mensagem) || 'Não foi possível concluir a operação.';
      const err = new Error(message);
      err.status = response.status;
      throw err;
    }
    return body;
  }
  window.addEventListener('storage', function (event) {
    if (event.key === SYNC_KEY && event.newValue) {
      try { window.dispatchEvent(new CustomEvent('lactare:data-changed', { detail: { at: event.newValue } })); } catch (_) {}
    }
  });

  window.LactareAPI = {
    onDataChanged,
    notifyDataChanged,
    baseUrl: API_BASE_URL,
    session,
    request,
    login: (usuario, senha) => request('/auth/login', { method: 'POST', body: JSON.stringify({ usuario, senha }) }),
    logout: () => request('/auth/logout', { method: 'POST' }).catch(() => null),
    cadastrarDoadora: async data => { const r = await request('/doadoras', { method: 'POST', body: JSON.stringify(data) }); notifyDataChanged(); return r; },
    doadoras: () => request('/doadoras'),
    doadora: id => request('/doadoras/' + id),
    apoio: id => request('/apoios/' + id),
    cadastrarApoio: async data => { const r = await request('/apoios', { method: 'POST', body: JSON.stringify(data) }); notifyDataChanged(); return r; },
    apoios: () => request('/apoios'),
    coletas: () => request('/coletas'),
    consultas: () => request('/consultas'),
    criarTriagem: async data => { const r = await request('/triagens', { method: 'POST', body: JSON.stringify(data) }); notifyDataChanged(); return r; },
    triagemDoadora: id => request('/triagens/doadora/' + id),
    triagem: id => request('/triagens/' + id),
    triagens: () => request('/triagens'),
    statusTriagem: async (id, status) => { const r = await request('/triagens/' + id + '/status', { method: 'PATCH', body: JSON.stringify({ status }) }); notifyDataChanged(); return r; },
    profissionais: () => request('/profissionais'),
    exameDoadora: id => request('/consultas/doadora/' + id + '/exame-medico'),
    agendarExame: async data => { const r = await request('/consultas/exame-medico', { method: 'POST', body: JSON.stringify(data) }); notifyDataChanged(); return r; },
    aprovarExame: async id => { const r = await request('/consultas/' + id + '/aprovar-exame', { method: 'PUT' }); notifyDataChanged(); return r; },
    confirmarAgendamentoExame: async id => { const r = await request('/consultas/' + id + '/confirmar-exame', { method: 'PUT' }); notifyDataChanged(); return r; },
    realizarExame: async id => { const r = await request('/consultas/' + id + '/realizar-exame', { method: 'PUT' }); notifyDataChanged(); return r; },
    resultadoExame: async (id, status) => { const r = await request('/consultas/' + id + '/resultado-exame', { method: 'PUT', body: JSON.stringify({ status }) }); notifyDataChanged(); return r; },
    coletasDoadora: id => request('/coletas/doadora/' + id),
    kits: () => request('/kits'),
    kitDoadora: id => request('/kits/doadora/' + id),
    prepararKit: async id => { const r = await request('/kits/' + id + '/preparar', { method: 'PUT' }); notifyDataChanged(); return r; },
    enviarKit: async id => { const r = await request('/kits/' + id + '/enviar', { method: 'PUT' }); notifyDataChanged(); return r; },
    entregarKit: async id => { const r = await request('/kits/' + id + '/entregar', { method: 'PUT' }); notifyDataChanged(); return r; },
    agendarColeta: async data => { const r = await request('/coletas/agendamento', { method: 'POST', body: JSON.stringify(data) }); notifyDataChanged(); return r; },
    confirmarColeta: async id => { const r = await request('/coletas/' + id + '/confirmar', { method: 'PUT' }); notifyDataChanged(); return r; },
    realizarColeta: async id => { const r = await request('/coletas/' + id + '/realizar', { method: 'PUT' }); notifyDataChanged(); return r; },
    feedbacksDoadora: id => request('/feedbacks/doadora/' + id),
    notificacoesLidas: id => request('/notificacoes/doadora/' + id + '/lidas'),
    marcarNotificacoesLidas: async (id, chaves) => { const r = await request('/notificacoes/doadora/' + id + '/lidas', { method: 'PUT', body: JSON.stringify({ chaves }) }); notifyDataChanged(); return r; },
    criarFeedback: async data => { const r = await request('/feedbacks', { method: 'POST', body: JSON.stringify(data) }); notifyDataChanged(); return r; }
  };
})(window);
