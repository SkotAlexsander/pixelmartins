/* ==========================================================================
   TÍTULO DO HERO — revelação palavra por palavra

   Cada palavra vira um span dentro de uma máscara e sobe para o lugar. O
   stagger é de 40ms: mais que isso vira apresentação de slide.

   O TEXTO ACESSÍVEL NÃO É ESTE. Ele está num .sr-only ao lado, inteiro; o
   span que este módulo pica é aria-hidden. Leitor de tela nunca recebe a
   frase em pedaços, e sem JavaScript o span aparece normal.

   Sob "menos movimento" o módulo sai de cena inteiro — o texto fica como
   está no HTML, sem picar e sem animar.
   ========================================================================== */
(function () {
  "use strict";

  var quieto = false;
  try { quieto = window.matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) {}
  if (quieto) return;

  var frase = document.querySelector("[data-frase]");
  if (!frase) return;

  var palavras = frase.textContent.split(" ");
  frase.textContent = "";

  var caixas = [];
  for (var i = 0; i < palavras.length; i++) {
    var caixa = document.createElement("span");
    caixa.className = "pal";
    var dentro = document.createElement("span");
    dentro.textContent = palavras[i];
    caixa.appendChild(dentro);
    frase.appendChild(caixa);
    /* o espaço entre palavras fica FORA da máscara: dentro dela ele seria
       cortado e as palavras se colariam ao animar */
    if (i < palavras.length - 1) frase.appendChild(document.createTextNode(" "));
    caixas.push(caixa);
  }

  caixas.forEach(function (caixa, i) {
    setTimeout(function () { caixa.classList.add("pronta"); }, 90 + i * 40);
  });
})();
