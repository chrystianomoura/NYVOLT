/* =========================================================
   JARAKA — HEAD POSITION
   ========================================================= */

import { resolveHeadAnchors } from "./continuity.js";

/* =========================================================
   INTERPOLAÇÃO
   ========================================================= */

function lerp(start, end, progress) {
  return start + (end - start) * progress;
}

/* =========================================================
   POSIÇÃO
   ========================================================= */

export function getVisualHead(snake, previousSnake, progress) {
  if (!Array.isArray(snake) || snake.length === 0) {
    return {
      x: 0,
      y: 0,
    };
  }

  const previousSource =
    Array.isArray(previousSnake) && previousSnake.length > 0
      ? previousSnake
      : snake;

  const anchors = resolveHeadAnchors(snake, previousSource);

  return {
    x: lerp(anchors.previousHead.x, anchors.currentHead.x, progress),

    y: lerp(anchors.previousHead.y, anchors.currentHead.y, progress),
  };
}