/* =========================================================
   NYVOLT — GROWTH
   ========================================================= */

import { EPSILON, VISUAL_GROWTH_RELEASE_STEP } from "./config.js";

import { getVirtualPosition } from "../snake/wrap.js";

/* =========================================================
   UTILITÁRIOS
   ========================================================= */

function cloneSnake(source) {
  return source.map((segment) => ({
    ...segment,
  }));
}

function lerp(start, end, progress) {
  return start + (end - start) * progress;
}

/* =========================================================
   CONTROLLER
   ========================================================= */

export function createGrowthController() {
  let pendingGrowth = 0;

  let visualGrowthOffset = 0;

  /* =========================================================
     FILA
     ========================================================= */

  function queue() {
    pendingGrowth += 1;
  }

  function getPendingGrowth() {
    return pendingGrowth;
  }

  /* =========================================================
     CRESCIMENTO LÓGICO
     ========================================================= */

  function applyPendingGrowth(snake, tailBeforeMove) {
    if (pendingGrowth <= 0 || !tailBeforeMove) {
      return false;
    }

    snake.push({
      x: tailBeforeMove.x,
      y: tailBeforeMove.y,
    });

    pendingGrowth -= 1;

    return true;
  }

  /* =========================================================
     REPRESENTAÇÃO VISUAL
     ========================================================= */

  function createVisualSnake(source, tailOffset) {
    const result = cloneSnake(source);

    if (result.length < 2 || tailOffset <= EPSILON) {
      return result;
    }

    let remainingOffset = Math.min(tailOffset, Math.max(0, result.length - 2));

    while (remainingOffset >= 1 - EPSILON && result.length > 2) {
      result.pop();

      remainingOffset -= 1;
    }

    if (remainingOffset > EPSILON && result.length >= 2) {
      const tailIndex = result.length - 1;

      const tail = result[tailIndex];

      const beforeTail = result[tailIndex - 1];

      const virtualBeforeTail = getVirtualPosition(tail, beforeTail);

      result[tailIndex] = {
        x: lerp(tail.x, virtualBeforeTail.x, remainingOffset),

        y: lerp(tail.y, virtualBeforeTail.y, remainingOffset),
      };
    }

    return result;
  }

  /* =========================================================
     CRESCIMENTO VISUAL
     ========================================================= */

  function updateVisualGrowth(snake, didGrow) {
    if (didGrow) {
      visualGrowthOffset += 1;
    }

    if (visualGrowthOffset > EPSILON) {
      visualGrowthOffset = Math.max(
        0,
        visualGrowthOffset - VISUAL_GROWTH_RELEASE_STEP,
      );
    }

    return createVisualSnake(snake, visualGrowthOffset);
  }

  /* =========================================================
     API
     ========================================================= */

  return {
    queue,
    getPendingGrowth,
    applyPendingGrowth,
    updateVisualGrowth,
  };
}