const {chromium}=require(process.env.PLAYWRIGHT_DIR);
const U="file:///A:/github-trabalhos/pixelmartins-site/design/v11-resolucao/index.html";
let mau=0; const ok=(b,m)=>{console.log(`   ${b?"\u2713":"\u2717"} ${m}`); if(!b)mau++;};
const px=`(function(){var c=document.getElementById("poeira"),x=c.getContext("2d");
  var d=x.getImageData(0,0,c.width,c.height).data,n=0;
  for(var i=3;i<d.length;i+=4) if(d[i]>6) n++; return n})()`;
(async()=>{
  const b=await chromium.launch();
  const p=await b.newPage({viewport:{width:1440,height:900}});
  const erros=[]; p.on("pageerror",e=>erros.push(e.message));
  p.on("console",m=>m.type()==="error"&&erros.push(m.text()));
  await p.goto(U,{waitUntil:"networkidle"}); await p.waitForTimeout(2200);
  await p.evaluate(()=>{document.documentElement.classList.add("noite");window.dispatchEvent(new Event("pm-tema"))});
  await p.waitForTimeout(1200);

  console.log("\n== as camadas ==");
  const c=await p.evaluate(()=>{
    // le do proprio estado interno via amostragem: 3 raios distintos esperados
    const cv=document.getElementById("poeira");
    return { larg:cv.width, alt:cv.height, brilhos:document.querySelectorAll("#atmosfera .brilho, #atmosfera .brilho-2").length,
             vinheta:!!document.querySelector(".vinheta") };
  });
  ok(c.brilhos===2, `dois brilhos em ritmos diferentes (${c.brilhos})`);
  ok(c.vinheta, "a vinheta fecha as bordas");
  const n1=await p.evaluate(px); ok(n1>300, `a poeira desenha (${n1} pixels)`);

  console.log("\n== o ponteiro empurra o fundo, com atraso ==");
  await p.mouse.move(1400,850); await p.waitForTimeout(140);
  const meio=await p.evaluate(()=>getComputedStyle(document.documentElement).getPropertyValue("--px").trim());
  await p.waitForTimeout(1600);
  const fim=await p.evaluate(()=>getComputedStyle(document.documentElement).getPropertyValue("--px").trim());
  ok(parseFloat(meio)<parseFloat(fim), `o deslocamento chega devagar (${meio} -> ${fim}), nao instantaneo`);
  ok(parseFloat(fim)>0.5, `e alcanca o ponteiro (${fim})`);
  await p.mouse.move(40,40); await p.waitForTimeout(1800);
  const volta=await p.evaluate(()=>getComputedStyle(document.documentElement).getPropertyValue("--px").trim());
  ok(parseFloat(volta)<-0.45, `e acompanha de volta (${volta})`);

  console.log("\n== no claro continua desligado ==");
  await p.evaluate(()=>{document.documentElement.classList.remove("noite");window.dispatchEvent(new Event("pm-tema"))});
  await p.waitForTimeout(900);
  ok(await p.evaluate(px)===0, "nenhum pixel no tema claro");
  await p.close();

  console.log("\n== celular: nada de reagir ao toque ==");
  const cel=await b.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true});
  const q=await cel.newPage();
  await q.goto(U,{waitUntil:"networkidle"});
  await q.evaluate(()=>{document.documentElement.classList.add("noite");window.dispatchEvent(new Event("pm-tema"))});
  await q.waitForTimeout(1600);
  await q.touchscreen.tap(300,700); await q.waitForTimeout(1200);
  const t=await q.evaluate(()=>getComputedStyle(document.documentElement).getPropertyValue("--px").trim());
  ok(t==="" || Math.abs(parseFloat(t)||0)<0.02, `o toque nao empurra o fundo (--px "${t||"nao definido"}")`);
  const nCel=await q.evaluate(px); ok(nCel>60, `mas a poeira roda no celular (${nCel} pixels)`);
  await cel.close();

  const RUIDO=/wp-content|ERR_CONNECTION_REFUSED/;
  const reais=erros.filter(function(e){return !RUIDO.test(e)});
  if(erros.length-reais.length) console.log("   · ruido conhecido (logo, site fora do ar): "+(erros.length-reais.length));
  ok(reais.length===0, "sem erro "+(reais.length?"("+reais.join(" | ")+")":"(nenhum alem do ruido declarado)"));
  await b.close();
  console.log(mau? `\nREPROVOU (${mau})` : "\nPASSOU");
  process.exit(mau?1:0);
})();
