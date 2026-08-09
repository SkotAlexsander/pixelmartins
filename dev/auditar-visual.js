/**
 * auditar-visual.js — mede o que costuma passar despercebido no olho.
 *
 * Não substitui olhar a página. Pega o que o olho perdoa e o usuário não:
 *
 *   1. CONTRASTE — texto pequeno com pouco contraste parece "discreto" para
 *      quem desenhou e some para quem tem 45 anos ou está no sol. Mede cada
 *      cor contra o fundo REAL (subindo a árvore até achar quem pinta).
 *   2. ALVO DE TOQUE — botão de 34px erra o dedo. O mínimo das diretrizes
 *      (WCAG 2.5.5, Apple, Google) é 44px; aqui o corte é 40.
 *   3. COMPRIMENTO DE LINHA — acima de ~80 caracteres o olho perde o começo
 *      da linha seguinte. É o defeito de leitura mais comum em tela larga.
 *
 * Cuidados que este script já aprendeu:
 *   · o fundo tem de ser resolvido subindo a árvore — parar no primeiro
 *     elemento e assumir preto reprova um site correto (aconteceu);
 *   · .sr-only É cortado de propósito, e a fita e a atmosfera SÃO mais largas
 *     que a tela de propósito (moram dentro de overflow:hidden) — nada disso
 *     conta como defeito;
 *   · o cold open é desfeito antes de medir, senão metade da página ainda
 *     não entrou.
 *
 * USO:  node dev/auditar-visual.js [url]   (ou `npm run auditar`)
 * EXIT: 0 = passou · 1 = tem achado
 */
const { chromium } = require("./playwright");

const PORTA = process.env.PORTA || "8099";
const URL = process.argv[2] || ("http://127.0.0.1:" + PORTA + "/preview.html");

const falhas = [];
function ok(cond, msg) {
  console.log(`   ${cond ? "✓" : "✗"} ${msg}`);
  if (!cond) falhas.push(msg);
}

/* Roda no navegador. Fica numa string só para não depender de bundler. */
const MEDIR_CONTRASTE = `(function () {
  function lin(v) { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }
  function comps(c) {
    var m = String(c).match(/[0-9.]+/g);
    return m && m.length >= 3 ? [ +m[0], +m[1], +m[2] ] : null;
  }
  function lum(c) {
    var m = comps(c); if (!m) return null;
    return 0.2126 * lin(m[0]) + 0.7152 * lin(m[1]) + 0.0722 * lin(m[2]);
  }
  function ct(a, b) {
    var x = lum(a), y = lum(b);
    if (x === null || y === null) return null;
    var hi = Math.max(x, y), lo = Math.min(x, y);
    return (hi + 0.05) / (lo + 0.05);
  }
  /* O fundo real: sobe a árvore até achar quem de fato pinta. Parar antes e
     assumir preto foi o que fez uma auditoria anterior reprovar cores boas. */
  function fundoDe(el) {
    var no = el;
    while (no && no.nodeType === 1) {
      var bg = getComputedStyle(no).backgroundColor;
      if (bg && bg !== "rgba(0, 0, 0, 0)" && bg !== "transparent") return bg;
      no = no.parentElement;
    }
    return getComputedStyle(document.body).backgroundColor || "rgb(255, 255, 255)";
  }
  var alvos = [".hero-sub", ".abre p", ".clipe p", ".bio-texto", ".servico li",
               ".clipe-cabeca .nome", ".regua-tc .total", ".hero-meta span", ".rodape-int",
               ".ficha-linha dt", ".passo p", ".clipe .pilha", ".faixa-rot", ".resultado",
               ".tag", ".log-item p", ".monitor-pe"];
  var saida = [];
  for (var i = 0; i < alvos.length; i++) {
    var el = document.querySelector(alvos[i]);
    if (!el) continue;
    var cs = getComputedStyle(el);
    var r = ct(cs.color, fundoDe(el));
    if (r === null) continue;
    var tam = parseFloat(cs.fontSize);
    var grande = tam >= 24 || (tam >= 18.66 && parseInt(cs.fontWeight, 10) >= 700);
    saida.push({ s: alvos[i], r: Math.round(r * 100) / 100, tam: tam, min: grande ? 3 : 4.5 });
  }
  return saida;
})()`;

const MEDIR_TOQUE = `(function () {
  var out = [];
  var todos = document.querySelectorAll("a, button");
  for (var i = 0; i < todos.length; i++) {
    var el = todos[i];
    /* o link de pular só existe no foco; o clipe da régua é alto quanto a faixa */
    if (el.classList.contains("skip-link") || el.classList.contains("bloco")) continue;
    var b = el.getBoundingClientRect();
    if (b.width === 0 || b.height === 0) continue;
    if (b.height < 40) {
      var nome = el.id ? "#" + el.id
        : el.tagName.toLowerCase() + "." + String(el.className || "").split(" ")[0];
      out.push(nome + " " + Math.round(b.width) + "x" + Math.round(b.height));
    }
  }
  return out.filter(function (v, i, a) { return a.indexOf(v) === i; });
})()`;

const MEDIR_MEDIDA = `(function () {
  /* A largura de caractere tem de ser MEDIDA na fonte real, não estimada.
     Estimar em 0.5em (o palpite comum) inflava a conta em ~25% na Inter e
     acusava 86ch onde havia 68 — alarme falso que quase virou "correção". */
  var lona = document.createElement("canvas").getContext("2d");
  function chDe(cs) {
    lona.font = cs.fontWeight + " " + cs.fontSize + " " + cs.fontFamily;
    var w = lona.measureText("0").width;
    return w > 0 ? w : parseFloat(cs.fontSize) * 0.5;
  }
  var out = [];
  var sel = ".abre p, .bio-texto, .destaque > div > p, .clipe p, .hero-sub, .resultado, .log-item p";
  var todos = document.querySelectorAll(sel);
  for (var i = 0; i < todos.length; i++) {
    var el = todos[i];
    var cs = getComputedStyle(el);
    var ch = Math.round(el.getBoundingClientRect().width / chDe(cs));
    if (ch > 80) out.push(String(el.className || el.tagName) + " " + ch + "ch");
  }
  return out;
})()`;

async function preparar(p) {
  await p.goto(URL, { waitUntil: "load" });
  /* sem isto, metade da página ainda está fora de cena quando se mede */
  await p.evaluate(`document.documentElement.classList.remove("cold-open")`);
  await p.waitForTimeout(1100);
  await p.evaluate(`document.querySelectorAll("[data-anim]").forEach(function (e) { e.classList.add("dentro"); })`);
  await p.waitForTimeout(300);
}

(async () => {
  const b = await chromium.launch();

  for (const claro of [false, true]) {
    console.log(`\n== contraste — tema ${claro ? "claro" : "escuro"} (AA: 4.5 normal, 3 grande) ==`);
    const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
    await p.goto(URL, { waitUntil: "load" });
    if (claro) await p.evaluate(`document.documentElement.classList.add("light")`);
    await p.evaluate(`document.documentElement.classList.remove("cold-open")`);
    await p.waitForTimeout(1000);
    const r = await p.evaluate(MEDIR_CONTRASTE);
    for (const x of r) ok(x.r >= x.min, `${x.s.padEnd(24)} ${x.r.toFixed(2)}  (${x.tam}px, mínimo ${x.min})`);
    await p.close();
  }

  console.log("\n== alvo de toque (mínimo 40px de altura) ==");
  for (const w of [390, 768, 1440]) {
    const p = await b.newPage({ viewport: { width: w, height: 900 } });
    await preparar(p);
    const pequenos = await p.evaluate(MEDIR_TOQUE);
    ok(pequenos.length === 0, `${w}px: ${pequenos.length ? pequenos.slice(0, 5).join(", ") : "nenhum abaixo de 40px"}`);
    await p.close();
  }

  console.log("\n== comprimento de linha (acima de 80 caracteres cansa) ==");
  for (const w of [768, 1280, 1920]) {
    const p = await b.newPage({ viewport: { width: w, height: 900 } });
    await preparar(p);
    const longos = await p.evaluate(MEDIR_MEDIDA);
    ok(longos.length === 0, `${w}px: ${longos.length ? longos.join(", ") : "nenhuma linha acima de 80ch"}`);
    await p.close();
  }

  await b.close();
  console.log(`\n${falhas.length ? "ACHADOS (" + falhas.length + "):\n  · " + falhas.join("\n  · ") : "PASSOU"}`);
  process.exit(falhas.length ? 1 : 0);
})();
