/**
 * verificar-rotas.js — a navegação entre páginas funciona como navegação?
 *
 * Não basta "o conteúdo troca". Um menu que esconde divs também troca. O que
 * separa isso de navegação de verdade são cinco coisas, e cada uma quebra de
 * um jeito que o autor não vê porque ele nunca usa o próprio site como
 * visitante: o endereço muda, o botão de voltar funciona, o link direto abre a
 * página certa, o foco vai para o conteúdo novo, e um hash inventado não
 * deixa a tela em branco.
 *
 * Uso: PLAYWRIGHT_DIR="…/node_modules/playwright" node design/v11-resolucao/verificar-rotas.js
 * Exit: 0 passou · 1 reprovou
 */
const path = require("path");
const { chromium } = require(process.env.PLAYWRIGHT_DIR || "playwright");

const U = "file:///" + path.join(__dirname, "index.html").replace(/\\/g, "/");
const falhas = [];
const ok = (b, m) => { console.log(`   ${b ? "✓" : "✗"} ${m}`); if (!b) falhas.push(m); };

const ROTAS = [
  ["/trabalho", "Tudo aqui roda"],
  ["/servicos", "Três frentes"],
  ["/sobre",    "Uma pessoa, do briefing"],
  ["/contato",  "Me conta o que"]
];

(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  const erros = [];
  p.on("console", m => m.type() === "error" && erros.push(m.text()));
  p.on("pageerror", e => erros.push("pageerror: " + e.message));

  await p.goto(U, { waitUntil: "networkidle" });
  await p.waitForTimeout(2400);

  /* A HOME MOSTRA TODAS AS SEÇÕES, e isso mudou em 17/08 a pedido dele.
     A expectativa anterior — "só uma página aberta" — passou a estar errada,
     e é bom que este teste tenha reprovado quando a regra mudou: teste que
     não reclama de uma mudança de comportamento não estava medindo nada. */
  console.log("\n== a home mostra tudo ==");
  const s = await p.evaluate(() => ({
    ativa: document.querySelector(".pagina.ativa").dataset.rota,
    abertas: document.querySelectorAll(".pagina.ativa").length,
    total: document.querySelectorAll(".pagina").length,
    classe: document.documentElement.classList.contains("home"),
    voltar: [...document.querySelectorAll(".volta")].filter(e => e.offsetParent !== null).length
  }));
  ok(s.abertas === s.total, `as ${s.total} seções aparecem em sequência (${s.abertas} abertas)`);
  ok(s.classe, "o <html> ganhou a classe .home");
  ok(s.voltar === 0, `nenhum botão "Voltar ao início" visível na própria home (${s.voltar})`);

  console.log("\n== cada rota ==");
  for (const [rota, marca] of ROTAS) {
    await p.click(`.indice a[href="#${rota}"], .nav a[href="#${rota}"]`);
    await p.waitForTimeout(700);

    const r = await p.evaluate((m) => {
      const a = document.querySelector(".pagina.ativa");
      const vis = [...document.querySelectorAll(".pagina")].filter(e => getComputedStyle(e).display !== "none");
      /* A REVELAÇÃO SÓ VALE PARA O QUE ESTÁ NA TELA. A primeira versão deste
         teste exigia que TODOS os blocos da página estivessem revelados logo
         após a troca, e reprovava um comportamento correto: bloco abaixo da
         dobra deve mesmo estar esperando. O que interessa é que nada fique
         invisível DENTRO da primeira tela — esse sim seria o defeito de o
         observador não ter sido refeito na troca de página. */
      const naTela = [...a.querySelectorAll(".sobe")].filter(e => {
        const c = e.getBoundingClientRect();
        return c.top < window.innerHeight && c.bottom > 0;
      });
      return {
        rota: a.dataset.rota, hash: location.hash, titulo: document.title,
        tem: a.textContent.includes(m), visiveis: vis.length,
        scroll: Math.round(window.scrollY),
        voltar: [...a.querySelectorAll(".volta")].filter(e => e.offsetParent !== null).length,
        foco: (document.activeElement.tagName || ""),
        naTela: naTela.length,
        esperando: naTela.filter(e => !e.classList.contains("dentro")).length
      };
    }, marca);

    ok(r.rota === rota && r.hash === "#" + rota, `${rota}  hash e página batem (${r.hash})`);
    ok(r.visiveis === 1, `  só uma página visível (${r.visiveis})`);
    ok(r.voltar >= 1, `  tem o caminho de volta para o início (${r.voltar})`);
    ok(r.tem, `  o conteúdo esperado está lá ("${marca}")`);
    ok(r.scroll === 0, `  voltou ao topo (scrollY ${r.scroll})`);
    ok(/H1|H2/.test(r.foco), `  o foco foi para o título (${r.foco})`);
    ok(r.esperando === 0, `  nada invisível na primeira tela (${r.naTela - r.esperando}/${r.naTela})`);

    /* e o resto revela ao rolar, que é o trabalho do observador refeito */
    await p.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await p.waitForTimeout(900);
    const fim = await p.evaluate(() => {
      const a = document.querySelector(".pagina.ativa");
      return { total: a.querySelectorAll(".sobe").length,
               falta: a.querySelectorAll(".sobe:not(.dentro)").length };
    });
    ok(fim.falta === 0, `  e o resto revelou ao rolar (${fim.total - fim.falta}/${fim.total})`);
    await p.evaluate(() => window.scrollTo(0, 0));
  }

  console.log("\n== o botão voltar do navegador ==");
  await p.goBack(); await p.waitForTimeout(600);
  const v = await p.evaluate(() => document.querySelector(".pagina.ativa").dataset.rota);
  ok(v === "/sobre", `voltar leva para a página anterior (${v})`);

  console.log("\n== link direto ==");
  await p.goto(U + "#/trabalho", { waitUntil: "networkidle" }); await p.waitForTimeout(1800);
  const d = await p.evaluate(() => ({
    r: document.querySelector(".pagina.ativa").dataset.rota, t: document.title
  }));
  ok(d.r === "/trabalho", `abrir o link direto cai na página certa (${d.r})`);
  ok(/Trabalho/.test(d.t), `e o título da aba acompanha ("${d.t}")`);

  console.log("\n== hash inventado ==");
  await p.goto(U + "#/naoexiste", { waitUntil: "networkidle" }); await p.waitForTimeout(1500);
  const x = await p.evaluate(() => document.querySelector(".pagina.ativa").dataset.rota);
  ok(x === "/", `cai no início em vez de tela branca (${x})`);

  console.log("\n== o retrato acorda ao abrir Sobre, sem rolar ==");
  await p.goto(U, { waitUntil: "networkidle" }); await p.waitForTimeout(2000);
  await p.click('.nav a[href="#/sobre"]'); await p.waitForTimeout(7000);
  const rt = await p.evaluate(() => document.getElementById("retrato-tarja").textContent.trim());
  ok(/quadros/.test(rt), `o retrato carregou sem precisar rolar ("${rt}")`);

  console.log("\n== sem JavaScript: tudo visível, nada some ==");
  const ctx = await b.newContext({ javaScriptEnabled: false, viewport: { width: 1440, height: 900 } });
  const q = await ctx.newPage();
  await q.goto(U, { waitUntil: "load" }); await q.waitForTimeout(800);
  const semJs = await q.evaluate(() => {
    const vis = [...document.querySelectorAll(".pagina")].filter(e => getComputedStyle(e).display !== "none");
    return { visiveis: vis.length, total: document.querySelectorAll(".pagina").length,
             texto: document.body.innerText.length };
  });
  ok(semJs.visiveis === semJs.total,
     `as ${semJs.total} páginas aparecem em sequência (${semJs.visiveis} visíveis)`);
  ok(semJs.texto > 4000, `e o texto todo está lá (${semJs.texto} caracteres)`);
  await ctx.close();

  /* Mesmo ruído declarado do auditar.js: a logo vem do pixelmartins.com, que
     em 17/08/2026 estava fora do ar. A página trata com o monograma de mesma
     largura. Continua IMPRESSO — o dia em que sobrar outro erro, reprova. */
  const RUIDO = /wp-content\/uploads|ERR_CONNECTION_REFUSED|ERR_NAME_NOT_RESOLVED/;
  const conhecidos = erros.filter(e => RUIDO.test(e));
  const reais = erros.filter(e => !RUIDO.test(e));
  if (conhecidos.length) {
    console.log(`   · ruído conhecido (logo do WordPress, site fora do ar): ${conhecidos.length}`);
  }
  ok(reais.length === 0, `sem erro de console ${reais.length ? "(" + reais.join(" | ") + ")" : "(nenhum além do ruído declarado)"}`);
  await b.close();
  console.log(`\n${falhas.length ? "REPROVOU (" + falhas.length + "):\n  · " + falhas.join("\n  · ") : "PASSOU"}`);
  process.exit(falhas.length ? 1 : 0);
})();
