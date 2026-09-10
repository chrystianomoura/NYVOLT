/* =========================================================
   NYVOLT — SNAKE CENTERLINE
   ========================================================= */

import { EPSILON } from "../game/config.js";

import { getContinuousSnakeStates } from "./continuity.js";

import { getVisualTailState } from "./tail-path.js";

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
   UTILITÁRIOS
   ========================================================= */

function isSamePoint(first, second) {
  return (
    Math.abs(first.x - second.x) < EPSILON &&
    Math.abs(first.y - second.y) < EPSILON
  );
}

function toCenter(position) {
  return {
    x: position.x + 0.5,
    y: position.y + 0.5,
  };
}

function pushUniquePoint(points, point) {
  const previous = points[points.length - 1];

  if (!previous || !isSamePoint(previous, point)) {
    points.push(point);
  }
}

/* =========================================================
   CONSTRUÇÃO
   ========================================================= */

export function buildBodyPoints(snake, previousSnake, progress) {
  if (!Array.isArray(snake) || snake.length === 0) {
    return [];
  }

  const continuous = getContinuousSnakeStates(snake, previousSnake);

  const currentSnake = continuous.current;

  const previousContinuousSnake = continuous.previous;

  const points = [];

  const currentHead = currentSnake[0];

  const previousHead = previousContinuousSnake[0] ?? currentHead;

  const visualHead = interpolatePoint(previousHead, currentHead, progress);

  points.push(toCenter(visualHead));

  for (let index = 1; index < currentSnake.length; index += 1) {
    pushUniquePoint(points, toCenter(currentSnake[index]));
  }

  if (currentSnake.length <= 1) {
    return points;
  }

  const tailState = getVisualTailState(
    currentSnake,
    previousContinuousSnake,
    progress,
  );

  if (tailState.corner && tailState.beforeCorner) {
    pushUniquePoint(points, toCenter(tailState.corner));
  }

  pushUniquePoint(points, toCenter(tailState.point));

  return points;
}

/* =========================================================
   SIMPLIFICAÇÃO
   ========================================================= */

export function simplifyOrthogonalPoints(points) {
  if (!Array.isArray(points) || points.length <= 2) {
    return points;
  }

  const simplified = [points[0]];

  for (let index = 1; index < points.length - 1; index += 1) {
    const previous = simplified[simplified.length - 1];

    const current = points[index];

    const next = points[index + 1];

    const sameHorizontal =
      Math.abs(previous.y - current.y) < EPSILON &&
      Math.abs(current.y - next.y) < EPSILON;

    const sameVertical =
      Math.abs(previous.x - current.x) < EPSILON &&
      Math.abs(current.x - next.x) < EPSILON;

    if (!sameHorizontal && !sameVertical) {
      simplified.push(current);
    }
  }

  simplified.push(points[points.length - 1]);

  return simplified;
}