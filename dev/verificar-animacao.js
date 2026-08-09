/**
 * verificar-animacao.js — prova, num navegador real, que o retrato da seção
 * "Sobre" aparece, anima sozinho e para quando sai de vista.
 *
 * Na v4 o retrato deixou de ser dirigido pelo scroll: ele roda em looping
 * contínuo (vaivém, 20 fps) enquanto está à vista, e dorme quando não está.
 * São duas afirmações, e as duas precisam de prova:
 *
 *   1. À VISTA, ANIMA  — assinaturas do canvas em instantes seguidos têm de
 *      diferir. Se não mudarem, a animação está congelada.
 *   2. FORA DE VISTA, DORME — voltando ao topo, duas leituras separadas por
 *      mais de um segundo têm de ser IGUAIS. Se mudarem, o loop continua
 *      queimando bateria com a seção fora da tela.
 *
 * Não confia em "parece que funcionou": lê os pixels do canvas.
 *
 * USO:  node dev/verificar-animacao.js [url]
 * EXIT: 0 = passou · 1 = reprovou
 */

const path = require("path");
const { chromium } = require("./playwright");

const PORTA = process.env.PORTA || "8099";
const URL = process.argv[2] || ("http://127.0.0.1:" + PORTA + "/preview.html");
const AMOSTRAS = 6;          // leituras enquanto o retrato está à vista
const INTERVALO = 400;       // ms entre leituras (a 20 fps, 8 frames de distância)
const SAIDA = path.resolve(__dirname, "../dev/capturas");

/* Assinatura barata do canvas: soma amostrada dos pixels. Dois frames
   diferentes praticamente nunca colidem; dois frames iguais sempre colidem. */
const ASSINATURA = `(() => {
  const c = document.getElementById("retrato");
  if (!c || !c.width) return null;
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

  /* O retrato só começa a existir quando a seção "Sobre" entra em cena —
     é o IntersectionObserver que dispara o download. Sem rolar até lá, nada
     acontece, e o teste reprovaria um site que funciona. */
  await page.evaluate(`document.getElementById("sobre").scrollIntoView({ block: "center", behavior: "instant" })`);

  let pronto = true;
  try {
    await page.waitForSelector("#retrato.pronto", { timeout: 15000 });
  } catch { pronto = false; }

  // Dá tempo do esqueleto de frames baixar antes de julgar a fluidez
  await page.waitForTimeout(2500);

  const legenda = await page.evaluate(
    `(() => { const e = document.getElementById("retrato-modo"); return e ? e.textContent : "(sem legenda)"; })()`);

  /* ---- 1. à vista, anima ---- */
  const assinaturas = [];
  for (let i = 0; i < AMOSTRAS; i++) {
    assinaturas.push(await page.evaluate(ASSINATURA));
    if (i === 0) await page.screenshot({ path: path.join(SAIDA, "retrato-inicio.png") });
    await page.waitForTimeout(INTERVALO);
  }
  await page.screenshot({ path: path.join(SAIDA, "retrato-fim.png") });

  const distintas = new Set(assinaturas.filter(v => v !== null)).size;
  const anima = distintas >= AMOSTRAS - 1;

  /* ---- 2. fora de vista, dorme ---- */
  await page.evaluate(`window.scrollTo({ top: 0, behavior: "instant" })`);
  await page.waitForTimeout(1200);           // deixa o observador registrar a saída
  const parado1 = await page.evaluate(ASSINATURA);
  await page.waitForTimeout(1500);
  const parado2 = await page.evaluate(ASSINATURA);
  const dormiu = parado1 !== null && parado1 === parado2;

  console.log("## Verificação da animação do retrato\n");
  console.log(`- Canvas pronto (#retrato.pronto): ${pronto ? "sim" : "NÃO"}`);
  console.log(`- Legenda do modo: ${legenda}`);
  console.log(`- Assinaturas à vista: ${assinaturas.join(", ")}`);
  console.log(`- Frames distintos: ${distintas}/${AMOSTRAS} → ${anima ? "anima" : "CONGELADO"}`);
  console.log(`- Fora de vista: ${parado1} → ${parado2} → ${dormiu ? "dormiu" : "CONTINUA RODANDO"}`);
  console.log(`- Erros de console: ${erros.length ? erros.join(" | ") : "nenhum"}`);
  console.log(`- Requisições com falha: ${falhas404.length ? falhas404.slice(0, 5).join(" | ") : "nenhuma"}`);
  console.log(`\nCapturas em: ${SAIDA}`);

  await browser.close();

  const passou = pronto && anima && dormiu && erros.length === 0 && falhas404.length === 0;
  console.log(`\n${passou ? "PASSOU" : "REPROVOU"}`);
  process.exit(passou ? 0 : 1);
})();
