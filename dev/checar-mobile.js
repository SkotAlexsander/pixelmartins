const { chromium } = require("./playwright");
(async () => {
  const b = await chromium.launch();
  for (const [nome, vp, tema] of [["mobile-390", {width:390,height:844}, "dark"],
                                  ["light-1440", {width:1440,height:900}, "light"]]) {
    const p = await b.newPage({ viewport: vp });
    const errs = [], bad = [];
    p.on("pageerror", e => errs.push(e.message));
    p.on("console", m => { if (m.type()==="error") errs.push(m.text()); });
    p.on("response", r => { if (r.status() >= 400) bad.push(r.status()+" "+r.url()); });
    await p.goto("http://127.0.0.1:8099/preview.html", { waitUntil: "load" });
    if (tema === "light") await p.evaluate(`document.documentElement.className = "light"`);
    await p.waitForTimeout(3000);
    const n = await p.evaluate(`(() => {
      const imgs = performance.getEntriesByType("resource").filter(r => r.name.includes("/frames/"));
      const c = document.getElementById("portrait-canvas");
      return { frames: imgs.length,
               kb: Math.round(imgs.reduce((a,r)=>a+(r.transferSize||0),0)/1024),
               ready: c.classList.contains("ready"),
               op: getComputedStyle(c).opacity };
    })()`);
    // overflow horizontal (regra do projeto: nunca vazar no celular)
    const over = await p.evaluate(`document.documentElement.scrollWidth - window.innerWidth`);
    console.log(`${nome}: frames=${n.frames} peso=${n.kb}KB ready=${n.ready} opacidade=${n.op} overflow-x=${over}px erros=${errs.length?errs.join("|"):"0"} http4xx=${bad.length}`);
    await p.screenshot({ path: `dev/capturas/${nome}.png` });
    await p.close();
  }
  await b.close();
})();
