/* Testes das chaves de notificação da Doadora (executar: node --test frontend/tests/notificacoes-chaves.test.js).
   Usam o código real de assets/js/doadora-jornada.js. LACTARE_JORNADA_PATH permite apontar
   para outra versão do arquivo (ex.: a original) para comprovar que os testes detectam o defeito.
   Os objetos de triagem/exame/kit/coleta abaixo são ENTRADAS DE TESTE, não dados do produto. */
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const J = require(process.env.LACTARE_JORNADA_PATH || path.join(__dirname, '../assets/js/doadora-jornada.js'));

const triagem = (id, status) => ({ id, status, dataEnvio: '2026-09-01T10:00:00', analisadaEm: '2026-09-02T11:30:00' });
const derivar = (extra) => J.derive(Object.assign({ triagem: null, exame: null, coletas: [], kit: null, doadora: { id: 7 }, lidas: [] }, extra));
const chaves = (m) => m.notifications.map((n) => n.key);

// Simula o contrato da API de leitura (idempotente): guarda as chaves marcadas, como o banco faz.
function fakeBanco() {
  const lidas = new Set();
  return { lidas, marcar: (ks) => ks.forEach((k) => lidas.add(k)), lista: () => Array.from(lidas) };
}

// Documento mínimo: o render real escreve a lista e o ponto vermelho do sino.
function fakeDoc() {
  const lista = { innerHTML: '' }, dot = { style: { display: '' } };
  return {
    lista, dot,
    getElementById: (id) => (id === 'notifList' ? lista : null),
    querySelector: (sel) => (sel === '#screen-perfil-nutriz .bell-dot' ? dot : null)
  };
}
const renderizar = (m, lidas) => { const d = fakeDoc(); J.render(d, m, { lidas }); return d; };

/* ---------------- TESTE 3 — duas triagens = dois eventos diferentes ---------------- */
test('T3: triagens 101 e 202 geram chaves distintas', () => {
  const m101 = derivar({ triagem: triagem(101, 'APROVADA') });
  const m202 = derivar({ triagem: triagem(202, 'APROVADA') });
  assert.ok(chaves(m101).includes('triagem-101-aprovada'), chaves(m101).join(','));
  assert.ok(chaves(m101).includes('triagem-101-enviada'));
  assert.ok(chaves(m202).includes('triagem-202-aprovada'), chaves(m202).join(','));
  assert.ok(chaves(m202).includes('triagem-202-enviada'));
  assert.notEqual('triagem-101-aprovada', 'triagem-202-aprovada');
  assert.ok(!chaves(m101).includes('triagem-aprovada'), 'chave genérica não pode existir');
});

/* ---------------- TESTE 4 — marcar a primeira como lida ---------------- */
test('T4: marcar triagem-101-aprovada não marca triagem-202-aprovada; sino continua vermelho', () => {
  const banco = fakeBanco();
  const n101 = derivar({ triagem: triagem(101, 'APROVADA') }).notifications;
  const m202 = derivar({ triagem: triagem(202, 'APROVADA') });
  banco.marcar(['triagem-101-aprovada']);

  const lidas = banco.lista();
  const k101 = n101.find((n) => n.key === 'triagem-101-aprovada');
  const k202 = m202.notifications.find((n) => n.key === 'triagem-202-aprovada');
  assert.equal(J.estaLida(k101, lidas), true);
  assert.equal(J.estaLida(k202, lidas), false);

  // lista com os dois eventos: ainda há não lidas
  assert.ok(J.contarNaoLidas(n101.concat(m202.notifications), lidas) > 0);
  // render real: ponto vermelho visível e cartão da 202-aprovada como não lido
  const doc = renderizar(m202, lidas);
  assert.equal(doc.dot.style.display, '');
  assert.match(doc.lista.innerHTML, /class="notification-card unread"[^>]*data-key="triagem-202-aprovada"/);
});

/* ---------------- TESTE 5 — marcar a segunda ---------------- */
test('T5: marcar triagem-202-aprovada (e as demais) zera as não lidas e some o ponto vermelho', () => {
  const banco = fakeBanco();
  const n101 = derivar({ triagem: triagem(101, 'APROVADA') }).notifications;
  const m202 = derivar({ triagem: triagem(202, 'APROVADA') });
  banco.marcar(['triagem-101-aprovada']);
  banco.marcar(chaves(m202)); // "marcar todas como lidas" da lista atual (inclui triagem-202-aprovada)
  banco.marcar(n101.map((n) => n.key));

  const lidas = banco.lista();
  assert.ok(lidas.includes('triagem-202-aprovada'));
  assert.equal(J.contarNaoLidas(n101.concat(m202.notifications), lidas), 0);
  const doc = renderizar(m202, lidas);
  assert.equal(doc.dot.style.display, 'none');
  assert.doesNotMatch(doc.lista.innerHTML, /notification-card unread/);
});

/* ---------------- TESTE 6 — nova triagem 303 ---------------- */
test('T6: triagem 303 aprovada aparece NÃO LIDA mesmo com 101 e 202 já lidas', () => {
  const banco = fakeBanco();
  banco.marcar(['triagem-101-enviada', 'triagem-101-aprovada', 'triagem-202-enviada', 'triagem-202-aprovada']);
  const m303 = derivar({ triagem: triagem(303, 'APROVADA') });
  assert.ok(chaves(m303).includes('triagem-303-aprovada'), chaves(m303).join(','));

  const lidas = banco.lista();
  const k303 = m303.notifications.find((n) => n.key === 'triagem-303-aprovada');
  assert.equal(J.estaLida(k303, lidas), false);
  const doc = renderizar(m303, lidas);
  assert.equal(doc.dot.style.display, '');
  assert.match(doc.lista.innerHTML, /class="notification-card unread"[^>]*data-key="triagem-303-aprovada"/);
});

test('T6b: triagem recusada e em análise também usam o ID real', () => {
  assert.ok(chaves(derivar({ triagem: triagem(456, 'NAO_APROVADA') })).includes('triagem-456-recusada'));
  assert.ok(chaves(derivar({ triagem: triagem(456, 'EM_ANALISE') })).includes('triagem-456-analise'));
});

/* ---------------- Auditoria: exame, kit, coleta usam IDs reais ---------------- */
test('exame usa o ID real e só notifica aprovação quando aprovado', () => {
  const ex = (id, status) => ({ id, status, data: '2026-09-10', horario: '09:00:00' });
  const ag = derivar({ triagem: triagem(1, 'APROVADA'), exame: ex(123, 'AGENDADA') });
  assert.ok(chaves(ag).includes('exame-123-agendado'));
  assert.ok(!chaves(ag).includes('exame-123-aprovado'), 'não há evento de aprovação ainda');
  const ap = derivar({ triagem: triagem(1, 'APROVADA'), exame: ex(123, 'APROVADA') });
  assert.ok(chaves(ap).includes('exame-123-aprovado'));
  // novo exame (outro ID) = novo evento, mesmo com o mesmo tipo
  const novo = derivar({ triagem: triagem(1, 'APROVADA'), exame: ex(124, 'APROVADA') });
  assert.ok(chaves(novo).includes('exame-124-aprovado'));
  assert.ok(!chaves(novo).includes('exame-123-aprovado'));
});

test('kit usa o ID real e o status atual (enviado / entregue)', () => {
  const base = { triagem: triagem(1, 'APROVADA'), exame: { id: 5, status: 'APROVADA', data: '2026-09-10', horario: '09:00' } };
  assert.ok(chaves(derivar(Object.assign({ kit: { id: 456, status: 'ENVIADO' } }, base))).includes('kit-456-enviado'));
  assert.ok(chaves(derivar(Object.assign({ kit: { id: 456, status: 'ENTREGUE' } }, base))).includes('kit-456-entregue'));
  assert.ok(chaves(derivar(Object.assign({ kit: { id: 456, status: 'EM_PREPARACAO' } }, base))).includes('kit-456-em-preparacao'));
  assert.ok(chaves(derivar(Object.assign({ kit: { id: 457, status: 'ENVIADO' } }, base))).includes('kit-457-enviado'));
});

test('coleta usa o ID real: agendada, confirmada e realizada', () => {
  const c = (id, status) => ({ id, status, data: '2026-09-20', turno: 'MANHA', volume: 250 });
  assert.ok(chaves(derivar({ coletas: [c(789, 'AGENDADA')] })).includes('coleta-789-agendada'));
  assert.ok(chaves(derivar({ coletas: [c(789, 'PENDENTE')] })).includes('coleta-789-pendente'));
  assert.ok(chaves(derivar({ coletas: [c(789, 'CONFIRMADA')] })).includes('coleta-789-confirmada'));
  assert.ok(chaves(derivar({ coletas: [c(789, 'REALIZADA')] })).includes('coleta-789-realizada'));
  const duas = chaves(derivar({ coletas: [c(789, 'REALIZADA'), c(790, 'REALIZADA')] }));
  assert.ok(duas.includes('coleta-789-realizada') && duas.includes('coleta-790-realizada'));
  assert.equal(chaves(derivar({ coletas: [c(791, 'CANCELADA')] })).length, 0, 'cancelada não notifica');
});

/* ---------------- Evento real, sem inventar ---------------- */
test('sem evento real não há notificação; sem ID real não se inventa chave', () => {
  assert.equal(derivar({}).notifications.length, 0);
  const pend = chaves(derivar({ triagem: triagem(9, 'PENDENTE') }));
  assert.deepEqual(pend, ['triagem-9-enviada']);
  const semId = derivar({ triagem: { status: 'APROVADA', dataEnvio: '2026-09-01T10:00:00' } });
  assert.equal(semId.notifications.length, 0);
  chaves(semId).concat(chaves(derivar({ coletas: [{ status: 'REALIZADA', data: '2026-09-20' }] })))
    .forEach((k) => assert.doesNotMatch(k, /undefined|null/));
});

test('texto da notificação usa dados reais da API', () => {
  const m = derivar({ coletas: [{ id: 1, status: 'CONFIRMADA', data: '2026-09-20', turno: 'TARDE' }] });
  assert.match(m.notifications[0].texto, /20\/09\/2026/);
  assert.match(m.notifications[0].texto, /TARDE/);
});

/* ---------------- Compatibilidade do "lida" já gravado no banco ---------------- */
test('chave antiga COM ID (mesma entidade) continua valendo como lida', () => {
  const m = derivar({ triagem: triagem(1, 'APROVADA'), exame: { id: 123, status: 'APROVADA', data: '2026-09-10', horario: '09:00' },
    coletas: [{ id: 9, status: 'REALIZADA', data: '2026-09-20' }] });
  const n = (k) => m.notifications.find((x) => x.key === k);
  assert.equal(J.estaLida(n('exame-123-aprovado'), ['exame-aprovado-123']), true);
  assert.equal(J.estaLida(n('coleta-9-realizada'), ['doacao-9']), true);
  assert.equal(J.estaLida(n('exame-123-aprovado'), ['exame-aprovado-999']), false, 'ID diferente não vale');
});

test('chave genérica antiga (triagem-aprovada) NÃO marca nenhuma triagem como lida', () => {
  const m = derivar({ triagem: triagem(303, 'APROVADA') });
  const k = m.notifications.find((x) => x.key === 'triagem-303-aprovada');
  assert.equal(J.estaLida(k, ['triagem-aprovada', 'triagem-enviada']), false);
});

/* ---------------- Notificação pertence à Doadora correta ---------------- */
test('carregar() busca e lê o estado "lida" somente da Doadora da sessão', async () => {
  const store = new Map();
  globalThis.localStorage = { getItem: (k) => (store.has(k) ? store.get(k) : null), setItem: (k, v) => store.set(k, v), removeItem: (k) => store.delete(k) };
  const chamadas = [];
  const reg = (nome, ret) => (id) => { chamadas.push([nome, id]); return Promise.resolve(ret); };
  const api = {
    session: () => ({ perfil: 'DOADORA', usuarioId: 7 }),
    triagemDoadora: reg('triagem', triagem(101, 'APROVADA')), exameDoadora: reg('exame', null), coletasDoadora: reg('coletas', []),
    kitDoadora: reg('kit', null), doadora: reg('doadora', { id: 7 }), notificacoesLidas: reg('lidas', { chaves: ['triagem-101-aprovada'] }),
    marcarNotificacoesLidas: () => assert.fail('não deve marcar nada neste teste')
  };
  const raw = await J.carregar(api);
  assert.ok(chamadas.length >= 6);
  chamadas.forEach(([nome, id]) => assert.equal(id, 7, nome + ' deveria usar o ID 7 da sessão'));
  assert.deepEqual(raw.lidas, ['triagem-101-aprovada']);

  const outroPerfil = Object.assign({}, api, { session: () => ({ perfil: 'MEDICO', usuarioId: null }) });
  assert.equal(await J.carregar(outroPerfil), null, 'perfis não-Doadora não carregam notificações');
});
