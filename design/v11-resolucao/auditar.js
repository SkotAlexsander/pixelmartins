/**
 * auditar.js — o piso de qualidade da proposta v11, medido em navegador real.
 * Uso: PLAYWRIGHT_DIR="..." node design/v11-resolucao/auditar.js
 */
const {chromium}=require(process.env.PLAYWRIGHT_DIR||"playwright");
const U="file:///A:/github-trabalhos/pixelmartins-site/design/v11-resolucao/index.html";
const falhas=[];
const ok=(b,m)=>{ console.log(`   ${b?"\u2713":"\u2717"} ${m}`); if(!b) falhas.push(m); };

const CONTRASTE=`(function(){
  function lin(v){v/=255;return v<=0.03928?v/12.92:Math.pow((v+0.055)/1.055,2.4)}
  function comps(c){var s=String(c);var m=s.match(/-?[0-9.]+/g);if(!m||m.length<3)return null;
    var a=[+m[0],+m[1],+m[2]];
    /* color(srgb 0.93 0.93 0.94 / .88) traz canais de 0 a 1; rgb() traz de 0 a 255.
       O color-mix() do CSS computa para a primeira forma. */
    if(s.trim().slice(0,6)==="color(") a=[a[0]*255,a[1]*255,a[2]*255];
    return a}
  function lum(c){var m=comps(c);if(!m)return null;return .2126*lin(m[0])+.7152*lin(m[1])+.0722*lin(m[2])}
  function ct(a,b){var x=lum(a),y=lum(b);if(x===null||y===null)return null;
    var hi=Math.max(x,y),lo=Math.min(x,y);return (hi+.05)/(lo+.05)}
  function fundo(el){var n=el;while(n&&n.nodeType===1){var bg=getComputedStyle(n).backgroundColor;
    if(bg&&bg!=="rgba(0, 0, 0, 0)"&&bg!=="transparent")return bg;n=n.parentElement}
    return getComputedStyle(document.body).backgroundColor||"rgb(255,255,255)"}
  var sel=[".lead",".rot",".nav a",".dado-item span",".dado-item b",".item-o-que",".item-pilha",
           ".item-n",".item-links a",".item-links a.sec",".serv p",".serv li",".ficha dd",".ficha dt",
           ".saida .nome",".saida .fmt",".rodape-int",".sociais a",".email",".calibra .leg",".btn",".btn-vazio"];
  var out=[];
  for(var i=0;i<sel.length;i++){
    var el=document.querySelector(sel[i]); if(!el) continue;
    var cs=getComputedStyle(el);
    var tinta = (el.ownerSVGElement && cs.fill && cs.fill!=="none") ? cs.fill : cs.color;
    var fs=parseFloat(cs.fontSize), pesado=parseInt(cs.fontWeight,10)>=700;
    var min=(fs>=24||(fs>=18.66&&pesado))?3:4.5;
    var r=ct(tinta,fundo(el));
    if(r!==null) out.push({s:sel[i],r:r,fs:Math.round(fs*10)/10,min:min});
  }
  return out;
})()`;

const TOQUE=`(function(){
  var maus=[], vistos=new Set();
  document.querySelectorAll("a[href],button,[role=button]").forEach(function(el){
    var r=el.getBoundingClientRect(); if(!r.width||!r.height) return;
    if(r.height<40){ var k=(el.className||el.tagName)+"|"+Math.round(r.height);
      if(!vistos.has(k)){vistos.add(k);maus.push((el.className||el.tagName)+" "+Math.round(r.height)+"px")} }
  });
  return maus;
})()`;

(async()=>{
  const b=await chromium.launch();

  for(const claro of [false]){
    console.log("\n== contraste (AA: 4.5 normal · 3 grande) ==");
    const p=await b.newPage({viewport:{width:1440,height:900}});
    await p.goto(U,{waitUntil:"networkidle"}); await p.waitForTimeout(2400);
    await p.evaluate(`document.querySelectorAll(".sobe").forEach(function(e){e.classList.add("dentro")})`);
    const r=await p.evaluate(CONTRASTE);
    for(const x of r) ok(x.r>=x.min, `${x.s.padEnd(22)} ${x.r.toFixed(2)}  (${x.fs}px, min ${x.min})`);
    await p.close();
  }

  console.log("\n== alvo de toque (min 40px) ==");
  for(const w of [390,768,1440]){
    const p=await b.newPage({viewport:{width:w,height:900}});
    await p.goto(U,{waitUntil:"networkidle"}); await p.waitForTimeout(2200);
    await p.evaluate(`document.querySelectorAll(".sobe").forEach(function(e){e.classList.add("dentro")})`);
    const m=await p.evaluate(TOQUE);
    ok(m.length===0, `${w}px: ${m.length?m.join(", "):"nenhum abaixo de 40px"}`);
    await p.close();
  }

  console.log("\n== rolagem lateral ==");
  {
    const p=await b.newPage({viewport:{width:1440,height:900}});
    await p.goto(U,{waitUntil:"networkidle"}); await p.waitForTimeout(2200);
    for(const w of [320,360,390,430,768,1024,1440,1920]){
      await p.setViewportSize({width:w,height:900}); await p.waitForTimeout(350);
      const o=await p.evaluate(`document.documentElement.scrollWidth-document.documentElement.clientWidth`);
      ok(o===0, `${w}px -> overflow-x ${o}px`);
    }
    await p.close();
  }

  console.log("\n== teclado ==");
  {
    const p=await b.newPage({viewport:{width:1440,height:900}});
    await p.goto(U,{waitUntil:"networkidle"}); await p.waitForTimeout(2200);
    await p.keyboard.press("Tab");
    const primeiro=await p.evaluate(`document.activeElement.className`);
    ok(/pular/.test(primeiro), `o 1o Tab cai no "pular para o conteudo" (${primeiro})`);
    let semAnel=[], visitados=0;
    for(let i=0;i<40;i++){ await p.keyboard.press("Tab");
      const x=await p.evaluate(`(function(){var a=document.activeElement,cs=getComputedStyle(a);
        return {fim:a===document.body||a===document.documentElement,
                tem:cs.outlineStyle!=="none" && parseFloat(cs.outlineWidth)>0,
                quem:(a.className||a.tagName)+" "+(a.textContent||"").trim().slice(0,20)}})()`);
      /* Ao passar do ultimo focavel o navegador devolve o foco ao BODY. Contar
         isso como falha e culpar a pagina pelo fim da propria lista. */
      if(x.fim) break;
      visitados++; if(!x.tem) semAnel.push(x.quem); }
    ok(semAnel.length===0, `os ${visitados} focaveis mostram anel (${semAnel.length?semAnel.join(", "):"nenhum sem"})`);
    await p.close();
  }

  console.log("\n== movimento reduzido ==");
  {
    const c=await b.newContext({viewport:{width:1440,height:900},reducedMotion:"reduce"});
    const p=await c.newPage();
    const t0=Date.now();
    await p.goto(U,{waitUntil:"networkidle"}); await p.waitForTimeout(1600);
    const a=await p.evaluate(`(function(){var c=document.getElementById("tela-titulo"),x=c.getContext("2d");
      var d=x.getImageData(0,0,c.width,c.height).data,n=0;
      for(var i=3;i<d.length;i+=4) if(d[i]>10) n++;
      return {pintados:n, pintado:document.documentElement.classList.contains("pintado"),
              revelados:document.querySelectorAll(".sobe:not(.dentro)").length,
              opacidade:getComputedStyle(document.querySelector(".lead")).opacity}})()`);
    ok(a.pintado && a.pintados>3000, `o titulo e pintado direto, sem animar (${a.pintados} pixels)`);
    ok(a.opacidade==="1", `nada fica invisivel esperando animacao (opacidade ${a.opacidade})`);
    await c.close();
  }

  console.log("\n== console ==");
  {
    const p=await b.newPage({viewport:{width:1440,height:900}});
    const erros=[]; p.on("console",m=>m.type()==="error"&&erros.push(m.text()));
    p.on("pageerror",e=>erros.push("pageerror: "+e.message));
    await p.goto(U,{waitUntil:"networkidle"}); await p.waitForTimeout(2400);
    await p.evaluate(`window.scrollTo(0,document.body.scrollHeight)`); await p.waitForTimeout(900);
    ok(erros.length===0, `sem erro de console (${erros.length?erros.join(" | "):"nenhum"})`);
    await p.close();
  }

  await b.close();
  console.log(`\n${falhas.length? "REPROVOU ("+falhas.length+"):\n  \u00b7 "+falhas.join("\n  \u00b7 ") : "PASSOU"}`);
  process.exit(falhas.length?1:0);
})();
