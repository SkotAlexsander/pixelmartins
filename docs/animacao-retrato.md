# O retrato em sequência — como funciona e como ajustar

> Reescrito em 2026-08-08 para a **v4**. Verificado em navegador real (Playwright).
>
> **O que mudou da v3 para a v4:** o retrato saiu do **fundo da página** e entrou
> na **seção "Sobre"**, dentro de um quadro. E deixou de ser dirigido pelo scroll:
> agora roda sozinho, em looping. O histórico da versão anterior está em
> `backup/2026-08-02-antes-scroll-animation.html` e no git.

---

## O que é

Uma sequência de 150 fotos desenhada num `<canvas>` dentro do quadro do retrato,
na seção "Sobre". Como as fotos são quadros consecutivos de um vídeo, a sequência
"reproduz" o vídeo.

**Por que deixou de seguir o scroll.** Amarrado ao scroll, o retrato só se mexia
quando o visitante se mexia — quem parava para ler via uma foto congelada, e quem
descia rápido via um borrão. Além disso, ele morava atrás do texto a 12–38% de
opacidade: um rosto que ninguém chegava a ver direito, pagando o preço de 150
imagens. Na v4 ele aparece inteiro, num quadro só dele, e anima sozinho.

**O truque da emenda invisível:** o laço é `"vaivem"` — chega no frame 150 e volta
andando de trás pra frente. Um ciclo comum (150 → 1) daria um salto visível toda
vez que virasse, porque a primeira e a última foto não se emendam. Indo e voltando,
não existe emenda.

---

## O que você pode mexer

Tudo num objeto só, no topo de `src/js/90-retrato.js`:

```js
var RETRATO = {
  total: 150,          // quantos frames existem (frame-001.jpg … frame-150.jpg)
  fps: 20,             // velocidade
  laco: "vaivem",      // "vaivem" vai e volta · "ciclo" volta ao primeiro
  passoCelular: 3,     // no celular, carrega 1 frame a cada 3
  paralelo: 6,         // downloads simultâneos
  prazoTeste: 2500,    // ms de paciência com o WordPress antes de cair no CDN
  bases: { local, wp, cdn }
};
```

| O quê | Padrão | Efeito |
|---|---|---|
| `fps` | `20` | `12` fica mais contemplativo · `24` fica mais nervoso |
| `laco` | `"vaivem"` | Use `"ciclo"` **só** se o frame 150 fechar naturalmente no 1 |
| `passoCelular` | `3` | `4` ou `5` derrubam o peso no celular e granulam o movimento |

E a aparência, em `src/css/50-sobre.css`: `.retrato-quadro` (moldura, proporção),
`.retrato-quadro::after` (vinheta no escuro, cianotipia no claro),
o halo ciano saiu na v5.

---

## Quando ele roda — e quando não roda

| Situação | O que acontece |
|---|---|
| Seção "Sobre" à vista | Anima em looping, 20 fps |
| Seção fora da tela | **Dorme** (`IntersectionObserver`, com folga de 180px) |
| Aba em segundo plano | Dorme (`visibilitychange`) |
| `prefers-reduced-motion` | **Um frame só**, o do meio — legenda vira "quadro único · menos movimento" |
| Economia de dados ou 2G | Um frame só — legenda vira "quadro único · economia de dados" |

Dormir não é detalhe de bateria: é o que separa um enfeite de um vazamento de
recurso rodando o dia inteiro numa aba esquecida. O teste automatizado
**reprova** se ele continuar rodando fora de vista.

---

## De onde vêm as imagens

O endereço não é fixo. O código decide sozinho, nesta ordem:

| Situação | Usa |
|---|---|
| `localhost` / `127.0.0.1` (o `preview.html`) | `./assets/frames/` |
| No ar, e `pixelmartins.com/wp-content/uploads/retrato/` responde | **o próprio domínio** |
| No ar, e o WordPress não tem os frames (ou demorou +2,5 s) | jsDelivr (CDN) |

**Estado real em 2026-08-08 (conferido por requisição):**

```text
https://pixelmartins.com/wp-content/uploads/retrato/frame-001.jpg   → 404
https://cdn.jsdelivr.net/gh/SkotAlexsander/pixelmartins-site@main/… → 200 (13,9 KB)
```

Ou seja: **o site está servindo os frames pelo CDN.** É a rota de segurança
funcionando como projetado, não um defeito.

**Para migrar do CDN para o WordPress, não se mexe no código.** Basta subir a
pasta `assets/frames` para `/wp-content/uploads/retrato/` (por FTP ou pelo
gerenciador de arquivos da hospedagem). No próximo carregamento o site já usa as
suas imagens. Para voltar atrás, apague a pasta lá.

> Se subir pela **biblioteca de mídia** em vez do gerenciador de arquivos, o
> caminho ganha pasta de ano/mês (`/uploads/2026/08/`) — aí sim é preciso trocar
> `RETRATO.bases.wp` no código. E o WordPress gera miniaturas de cada imagem: 150
> fotos viram ~750 arquivos na biblioteca. Por isso o FTP é a rota limpa.

---

## Desempenho — o que o visitante paga

Medido com Playwright, no preview local (2026-08-08):

| Cenário | Frames | Peso |
|---|---|---|
| Desktop | 150 | **1,77 MB** |
| Celular (≤ 47,99rem ≈ 768px) | 50 (1 a cada 3) | **591 KB** |
| `prefers-reduced-motion` / economia de dados | 1 | ~14 KB |

⚠️ **Isto subiu muito em relação à v3**, onde o celular baixava **1 frame (11 KB)**
e ponto. A v4 escolheu animar no celular também — 591 KB de imagem decorativa no
pacote de dados de quem está na rua. É uma decisão de produto legítima, mas é uma
decisão: se o objetivo for o peso, `passoCelular: 6` corta pela metade, e
`passoCelular: 150` volta ao comportamento da v3.

Nada disso é baixado antes da hora: o download só começa quando a seção "Sobre"
se aproxima da tela.

Os originais eram 300 frames a 1280×720 (5,6 MB). Viraram 150 a 854×480 com
`-q:v 10`. Comando que gerou (ffmpeg):

```bash
ffmpeg -i ezgif-frame-%03d.jpg \
  -vf "select='not(mod(n,2))',scale=854:-2" \
  -fps_mode passthrough -q:v 10 frame-%03d.jpg
```

---

## Cuidados que já estão no código

- **Guarda contra loop duplicado de `requestAnimationFrame`** — `laco === null` é a trava.
- **Dorme fora de vista e com a aba oculta** — não gasta bateria à toa.
- **Nunca trava esperando a rede:** se o frame exato ainda não baixou, desenha o
  mais próximo que já existe (`maisProximo`). No máximo fica granulado por um
  instante e vai ficando fluido conforme os arquivos caem.
- **Download em duas ondas:** primeiro um esqueleto (1 a cada 5), depois o resto.
  A animação já roda inteira antes de tudo chegar.
- **`crossOrigin` só quando a imagem vem de outro domínio** — pedir CORS numa
  imagem do próprio site é inútil e, se o servidor não mandar o cabeçalho, a
  imagem simplesmente não carrega.
- **Aba que volta do limbo não estoura:** o avanço por quadro é limitado a 6.
- **`devicePixelRatio` limitado a 2** — acima disso o canvas custa caro e não se
  enxerga a diferença.

---

## Defeito da v4 — resolvido na v5

A v4 tinha **10px de rolagem lateral no celular** (390px de largura:
`scrollWidth` 400 contra `clientWidth` 390). A causa, isolada por eliminação,
era o halo ciano atrás do retrato — `.retrato-col::before` com `inset: -8%`,
que no celular estendia o pseudo-elemento ~28px para fora de cada lado. (Não
aparecia em varredura de elementos porque pseudo-elemento não é elemento.)

**Na v5 o halo não existe** — a decoração toda saiu — e o `#pm-site` ganhou
`overflow-x: clip` como cinto de segurança. `clip` e não `hidden`: `hidden` num
eixo força o outro a `auto` e cria um contexto de rolagem; `clip` só corta.

Medição atual: **0px de rolagem lateral** em 320, 390, 768, 1024 e 1440.

---

## Na v5, onde o retrato mora

Ele continua o mesmo bloco de código, mas ganhou moldura: está dentro de um
**monitor de programa** (`PROGRAM`, timecode no topo, `retrato.seq` e a
contagem de frames no rodapé). Nada mudou no comportamento — só a moldura, que
é o que faz ele parecer o que sempre foi: um clipe de vídeo.

---

## Como testar depois de mexer

```bash
cd "10-projetos/portfolio-pixelmartins"
python -m http.server 8099                    # numa aba (sem --bind: o checar-rota-wp.js usa 127.0.0.2)
npm run preview                               # build + embrulha num HTML completo
npm run verificar:retrato                     # o retrato: PASSOU/REPROVOU + capturas
npm run verificar:pagina                      # a página: sem rede, sem JS, teclado, overflow
npm run verificar:mobile                      # ramo celular, modo claro e peso
```

O `verificar-animacao.js` **lê os pixels do canvas** e cobra duas coisas: que a
imagem mude com a seção à vista, e que **pare de mudar** com a seção fora da
tela. Uma das duas sozinha não prova nada — animação congelada passa no segundo
teste, e vazamento de bateria passa no primeiro.
