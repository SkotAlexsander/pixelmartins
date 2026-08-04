/**
 * Acha o Playwright sem exigir instalação dentro deste repo.
 *
 * Este repo nasceu aninhado num projeto maior que já tinha o Playwright em
 * node_modules; clonado sozinho, aquele caminho não existe mais. Então aqui se
 * tenta o normal primeiro e só depois o caminho antigo — e, se não achar, a
 * mensagem diz o que fazer em vez de estourar um MODULE_NOT_FOUND cru.
 */
const path = require("path");

const CANDIDATOS = [
  "playwright",                                        // instalado neste repo ou global
  path.resolve(__dirname, "../node_modules/playwright"),
  path.resolve(__dirname, "../../../node_modules/playwright"), // repo-mãe (layout antigo)
];

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
