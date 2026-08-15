/**
 * verificar-pagina.js — a bateria da página inteira, num navegador real.
 *
 * O `verificar-animacao.js` cuida só do retrato. Este cuida do resto, e cobra
 * as promessas que o projeto fez por escrito:
 *
 *   1. Nada de fora é essencial — com toda requisição externa bloqueada
 *      (fontes do Google inclusive), a página fica inteira, revela tudo e
 *      navega. É a razão pela qual não há biblioteca de terceiro aqui.
 *   2. JavaScript pode faltar — todo o conteúdo continua no documento.
 *   3. Teclado — foco visível, ordem sã, Enter navega.
 *   4. Menos movimento — nada fica escondido esperando animação.
 *   5. Nada vaza — zero rolagem lateral em 5 larguras.
 *   6. Um ícone por botão — regressão de especificidade que já aconteceu:
 *      "#pm-site svg { display: block }" tem ID e vence ".i-lua { display:
 *      none }", que só tem classe.
 *
 * USO:  node dev/verificar-pagina.js [url]   (ou `npm run verificar:pagina`)
 * EXIT: 0 = passou · 1 = reprovou
 */
const path = require("path");
const { chromium } = require("./playwright");

const PORTA = process.env.PORTA || "8099";
const URL = process.argv[2] || ("http://127.0.0.1:" + PORTA + "/preview.html");
const SAIDA = path.resolve(__dirname, "capturas");

const falhas = [];
function ok(cond, msg) {
  console.log(`   ${cond ? "✓" : "✗"} ${msg}`);
  if (!cond) falhas.push(msg);
}
/* erro de rede que EU provoquei ao bloquear o externo não conta como defeito */
const ruido = t => /ERR_FAILED|ERR_BLOCKED|net::ERR/.test(t);
const externo = /^https?:\/\/(?!127\.0\.0\.|localhost)/;

async function novaAba(b, cfg) {
  const ctx = await b.newContext({
    viewport: cfg.vp || { width: 1440, height: 900 },
    reducedMotion: cfg.reduced ? "reduce" : "no-preference",
    javaScriptEnabled: cfg.js !== false,
  });
  const p = await ctx.newPage();
  const erros = [];
  p.on("pageerror", e => erros.push("pageerror: " + e.message));
  p.on("console", m => { if (m.type() === "error" && !ruido(m.text())) erros.push(m.text()); });
  if (cfg.semRede) await p.route(externo, r => r.abort());
  return { ctx, p, erros };
}

async function rolarTudo(p) {
  const alt = await p.evaluate(`document.documentElement.scrollHeight`);
  for (let y = 0; y < alt; y += 700) {
    await p.evaluate(`window.scrollTo(0, ${y})`);
    await p.waitForTimeout(200);
  }
  await p.waitForTimeout(1000);
}

(async () => {
  require("fs").mkdirSync(SAIDA, { recursive: true });
  const b = await chromium.launch();

  /* ---------- 1 e 4. a página completa, em quatro condições ---------- */
  for (const cenario of [
    { nome: "normal", cfg: {} },
    { nome: "SEM rede externa (fontes bloqueadas)", cfg: { semRede: true } },
    { nome: "menos movimento", cfg: { reduced: true } },
    { nome: "celular 390", cfg: { vp: { width: 390, height: 844 } } },
  ]) {
    console.log(`\n== ${cenario.nome} ==`);
    const { ctx, p, erros } = await novaAba(b, cenario.cfg);
    await p.goto(URL, { waitUntil: "load" });
    /* O cold open segura a barra e a régua fora de cena por ~2,5s enquanto a
       frase é digitada. Medir no meio disso acusa a régua "68px abaixo da
       janela", que é o estado correto naquele instante — e um falso alarme
       aqui. Quem testa o cold open em si é o bloco próprio, mais abaixo. */
    await p.evaluate(`document.documentElement.classList.remove("cold-open")`);
    await p.waitForTimeout(1600);

    const antes = await p.evaluate(`({
      blocos: document.querySelectorAll("#v1 .bloco").length,
      /* A régua, o menu de celular e a lista CLIPES do 70-regua.js dizem a
         MESMA coisa em três lugares — e o comentário de cada um manda mexer
         nos outros. Comparar com um número fixo aqui só provava que ninguém
         tinha mexido; a seção de Vídeo, em 15/08, reprovou este teste sendo
         uma adição correta. O que interessa é a CONSISTÊNCIA entre os três,
         não a quantidade: a régua tem os do menu mais o cold open, que é o
         topo da página e por isso não aparece na navegação. */
      menu: document.querySelectorAll('#menu a[href^="#"]').length,
      alvosOrfaos: [].slice.call(document.querySelectorAll("#v1 .bloco"))
        .filter(function (bl) { return !document.getElementById(bl.dataset.alvo); })
        .map(function (bl) { return bl.dataset.alvo; }),
      tc: document.getElementById("tc-agora").textContent,
      externas: performance.getEntriesByType("resource")
        .filter(function (r) { return !/127\\.0\\.0\\.|localhost/.test(r.name); })
        .filter(function (r) { return r.transferSize > 0; }).length,
      /* A régua já descolou do rodapé uma vez, por especificidade de seletor:
         um "#pm-site > *:not(#atmosfera)", que tem DOIS IDs, venceu o
         "position: fixed" dela, que tem um. Nada quebrava nos outros testes —
         os blocos continuavam no DOM e o playhead continuava andando. */
      reguaPos: getComputedStyle(document.getElementById("regua")).position,
      reguaBottom: Math.round(document.getElementById("regua").getBoundingClientRect().bottom),
      janela: window.innerHeight,
      reguaFixa: getComputedStyle(document.getElementById("regua")).position === "fixed"
        && Math.abs(document.getElementById("regua").getBoundingClientRect().bottom - window.innerHeight) < 2
    })`);

    await rolarTudo(p);

    const depois = await p.evaluate(`({
      escondidos: [].slice.call(document.querySelectorAll("[data-anim]")).filter(function (el) { return +getComputedStyle(el).opacity < .05; }).length,
      total: document.querySelectorAll("[data-anim]").length,
      tc: document.getElementById("tc-agora").textContent,
      ativo: (function () { var b = document.querySelector('#v1 .bloco[aria-current="true"]'); return b ? b.dataset.alvo : "(nenhum)"; })(),
      overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth
    })`);

    ok(antes.blocos === antes.menu + 1,
       `a régua tem um clipe por seção do menu, mais o cold open (${antes.blocos} × ${antes.menu}+1)`);
    ok(antes.alvosOrfaos.length === 0,
       `todo clipe da régua aponta para uma seção que existe (órfãos: ${antes.alvosOrfaos.join(", ") || "nenhum"})`);
    ok(antes.reguaFixa, `a régua está fixa no rodapé da janela (${antes.reguaPos}, bottom ${antes.reguaBottom} de ${antes.janela})`);
    ok(depois.escondidos === 0, `todo bloco revelou ao rolar (${depois.total - depois.escondidos}/${depois.total})`);
    ok(antes.tc !== depois.tc, `o timecode andou (${antes.tc} → ${depois.tc})`);
    ok(depois.ativo === "contato", `no fim, o clipe selecionado é o contato (${depois.ativo})`);
    ok(depois.overflow === 0, `sem rolagem lateral (${depois.overflow}px)`);
    ok(erros.length === 0, `sem erro de console (${erros.slice(0, 2).join(" | ") || "nenhum"})`);
    if (cenario.cfg.semRede) ok(antes.externas === 0, `nenhuma requisição externa carregou (${antes.externas})`);
    await ctx.close();
  }

  /* ---------- 2. sem JavaScript ---------- */
  console.log(`\n== sem JavaScript ==`);
  {
    const { ctx, p } = await novaAba(b, { js: false });
    await p.goto(URL, { waitUntil: "load" });
    await p.waitForTimeout(700);
    /* textContent e não innerText: innerText aplica text-transform e
       devolveria tudo em maiúsculas, reprovando um site que está correto */
    const txt = (await p.locator("#pm-site").textContent()).replace(/\s+/g, " ");
    /* O texto visível não pega href. Um link para o endereço morto continua
       parecendo certo na tela — o rótulo é "Abrir", não a URL. */
    const htmlCru = await p.locator("#pm-site").innerHTML();
    /* Os cinco projetos por nome: se um sair da seção sem querer, este teste
       é quem avisa. (Foi assim que a troca do Come-Come pelo Prato, em 10/08,
       apareceu aqui antes de ir para o ar — e é por isso que "Prato" saiu
       daqui em 15/08, quando o repositório foi renomeado para "corpo" e o
       endereço antigo virou 404.)

       "A outra metade" está na lista porque a seção de Vídeo é a única prova
       de METADE da promessa do hero. Ela sumir em silêncio é justamente o
       defeito que ninguém percebe olhando a página no desktop. */
    const precisa = ["Seu site e seu vídeo, feitos pela mesma pessoa.", "O que eu entrego",
                     "Explorador do Sistema Solar", "Vitrola", "Rotina", "Corpo", "Acervo",
                     "A outra metade", "Uma gravação de uma hora não vira um vídeo de uma hora.",
                     "Uma pessoa, as duas entregas", "Como cheguei aqui", "alexsandermmj@gmail.com"];
    /* Renome de repositório mata o Pages sem avisar (o GitHub redireciona o
       repo, não a página). Nome antigo no ar = link quebrado no portfólio. */
    const proibido = ["Prato", "central-pessoal", "pixelmartins-site", "/prato/"];
    const sobrando = proibido.filter(t => txt.includes(t) || htmlCru.includes(t));
    ok(sobrando.length === 0, `nenhum nome de repositório antigo sobrou (${sobrando.join(", ") || "nenhum"})`);
    const faltando = precisa.filter(t => !txt.includes(t));
    ok(faltando.length === 0, `todo o conteúdo está no documento (faltando: ${faltando.join(", ") || "nada"})`);

    const alturas = {};
    for (const s of ["servicos", "projetos", "video", "sobre", "ia", "trajetoria", "contato"]) {
      const bb = await p.locator("#" + s).boundingBox();
      alturas[s] = bb ? Math.round(bb.height) : 0;
    }
    ok(Object.values(alturas).every(h => h > 100), `toda seção tem altura real ${JSON.stringify(alturas)}`);

    const over = await p.evaluate(`document.documentElement.scrollWidth - document.documentElement.clientWidth`);
    ok(over === 0, `sem rolagem lateral (${over}px)`);
    await p.screenshot({ path: path.join(SAIDA, "v5-sem-js.png") });
    await ctx.close();
  }

  /* ---------- 3. teclado ---------- */
  console.log(`\n== teclado ==`);
  {
    const { ctx, p } = await novaAba(b, {});
    await p.goto(URL, { waitUntil: "load" });
    await p.waitForTimeout(1800);
    const foco = [];
    for (let i = 0; i < 8; i++) {
      await p.keyboard.press("Tab");
      foco.push(await p.evaluate(`(function () {
        var a = document.activeElement, s = getComputedStyle(a);
        return { t: a.tagName.toLowerCase() + (a.id ? "#" + a.id : "") + (typeof a.className === "string" && a.className ? "." + a.className.split(" ")[0] : ""),
                 anel: s.outlineStyle !== "none" && parseFloat(s.outlineWidth) > 0 };
      })()`));
    }
    ok(foco[0].t.includes("skip-link"), `o primeiro Tab cai no "pular para o conteúdo" (${foco[0].t})`);
    ok(foco.every(f => f.anel), "todo elemento focado mostra anel de foco visível");

    await p.evaluate(`document.querySelector('#v1 .bloco[data-alvo="sobre"]').focus()`);
    await p.keyboard.press("Enter");
    await p.waitForTimeout(1700);
    const y = await p.evaluate(`window.scrollY`);
    const alvo = await p.evaluate(`document.getElementById("sobre").offsetTop`);
    ok(Math.abs(y - alvo) < 300, `Enter num clipe da régua navega até a seção (${Math.round(y)} vs ${alvo})`);
    await ctx.close();
  }

  /* ---------- 5. larguras ---------- */
  console.log(`\n== rolagem lateral em 5 larguras ==`);
  {
    const { ctx, p } = await novaAba(b, {});
    for (const w of [320, 390, 768, 1024, 1440]) {
      await p.setViewportSize({ width: w, height: 800 });
      await p.goto(URL, { waitUntil: "load" });
      await p.waitForTimeout(1100);
      await rolarTudo(p);
      const over = await p.evaluate(`document.documentElement.scrollWidth - document.documentElement.clientWidth`);
      ok(over === 0, `${w}px → overflow-x ${over}px`);
    }
    await ctx.close();
  }

  /* ---------- 6. um ícone por botão ---------- */
  console.log(`\n== um ícone por botão (regressão de especificidade) ==`);
  {
    const { ctx, p } = await novaAba(b, { vp: { width: 390, height: 800 } });
    await p.goto(URL, { waitUntil: "load" });
    await p.waitForTimeout(900);
    for (const claro of [false, true]) {
      if (claro) { await p.evaluate(`document.getElementById("tema-btn").click()`); await p.waitForTimeout(400); }
      const r = await p.evaluate(`(function () {
        function c(sel) { return [].slice.call(document.querySelectorAll(sel + " svg")).filter(function (x) { return getComputedStyle(x).display !== "none"; }).length; }
        return { tema: c("#tema-btn"), menu: c("#menu-btn") };
      })()`);
      ok(r.tema === 1, `tema ${claro ? "claro" : "escuro"}: 1 ícone no botão de tema (${r.tema})`);
      ok(r.menu === 1, `tema ${claro ? "claro" : "escuro"}: 1 ícone no botão de menu (${r.menu})`);
    }
    await ctx.close();
  }

  /* ---------- 7. cold open ---------- */
  console.log(`\n== cold open ==`);
  {
    const { ctx, p } = await novaAba(b, {});
    await p.goto(URL, { waitUntil: "load" });
    await p.waitForTimeout(700);                 /* no meio da digitação */
    const meio = await p.evaluate(`({
      classe: document.documentElement.classList.contains("cold-open"),
      escrito: document.querySelector("[data-escreve]").textContent.length,
      barra: getComputedStyle(document.getElementById("barra")).opacity
    })`);
    ok(meio.classe, "durante a escrita, o html tem .cold-open");
    ok(meio.escrito > 0 && meio.escrito < 47, `a frase está a meio caminho (${meio.escrito}/47)`);
    ok(+meio.barra < 0.5, `a barra ainda não entrou (opacidade ${meio.barra})`);

    /* A altura do título não pode pular enquanto digita — é o defeito que a
       .hero-medida existe para evitar, e que a versão de julho tinha. */
    const h1 = await p.evaluate(`document.querySelector(".hero-h1").getBoundingClientRect().height`);
    await p.waitForTimeout(3200);
    const fim = await p.evaluate(`({
      classe: document.documentElement.classList.contains("cold-open"),
      escrito: document.querySelector("[data-escreve]").textContent,
      barra: getComputedStyle(document.getElementById("barra")).opacity,
      cursor: document.querySelector(".cursor").classList.contains("parado"),
      h: document.querySelector(".hero-h1").getBoundingClientRect().height
    })`);
    ok(!fim.classe, "ao terminar, o .cold-open sai");
    ok(fim.escrito === "Seu site e seu vídeo, feitos pela mesma pessoa.", "a frase saiu inteira e correta");
    ok(+fim.barra > 0.9, `a barra entrou (opacidade ${fim.barra})`);
    ok(fim.cursor, "o cursor parou de piscar");
    ok(Math.abs(h1 - fim.h) < 2, `a altura do título não pulou (${Math.round(h1)} → ${Math.round(fim.h)})`);
    await ctx.close();
  }

  /* ---------- 8. som ambiente ---------- */
  console.log(`\n== som ambiente ==`);
  {
    const { ctx, p, erros } = await novaAba(b, {});
    await p.goto(URL, { waitUntil: "load" });
    await p.evaluate(`document.documentElement.classList.remove("cold-open")`);
    await p.waitForTimeout(1000);
    const antes = await p.evaluate(`document.getElementById("som-btn").getAttribute("aria-pressed")`);
    ok(antes === "false", `começa DESLIGADO — nunca toca sozinho (aria-pressed=${antes})`);
    await p.click("#som-btn");
    await p.waitForTimeout(1800);
    const dep = await p.evaluate(`({
      pressed: document.getElementById("som-btn").getAttribute("aria-pressed"),
      rotulo: document.getElementById("som-btn").getAttribute("aria-label")
    })`);
    ok(dep.pressed === "true", "liga no clique");
    ok(/desligar/i.test(dep.rotulo), `o rótulo vira a ação inversa: "${dep.rotulo}"`);
    await p.click("#som-btn");
    await p.waitForTimeout(600);
    ok(await p.evaluate(`document.getElementById("som-btn").getAttribute("aria-pressed")`) === "false",
       "desliga no segundo clique");
    ok(erros.length === 0, `sem erro de JS no áudio (${erros.slice(0, 2).join(" | ") || "nenhum"})`);
    await ctx.close();
  }

  /* ---------- 9. atmosfera e partículas ---------- */
  console.log(`\n== atmosfera ==`);
  {
    const { ctx, p } = await novaAba(b, {});
    await p.goto(URL, { waitUntil: "load" });
    await p.evaluate(`document.documentElement.classList.remove("cold-open")`);
    await p.waitForTimeout(1600);
    const escuro = await p.evaluate(`(function () {
      var a = document.getElementById("atmosfera");
      var meio = document.elementFromPoint(innerWidth / 2, innerHeight / 2);
      return {
        pe: getComputedStyle(a).pointerEvents,
        particulas: getComputedStyle(document.getElementById("particulas")).display,
        noMeio: meio ? meio.tagName.toLowerCase() : "?"
      };
    })()`);
    ok(escuro.pe === "none", `não intercepta clique (pointer-events: ${escuro.pe})`);
    ok(escuro.particulas !== "none", "as partículas existem no tema escuro");
    ok(escuro.noMeio !== "canvas", `o clique no meio da tela chega no conteúdo (${escuro.noMeio})`);

    const amostra = `(function () {
      var c = document.getElementById("particulas");
      var d = c.getContext("2d").getImageData(0, 0, 400, 300).data;
      var s = 0; for (var i = 0; i < d.length; i += 97) s = (s + d[i]) % 1e9; return s;
    })()`;
    const m1 = await p.evaluate(amostra);
    await p.waitForTimeout(800);
    const m2 = await p.evaluate(amostra);
    ok(m1 !== m2, `as partículas se movem (${m1} → ${m2})`);

    /* No tema claro elas somem — e o laço tem de PARAR junto. Canvas
       invisível continuando a desenhar é bateria queimada por nada. */
    await p.evaluate(`document.getElementById("tema-btn").click()`);
    await p.waitForTimeout(900);
    const c1 = await p.evaluate(amostra);
    await p.waitForTimeout(800);
    const c2 = await p.evaluate(amostra);
    ok(await p.evaluate(`getComputedStyle(document.getElementById("particulas")).display`) === "none",
       "no tema claro as partículas somem");
    ok(c1 === c2, "e o laço para de verdade, não fica desenhando invisível");
    await ctx.close();
  }

  await b.close();
  console.log(`\nCapturas em: ${SAIDA}`);
  console.log(`\n${falhas.length ? "REPROVOU — " + falhas.length + " item(ns):\n  · " + falhas.join("\n  · ") : "PASSOU"}`);
  process.exit(falhas.length ? 1 : 0);
})();
