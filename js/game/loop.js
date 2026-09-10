/* =========================================================
   NYVOLT — LOOP
   ========================================================= */

import { MOVE_INTERVAL } from "./config.js";

/* =========================================================
   CONTROLLER
   ========================================================= */

export function createGameLoop({ onMove, onRender, isGameOver }) {
  let lastMoveTime = 0;

  let animationFrameId = null;

  /* =========================================================
     FRAME
     ========================================================= */

  function frame(timestamp) {
    if (isGameOver()) {
      animationFrameId = null;

      return;
    }

    while (timestamp - lastMoveTime >= MOVE_INTERVAL) {
      onMove();

      if (isGameOver()) {
        animationFrameId = null;

        return;
      }

      lastMoveTime += MOVE_INTERVAL;
    }

    const progress = Math.min((timestamp - lastMoveTime) / MOVE_INTERVAL, 1);

    onRender(progress);

    animationFrameId = requestAnimationFrame(frame);
  }

  /* =========================================================
     START
     ========================================================= */

  function start() {
    if (animationFrameId !== null) {
      return;
    }

    lastMoveTime = performance.now();

    animationFrameId = requestAnimationFrame(frame);
  }

  /* =========================================================
     STOP
     ========================================================= */

  function stop() {
    if (animationFrameId === null) {
      return;
    }

    cancelAnimationFrame(animationFrameId);

    animationFrameId = null;
  }

  /* =========================================================
     API
     ========================================================= */

  return {
    start,
    stop,
  };
}