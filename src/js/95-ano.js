/* ==========================================================================
   O ANO DO RODAPÉ

   O HTML traz o ano escrito ("2026") em vez de vir vazio: sem JavaScript o
   rodapé continua fazendo sentido, e é só isso que este módulo faz — manter
   o número certo quando o ano virar, sem ninguém precisar lembrar de editar.
   ========================================================================== */
(function () {
  "use strict";
  var ano = document.getElementById("ano");
  if (ano) ano.textContent = new Date().getFullYear();
})();
