/* ==========================================================================
   MENU DE CELULAR

   Quatro maneiras de fechar, porque menu que só fecha pelo próprio botão
   irrita: pelo botão, tocando num link, com Escape (devolvendo o foco ao
   botão) e tocando fora. E fecha sozinho se a tela crescer para o layout de
   desktop, onde ele nem existe — senão ficaria um painel aberto invisível
   segurando o foco.

   Estilo: css/25-menu-mobile.css
   ========================================================================== */
(function () {
  "use strict";

  var btn = document.getElementById("menu-btn");
  var menu = document.getElementById("menu");
  if (!btn || !menu) return;

  function definir(aberto) {
    menu.classList.toggle("aberto", aberto);
    btn.setAttribute("aria-expanded", aberto ? "true" : "false");
    btn.setAttribute("aria-label", aberto ? "Fechar menu" : "Abrir menu");
  }
  function aberto() { return menu.classList.contains("aberto"); }

  btn.addEventListener("click", function (e) {
    e.stopPropagation();
    definir(!aberto());
  });

  /* toca num link: navega e recolhe */
  menu.addEventListener("click", function (e) {
    if (e.target.closest && e.target.closest("a")) definir(false);
  });

  /* Escape devolve o foco ao botão — quem fechou pelo teclado precisa saber
     onde está */
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && aberto()) {
      definir(false);
      btn.focus();
    }
  });

  document.addEventListener("click", function (e) {
    if (aberto() && !menu.contains(e.target) && !btn.contains(e.target)) definir(false);
  });

  /* 62rem é o mesmo ponto em que o CSS troca o menu pela navegação do topo */
  try {
    var largo = window.matchMedia("(min-width: 62rem)");
    var aoMudar = function (mq) { if (mq.matches) definir(false); };
    if (largo.addEventListener) largo.addEventListener("change", aoMudar);
    else if (largo.addListener) largo.addListener(aoMudar);
  } catch (e) {}
})();
