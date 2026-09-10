/* =========================================================
   NYVOLT — DIRECTION
   ========================================================= */

/* =========================================================
   COMPARAÇÕES
   ========================================================= */

function isSameDirection(candidate, current) {
  return candidate.x === current.x && candidate.y === current.y;
}

function isOppositeDirection(candidate, current) {
  return candidate.x === -current.x && candidate.y === -current.y;
}

/* =========================================================
   CURVA
   ========================================================= */

function getTurnSide(current, next) {
  const cross = current.x * next.y - current.y * next.x;

  return cross > 0 ? "right" : "left";
}

/* =========================================================
   CONTROLLER
   ========================================================= */

export function createDirectionController(initialDirection) {
  let direction = {
    x: initialDirection.x,
    y: initialDirection.y,
  };

  let queuedDirection = {
    x: initialDirection.x,
    y: initialDirection.y,
  };

  /* =========================================================
     LEITURA
     ========================================================= */

  function getDirection() {
    return direction;
  }

  /* =========================================================
     APLICAÇÃO
     ========================================================= */

  function applyQueuedDirection() {
    direction = queuedDirection;

    return direction;
  }

  /* =========================================================
     FILA
     ========================================================= */

  function queue(candidate) {
    if (isSameDirection(candidate, direction)) {
      return {
        accepted: false,
        turnSide: null,
      };
    }

    if (isOppositeDirection(candidate, direction)) {
      return {
        accepted: false,
        turnSide: null,
      };
    }

    const turnSide = getTurnSide(direction, candidate);

    queuedDirection = candidate;

    return {
      accepted: true,
      turnSide,
    };
  }

  /* =========================================================
     API
     ========================================================= */

  return {
    getDirection,
    applyQueuedDirection,
    queue,
  };
}