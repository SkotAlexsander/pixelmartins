/**
 * verificar-movimento.js — o movimento tem física, ou é só uma curva?
 *
 * A diferença entre uma mola e um easing não é gosto: a mola PASSA DO ALVO e
 * volta. É o overshoot que faz o elemento parecer ter massa, e é a única coisa
 * aqui que uma curva de CSS não consegue imitar sem ser escrita à mão.
 *
 * Este arquivo também guarda a decisão sobre a biblioteca Motion, medida em
 * 17/08/2026 (baixada em quarentena e passada pelo scanner do projeto, 0
 * achados):
 *
 *     motion@11 completo ......... 64 KB cru ·  23 KB comprimido
 *     @motionone/dom ............. 18 KB cru ·   7 KB comprimido
 *     este site inteiro .......... 98 KB cru ·  28 KB comprimido
 *     a mola escrita à mão ....... ~2 KB cru · ~0,8 KB comprimido
 *
 * A biblioteca somaria 82% ao peso do site para entregar o que 40 linhas
 * entregam, porque ela não inventa motor: é uma casca sobre a Web Animations
 * API. Se um dia entrar layout animation (o card que vira página), a conta
 * muda — aquilo é caro à mão e é onde ela ganha.
 *
 * Uso: PLAYWRIGHT_DIR="…/node_modules/playwright" node design/v11-resolucao/verificar-movimento.js
 */
const path = require("path");
const { chromium } = require(process.env.PLAYWRIGHT_DIR || "playwright");

const U = "file:///" + path.join(__dirname, "index.html").replace(/\\/g, "/");
let mau = 0;
const ok = (b, m) => { console.log(`   ${b ? "✓" : "✗"} ${m}`); if (!b) mau++; };

(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  const erros = [];
  p.on("pageerror", e => erros.push(e.message));
  await p.goto(U, { waitUntil: "networkidle" });
  await p.waitForTimeout(2200);

  console.log("\n== a mola tem física, não curva ==");
  const s = await p.evaluate(() => {
    const el = document.createElement("div");
    document.body.appendChild(el);
    window.pmMola.entrar(el, 0, 20);
    const a = el.getAnimations()[0];
    const kf = a.effect.getKeyframes();
    /* O NAVEGADOR NORMALIZA o transform ao guardar: escrevo
       "translate3d(0,20px,0)" e o getKeyframes devolve
       "translate3d(0px, 20px, 0px)". Um regex exigindo a minha grafia nunca
       casa — e o teste passa a reprovar uma mola que funciona, dizendo
       "mínimo Infinity". Ler de volta o que se escreveu não basta: tem de ler
       no formato em que a plataforma guarda. */
    const ys = kf
      .map(k => {
        const m = /translate3d\(\s*0(?:px)?\s*,\s*(-?[\d.]+)px/.exec(k.transform || "");
        return m ? parseFloat(m[1]) : null;
      })
      .filter(v => v !== null);
    el.remove();
    return {
      quadros: kf.length,
      dur: Math.round(a.effect.getTiming().duration),
      menor: ys.length ? Math.min(...ys) : NaN,
      comeco: ys[0],
      motor: document.documentElement.classList.contains("mola")
    };
  });
  ok(s.motor, "o <html> declara que a mola está dirigindo");
  ok(s.quadros > 20, `a mola gera keyframes de simulação (${s.quadros})`);
  ok(s.comeco > 15, `parte do deslocamento pedido (${s.comeco.toFixed(1)}px)`);
  ok(s.menor < -1,
     `e PASSA do alvo antes de assentar (chega a ${s.menor.toFixed(2)}px de 20) — o overshoot que dá massa`);
  ok(s.dur > 300 && s.dur < 900, `assenta em tempo de interface (${s.dur}ms)`);

  console.log("\n== transição de página: em sequência, não em bloco ==");
  await p.click('.nav a[href="#/trabalho"]');
  await p.waitForTimeout(80);
  const seq = await p.evaluate(() => {
    /* :scope refere-se ao elemento em que se CHAMA o querySelectorAll. Chamar
       no document fazia :scope ser o document, e o seletor nunca casava — o
       teste dizia "nada escalonado" sobre uma página que escalona certo. */
    const nova = document.querySelector(".pagina.ativa");
    return [...nova.querySelectorAll("*")]
      .filter(e => e.getAnimations().length)
      .slice(0, 4)
      .map(e => Math.round(e.getAnimations()[0].effect.getTiming().delay || 0));
  });
  ok(seq.length > 1 && new Set(seq).size > 1,
     `os blocos entram escalonados (atrasos ${seq.join(", ")}ms)`);

  console.log("\n== um motor de cada vez ==");
  const motores = await p.evaluate(() => {
    const el = document.querySelector(".sobe");
    return { transicao: getComputedStyle(el).transitionDuration, mola: document.documentElement.classList.contains("mola") };
  });
  ok(motores.mola && /^0s(, 0s)*$/.test(motores.transicao),
     `com a mola no comando, a transição CSS está desligada (${motores.transicao})`);

  console.log("\n== com movimento reduzido, a mola se cala ==");
  await p.close();
  const c = await b.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" });
  const q = await c.newPage();
  await q.goto(U, { waitUntil: "networkidle" });
  await q.waitForTimeout(1800);
  const r = await q.evaluate(() => ({
    motor: document.documentElement.classList.contains("mola"),
    animando: document.getAnimations().filter(a => a.playState === "running").length,
    visivel: getComputedStyle(document.querySelector(".lead")).opacity
  }));
  ok(!r.motor, "o <html> NÃO declara mola");
  ok(r.visivel === "1", `e nada fica invisível esperando (opacidade ${r.visivel})`);
  await c.close();

  ok(erros.length === 0, `sem erro de JS (${erros.length ? erros.join(" | ") : "nenhum"})`);
  await b.close();
  console.log(mau ? `\nREPROVOU (${mau})` : "\nPASSOU");
  process.exit(mau ? 1 : 0);
})();
