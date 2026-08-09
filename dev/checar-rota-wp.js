/* Simula o WordPress JÁ com os frames: intercepta o domínio real e responde
   com os arquivos locais. Prova que, no dia em que as imagens subirem, o site
   passa a usá-las — e que NENHUMA requisição vai para o jsDelivr.

   O endereço é 127.0.0.2 de propósito: o código só usa a pasta local quando o
   hostname é "localhost" ou "127.0.0.1". Por 127.0.0.2 ele acredita estar no ar
   e roda a escolha de verdade (testa o WordPress, cai no CDN se falhar).
   Por isso o servidor precisa estar SEM --bind, escutando em 0.0.0.0.

   USO:  node dev/checar-rota-wp.js
   EXIT: 0 = passou · 1 = reprovou */
const path = require("path"), fs = require("fs");
const { chromium } = require("./playwright");
const FRAMES = path.resolve(__dirname, "../assets/frames");

/* A porta é configurável porque 8099 é disputada: outros projetos desta
   máquina servem preview na mesma porta. PORTA=8098 node dev/... resolve. */
const PORTA = process.env.PORTA || "8099";

const ASSINATURA = `(() => {
  const c = document.getElementById("retrato");
  if (!c || !c.width) return null;
  const d = c.getContext("2d").getImageData(0, 0, c.width, c.height).data;
  let s = 0;
  for (let i = 0; i < d.length; i += 4021) s = (s + d[i]*31 + d[i+1]*17 + d[i+2]*7) % 1e9;
  return s;
})()`;

(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  const errs = [], cdnHits = [], wpHits = [];
  p.on("pageerror", e => errs.push(e.message));
  p.on("console", m => { if (m.type() === "error") errs.push(m.text()); });

  await p.route("https://pixelmartins.com/wp-content/uploads/retrato/*", route => {
    const nome = route.request().url().split("/").pop();
    const arq = path.join(FRAMES, nome);
    wpHits.push(nome);
    if (fs.existsSync(arq)) route.fulfill({ status: 200, contentType: "image/jpeg", body: fs.readFileSync(arq) });
    else route.fulfill({ status: 404, body: "" });
  });
  p.on("request", r => { if (r.url().includes("jsdelivr")) cdnHits.push(r.url()); });

  await p.goto("http://127.0.0.2:" + PORTA + "/preview.html", { waitUntil: "load" });
  // o retrato só desperta quando a seção "Sobre" entra em cena
  await p.evaluate(`document.getElementById("sobre").scrollIntoView({ block: "center", behavior: "instant" })`);
  await p.waitForSelector("#retrato.pronto", { timeout: 15000 });
  await p.waitForTimeout(3000);

  // na v4 a animação é temporal, não de scroll: as leituras são no tempo
  const assinaturas = [];
  for (let i = 0; i < 3; i++) {
    assinaturas.push(await p.evaluate(ASSINATURA));
    await p.waitForTimeout(500);
  }
  await p.screenshot({ path: "dev/capturas/rota-wp.png" });
  await b.close();

  const distintas = new Set(assinaturas.filter(v => v !== null)).size;
  console.log(`- Frames pedidos ao WordPress: ${wpHits.length}`);
  console.log(`- Requisicoes ao jsDelivr: ${cdnHits.length} (tem de ser 0)`);
  console.log(`- Frames distintos no tempo: ${distintas}/3`);
  console.log(`- Erros de console: ${errs.length ? errs.join(" | ") : "nenhum"}`);
  const ok = wpHits.length > 100 && cdnHits.length === 0 && distintas === 3 && errs.length === 0;
  console.log(`\n${ok ? "PASSOU" : "REPROVOU"}`);
  process.exit(ok ? 0 : 1);
})();
