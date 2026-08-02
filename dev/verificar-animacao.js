/**
 * verificar-animacao.js — prova, num navegador real, que o retrato do fundo
 * está aparecendo E mudando conforme o scroll.
 *
 * Não confia em "parece que funcionou": lê os pixels do canvas em cada posição
 * de scroll e compara. Se a assinatura não mudar, a animação está congelada.
 *
 * USO:  node dev/verificar-animacao.js [url]
 * EXIT: 0 = passou · 1 = reprovou
 */

const path = require("path");
const { chromium } = require(path.resolve(__dirname, "../../../node_modules/playwright"));

const URL = process.argv[2] || "http://127.0.0.1:8099/preview.html";
const PARADAS = [0, 0.25, 0.5, 0.75, 1];
const SAIDA = path.resolve(__dirname, "../dev/capturas");

/* Assinatura barata do canvas: soma amostrada dos pixels. Dois frames
   diferentes praticamente nunca colidem; dois frames iguais sempre colidem. */
const ASSINATURA = `(() => {
  const c = document.getElementById("portrait-canvas");
  if (!c) return null;
  const ctx = c.getContext("2d");
  const d = ctx.getImageData(0, 0, c.width, c.height).data;
  let s = 0;
  for (let i = 0; i < d.length; i += 4021) s = (s + d[i] * 31 + d[i + 1] * 17 + d[i + 2] * 7) % 1e9;
  return s;
})()`;

(async () => {
  const fs = require("fs");
  fs.mkdirSync(SAIDA, { recursive: true });

  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  const erros = [];
  page.on("console", m => { if (m.type() === "error") erros.push(m.text()); });
  page.on("pageerror", e => erros.push("pageerror: " + e.message));
  const falhas404 = [];
  page.on("response", r => { if (r.status() >= 400) falhas404.push(`${r.status()} ${r.url()}`); });

  await page.goto(URL, { waitUntil: "load" });

  // O canvas só ganha .ready quando o primeiro frame decodifica
  let pronto = true;
  try {
    await page.waitForSelector("#portrait-canvas.ready", { timeout: 15000 });
  } catch { pronto = false; }

  // Dá tempo do esqueleto de frames baixar
  await page.waitForTimeout(2500);

  const opacidade = await page.evaluate(
    `getComputedStyle(document.getElementById("portrait-canvas")).opacity`);
  const veu = await page.evaluate(
    `(() => { const e = document.querySelector(".hero-dark-bg");
              return e ? getComputedStyle(e).opacity : "(sem .hero-dark-bg)"; })()`);

  const assinaturas = [];
  for (const p of PARADAS) {
    await page.evaluate(`(p => {
      const total = document.documentElement.scrollHeight - window.innerHeight;
      window.scrollTo({ top: total * p, behavior: "instant" });
    })(${p})`);
    // espera o amortecedor encostar no alvo
    await page.waitForTimeout(1400);
    assinaturas.push(await page.evaluate(ASSINATURA));
    await page.screenshot({ path: path.join(SAIDA, `scroll-${Math.round(p * 100)}.png`) });
  }

  const distintas = new Set(assinaturas.filter(v => v !== null)).size;
  const mudou = distintas >= PARADAS.length - 1;

  console.log("## Verificação da animação\n");
  console.log(`- Canvas pronto (.ready): ${pronto ? "sim" : "NÃO"}`);
  console.log(`- Opacidade final do retrato: ${opacidade}`);
  console.log(`- Opacidade do véu do hero: ${veu}`);
  console.log(`- Assinaturas por parada: ${assinaturas.join(", ")}`);
  console.log(`- Frames distintos: ${distintas}/${PARADAS.length}`);
  console.log(`- Erros de console: ${erros.length ? erros.join(" | ") : "nenhum"}`);
  console.log(`- Requisições com falha: ${falhas404.length ? falhas404.slice(0, 5).join(" | ") : "nenhuma"}`);
  console.log(`\nCapturas em: ${SAIDA}`);

  await browser.close();

  const passou = pronto && mudou && erros.length === 0 && falhas404.length === 0;
  console.log(`\n${passou ? "PASSOU" : "REPROVOU"}`);
  process.exit(passou ? 0 : 1);
})();
