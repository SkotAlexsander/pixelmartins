/**
 * Acha o Playwright sem exigir instalação dentro deste repo.
 *
 * Este repo nasceu aninhado num projeto maior que já tinha o Playwright em
 * node_modules; clonado sozinho, aquele caminho não existe mais. Então aqui se
 * tenta o normal primeiro e só depois o caminho antigo — e, se não achar, a
 * mensagem diz o que fazer em vez de estourar um MODULE_NOT_FOUND cru.
 */
const path = require("path");

/* PLAYWRIGHT_DIR vem primeiro e existe para o caso real desta máquina: o
   Playwright está instalado noutro projeto e este repo não precisa baixar
   ~120 MB de Chromium só para rodar a bancada uma vez.

     PLAYWRIGHT_DIR="C:\...\outro-projeto\node_modules\playwright" npm run verificar

   É variável de ambiente, e não caminho no código, de propósito: caminho
   absoluto de uma máquina dentro de repositório público quebra no clone de
   qualquer outra pessoa — e quebra em silêncio, porque o require só falha
   quando alguém roda a verificação. */
const CANDIDATOS = [
  process.env.PLAYWRIGHT_DIR,
  "playwright",                                        // instalado neste repo ou global
  path.resolve(__dirname, "../node_modules/playwright"),
  path.resolve(__dirname, "../../../node_modules/playwright"), // repo-mãe (layout antigo)
].filter(Boolean);

let achado = null;
for (const c of CANDIDATOS) {
  try { achado = require(c); break; } catch (e) {}
}

if (achado) {
  module.exports = achado;
} else {
  console.error(
    "Playwright não encontrado. Os checadores de navegador precisam dele:\n" +
    "  npm i -D playwright && npx playwright install chromium\n\n" +
    "Sem navegador, dá para validar o build assim (não precisa de nada):\n" +
    "  node dev/checar-build.js"
  );
  process.exit(1);
}
