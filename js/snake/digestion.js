/* =========================================================
   JARAKA — SNAKE DIGESTION
   ========================================================= */

import { sampleRoundedPathAtLength } from "./path-sampling.js";

/* =========================================================
   MOVIMENTO
   ========================================================= */

/*
 * Velocidade própria de cada bola através do corpo.
 */
const DIGESTION_SPEED = 1.65;

/*
 * Limite de delta para evitar saltos grandes
 * caso uma frame demore demais.
 */
const MAX_FRAME_TIME = 50;

/* =========================================================
   PERCURSO
   ========================================================= */

/*
 * Cada nova bola nasce logo atrás da cabeça.
 */
const START_DISTANCE = 0.12;

/*
 * A ponta real da cauda é o ponto final.
 */
const TAIL_CLEARANCE = 0;

/* =========================================================
   TAMANHO
   ========================================================= */

/*
 * Tamanho aprovado da bola quando ela passa
 * por uma região de largura normal da Jaraka.
 */
const START_RADIUS = 0.66;

/*
 * A entrada já nasce visível.
 */
const ENTRY_INITIAL_SCALE = 0.72;

/*
 * Distância usada apenas para completar
 * suavemente o tamanho inicial aprovado.
 */
const ENTRY_DISTANCE = 0.55;

/* =========================================================
   CONSTANTES INTERNAS
   ========================================================= */

const MIN_VALUE = 0.000001;

/* =========================================================
   UTILITÁRIOS
   ========================================================= */

function clamp(value, minimum, maximum) {
  return Math.min(Math.max(value, minimum), maximum);
}

function lerp(start, end, progress) {
  return start + (end - start) * progress;
}

function smoothstep(progress) {
  const value = clamp(progress, 0, 1);

  return value * value * (3 - 2 * value);
}

function getDistance(first, second) {
  return Math.hypot(second.x - first.x, second.y - first.y);
}

/* =========================================================
   FACTORY
   ========================================================= */

export function createSnakeDigestionRenderer({ geometry, bodyWidth }) {
  /*
   * Cada item representa UM rato sendo
   * digerido pela Jaraka.
   *
   * Novos ratos são adicionados sem
   * cancelar os anteriores.
   */
  const digestions = [];

  /*
   * Posição global da cabeça no frame anterior.
   *
   * O deslocamento da cobra é o mesmo para
   * todas as bolas ativas.
   */
  let previousHeadPosition = null;

  let lastTimestamp = null;

  /* =======================================================
     NOVA DIGESTÃO
     ======================================================= */

  function createDigestion() {
    return {
      /*
       * Distância atual dessa bola
       * ao longo do corpo.
       */
      distanceAlongBody: START_DISTANCE,

      /*
       * Movimento próprio acumulado
       * dessa digestão.
       */
      travelledDistance: 0,
    };
  }

  /* =======================================================
     START
     ======================================================= */

  function start(timestamp = performance.now()) {
    /*
     * IMPORTANTE:
     *
     * Não reiniciamos nenhuma digestão
     * existente.
     *
     * Apenas acrescentamos uma nova bola.
     */
    digestions.push(createDigestion());

    /*
     * Se esta for a primeira digestão ativa,
     * inicializamos o relógio.
     *
     * Se já existem outras, preservamos o
     * relógio delas normalmente.
     */
    if (digestions.length === 1) {
      lastTimestamp = timestamp;

      previousHeadPosition = null;
    }
  }

  /* =======================================================
     UPDATE
     ======================================================= */

  function update(timestamp = performance.now()) {
    if (digestions.length === 0) {
      lastTimestamp = null;

      return;
    }

    if (lastTimestamp === null) {
      lastTimestamp = timestamp;

      return;
    }

    const deltaTime = Math.min(
      Math.max(timestamp - lastTimestamp, 0),
      MAX_FRAME_TIME,
    );

    lastTimestamp = timestamp;

    /*
     * Todas as bolas possuem exatamente
     * a mesma velocidade digestiva.
     *
     * Cada uma mantém seu próprio progresso.
     */
    const digestionMovement = DIGESTION_SPEED * (deltaTime / 1000);

    for (let index = 0; index < digestions.length; index += 1) {
      const digestion = digestions[index];

      digestion.distanceAlongBody += digestionMovement;

      digestion.travelledDistance += digestionMovement;
    }
  }

  /* =======================================================
     RESET
     ======================================================= */

  function reset() {
    /*
     * Reset do jogo remove todas
     * as digestões existentes.
     */
    digestions.length = 0;

    previousHeadPosition = null;

    lastTimestamp = null;
  }

  /* =======================================================
     MOVIMENTO DA COBRA
     ======================================================= */

  function getSnakeMovement(headPosition) {
    if (!previousHeadPosition) {
      previousHeadPosition = {
        x: headPosition.x,
        y: headPosition.y,
      };

      return 0;
    }

    const headMovement = getDistance(previousHeadPosition, headPosition);

    previousHeadPosition = {
      x: headPosition.x,
      y: headPosition.y,
    };

    return headMovement;
  }

  function compensateSnakeMovement(headMovement) {
    if (headMovement <= MIN_VALUE) {
      return;
    }

    /*
     * Todas as massas estão dentro da
     * mesma cobra.
     *
     * Portanto todas recebem a mesma
     * compensação do deslocamento dela.
     */
    for (let index = 0; index < digestions.length; index += 1) {
      digestions[index].distanceAlongBody += headMovement;
    }
  }

  /* =======================================================
     TAMANHO LOCAL
     ======================================================= */

  function getRadius(digestion, samplingDistance) {
    /*
     * Usa a largura REAL da Jaraka
     * exatamente onde esta bola está.
     */
    const localBodyWidth = geometry.getWidthAtDistance(samplingDistance);

    /*
     * Mesma proporção visual aprovada:
     *
     * corpo grosso -> bola grande
     * corpo fino   -> bola pequena
     */
    const localScale = clamp(localBodyWidth / bodyWidth, 0, 1);

    const proportionalRadius = START_RADIUS * localScale;

    /*
     * Cada bola possui sua própria
     * animação de entrada.
     */
    const entryProgress = clamp(
      digestion.travelledDistance / ENTRY_DISTANCE,
      0,
      1,
    );

    const entryScale = lerp(ENTRY_INITIAL_SCALE, 1, smoothstep(entryProgress));

    return proportionalRadius * entryScale;
  }

  /* =======================================================
     DESENHO
     ======================================================= */

  function drawDigestion({
    context,
    digestion,
    pathGeometry,
    endDistance,
    color,
  }) {
    /*
     * Cada digestão verifica individualmente
     * se chegou à ponta da cauda.
     */
    const reachedTail = digestion.distanceAlongBody >= endDistance;

    const samplingDistance = reachedTail
      ? endDistance
      : digestion.distanceAlongBody;

    const position = sampleRoundedPathAtLength(pathGeometry, samplingDistance);

    if (!position) {
      return reachedTail;
    }

    const radius = getRadius(digestion, samplingDistance);

    if (radius > MIN_VALUE) {
      context.save();

      context.fillStyle = color;

      context.beginPath();

      context.arc(position.x, position.y, radius, 0, Math.PI * 2);

      context.fill();

      context.restore();
    }

    /*
     * true significa que SOMENTE esta
     * digestão pode ser removida.
     */
    return reachedTail;
  }

  /* =======================================================
     RENDER
     ======================================================= */

  function render({ context, pathGeometry, color }) {
    if (digestions.length === 0 || !context || !pathGeometry) {
      return;
    }

    const totalLength = pathGeometry.totalLength ?? 0;

    if (totalLength <= MIN_VALUE) {
      return;
    }

    /*
     * Distância zero corresponde
     * à cabeça atual.
     */
    const headPosition = sampleRoundedPathAtLength(pathGeometry, 0);

    if (!headPosition) {
      return;
    }

    /*
     * Calculamos o movimento da cobra
     * UMA única vez neste frame.
     */
    const headMovement = getSnakeMovement(headPosition);

    /*
     * E aplicamos a mesma compensação
     * a todas as digestões existentes.
     */
    compensateSnakeMovement(headMovement);

    /*
     * A ponta REAL da cauda continua
     * sendo o destino de todas.
     */
    const endDistance = Math.max(START_DISTANCE, totalLength - TAIL_CLEARANCE);

    /*
     * Percorremos de trás para frente
     * porque algumas bolas podem chegar
     * à cauda neste frame e serem removidas.
     */
    for (let index = digestions.length - 1; index >= 0; index -= 1) {
      const digestion = digestions[index];

      const reachedTail = drawDigestion({
        context,

        digestion,

        pathGeometry,

        endDistance,

        color,
      });

      /*
       * Remove APENAS a bola que chegou
       * ao fim.
       *
       * Todas as outras continuam.
       */
      if (reachedTail) {
        digestions.splice(index, 1);
      }
    }

    /*
     * Quando a última digestão terminar,
     * limpamos apenas o estado compartilhado.
     */
    if (digestions.length === 0) {
      previousHeadPosition = null;

      lastTimestamp = null;
    }
  }

  /* =======================================================
     API
     ======================================================= */

  return {
    start,
    update,
    render,
    reset,
  };
}