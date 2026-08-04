/* ============ Retrato dirigido pelo scroll (sequência de frames) ============
   O progresso da página escolhe o frame; um amortecedor (lerp) persegue esse
   alvo a cada quadro, então a imagem nunca "pula" junto com o scroll — é isso
   que dá a sensação de suavidade.

   Para trocar onde os frames ficam hospedados, mexa só em FRAME_BASE.
   Para ajustar o quanto aparece, mexa em --portrait-opacity / --hero-veil no CSS. */
(function () {
  /* ---- Onde os frames moram ----------------------------------------------
     Três endereços possíveis, escolhidos automaticamente:

       LOCAL  quando roda em preview.html (localhost ou file://)
       WP     o próprio domínio — preferido, porque não depende de terceiro
       CDN    jsDelivr servindo o repo público do GitHub — a rede de segurança

     O código testa o WP baixando um frame. Se responder, usa o WP daí em
     diante; se der 404 (ainda não subiu) ou demorar, cai no CDN. Ou seja:
     dá para subir as imagens pro WordPress quando quiser, sem tocar no código
     de novo — e enquanto não subir, o site não fica sem o efeito.

     Se você subir pela BIBLIOTECA DE MÍDIA em vez do gerenciador de arquivos,
     o caminho tem pasta de ano/mês: troque WP_BASE por algo como
     "https://pixelmartins.com/wp-content/uploads/2026/08/". */
  var LOCAL_BASE = "./assets/frames/";
  var WP_BASE    = "https://pixelmartins.com/wp-content/uploads/retrato/";
  var CDN_BASE   = "https://cdn.jsdelivr.net/gh/SkotAlexsander/pixelmartins-site@main/assets/frames/";
  var TESTE_MS   = 2500;    // se o teste do WP não responder nisso, usa o CDN

  var FRAME_BASE  = LOCAL_BASE;   // definido de verdade lá embaixo, antes de iniciar
  var FRAME_COUNT = 150;
  var EASING      = 0.10;   // 0.05 = bem preguiçoso · 0.25 = mais colado no scroll
  var MOBILE_MAX  = 820;    // até esta largura, mostra 1 frame parado (economia de dados)

  /* Quanto o retrato aparece. No hero ele é segurado pelo véu preto
     (--hero-veil), então pode ser mais forte; no conteúdo não há véu nenhum,
     e 0.38 faria o rosto brigar com o texto. Por isso ele recua ao rolar. */
  var OP_HERO     = 0.38;
  var OP_CONTEUDO = 0.12;

  var canvas = document.getElementById("portrait-canvas");
  if (!canvas || !canvas.getContext) return;

  var ctx    = canvas.getContext("2d", { alpha: false });
  var quieto = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var leve   = quieto || window.innerWidth <= MOBILE_MAX;

  function url(i) {
    var n = String(i + 1);
    while (n.length < 3) n = "0" + n;
    return FRAME_BASE + "frame-" + n + ".jpg";
  }

  var frames    = new Array(FRAME_COUNT);
  var carregado = new Array(FRAME_COUNT);
  var atual = 0, alvo = 0, desenhado = -1, loop = null, largura = 0, altura = 0;

  function medir() {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    largura = canvas.clientWidth;
    altura  = canvas.clientHeight;
    canvas.width  = Math.round(largura * dpr);
    canvas.height = Math.round(altura * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    desenhado = -1;               // força redesenho na nova escala
  }

  /* Desenha em "cover": preenche a tela inteira sem distorcer, cortando o excesso. */
  function desenhar(i) {
    var img = frames[i];
    if (!img || !carregado[i] || !largura) return;
    var escala = Math.max(largura / img.width, altura / img.height);
    var w = img.width * escala, h = img.height * escala;
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, largura, altura);
    ctx.drawImage(img, (largura - w) / 2, (altura - h) / 2, w, h);
    desenhado = i;
  }

  /* Se o frame exato ainda não baixou, usa o mais próximo que já existe —
     assim a animação nunca trava esperando a rede. */
  function maisProximoPronto(i) {
    if (carregado[i]) return i;
    for (var d = 1; d < FRAME_COUNT; d++) {
      if (i - d >= 0 && carregado[i - d]) return i - d;
      if (i + d < FRAME_COUNT && carregado[i + d]) return i + d;
    }
    return -1;
  }

  function progresso() {
    var total = document.documentElement.scrollHeight - window.innerHeight;
    if (total <= 0) return 0;
    var p = window.scrollY / total;
    return p < 0 ? 0 : p > 1 ? 1 : p;
  }

  function passo() {
    atual += (alvo - atual) * EASING;
    if (Math.abs(alvo - atual) < 0.35) atual = alvo;   // encosta e para
    var i = maisProximoPronto(Math.round(atual));
    if (i >= 0 && i !== desenhado) desenhar(i);
    if (atual !== alvo && !document.hidden) {
      loop = requestAnimationFrame(passo);
    } else {
      loop = null;                                      // guarda contra loop duplicado
    }
  }

  function acordar() {
    if (loop === null && !document.hidden) loop = requestAnimationFrame(passo);
  }

  /* O retrato recua ao longo da primeira tela de scroll: forte no hero,
     discreto sob o conteúdo. Vem direto da posição do scroll (não do
     amortecedor), então acompanha o dedo sem atraso. */
  function ajustarPresenca() {
    var t = window.scrollY / (window.innerHeight || 1);
    if (t > 1) t = 1;
    t = t * t * (3 - 2 * t);                       // smoothstep: sem canto na virada
    var o = OP_HERO + (OP_CONTEUDO - OP_HERO) * t;
    document.documentElement.style.setProperty("--portrait-now", o.toFixed(3));
  }

  function aoRolar() {
    alvo = progresso() * (FRAME_COUNT - 1);
    ajustarPresenca();
    acordar();
  }

  function carregar(i, aoTerminar) {
    var img = new Image();
    img.decoding = "async";
    /* crossOrigin só quando a imagem vem de OUTRO domínio (o CDN). Serve para o
       canvas não ficar "tainted" — é assim que o dev/verificar-animacao.js
       consegue ler os pixels e provar que a animação está viva.
       Em imagem do próprio domínio, pedir CORS é inútil e, se o servidor não
       mandar o cabeçalho, a imagem simplesmente não carrega. */
    if (FRAME_BASE.indexOf("//") >= 0 && FRAME_BASE.indexOf(location.origin) !== 0) {
      img.crossOrigin = "anonymous";
    }
    img.onload = function () {
      carregado[i] = true;
      if (aoTerminar) aoTerminar();
      if (desenhado === -1) {
        desenhar(i);
        canvas.classList.add("ready");
        /* A transição existe só para o retrato entrar suave. Depois ela tem de
           sair: senão cada ajuste de presença no scroll ficaria 0,9 s atrasado. */
        setTimeout(function () { canvas.style.transition = "none"; }, 1000);
      } else acordar();
    };
    img.onerror = function () { carregado[i] = false; };
    img.src = url(i);
    frames[i] = img;
  }

  medir();

  /* Só roda depois que o endereço dos frames estiver decidido. */
  function iniciar(base, origem) {
    FRAME_BASE = base;
    if (window.console && console.info) console.info("[retrato] frames via " + origem);

    if (leve) {
      // Sem animação: um único frame do meio, parado. 13 KB em vez de 1,9 MB.
      // Presença fixa no meio-termo, já que aqui não há scroll para modular.
      document.documentElement.style.setProperty("--portrait-now", "0.22");
      carregar(Math.floor(FRAME_COUNT / 2));
      window.addEventListener("resize", function () {
        medir();
        var i = maisProximoPronto(0);
        if (i >= 0) desenhar(i);
      });
      return;
    }

    /* Baixa em duas ondas: primeiro um esqueleto espaçado (a animação já roda
       inteira, só que grosseira), depois preenche o resto. Evita 150 requisições
       simultâneas brigando por banda. */
    var pendentes = 0;
    function segundaOnda() {
      if (--pendentes > 0) return;
      for (var i = 0; i < FRAME_COUNT; i++) if (!frames[i]) carregar(i);
    }
    for (var i = 0; i < FRAME_COUNT; i += 6) pendentes++;
    for (var j = 0; j < FRAME_COUNT; j += 6) carregar(j, segundaOnda);

    window.addEventListener("scroll", aoRolar, { passive: true });
    window.addEventListener("resize", function () { medir(); acordar(); });
    document.addEventListener("visibilitychange", function () {
      if (document.hidden) {
        if (loop !== null) { cancelAnimationFrame(loop); loop = null; }
      } else {
        aoRolar();
      }
    });
    aoRolar();
  }

  /* ---- Escolha do endereço -------------------------------------------------
     Local resolve na hora. Em produção, testa o WordPress baixando um frame:
     se vier, o site passa a servir as próprias imagens; se der 404 ou demorar,
     usa o CDN. Custa uma requisição de ~13 KB, e ela não é desperdiçada — vira
     o frame 1, que já fica no cache do navegador para o carregamento seguinte. */
  if (/^(localhost|127\.0\.0\.1|)$/.test(location.hostname)) {
    iniciar(LOCAL_BASE, "pasta local");
  } else {
    var decidido = false;
    function decidir(base, origem) {
      if (decidido) return;
      decidido = true;
      clearTimeout(prazo);
      iniciar(base, origem);
    }
    var prazo = setTimeout(function () {
      decidir(CDN_BASE, "CDN (o teste do WordPress demorou)");
    }, TESTE_MS);

    /* Sem crossOrigin: a sonda só quer saber se o arquivo existe, e imagem
       comum não precisa de CORS para carregar. Pedir CORS aqui geraria erro
       no console e falso negativo se o servidor não mandasse o cabeçalho. */
    var teste = new Image();
    teste.onload  = function () { decidir(WP_BASE,  "WordPress"); };
    teste.onerror = function () { decidir(CDN_BASE, "CDN (WordPress não tem os frames)"); };
    teste.src = WP_BASE + "frame-001.jpg";
  }
})();
