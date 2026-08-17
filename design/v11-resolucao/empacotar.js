/**
 * empacotar.js — transforma o protótipo standalone no FRAGMENTO que se cola
 * no widget HTML do Elementor, e monta um preview que simula o WordPress em
 * volta dele.
 *
 * POR QUE ISTO EXISTE, e não é só "copiar o body":
 * o widget do Elementor recebe um pedaço de HTML que vai parar DENTRO de uma
 * página que já tem <html>, <head>, <body> e um tema com CSS próprio. Duas
 * consequências, e as duas mordem:
 *
 *   1. Todo seletor de ELEMENTO NU (body, a, h1, img, *) deixa de valer só
 *      para esta página e passa a valer para o site inteiro — menu do tema,
 *      rodapé, tudo. Um `a{color:inherit}` solto apaga a cor de todos os links
 *      do WordPress. Por isso o conteúdo vai dentro de #pm e esses seletores
 *      são reescritos com o prefixo.
 *   2. O que precisa continuar no DOCUMENTO — :root, html.noite, html.aberto,
 *      scroll-padding-top — NÃO pode ser prefixado, senão para de funcionar:
 *      a classe do tema mora no <html>, que está fora de #pm.
 *
 * Saída: fragmento.html (o que se cola) e preview-wp.html (para conferir).
 * Uso:   node design/v11-resolucao/empacotar.js
 */
const fs = require("fs");
const path = require("path");

const AQUI = __dirname;
const FONTE = path.join(AQUI, "index.html");
const FRAGMENTO = path.join(AQUI, "fragmento.html");
const PREVIEW = path.join(AQUI, "preview-wp.html");

const doc = fs.readFileSync(FONTE, "utf8");

/* ---- as três partes ------------------------------------------------------ */
const css = (doc.match(/<style>([\s\S]*?)<\/style>/) || [, ""])[1];
const js = [...doc.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]).join("\n");
const fontes = (doc.match(/<link[^>]+fonts\.googleapis[^>]*>/) || [""])[0];
let corpo = (doc.match(/<body>([\s\S]*?)<\/body>/) || [, ""])[1];
corpo = corpo.replace(/<script>[\s\S]*?<\/script>/g, "").trim();

if (!css || !js || !corpo) {
  console.error("Não achei style, script ou body em index.html. Parando antes de gerar lixo.");
  process.exit(1);
}

/* ---- o CSS: escopar o que é global, preservar o que é do documento -------
   Lista explícita em vez de regex esperta. Regex sobre seletor de CSS erra em
   silêncio, e o erro só aparece no site do cliente. */
const TROCAS = [
  ["*,*::before,*::after{box-sizing:border-box}",
   "#pm,#pm *,#pm *::before,#pm *::after{box-sizing:border-box}"],
  ["body{\n  margin:0; background:var(--sala); color:var(--tinta);",
   "#pm{\n  margin:0; background:var(--sala); color:var(--tinta);"],
  ["h1,h2,h3,h4,p,ul,ol,figure,dl,dd{margin:0}",
   "#pm h1,#pm h2,#pm h3,#pm h4,#pm p,#pm ul,#pm ol,#pm figure,#pm dl,#pm dd{margin:0}"],
  ["img,canvas,svg{display:block;max-width:100%}",
   "#pm img,#pm canvas,#pm svg{display:block;max-width:100%}"],
  ["a{color:inherit;text-decoration:none}",
   "#pm a{color:inherit;text-decoration:none}"],
  [":focus-visible{ outline:2px solid var(--marca); outline-offset:3px; border-radius:2px }",
   "#pm :focus-visible{ outline:2px solid var(--marca); outline-offset:3px; border-radius:2px }"],
  ["  *,*::before,*::after{ animation-duration:.01ms !important; transition-duration:.01ms !important }",
   "  #pm *,#pm *::before,#pm *::after{ animation-duration:.01ms !important; transition-duration:.01ms !important }"],
];

let cssSaida = css;
const naoAchados = [];
for (const [de, para] of TROCAS) {
  if (!cssSaida.includes(de)) { naoAchados.push(de.slice(0, 52)); continue; }
  cssSaida = cssSaida.split(de).join(para);
}
if (naoAchados.length) {
  console.error("PAREI: estes seletores mudaram no index.html e a troca não bate mais.");
  console.error("Se eles forem colados sem prefixo, vazam para o site inteiro do WordPress.\n");
  naoAchados.forEach(s => console.error("   · " + s));
  process.exit(1);
}

/* O tema Elementor Canvas zera o body, mas o tema normal não. Estas quatro
   linhas defendem o fragmento do CSS do tema sem tocar em nada fora dele. */
const DEFESA = `
/* ---- defesa contra o CSS do tema do WordPress ---------------------------- */
#pm{ isolation:isolate; overflow-x:clip }
#pm ul{ list-style:none; padding:0 }
#pm p, #pm li{ text-transform:none; letter-spacing:normal }
#pm .btn, #pm .quadrado{ box-shadow:none; text-decoration:none }
`;

const fragmento = `<!-- ═══════════════════════════════════════════════════════════════════════
     pixelmartins.com — direção RESOLUÇÃO (v11)
     GERADO por design/v11-resolucao/empacotar.js — não editar à mão.
     O fonte é design/v11-resolucao/index.html.

     Cole ISTO num widget HTML do Elementor, numa página com o template
     "Elementor Canvas". Tudo mora dentro de #pm; nada aqui altera o resto
     do site.
     ═══════════════════════════════════════════════════════════════════════ -->
${fontes}
<style>
${cssSaida}${DEFESA}</style>

<div id="pm">
${corpo}
</div>

<script>
${js}
</script>
`;

fs.writeFileSync(FRAGMENTO, fragmento, "utf8");

/* ---- preview que SIMULA o WordPress em volta -----------------------------
   Não basta abrir o fragmento sozinho: sozinho ele funciona. O que quebra é o
   convívio. Este preview põe em volta o que um tema típico traz — margem no
   body, estilos de link, tipografia própria e um cabeçalho — para que o teste
   veja o mesmo que o visitante veria. */
const preview = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>pixelmartins — fragmento dentro de um WordPress simulado</title>
<style>
  /* o "tema" de mentira: agressivo de propósito, para o teste ser honesto */
  body{ margin:0; font-family:Georgia,serif; background:#fff; color:#222; line-height:1.5 }
  a{ color:#c00; text-decoration:underline }
  h1,h2,h3,h4{ font-family:Georgia,serif; margin:1em 0; letter-spacing:.02em }
  p,li{ margin:1em 0 }
  ul{ padding-inline-start:2em }
  img,canvas,svg{ max-width:none }
  .tema-topo{ background:#222; color:#fff; padding:10px 16px; font-size:13px }
</style>
</head>
<body>
<div class="tema-topo">isto é o tema do WordPress, e não deve mudar nada dentro do widget</div>
${fragmento}
<div class="tema-topo">rodapé do tema — os links aqui têm de continuar vermelhos e sublinhados</div>
</body>
</html>
`;
fs.writeFileSync(PREVIEW, preview, "utf8");

const kb = n => (n / 1024).toFixed(1) + " KB";
console.log(`fragmento.html   ${kb(fragmento.length)}  ← é ISTO que se cola no Elementor`);
console.log(`preview-wp.html  ${kb(preview.length)}  ← abra para conferir o convívio com o tema`);
console.log(`  CSS ${kb(cssSaida.length)} · JS ${kb(js.length)} · marcação ${kb(corpo.length)}`);
