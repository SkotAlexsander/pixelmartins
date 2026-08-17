/**
 * verificar-fragmento.js — o fragmento do Elementor convive com o tema?
 *
 * Rode DEPOIS de empacotar.js. Ele abre preview-wp.html, que é o fragmento
 * dentro de um "tema do WordPress" agressivo de propósito (Georgia, links
 * vermelhos, margens próprias, listas com marcador), e cobra as duas direções:
 *
 *   o tema não pode estragar o widget   ·   o widget não pode estragar o tema
 *
 * A segunda é a que ninguém testa e a que quebra site de cliente: um
 * `a{color:inherit}` colado sem prefixo apaga a cor de todos os links do
 * WordPress, e o dono só descobre dias depois, noutra página.
 *
 * Uso: PLAYWRIGHT_DIR="…/node_modules/playwright" node design/v11-resolucao/verificar-fragmento.js
 * Exit: 0 passou · 1 reprovou
 */
const path = require("path");
const fs = require("fs");
const { chromium } = require(process.env.PLAYWRIGHT_DIR || "playwright");

const ARQ = path.join(__dirname, "preview-wp.html");
if (!fs.existsSync(ARQ)) {
  console.error("preview-wp.html não existe. Rode antes:  node design/v11-resolucao/empacotar.js");
  process.exit(1);
}
const U = "file:///" + ARQ.replace(/\\/g, "/");

const falhas = [];
const ok = (b, m) => { console.log(`   ${b ? "✓" : "✗"} ${m}`); if (!b) falhas.push(m); };

(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  const erros = [];
  p.on("console", m => m.type() === "error" && erros.push(m.text()));
  p.on("pageerror", e => erros.push("pageerror: " + e.message));
  await p.goto(U, { waitUntil: "networkidle" });
  await p.waitForTimeout(2600);

  console.log("\n== o tema não estraga o widget ==");
  const a = await p.evaluate(() => {
    const g = s => getComputedStyle(document.querySelector(s));
    /* A fonte é lida do TOKEN, não por nome. A primeira versão deste teste
       procurava "Bricolage" literal e reprovou o site no dia em que a fonte
       mudou — acusando de defeito uma troca que era o pedido. Teste que
       depende de uma escolha estética envelhece junto com ela. */
    const tokenDisplay = getComputedStyle(document.documentElement)
      .getPropertyValue("--display").split(",")[0].trim().replace(/["']/g, "");
    const doTitulo = g(".hero-titulo .d1").fontFamily.split(",")[0].trim().replace(/["']/g, "");
    return {
      existe: !!document.getElementById("pm"),
      fundoPM: g("#pm").backgroundColor,
      tokenDisplay, doTitulo,
      /* Só a PRIMEIRA família importa — é a que o navegador usa. E o teste
         olha a lista inteira à procura de "serif" jamais: a pilha de fallback
         termina em "sans-serif", e /serif/ casa dentro dela. A primeira versão
         reprovava a página por causa do próprio fallback correto. */
      caiuNoTema: /^(Georgia|Times|"?Times New Roman"?)$/i
        .test(g(".hero-titulo .d1").fontFamily.split(",")[0].trim().replace(/["']/g, "")),
      titPintado: document.documentElement.classList.contains("pintado"),
      margemP: g(".lead").marginTop,
      linkInterno: g(".item-links a").textDecorationLine,
      listaServ: g(".serv ul").listStyleType,
      barraPos: g(".barra").position,
      over: document.documentElement.scrollWidth - document.documentElement.clientWidth
    };
  });
  ok(a.existe, "o wrapper #pm existe");
  ok(a.fundoPM === "rgb(237, 237, 240)", `o fundo da sala está aplicado (${a.fundoPM})`);
  ok(a.doTitulo === a.tokenDisplay && !a.caiuNoTema,
     `o título usa a fonte do token --display, não a do tema (${a.doTitulo})`);
  ok(a.titPintado, "o título pintou no canvas");
  ok(a.margemP === "0px", `o reset de margem venceu o tema (.lead margin-top ${a.margemP})`);
  ok(a.linkInterno === "none", `os links de dentro não herdaram o sublinhado do tema (${a.linkInterno})`);
  ok(a.listaServ === "none", `as listas de dentro não herdaram o marcador do tema (${a.listaServ})`);
  ok(a.barraPos === "sticky", `a barra continua sticky dentro do widget (${a.barraPos})`);
  ok(a.over === 0, `sem rolagem lateral (${a.over}px)`);

  console.log("\n== o widget não estraga o tema ==");
  const t = await p.evaluate(() => {
    const fora = document.createElement("div");
    fora.innerHTML = '<p id="teste-fora">texto do tema <a href="#" id="link-fora">um link</a></p>';
    document.body.appendChild(fora);
    const cs = getComputedStyle(document.getElementById("link-fora"));
    const cp = getComputedStyle(document.getElementById("teste-fora"));
    return {
      corLink: cs.color, sublinhado: cs.textDecorationLine,
      margemP: cp.marginTop, fonte: cp.fontFamily.split(",")[0],
      topo: getComputedStyle(document.querySelector(".tema-topo")).backgroundColor
    };
  });
  ok(t.corLink === "rgb(204, 0, 0)", `link DE FORA continua vermelho (${t.corLink})`);
  ok(t.sublinhado === "underline", `link DE FORA continua sublinhado (${t.sublinhado})`);
  ok(t.margemP !== "0px", `parágrafo DE FORA manteve a margem do tema (${t.margemP})`);
  ok(/Georgia/.test(t.fonte), `texto DE FORA continua na fonte do tema (${t.fonte})`);

  console.log("\n== o tema escuro dentro do widget ==");
  await p.click("#tema-btn"); await p.waitForTimeout(800);
  const n = await p.evaluate(() => ({
    pm: getComputedStyle(document.getElementById("pm")).backgroundColor,
    trab: getComputedStyle(document.getElementById("trabalho")).backgroundColor,
    fora: getComputedStyle(document.querySelector(".tema-topo")).backgroundColor,
    atmosfera: getComputedStyle(document.getElementById("atmosfera")).opacity
  }));
  ok(n.pm === "rgb(12, 13, 16)", `o widget escureceu (${n.pm})`);
  /* A regra do sistema, e ela é medível: o bloco de trabalho continua sendo a
     superfície destacada porque agora é MAIS CLARO que o fundo. Se um dia
     alguém "simplificar" o tema escuro invertendo tudo, este número denuncia. */
  const claroDoTrab = n.trab.match(/\d+/g).reduce((s, v) => s + +v, 0);
  const claroDoPM = n.pm.match(/\d+/g).reduce((s, v) => s + +v, 0);
  ok(claroDoTrab > claroDoPM, `o bloco de trabalho segue destacado — agora mais claro que o fundo (${n.trab} × ${n.pm})`);
  ok(n.fora === "rgb(34, 34, 34)", `o tema do WordPress NÃO foi afetado (${n.fora})`);
  ok(n.atmosfera === "1", `a atmosfera acendeu junto (opacidade ${n.atmosfera})`);

  ok(erros.length === 0, `sem erro de console (${erros.length ? erros.join(" | ") : "nenhum"})`);

  await b.close();
  console.log(`\n${falhas.length ? "REPROVOU (" + falhas.length + "):\n  · " + falhas.join("\n  · ") : "PASSOU — o fragmento e o tema não se atropelam"}`);
  process.exit(falhas.length ? 1 : 0);
})();
