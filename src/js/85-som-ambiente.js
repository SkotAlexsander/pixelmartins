/* ==========================================================================
   SOM AMBIENTE — lofi gerado no navegador

   POR QUE GERADO, E NÃO UM MP3
   Um arquivo de música traria três problemas de uma vez: peso (2 a 4 MB num
   site que inteiro tem 96 KB), licença (música com dono não se põe em site
   comercial sem contrato) e repetição (dois minutos em loop viram tortura no
   terceiro ciclo). Gerado por código: zero bytes, zero licença, e nunca toca
   a mesma sequência duas vezes.

   NUNCA COMEÇA SOZINHO. Todo navegador atual bloqueia áudio sem gesto do
   usuário — e mesmo que não bloqueasse, som que começa sozinho faz a pessoa
   que abriu o site no trabalho fechar a aba. O botão fica na régua, ao lado
   do timecode, onde um botão de som está num editor. A escolha é lembrada.

   COMO É FEITO
     · progressão de quatro acordes maj7/min7, em Ré menor, lenta
     · cada nota é um par de osciladores (triangle + sine uma oitava abaixo)
       com envelope longo — sem ataque, o que dá o toque de teclado macio
     · filtro passa-baixa em 900 Hz: é literalmente o "lo" de lofi
     · ruído de vinil: um buffer de ruído em loop, filtrado e baixíssimo
     · um delay com realimentação faz as vezes de reverb barato
     · a cada compasso, uma nota da melodia entra ou não — é o que evita
       que o ouvido reconheça um loop

   TUDO PENDURADO NUM SÓ GANHO DE SAÍDA: desligar é uma rampa de 400 ms nele,
   e não trinta osciladores parando fora de sincronia.
   ========================================================================== */
(function () {
  "use strict";

  var botao = document.getElementById("som-btn");
  if (!botao || !(window.AudioContext || window.webkitAudioContext)) {
    if (botao) botao.hidden = true;
    return;
  }

  /* Ré menor: os acordes são graus da escala, em hertz.
     i7 (Dm7) · VI maj7 (Bbmaj7) · III maj7 (Fmaj7) · v7 (Am7) */
  var ACORDES = [
    [146.83, 174.61, 220.00, 261.63],   /* Dm7  : D  F  A  C  */
    [116.54, 146.83, 174.61, 220.00],   /* Bbmaj7: Bb D  F  A  */
    [174.61, 220.00, 261.63, 329.63],   /* Fmaj7 : F  A  C  E  */
    [110.00, 130.81, 164.81, 196.00]    /* Am7   : A  C  E  G  */
  ];
  var COMPASSO = 4.2;      /* segundos por acorde — bem lento */
  var VOLUME = 0.16;       /* de fundo é de fundo */

  var ctx = null, saida = null, relogio = null, vinil = null;
  var compasso = 0, tocando = false;

  /* ---- ruído de vinil ---------------------------------------------------
     Dois segundos de ruído em loop, passado por um passa-alta (tira o grave,
     que embolaria com os acordes) e mantido no limiar do audível. Sem ele o
     som fica limpo demais e denuncia que é sintetizado. */
  function ligarVinil() {
    var n = ctx.sampleRate * 2;
    var buffer = ctx.createBuffer(1, n, ctx.sampleRate);
    var dados = buffer.getChannelData(0);
    for (var i = 0; i < n; i++) dados[i] = (Math.random() * 2 - 1) * 0.5;

    var fonte = ctx.createBufferSource();
    fonte.buffer = buffer;
    fonte.loop = true;

    var passaAlta = ctx.createBiquadFilter();
    passaAlta.type = "highpass";
    passaAlta.frequency.value = 2200;

    var g = ctx.createGain();
    g.gain.value = 0.012;

    fonte.connect(passaAlta).connect(g).connect(saida);
    fonte.start();
    return fonte;
  }

  /* ---- uma nota ---------------------------------------------------------
     Dois osciladores por nota: triangle na fundamental e sine uma oitava
     abaixo, mais fraco. É o que dá corpo sem virar órgão de igreja. */
  function nota(freq, inicio, duracao, forca) {
    var env = ctx.createGain();
    env.gain.setValueAtTime(0.0001, inicio);
    env.gain.exponentialRampToValueAtTime(forca, inicio + 0.7);      /* ataque lento */
    env.gain.exponentialRampToValueAtTime(0.0001, inicio + duracao);  /* cauda longa */
    env.connect(saida);

    var o1 = ctx.createOscillator();
    o1.type = "triangle";
    o1.frequency.value = freq;
    o1.connect(env);
    o1.start(inicio); o1.stop(inicio + duracao + 0.1);

    var g2 = ctx.createGain();
    g2.gain.value = 0.45;
    g2.connect(env);
    var o2 = ctx.createOscillator();
    o2.type = "sine";
    o2.frequency.value = freq / 2;
    o2.connect(g2);
    o2.start(inicio); o2.stop(inicio + duracao + 0.1);
  }

  function tocarCompasso() {
    if (!tocando) return;
    var acorde = ACORDES[compasso % ACORDES.length];
    var t = ctx.currentTime + 0.05;

    /* as notas do acorde entram desencontradas, como dedos numa tecla */
    for (var i = 0; i < acorde.length; i++) {
      nota(acorde[i], t + i * 0.09, COMPASSO * 1.15, 0.09);
    }

    /* uma nota solta por cima, em dois compassos de cada três — a ausência
       é o que faz o ouvido não decorar o laço */
    if (compasso % 3 !== 2) {
      var alto = acorde[1 + Math.floor(Math.random() * 3)] * 2;
      nota(alto, t + COMPASSO * 0.45, COMPASSO * 0.7, 0.045);
    }

    compasso++;
    relogio = setTimeout(tocarCompasso, COMPASSO * 1000);
  }

  function montar() {
    var AC = window.AudioContext || window.webkitAudioContext;
    ctx = new AC();

    saida = ctx.createGain();
    saida.gain.value = 0;

    /* passa-baixa: o "lo" de lofi. Tira o brilho e deixa o som abafado,
       como quem ouve pela parede. */
    var filtro = ctx.createBiquadFilter();
    filtro.type = "lowpass";
    filtro.frequency.value = 900;
    filtro.Q.value = 0.7;

    /* delay com realimentação = reverb de pobre, e aqui é o que se quer:
       um eco curto que borra as bordas das notas. */
    var eco = ctx.createDelay(1.0);
    eco.delayTime.value = 0.38;
    var realim = ctx.createGain();
    realim.gain.value = 0.32;
    var mistura = ctx.createGain();
    mistura.gain.value = 0.35;

    saida.connect(filtro).connect(ctx.destination);
    filtro.connect(eco).connect(realim).connect(eco);
    eco.connect(mistura).connect(ctx.destination);

    vinil = ligarVinil();
  }

  function ligar() {
    if (!ctx) montar();
    if (ctx.state === "suspended") ctx.resume();
    tocando = true;
    saida.gain.cancelScheduledValues(ctx.currentTime);
    saida.gain.setValueAtTime(saida.gain.value, ctx.currentTime);
    saida.gain.linearRampToValueAtTime(VOLUME, ctx.currentTime + 1.2);
    tocarCompasso();
    marcar(true);
  }

  function desligar() {
    tocando = false;
    if (relogio) { clearTimeout(relogio); relogio = null; }
    if (ctx && saida) {
      saida.gain.cancelScheduledValues(ctx.currentTime);
      saida.gain.setValueAtTime(saida.gain.value, ctx.currentTime);
      saida.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + 0.4);
    }
    marcar(false);
  }

  function marcar(ligado) {
    botao.setAttribute("aria-pressed", ligado ? "true" : "false");
    botao.setAttribute("aria-label", ligado ? "Desligar o som ambiente" : "Ligar o som ambiente");
    try { localStorage.setItem("pm-som", ligado ? "1" : "0"); } catch (e) {}
  }

  botao.addEventListener("click", function () {
    if (tocando) desligar(); else ligar();
  });

  /* Aba escondida não precisa tocar para ninguém. */
  document.addEventListener("visibilitychange", function () {
    if (!ctx) return;
    if (document.hidden && tocando) ctx.suspend();
    else if (!document.hidden && tocando) ctx.resume();
  });

  marcar(false);

  /* Quem já tinha ligado numa visita anterior continua precisando de um
     gesto — é regra do navegador, não escolha nossa. O que dá para fazer é
     deixar o botão avisando que estava ligado, e ligar no primeiro toque. */
  var eraLigado = false;
  try { eraLigado = localStorage.getItem("pm-som") === "1"; } catch (e) {}
  if (eraLigado) {
    botao.setAttribute("data-dica", "som ambiente — clique para retomar");
    var retomar = function () {
      document.removeEventListener("pointerdown", retomar);
      document.removeEventListener("keydown", retomar);
      if (!tocando) ligar();
    };
    document.addEventListener("pointerdown", retomar, { once: true });
    document.addEventListener("keydown", retomar, { once: true });
  }
})();
