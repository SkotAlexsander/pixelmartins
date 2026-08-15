/* ==========================================================================
   RETRATO EM SEQUÊNCIA — o clipe da timeline

   150 fotos desenhadas num canvas, dentro do monitor de programa da seção
   "Sobre". Como são quadros consecutivos de um vídeo, a sequência reproduz
   o vídeo.

   NÃO DEPENDE DO SCROLL (dependia, até a v4). Roda em looping contínuo
   enquanto está à vista e DORME quando sai de cena ou a aba perde o foco —
   é o que separa um enfeite de um vazamento de bateria numa aba esquecida.
   As duas coisas são cobradas por dev/verificar-animacao.js.

   O laço é "vaivem": chega no frame 150 e volta andando de trás pra frente.
   Um ciclo comum (150 → 1) daria um salto visível a cada volta, porque a
   primeira e a última foto não se emendam. Indo e voltando, não há emenda.

   PARA MEXER: só as constantes deste bloco.
     total ......... quantos frames existem (frame-001.jpg … frame-150.jpg)
     fps ........... velocidade da animação
     laco .......... "vaivem" vai e volta · "ciclo" volta ao primeiro
     passoCelular .. no celular carrega 1 frame a cada N, para não torrar o
                     pacote de dados de quem está na rua

   De onde vêm as imagens e quanto isso pesa: docs/animacao-retrato.md
   ========================================================================== */
(function () {
  "use strict";

  var RETRATO = {
    total: 150,
    fps: 20,
    laco: "vaivem",
    passoCelular: 3,
    paralelo: 6,
    prazoTeste: 2500,
    bases: {
      local: "./assets/frames/",
      wp:    "https://pixelmartins.com/wp-content/uploads/retrato/",
      /* 15/08/2026 — este endereço passou a apontar para o nome NOVO do
         repositório. O antigo não tinha quebrado: o jsDelivr segue o
         redirecionamento do GitHub, e as duas URLs devolviam os mesmos 13.974
         bytes (conferido no dia).

         Trocado assim mesmo, porque redirecionamento é emprestado — vale só
         enquanto ninguém criar um repositório novo com o nome velho. No dia
         em que isso acontecesse, o retrato pararia de carregar SEM erro
         nenhum no console: o canvas ficaria na tarja "retrato indisponível" e
         ninguém saberia por quê.

         (O nome antigo não é citado aqui de propósito. Este arquivo vai
         inteiro para o site no ar, e a bancada reprova se ele aparecer —
         foi ela que pegou a primeira versão deste comentário.) */
      cdn:   "https://cdn.jsdelivr.net/gh/SkotAlexsander/pixelmartins@main/assets/frames/"
    }
  };

  function mq(consulta) {
    try { return window.matchMedia(consulta); }
    catch (e) { return { matches: false }; }
  }

  var tela = document.getElementById("retrato");
  if (!tela || !tela.getContext) return;

  var ctx      = tela.getContext("2d", { alpha: true });
  var status   = document.getElementById("retrato-status");
  var info     = document.getElementById("retrato-info");
  var modo     = document.getElementById("retrato-modo");
  var quadroEl = tela.parentNode;

  var quieto = mq("(prefers-reduced-motion: reduce)").matches;

  /* Rede fraca ou economia de dados ligada: uma foto parada é mais
     respeitoso que 150 imagens. */
  var con = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  var redeFraca = !!(con && (con.saveData || /^(slow-)?2g$/.test(con.effectiveType || "")));
  var celular = mq("(max-width: 47.99rem)").matches;
  var parado  = quieto || redeFraca;

  var base = RETRATO.bases.local, baseDecidida = false;
  var lista = [], imgs = {}, ok = {}, falhas = 0;
  var fila = [], ativos = 0;
  var pos = 0, dir = 1, ultimoDesenho = -1, ultimoTempo = 0, laco = null;
  var visivel = false, iniciado = false;
  var L = 0, A = 0;

  function url(i) {
    var n = String(i + 1);
    while (n.length < 3) n = "0" + n;
    return base + "frame-" + n + ".jpg";
  }

  function medir() {
    var r = quadroEl.getBoundingClientRect();
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    L = Math.max(1, Math.round(r.width));
    A = Math.max(1, Math.round(r.height));
    tela.width  = Math.round(L * dpr);
    tela.height = Math.round(A * dpr);
    tela.style.width = "100%";
    tela.style.height = "100%";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ultimoDesenho = -1;
  }

  /* "cover": preenche sem distorcer, cortando o excesso */
  function pintar(img) {
    var e = Math.max(L / img.naturalWidth, A / img.naturalHeight);
    var w = img.naturalWidth * e, h = img.naturalHeight * e;
    ctx.clearRect(0, 0, L, A);
    ctx.drawImage(img, (L - w) / 2, (A - h) / 2, w, h);
  }

  /* Se o frame da vez ainda não chegou, usa o mais próximo que já existe. A
     animação nunca trava esperando a rede — no máximo fica granulada por um
     instante e vai ficando fluida conforme os arquivos caem. */
  function maisProximo(k) {
    if (ok[lista[k]]) return lista[k];
    for (var d = 1; d < lista.length; d++) {
      if (k - d >= 0 && ok[lista[k - d]]) return lista[k - d];
      if (k + d < lista.length && ok[lista[k + d]]) return lista[k + d];
    }
    return -1;
  }

  function desenhar(k) {
    var i = maisProximo(k);
    if (i < 0 || i === ultimoDesenho) return;
    ultimoDesenho = i;
    pintar(imgs[i]);
  }

  function anda(ts) {
    laco = null;
    if (!visivel || document.hidden || parado) { ultimoTempo = 0; return; }

    if (!ultimoTempo) ultimoTempo = ts;
    var dt = ts - ultimoTempo;
    var porFrame = 1000 / RETRATO.fps;

    if (dt >= porFrame) {
      var avanca = Math.floor(dt / porFrame);
      if (avanca > 6) avanca = 6;          /* aba voltou do limbo: sem estouro */
      ultimoTempo = ts;
      pos += avanca * dir;

      if (RETRATO.laco === "vaivem") {
        if (pos >= lista.length - 1) { pos = lista.length - 1; dir = -1; }
        else if (pos <= 0) { pos = 0; dir = 1; }
      } else if (pos >= lista.length) {
        pos = 0;
      }
      desenhar(pos);
    }
    laco = requestAnimationFrame(anda);
  }

  /* laco === null é a trava contra loop duplicado de requestAnimationFrame */
  function acordar() {
    if (laco === null && visivel && !document.hidden && !parado && lista.length) {
      ultimoTempo = 0;
      laco = requestAnimationFrame(anda);
    }
  }
  function dormir() {
    if (laco !== null) { cancelAnimationFrame(laco); laco = null; }
    ultimoTempo = 0;
  }

  function apareceu() {
    if (tela.classList.contains("pronto")) return;
    tela.classList.add("pronto");
    if (status) status.classList.add("some");
  }

  /* ---- downloads ---- */
  function bombear() {
    while (ativos < RETRATO.paralelo && fila.length) {
      var i = fila.shift();
      if (imgs[i]) continue;
      ativos++;
      baixar(i);
    }
  }

  function baixar(i) {
    var img = new Image();
    img.decoding = "async";
    /* crossOrigin só quando a imagem vem de outro domínio. Pedir CORS numa
       imagem do próprio site é inútil e, se o servidor não mandar o
       cabeçalho, a imagem simplesmente não carrega. */
    if (base.indexOf("//") >= 0 && base.indexOf(location.origin) !== 0) img.crossOrigin = "anonymous";

    function chegou() {
      ok[i] = true; ativos--;
      if (!tela.classList.contains("pronto")) { desenhar(pos); apareceu(); }
      else acordar();
      bombear();
    }
    img.onload = function () {
      if (img.decode) img.decode().then(chegou, chegou); else chegou();
    };
    img.onerror = function () {
      ok[i] = false; imgs[i] = null; ativos--; falhas++;
      if (falhas === lista.length && status) status.textContent = "retrato indisponível";
      bombear();
    };
    img.src = url(i);
    imgs[i] = img;
  }

  function montarLista() {
    var passo = celular ? RETRATO.passoCelular : 1;
    lista = [];
    for (var i = 0; i < RETRATO.total; i += passo) lista.push(i);
  }

  function comecar() {
    if (iniciado) return;
    iniciado = true;
    medir();

    if (parado) {
      /* Um frame só, do meio: quem pediu menos movimento (ou está com
         economia de dados) vê o retrato, não a animação. */
      var meio = Math.floor(RETRATO.total / 2);
      lista = [meio]; pos = 0;
      if (modo) modo.textContent = redeFraca ? "quadro único · economia de dados" : "quadro único · menos movimento";
      fila = [meio];
      bombear();
      return;
    }

    montarLista();
    if (modo) modo.textContent = lista.length + " frames · em looping";
    if (info) info.textContent = "retrato.seq";

    /* Duas ondas: primeiro um esqueleto espaçado (a animação já roda
       inteira, só que grosseira), depois o preenchimento. */
    var i;
    for (i = 0; i < lista.length; i += 5) fila.push(lista[i]);
    for (i = 0; i < lista.length; i++) if (i % 5 !== 0) fila.push(lista[i]);
    bombear();
    acordar();
  }

  /* ---- de onde vêm os frames: local → WordPress → CDN ----
     Testa o WordPress baixando um frame. Se responder, o site serve as
     próprias imagens; se der 404 ou demorar, cai no CDN. A requisição do
     teste não é desperdiçada: vira o frame 1, que fica no cache. */
  function decidirBase() {
    if (baseDecidida) return;

    function definir(b, origem) {
      if (baseDecidida) return;
      baseDecidida = true;
      base = b;
      if (window.console && console.info) console.info("[retrato] frames via " + origem);
      comecar();
    }

    if (/^(localhost|127\.0\.0\.1|)$/.test(location.hostname)) {
      definir(RETRATO.bases.local, "pasta local");
      return;
    }

    var prazo = setTimeout(function () {
      definir(RETRATO.bases.cdn, "CDN (o teste do WordPress demorou)");
    }, RETRATO.prazoTeste);

    var teste = new Image();
    teste.onload  = function () { clearTimeout(prazo); definir(RETRATO.bases.wp,  "WordPress"); };
    teste.onerror = function () { clearTimeout(prazo); definir(RETRATO.bases.cdn, "CDN (WordPress não tem os frames)"); };
    teste.src = RETRATO.bases.wp + "frame-001.jpg";
  }

  /* ---- entra e sai de cena ---- */
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (entradas) {
      visivel = !!(entradas[0] && entradas[0].isIntersecting);
      if (visivel) { decidirBase(); acordar(); } else dormir();
    }, { rootMargin: "180px 0px", threshold: 0 }).observe(quadroEl);
  } else {
    visivel = true;
    decidirBase();
  }

  document.addEventListener("visibilitychange", function () {
    if (document.hidden) dormir(); else acordar();
  });

  var relogio = null;
  window.addEventListener("resize", function () {
    if (!iniciado) return;
    if (relogio) clearTimeout(relogio);
    relogio = setTimeout(function () {
      var eraCelular = celular;
      celular = mq("(max-width: 47.99rem)").matches;
      medir();
      /* Girou o celular e virou tablet: vale buscar os frames que faltam
         para a animação ficar mais fluida. Ao contrário nunca desfaz — o
         que já baixou já está pago. */
      if (eraCelular && !celular && !parado) {
        var antes = lista.length;
        montarLista();
        if (lista.length > antes) {
          for (var i = 0; i < lista.length; i++) if (!imgs[lista[i]]) fila.push(lista[i]);
          if (modo) modo.textContent = lista.length + " frames · em looping";
          bombear();
        }
      }
      desenhar(pos);
    }, 180);
  });
})();
