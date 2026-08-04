/* Simula o WordPress JÁ com os frames: intercepta o domínio real e responde
   com os arquivos locais. Prova que, no dia em que as imagens subirem, o site
   passa a usá-las — e que NENHUMA requisição vai para o jsDelivr. */
const path = require("path"), fs = require("fs");
const { chromium } = require("./playwright");
const FRAMES = path.resolve(__dirname, "../assets/frames");

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

  await p.goto("http://127.0.0.2:8099/preview.html", { waitUntil: "load" });
  await p.waitForSelector("#portrait-canvas.ready", { timeout: 15000 });
  await p.waitForTimeout(3000);

  const assinaturas = [];
  for (const q of [0, 0.5, 1]) {
    await p.evaluate(`(q => { const t = document.documentElement.scrollHeight - window.innerHeight;
                              window.scrollTo({ top: t * q, behavior: "instant" }); })(${q})`);
    await p.waitForTimeout(1400);
    assinaturas.push(await p.evaluate(`(() => {
      const c = document.getElementById("portrait-canvas"), x = c.getContext("2d");
      const d = x.getImageData(0, 0, c.width, c.height).data; let s = 0;
      for (let i = 0; i < d.length; i += 4021) s = (s + d[i]*31 + d[i+1]*17 + d[i+2]*7) % 1e9;
      return s; })()`));
  }
  await p.screenshot({ path: "dev/capturas/rota-wp.png" });
  await b.close();

  const distintas = new Set(assinaturas).size;
  console.log(`- Frames pedidos ao WordPress: ${wpHits.length}`);
  console.log(`- Requisicoes ao jsDelivr: ${cdnHits.length} (tem de ser 0)`);
  console.log(`- Frames distintos no scroll: ${distintas}/3`);
  console.log(`- Erros de console: ${errs.length ? errs.join(" | ") : "nenhum"}`);
  const ok = wpHits.length > 100 && cdnHits.length === 0 && distintas === 3 && errs.length === 0;
  console.log(`\n${ok ? "PASSOU" : "REPROVOU"}`);
  process.exit(ok ? 0 : 1);
})();
