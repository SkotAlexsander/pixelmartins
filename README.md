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
│   │                       trajetoria, contato
│   ├── css/           15 arquivos — o prefixo numérico É a ordem da cascata
│   └── js/            8 módulos, cada um uma IIFE independente
├── build/build.js     junta src/ num fragmento único
├── dist/              ← GERADO. É isto que se cola no Elementor. Não editar.
├── assets/frames/     150 frames do retrato do fundo (servidos via jsDelivr)
├── backup/            cópia datada antes de cada alteração — NUNCA sobrescrever
├── dev/               ferramentas de teste local (não vão pro site)
├── docs/              estrutura do código e a animação do retrato
└── privado/           notas internas — no .gitignore, não vem no clone
```

**Por que src/ e dist/ separados?** O Elementor exige um fragmento único com
CSS e JS embutidos, mas 2.000 linhas num arquivo só são impossíveis de manter.
A separação vive no fonte; o build refaz o arquivo único.

Dois documentos, e a diferença entre eles é o que você está tentando fazer:

| Se você quer saber | Leia |
|---|---|
| como o código é montado, e por que a ordem do CSS importa | **[docs/estrutura.md](docs/estrutura.md)** — antes de mexer no CSS |
| o que cada seção faz, quais efeitos rodam nela e qual arquivo abrir para mudar X | **[docs/secoes.md](docs/secoes.md)** — antes de mexer no conteúdo |
| como funciona o retrato de 150 frames no fundo | **[docs/animacao-scroll.md](docs/animacao-scroll.md)** |

Cada arquivo de `src/html/` também abre com um resumo do que ele é e de quais
efeitos o tocam. Esses cabeçalhos usam `<!--# ... -->`, o comentário
só-do-fonte: o build os remove, então explicar bastante ali não pesa no site.

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

> O passo 5 continua manual: o Elementor guarda a página num postmeta que a REST
> API não expõe por padrão, então não há como publicar por script sem mexer no
> servidor. As rotas possíveis estão em `privado/conexao-wordpress.md`.

**Regra de ouro:** antes de mexer em qualquer arquivo de `src/`, copiar o
`dist/index-elementor.html` atual pra `backup/` com data no nome
(`AAAA-MM-DD-nome.html`). O backup é a rede de segurança do que já está no ar.

---

## Notas internas ficam fora deste repositório

Este repo é **público** — e por ora precisa ser: o jsDelivr só serve repositório
público, e é ele que entrega os frames do retrato do fundo enquanto eles não
sobem para o WordPress.

Então tudo que é escrito para dentro — pendências, levantamento do servidor,
rascunho de seção — mora em `privado/`, que está no `.gitignore` e nunca é
commitado. Se você clonou este repositório, essa pasta não vem junto: ela é só
da máquina de quem mantém o site.

No código vale a mesma regra: **`<!--# ... -->` é comentário só-do-fonte** — o
build o remove, então ele não chega ao `dist` nem ao código-fonte da página no
ar. Comentário normal (`<!-- ... -->`) continua passando.

---

## Ancestral (não duplicar código)

**`projetos_futuros/portifolio web/`** — versão modular anterior (21/07/2026),
nomeada `skot.dev`, com CSS/JS quebrados em arquivos e `_headers` de segurança.
É o **ancestral**, não o que está no ar. A modularização dele já foi absorvida
aqui (03/08/2026, ver [docs/estrutura.md](docs/estrutura.md)).
