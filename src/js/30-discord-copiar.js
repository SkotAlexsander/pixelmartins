(function () {
  "use strict";

  /* ============ Discord: copia o usuário ao clicar ============ */
  var discordBtn = document.getElementById("discord-copy");
  if (discordBtn) {
    var DISCORD_USER = "skot_alexsander";
    var tipTimer = null;

    function showCopied() {
      discordBtn.setAttribute("data-tip", "copiado!");
      discordBtn.classList.add("copied");
      if (tipTimer) clearTimeout(tipTimer);
      tipTimer = setTimeout(function () {
        discordBtn.classList.remove("copied");
        discordBtn.setAttribute("data-tip", DISCORD_USER);
      }, 1600);
    }

    function fallbackCopy() {
      var ta = document.createElement("textarea");
      ta.value = DISCORD_USER;
      ta.setAttribute("readonly", "");
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand("copy"); showCopied(); } catch (e) {}
      document.body.removeChild(ta);
    }

    discordBtn.addEventListener("click", function () {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(DISCORD_USER).then(showCopied, fallbackCopy);
      } else {
        fallbackCopy();
      }
    });
  }
})();
