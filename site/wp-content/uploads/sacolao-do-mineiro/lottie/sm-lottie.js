/*! Sacolão do Mineiro — micro-animações (Lottie). Player: lottie-web 5.13.0 light (MIT), nesta pasta.
 * Passos de "Peça via Delivery" (img[data-sm-lottie]) tocam 1× ao ficarem 50% visíveis, em cascata de 250 ms;
 * depois do passo 3, um balão com a cesta sai de trás do botão do WhatsApp (1× por sessão).
 * - Movimento reduzido ou economia de dados: não baixa nada; o site fica parado, como era.
 * - Nada antes do LCP: player e dados só depois de load + ocioso + 1,2 s, e só quando o alvo chega a 200 px da tela.
 * - O <img> é o mesmo desenho do quadro 0 do Lottie: some só quando o Lottie já desenhou por cima.
 */
(function () {
  'use strict';
  var mq = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)');
  var eco = navigator.connection && navigator.connection.saveData;
  var eu = document.currentScript;
  if (!mq || mq.matches || eco || !eu || !('IntersectionObserver' in window) || !window.Promise) return;
  var BASE = eu.src.replace(/[^/]*$/, '');
  var DADOS = (window.SM_LOTTIE = window.SM_LOTTIE || {});
  var CASCATA = 250;
  var vivas = [];

  function script(url) {
    return new Promise(function (ok, falha) {
      var s = document.createElement('script');
      s.src = url;
      s.async = true;
      s.onload = ok;
      s.onerror = function () { falha(new Error('sem ' + url)); };
      document.head.appendChild(s);
    });
  }
  var trava = new Promise(function (ok) {
    function depois() {
      var ocioso = window.requestIdleCallback || function (f) { return setTimeout(f, 200); };
      ocioso(function () { setTimeout(ok, 1200); }, { timeout: 2500 });
    }
    if (document.readyState === 'complete') depois();
    else window.addEventListener('load', depois);
  });
  var player = null;
  function lottie() {
    return (player = player || trava.then(function () { return script(BASE + 'lottie_light.min.js'); }).then(function () {
      if (!window.lottie) throw new Error('lottie ausente');
      return window.lottie;
    }));
  }
  var cache = {};
  function dados(nome) {
    return (cache[nome] = cache[nome] || trava.then(function () { return script(BASE + nome + '.js'); }).then(function () {
      if (!DADOS[nome]) throw new Error('dados ausentes: ' + nome);
      return DADOS[nome];
    }));
  }
  function criar(caixa, nome) {
    return Promise.all([lottie(), dados(nome)]).then(function (r) {
      if (mq.matches) throw new Error('movimento reduzido');
      var anim = r[0].loadAnimation({
        container: caixa, renderer: 'svg', loop: false, autoplay: false,
        animationData: JSON.parse(JSON.stringify(r[1])),
        rendererSettings: { preserveAspectRatio: 'xMidYMid meet' },
      });
      return new Promise(function (ok) {
        anim.addEventListener('DOMLoaded', function () { ok(anim); });
      });
    });
  }

  // Gatilho "uma vez" que também pega o salto por cima do alvo (âncora do menu): o que já está acima da tela conta.
  function umaVez(el, limiar, entrar, passou) {
    var io = new IntersectionObserver(function (es) {
      var e = es[es.length - 1];
      if (!e.isIntersecting) return;
      io.disconnect();
      if (e.boundingClientRect.bottom < 0) passou();
      else entrar();
    }, { threshold: limiar, rootMargin: '100000px 0px 0px 0px' });
    io.observe(el);
  }
  function perto(el, fn) {
    var io = new IntersectionObserver(function (es) {
      if (!es[es.length - 1].isIntersecting) return;
      io.disconnect();
      fn();
    }, { rootMargin: '200px 0px 200px 0px' });
    io.observe(el);
  }

  // O tema esconde o passo e faz fade de 1,5 s quando ele aparece (a classe chega em duas etapas e, por ~5 ms antes
  // de o fade começar, a opacidade lida já é 1): o gesto só começa com opacidade 1 em duas leituras seguidas e sem
  // animação rodando no contêiner. Se o tema não revelar em 6 s, não toca.
  function aposFade(img) {
    var box = img.closest('.avia_animated_image');
    if (!box) return Promise.resolve();
    var inicio = performance.now();
    var firme = 0;
    return new Promise(function (ok, falha) {
      (function olha() {
        var rodando = box.getAnimations ? box.getAnimations().some(function (a) { return a.playState === 'running'; }) : false;
        firme = parseFloat(getComputedStyle(box).opacity) >= 0.99 && !rodando ? firme + 1 : 0;
        if (firme >= 2) return ok();
        if (performance.now() - inicio > 6000) return falha(new Error('passo invisível'));
        setTimeout(olha, 100);
      })();
    });
  }

  var proximo = 0;
  function naFila(fn) {
    var agora = performance.now();
    var em = Math.max(agora, proximo);
    proximo = em + CASCATA;
    setTimeout(fn, em - agora);
  }

  var aoTerminarPassos = [];
  function passos() {
    var imgs = [].slice.call(document.querySelectorAll('img[data-sm-lottie]'));
    imgs.forEach(function (img, n) {
      var ultimo = n === imgs.length - 1;
      var montado = null;
      function montar() {
        if (montado) return montado;
        var caixa = document.createElement('span');
        caixa.className = 'sm-lottie';
        caixa.setAttribute('aria-hidden', 'true');
        if (getComputedStyle(img.parentNode).position === 'static') img.parentNode.style.position = 'relative';
        img.parentNode.insertBefore(caixa, img.nextSibling);
        montado = criar(caixa, img.getAttribute('data-sm-lottie')).then(function (anim) {
          anim.goToAndStop(0, true);
          img.classList.add('sm-lottie-alvo');
          vivas.push({ anim: anim, caixa: caixa, alvo: img });
          return anim;
        }, function (erro) {
          caixa.remove();
          throw erro;
        });
        return montado;
      }
      perto(img, function () { montar().catch(function () {}); });
      umaVez(img, 0.5, function () {
        Promise.all([montar(), aposFade(img)]).then(function (r) {
          var anim = r[0];
          naFila(function () {
            if (mq.matches) return;
            if (ultimo) anim.addEventListener('complete', function () { aoTerminarPassos.forEach(function (f) { f(); }); });
            anim.goToAndPlay(0, true);
          });
        }).catch(function () {});
      }, function () { /* já estava acima da tela: fica a imagem parada */ });
    });
  }

  // ───── aceno do botão do WhatsApp ─────
  var memoria = {};
  function marcar(k) { memoria[k] = 1; try { sessionStorage.setItem(k, '1'); } catch (e) { /* file:// ou bloqueado */ } }
  function marcado(k) { if (memoria[k]) return true; try { return sessionStorage.getItem(k) === '1'; } catch (e) { return false; } }
  document.addEventListener('click', function (e) {
    var a = e.target && e.target.closest && e.target.closest('a[href*="whatsapp.com"], a[href*="wa.me"], .wa__btn_popup');
    if (a) marcar('sm-wa');
  }, true);

  function cruza(a, b) { return a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom; }
  function aceno() {
    if (marcado('sm-aceno') || marcado('sm-wa') || document.visibilityState !== 'visible' || mq.matches) return;
    var botao = document.querySelector('#wa .wa__btn_popup');
    var icone = botao && botao.querySelector('.wa__btn_popup_icon');
    if (!icone || botao.classList.contains('wa__active')) return;
    var r = icone.getBoundingClientRect();
    if (!r.width) return;
    // caixa do Lottie 112×120; o balão (4..108 × 4..70) fica acima do botão e o rabo desce até a ponta (84, 116),
    // que cai 8 px para dentro do topo do botão, atrás dele
    var PX = 84, PY = 116;
    var x = r.left + r.width * 0.65 - PX, y = r.top + 8 - PY;
    var corpo = { left: x + 4, top: y + 4, right: x + 108, bottom: y + 70 };
    var rabo = { left: x + 68, top: y + 70, right: x + 92, bottom: r.top };
    if (corpo.left < 0 || corpo.top < 0) return;
    var vizinhos = [document.querySelector('.cky-consent-container'), document.getElementById('scroll-top-link')];
    for (var i = 0; i < vizinhos.length; i++) {
      var v = vizinhos[i];
      if (!v || v.classList.contains('cky-hide') || !v.getClientRects().length) continue;
      var c = getComputedStyle(v);
      if (c.visibility === 'hidden' || +c.opacity === 0) continue;
      var vr = v.getBoundingClientRect();
      if (cruza(corpo, vr) || cruza(rabo, vr)) return;
    }
    marcar('sm-aceno');
    var caixa = document.createElement('div');
    caixa.className = 'sm-aceno';
    caixa.setAttribute('aria-hidden', 'true');
    caixa.style.left = Math.round(x) + 'px';
    caixa.style.top = Math.round(y) + 'px';
    document.body.appendChild(caixa);
    function sair() {
      botao.removeEventListener('pointerenter', sair);
      botao.removeEventListener('pointerdown', sair);
      botao.removeEventListener('focusin', sair);
      vivas = vivas.filter(function (v) {
        if (v.caixa !== caixa) return true;
        v.anim.destroy();
        return false;
      });
      caixa.remove();
    }
    botao.addEventListener('pointerenter', sair);
    botao.addEventListener('pointerdown', sair);
    botao.addEventListener('focusin', sair);
    criar(caixa, 'aceno-sacola').then(function (anim) {
      if (!caixa.isConnected) return anim.destroy();
      vivas.push({ anim: anim, caixa: caixa });
      anim.addEventListener('complete', sair);
      anim.goToAndPlay(0, true);
    }, sair);
  }

  function iniciar() {
    passos();
    aoTerminarPassos.push(function () { setTimeout(aceno, 300); });
  }

  // Quem liga o movimento reduzido no meio da visita volta ao site parado.
  function parar() {
    vivas.forEach(function (v) {
      v.anim.destroy();
      v.caixa.remove();
      if (v.alvo) v.alvo.classList.remove('sm-lottie-alvo');
    });
    vivas = [];
  }
  if (mq.addEventListener) mq.addEventListener('change', function (e) { if (e.matches) parar(); });

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar);
  else iniciar();
})();
