/**
 * checar-mobile.js — o ramo celular e o modo claro, num navegador real.
 *
 * Mede o que o visitante paga (quantos frames baixam e quanto pesam), se o
 * retrato subiu, e se algo vaza para fora da tela — a regra do projeto é
 * nunca ter rolagem horizontal no celular.
 *
 * No celular a v4 carrega 1 frame a cada 3 (RETRATO.passoCelular), então o
 * peso esperado é ~1/3 do desktop, não 1 frame parado.
 *
 * USO:  node dev/checar-mobile.js
 */
const { chromium } = require("./playwright");
const PORTA = process.env.PORTA || "8099";
(async () => {
  const b = await chromium.launch();
  for (const [nome, vp, tema] of [["mobile-390", {width:390,height:844}, "dark"],
                                  ["light-1440", {width:1440,height:900}, "light"]]) {
    const p = await b.newPage({ viewport: vp });
    const errs = [], bad = [];
    p.on("pageerror", e => errs.push(e.message));
    p.on("console", m => { if (m.type()==="error") errs.push(m.text()); });
    p.on("response", r => { if (r.status() >= 400) bad.push(r.status()+" "+r.url()); });
    await p.goto("http://127.0.0.1:" + PORTA + "/preview.html", { waitUntil: "load" });
    if (tema === "light") await p.evaluate(`document.documentElement.classList.add("light")`);
    // o retrato só desperta quando a seção "Sobre" entra em cena
    await p.evaluate(`document.getElementById("sobre").scrollIntoView({ block: "center", behavior: "instant" })`);
    await p.waitForTimeout(3500);
    const n = await p.evaluate(`(() => {
      const imgs = performance.getEntriesByType("resource").filter(r => r.name.includes("/frames/"));
      const c = document.getElementById("retrato");
      const legenda = document.getElementById("retrato-modo");
      return { frames: imgs.length,
               kb: Math.round(imgs.reduce((a,r)=>a+(r.transferSize||0),0)/1024),
               pronto: c.classList.contains("pronto"),
               modo: legenda ? legenda.textContent : "?" };
    })()`);
    // overflow horizontal (regra do projeto: nunca vazar no celular)
    const over = await p.evaluate(`document.documentElement.scrollWidth - window.innerWidth`);
    console.log(`${nome}: frames=${n.frames} peso=${n.kb}KB pronto=${n.pronto} modo="${n.modo}" overflow-x=${over}px erros=${errs.length?errs.join("|"):"0"} http4xx=${bad.length}`);
    await p.screenshot({ path: `dev/capturas/${nome}.png` });
    await p.close();
  }
  await b.close();
})();
