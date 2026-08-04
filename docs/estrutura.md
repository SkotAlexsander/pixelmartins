# Estrutura do código — por que src/ e dist/

> Modularizado em 2026-08-03. Antes disso era um arquivo só, de 2.070 linhas.
>
> Este documento é sobre **como o código é montado**. Se o que você quer é
> saber o que cada seção da página faz e quais efeitos rodam nela, o documento
> é o [secoes.md](secoes.md).

---

## O problema

O site inteiro é **um widget HTML do Elementor**. O que se cola lá tem de ser um
fragmento único, com o CSS e o JS embutidos — não dá para apontar para
`style.css` e `app.js`, porque esses arquivos não existem dentro do WordPress.

Só que editar 2.070 linhas de HTML+CSS+JS misturados num arquivo só é ruim:
achar a regra da navbar exige rolar 300 linhas, e qualquer alteração arrisca
mexer no que não devia.

**As duas exigências brigam:** o fonte quer ser separado, o produto final tem
de ser único.

## A solução

Separar no **fonte** e juntar no **build**.

```text
src/     ← é isto que você edita
  ↓  node build/build.js
dist/    ← é isto que você cola no Elementor (arquivo gerado)
```

Nada de dependência nova, nada de bundler, nada de `node_modules`. O build é um
script de ~120 linhas que concatena texto e resolve marcadores.

**Por que não hospedar o CSS/JS num CDN e linkar?** Porque a página passaria a
depender de um terceiro para pintar: se o jsDelivr cair ou demorar, o site fica
sem estilo na frente do visitante. Os frames do retrato podem depender do CDN
(são enfeite, e há fallback); o CSS da página, não.

---

## O mapa

```text
src/
├── html/
│   ├── index.html            ← ESQUELETO: a ordem da página e os marcadores
│   ├── parciais/             fontes (Google Fonts), fundo (canvas), navbar
│   └── secoes/               hero, servicos, projetos, sobre, ia,
│                             trajetoria, contato
├── css/                      15 arquivos, com prefixo numérico = ordem da cascata
└── js/                       8 módulos, cada um uma IIFE independente

build/build.js                junta tudo
dist/index-elementor.html     GERADO — não edite
```

### O esqueleto e os marcadores

`src/html/index.html` não tem conteúdo: tem a ordem da página e os marcadores
que o build substitui.

| Marcador | Vira |
|---|---|
| `<!-- @js-critico -->` | `<script>` com `js/00-tema-antiflash.js` |
| `<!-- @estilos -->` | `<style>` com os 15 CSS na ordem de `ORDEM_CSS` |
| `<!-- @incluir secoes/hero.html -->` | o conteúdo do arquivo |
| `<!-- @scripts -->` | `<script>` com os 7 módulos de `ORDEM_JS` |
| `<!--# nota interna -->` | **nada** — some no build |

`@incluir` **respeita a indentação do próprio marcador**. Por isso os arquivos
de `secoes/` começam na coluna 0 e mesmo assim saem alinhados dentro do
`<main>` — nenhum arquivo carrega indentação morta.

`<!--# ... -->` existe porque aqui **tudo é público duas vezes**: o fonte, no
GitHub, e o `dist`, no código-fonte da página no ar. Nota do tipo "esta seção
está desativada porque ainda não há cliente" não deveria viajar para nenhum dos
dois. Comentário normal continua passando — ele orienta quem lê o código, e isso
é bom.

### CSS: o prefixo numérico é a cascata

`01-tokens-e-base` → `10-fundo` → `15-layout` → `20-navbar` →
`25-menu-mobile` → `30-hero` → `35-revelar` → `40-titulo-secao` →
`50-sobre` → `55-projetos` → `60-ia` → `65-trajetoria` → `70-servicos` →
`80-contato` → `99-wordpress-elementor`

(O `75-depoimentos` não está aqui de propósito: a seção saiu do repositório
até haver um depoimento real, com CSS e tudo. O número segue reservado.)

A ordem é **exatamente a do arquivo monolítico anterior** — foi preservada de
propósito, para a modularização não mudar um pixel do site. Não reordene sem
conferir o site depois; CSS é sensível a ordem.

Os buracos entre os números (05, 45, 90…) são espaço para crescer sem renomear
o que já existe. O `99-wordpress-elementor` é último porque precisa vencer o
tema do WordPress.

### JS: cada módulo é uma ilha

| Arquivo | O que faz |
|---|---|
| `00-tema-antiflash.js` | lê o tema salvo **antes do CSS pintar** (por isso vai num `<script>` próprio, no topo) |
| `10-tema.js` | botão claro/escuro |
| `20-menu-mobile.js` | abre/fecha, Escape, clique fora, volta ao desktop |
| `30-discord-copiar.js` | copia o usuário do Discord |
| `40-typewriter.js` | o título do hero sendo digitado |
| `50-revelar-ao-rolar.js` | `IntersectionObserver` que revela as seções |
| `60-particulas.js` | campo de partículas do fundo |
| `70-retrato-scroll.js` | o retrato de 150 frames (ver [animacao-scroll.md](animacao-scroll.md)) |

Antes eram todos uma IIFE gigante compartilhando variáveis. Agora **cada um é
uma IIFE fechada, sem nenhuma variável em comum** — o preço é que os três que
precisam de `prefers-reduced-motion` consultam a media query cada um por si
(três chamadas de `matchMedia`, custo irrelevante). O ganho é que mexer num
módulo não pode quebrar outro.

Por isso a ordem de `ORDEM_JS` é só de leitura: não há dependência entre eles.

---

## Como se trabalha agora

```bash
npm run build      # src/ → dist/
npm run checar     # build + validação SEM navegador — é o mínimo antes de commitar
npm run preview    # build + gera preview.html na raiz
npm run servir     # python -m http.server 8099  (noutra aba)
npm run verificar  # Playwright: PASSOU/REPROVOU
```

O `npm run checar` existe por causa desta reestruturação: com o HTML, o CSS e o
JS em pastas diferentes, os erros novos são de *costura* — uma tag esquecida no
fim de uma parcial, um ID renomeado só de um lado, um arquivo de CSS que ficou
de fora do `ORDEM_CSS`. Ele confere exatamente isso, e não precisa de navegador
nem de instalar nada.

O `dev/montar-preview.js` lê **dist/**, não `src/` — de propósito: o preview
tem de testar exatamente o que vai ser colado no Elementor, não uma versão
paralela.

**`dist/` é commitado**, ainda que seja arquivo gerado. Duas razões: dá para
copiar o código direto do GitHub sem ter Node instalado, e o histórico do git
mostra o efeito real de cada mudança no que foi pro ar.

---

## O que continua igual

- **Backup datado antes de mexer** em qualquer fonte (`backup/AAAA-MM-DD-nome.html`).
- **A publicação continua manual:** copiar `dist/index-elementor.html` e colar no
  widget. O Elementor guarda a página num postmeta que a REST API não expõe por
  padrão — as rotas possíveis estão em `privado/conexao-wordpress.md`, fora
  deste repositório.
- Os frames em `assets/frames/` não se mexeram — o link do jsDelivr no
  `70-retrato-scroll.js` continua válido.
