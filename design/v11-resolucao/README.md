# Direção **Resolução** — proposta v11

> Proposta de **15/08/2026**. Não substitui nada: a direção *Sala de Edição*
> (v5–v10) segue intacta em `src/` e é o que o `dist/` gera. Isto vive numa
> pasta à parte, de propósito.

| | |
|---|---|
| **Abrir** | [`index.html`](index.html) — arquivo único, abre com dois cliques |
| **Auditar** | `PLAYWRIGHT_DIR="…/node_modules/playwright" node design/v11-resolucao/auditar.js` |
| **Comparar** | `Área de Trabalho\pixelmartins-v11-PROPOSTA\` tem as duas lado a lado |

---

## O que a motivou

O posicionamento mudou em 15/08: **o foco é programação, o vídeo é
diferencial**. Isso derruba a frase que o site usa desde julho — *"seu site
**e** seu vídeo, feitos pela mesma pessoa"*. Um "e" põe as duas coisas no
mesmo peso, e quem oferece duas profissões com o mesmo peso lê como quem não
fechou nenhuma.

A Sala de Edição escolhia o vocabulário de mesa de corte — régua, timecode,
playhead, monitor de programa — e encaixava o código lá dentro como conteúdo.
Com o foco em programação, essa metáfora passou a vender a metade errada.

## A tese

**Resolução.** O nome da marca é *pixelmartins* e o pixel é a unidade da tela.
O trabalho é levar algo de borrado a resolvido: briefing vira produto no ar.

**O sistema é a luz:**

| | |
|---|---|
| **claro** | o argumento — quem fala, o que entrega |
| **escuro** | o produto rodando; software se vê numa tela acesa no escuro |

Portfólio de dev é escuro do começo ao fim por hábito, não por decisão. Aqui o
escuro aparece **uma vez**, no bloco de trabalho, e por isso significa alguma
coisa quando chega. O claro ganha a leitura no celular de dia, que é onde o
cliente está.

**A assinatura:** o título resolve de blocos grandes até nítido, *por dentro
das letras*. Máscara é palavra dos dois ofícios — matte em composição,
`background-clip` em CSS. É o único lugar onde a ousadia foi gasta.

## Decisões que precisam do Alex

- **A fonte mudou** (Manrope → Bricolage Grotesque). Ele já pediu a Manrope de
  volta uma vez, então isto está marcado como veto possível.
- **O fundo atmosférico saiu.** Se voltar, entra no bloco escuro.
- **O azul da marca ficou.** Trocar a cor do logo é rebranding, não design.

## Está completa

Entraram em 17/08: **Sobre** com o retrato de 150 quadros (jsDelivr) ·
**Trajetória** · **modo escuro** · **menu de celular** · âncoras compensando a
barra fixa · **empacotamento** para o widget.

### O modo escuro não é uma inversão

Nesta direção a luz é **estrutura**, não preferência — inverter tudo faria o
bloco de trabalho sumir no meio dos outros. A regra que sobrevive à troca é a
verdadeira: **o trabalho é sempre a superfície destacada.** No claro ele é mais
escuro que a sala; no escuro, mais claro que o fundo. É como um monitor ligado
se comporta em qualquer das duas luzes.

### O empacotamento

`empacotar.js` gera dois arquivos e **para com erro** se um seletor global
mudar de forma no fonte e a troca não bater mais — porque um `a{color:inherit}`
colado sem prefixo apaga a cor de todos os links do WordPress.

| | |
|---|---|
| `fragmento.html` | é isto que se cola no widget |
| `preview-wp.html` | o fragmento dentro de um tema **agressivo de propósito** (Georgia, links vermelhos, margens próprias) — porque sozinho ele sempre funciona; o que quebra é o convívio |

## O que a bancada mediu

`auditar.js`, em Chromium real: **contraste** de 22 elementos (todos AA) ·
**alvo de toque** em 3 larguras · **rolagem lateral** em 8 larguras (320→1920)
· **teclado** (21 focáveis, todos com anel) · **movimento reduzido** (o título
pinta direto) · **console** limpo. Tudo **PASSOU**.

Seis defeitos foram achados por medição, não por leitura:

1. **No celular o título perdia a última linha.** O canvas quebrava as linhas
   por conta própria; o navegador quebrava diferente. Agora ele *pergunta* ao
   navegador onde cada linha caiu (`Range` por caractere), o que sobrevive a
   `text-wrap: balance`, hifenização e a qualquer regra futura.
2. **O canvas ignora `letter-spacing`.** O título saía ~4% mais largo, vazava a
   caixa e a última palavra era cortada pelo `overflow-x: clip` — em silêncio.
3. **O medidor de contraste acusou uma cor boa.** Ele lia os canais de
   `color(srgb …)` como 0–255 quando vão de 0 a 1, e reprovou `.nav a` com 3,10
   onde o real era 5,62. Sem conferir, o "conserto" teria escurecido uma cor
   que já passava.
4. **A barra não cabia em 320px.** Marca + tema + menu + "Começar" somavam
   372px numa tela de 320 — 52px cortados em silêncio pelo `overflow-x: clip`.
   O teste antigo só encolhia a partir de 1440 e não via; agora ele **carrega já
   na largura**, que é o que o visitante faz, e diz **quem** vaza.
5. **O canvas do retrato ficava contaminado** por imagem de outra origem. O
   desenho estava certo — o defeito só existia para quem tentasse *medir*.
6. **Clicar na navegação deixava a seção atrás da barra fixa.** `scroll-padding-top`
   resolve para toda âncora de uma vez.
