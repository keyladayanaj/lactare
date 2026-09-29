function showScreen(id) {
  var screen = document.getElementById(id);
  if (screen) {
    document.querySelectorAll('.screen').forEach(function (item) { item.classList.remove('active'); });
    screen.classList.add('active');
    window.scrollTo(0, 0);
  }
}

function goToLogin() { window.location.href = '../../pages/login/doadora.html'; }
function goToCadastro() { currentStep = 1; window.location.href = '../../pages/cadastro/doadora.html'; }
function goToCadastroFamilia() { window.location.href = '../../pages/cadastro/familia.html'; }
function goToLoginEquipe() { window.location.href = '../../pages/login/equipe.html'; }
function goToLoginApoio() { window.location.href = '../../pages/login/apoio.html'; }
function goToPerfilNutriz() { window.location.href = '../../pages/perfis/nutriz.html'; }
function goToPerfilApoio() { window.location.href = '../../pages/perfis/apoio.html'; }
function goToDashboards() {
  window.location.href = '../../pages/perfis/equipe.html';
}
function goToPerfilMedico() {
  window.location.href = '../../pages/perfis/medico.html';
}

async function loginDoadora() {
  var user=document.getElementById('doadora-user'), pass=document.getElementById('doadora-pass'), erro=document.getElementById('doadora-login-error');
  try { var auth=await LactareAPI.login((user&&user.value||'').trim(), pass&&pass.value||''); if(auth.perfil!=='DOADORA') throw new Error('Este acesso é destinado a doadoras.'); localStorage.setItem('lactare_token',auth.token); localStorage.setItem('lactare_session',JSON.stringify(auth)); if(erro) erro.hidden=true; goToPerfilNutriz(); } catch(e) { if(erro){erro.hidden=false; erro.textContent=e.message;} }
}

async function loginFamilia() {
  var user=document.getElementById('familia-user'), pass=document.getElementById('familia-pass'), erro=document.getElementById('familia-login-error');
  try { var auth=await LactareAPI.login((user&&user.value||'').trim(), pass&&pass.value||''); if(auth.perfil!=='APOIO') throw new Error('Este acesso é destinado à Rede de Apoio.'); localStorage.setItem('lactare_token',auth.token); localStorage.setItem('lactare_session',JSON.stringify(auth)); if(erro) erro.hidden=true; goToPerfilApoio(); } catch(e) { if(erro){erro.hidden=false; erro.textContent=e.message;} }
}


async function loginEquipe() {
  var user=document.getElementById('eq-user'), pass=document.getElementById('eq-pass'), erro=document.getElementById('eq-login-error');
  try {
    var auth=await LactareAPI.login((user&&user.value||'').trim(),pass&&pass.value||'');
    if(auth.perfil!=='EQUIPE' && auth.perfil!=='MEDICO') throw new Error('Acesso restrito à Equipe Lactare.');
    localStorage.setItem('lactare_token',auth.token);
    localStorage.setItem('lactare_session',JSON.stringify(auth));
    if(erro)erro.hidden=true;
    if(auth.perfil==='MEDICO') goToPerfilMedico(); else goToDashboards();
  } catch(e){if(erro){erro.hidden=false;erro.textContent=e.message;}}
}


async function loginApoio() {
  var user=document.getElementById('ap-user'), pass=document.getElementById('ap-pass'), erro=document.getElementById('ap-login-error');
  try { var auth=await LactareAPI.login((user&&user.value||'').trim(),pass&&pass.value||''); if(auth.perfil!=='APOIO') throw new Error('Acesso restrito à Rede de Apoio.'); localStorage.setItem('lactare_token',auth.token); localStorage.setItem('lactare_session',JSON.stringify(auth)); if(erro)erro.hidden=true; goToPerfilApoio(); }
  catch(e){if(erro){erro.hidden=false;erro.textContent=e.message;}}
}


function togglePasswordVisibility(inputId, button) {
  var input = document.getElementById(inputId);

  if (!input) {
    return;
  }

  var showing = input.type === 'text';
  input.type = showing ? 'password' : 'text';
  button.setAttribute('aria-label', showing ? 'Mostrar senha' : 'Ocultar senha');
  button.classList.toggle('is-visible', !showing);
}


document.addEventListener('input', function (e) {

  if (!e.target) {
    return;
  }


  if (
    e.target.id === 'doadora-user' ||
    e.target.id === 'doadora-pass'
  ) {
    var erroDoadora =
      document.getElementById('doadora-login-error');

    if (erroDoadora) {
      erroDoadora.hidden = true;
    }
  }


  if (
    e.target.id === 'familia-user' ||
    e.target.id === 'familia-pass'
  ) {
    var erroFamilia =
      document.getElementById('familia-login-error');

    if (erroFamilia) {
      erroFamilia.hidden = true;
    }
  }


  if (
    e.target.id === 'eq-user' ||
    e.target.id === 'eq-pass'
  ) {
    var erroEquipe =
      document.getElementById('eq-login-error');

    if (erroEquipe) {
      erroEquipe.hidden = true;
    }
  }


  if (
    e.target.id === 'ap-user' ||
    e.target.id === 'ap-pass'
  ) {
    var erroApoio =
      document.getElementById('ap-login-error');

    if (erroApoio) {
      erroApoio.hidden = true;
    }
  }

});

var currentStep = 1;
var totalSteps = 4;


function renderStep() {

  document.querySelectorAll('.step').forEach(function (el) {

    var n =
      parseInt(
        el.getAttribute('data-step'),
        10
      );

    el.classList.remove(
      'current',
      'done'
    );

    if (n < currentStep) {
      el.classList.add('done');
    }

    if (n === currentStep) {
      el.classList.add('current');
    }

  });


  document.querySelectorAll('.wizard-panel').forEach(function (el) {

    var n =
      parseInt(
        el.getAttribute('data-panel'),
        10
      );

    el.hidden =
      n !== currentStep;

  });


  var backBtn =
    document.getElementById('btn-back-1');

  if (backBtn) {
    backBtn.disabled =
      currentStep === 1;
  }


  var card =
    document.querySelector(
      '#screen-cadastro .wizard-card'
    );

  if (
    card &&
    document.getElementById('screen-cadastro').classList.contains('active')
  ) {
    card.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });
  }

}


function getPanel(step) {

  return document.querySelector(
    '.wizard-panel[data-panel="' + step + '"]'
  );

}


function clearStepErrors(panel) {

  panel
    .querySelectorAll('.invalid')
    .forEach(function (el) {
      el.classList.remove('invalid');
    });


  panel
    .querySelectorAll('.field-error')
    .forEach(function (el) {
      el.remove();
    });


  var banner =
    panel.querySelector(
      '.step-error-banner'
    );

  if (banner) {
    banner.remove();
  }

}


function markInvalid(el, message) {

  var wrapper =
    el.closest('.field') ||
    el.closest('.check-line');

  if (!wrapper) {
    return;
  }


  wrapper.classList.add('invalid');


  if (message) {

    var msg =
      document.createElement('div');

    msg.className =
      'field-error';

    msg.textContent =
      message;

    wrapper.appendChild(msg);

  }

}


function showStepErrorBanner(panel) {

  if (
    panel.querySelector(
      '.step-error-banner'
    )
  ) {
    return;
  }


  var banner =
    document.createElement('div');

  banner.className =
    'step-error-banner';

  banner.textContent =
    'Preencha corretamente os campos destacados antes de continuar.';


  var body =
    panel.querySelector('.wizard-body');

  body.insertBefore(
    banner,
    body.firstChild
  );

}


function validateStep(step) {

  var panel =
    getPanel(step);

  if (!panel) {
    return true;
  }


  clearStepErrors(panel);


  var valid = true;
  var firstInvalid = null;


  panel
    .querySelectorAll('[required]')
    .forEach(function (el) {

      var ok;


      if (el.type === 'checkbox') {
        ok = el.checked;
      } else {
        ok =
          el.value.trim() !== '';
      }


      if (!ok) {

        valid = false;

        markInvalid(el);

        if (!firstInvalid) {
          firstInvalid = el;
        }

      }

    });


  if (step === 1) {

    var cpf =
      panel.querySelector(
        '#dados-cpf'
      );


    if (
      cpf &&
      cpf.value.trim() !== ''
    ) {

      var cpfDigits =
        cpf.value.replace(
          /\D/g,
          ''
        );


      if (cpfDigits.length !== 11) {

        valid = false;

        markInvalid(
          cpf,
          'O CPF deve ter 11 números.'
        );


        if (!firstInvalid) {
          firstInvalid = cpf;
        }

      }

    }

  }


  if (step === 3) {

    var email =
      panel.querySelector(
        '#acesso-email'
      );


    var emailConfirm =
      panel.querySelector(
        '#acesso-email-confirm'
      );


    var senha =
      panel.querySelector(
        '#acesso-senha'
      );


    var senhaConfirm =
      panel.querySelector(
        '#acesso-senha-confirm'
      );


    var usuario =
      panel.querySelector(
        '#acesso-usuario'
      );


    var emailRegex =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;


    if (
      email &&
      email.value.trim() !== '' &&
      !emailRegex.test(
        email.value.trim()
      )
    ) {

      valid = false;

      markInvalid(
        email,
        'Informe um e-mail válido.'
      );


      if (!firstInvalid) {
        firstInvalid = email;
      }

    }


    if (
      email &&
      emailConfirm &&
      email.value.trim() !== '' &&
      emailConfirm.value.trim() !== '' &&
      email.value.trim().toLowerCase() !==
      emailConfirm.value.trim().toLowerCase()
    ) {

      valid = false;

      markInvalid(
        emailConfirm,
        'Os e-mails não coincidem.'
      );


      if (!firstInvalid) {
        firstInvalid =
          emailConfirm;
      }

    }


    if (
      senha &&
      senhaConfirm &&
      senha.value !== '' &&
      senhaConfirm.value !== '' &&
      senha.value !== senhaConfirm.value
    ) {

      valid = false;

      markInvalid(
        senhaConfirm,
        'As senhas não coincidem.'
      );


      if (!firstInvalid) {
        firstInvalid =
          senhaConfirm;
      }

    }


    if (
      usuario &&
      usuario.value.trim() !== '' &&
      usuarioExiste(
        DOADORA_CREDENCIAIS,
        usuario.value
      )
    ) {

      valid = false;

      markInvalid(
        usuario,
        'Este nome de usuário já está cadastrado.'
      );


      if (!firstInvalid) {
        firstInvalid =
          usuario;
      }

    }

  }


  if (!valid) {

    showStepErrorBanner(panel);

    if (firstInvalid) {
      firstInvalid.focus();
    }

  }


  return valid;

}


document.addEventListener(
  'input',
  function (e) {

    var field =
      e.target.closest &&
      e.target.closest(
        '.field.invalid, .check-line.invalid'
      );


    if (field) {
      field.classList.remove('invalid');
    }

  }
);


document.addEventListener(
  'change',
  function (e) {

    var field =
      e.target.closest &&
      e.target.closest(
        '.field.invalid, .check-line.invalid'
      );


    if (field) {
      field.classList.remove('invalid');
    }

  }
);


function nextStep() {

  if (currentStep < totalSteps) {

    if (!validateStep(currentStep)) {
      return;
    }

    currentStep++;

    renderStep();

  }

}


function prevStep() {

  if (currentStep > 1) {

    currentStep--;

    renderStep();

  }

}


async function finalizarCadastroFamilia() {
  var ids=['familia-nome','familia-data-nascimento','familia-rg','familia-cpf','familia-endereco','familia-bairro','familia-cidade','familia-cep','familia-telefone','familia-email','familia-novo-user','familia-nova-senha','familia-confirma-senha'];
  var erro=document.getElementById('familia-cadastro-error');
  var v=function(id){var e=document.getElementById(id);return e?e.value.trim():'';};
  if(ids.some(function(id){return !v(id);})){erro.hidden=false;erro.textContent='Preencha todos os campos.';return;}
  if(v('familia-nova-senha')!==v('familia-confirma-senha')){erro.hidden=false;erro.textContent='As senhas não coincidem.';return;}
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v('familia-email'))){erro.hidden=false;erro.textContent='Informe um e-mail válido.';return;}
  var nascimento=v('familia-data-nascimento'), p=nascimento.split('/');
  var dataNascimento=p.length===3?p[2]+'-'+String(p[1]).padStart(2,'0')+'-'+String(p[0]).padStart(2,'0'):nascimento;
  try {
    await LactareAPI.cadastrarApoio({nome:v('familia-nome'),usuario:v('familia-novo-user'),senha:v('familia-nova-senha'),dataNascimento:dataNascimento,email:v('familia-email'),endereco:v('familia-endereco'),rg:v('familia-rg').replace(/\D/g,''),cpf:v('familia-cpf').replace(/\D/g,''),telefone:v('familia-telefone'),cidade:v('familia-cidade'),bairro:v('familia-bairro'),cep:v('familia-cep').replace(/\D/g,'')});
    var auth=await LactareAPI.login(v('familia-novo-user'),v('familia-nova-senha'));
    localStorage.setItem('lactare_token',auth.token); localStorage.setItem('lactare_session',JSON.stringify(auth));
    erro.hidden=true; alert('Cadastro realizado com sucesso!'); goToPerfilApoio();
  } catch(e) { erro.hidden=false; erro.textContent=e.message; }
}

function limparCadastroFamilia() {

  var campos = [
    'familia-nome',
    'familia-telefone',
    'familia-email',
    'familia-data-nascimento',
    'familia-rg',
    'familia-cpf',
    'familia-endereco',
    'familia-bairro',
    'familia-cidade',
    'familia-cep',
    'familia-novo-user',
    'familia-nova-senha',
    'familia-confirma-senha'
  ];


  campos.forEach(function (id) {

    var campo =
      document.getElementById(id);

    if (campo) {
      campo.value = '';
    }

  });


  var erro =
    document.getElementById(
      'familia-cadastro-error'
    );


  if (erro) {
    erro.hidden = true;
  }

}


document.addEventListener(
  'DOMContentLoaded',
  function () {

    var apoioHomeLink = document.querySelector('#screen-perfil-apoio #apoioMenu a[data-tab="inicio"]');
    if (apoioHomeLink) {
      showApoioTab('inicio', apoioHomeLink);
    }

    if (
      document.getElementById(
        'stepper'
      )
    ) {
      renderStep();
    }


    buildCalendar(
      'calRegistro',
      25,
      [6, 13, 20, 28]
    );


    buildCalendar(
      'calAgendaNutriz',
      25,
      [6, 13, 20, 28]
    );


    buildCalendar(
      'calApoio',
      25,
      [6, 13, 20, 28]
    );


    var monthsData = [
      38,
      30,
      42,
      35,
      50,
      55,
      48,
      64,
      58,
      45,
      33,
      25
    ];


    var yearsData = [
      1024,
      1180,
      1350,
      1520,
      1700,
      1890,
      2050,
      2230,
      2410,
      2600,
      3012,
      2780
    ];


    drawBars(
      'barColetaMes',
      monthsData,
      7
    );


    drawBars(
      'barColetaAno',
      yearsData,
      10
    );


    drawBars(
      'barDoadorasMes',
      monthsData,
      7
    );


    drawBars(
      'barDoadorasAno',
      yearsData,
      10
    );


    drawBars(
      'barFamiliasMes',
      monthsData,
      7
    );


    drawBars(
      'barFamiliasAno',
      yearsData,
      10
    );


    drawBars(
      'barImpactoMes',
      monthsData,
      7
    );


    drawBars(
      'barImpactoAno',
      yearsData,
      10
    );

  }
);


var nutrizGreetings = {

  jornada: [
    "Olá!",
    "Seja bem-vinda à família Lactare."
  ],

  historico: [
    "Histórico de doações",
    "Cada doação sua protege uma vida. Veja seu histórico completo aqui."
  ],

  registro: [
    "Registro de coleta",
    "Quando tiver realizado uma coleta, nos avise. Buscamos no seu endereço com todo o cuidado."
  ],

  agendamento: [
    "Agendamento",
    "Agende uma consulta sempre que precisar, nossa equipe faz a triagem e garante o melhor atendimento."
  ],

  notificacoes: [
    "Notificações",
    "Acompanhe tudo que acontece por aqui."
  ],

  dados: [
    "Meus dados",
    "Suas informações cadastradas conosco."
  ],

  feedback: [
    "Feedback",
    "Conta pra gente como foi sua experiência. Seu feedback nos ajuda a melhorar a cada dia."
  ],

  pontos: [
    "Pontos de doação",
    "Encontre bancos de leite, pontos de apoio e locais parceiros próximos de você."
  ]

};


function showNutrizTab(
  tab,
  linkEl
) {

  document
    .querySelectorAll(
      '#nutrizMenu a'
    )
    .forEach(function (a) {

      a.classList.remove(
        'active'
      );

    });


  linkEl.classList.add(
    'active'
  );


  var scope =
    linkEl.closest(
      '.app-shell'
    );


  scope
    .querySelectorAll(
      '.panel-tab'
    )
    .forEach(function (p) {

      p.classList.remove(
        'active'
      );

    });


  scope
    .querySelector(
      '.panel-tab[data-panel-tab="' +
      tab +
      '"]'
    )
    .classList.add(
      'active'
    );

  if (tab === 'pontos' && typeof initPontosDoacao === 'function') {
    initPontosDoacao();
  }


  var g =
    nutrizGreetings[tab];

  if (tab === 'jornada') {
    var sessaoDoadora = LactareAPI.session();
    var nomeDoadora = sessaoDoadora && sessaoDoadora.nome;

    if (nomeDoadora) {
      g = [
        'Olá, ' + nomeDoadora + '!',
        g[1]
      ];
    }
  }


  /* O Registro de coleta já possui seu próprio cabeçalho dentro do painel.
     Esconde apenas a saudação global nessa aba para não repetir o título. */
  var nutrizGreetingBar = document.querySelector(
    '#screen-perfil-nutriz .greeting-bar'
  );
  if (nutrizGreetingBar) {
    nutrizGreetingBar.style.display = (tab === 'registro' || tab === 'notificacoes') ? 'none' : '';
  }


  document.getElementById(
    'nutrizGreetingTitle'
  ).textContent =
    g[0];


  document.getElementById(
    'nutrizGreetingSub'
  ).textContent =
    g[1];

}


var apoioGreetings = {

  inicio: [
    'Bem-vinda à Rede de Apoio Lactare.',
    'Aqui você e sua família encontram cuidado, orientação e atendimento gratuito.'
  ],

  suporte: [
    "Essa jornada tem seus desafios, e você não precisa enfrentá-los sozinha.",
    "A Lactare oferece suporte técnico e emocional gratuito durante e depois da amamentação."
  ],

  agendamento: [
    "Agendamento",
    "Agende uma consulta sempre que precisar, nossa equipe fará o possível para te ajudar."
  ],

  historico: [
    "Histórico de consultas",
    "Cada consulta é registrada para você acompanhar seu atendimento."
  ],

  feedback: [
    "Feedback",
    "Conta pra gente como foi sua experiência. Seu feedback nos ajuda a melhorar a cada dia."
  ],


  notificacoes: [
    "Notificações",
    "Acompanhe tudo que acontece por aqui."
  ],

  dados: [
    "Meus dados",
    "Suas informações cadastradas conosco."
  ],

  comunidade: [
    "Comunidade Lactare",
    "Informação, troca de experiências e avisos importantes para você e sua família."
  ]

};
  function showApoioTab(tab, linkEl) {
  var scope = document.querySelector('#screen-perfil-apoio .app-shell');
  if (!scope) return;

  // Oculta somente a barra de rolagem da página nos três menus solicitados:
  // Início, Agendamento e Meus dados. A rolagem continua funcionando.
  var hidePageScrollbar = ['inicio', 'agendamento', 'dados'].indexOf(tab) !== -1;
  document.documentElement.classList.toggle('lactare-hide-page-scrollbar', hidePageScrollbar);

  scope.querySelectorAll('#apoioMenu a').forEach(function (a) {
    a.classList.remove('active');
  });

  if (linkEl) linkEl.classList.add('active');

  scope.querySelectorAll('.panel-tab').forEach(function (p) {
    p.classList.remove('active');
  });

  var panel = scope.querySelector('.panel-tab[data-panel-tab="' + tab + '"]');
  if (panel) panel.classList.add('active');

  var g = apoioGreetings[tab];
  var greeting = document.getElementById('apoioGreetingTitle');
  var sub = document.getElementById('apoioGreetingSub');
  var greetingBar = document.querySelector('#screen-perfil-apoio .greeting-bar');

  if (tab === 'inicio') {
    if (greetingBar) greetingBar.style.display = 'none';
  } else {
    if (greetingBar) greetingBar.style.display = 'block';
    if (g && greeting) greeting.textContent = g[0];
    if (g && sub) sub.textContent = g[1];
  }

  if (tab !== 'inicio' && !scope.classList.contains('menu-open')) {
    // Mantém o menu recolhido como padrão, igual ao perfil da Doadora.
  }
}


async function getLactareTriagens() { return await LactareAPI.triagens(); }

async function abrirTriagemLactare(id) {
  var detail=document.getElementById('triagemDetail'); if(!detail)return;
  try {
    var t=await LactareAPI.request('/triagens/'+id); var labels={amamentando:'Está amamentando',idadeBebe:'Idade do bebê',medicamento:'Uso de medicamento',fuma:'Fuma',examesRecentes:'Exames recentes',jaDoou:'Já doou leite'};
    var html=Object.keys(labels).map(function(k){return '<div class="triagem-answer"><strong>'+labels[k]+'</strong><br>'+((t[k]||'Não informado'))+'</div>';}).join('');
    detail.innerHTML='<h4>'+t.doadoraNome+'</h4><div class="triagem-answers">'+html+'</div><div><button class="triagem-action" onclick="alterarStatusTriagemLactare('+t.id+',\'APROVADA\')">✓ Aprovar</button><button class="triagem-action danger" onclick="alterarStatusTriagemLactare('+t.id+',\'NAO_APROVADA\')">Não aprovar</button></div>';
    detail.classList.add('open');
  } catch(e){detail.innerHTML='<p class="triagem-empty">'+e.message+'</p>';detail.classList.add('open');}
}

async function alterarStatusTriagemLactare(id,status) {
  try { await LactareAPI.statusTriagem(id,status); await renderTriagensLactare(); }
  catch(e){alert(e.message);}
}

async function renderTriagensLactare() {
  var body=document.getElementById('triagensTableBody'); if(!body)return;
  try {
    var lista=await getLactareTriagens(); var counts={PENDENTE:0,EM_ANALISE:0,APROVADA:0,NAO_APROVADA:0};
    lista.forEach(function(t){counts[t.status]=(counts[t.status]||0)+1;});
    ['PENDENTE','EM_ANALISE','APROVADA','NAO_APROVADA'].forEach(function(st,i){var ids=['metricTriagemPendente','metricTriagemAnalise','metricTriagemAprovada','metricTriagemRecusada'];var el=document.getElementById(ids[i]);if(el)el.textContent=counts[st]||0;});
    if(!lista.length){body.innerHTML='<tr><td colspan="4" class="triagem-empty">Nenhuma triagem encontrada.</td></tr>';return;}
    body.innerHTML=lista.map(function(t){var st=t.status||'PENDENTE',cls=st==='APROVADA'?'aprovada':st==='NAO_APROVADA'?'recusada':st==='EM_ANALISE'?'analise':'pendente',label=st==='APROVADA'?'Aprovada':st==='NAO_APROVADA'?'Não aprovada':st==='EM_ANALISE'?'Em análise':'Pendente',date=t.dataEnvio?new Date(t.dataEnvio).toLocaleDateString('pt-BR'):'—';return '<tr><td><strong>'+t.doadoraNome+'</strong><br><small>'+((t.doadoraEmail)||'')+'</small></td><td>'+date+'</td><td><span class="triagem-status '+cls+'">'+label+'</span></td><td><button class="triagem-action secondary" onclick="abrirTriagemLactare('+t.id+')">Visualizar</button></td></tr>';}).join('');
  } catch(e){body.innerHTML='<tr><td colspan="4" class="triagem-empty">'+e.message+'</td></tr>';}
}

function showDashTab(
  tab,
  linkEl
) {

  document
    .querySelectorAll(
      '#dashMenu a'
    )
    .forEach(function (a) {

      a.classList.remove(
        'active'
      );

    });


  linkEl.classList.add(
    'active'
  );


  document
    .querySelectorAll(
      '.dash-tab'
    )
    .forEach(function (p) {

      p.classList.remove(
        'active'
      );

    });


  var panel =
    document.querySelector(
      '.dash-tab[data-dashpanel="' +
      tab +
      '"]'
    );


  if (panel) {
    panel.classList.add(
      'active'
    );
  }

}


function drawBars(
  elId,
  values,
  highlightIndex
) {

  var el =
    document.getElementById(
      elId
    );


  if (!el) {
    return;
  }


  var max =
    Math.max.apply(
      null,
      values
    );


  el.innerHTML =
    values
      .map(function (v, i) {

        var h =
          Math.max(
            6,
            Math.round(
              (v / max) * 100
            )
          );


        var bg =
          i === highlightIndex
            ? 'background:#3aa87f;'
            : '';


        return (
          '<div class="bar" style="height:' +
          h +
          '%;' +
          bg +
          '"></div>'
        );

      })
      .join('');

}


function buildCalendar(
  elId,
  selectedDay,
  availableDays
) {

  var el =
    document.getElementById(
      elId
    );


  if (!el) {
    return;
  }


  var days = [
    "D",
    "S",
    "T",
    "Q",
    "Q",
    "S",
    "S"
  ];


  var html =
    "<table><thead><tr>" +
    days
      .map(function (d) {
        return "<th>" +
          d +
          "</th>";
      })
      .join("") +
    "</tr></thead><tbody>";


  var firstDayOffset = new Date(2026, 8, 1).getDay();
  var totalDays = 31;
  var day = 1;


  for (
    var row = 0;
    row < 6;
    row++
  ) {

    html += "<tr>";


    for (
      var col = 0;
      col < 7;
      col++
    ) {

      if (
        (
          row === 0 &&
          col < firstDayOffset
        ) ||
        day > totalDays
      ) {

        html +=
          "<td><div class='day empty'></div></td>";

      } else {

        var cls = "day";


        if (
          day === selectedDay
        ) {

          cls +=
            " selected";

        } else if (
          availableDays.indexOf(
            day
          ) !== -1
        ) {

          cls +=
            " available";

        }


        html +=
          "<td><div class='" +
          cls +
          "'>" +
          day +
          "</div></td>";


        day++;

      }

    }


    html += "</tr>";


    if (
      day > totalDays
    ) {
      break;
    }

  }


  html +=
    "</tbody></table>";


  el.innerHTML =
    html;

}

/* ---------- Notificações da doadora (estado lida/não lida na API) ---------- */
var LACTARE_WHATSAPP_URL = 'https://wa.me/5511966290681';

// Botões "Fale com nossa equipe": abre a conversa direto no WhatsApp/WhatsApp Web.
function abrirWhatsappEquipeLactare() {
  window.open(LACTARE_WHATSAPP_URL, '_blank', 'noopener,noreferrer');
}

// Sino do topo: abre o painel de notificações já existente e atualiza os dados na hora.
function abrirNotificacoesNutriz() {
  var link = document.querySelector('#nutrizMenu a[data-tab="notificacoes"]');
  if (link) showNutrizTab('notificacoes', link);
  if (typeof renderDoadoraTriagemStatus === 'function') renderDoadoraTriagemStatus();
}

function nutrizAtualizarSino() {
  var naoLidas = document.querySelectorAll('#screen-perfil-nutriz .notification-card.unread').length;
  var dot = document.querySelector('#screen-perfil-nutriz .bell-dot');
  if (dot) dot.style.display = naoLidas > 0 ? '' : 'none';
}

// Registra na API (banco) que as notificações foram lidas. A interface é atualizada
// de imediato; depois o re-render volta ao estado real confirmado pelo banco.
function persistirNotificacoesLidas(keys) {
  var sd = window.LactareAPI && LactareAPI.session();
  if (!sd || sd.perfil !== 'DOADORA' || !sd.usuarioId || !keys.length) return Promise.resolve();
  return LactareAPI.marcarNotificacoesLidas(sd.usuarioId, keys).catch(function () {}).then(function () {
    if (typeof renderDoadoraTriagemStatus === 'function') return renderDoadoraTriagemStatus();
  });
}

function marcarCartaoNotificacaoLido(card) {
  card.classList.add('is-read');
  card.classList.remove('unread');
  var d = card.querySelector('.notification-status-dot');
  if (d) d.classList.add('muted');
}

function markNutrizNotificationsRead() {
  var keys = [];
  document.querySelectorAll('#screen-perfil-nutriz .notification-card.unread[data-key]').forEach(function (card) {
    keys.push(card.getAttribute('data-key'));
    marcarCartaoNotificacaoLido(card);
  });
  nutrizAtualizarSino();
  persistirNotificacoesLidas(keys);
}

// Visualizar (clicar/abrir) uma notificação a marca como lida.
function nutrizAbrirNotificacao(e) {
  if (e.type === 'keydown' && e.key !== 'Enter' && e.key !== ' ') return;
  var card = e.target.closest && e.target.closest('#screen-perfil-nutriz .notification-card[data-key]');
  if (!card) return;
  if (e.type === 'keydown') e.preventDefault();
  if (!card.classList.contains('unread')) return;
  marcarCartaoNotificacaoLido(card);
  nutrizAtualizarSino();
  persistirNotificacoesLidas([card.getAttribute('data-key')]);
}
document.addEventListener('click', nutrizAbrirNotificacao);
document.addEventListener('keydown', nutrizAbrirNotificacao);

document.addEventListener('click', function(e){
  var filter = e.target.closest('#screen-perfil-nutriz .notification-filter');
  if (!filter) return;
  var page = filter.closest('.notifications-page');
  if (!page) return;
  page.querySelectorAll('.notification-filter').forEach(function(btn){ btn.classList.remove('active'); });
  filter.classList.add('active');
  var selected = filter.getAttribute('data-filter');
  page.querySelectorAll('.notification-card').forEach(function(card){
    card.style.display = (selected === 'todas' || card.getAttribute('data-category') === selected) ? '' : 'none';
  });
});

/* ==========================================================
   REDE DE APOIO — interações das telas
   ========================================================== */
(function(){
  function initApoioExtras(){
    var shell=document.querySelector('#screen-perfil-apoio .app-shell');
    var sidebar=document.querySelector('#screen-perfil-apoio .apoio-sidebar');

    var cal=document.getElementById('calApoio');
    if(cal && !cal.dataset.ready){
      cal.dataset.ready='1';
      var days=['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];
      var available=[6,13,20,28], selected=25;
      var first=new Date(2026,8,1).getDay(), total=30, cells='';
      for(var i=0;i<first;i++) cells+='<td></td>';
      for(var d=1;d<=total;d++){
        if((first+d-1)%7===0 && d!==1) cells+='</tr><tr>';
        var cls='ra-cal-day'+(available.indexOf(d)>-1?' available':'')+(d===selected?' selected':'');
        cells+='<td><span class="'+cls+'" data-day="'+d+'">'+d+'</span></td>';
      }
      while((first+total)%7!==0){cells+='<td></td>'; total++;}
      cal.innerHTML='<table><thead><tr>'+days.map(function(x){return '<th>'+x+'</th>';}).join('')+'</tr></thead><tbody><tr>'+cells+'</tr></tbody></table>';
      cal.querySelectorAll('.ra-cal-day').forEach(function(el){
        el.addEventListener('click',function(){
          cal.querySelectorAll('.ra-cal-day').forEach(function(x){x.classList.remove('selected')});
          el.classList.add('selected');
          var inp=document.getElementById('apoio-data-atendimento');
          if(inp){var n=el.dataset.day;inp.value='2026-09-'+String(n).padStart(2,'0');}
        });
      });
    }

    var text=document.getElementById('apoio-feedback-text'), count=document.getElementById('apoio-feedback-count');
    function updateCount(){if(text&&count) count.textContent=text.value.length;}
    if(text){text.addEventListener('input',updateCount);updateCount();}

    var stars=document.querySelectorAll('#apoioStars button');
    stars.forEach(function(btn){
      btn.addEventListener('click',function(){
        var n=parseInt(btn.dataset.star,10);
        stars.forEach(function(s){s.style.color=parseInt(s.dataset.star,10)<=n?'#f5b238':'#d5e0e7';});
        var strong=document.querySelector('#apoioStars strong');
        if(strong) strong.textContent=n+',0 — '+(n===5?'Excelente':n===4?'Muito bom':n===3?'Bom':n===2?'Regular':'Precisamos melhorar');
      });
    });

    document.querySelectorAll('.ra-notif-filters button').forEach(function(btn){
      btn.addEventListener('click',function(){
        document.querySelectorAll('.ra-notif-filters button').forEach(function(b){b.classList.remove('active')});
        btn.classList.add('active');
        var filter=btn.dataset.filter;
        document.querySelectorAll('.ra-notif-card').forEach(function(card){
          card.style.display=(filter==='todas'||card.dataset.type===filter)?'grid':'none';
        });
      });
    });
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',initApoioExtras); else initApoioExtras();
})();

function confirmarAgendamentoApoio(){
  var tipo=document.getElementById('apoio-tipo-atendimento');
  var hora=document.getElementById('apoio-horario-atendimento');
  var msg=document.getElementById('apoio-book-message');
  if(!tipo || !hora || !msg) return;
  if(!tipo.value || !hora.value){msg.style.color='#c94b4b';msg.textContent='Selecione o tipo de atendimento e o horário.';return;}
  msg.style.color='#168b54';
  msg.textContent='Solicitação de agendamento registrada. A equipe entrará em contato para confirmação.';
}
function confirmarAgendamentoColeta(){
  var data=document.getElementById('coleta-data');
  var turno=document.getElementById('coleta-turno');
  var msg=document.getElementById('coleta-book-message');
  if(!data || !turno || !msg) return;
  if(!data.value.trim() || !turno.value){
    msg.className='nutriz-book-message error';
    msg.textContent='Informe a data e o turno para agendar a coleta.';
    return;
  }
  msg.className='nutriz-book-message success';
  msg.textContent='Solicitação de coleta registrada. A equipe entrará em contato para confirmação.';
}
function confirmarAgendamentoConsulta(){
  var data=document.getElementById('consulta-data');
  var hora=document.getElementById('consulta-hora');
  var msg=document.getElementById('consulta-book-message');
  if(!data || !hora || !msg) return;
  if(!data.value.trim() || !hora.value.trim()){
    msg.className='nutriz-book-message error';
    msg.textContent='Informe a data e o horário para agendar a consulta.';
    return;
  }
  msg.className='nutriz-book-message success';
  msg.textContent='Solicitação de atendimento registrada. A equipe entrará em contato para confirmação.';
}
function marcarTodasApoioLidas(){
  document.querySelectorAll('.ra-notif-card').forEach(function(card){card.classList.remove('unread')});
  var dot=document.querySelector('#screen-perfil-apoio .menu-notification-dot');
  if(dot) dot.style.display='none';
}
function enviarFeedbackApoio(){
  var msg=document.querySelector('.ra-feedback-form .ra-thanks');
  if(msg){msg.style.display='flex';}
}


// Logout da Rede de Apoio / perfis
async function logout() { try { await LactareAPI.logout(); } catch(e) {} localStorage.removeItem('lactare_token'); localStorage.removeItem('lactare_session'); sessionStorage.clear(); window.location.href='../../index.html'; }


/* ==========================================================
   PONTOS DE DOAÇÃO — MAPA DA DOADORA
   Os pontos só devem ser exibidos quando existirem dados reais cadastrados.
   ========================================================== */
var pontosDoacaoData = [];

var pontosMap = null;
var pontosMarkersLayer = null;
var pontosMapReady = false;
var pontosFiltroAtual = 'todos';
var pontosUsuarioLatLng = null;

function _initPontosDoacao() {
  if (typeof L === 'undefined') return;
  var mapEl = document.getElementById('pontosMap');
  if (!mapEl) return;

  if (!pontosMapReady) {
    pontosMap = L.map(mapEl, { zoomControl: true, scrollWheelZoom: true }).setView([-23.55052, -46.63331], 12);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(pontosMap);
    pontosMarkersLayer = L.layerGroup().addTo(pontosMap);
    pontosMapReady = true;
    renderPontosDoacao();
  }

  setTimeout(function(){ pontosMap.invalidateSize(); }, 80);
}

function pontoCor(tipo) {
  return { lactare:'#8b45e8', parceiro:'#ed3f86', banco:'#168ee5', apoio:'#24ad74' }[tipo] || '#168ee5';
}

function pontoTipoLabel(tipo) {
  return { lactare:'Lactare', parceiro:'Parceiro Lactare', banco:'Banco de Leite', apoio:'Posto de Coleta' }[tipo] || 'Ponto de apoio';
}

function pontoIcon(tipo) {
  var cor = pontoCor(tipo);
  return L.divIcon({
    className:'ponto-map-marker-wrap',
    html:'<span class="ponto-map-marker" style="background:'+cor+'"><span>●</span></span>',
    iconSize:[34,42], iconAnchor:[17,42], popupAnchor:[0,-38]
  });
}

function distanciaKm(lat1, lon1, lat2, lon2) {
  var R=6371, dLat=(lat2-lat1)*Math.PI/180, dLon=(lon2-lon1)*Math.PI/180;
  var a=Math.sin(dLat/2)*Math.sin(dLat/2)+Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)*Math.sin(dLon/2);
  return R*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a));
}

function pontosFiltrados() {
  var arr=pontosDoacaoData.filter(function(p){ return pontosFiltroAtual==='todos' || p.tipo===pontosFiltroAtual; });
  if (pontosUsuarioLatLng) {
    arr.forEach(function(p){ p.distancia=distanciaKm(pontosUsuarioLatLng.lat,pontosUsuarioLatLng.lng,p.lat,p.lng); });
    arr.sort(function(a,b){ return a.distancia-b.distancia; });
  }
  return arr;
}

function renderPontosDoacao() {
  if (!pontosMapReady) return;
  var list=document.getElementById('pontosList');
  var count=document.getElementById('pontosCount');
  if (!list) return;
  list.innerHTML='';
  pontosMarkersLayer.clearLayers();
  var arr=pontosFiltrados();

  arr.forEach(function(p){
    var marker=L.marker([p.lat,p.lng],{icon:pontoIcon(p.tipo)}).addTo(pontosMarkersLayer);
    marker.bindPopup('<strong>'+p.nome+'</strong><br>'+p.endereco+'<br><small>'+pontoTipoLabel(p.tipo)+' · '+p.horario+'</small>');
    marker.on('click',function(){ highlightPontoCard(p.id); });

    var card=document.createElement('article');
    card.className='ponto-card';
    card.dataset.pontoId=p.id;
    card.innerHTML='<div class="ponto-card-icon" style="--ponto-cor:'+pontoCor(p.tipo)+'"><svg><use href="#icon-map-pin"></use></svg></div>'+
      '<div class="ponto-card-main"><div class="ponto-card-title-row"><h4>'+p.nome+'</h4><span>'+pontoTipoLabel(p.tipo)+'</span></div>'+
      '<p><svg><use href="#icon-map-pin"></use></svg>'+p.endereco+'</p><p><svg><use href="#icon-calendar"></use></svg>'+p.horario+'</p></div>'+
      '<div class="ponto-card-side">'+(p.distancia!==null?'<strong>'+p.distancia.toFixed(1).replace('.',',')+' km</strong>':'')+'<button type="button" data-open-ponto="'+p.id+'">Ver no mapa</button></div>';
    list.appendChild(card);
    card.addEventListener('click',function(e){ if(e.target.closest('button')) e.stopPropagation(); focusPonto(p); });
    var btn=card.querySelector('[data-open-ponto]');
    btn.addEventListener('click',function(e){ e.stopPropagation(); focusPonto(p); });
  });

  if (count) count.textContent=arr.length+' '+(arr.length===1?'ponto disponível':'pontos disponíveis')+(pontosUsuarioLatLng?' ordenados pela proximidade':'');
}

function highlightPontoCard(id) {
  document.querySelectorAll('.ponto-card').forEach(function(c){ c.classList.toggle('selected',c.dataset.pontoId===id); });
}

function focusPonto(p) {
  if (!pontosMapReady) return;
  pontosMap.setView([p.lat,p.lng],15,{animate:true});
  highlightPontoCard(p.id);
  pontosMarkersLayer.eachLayer(function(layer){
    var ll=layer.getLatLng();
    if (Math.abs(ll.lat-p.lat)<0.00001 && Math.abs(ll.lng-p.lng)<0.00001) layer.openPopup();
  });
}

function setPontosStatus(text, kind) {
  var el=document.getElementById('pontosStatus');
  if (!el) return;
  el.textContent=text;
  el.className='pontos-status '+(kind||'');
}

function ordenarPorLocalizacao(lat,lng,descricao) {
  pontosUsuarioLatLng={lat:lat,lng:lng};
  if (pontosMapReady) {
    pontosMap.setView([lat,lng],13,{animate:true});
    if (window._pontosUserMarker) window._pontosUserMarker.remove();
    window._pontosUserMarker=L.marker([lat,lng],{title:'Sua localização'}).addTo(pontosMap).bindPopup('<strong>Você está aqui</strong>');
    renderPontosDoacao();
  }
  setPontosStatus(descricao || 'Localização encontrada. Os pontos foram ordenados pela proximidade.','success');
}

function buscarPontosPorCep() {
  var input=document.getElementById('pontosCep');
  if (!input) return;
  var cep=input.value.replace(/\D/g,'');
  if (cep.length!==8) { setPontosStatus('Digite um CEP válido com 8 números.','error'); input.focus(); return; }
  setPontosStatus('Consultando o CEP e localizando a região...','loading');
  fetch('https://viacep.com.br/ws/'+cep+'/json/')
    .then(function(r){ return r.json(); })
    .then(function(data){
      if (data.erro) throw new Error('CEP não encontrado');
      var query=[data.logradouro,data.bairro,data.localidade,data.uf,'Brasil'].filter(Boolean).join(', ');
      return fetch('https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=br&q='+encodeURIComponent(query)).then(function(r){return r.json();}).then(function(geo){return {data:data,geo:geo};});
    })
    .then(function(result){
      if (!result.geo || !result.geo.length) throw new Error('Não foi possível localizar este CEP no mapa.');
      var lat=parseFloat(result.geo[0].lat), lon=parseFloat(result.geo[0].lon);
      ordenarPorLocalizacao(lat,lon,'CEP '+cep.slice(0,5)+'-'+cep.slice(5)+' localizado. Os pontos foram ordenados pela proximidade.');
    })
    .catch(function(err){ setPontosStatus(err.message || 'Não foi possível localizar o CEP. Tente usar sua localização.','error'); });
}

function iniciarLocalizacaoDoadora() {
  if (!navigator.geolocation) { setPontosStatus('Seu navegador não oferece acesso à localização. Use o CEP para buscar os pontos.','error'); return; }
  setPontosStatus('Solicitando sua localização...','loading');
  navigator.geolocation.getCurrentPosition(function(pos){
    ordenarPorLocalizacao(pos.coords.latitude,pos.coords.longitude,'Localização autorizada. Os pontos foram ordenados pela proximidade.');
  },function(err){
    var msg=err.code===1?'A localização foi bloqueada. Você pode permitir o acesso no navegador ou usar seu CEP.':'Não foi possível obter sua localização. Use o CEP para buscar os pontos.';
    setPontosStatus(msg,'error');
  },{enableHighAccuracy:true,timeout:10000,maximumAge:300000});
}

function formatarCepPontos(value) {
  var digits=value.replace(/\D/g,'').slice(0,8);
  return digits.length>5?digits.slice(0,5)+'-'+digits.slice(5):digits;
}

function configurarPontosDoacao() {
  var btnLoc=document.getElementById('btnUsarLocalizacao');
  var btnCep=document.getElementById('btnBuscarCep');
  var cep=document.getElementById('pontosCep');
  if(btnLoc && !btnLoc.dataset.ready){ btnLoc.dataset.ready='1'; btnLoc.addEventListener('click',iniciarLocalizacaoDoadora); }
  if(btnCep && !btnCep.dataset.ready){ btnCep.dataset.ready='1'; btnCep.addEventListener('click',buscarPontosPorCep); }
  if(cep && !cep.dataset.ready){
    cep.dataset.ready='1';
    cep.addEventListener('input',function(){ cep.value=formatarCepPontos(cep.value); });
    cep.addEventListener('keydown',function(e){ if(e.key==='Enter') buscarPontosPorCep(); });
  }
  document.querySelectorAll('.ponto-filter').forEach(function(btn){
    if(btn.dataset.ready) return;
    btn.dataset.ready='1';
    btn.addEventListener('click',function(){
      pontosFiltroAtual=btn.dataset.filter;
      document.querySelectorAll('.ponto-filter').forEach(function(b){b.classList.remove('active');});
      btn.classList.add('active');
      renderPontosDoacao();
    });
  });
}

function initPontosDoacao() {
  configurarPontosDoacao();
  _initPontosDoacao();
}

/* ==========================================================
   CHATBOT LACTARE — ASSISTENTE DA TELA DE LOGIN
   Chatbot local com perguntas frequentes.
   ========================================================== */
function goToRecuperarSenha() {
  window.location.href = 'recuperar-senha.html';
}

function toggleLactareChat() {
  var win = document.getElementById('lactare-chat-window');
  var input = document.getElementById('lactare-chat-text');
  var messages = document.getElementById('lactare-chat-messages');
  if (!win) return;

  var willOpen = win.hidden;
  win.hidden = !willOpen;

  if (willOpen) {
    // Sempre que abrir novamente, volta ao estado inicial com as
    // mensagens prontas e as perguntas frequentes da referência.
    if (messages) {
      messages.innerHTML = `
        <div class="chat-message bot greeting-message">
          <div class="bot-avatar">
            <img src="../../assets/images/lactare-logo.png" alt="Lactare">
          </div>
          <div class="bot-greeting-content">
            <strong>Olá! 👋</strong>
            <p>Eu sou a Assistente Lactare e estou aqui para ajudar.</p>
            <p>Como posso ajudar você hoje?</p>
          </div>
        </div>`;
    }
    if (input) {
      setTimeout(function () { input.focus(); }, 80);
    }
  }
}

function closeLactareChat() {
  var win = document.getElementById('lactare-chat-window');
  if (win) win.hidden = true;
}

function addLactareChatMessage(text, type) {
  var messages = document.getElementById('lactare-chat-messages');
  if (!messages) return;
  var item = document.createElement('div');
  item.className = 'chat-message ' + type;
  item.textContent = text;
  messages.appendChild(item);
  messages.scrollTop = messages.scrollHeight;
}

function getLactareBotResponse(message) {
  var text = (message || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  if (text.indexOf('senha') >= 0 || text.indexOf('esqueci') >= 0)
    return 'Se você esqueceu sua senha, use o link “Esqueci minha senha” na tela de login. Se precisar, posso orientar você.';
  if (text.indexOf('cadastro') >= 0 || text.indexOf('cadastrar') >= 0 || text.indexOf('conta') >= 0)
    return 'Para criar uma conta, clique em “Cadastre-se” abaixo do botão ENTRAR e preencha seus dados.';
  if (text.indexOf('doacao') >= 0 || text.indexOf('doar') >= 0 || text.indexOf('leite') >= 0)
    return 'A doação de leite materno ajuda a fornecer leite humano para bebês que precisam. No Lactare, você encontra orientações e acessos relacionados à doação.';
  if (text.indexOf('rede de apoio') >= 0 || text.indexOf('apoio') >= 0)
    return 'A Rede de Apoio é o espaço do Lactare voltado ao acompanhamento e suporte das famílias. Você pode consultar atendimentos, informações do seu perfil e canais de contato disponíveis na plataforma.';
  if (text.indexOf('agendar') >= 0 || text.indexOf('atendimento') >= 0 || text.indexOf('consulta') >= 0)
    return 'Para informações sobre atendimentos, consulte a área de atendimentos da Rede de Apoio. Se precisar de orientação, você também pode entrar em contato com a equipe pelos canais disponíveis no Lactare.';
  if (text.indexOf('atualizar') >= 0 || text.indexOf('dados') >= 0 || text.indexOf('perfil') >= 0)
    return 'Você pode consultar e atualizar seus dados na área de perfil da Rede de Apoio. Caso tenha dificuldade, posso orientar você sobre as opções disponíveis na plataforma.';
  if (text.indexOf('equipe') >= 0)
    return 'Para falar com a Equipe Lactare, utilize o acesso “Acesso da Equipe Lactare” disponível na tela de login.';
  if (text.indexOf('login') >= 0 || text.indexOf('entrar') >= 0 || text.indexOf('usuario') >= 0)
    return 'Para entrar, informe seu usuário e senha e clique em ENTRAR. Se não lembrar a senha, use “Esqueci minha senha”.';
  if (text.indexOf('ola') >= 0 || text.indexOf('oi') >= 0 || text.indexOf('ajuda') >= 0)
    return 'Olá! 😊 Sou a Assistente Lactare. Posso ajudar com cadastro, senha, login, doação de leite, Rede de Apoio e Equipe Lactare.';

  // O Assistente Lactare responde somente assuntos relacionados à plataforma.
  // Quando a mensagem estiver fora desse contexto, orienta o usuário sem tentar
  // responder ao assunto externo.
  return 'Olá! 😊 Sou a Assistente Lactare e posso ajudar somente com assuntos relacionados ao Lactare, como cadastro, login, senha, doação de leite materno, Rede de Apoio e Equipe Lactare. Não consigo ajudar com esse assunto, mas posso orientar você sobre a plataforma.';
}

function sendLactareMessage(event) {
  if (event) event.preventDefault();
  var input = document.getElementById('lactare-chat-text');
  if (!input) return;
  var message = input.value.trim();
  if (!message) return;
  addLactareChatMessage(message, 'user');
  input.value = '';
  setTimeout(function () {
    addLactareChatMessage(getLactareBotResponse(message), 'bot');
  }, 300);
}

function sendLactareQuick(message) {
  addLactareChatMessage(message, 'user');
  setTimeout(function () {
    addLactareChatMessage(getLactareBotResponse(message), 'bot');
  }, 300);
}


document.addEventListener('DOMContentLoaded', function () {
  if (document.getElementById('triagensTableBody') && typeof renderTriagensLactare === 'function') renderTriagensLactare();

  // Atualização automática dos perfis que dependem do estado da API.
  // A sincronização por evento atualiza quase imediatamente quando outra aba
  // altera a triagem/exame/coleta; o intervalo de 5s é o fallback para
  // alterações feitas fora deste navegador. A Rede de Apoio não entra aqui.
  if (!window.LactareAPI) return;
  var sessao = LactareAPI.session && LactareAPI.session();
  if (!sessao) return;
  var perfil = String(sessao.perfil || '').toUpperCase();

  async function atualizarAgora() {
    if (document.hidden) return;
    try {
      if (perfil === 'EQUIPE') {
        if (typeof renderTriagensLactare === 'function' && document.getElementById('triagensTableBody')) await renderTriagensLactare();
        if (window.LactareCharts && typeof LactareCharts.atualizar === 'function') await LactareCharts.atualizar();
      } else if (perfil === 'DOADORA') {
        if (typeof renderDoadoraTriagemStatus === 'function') await renderDoadoraTriagemStatus();
        if (typeof carregarPerfilDoadora === 'function') await carregarPerfilDoadora();
      } else if (perfil === 'MEDICO') {
        if (typeof carregarDadosMedico === 'function') await carregarDadosMedico();
      }
    } catch (_) {}
  }

  // Recarrega imediatamente ao voltar para a aba.
  document.addEventListener('visibilitychange', function () { if (!document.hidden) atualizarAgora(); });
  // Recarrega quando outra tela/aba do Lactare concluir uma alteração pela API.
  if (typeof LactareAPI.onDataChanged === 'function') LactareAPI.onDataChanged(atualizarAgora);
  // Fallback para alterações feitas por outro dispositivo, navegador ou sessão.
  setInterval(atualizarAgora, 5000);
});
