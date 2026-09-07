/* =========================================================
   JARAKA — LOOP
   Controle temporal do jogo

   Responsabilidades:
   - executar ticks lógicos em intervalo fixo;
   - calcular o progresso visual entre ticks;
   - coordenar requestAnimationFrame;
   - iniciar cada execução com relógio limpo.

   Este módulo não conhece:
   - cobra;
   - colisão;
   - alimentação;
   - crescimento;
   - renderer específico;
   - input.
   ========================================================= */

import { MOVE_INTERVAL } from "./config.js";

/* =========================================================
   FACTORY
   ========================================================= */

export function createGameLoop({ onMove, onRender, isGameOver }) {
  let lastMoveTime = 0;

  let animationFrameId = null;

  /* =======================================================
     FRAME
     ======================================================= */

  function frame(timestamp) {
    if (isGameOver()) {
      animationFrameId = null;

      return;
    }

    /* -----------------------------------------------------
       MOVIMENTO LÓGICO
       ----------------------------------------------------- */

    while (timestamp - lastMoveTime >= MOVE_INTERVAL) {
      onMove();

      if (isGameOver()) {
        animationFrameId = null;

        return;
      }

      lastMoveTime += MOVE_INTERVAL;
    }

    /* -----------------------------------------------------
       INTERPOLAÇÃO VISUAL
       ----------------------------------------------------- */

    const progress = Math.min((timestamp - lastMoveTime) / MOVE_INTERVAL, 1);

    onRender(progress);

    /* -----------------------------------------------------
       PRÓXIMO FRAME
       ----------------------------------------------------- */

    animationFrameId = requestAnimationFrame(frame);
  }

  /* =======================================================
     START
     ======================================================= */

  function start() {
    if (animationFrameId !== null) {
      return;
    }

    /*
     * O relógio começa AGORA.
     *
     * Tempo passado em:
     * - tela inicial;
     * - seleção de personagem;
     * - seleção de modo;
     * - countdown;
     *
     * não pertence ao tempo da partida.
     */

    lastMoveTime = performance.now();

    animationFrameId = requestAnimationFrame(frame);
  }

  /* =======================================================
     STOP
     ======================================================= */

  function stop() {
    if (animationFrameId === null) {
      return;
    }

    cancelAnimationFrame(animationFrameId);

    animationFrameId = null;
  }

  /* =======================================================
     API
     ======================================================= */

  return {
    start,
    stop,
  };
}