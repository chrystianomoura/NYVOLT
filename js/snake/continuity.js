/* =========================================================
   JARAKA — SNAKE CONTINUITY
   ========================================================= */

import { EPSILON, GRID_COLUMNS, GRID_ROWS } from "../game/config.js";

/* =========================================================
   ESTADO
   ========================================================= */

let continuityInitialized = false;

let lastLogicalHead = null;
let lastVirtualHead = null;

let cachedSnakeReference = null;
let cachedPreviousSnakeReference = null;
let cachedContinuousState = null;

/* =========================================================
   NORMALIZAÇÃO
   ========================================================= */

function wrapCoordinate(value, size) {
  return ((value % size) + size) % size;
}

function liftCoordinateNear(reference, value, size) {
  const normalized = wrapCoordinate(value, size);

  const tile = Math.round((reference - normalized) / size);

  return normalized + tile * size;
}

function liftPositionNear(reference, position) {
  return {
    x: liftCoordinateNear(reference.x, position.x, GRID_COLUMNS),

    y: liftCoordinateNear(reference.y, position.y, GRID_ROWS),
  };
}

/* =========================================================
   COMPARAÇÃO
   ========================================================= */

function isSameLogicalPosition(first, second) {
  if (!first || !second) {
    return false;
  }

  return (
    Math.abs(first.x - second.x) < EPSILON &&
    Math.abs(first.y - second.y) < EPSILON
  );
}

/* =========================================================
   RESET
   ========================================================= */

function shouldResetContinuity(currentHead, previousHead) {
  if (!continuityInitialized) {
    return true;
  }

  if (isSameLogicalPosition(currentHead, previousHead)) {
    return true;
  }

  if (!isSameLogicalPosition(lastLogicalHead, previousHead)) {
    return true;
  }

  return false;
}

/* =========================================================
   CABEÇA
   ========================================================= */

export function resolveHeadAnchors(snake, previousSnake) {
  if (
    cachedContinuousState &&
    cachedSnakeReference === snake &&
    cachedPreviousSnakeReference === previousSnake
  ) {
    return cachedContinuousState;
  }

  const currentHead = snake[0];

  const previousHead = previousSnake?.[0] ?? currentHead;

  let previousVirtualHead;

  if (shouldResetContinuity(currentHead, previousHead)) {
    previousVirtualHead = {
      x: previousHead.x,
      y: previousHead.y,
    };
  } else {
    previousVirtualHead = {
      x: lastVirtualHead.x,
      y: lastVirtualHead.y,
    };
  }

  const currentVirtualHead = liftPositionNear(previousVirtualHead, currentHead);

  continuityInitialized = true;

  lastLogicalHead = {
    x: currentHead.x,
    y: currentHead.y,
  };

  lastVirtualHead = {
    x: currentVirtualHead.x,
    y: currentVirtualHead.y,
  };

  cachedSnakeReference = snake;

  cachedPreviousSnakeReference = previousSnake;

  cachedContinuousState = {
    currentHead: currentVirtualHead,

    previousHead: previousVirtualHead,
  };

  return cachedContinuousState;
}

/* =========================================================
   CORPO
   ========================================================= */

function unwrapSnake(snake, headAnchor) {
  if (!Array.isArray(snake) || snake.length === 0) {
    return [];
  }

  const unwrapped = [
    {
      x: headAnchor.x,
      y: headAnchor.y,
    },
  ];

  for (let index = 1; index < snake.length; index += 1) {
    const previous = unwrapped[unwrapped.length - 1];

    const segment = snake[index];

    const virtualPosition = liftPositionNear(previous, segment);

    unwrapped.push(virtualPosition);
  }

  return unwrapped;
}

/* =========================================================
   ESTADOS
   ========================================================= */

export function getContinuousSnakeStates(snake, previousSnake) {
  if (!Array.isArray(snake) || snake.length === 0) {
    return {
      current: [],
      previous: [],
    };
  }

  const previousSource =
    Array.isArray(previousSnake) && previousSnake.length > 0
      ? previousSnake
      : snake;

  const anchors = resolveHeadAnchors(snake, previousSource);

  const current = unwrapSnake(snake, anchors.currentHead);

  const previous = unwrapSnake(previousSource, anchors.previousHead);

  return {
    current,
    previous,
  };
}
