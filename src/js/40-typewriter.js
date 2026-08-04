(function () {
  "use strict";

  var prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ============ Typewriter (Hero) ============ */
  var HERO_TEXT = "Seu site e seu vídeo, feitos pela mesma pessoa.";
  var DURATION_MS = 4000;
  var START_DELAY_MS = 300;

  var textEl = document.getElementById("typewriter-text");
  var caretEl = document.getElementById("caret");
  var scrollIndicator = document.getElementById("scroll-indicator");
  var navbar = document.getElementById("navbar");

  function onTypingComplete() {
    caretEl.classList.add("done");
    scrollIndicator.classList.add("visible");
    scrollIndicator.classList.add("bounce");
    navbar.classList.add("visible");
  }

  if (prefersReducedMotion) {
    textEl.textContent = HERO_TEXT;
    onTypingComplete();
  } else {
    var perCharMs = DURATION_MS / HERO_TEXT.length;
    var startTime = null;
    var rafId = null;

    function tick(timestamp) {
      if (startTime === null) startTime = timestamp;
      var elapsed = timestamp - startTime;
      var chars = Math.min(HERO_TEXT.length, Math.floor(elapsed / perCharMs));
      textEl.textContent = HERO_TEXT.slice(0, chars);

      if (chars < HERO_TEXT.length) {
        rafId = requestAnimationFrame(tick);
      } else {
        onTypingComplete();
      }
    }

    window.setTimeout(function () {
      rafId = requestAnimationFrame(tick);
    }, START_DELAY_MS);
  }
})();
