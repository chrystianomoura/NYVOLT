/* =========================================================
   JARAKA — TAIL PATH
   ========================================================= */

import { EPSILON } from "../game/config.js";

/* =========================================================
   INTERPOLAÇÃO
   ========================================================= */

function lerp(start, end, progress) {
  return start + (end - start) * progress;
}

function interpolatePoint(start, end, progress) {
  return {
    x: lerp(start.x, end.x, progress),

    y: lerp(start.y, end.y, progress),
  };
}

/* =========================================================
   GEOMETRIA
   ========================================================= */

function isHorizontal(first, second) {
  return Math.abs(first.y - second.y) < EPSILON;
}

function isVertical(first, second) {
  return Math.abs(first.x - second.x) < EPSILON;
}

function isOrthogonal(first, second) {
  return isHorizontal(first, second) || isVertical(first, second);
}

function getManhattanDistance(first, second) {
  return Math.abs(second.x - first.x) + Math.abs(second.y - first.y);
}

/* =========================================================
   CURVA DA CAUDA
   ========================================================= */

function findTailCorner(snake, previousSnake, previousTail, currentTail) {
  if (isOrthogonal(previousTail, currentTail)) {
    return null;
  }

  const previousBeforeTail = previousSnake[previousSnake.length - 2];

  const currentBeforeTail = snake[snake.length - 2];

  let bestCandidate = null;
  let bestDistance = Infinity;

  if (
    previousBeforeTail &&
    isOrthogonal(previousTail, previousBeforeTail) &&
    isOrthogonal(previousBeforeTail, currentTail)
  ) {
    const distance =
      getManhattanDistance(previousTail, previousBeforeTail) +
      getManhattanDistance(previousBeforeTail, currentTail);

    bestCandidate = previousBeforeTail;

    bestDistance = distance;
  }

  if (
    currentBeforeTail &&
    isOrthogonal(previousTail, currentBeforeTail) &&
    isOrthogonal(currentBeforeTail, currentTail)
  ) {
    const distance =
      getManhattanDistance(previousTail, currentBeforeTail) +
      getManhattanDistance(currentBeforeTail, currentTail);

    if (distance < bestDistance) {
      bestCandidate = currentBeforeTail;
    }
  }

  if (!bestCandidate) {
    return null;
  }

  return {
    x: bestCandidate.x,
    y: bestCandidate.y,
  };
}

/* =========================================================
   ESTADO VISUAL
   ========================================================= */

export function getVisualTailState(snake, previousSnake, progress) {
  const currentTail = snake[snake.length - 1];

  const previousTail = previousSnake[previousSnake.length - 1] ?? currentTail;

  if (isOrthogonal(previousTail, currentTail)) {
    return {
      point: interpolatePoint(previousTail, currentTail, progress),

      corner: null,

      beforeCorner: false,
    };
  }

  const corner = findTailCorner(
    snake,
    previousSnake,
    previousTail,
    currentTail,
  );

  if (!corner) {
    return {
      point: interpolatePoint(previousTail, currentTail, progress),

      corner: null,

      beforeCorner: false,
    };
  }

  const firstLength = getManhattanDistance(previousTail, corner);

  const secondLength = getManhattanDistance(corner, currentTail);

  const totalLength = firstLength + secondLength;

  if (totalLength <= EPSILON) {
    return {
      point: {
        x: currentTail.x,
        y: currentTail.y,
      },

      corner: null,

      beforeCorner: false,
    };
  }

  const traveledDistance = totalLength * progress;

  if (traveledDistance <= firstLength && firstLength > EPSILON) {
    const localProgress = traveledDistance / firstLength;

    return {
      point: interpolatePoint(previousTail, corner, localProgress),

      corner,

      beforeCorner: true,
    };
  }

  if (secondLength <= EPSILON) {
    return {
      point: {
        x: currentTail.x,
        y: currentTail.y,
      },

      corner: null,

      beforeCorner: false,
    };
  }

  const secondDistance = Math.max(0, traveledDistance - firstLength);

  const localProgress = Math.min(secondDistance / secondLength, 1);

  return {
    point: interpolatePoint(corner, currentTail, localProgress),

    corner,

    beforeCorner: false,
  };
}