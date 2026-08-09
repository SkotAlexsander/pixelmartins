/* Roda ANTES do CSS pintar — é o único script que precisa disso.

   Duas coisas, nesta ordem:

   1. A classe "js" avisa ao CSS que existe script. Tudo que começa escondido
      para depois aparecer (a revelação ao rolar, o título do hero) fica preso
      a ela. Assim, se o JavaScript não rodar — bloqueado, com erro, numa rede
      que engoliu o arquivo — a página aparece INTEIRA em vez de ficar em
      branco. É a diferença entre um site sem animação e um site quebrado.

   2. O tema salvo é aplicado antes da primeira pintura. Sem isso, quem
      escolheu claro vê um flash preto a cada carregamento. */
(function () {
  document.documentElement.classList.add("js");
  try {
    var t = localStorage.getItem("pm-theme");
    if (t === "light") document.documentElement.classList.add("light");
  } catch (e) {}
})();
