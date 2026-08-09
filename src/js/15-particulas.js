/* ==========================================================================
   CAMPO DE PARTÍCULAS — o fundo das primeiras versões, de volta

   Pontos que derivam devagar e se ligam por uma linha quando chegam perto.
   Estava no site desde julho, saiu na reescrita e o Alex pediu de volta.

   SÓ NO TEMA ESCURO, por pedido dele — e a razão se sustenta sozinha: a
   linha é ciano a 16% de opacidade, que sobre papel claro vira sujeira
   cinzenta em vez de luz. No claro o canvas é desligado de verdade (o laço
   para, não fica rodando invisível).

   Cuidados que já estavam no código original e continuam aqui:
     · uma trava de laço duplo (`rodando`) — sem ela, alternar de aba duas
       vezes deixa dois requestAnimationFrame vivos e o custo dobra
     · pausa com a aba escondida
     · resize com atraso: no celular, esconder a barra de endereço dispara
       resize a cada pixel, e recriar as partículas a cada um trava tudo
     · devicePixelRatio limitado a 2

   Novo: também para quando a página está fora de vista (rolou muito para
   baixo não adianta, é fixed — mas a troca de tema agora liga e desliga).

   Estilo: css/05-atmosfera.css
   ========================================================================== */
(function () {
  "use strict";

  var tela = document.getElementById("particulas");
  if (!tela || !tela.getContext) return;

  var quieto = false;
  try { quieto = window.matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) {}

  var ctx = tela.getContext("2d");
  var L = 0, A = 0, dpr = 1;
  var pontos = [];
  var laco = null, rodando = false;

  var DIST = 130;          /* a partir de que distância duas partículas se ligam */
  var COR = "0, 207, 255"; /* o ciano da marca */

  function quantas(w) {
    if (w < 640) return 18;
    if (w < 1024) return 32;
    return 52;
  }

  function criar() {
    var n = quantas(L);
    pontos = [];
    for (var i = 0; i < n; i++) {
      pontos.push({
        x: Math.random() * L,
        y: Math.random() * A,
        vx: (Math.random() - 0.5) * 0.15,
        vy: (Math.random() - 0.5) * 0.15,
        r: Math.random() * 1.2 + 0.6
      });
    }
  }

  function medir() {
    L = window.innerWidth;
    A = window.innerHeight;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    tela.width = Math.round(L * dpr);
    tela.height = Math.round(A * dpr);
    tela.style.width = L + "px";
    tela.style.height = A + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    criar();
  }

  function passo() {
    if (!rodando) { laco = null; return; }
    ctx.clearRect(0, 0, L, A);

    for (var i = 0; i < pontos.length; i++) {
      var p = pontos[i];
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < 0 || p.x > L) p.vx *= -1;
      if (p.y < 0 || p.y > A) p.vy *= -1;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(" + COR + ", 0.5)";
      ctx.fill();
    }

    /* O laço duplo é O(n²), e é por isso que o número de partículas é
       modesto: 52 dá 1326 pares por quadro, que o navegador aguenta de
       sobra. Dobrar o número quadruplica a conta. */
    for (var a = 0; a < pontos.length; a++) {
      for (var b = a + 1; b < pontos.length; b++) {
        var pa = pontos[a], pb = pontos[b];
        var dx = pa.x - pb.x, dy = pa.y - pb.y;
        var d = Math.sqrt(dx * dx + dy * dy);
        if (d < DIST) {
          ctx.beginPath();
          ctx.moveTo(pa.x, pa.y);
          ctx.lineTo(pb.x, pb.y);
          ctx.strokeStyle = "rgba(" + COR + ", " + (0.16 * (1 - d / DIST)) + ")";
          ctx.lineWidth = 0.6;
          ctx.stroke();
        }
      }
    }

    laco = requestAnimationFrame(passo);
  }

  function claro() { return document.documentElement.classList.contains("light"); }

  function ligar() {
    if (rodando || quieto || claro() || document.hidden) return;
    if (!L) medir();
    rodando = true;
    if (laco === null) laco = requestAnimationFrame(passo);
  }

  function desligar() {
    rodando = false;
    if (laco !== null) { cancelAnimationFrame(laco); laco = null; }
    if (L) ctx.clearRect(0, 0, L, A);
  }

  /* Sob "menos movimento" o canvas nem existe: some do fluxo e ponto final. */
  if (quieto) { tela.style.display = "none"; return; }

  medir();
  ligar();

  document.addEventListener("visibilitychange", function () {
    if (document.hidden) desligar(); else ligar();
  });

  /* O tema claro desliga de verdade — nada de deixar o laço rodando atrás
     de um canvas invisível. */
  document.addEventListener("pm-tema", function () {
    if (claro()) desligar(); else ligar();
  });

  var relogio = null;
  window.addEventListener("resize", function () {
    if (relogio) clearTimeout(relogio);
    relogio = setTimeout(function () {
      medir();
      if (!rodando) ligar();
    }, 150);
  });
})();
