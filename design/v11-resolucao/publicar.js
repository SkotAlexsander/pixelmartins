/**
 * publicar.js — gera o index.html da RAIZ, que é o que o GitHub Pages serve.
 *
 * POR QUE GERAR E NÃO COPIAR: copiar cria dois arquivos iguais e, na primeira
 * pressa, um deles fica para trás — e aí o site no ar passa a mentir em algum
 * canto sem ninguém perceber. O fonte é um só (este diretório); a raiz é saída.
 *
 * O QUE MUDA DO FONTE PARA O PUBLICADO, e cada um tem motivo:
 *
 *   1. O <title> e a descrição deixam de dizer "proposta". No Pages isto não é
 *      mais um estudo: é o site que a pessoa encontra no Google.
 *   2. Entram as tags de compartilhamento (Open Graph). Sem elas, o link colado
 *      no WhatsApp aparece como uma linha crua de URL — e é assim que um
 *      portfólio circula.
 *   3. A logo passa a sair do PRÓPRIO repositório quando existir lá. Servida
 *      pelo pixelmartins.com, ela dependeria de um site que em 17/08/2026
 *      estava fora do ar — publicar uma página cuja marca depende de outro
 *      servidor é herdar a queda dele.
 *
 * Uso: node design/v11-resolucao/publicar.js
 */
const fs = require("fs");
const path = require("path");

const AQUI = __dirname;
const RAIZ = path.resolve(AQUI, "../..");
const FONTE = path.join(AQUI, "index.html");
const SAIDA = path.join(RAIZ, "index.html");
const LOGO_LOCAL = path.join(RAIZ, "assets", "logo.png");

let t = fs.readFileSync(FONTE, "utf8");
const trocas = [];

/* ---- 1. identidade da página ---------------------------------------------- */
const TITULO = "Alex Martins — desenvolvedor · pixelmartins";
const DESC = "Sites, landing pages e aplicativos que instalam no celular. " +
             "Entregues no ar, testados e com o código aberto. Porto Alegre, remoto.";
const URL_SITE = "https://skotalexsander.github.io/pixelmartins/";

const tituloVelho = t.match(/<title>[\s\S]*?<\/title>/);
if (!tituloVelho) { console.error("não achei o <title>"); process.exit(1); }
t = t.replace(tituloVelho[0], `<title>${TITULO}</title>`);
trocas.push("título");

/* O roteador troca o document.title a cada rota, e o dele para "/" precisa
   bater com o <title> estático — um nome para o robô e outro para a pessoa é
   incoerência que aparece no histórico do navegador. */
const rotaHome = t.match(/"\/":\s*"[^"]*"/);
if (!rotaHome) { console.error("não achei o título da rota / no roteador"); process.exit(1); }
t = t.replace(rotaHome[0], `"/":         "${TITULO}"`);
trocas.push("título da home no roteador");

const descVelha = t.match(/<meta name="description"[^>]*>/);
if (!descVelha) { console.error("não achei a description"); process.exit(1); }
t = t.replace(descVelha[0], `<meta name="description" content="${DESC}">`);
trocas.push("descrição");

/* ---- 2. compartilhamento --------------------------------------------------- */
const SOCIAL = `
<link rel="canonical" href="${URL_SITE}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="pixelmartins">
<meta property="og:locale" content="pt_BR">
<meta property="og:url" content="${URL_SITE}">
<meta property="og:title" content="${TITULO}">
<meta property="og:description" content="${DESC}">
<meta name="twitter:card" content="summary">
<meta name="twitter:title" content="${TITULO}">
<meta name="twitter:description" content="${DESC}">
<meta name="theme-color" content="#EDEDF0" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#0C0D10" media="(prefers-color-scheme: dark)">
<meta name="author" content="Alex Martins">
`;
t = t.replace(`<title>${TITULO}</title>`, `<title>${TITULO}</title>${SOCIAL}`);
trocas.push("Open Graph");

/* ---- 3. a logo, se ela existir no repositório ------------------------------ */
const temLogoLocal = fs.existsSync(LOGO_LOCAL);
if (temLogoLocal) {
  t = t.replace(/src="https:\/\/pixelmartins\.com\/wp-content\/uploads\/[^"]*"/,
                'src="assets/logo.png"');
  trocas.push("logo local");
} else {
  /* Sem o arquivo, a página fica com o monograma desenhado — que é o
     comportamento já testado. O aviso é para quem gerar, não para o
     visitante: ele não vê defeito nenhum, vê um monograma. */
  console.warn("⚠  assets/logo.png não existe: a página vai usar o monograma desenhado.");
  console.warn("   Para trocar, ponha o arquivo lá e rode isto de novo.");
}

/* ---- 4. o carimbo de gerado ------------------------------------------------ */
const CABECA = `<!-- ═══════════════════════════════════════════════════════════════════════
     GERADO por design/v11-resolucao/publicar.js — NÃO EDITE ESTE ARQUIVO.
     O fonte é design/v11-resolucao/index.html. Editar aqui é perder o
     trabalho na próxima publicação, sem aviso.
     ═══════════════════════════════════════════════════════════════════════ -->
`;
t = t.replace(/^<!DOCTYPE html>\s*/i, "<!DOCTYPE html>\n" + CABECA);

fs.writeFileSync(SAIDA, t, "utf8");

const kb = n => (n / 1024).toFixed(1) + " KB";
console.log(`index.html na raiz — ${kb(t.length)}`);
console.log(`  aplicado: ${trocas.join(" · ")}`);
console.log(`  endereço: ${URL_SITE}`);
