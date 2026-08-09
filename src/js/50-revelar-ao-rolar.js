/* ==========================================================================
   REVELAÇÃO AO ROLAR — o "corte"

   Cada bloco marcado com [data-anim] entra quando encosta na tela. É rápido
   (380ms, no CSS) e seco: vídeo bom corta, não faz fade em tudo.

   Duas saídas de emergência, e as duas terminam com TUDO VISÍVEL:
     · "menos movimento" ligado    → aparece de uma vez
     · navegador sem IntersectionObserver → aparece de uma vez
   Nunca o contrário. Um bloco que depende de um observador que não existe
   fica invisível para sempre, e isso é pior do que não ter animação nenhuma.

   Estilo: css/35-revelar.css
   ========================================================================== */
(function () {
  "use strict";

  var quieto = false;
  try { quieto = window.matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) {}

  var alvos = document.querySelectorAll("[data-anim]");
  if (!alvos.length) return;

  function mostrarTodos() {
    for (var i = 0; i < alvos.length; i++) alvos[i].classList.add("dentro");
  }

  if (quieto || !("IntersectionObserver" in window)) {
    mostrarTodos();
    return;
  }

  var obs = new IntersectionObserver(function (entradas) {
    for (var i = 0; i < entradas.length; i++) {
      if (entradas[i].isIntersecting) {
        entradas[i].target.classList.add("dentro");
        obs.unobserve(entradas[i].target);
      }
    }
  }, { rootMargin: "0px 0px -12% 0px", threshold: 0 });

  for (var i = 0; i < alvos.length; i++) obs.observe(alvos[i]);
})();
