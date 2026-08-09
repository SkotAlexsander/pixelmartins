/* ==========================================================================
   HERO — a frase sendo escrita, e o cold open que ela comanda

   A primeira tela é SÓ a frase. Enquanto ela é digitada, a barra do topo e a
   régua do rodapé estão fora de cena; quando termina, as duas entram. Um
   filme não abre com o menu do DVD.

   Quem faz o "fora de cena" é o CSS (`html.cold-open`, em css/05-atmosfera.css).
   Este módulo só põe e tira a classe — nenhum outro módulo precisa saber que
   isto existe.

   O RITMO NÃO É UNIFORME, e é isso que separa datilografia de contador de
   caracteres: depois de vírgula e de ponto há uma pausa, como quem fala.
   Um caractere a cada N milissegundos soa a máquina; com as pausas, soa a
   alguém escrevendo.

   O TEXTO ACESSÍVEL NÃO É ESTE. A frase inteira está num .sr-only ao lado,
   e o que este módulo escreve é aria-hidden. Leitor de tela nunca ouve a
   frase soletrada.

   Sob "menos movimento": a frase aparece pronta e não há cold open.
   ========================================================================== */
(function () {
  "use strict";

  var VELOCIDADE = 38;      /* ms por caractere */
  var PAUSA_VIRGULA = 260;  /* respiro depois de , e ; */
  var PAUSA_PONTO = 420;    /* respiro depois de . */
  var ATRASO = 420;         /* silêncio antes da primeira letra */

  var alvo = document.querySelector("[data-escreve]");
  if (!alvo) return;

  var frase = alvo.textContent.trim();
  var cursor = document.querySelector(".cursor");

  var quieto = false;
  try { quieto = window.matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) {}

  function terminou() {
    document.documentElement.classList.remove("cold-open");
    if (cursor) cursor.classList.add("parado");
  }

  if (quieto) {
    alvo.textContent = frase;
    terminou();
    return;
  }

  /* A classe entra aqui, e não no HTML, de propósito: se este script não
     rodar, ela nunca é posta e a página aparece montada. Esconder pelo HTML
     deixaria a barra invisível para sempre num navegador com JS quebrado. */
  document.documentElement.classList.add("cold-open");
  alvo.textContent = "";

  var i = 0;
  function escrever() {
    if (i >= frase.length) { terminou(); return; }
    var c = frase.charAt(i);
    alvo.textContent += c;
    i++;
    var espera = VELOCIDADE;
    if (c === "." || c === "!" || c === "?") espera += PAUSA_PONTO;
    else if (c === "," || c === ";" || c === ":") espera += PAUSA_VIRGULA;
    setTimeout(escrever, espera);
  }

  setTimeout(escrever, ATRASO);

  /* Quem chega já rolando (link com âncora, ou voltou pelo histórico) não
     quer esperar a cartela: o cold open acaba na hora. */
  window.addEventListener("scroll", function aoRolar() {
    if (window.scrollY > 40) {
      window.removeEventListener("scroll", aoRolar);
      document.documentElement.classList.remove("cold-open");
    }
  }, { passive: true });
})();
