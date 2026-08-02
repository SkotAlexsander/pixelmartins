/**
 * montar-preview.js — embrulha o fragmento do Elementor num documento HTML
 * completo para dar pra abrir no navegador e testar.
 *
 * O arquivo de codigo-atual/ é um FRAGMENTO (sem <html>/<head>/<body>), porque
 * é isso que se cola no widget HTML do Elementor. Ele sozinho não renderiza
 * igual ao site. Este script recria o mínimo do que o WordPress põe em volta.
 *
 * USO:  node dev/montar-preview.js
 * SAÍDA: preview.html na raiz do projeto (fica ao lado de assets/, então o
 *        caminho relativo dos frames bate com o do widget).
 */

const fs = require("fs");
const path = require("path");

const RAIZ = path.resolve(__dirname, "..");
const FONTE = path.join(RAIZ, "codigo-atual", "index-elementor.html");
const SAIDA = path.join(RAIZ, "preview.html");

const fragmento = fs.readFileSync(FONTE, "utf8");

const documento = `<!DOCTYPE html>
<html lang="pt-BR" class="dark">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>pixelmartins.com — preview local</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
<style>
  /* O tema "Elementor Canvas" zera margens do body — replicado aqui */
  html, body { margin: 0; padding: 0; }
</style>
</head>
<body>
${fragmento}
</body>
</html>
`;

fs.writeFileSync(SAIDA, documento, "utf8");
console.log(`preview.html gerado (${(documento.length / 1024).toFixed(1)} KB)`);
console.log(`Servir com:  python -m http.server 8080  (na pasta ${RAIZ})`);
