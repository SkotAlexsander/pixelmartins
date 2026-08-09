/* ==========================================================================
   TEMA — escuro (padrão) e claro

   O escuro não é preferência estética: sala de edição é escura e neutra
   porque cor de referência não se julga sob luz colorida. O claro é a mesma
   sala com a luz acesa — mesma estrutura, paleta neutra clara.

   Dispara o evento "pm-tema" ao trocar. Quem desenha em canvas (a forma de
   onda) precisa saber: a cor dela vem de var(--playhead), que muda de valor
   no tema claro, e canvas não recalcula CSS sozinho.

   O anti-flash (aplicar o tema salvo antes da primeira pintura) mora em
   00-tema-antiflash.js, que roda antes do CSS.
   ========================================================================== */
(function () {
  "use strict";

  var btn = document.getElementById("tema-btn");
  if (!btn) return;

  function claro() { return document.documentElement.classList.contains("light"); }

  function rotular() {
    btn.setAttribute("aria-label", claro() ? "Ativar modo escuro" : "Ativar modo claro");
  }
  rotular();

  btn.addEventListener("click", function () {
    document.documentElement.classList.toggle("light");
    try { localStorage.setItem("pm-theme", claro() ? "light" : "dark"); } catch (e) {}
    rotular();
    document.dispatchEvent(new CustomEvent("pm-tema"));
  });
})();
