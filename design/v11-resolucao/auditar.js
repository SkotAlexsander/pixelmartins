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
           ".saida .nome",".saida .fmt",".rodape-int",".sociais a",".email",".calibra .leg",".btn",".btn-vazio",
           ".sobre-texto p",".sobre-texto .d3",".marco .quando",".marco p",".marco h3",
           "#menu a","#menu a span",".retrato-tarja",".serv h3",".item-nome",
           ".passo b",".passo h4",".passo p",".ferramentas dt",".ferramentas dd",
           ".item-caso h4",".item-caso p",".item-caso .prova h4",".item-caso .prova p",
           ".painel-topo b",".painel .tudo-ok",".painel .nome",".painel .tipo",".painel-pe",
           ".indice .nome",".indice .oque",".indice .seta",".indice .n",".volta"];
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


const ROTAS = ["/", "/trabalho", "/servicos", "/sobre", "/contato"];

/* Abre uma rota e espera a troca assentar. Sem isto, cada medição teria de
   repetir seis linhas de setup — e a que esquecesse uma delas mediria a página
   errada sem avisar. */
async function abrir(p, rota) {
  await p.evaluate((r) => { location.hash = r === "/" ? "#/" : "#" + r; }, rota);
  await p.waitForTimeout(420);
  await p.evaluate(`document.querySelectorAll(".pagina.ativa .sobe").forEach(function(e){e.classList.add("dentro")})`);
  await p.waitForTimeout(120);
}

(async()=>{
  const b=await chromium.launch();

  /* OS DOIS TEMAS. Auditar um e chamar de auditado foi o que quase deixou
     passar o azul da marca: #1B3AE0 dá 2,2 de contraste sobre preto. Um tema
     que ninguém mediu é um tema que ninguém aprovou.
     O menu de celular é aberto à força porque ele nasce display:none e um
     querySelector nele devolveria a cor certa de um elemento que ninguém vê —
     ou nada, que é pior: o teste "passaria" por ausência. */
  for(const noite of [false,true]){
    console.log(`\n== contraste — tema ${noite?"escuro":"claro"} (AA: 4.5 normal · 3 grande) ==`);
    const p=await b.newPage({viewport:{width:1440,height:900}});
    await p.goto(U,{waitUntil:"networkidle"});
    await p.evaluate(`document.documentElement.classList.toggle("noite", ${noite})`);
    await p.waitForTimeout(2200);
    await p.evaluate(`document.documentElement.classList.add("aberto")`);
    /* Um seletor pode existir em mais de uma rota. Guarda o PIOR resultado de
       cada um: aprovar pela melhor ocorrência é escolher a medição que
       convém. */
    const pior={};
    for(const rota of ROTAS){
      await abrir(p, rota);
      const r=await p.evaluate(CONTRASTE);
      for(const x of r){ if(!pior[x.s] || x.r < pior[x.s].r) pior[x.s]={...x, rota}; }
    }
    for(const k of Object.keys(pior)){
      const x=pior[k];
      ok(x.r>=x.min, `${x.s.padEnd(30)} ${x.r.toFixed(2)}  (${x.fs}px, min ${x.min}${x.rota==="/"?"":", em "+x.rota})`);
    }
    await p.close();
  }

  console.log("\n== alvo de toque (mínimo 40px) ==");
  for(const w of [390,768,1440]){
    const p=await b.newPage({viewport:{width:w,height:900}});
    await p.goto(U,{waitUntil:"networkidle"}); await p.waitForTimeout(2200);
    const maus=[];
    for(const rota of ROTAS){
      await abrir(p, rota);
      const m=await p.evaluate(TOQUE);
      m.forEach(x=>maus.push(rota+": "+x));
    }
    /* o menu de celular também tem alvos, e ele nasce fechado */
    await p.evaluate(`document.documentElement.classList.add("aberto")`); await p.waitForTimeout(200);
    (await p.evaluate(TOQUE)).forEach(x=>maus.push("menu: "+x));
    ok(maus.length===0, `${w}px: ${maus.length?[...new Set(maus)].slice(0,6).join(", "):"nenhum abaixo de 40px"}`);
    await p.close();
  }

  /* DOIS CASOS, e eles são diferentes. Carregar já na largura é o que o
     visitante faz; redimensionar é o que acontece quando ele gira o aparelho.
     A versão anterior testava só o segundo, e por isso o `.acoes` da barra —
     que estourava 52px em 320 desde o primeiro pixel — passou batido: ao
     encolher a partir de 1440 o layout já tinha assentado de outro jeito.
     Quando falha, o teste diz QUEM vaza: sem o nome, o número manda a gente
     procurar no escuro. */
  console.log("\n== rolagem lateral (carregado já na largura, nas 5 rotas) ==");
  for(const w of [320,360,390,430,768,1024,1440,1920]){
    const p=await b.newPage({viewport:{width:w,height:900}});
    await p.goto(U,{waitUntil:"networkidle"}); await p.waitForTimeout(2000);
    let pior=0, quem=[];
    for(const rota of ROTAS){
      await abrir(p, rota);
      const r=await p.evaluate(`(function(){var lim=document.documentElement.clientWidth,fora=[];
        document.querySelectorAll(".pagina.ativa *, .barra *").forEach(function(e){var b=e.getBoundingClientRect();
          if(b.width && b.right>lim+1) fora.push(e.tagName+"."+String(e.className).slice(0,20))});
        return {o:document.documentElement.scrollWidth-lim, quem:fora.slice(0,3)}})()`);
      if(r.o>pior){ pior=r.o; quem=r.quem.map(x=>rota+" "+x); }
    }
    ok(pior===0, `${w}px -> overflow-x ${pior}px${quem.length?"  vaza: "+quem.join(", "):""}`);
    await p.close();
  }

  console.log("\n== rolagem lateral (girando o aparelho) ==");
  {
    const p=await b.newPage({viewport:{width:1440,height:900}});
    await p.goto(U,{waitUntil:"networkidle"}); await p.waitForTimeout(2200);
    for(const w of [320,390,768,1440]){
      await p.setViewportSize({width:w,height:900}); await p.waitForTimeout(400);
      const o=await p.evaluate(`document.documentElement.scrollWidth-document.documentElement.clientWidth`);
      ok(o===0, `1440 -> ${w}px: overflow-x ${o}px`);
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
    /* A URL de verdade vem daqui, não do texto do console — que às vezes não
       a traz. Sem isto o filtro de ruído é um chute sobre uma string. */
    const urlsFalhas=[];
    p.on("requestfailed",r=>urlsFalhas.push(r.url()));
    p.on("response",r=>{ if(r.status()>=400) urlsFalhas.push(r.url()); });
    await p.goto(U,{waitUntil:"networkidle"}); await p.waitForTimeout(2400);
    await p.evaluate(`window.scrollTo(0,document.body.scrollHeight)`); await p.waitForTimeout(900);
    /* RUÍDO CONHECIDO, declarado e IMPRESSO — nunca silenciado.
       A logo é servida pelo próprio pixelmartins.com. Dentro do site ela é uma
       URL do mesmo domínio e sempre resolve; no protótipo aberto do disco ela
       depende de o site estar no ar, e em 17/08/2026 ele NÃO estava. A página
       trata: o monograma desenhado assume, com a mesma largura, e a barra não
       salta. Qualquer erro que não seja esse continua reprovando.
       (Filtro que esconde é filtro que um dia engole um defeito de verdade —
       por isso a contagem aparece no relatório em vez de sumir.) */
    /* O FILTRO JULGA PELA URL, não pelo texto. O Chromium loga "Failed to load
       resource: the server responded with a status of 404 ()" SEM a URL, e um
       filtro que procurava "wp-content" na mensagem simplesmente não casava —
       o ruído conhecido voltava a reprovar como se fosse defeito novo. Só é
       perdoado se TODAS as requisições falhas forem da logo. */
    const daLogo = u => /wp-content\/uploads|pixelmartins\.com/.test(u);
    const soAlogo = urlsFalhas.length > 0 && urlsFalhas.every(daLogo);
    const deRecurso = e => /Failed to load resource/.test(e);
    const conhecidos = erros.filter(e => deRecurso(e) && soAlogo);
    const reais = erros.filter(e => !(deRecurso(e) && soAlogo));
    if (conhecidos.length) {
      console.log(`   · ruído conhecido (logo do WordPress, site fora do ar): ${conhecidos.length}`);
    }
    ok(reais.length === 0, `sem erro de console ${reais.length ? "(" + reais.join(" | ") + ")" : "(nenhum além do ruído declarado)"}`);
    await p.close();
  }

  await b.close();
  console.log(`\n${falhas.length? "REPROVOU ("+falhas.length+"):\n  \u00b7 "+falhas.join("\n  \u00b7 ") : "PASSOU"}`);
  process.exit(falhas.length?1:0);
})();
