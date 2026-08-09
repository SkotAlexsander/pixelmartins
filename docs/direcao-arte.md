# Direção de arte — "Sala de Edição"

> Escrita em 2026-08-08, **antes** de uma linha de código, como manda a skill
> `build-awwwards-quality-sites`. A v4 foi rejeitada pelo usuário por três
> motivos declarados: **cara de template de IA**, **seções rasas** e o **modo
> claro "planta técnica"**.

---

## A tese visual

**A página é uma sequência aberta num editor de vídeo.** O visitante que rola não
rola uma página: ele arrasta o playhead de uma timeline.

Isto não é enfeitar o site com ícones de claquete. É construir a **interface**
como uma timeline: régua de tempo real no rodapé, seções como clipes numa faixa
de vídeo, timecode que anda, marcadores, corte seco no lugar de fade.

### Por que essa direção, e não outra

O argumento de venda da página é *"site e vídeo, feitos pela mesma pessoa"*.
Qualquer pessoa **escreve** essa frase. Só quem faz as duas coisas consegue
**construir a prova**: um site que se comporta como uma edição.

- Um web designer que não edita não conhece a gramática (timecode drop-frame,
  faixa V1/A1, marcador, corte seco, cold open).
- Um editor que não programa não constrói.

A forma vira o argumento. É a definição de "único" que dá pra defender: não é
único porque ninguém pensou, é único porque **quase ninguém pode executar**.

### O que isso mata da v4 (o problema declarado)

| Sintoma "template de IA" na v4 | O que entra no lugar |
|---|---|
| Fundo azulado + glow ciano difuso | Cinza **neutro** de sala de edição — sala real é neutra pra não contaminar a percepção de cor. Razão profissional, não gosto |
| Vidro (`backdrop-filter`) por toda parte | Superfícies chapadas de painel de software |
| Cantos de 16px, sombra que vaza luz | Canto de 2–4px, sem sombra difusa. Profundidade por linha de 1px e sobreposição |
| Partículas e brilhos decorativos | Zero. Todo pixel animado tem função de interface |
| Modo claro "planta técnica"/cianotipia | Vira **luz acesa**: a mesma sala, cinza claro neutro. Sem papel, sem cianotipia |

---

## Cor

Sala de edição profissional é **cinza neutro calibrado**. Isso resolve o problema
do "dark genérico" com um motivo que se explica em uma frase.

```
--bg          #131315   fundo (neutro, sem tinta azul)
--painel      #1A1A1D   superfície de painel
--faixa       #212126   faixa da régua / cabeçalho de clipe
--linha       #2E2E34   filete de 1px
--linha-forte #43434B   divisor de faixa
--texto       #EDEDEF
--texto-2     #9A9AA2
--texto-3     #6A6A72
```

Os acentos **vêm da marca e ganham função** — cada cor faz um trabalho que existe
num NLE de verdade:

```
--playhead  #00CFFF   ciano da logo → playhead e seleção   (em NLE, seleção é azul)
--marcador  #FF9F1C   âmbar          → marcador e REC       (convenção de marcador)
--ok        #3DDC97   verde          → renderizado / status
```

A logo é um monograma "AM" com gradiente **azul-profundo → ciano** (`#0A1FA8` →
`#01D9EC`, extraído do PNG em 08/08). O ciano da v4 não era arbitrário: era a
marca. O problema nunca foi a cor — foi o **uso** (glow difuso). Aqui ela vira o
playhead, que é o único elemento que tem direito de brilhar.

---

## Tipografia

| Papel | Fonte | Por quê |
|---|---|---|
| Display | **Manrope** 600/700/800 | Geometria alta e terminações macias. Chegou a ser trocada pela Archivo, e o Alex preferiu a Manrope de volta — a Archivo é mais dura e condensada, e competia com o resto da página |
| Corpo | **Inter** 400/500 | Legibilidade neutra; já estava no projeto |
| Dados | **IBM Plex Mono** 400/500/600 | Timecode, rótulo de faixa, ficha técnica. **Carrega a identidade** — num painel de edição, o dado é monoespaçado |

O mono ganha mais espaço que na v4 de propósito: é ele que faz a página parecer
um instrumento, não um site de agência.

---

## A sequência (ordem mantida, agora com timecode)

```
00:00:00:00   COLD OPEN                      hero
00:00:18:00   O QUE EU ENTREGO               serviços
00:00:42:00   O QUE EU JÁ CONSTRUÍ           projetos
00:01:10:00   UMA PESSOA, AS DUAS ENTREGAS   sobre
00:01:34:00   IA NO PROCESSO                 ia
00:01:52:00   COMO CHEGUEI AQUI              trajetória
00:02:10:00   ME CONTA O QUE VOCÊ PRECISA     contato
```

A ordem é a que já tinha sido decidida em 01/08 e está certa: a pergunta do
visitante é "o que você faz por mim", não "quem é você".

---

## Os elementos autorais

### 1. A régua (rodapé fixo) — o elemento que carrega o conceito

Não é barra de progresso enfeitada: é **navegação**.

- **Timecode ao vivo** à esquerda, avançando com o scroll
- **Faixa V1** — cada seção é um bloco clicável com nome. O bloco da seção atual
  fica selecionado (borda ciano), como clipe selecionado num NLE
- **Faixa A1** — forma de onda desenhada em canvas, determinística
- **Playhead** — linha ciano que percorre a régua conforme a página rola
- Clicar num bloco navega para a seção

Funcional, não decorativa: substitui a barra de progresso **e** duplica o menu.

### 2. Hero — "cold open"

Cartela `● REC 00:00:00:00`, título revelado **palavra por palavra**, forma de
onda de áudio embaixo. Sem partícula, sem blob, sem glow.

### 3. Corte seco entre seções

A gramática do ofício: vídeo bom **corta**, não faz fade em tudo. Cada seção
entra com `clip-path` em ~180ms + stagger de palavra no título. Nada de
dissolve lento de 900ms.

### 4. Projetos — ficha técnica de clipe

Aqui mora a resposta ao "seções rasas". Cada projeto vira uma ficha:

```
CLIPE 01 · 2026 · WEB          Explorador do Sistema Solar
[a descrição que já existia — copy intacta]
FERRAMENTAS   Three.js · JavaScript · WebGL · HTML/CSS
```

E entram **dois projetos reais que já estão no ar** e não estavam na página:
Vitrola (player de música, PWA + APK) e Come-Come (jogo, JS puro). Texto novo,
factual, curto — marcado no README para o usuário revisar.

### 5. Sobre — monitor de programa

O retrato de 150 frames já era, por acaso, a peça mais alinhada com esta
direção: é literalmente um clipe de vídeo. Ganha moldura de monitor (`PROGRAM`,
timecode, contagem de frames) e continua dormindo fora de vista.

### 6. Trajetória — marcadores

Os três itens viram marcadores com timecode. A metáfora fecha sem precisar de
texto novo.

---

## Motion

**Sem biblioteca. Nenhuma.**

A primeira versão desta direção usava GSAP + ScrollTrigger + Lenis por CDN, e
foi revertida — por dois motivos, e o segundo é o que decide:

1. A bancada mostrou que a página já fazia tudo sem eles. Com o CDN bloqueado,
   revelação, playhead, timecode e navegação continuavam funcionando: o ganho
   real era o scroll suave do Lenis e um playhead um pouco mais fino. Pouco,
   por 137 KB de código de terceiro.
2. **Este repositório já tinha uma decisão registrada contra isso**, em
   [estrutura.md](estrutura.md): *"a página passaria a depender de um terceiro
   para pintar"*. Uma direção de arte não derruba uma decisão de arquitetura
   sem argumento novo — e não havia.

O que sobrou faz o mesmo trabalho com o que o navegador já tem:

| O quê | Como |
|---|---|
| Playhead e timecode | evento `scroll` nativo, `passive: true` — o navegador não espera este código para rolar |
| Clipe ativo na régua | o mesmo cálculo, comparando `offsetTop` com o ponto de leitura (35% da altura da janela) |
| Revelação das seções | `IntersectionObserver`, com saída de emergência que mostra tudo se ele não existir |
| Título do hero | `setTimeout` escalonado de 40ms e uma transição de CSS |
| Retrato | `requestAnimationFrame`, dormindo fora de vista |

**`prefers-reduced-motion: reduce`** → o título não é picado em palavras, a
revelação entrega tudo de uma vez, a fita para, e o retrato mostra um quadro
único. Não é "animação mais curta": é ausência de animação.

**Three.js: NÃO.** Não há profundidade espacial, textura ou deslocamento a
resolver — o conceito é 2D de interface. WebGL aqui seria ornamento, que é
exatamente o que a v4 fazia de errado.

---

## Proveniência dos assets

| Asset | Origem |
|---|---|
| 150 frames do retrato | do próprio usuário, já no repo desde 02/08 |
| Logo (monograma AM) | do usuário, servida pelo WordPress dele |
| Ícones de interface | SVG autoral (permitido: são símbolos de interface, não ilustração) |
| Forma de onda / régua | data graphic de interface, desenhado em canvas |

Sem stock, sem avatar ilustrado, sem depoimento inventado, **sem parede de logos
de cliente** — não existe prova honesta pra mostrar, então não se mostra.
