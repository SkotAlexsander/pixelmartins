# O retrato dirigido pelo scroll — como funciona e como ajustar

> Implementado em 2026-08-02. Verificado em navegador real (Playwright).

---

## O que é

Uma sequência de 150 fotos desenhada num `<canvas>` atrás de tudo. A posição do
scroll na página escolhe qual foto aparece. Como as fotos são quadros
consecutivos de um vídeo, rolar a página "reproduz" o vídeo.

**O truque da suavidade:** o scroll não escolhe o frame diretamente. Ele define
um **alvo**, e um amortecedor persegue esse alvo a cada quadro de animação:

```js
atual += (alvo - atual) * EASING;
```

Sem isso, a imagem pularia em degraus junto com o scroll (que chega em saltos de
vários pixels). Com isso, ela desliza. É a diferença entre "funciona" e "é bonito".

---

## Os 3 números que você pode mexer

Todos ficam no topo do bloco `Retrato dirigido pelo scroll` no `index-elementor.html`.

| O quê | Padrão | Efeito |
|---|---|---|
| `OP_HERO` | `0.38` | Quanto o retrato aparece **no topo** (atrás do título) |
| `OP_CONTEUDO` | `0.12` | Quanto aparece **depois**, sob o texto do conteúdo |
| `EASING` | `0.10` | `0.05` = mais preguiçoso e cinematográfico · `0.25` = mais colado no dedo |

E um no CSS (`:root`):

| O quê | Padrão | Efeito |
|---|---|---|
| `--hero-veil` | `0.70` | Opacidade do preto do hero. Menor = retrato mais visível no topo |

**Por que dois valores de opacidade e não um?** No hero existe uma camada preta
(`.hero-dark-bg`) segurando a imagem, então ela pode ser forte. No conteúdo não
existe véu nenhum — a `0.38` o rosto competia com o texto e prejudicava a
leitura. O retrato recua ao longo da primeira tela de scroll, com `smoothstep`
para não haver um canto perceptível na virada.

---

## Desempenho

| Cenário | O que baixa |
|---|---|
| Desktop | 150 frames · ~1,8 MB (em duas ondas: esqueleto a cada 6, depois o resto) |
| Celular (≤820px) | **1 frame · 11 KB** — imagem parada, sem animação |
| `prefers-reduced-motion` | 1 frame parado, igual ao celular |

Os originais eram 300 frames a 1280×720 (5,6 MB). Viraram 150 a 854×480 com
`-q:v 10`. Numa camada a 12–38% de opacidade atrás de vinheta, pontos e ruído,
a diferença de qualidade é invisível — o peso, não.

Comando que gerou (ffmpeg):

```bash
ffmpeg -i ezgif-frame-%03d.jpg \
  -vf "select='not(mod(n,2))',scale=854:-2" \
  -fps_mode passthrough -q:v 10 frame-%03d.jpg
```

---

## Cuidados que já estão no código

- **Guarda contra loop duplicado de `requestAnimationFrame`** — o mesmo bug que
  já tinha sido corrigido no canvas de partículas. `loop === null` é a trava.
- **Pausa com a aba oculta** (`visibilitychange`) — não gasta bateria em segundo plano.
- **Nunca trava esperando a rede:** se o frame exato ainda não baixou, desenha o
  mais próximo que já existe (`maisProximoPronto`).
- **A transição CSS é removida** 1 s depois de o retrato entrar. Se ficasse, cada
  ajuste de presença no scroll chegaria 0,9 s atrasado.
- **`devicePixelRatio` limitado a 2** — em telas 3x/4x, um canvas de tela cheia
  na resolução nativa custa caro e não se enxerga a diferença num fundo a 12%.

---

## Como testar depois de mexer

```bash
cd "projetos_futuros/portfolio-pixelmartins"
python -m http.server 8099           # numa aba
node dev/montar-preview.js           # embrulha o fragmento num HTML completo
node dev/verificar-animacao.js       # PASSOU/REPROVOU + capturas em dev/capturas/
node dev/checar-mobile.js            # confere o ramo mobile e o modo claro
```

O `verificar-animacao.js` **lê os pixels do canvas** em 5 posições de scroll e
compara. Se a assinatura não mudar, a animação está congelada e ele reprova —
não adianta "parecer" que funcionou.
