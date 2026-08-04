(function () {
  "use strict";

  /* ============ Menu mobile ============ */
  var menuToggle = document.getElementById("menu-toggle");
  var mobileMenu = document.getElementById("mobile-menu");

  function setMenu(open) {
    if (!menuToggle || !mobileMenu) return;
    menuToggle.classList.toggle("open", open);
    mobileMenu.classList.toggle("open", open);
    menuToggle.setAttribute("aria-expanded", open ? "true" : "false");
    menuToggle.setAttribute("aria-label", open ? "Fechar menu" : "Abrir menu");
  }
  function menuIsOpen() { return mobileMenu && mobileMenu.classList.contains("open"); }

  if (menuToggle && mobileMenu) {
    menuToggle.addEventListener("click", function (e) {
      e.stopPropagation();
      setMenu(!menuIsOpen());
    });
    // Fecha ao tocar num link (navega e recolhe)
    mobileMenu.addEventListener("click", function (e) {
      if (e.target.closest("a")) setMenu(false);
    });
    // Fecha com Escape
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && menuIsOpen()) {
        setMenu(false);
        menuToggle.focus();
      }
    });
    // Fecha ao tocar fora
    document.addEventListener("click", function (e) {
      if (menuIsOpen() && !mobileMenu.contains(e.target) && !menuToggle.contains(e.target)) {
        setMenu(false);
      }
    });
    // Fecha se a tela crescer para o layout desktop
    window.matchMedia("(min-width: 768px)").addEventListener("change", function (mq) {
      if (mq.matches) setMenu(false);
    });
  }
})();
