/* ==========================================================================
   FITA DE FERRAMENTAS

   A lista é montada aqui, e não escrita no HTML, porque ela PRECISA aparecer
   duas vezes seguidas: a animação desliza a pista até -50% e volta ao início.
   Se houvesse um grupo só, o laço daria um salto visível a cada volta.

   Escrever a lista duas vezes à mão no HTML resolveria — e criaria duas
   listas para manter sincronizadas, que é o tipo de coisa que fica torta na
   terceira edição.

   A lista em texto corrido, para leitor de tela e para busca, está no
   .sr-only logo depois da fita (src/html/secoes/hero.html).
   ========================================================================== */
(function () {
  "use strict";

  var pista = document.getElementById("fita-pista");
  if (!pista) return;

  var itens = ["Next.js", "React", "TypeScript", "JavaScript", "Three.js", "HTML", "CSS",
               "WordPress", "Elementor", "Premiere", "After Effects", "DaVinci Resolve",
               "CapCut", "Figma", "Git", "Node.js", "LLMs"];

  function grupo() {
    var g = document.createElement("div");
    g.className = "fita-grupo";
    for (var i = 0; i < itens.length; i++) {
      var b = document.createElement("b");
      b.textContent = itens[i];
      g.appendChild(b);
      g.appendChild(document.createElement("i"));
    }
    return g;
  }

  pista.appendChild(grupo());
  pista.appendChild(grupo());
})();
