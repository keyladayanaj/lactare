// Cliente da API de Pontos de Doação da Lactare.
// O backend deve estar rodando em http://localhost:8080.
(function () {
  'use strict';

  function request(path, options) {
    if (!window.LactareAPI) return Promise.reject(new Error('Cliente da API Lactare não carregado.'));
    return window.LactareAPI.request(path, options || {});
  }

  function listarPontos(tipo) {
    var path = '/pontos-doacao';
    if (tipo) path += '?tipo=' + encodeURIComponent(tipo);
    return request(path);
  }

  function buscarPorId(id) {
    return request('/pontos-doacao/' + encodeURIComponent(id));
  }

  function buscarPorCep(cep) {
    var somenteNumeros = String(cep || '').replace(/\D/g, '');
    return request('/pontos-doacao/cep/' + somenteNumeros);
  }

  function buscarProximos(latitude, longitude, raioKm) {
    var raio = raioKm || 50;
    var query =
      '?latitude=' + encodeURIComponent(latitude) +
      '&longitude=' + encodeURIComponent(longitude) +
      '&raioKm=' + encodeURIComponent(raio);

    return request('/pontos-doacao/proximos' + query);
  }

  function usarLocalizacao(raioKm) {
    if (!navigator.geolocation) {
      return Promise.reject(
        new Error('Seu navegador não oferece suporte à localização.')
      );
    }

    return new Promise(function (resolve, reject) {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000
      });
    }).then(function (position) {
      return buscarProximos(
        position.coords.latitude,
        position.coords.longitude,
        raioKm || 50
      );
    });
  }

  window.LactarePontosApi = {
    listarPontos: listarPontos,
    buscarPorId: buscarPorId,
    buscarPorCep: buscarPorCep,
    buscarProximos: buscarProximos,
    usarLocalizacao: usarLocalizacao,
    getBaseUrl: function () { return window.LactareAPI ? window.LactareAPI.baseUrl : ''; }
  };
})();
