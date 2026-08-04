(function () {
  "use strict";

  /* ============ Theme toggle (equivalente ao next-themes) ============ */
  var themeToggle = document.getElementById("theme-toggle");
  function isLight() { return document.documentElement.classList.contains("light"); }
  function applyThemeLabel() {
    if (!themeToggle) return;
    themeToggle.setAttribute("aria-label", isLight() ? "Ativar modo escuro" : "Ativar modo claro");
  }
  applyThemeLabel();
  if (themeToggle) {
    themeToggle.addEventListener("click", function () {
      document.documentElement.classList.toggle("light");
      try { localStorage.setItem("pm-theme", isLight() ? "light" : "dark"); } catch (e) {}
      applyThemeLabel();
    });
  }
})();
