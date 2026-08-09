/* ==========================================================================
   DISCORD — copia o usuário

   O Discord não tem URL de perfil pública, então não dá para linkar: o que
   serve à pessoa é o nome de usuário na área de transferência. Por isso é um
   <button> e não um <a> — e, sendo botão, já funciona com Enter e Espaço no
   teclado, sem gambiarra de role/tabindex.

   A confirmação é a própria dica que já existe no hover: ela troca para
   "copiado!" por 1,6s e volta. Sem alerta, sem toast, sem nada novo na tela.

   navigator.clipboard exige HTTPS (ou localhost). Em HTTP simples ele nem
   existe — daí o plano B com textarea + execCommand, que é feio mas é o que
   funciona em todo lugar.

   Estilo: css/80-contato.css
   ========================================================================== */
(function () {
  "use strict";

  var botao = document.getElementById("discord");
  if (!botao) return;

  var USUARIO = "skot_alexsander";
  var relogio = null;

  function copiou() {
    botao.setAttribute("data-dica", "copiado!");
    botao.classList.add("copiado");
    if (relogio) clearTimeout(relogio);
    relogio = setTimeout(function () {
      botao.classList.remove("copiado");
      botao.setAttribute("data-dica", USUARIO);
    }, 1600);
  }

  function planoB() {
    var t = document.createElement("textarea");
    t.value = USUARIO;
    t.setAttribute("readonly", "");
    t.style.position = "fixed";
    t.style.opacity = "0";
    document.body.appendChild(t);
    t.select();
    try { document.execCommand("copy"); copiou(); } catch (e) {}
    document.body.removeChild(t);
  }

  botao.addEventListener("click", function () {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(USUARIO).then(copiou, planoB);
    } else {
      planoB();
    }
  });
})();
