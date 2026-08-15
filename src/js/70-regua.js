/* ==========================================================================
   A RÉGUA — playhead, timecode, clipes e a navegação da página

   É o módulo que faz a ideia da página funcionar: rolar move o playhead, e
   cada seção é um clipe clicável na faixa V1.

   Cuida da navegação por âncora da página INTEIRA (não só da régua) porque
   ela precisa ser uma coisa só: o mesmo deslocamento pela altura da barra do
   topo, o mesmo tratamento de foco. Dois caminhos diferentes para "ir até a
   seção" acabam divergindo no primeiro ajuste.

   Sem bibliotecas. O playhead anda no evento de scroll nativo, marcado como
   passive — o navegador não precisa esperar este código para rolar.

   Estilo: css/10-regua.css  ·  A forma de onda: js/60-onda.js
   ========================================================================== */
(function () {
  "use strict";

  /* AS SEÇÕES — nome e timecode num lugar só.
     Mexeu aqui, mexeu na régua. A ordem tem de bater com a de
     src/html/index.html, e os timecodes com os do menu de celular
     (src/html/parciais/navbar.html) e os dos cabeçalhos de clipe. */
  var CLIPES = [
    { id: "topo",       nome: "Cold open",  tc: 0   },
    { id: "servicos",   nome: "Serviços",   tc: 18  },
    { id: "projetos",   nome: "Projetos",   tc: 42  },
    { id: "video",      nome: "Vídeo",      tc: 66  },
    { id: "sobre",      nome: "Sobre",      tc: 88  },
    { id: "ia",         nome: "IA",         tc: 108 },
    { id: "trajetoria", nome: "Trajetória", tc: 124 },
    { id: "contato",    nome: "Contato",    tc: 142 }
  ];
  var DUR_TOTAL = 156;   /* segundos "de sequência" — existe só para o timecode */

  var quieto = false;
  try { quieto = window.matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) {}

  /* timecode no formato HH:MM:SS:FF, a 24 quadros */
  function timecode(seg) {
    var t = Math.max(0, seg);
    var h = Math.floor(t / 3600);
    var m = Math.floor((t % 3600) / 60);
    var s = Math.floor(t % 60);
    var f = Math.floor((t - Math.floor(t)) * 24);
    function d2(n) { return (n < 10 ? "0" : "") + n; }
    return d2(h) + ":" + d2(m) + ":" + d2(s) + ":" + d2(f);
  }

  /* ---- navegação (vale para toda âncora da página) ---------------------- */
  function irPara(alvo) {
    var barra = document.getElementById("barra");
    var desloca = barra ? barra.offsetHeight : 0;
    var y = alvo.getBoundingClientRect().top + window.scrollY - desloca;
    try { window.scrollTo({ top: y, behavior: quieto ? "auto" : "smooth" }); }
    catch (e) { window.scrollTo(0, y); }
  }

  document.addEventListener("click", function (e) {
    var a = e.target.closest ? e.target.closest('a[href^="#"]') : null;
    if (!a) return;
    var id = a.getAttribute("href").slice(1);
    if (!id) return;
    var alvo = document.getElementById(id);
    if (!alvo) return;
    e.preventDefault();
    irPara(alvo);
    /* o foco tem de acompanhar o scroll, senão o teclado continua lá atrás */
    alvo.setAttribute("tabindex", "-1");
    alvo.focus({ preventScroll: true });
  });

  /* ---- a régua ---------------------------------------------------------- */
  var v1 = document.getElementById("v1");
  var playhead = document.getElementById("playhead");
  var tcAgora = document.getElementById("tc-agora");
  var tcTotal = document.getElementById("tc-total");
  if (!v1 || !playhead) return;

  var secoes = [];
  for (var i = 0; i < CLIPES.length; i++) {
    var el = document.getElementById(CLIPES[i].id);
    if (el) secoes.push({ dados: CLIPES[i], el: el });
  }
  if (!secoes.length) return;

  var blocos = [];

  /* A largura de cada bloco é a fatia REAL que a seção ocupa na página, não
     uma divisão igual: assim a régua é um mapa honesto de onde você está. */
  function montar() {
    v1.innerHTML = "";
    blocos = [];
    var doc = Math.max(1, document.documentElement.scrollHeight);
    for (var i = 0; i < secoes.length; i++) {
      var prox = secoes[i + 1];
      var topo = secoes[i].el.offsetTop;
      var fim = prox ? prox.el.offsetTop : doc;
      var b = document.createElement("button");
      b.type = "button";
      b.className = "bloco";
      b.style.flexGrow = String(Math.max(1, fim - topo));
      b.style.flexBasis = "0";
      b.textContent = secoes[i].dados.nome;
      b.setAttribute("aria-label", "Ir para " + secoes[i].dados.nome);
      b.dataset.alvo = secoes[i].dados.id;
      v1.appendChild(b);
      blocos.push(b);
    }
  }

  v1.addEventListener("click", function (e) {
    var b = e.target.closest ? e.target.closest(".bloco") : null;
    if (!b) return;
    var alvo = document.getElementById(b.dataset.alvo);
    if (alvo) irPara(alvo);
  });

  var atual = -1;

  function progresso(p) {
    p = Math.max(0, Math.min(1, p));
    /* mede a faixa V1, não a pista: a pista inclui a canaleta dos rótulos
       V1/A1, e o playhead já nasce depois dela */
    var largura = v1.getBoundingClientRect().width;
    playhead.style.transform = "translateX(" + (p * largura) + "px)";
    if (tcAgora) tcAgora.textContent = timecode(p * DUR_TOTAL);

    /* qual clipe está sob o playhead — o ponto de leitura é a 35% da altura
       da janela, não o topo: é mais ou menos onde o olho está */
    var meio = window.scrollY + window.innerHeight * .35;
    var idx = 0;
    for (var i = 0; i < secoes.length; i++) if (secoes[i].el.offsetTop <= meio) idx = i;
    if (idx === atual) return;

    atual = idx;
    for (var j = 0; j < blocos.length; j++) {
      if (j === idx) blocos[j].setAttribute("aria-current", "true");
      else blocos[j].removeAttribute("aria-current");
    }
    var links = document.querySelectorAll(".links a");
    for (var k = 0; k < links.length; k++) {
      if (links[k].getAttribute("href") === "#" + secoes[idx].dados.id) links[k].setAttribute("aria-current", "true");
      else links[k].removeAttribute("aria-current");
    }
  }

  function medir() {
    var total = document.documentElement.scrollHeight - window.innerHeight;
    progresso(total <= 0 ? 0 : window.scrollY / total);
  }

  montar();
  if (tcTotal) tcTotal.textContent = "de " + timecode(DUR_TOTAL);
  medir();

  window.addEventListener("scroll", medir, { passive: true });

  var relogio = null;
  window.addEventListener("resize", function () {
    if (relogio) clearTimeout(relogio);
    relogio = setTimeout(function () { montar(); atual = -1; medir(); }, 180);
  });

  /* as medidas só param de mudar depois que fonte e imagem assentam */
  window.addEventListener("load", function () { montar(); atual = -1; medir(); });
})();
