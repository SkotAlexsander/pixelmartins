(function () {
  "use strict";

  var prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ============ Background atmosphere: campo de partículas ============ */
  var canvas = document.getElementById("bg-canvas");
  var blob1 = document.getElementById("blob-1");

  if (!prefersReducedMotion) {
    blob1.classList.add("animate-drift");

    var ctx = canvas.getContext("2d");
    var width = window.innerWidth;
    var height = window.innerHeight;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var particles = [];
    var animationFrame = null;
    var running = true;

    var CONNECT_DISTANCE = 130;
    var LINE_COLOR = "0, 207, 255";
    var DOT_COLOR = "0, 207, 255";

    function particleCountFor(w) {
      if (w < 640) return 18;
      if (w < 1024) return 32;
      return 52;
    }

    function createParticles() {
      var count = particleCountFor(width);
      particles = [];
      for (var i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.15,
          vy: (Math.random() - 0.5) * 0.15,
          radius: Math.random() * 1.2 + 0.6
        });
      }
    }

    function resize() {
      width = window.innerWidth;
      height = window.innerHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = width + "px";
      canvas.style.height = height + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      createParticles();
    }

    function step() {
      if (!running) return;
      ctx.clearRect(0, 0, width, height);

      for (var i = 0; i < particles.length; i++) {
        var p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(" + DOT_COLOR + ", 0.5)";
        ctx.fill();
      }

      for (var a = 0; a < particles.length; a++) {
        for (var b = a + 1; b < particles.length; b++) {
          var pa = particles[a];
          var pb = particles[b];
          var dx = pa.x - pb.x;
          var dy = pa.y - pb.y;
          var dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < CONNECT_DISTANCE) {
            ctx.beginPath();
            ctx.moveTo(pa.x, pa.y);
            ctx.lineTo(pb.x, pb.y);
            ctx.strokeStyle = "rgba(" + LINE_COLOR + ", " + (0.16 * (1 - dist / CONNECT_DISTANCE)) + ")";
            ctx.lineWidth = 0.6;
            ctx.stroke();
          }
        }
      }

      animationFrame = requestAnimationFrame(step);
    }

    function handleVisibility() {
      var nowVisible = document.visibilityState === "visible";
      if (nowVisible === running) return; // evita loops duplicados de rAF
      running = nowVisible;
      if (running) {
        animationFrame = requestAnimationFrame(step);
      } else if (animationFrame) {
        cancelAnimationFrame(animationFrame);
        animationFrame = null;
      }
    }

    // Debounce do resize: evita recriar as partículas a cada pixel
    // (no mobile, o resize dispara ao esconder/mostrar a barra de URL)
    var resizeTimer = null;
    function handleResize() {
      if (resizeTimer) clearTimeout(resizeTimer);
      resizeTimer = setTimeout(resize, 150);
    }

    resize();
    animationFrame = requestAnimationFrame(step);
    window.addEventListener("resize", handleResize);
    document.addEventListener("visibilitychange", handleVisibility);
  } else {
    canvas.style.display = "none";
  }
})();
