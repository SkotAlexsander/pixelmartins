/* ==========================================================================
   FORMA DE ONDA — data graphic, não ilustração

   Desenha os DOIS canvas de onda da página, e por isso mora num módulo só:
     #onda   a faixa de narração do hero
     #a1     a faixa de áudio da régua do rodapé

   DETERMINÍSTICA DE PROPÓSITO. Nada de Math.random: a mesma onda em toda
   visita e em toda rodada de teste. Onda aleatória faria a bancada medir uma
   coisa diferente a cada vez, e um teste que muda sozinho não prova nada.

   Três senóides somadas com um ruído semeado dão sílabas e pausas — que é o
   que faz parecer fala gravada em vez de serrilha uniforme.

   Redesenha quando a janela muda de tamanho, quando o tema troca (a cor vem
   de var(--playhead)) e quando as fontes assentam (elas mudam a altura da
   caixa depois do primeiro desenho).
   ========================================================================== */
(function () {
  "use strict";

  function semente(i) {
    var x = Math.sin(i * 12.9898) * 43758.5453;
    return x - Math.floor(x);
  }

  function desenhar(tela, passo) {
    if (!tela || !tela.getContext) return;
    var r = tela.getBoundingClientRect();
    if (!r.width || !r.height) return;

    var ctx = tela.getContext("2d");
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    tela.width = Math.round(r.width * dpr);
    tela.height = Math.round(r.height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, r.width, r.height);

    var cor = getComputedStyle(document.documentElement)
      .getPropertyValue("--playhead").trim() || "#00CFFF";
    var meio = r.height / 2;
    var n = Math.floor(r.width / passo);

    ctx.fillStyle = cor;
    for (var i = 0; i < n; i++) {
      var t = i / n;
      var env = Math.abs(Math.sin(t * Math.PI * 7.3)) * .6
              + Math.abs(Math.sin(t * Math.PI * 2.1)) * .4;
      var a = env * (.45 + semente(i) * .55);
      if (semente(i * 3.7) > .93) a *= .25;        /* uma pausa entre sílabas */
      var h = Math.max(1, a * (meio - 2));
      ctx.globalAlpha = .35 + a * .55;
      ctx.fillRect(i * passo, meio - h, passo - 1, h * 2);
    }
    ctx.globalAlpha = 1;
  }

  function pintar() {
    desenhar(document.getElementById("onda"), 3);
    desenhar(document.getElementById("a1"), 2);
  }

  pintar();

  var relogio = null;
  window.addEventListener("resize", function () {
    if (relogio) clearTimeout(relogio);
    relogio = setTimeout(pintar, 150);
  });

  document.addEventListener("pm-tema", pintar);

  if (document.fonts && document.fonts.ready) document.fonts.ready.then(pintar);
})();
