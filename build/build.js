/**
 * build.js — junta src/ num único fragmento HTML: dist/index-elementor.html
 *
 * POR QUE EXISTE
 * O site é um widget HTML do Elementor: o que se cola lá tem de ser UM arquivo
 * só, com o CSS e o JS embutidos. Ter arquivos separados no ar exigiria hospedar
 * .css/.js em outro lugar e depender de terceiro para a página pintar.
 * Então a separação vive no FONTE (src/) e o build refaz o arquivo único.
 *
 * Editar: src/       ·  Colar no Elementor: dist/index-elementor.html
 *
 * USO:  node build/build.js   (ou `npm run build`)
 *
 * A ORDEM DO CSS IMPORTA (cascata). Ela está em ORDEM_CSS abaixo e é a mesma do
 * arquivo monolítico original — não reordene sem conferir o site depois.
 */

const fs = require("fs");
const path = require("path");

const RAIZ = path.resolve(__dirname, "..");
const SRC = path.join(RAIZ, "src");
const SAIDA = path.join(RAIZ, "dist", "index-elementor.html");

/* Ordem de concatenação do CSS = ordem da cascata. Base primeiro, ajustes de
   integração com o WordPress por último (precisam vencer o tema). */
const ORDEM_CSS = [
  "01-tokens-e-base.css",
  "10-regua.css",
  "15-layout.css",
  "20-navbar.css",
  "25-menu-mobile.css",
  "30-hero.css",
  "35-revelar.css",
  "50-sobre.css",
  "55-projetos.css",
  "60-ia.css",
  "65-trajetoria.css",
  "70-servicos.css",
  /* 75-depoimentos.css: fora do repo até haver um depoimento real.
     Ver privado/depoimentos/COMO-VOLTAR.md */
  "80-contato.css",
  "99-wordpress-elementor.css",
];

/* Roda antes do CSS pintar, para o modo claro não dar flash de tela preta.
   Fica num <script> próprio, no topo do fragmento. */
const JS_CRITICO = "00-tema-antiflash.js";

/* Cada um é uma IIFE independente: não compartilham variável nenhuma, então a
   ordem aqui é só de leitura — do mais estrutural (tema, menu) ao mais pesado
   (o retrato, que baixa 150 imagens). A única conversa entre módulos é o
   evento "pm-tema", que 10-tema.js dispara e 60-onda.js escuta: canvas não
   recalcula CSS sozinho quando a paleta troca. */
const ORDEM_JS = [
  "10-tema.js",
  "20-menu-mobile.js",
  "30-discord-copiar.js",
  "40-titulo-revelar.js",
  "50-revelar-ao-rolar.js",
  "60-onda.js",
  "70-regua.js",
  "80-fita.js",
  "90-retrato.js",
  "95-ano.js",
];

/* Normaliza CRLF: no Windows o checkout do git pode entregar \r\n, e a saída tem
   de sair com quebra de linha só de um tipo — o widget do Elementor guarda o
   texto como veio. */
const ler = (...p) =>
  fs.readFileSync(path.join(...p), "utf8").replace(/\r\n/g, "\n").replace(/\s+$/, "");

/** Reindenta um bloco inteiro. Linha vazia continua vazia (não vira espaço solto). */
function indentar(texto, espacos) {
  if (!espacos) return texto;
  const pad = " ".repeat(espacos);
  return texto
    .split("\n")
    .map(l => (l.trim() ? pad + l : l))
    .join("\n");
}

const BANNER = `<!-- ============================================================
  PIXELMARTINS.COM — versão para WordPress / Elementor

  ARQUIVO GERADO — NÃO EDITE ESTE ARQUIVO.
  Ele é montado a partir de src/ por \`node build/build.js\`.
  Edite src/css/, src/js/ ou src/html/ e rode o build de novo.

  COMO USAR:
  1. Crie uma página nova no WordPress
  2. Em "Editar com Elementor" > Configurações da página (engrenagem
     no canto inferior esquerdo) > Layout > Template: "Elementor Canvas"
  3. Arraste um widget "HTML" para a página
  4. Cole TODO este código dentro dele e publique
============================================================ -->`;

/* ---- Monta os blocos ---------------------------------------------------- */

const cssJunto = ORDEM_CSS.map(n => ler(SRC, "css", n)).join("\n\n");
const blocoEstilos = "<style>\n" + indentar(cssJunto, 2) + "\n</style>";

const blocoJsCritico = "<script>\n" + indentar(ler(SRC, "js", JS_CRITICO), 2) + "\n</script>";

const jsJunto = ORDEM_JS.map(n => ler(SRC, "js", n)).join("\n\n");
const blocoScripts = "<script>\n" + jsJunto + "\n</script>";

/* ---- Resolve os marcadores do esqueleto --------------------------------- */

const esqueleto = ler(SRC, "html", "index.html");
const totalParciais = (esqueleto.match(/@incluir/g) || []).length;

let saida = esqueleto
  .replace(/^([ \t]*)<!--\s*@js-critico\s*-->/m, (_, ind) => indentar(blocoJsCritico, ind.length))
  .replace(/^([ \t]*)<!--\s*@estilos\s*-->/m, (_, ind) => indentar(blocoEstilos, ind.length))
  .replace(/^([ \t]*)<!--\s*@scripts\s*-->/m, (_, ind) => indentar(blocoScripts, ind.length));

/* @incluir respeita a indentação do próprio marcador — é assim que as seções
   saem alinhadas dentro do <main> sem cada arquivo carregar indentação morta. */
saida = saida.replace(/^([ \t]*)<!--\s*@incluir\s+(\S+)\s*-->/gm, (linha, ind, rel) => {
  const arq = path.join(SRC, "html", rel);
  if (!fs.existsSync(arq)) {
    console.error(`ERRO: @incluir aponta para arquivo inexistente: src/html/${rel}`);
    process.exit(1);
  }
  return indentar(ler(arq), ind.length);
});

/* Comentário só-do-fonte: `<!--# ... -->` fica em src/ e NÃO chega ao dist.
   O dist é colado num site público — quem abre o código-fonte da página lê todo
   comentário que estiver lá. Nota de bastidor ("esta seção está desativada
   porque ainda não há cliente") não é para o visitante. Comentário normal
   (`<!-- ... -->`) continua passando: serve para orientar quem lê o código.

   Leva junto UMA linha em branco logo depois, quando houver: ela existia para
   separar a nota do que vem a seguir, e sem a nota fica órfã. Sem isso, o dist
   ganha um buraco a cada comentário removido. */
saida = saida.replace(/^[ \t]*<!--#[\s\S]*?-->[ \t]*\r?\n(?:[ \t]*\r?\n)?/gm, "");

const restante = saida.match(/<!--\s*@\w[^>]*-->/g);
if (restante) {
  console.error(`ERRO: marcador não resolvido: ${restante.join(", ")}`);
  process.exit(1);
}

const documento = BANNER + "\n\n" + saida + "\n";

fs.mkdirSync(path.dirname(SAIDA), { recursive: true });
fs.writeFileSync(SAIDA, documento, "utf8");

console.log(`dist/index-elementor.html gerado — ${(Buffer.byteLength(documento) / 1024).toFixed(1)} KB, ${documento.split("\n").length} linhas`);
console.log(`  ${ORDEM_CSS.length} arquivos de CSS · ${ORDEM_JS.length + 1} de JS · ${totalParciais} parciais de HTML`);
console.log(`Cole o conteúdo desse arquivo no widget HTML do Elementor.`);
