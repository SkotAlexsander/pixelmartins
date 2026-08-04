/**
 * checar-build.js — confere o dist/ recém-montado SEM precisar de navegador.
 *
 * Não substitui o verificar-animacao.js (só um navegador prova que a animação
 * roda). O que este pega é o que o build pode quebrar ao juntar os arquivos:
 * JS que não compila, tag esquecida numa parcial, marcador não resolvido, ou
 * uma classe/ID que ficou órfão porque o HTML e o CSS foram para arquivos
 * diferentes e só um deles foi editado.
 *
 * USO:  node dev/checar-build.js   (ou `npm run checar`)
 * EXIT: 0 = passou · 1 = reprovou
 */

const fs = require("fs");
const vm = require("vm");
const path = require("path");

const DIST = path.resolve(__dirname, "../dist/index-elementor.html");

if (!fs.existsSync(DIST)) {
  console.error("dist/index-elementor.html não existe. Rode antes:  node build/build.js");
  process.exit(1);
}

const html = fs.readFileSync(DIST, "utf8");

let falhas = 0;
const ok = (b, msg) => { console.log(`${b ? "  ok  " : " FALHA"}  ${msg}`); if (!b) falhas++; };

/* 1. Todo <script> tem de compilar. Pega erro de sintaxe introduzido na junção
      (uma IIFE sem fechar derruba TODOS os módulos seguintes, não só o dela). */
const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]);
console.log(`Blocos <script>: ${scripts.length}`);
scripts.forEach((s, i) => {
  try { new vm.Script(s); ok(true, `script #${i + 1} compila (${s.split("\n").length} linhas)`); }
  catch (e) { ok(false, `script #${i + 1}: ${e.message}`); }
});

/* 2. Balanço de tags. Cada seção mora num arquivo próprio agora — uma tag
      esquecida no fim de uma parcial só aparece depois de juntar. */
const semCodigo = html
  .replace(/<script>[\s\S]*?<\/script>/g, "")
  .replace(/<style>[\s\S]*?<\/style>/g, "")
  .replace(/<!--[\s\S]*?-->/g, "");
for (const tag of ["div", "section", "header", "main", "nav", "ul", "li", "button", "a", "p", "svg"]) {
  const abre = (semCodigo.match(new RegExp(`<${tag}[\\s>]`, "g")) || []).length;
  const fecha = (semCodigo.match(new RegExp(`</${tag}>`, "g")) || []).length;
  ok(abre === fecha, `<${tag}> ${abre} aberto / ${fecha} fechado`);
}

/* 3. Todo getElementById do JS tem de achar o elemento — o JS e o HTML dele
      estão em pastas diferentes, então renomear um ID e esquecer o outro é fácil. */
const ids = new Set([...html.matchAll(/\sid="([^"]+)"/g)].map(m => m[1]));
for (const u of new Set([...html.matchAll(/getElementById\("([^"]+)"\)/g)].map(m => m[1]))) {
  ok(ids.has(u), `getElementById("${u}") existe no HTML`);
}

/* 4. CSS: chaves balanceadas (um arquivo cortado no lugar errado quebra tudo
      que vem depois na cascata). */
const css = [...html.matchAll(/<style>([\s\S]*?)<\/style>/g)].map(m => m[1]).join("\n");
const semComentario = css.replace(/\/\*[\s\S]*?\*\//g, "");
const abertas = (semComentario.match(/{/g) || []).length;
ok(abertas === (semComentario.match(/}/g) || []).length, `chaves do CSS balanceadas (${abertas})`);

/* 5. Nenhum marcador de build sobrou (marcador escrito errado passa batido
      pelo build e vai parar no site como comentário HTML). */
ok(!/@incluir|@estilos|@scripts|@js-critico/.test(html), "nenhum marcador de build sobrou");

/* 5b. Nenhum comentário só-do-fonte vazou. O dist vai pro site no ar: quem abre
       o código-fonte da página lê tudo que estiver em <!-- -->. */
ok(!html.includes("<!--#"), "nenhum comentário só-do-fonte (<!--#) vazou pro dist");

/* 6. Classe usada no HTML sem regra no CSS = arquivo de CSS que ficou de fora
      da ORDEM_CSS do build, ou seção colada sem o estilo dela. */
const classes = new Set();
for (const m of html.matchAll(/\sclass="([^"]+)"/g)) m[1].split(/\s+/).forEach(c => c && classes.add(c));
const orfas = [...classes].filter(c => !css.includes("." + c));
ok(orfas.length === 0, `classes sem regra no CSS: ${orfas.length ? orfas.join(", ") : "nenhuma"}`);

console.log(`\n${falhas === 0 ? "PASSOU" : "REPROVOU (" + falhas + (falhas === 1 ? " falha)" : " falhas)")}`);
process.exit(falhas === 0 ? 0 : 1);
