# As seções da página e os efeitos de cada uma

> Escrito em 2026-08-03, reescrito em 2026-08-08 para a v5 "Sala de Edição".
> Complementa [estrutura.md](estrutura.md): lá está *como o código é montado*,
> aqui está *o que cada pedaço faz na tela*. O porquê do desenho está em
> [direcao-arte.md](direcao-arte.md).

Se você abriu este arquivo para mexer em alguma coisa, vá direto na tabela do
fim — ela diz qual arquivo abrir para cada mudança.

---

## A ideia, em uma frase

**A página é uma sequência aberta num editor de vídeo.** Quem rola está
arrastando o playhead. Não é decoração com tema de vídeo: a régua do rodapé é
navegação de verdade, o timecode anda com o scroll, e cada seção é um clipe.

Isso existe porque o argumento de venda da página é *"site e vídeo, feitos pela
mesma pessoa"*. Qualquer um **escreve** isso; só quem faz as duas coisas
**constrói a prova**.

---

## A ordem da página, e por que ela é essa

**Hero → Serviços → Projetos → Vídeo → Sobre → IA → Trajetória → Contato**

A ordem foi decidida em 01/08/2026 e não é a ordem "natural" de um portfólio
(que costuma ser Sobre logo depois do Hero). O motivo:

> A primeira pergunta do visitante é **"o que você faz por mim"**, não **"quem
> é você"**.

Por isso Serviços vem em segundo e Sobre só depois da prova — quando o
visitante já sabe o que pode contratar e já viu trabalho. "Sobre" deixa de ser
apresentação e vira confirmação.

**Vídeo entrou em 15/08/2026**, colado em Projetos e não no fim. O hero promete
duas frentes; se a prova das duas não vier junta, a promessa lê como uma frente
e um complemento. Projetos + Vídeo são um bloco só — *"aqui está o que eu
faço"* — e o Sobre continua chegando como confirmação, agora das duas metades.

A ordem vive em **dois** lugares, e os dois têm de concordar:

| Onde | O quê |
|---|---|
| `src/html/index.html` | a ordem real dos blocos na página |
| `CLIPES`, em `src/js/70-regua.js` | os clipes da régua e os timecodes |
| `parciais/navbar.html` | o menu do topo e o de celular (que repete os timecodes) |
| o `.clipe-cabeca` de cada seção | o timecode e o número `V1 · NN` impressos nela |

Trocar duas seções de lugar é trocar duas linhas em cada um. Mudar só um deixa
a régua mentindo — e por isso a bancada parou de contar clipes com número fixo
e passou a exigir que a régua e o menu **concordem** (`dev/verificar-pagina.js`).

---

## A régua — `parciais/regua.html`

Antes das seções, o elemento que atravessa todas elas. É uma barra fixa no
rodapé da janela (`position: fixed`), fora do `<main>` de propósito: é
ferramenta de navegação, não conteúdo.

| Parte | O que é |
|---|---|
| `#tc-agora` | timecode que anda com o scroll, em HH:MM:SS:FF a 24 quadros |
| faixa **V1** | um botão por seção, com a largura proporcional ao espaço que ela ocupa na página. O da seção atual fica selecionado (borda ciano), como clipe selecionado num editor |
| faixa **A1** | forma de onda desenhada em canvas — determinística, a mesma sempre |
| `.playhead` | a linha ciano que percorre a régua |

**Ela substitui a barra de progresso E duplica o menu.** É clicável, tem
`aria-label` em cada bloco e responde ao teclado — é botão de verdade, não
`div` com `onclick`.

No celular não cabe texto nos blocos: cada clipe vira a própria marca colorida,
e o nome sai (`font-size: 0`). O `aria-label` continua lá, então quem usa
leitor de tela não perde nada.

**Quem escreve nela:** `js/70-regua.js` (playhead, timecode, seleção) e
`js/60-onda.js` (a forma de onda). O `70-regua.js` também é quem marca o link
ativo lá no topo — é a mesma informação, para quem está olhando para cima.

---

## Seção por seção

### 1. Hero — `secoes/hero.html`

A cartela de abertura: `● REC 00:00:00:00`, o título entrando **palavra por
palavra**, e a forma de onda da narração embaixo.

O fundo é uma **grade técnica** de duas linhas de 1px com máscara radial. Não
há blob, brilho nem partícula — a v4 tinha os três, e é exatamente o que dava
à página a cara de template de IA.

> **Acessibilidade:** a frase existe duas vezes no HTML. Uma em `.sr-only`,
> completa e imediata, para leitor de tela; a outra é a animada, marcada com
> `aria-hidden`. Sem isso, quem usa leitor de tela ouviria a frase picada em
> palavras.

**Para trocar a frase:** os dois `<span>` em `hero.html` — o `.sr-only` e o
`[data-frase]`. São dois lugares; se mudar só um, o site diz uma coisa e o
leitor de tela diz outra. (O JS não tem a frase escrita nele: ele lê a que
está no HTML.)

Logo abaixo do hero vem a **fita de ferramentas**, montada por `js/80-fita.js`.
Ela é `aria-hidden` porque é movimento; a lista em texto corrido, para leitor
de tela e para busca, está no `.sr-only` logo depois dela.

### 2. Serviços — `secoes/servicos.html`

Três painéis (Sites, Vídeo, IA) colados por um filete de 1px e, embaixo, os
quatro passos do processo (Briefing → Proposta → Produção → Entrega).

É a seção que responde "o que eu compro de você". O bloco do processo existe
para uma objeção específica: *"e depois que eu contratar, eu fico sem
notícia?"*. Daí os textos serem sobre previsibilidade ("sem surpresa depois",
"nada de sumir por semanas") e não sobre técnica.

### 3. Projetos — `secoes/projetos.html`

**Um projeto contado inteiro** (Explorador do Sistema Solar), com ficha técnica
— Ferramentas, Papel, A decisão — e o diagrama de órbitas ao lado. Abaixo,
**"Também no ar"**: Vitrola, Rotina, Corpo e Acervo, como clipes menores na
mesma faixa, em grade 2×2.

A frase de abertura ("um projeto contado inteiro vale mais que uma vitrine de
miniaturas") continua verdadeira com cinco projetos porque só **um** é contado:
os outros quatro são **lista**, não vitrine. O que mataria a frase é o destaque
virar mais um card igual aos outros.

⚠️ **15/08/2026 — esta seção apontava para um endereço morto.** O cartão
"Prato" linkava `skotalexsander.github.io/prato/`, que virou 404 quando o
repositório foi renomeado para `corpo`: o GitHub redireciona a URL do
**repositório**, mas não a do **Pages**. A bancada ganhou uma lista de nomes
proibidos (`Prato`, `central-pessoal`, `pixelmartins-site`) que reprova se
qualquer um voltar a aparecer no que vai ao ar.

O diagrama de órbitas é SVG autoral e gira por CSS (`--dur` inline em cada
planeta). É data graphic, não ilustração.

### 4. Vídeo — `secoes/video.html`

**Por que existe.** O hero promete *"seu site **e** seu vídeo, feitos pela mesma
pessoa"* — e até 15/08/2026 a página mostrava cinco projetos de código e **zero
frame de vídeo**. Metade da oferta era afirmação. Quem chegava pelo vídeo saía
sem ver nada do que veio buscar.

**Por que não tem footage, e isso é decisão e não falta.** O material de vídeo é
trabalho **de cliente**. Publicar clipe de cliente num portfólio sem autorização
escrita não é escolha do desenvolvedor — nem quando o arquivo está na máquina
dele. Então a seção mostra o **método**, que é do Alex, em vez do material, que
não é.

O bloco `.video-links` existe no fonte, **comentado**, para o dia em que ele
mandar os endereços públicos. A regra escrita lá: só entra o que a **dona** do
conteúdo já publicou no perfil dela. Link para o que já é público não pede
licença; hospedar cópia, pede.

**A árvore de entrega** (`.arvore`) é data graphic autoral, mesma categoria do
diagrama de órbitas: as três caixas têm a **proporção real** do formato que
nomeiam — 90×51 e 56×32 são 16:9, 42×75 é 9:16. A forma informa antes de o
rótulo ser lido. Mexer nas medidas sem manter a razão quebra a única coisa que
ela faz.

Sem animação aqui, e é decisão: a seção anterior já tem órbitas girando e o
playhead anda no rodapé. O critério de animação deste projeto é *"explica
hierarquia, confirma ação, guia o olho ou mantém continuidade"* — esta não faria
nenhum dos quatro.

**Os números da ficha são medidos**, com `ffprobe`, nos arquivos entregues:

| | Medido |
|---|---|
| aulas prontas | 15m51 e 16m16 · 1920×1080 |
| peças de apoio | 83 s, 108 s, 113 s · 1920×1080 |
| cortes verticais | 51 s a 66 s · 2160×3840 (9:16 em 4K) |

Mudaram? Medir de novo antes de reescrever.

### 5. Sobre — `secoes/sobre.html`

O retrato de 150 frames dentro de um **monitor de programa**: rótulo `PROGRAM`,
timecode no topo, `retrato.seq` e a contagem de frames no rodapé.

Até a v4 esse retrato vivia **atrás do texto da página inteira**, a 12–38% de
opacidade — um rosto que ninguém chegava a ver, pagando o preço de 150
imagens. Aqui ele ganha o quadro que merecia, e a moldura é o que faz ele
parecer o que sempre foi: um clipe de vídeo.

Ao lado, a apresentação e quatro capacidades (front-end, vídeo, IA, motion).

Vem **depois** de Projetos por decisão de ordem: quando o visitante chega aqui,
ele já viu o que você entrega.

### 6. IA & automação — `secoes/ia.html`

Duas colunas: texto com etiquetas à esquerda, um **log de render** à direita.

O terminal é o único elemento da página que imita software de fora. Ganhou nome
de arquivo (`render.log`) para virar mais um painel da mesma bancada, em vez de
enfeite de landing de dev.

É uma seção curta de propósito: "uso IA no processo" é uma afirmação que se
enfraquece quanto mais você explica.

### 7. Trajetória — `secoes/trajetoria.html`

Três marcos **em ordem inversa**: Hoje → A virada → O começo.

Inversa porque o visitante não veio ver sua biografia em ordem cronológica. Ele
quer saber onde você está *agora*; o passado só interessa como explicação do
presente.

Os losangos âmbar à esquerda são **marcadores** — a mesma convenção da régua do
rodapé. É o que amarra a seção ao resto da página. E os marcos não têm data:
ano em portfólio envelhece sozinho e convida a comparar tempo de estrada, que
não é o argumento aqui.

### 8. Contato — `secoes/contato.html`

E-mail em destaque (`FIM DA SEQUÊNCIA` no cabeçalho do clipe) e quatro
atalhos: WhatsApp, GitHub, LinkedIn e Discord.

Sem formulário, de propósito: formulário exige backend, dá erro em silêncio,
cai em spam e some sem rastro. Um `mailto:` deixa a mensagem na caixa de saída
da pessoa — ela sabe que mandou.

O Discord é o único que não é link: é um **botão que copia** o usuário para a
área de transferência, porque Discord não tem URL de perfil que funcione para
um estranho. Ao clicar, a dica troca para "copiado!" por 1,6 s. Sendo botão, já
funciona com Enter e Espaço no teclado.

Os outros três abrem em aba nova, com `rel="noopener noreferrer"`.

---

## Os efeitos: onde vivem e o que fazem

**Nenhuma biblioteca.** Tudo abaixo é o que o navegador já tem. A v5 chegou a
usar GSAP e Lenis por CDN e voltou atrás — o porquê está em
[direcao-arte.md](direcao-arte.md).

| Efeito | Arquivo | O que faz |
|---|---|---|
| Playhead, timecode e clipes | `js/70-regua.js` | evento `scroll` passivo; também navega por âncora e marca o link ativo |
| Retrato em looping | `js/90-retrato.js` | 150 frames em vaivém a 20 fps; dorme fora de vista |
| Forma de onda | `js/60-onda.js` | desenha os dois canvas (hero e régua); redesenha ao trocar o tema |
| Revelar ao rolar | `js/50-revelar-ao-rolar.js` | tudo com `[data-anim]` sobe 14 px e aparece em 380 ms |
| Título por palavra | `js/40-titulo-revelar.js` | pica a frase em palavras mascaradas, stagger de 40 ms |
| Fita de ferramentas | `js/80-fita.js` | monta a lista **duas vezes** — com um grupo só, o laço saltaria |
| Copiar Discord | `js/30-discord-copiar.js` | clipboard com plano B para navegador velho ou HTTP |
| Menu mobile | `js/20-menu-mobile.js` | fecha com Escape, clique fora e ao passar de 62 rem |
| Tema claro/escuro | `js/10-tema.js` + `00-tema-antiflash.js` | classe `.light` no `<html>`, guardada no `localStorage`; dispara `pm-tema` |
| O ano do rodapé | `js/95-ano.js` | mantém o número certo sem ninguém lembrar de editar |
| REC piscando | `css/30-hero.css` | `pisca-rec`, 2 s, em degraus (não é fade — é lâmpada) |
| Cursor do terminal | `css/60-ia.css` | `pisca-cur`, 1,05 s |
| Órbitas girando | `css/55-projetos.css` | `girar`, com `--dur` diferente por planeta |

### O que o site desliga sozinho

Nenhum desses efeitos é incondicional. Os interruptores:

| Situação | O que acontece |
|---|---|
| `prefers-reduced-motion` | o título não é picado · tudo já visível, sem subir · a fita para · as órbitas param · o retrato vira **1 quadro parado** · o scroll de âncora deixa de ser suave |
| Sem JavaScript | a página aparece **inteira** — nada fica escondido esperando animação (é o que a classe `.js` garante) |
| Sem `IntersectionObserver` | a revelação entrega tudo de uma vez, em vez de nunca |
| Tela ≤ 47,99 rem | o retrato carrega **1 frame a cada 3** (50 em vez de 150) |
| Economia de dados ou 2G | o retrato vira 1 quadro parado |
| Seção "Sobre" fora da tela | o retrato **dorme** — não gasta bateria |
| Aba em segundo plano | idem |

O primeiro é acessibilidade: quem marcou "reduzir movimento" no sistema tem
motivo, e às vezes o motivo é enjoo ou crise. Os outros são respeito ao plano
de dados e à bateria de quem abre pelo celular.

Tudo isso é cobrado por `npm run verificar` — inclusive o cenário em que
**toda** requisição externa é bloqueada.

---

## Tabela: quero mudar X, abro qual arquivo?

| Quero mudar | Abro |
|---|---|
| A frase do hero | os **dois** `<span>` em `secoes/hero.html` (o `.sr-only` e o `[data-frase]`) |
| A ordem das seções | `src/html/index.html` **e** `CLIPES` em `js/70-regua.js` |
| Os timecodes | `CLIPES` em `js/70-regua.js`, o menu em `parciais/navbar.html` e o `.clipe-cabeca` de cada seção |
| Os links do menu | `parciais/navbar.html` — as duas listas (desktop e celular) |
| Cores, fontes, espessura de borda | `css/01-tokens-e-base.css` (`:root` e `html.light`) |
| Texto de um serviço, projeto, marco | o `secoes/*.html` correspondente |
| Velocidade ou peso do retrato | o objeto `RETRATO` em `js/90-retrato.js` (`fps`, `passoCelular`) |
| A aparência da régua | `css/10-regua.css` |
| O jeito da forma de onda | `js/60-onda.js` (a função `desenhar`) |
| A lista de ferramentas da fita | `itens` em `js/80-fita.js` |
| E-mail, WhatsApp, redes | `secoes/contato.html` |

Depois de qualquer uma delas: `npm run checar`.
