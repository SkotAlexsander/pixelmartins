# As seções da página e os efeitos de cada uma

> Escrito em 2026-08-03. Complementa [estrutura.md](estrutura.md): lá está *como
> o código é montado*, aqui está *o que cada pedaço faz na tela*.

Se você abriu este arquivo para mexer em alguma coisa, vá direto na tabela do
fim — ela diz qual arquivo abrir para cada mudança.

---

## A ordem da página, e por que ela é essa

**Hero → Serviços → Projetos → Sobre → IA → Trajetória → Contato**

A ordem foi decidida em 01/08/2026 e não é a ordem "natural" de um portfólio
(que costuma ser Sobre logo depois do Hero). O motivo:

> A primeira pergunta do visitante é **"o que você faz por mim"**, não **"quem
> é você"**.

Por isso Serviços vem em segundo e Sobre só em quarto — depois de o visitante
já saber o que pode contratar e já ter visto trabalho. "Sobre" deixa de ser
apresentação e vira confirmação.

A ordem vive num lugar só: `src/html/index.html`. Trocar duas seções de lugar é
trocar duas linhas ali. O CSS não se importa — nenhuma seção depende de vir
depois de outra.

---

## O fundo: sete camadas fixas atrás de tudo

Antes das seções, o que está atrás delas. Todas moram em
`src/html/parciais/fundo.html` e são um bloco `position: fixed` com
`z-index: -10` e `pointer-events: none` — não rolam com a página e nunca
interceptam clique.

Da mais atrás para a mais à frente:

| # | Camada | O que é | Onde se mexe |
|---|---|---|---|
| 1 | `#portrait-canvas` | seu retrato, 150 frames dirigidos pelo scroll | `js/70-retrato-scroll.js` · [animacao-scroll.md](animacao-scroll.md) |
| 2 | `.bg-blob-1` | brilho ciano grande no topo, com deriva lenta de 14 s | `css/10-fundo.css` · animação em `01-tokens-e-base.css` |
| 3 | `.bg-blob-2` | brilho menor no canto inferior direito, parado | `css/10-fundo.css` |
| 4 | `#bg-canvas` | campo de partículas ligadas por linhas | `js/60-particulas.js` |
| 5 | `.bg-dots` | grade de pontos de 20 px, contínua | `css/10-fundo.css` |
| 6 | `.noise-layer` | ruído sutil, tira o aspecto "gradiente de banco de imagem" | `css/01-tokens-e-base.css` |
| 7 | `.bg-vignette` | vinheta que escurece as bordas e centraliza o olho | `css/10-fundo.css` |

**A ordem é a ordem no HTML.** Não há `z-index` entre elas: quem vem depois
fica na frente. Mover uma linha no `fundo.html` muda a pilha.

**Por que o retrato é o primeiro filho:** para ficar atrás de todas as outras.
Ele é foto — sem os pontos, o ruído e a vinheta por cima, competiria com o
texto em vez de ambientar.

---

## Seção por seção

### 1. Hero — `secoes/hero.html`

A primeira tela. Tem **um fundo próprio** por cima do fundo global: o
`.hero-dark-bg`, com cinco faixas de luz diagonais, textura, pontos e um
brilho superior. Ele é o véu que segura o retrato (`--hero-veil: 0.70`) — por
isso ali o retrato pode aparecer mais forte que no resto da página.

O efeito principal é o **texto sendo digitado**: 4 segundos, começando 300 ms
depois de a página abrir.

E ele comanda três coisas ao terminar — este é o detalhe que passa
despercebido e é o que dá o ritmo da abertura:

| Ao acabar de digitar | O que acontece |
|---|---|
| `#caret` | para de piscar |
| `#scroll-indicator` | aparece e começa a pular |
| `#navbar` | **só então aparece** |

Ou seja: a barra de navegação não está lá desde o início. Ela entra quando a
frase termina, junto com o convite para rolar. A primeira tela é só a frase.

> **Acessibilidade:** a frase existe duas vezes no HTML. Uma em `.sr-only`,
> completa e imediata, para leitor de tela; a outra é a animada, marcada com
> `aria-hidden`. Sem isso, quem usa leitor de tela ouviria a frase sendo
> soletrada letra a letra.

**Para trocar a frase:** `HERO_TEXT` em `js/40-typewriter.js` **e** o texto do
`.sr-only` em `hero.html`. São dois lugares — se mudar só um, o site diz uma
coisa e o leitor de tela diz outra.

### 2. Serviços — `secoes/servicos.html`

Três cartões (Sites, Vídeo, IA) e, embaixo, os quatro passos do processo
(Briefing → Proposta → Produção → Entrega).

É a seção que responde "o que eu compro de você". Os cartões entram **em
cascata** — 0,10 s, 0,18 s e 0,26 s de atraso — e não juntos. Três coisas
aparecendo ao mesmo tempo o olho lê como um bloco; em cascata, ele lê como
três.

O bloco do processo existe para uma objeção específica: *"e depois que eu
contratar, eu fico sem notícia?"*. Daí os textos serem sobre previsibilidade
("sem surpresa depois", "nada de sumir por semanas") e não sobre técnica.

### 3. Projetos — `secoes/projetos.html`

Hoje: **um** projeto real (Explorador do Sistema Solar).

O CSS trata esse caso de propósito. Com um card só, ele **não** fica espremido
no primeiro terço da grade — e volta sozinho ao layout de 3 colunas quando
entrar o segundo. Está em `css/55-projetos.css`, e é a razão de a seção não
parecer vazia mesmo tendo um item.

Os dois cards "Próximo projeto" saíram do repositório (estão em
`privado/projetos-placeholder/`). O CSS deles ficou.

### 4. Sobre — `secoes/sobre.html`

Um parágrafo de apresentação com uma frase destacada em `.highlight`, e quatro
cartões de capacidade (front-end, vídeo, IA, motion).

Vem **depois** de Projetos por decisão de ordem: quando o visitante chega aqui,
ele já viu o que você entrega. Serve para confirmar, não para se apresentar.

### 5. IA & automação — `secoes/ia.html`

Duas colunas: texto com etiquetas à esquerda, um **terminal falso** à direita.

O terminal é o único elemento decorativo da página que imita interface. Tem os
três pontinhos do topo e um cursor que pisca — reaproveitando a mesma classe
`.caret-blink` do cursor do hero. Uma animação, dois usos.

É uma seção curta de propósito: "uso IA no processo" é uma afirmação que se
enfraquece quanto mais você explica.

### 6. Trajetória — `secoes/trajetoria.html`

Linha do tempo de três marcos, **em ordem inversa**: Hoje → A virada → O
começo.

Inversa porque o visitante não veio ver sua biografia em ordem cronológica.
Ele quer saber onde você está *agora*; o passado só interessa como explicação
do presente. Os marcos não têm data — são "Hoje", "A virada", "O começo".

### 7. Contato — `secoes/contato.html`

E-mail em destaque, e quatro atalhos: GitHub, LinkedIn, Discord e WhatsApp.

O Discord é o único que não é link: é um **botão que copia** o usuário para a
área de transferência, porque Discord não tem URL de perfil que funcione para
um estranho. Ao clicar, a tooltip troca para "copiado!" por 1,6 s.

Os outros três abrem em aba nova, com `rel="noopener noreferrer"`.

---

## Os efeitos: onde vivem e o que custam

| Efeito | Arquivo | O que faz |
|---|---|---|
| Retrato no scroll | `js/70-retrato-scroll.js` | 150 frames; o scroll escolhe o frame, um amortecedor persegue o alvo |
| Partículas | `js/60-particulas.js` | 18–52 pontos que se movem e se ligam quando ficam a menos de 130 px |
| Revelar ao rolar | `js/50-revelar-ao-rolar.js` | tudo com `.reveal` sobe 24 px e aparece ao entrar na tela |
| Texto digitado | `js/40-typewriter.js` | 4 s; ao terminar, solta navbar e indicador de scroll |
| Copiar Discord | `js/30-discord-copiar.js` | clipboard com fallback para navegador velho |
| Menu mobile | `js/20-menu-mobile.js` | fecha com Escape, com clique fora e ao passar de 768 px |
| Tema claro/escuro | `js/10-tema.js` + `00-tema-antiflash.js` | classe `.light` no `<html>`, guardada no `localStorage` |
| Deriva do brilho | `css/01-tokens-e-base.css` | `.animate-drift`, 14 s, no `.bg-blob-1` |
| Cursor piscando | `css/01-tokens-e-base.css` | `.caret-blink`, 1,1 s — hero e terminal da seção de IA |
| Chevron pulando | `css/30-hero.css` | `bounce-chevron`, no indicador de scroll |

### O escalonamento é feito à mão

O atraso de cada elemento revelado está **no HTML**, inline:

```html
<div class="reveal" style="transition-delay:0.18s">
```

Não é bug nem preguiça: o ritmo é decisão de composição, item por item, e
mudá-lo não deveria exigir abrir o CSS e caçar um seletor. Os valores vão
tipicamente de `0.1s` a `0.33s`.

### O que o site desliga sozinho

Nenhum desses efeitos é incondicional. Dois interruptores:

| Situação | O que acontece |
|---|---|
| `prefers-reduced-motion` | frase aparece inteira na hora · tudo já visível, sem subir · partículas desligadas · retrato vira 1 frame parado |
| Tela ≤ 820 px | retrato vira **1 frame parado: 11 KB em vez de 1,8 MB** |
| Aba em segundo plano | partículas e retrato pausam (`visibilitychange`) — não gastam bateria |
| Modo claro | o retrato cai para 28% da opacidade dele — paleta clara não sustenta foto escura |

O primeiro é acessibilidade: quem marcou "reduzir movimento" no sistema tem
motivo, e às vezes o motivo é enjoo ou crise. O segundo é respeito ao plano de
dados de quem abre pelo celular.

---

## Tabela: quero mudar X, abro qual arquivo?

| Quero mudar | Abro |
|---|---|
| A frase que é digitada | `js/40-typewriter.js` (`HERO_TEXT`) **e** o `.sr-only` em `secoes/hero.html` |
| A ordem das seções | `src/html/index.html` |
| Os links do menu | `parciais/navbar.html` — as duas listas (desktop e mobile) |
| Cores, fontes, espessura de borda | `css/01-tokens-e-base.css` (`:root` e `html.light`) |
| Texto de um serviço, projeto, marco | o `secoes/*.html` correspondente |
| Quanto o retrato aparece | `OP_HERO` / `OP_CONTEUDO` em `js/70-retrato-scroll.js`; `--hero-veil` em `css/10-fundo.css` |
| Velocidade do retrato | `EASING` em `js/70-retrato-scroll.js` (0,05 preguiçoso · 0,25 colado no dedo) |
| Quantidade de partículas | `particleCountFor()` em `js/60-particulas.js` |
| O ritmo em que os cartões aparecem | `transition-delay` inline, no HTML da seção |
| E-mail, WhatsApp, redes | `secoes/contato.html` |
| A camada de fundo que fica na frente | a ordem das linhas em `parciais/fundo.html` |

Depois de qualquer uma delas: `npm run checar`.
