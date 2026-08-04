# Portfólio — pixelmartins.com

> Criado em 2026-08-02. Casa oficial do código do site pessoal do Alex Martins.
> Modularizado em 2026-08-03: o fonte agora é `src/`, o arquivo que se cola é `dist/`.

---

## O que é

Site pessoal publicado em **WordPress + Elementor Pro**. A página inteira é um
**único widget HTML** colado numa página com template "Elementor Canvas".

**Posicionamento (definido em 2026-08-01):** *"site e vídeo, feitos pela mesma
pessoa"* — o diferencial é ser as duas frentes num profissional só, com IA
acelerando o repetitivo.

**Ordem das seções:** Hero → Serviços → Projetos → Sobre → IA → Trajetória → Contato.
(A pergunta do visitante é "o que você faz por mim", não "quem é você".)

---

## Estrutura desta pasta

```text
pixelmartins-site/
├── src/               ← O FONTE. É aqui que se edita.
│   ├── html/
│   │   ├── index.html      esqueleto: a ordem da página + marcadores
│   │   ├── parciais/       fontes, fundo, navbar
│   │   └── secoes/         hero, servicos, projetos, sobre, ia,
│   │                       trajetoria, depoimentos, contato
│   ├── css/           16 arquivos — o prefixo numérico É a ordem da cascata
│   └── js/            8 módulos, cada um uma IIFE independente
├── build/build.js     junta src/ num fragmento único
├── dist/              ← GERADO. É isto que se cola no Elementor. Não editar.
├── assets/frames/     150 frames do retrato do fundo (servidos via jsDelivr)
├── backup/            cópia datada antes de cada alteração — NUNCA sobrescrever
├── dev/               ferramentas de teste local (não vão pro site)
└── docs/              decisões, estrutura, conexão com o WordPress, animação
```

**Por que src/ e dist/ separados?** O Elementor exige um fragmento único com
CSS e JS embutidos, mas 2.000 linhas num arquivo só são impossíveis de manter.
A separação vive no fonte; o build refaz o arquivo único. O porquê completo, o
mapa dos arquivos e as regras de ordem estão em
**[docs/estrutura.md](docs/estrutura.md)** — leia antes de mexer no CSS.

**Este é um repositório git próprio**, separado do repo-mãe do agente (que o
ignora via `.gitignore`). Publicado em `github.com/SkotAlexsander/pixelmartins-site`.

## Como publicar uma alteração

1. Editar o arquivo certo em **`src/`** (backup datado antes, em `backup/`).
2. `npm run checar` → build + validação sem navegador. Tem de dar **PASSOU**.
3. `npm run preview`, `npm run servir` noutra aba, `npm run verificar`
   → o teste em navegador de verdade. Também tem de dar **PASSOU**.
4. `git commit` + `git push` — isso **já atualiza os frames** servidos pelo jsDelivr.
5. Colar o conteúdo de **`dist/index-elementor.html`** no widget HTML do Elementor.

> O passo 3 precisa do Playwright (`npm i -D playwright && npx playwright install
> chromium`). Sem ele, o passo 2 sozinho já pega erro de sintaxe, tag esquecida,
> ID órfão e classe sem estilo.

> O passo 5 continua manual: o Elementor guarda a página em `_elementor_data`,
> um postmeta que a REST API não expõe. Ver [docs/conexao-wordpress.md](docs/conexao-wordpress.md).

**Regra de ouro:** antes de mexer em qualquer arquivo de `src/`, copiar o
`dist/index-elementor.html` atual pra `backup/` com data no nome
(`AAAA-MM-DD-nome.html`). O backup é a rede de segurança do que já está no ar.

---

## Pastas relacionadas (não duplicar código)

- **`projetos_futuros/portifolio web/`** — versão modular anterior (21/07/2026),
  nomeada `skot.dev`, com CSS/JS quebrados em arquivos e `_headers` de segurança.
  É o **ancestral**, não o que está no ar. A modularização dele já foi absorvida
  aqui (03/08/2026, ver `docs/estrutura.md`); **falta absorver** o `_headers` de
  segurança e o checklist — depois disso aquela pasta pode ser arquivada.
- **`codigo-atual/`** — não existe mais. Virou `src/` (fonte) + `dist/` (gerado)
  em 03/08/2026. O último monolito está em
  `backup/2026-08-03-antes-modularizar.html`.

---

## Conexão com o WordPress — o que já foi verificado

**2026-08-02 — a REST API do site está aberta e responde.**
`GET https://pixelmartins.com/wp-json/` retornou JSON válido:

- Site: "Alexsander Martins de Menezes Junior" · descrição ainda no padrão
  ("My WordPress Blog" — vale trocar).
- Namespaces ativos: `wp/v2`, `elementor/v1`, `elementor-pro/v1`,
  `elementor-one/v1`, `elementor-ai/v1`, `image-optimizer/v1`, `ea11y/v1`,
  `wp-site-health/v1`, `wp-block-editor/v1`, `oembed/1.0`, `tmpcoder/ajaxselect2`.

**O que falta pra escrever (não só ler):** uma **Senha de Aplicativo** do
WordPress (WP-Admin → Usuários → Perfil → Senhas de aplicativo), guardada num
`.env` na raiz do projeto — **nunca commitada**.

**A pegadinha do Elementor:** conteúdo de página feita no Elementor **não** fica
em `post_content`. Fica no postmeta `_elementor_data` (um JSON), que a REST API
**não expõe por padrão**. Ou seja: autenticar não basta pra atualizar o widget.
Ver `docs/conexao-wordpress.md` para as rotas possíveis e o trade-off de cada uma.

---

## Pendências conhecidas (herdadas da revisão de 01/08/2026)

- [ ] Só 1 projeto real no ar. Os cards "em breve" e a seção de depoimentos estão
      **comentados, não apagados** — voltam em um passo quando houver conteúdo real.
- [ ] Links de **GitHub e LinkedIn** ainda são `href="#"` — precisam da URL real.
- [ ] Descrição do site no WordPress ainda é "My WordPress Blog".
- [ ] Decidir a rota de deploy (ver `docs/conexao-wordpress.md`).
