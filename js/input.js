/* =========================================================
   NYVOLT — INPUT
   ========================================================= */

export function createInputController({ getDirection, onDirectionChange }) {
  /* =========================================================
     ESTADO
     ========================================================= */

  let directionQueued = false;

  let touchStartX = null;
  let touchStartY = null;
  let touchAxis = null;

  let pendingTouchDirection = null;

  /* =========================================================
     SENSIBILIDADE
     ========================================================= */

  const MIN_SWIPE_DISTANCE = 12;
  const DIRECTION_CHANGE_DISTANCE = 24;

  /* =========================================================
     DIREÇÕES
     ========================================================= */

  const UP = {
    x: 0,
    y: -1,
    name: "up",
  };

  const DOWN = {
    x: 0,
    y: 1,
    name: "down",
  };

  const LEFT = {
    x: -1,
    y: 0,
    name: "left",
  };

  const RIGHT = {
    x: 1,
    y: 0,
    name: "right",
  };

  /* =========================================================
     TECLADO
     ========================================================= */

  const keyboardDirections = {
    ArrowUp: UP,
    ArrowDown: DOWN,
    ArrowLeft: LEFT,
    ArrowRight: RIGHT,

    w: UP,
    s: DOWN,
    a: LEFT,
    d: RIGHT,
  };

  /* =========================================================
     COMPARAÇÃO
     ========================================================= */

  function isSameDirection(firstDirection, secondDirection) {
    if (!firstDirection || !secondDirection) {
      return false;
    }

    return (
      firstDirection.x === secondDirection.x &&
      firstDirection.y === secondDirection.y
    );
  }

  function isOppositeDirection(currentDirection, nextDirection) {
    return (
      currentDirection.x + nextDirection.x === 0 &&
      currentDirection.y + nextDirection.y === 0
    );
  }

  function getDirectionAxis(direction) {
    if (!direction) {
      return null;
    }

    return direction.x !== 0 ? "horizontal" : "vertical";
  }

  /* =========================================================
     VALIDAÇÃO
     ========================================================= */

  function canQueueDirection(nextDirection) {
    if (!nextDirection) {
      return false;
    }

    const currentDirection = getDirection();

    if (!currentDirection) {
      return false;
    }

    if (isSameDirection(currentDirection, nextDirection)) {
      return false;
    }

    if (isOppositeDirection(currentDirection, nextDirection)) {
      return false;
    }

    return true;
  }

  /* =========================================================
     ENVIO DE DIREÇÃO
     ========================================================= */

  function queueDirection(nextDirection) {
    if (directionQueued) {
      return false;
    }

    if (!canQueueDirection(nextDirection)) {
      return false;
    }

    directionQueued = true;

    onDirectionChange(nextDirection);

    return true;
  }

  /* =========================================================
     BUFFER TOUCH
     ========================================================= */

  function bufferTouchDirection(nextDirection) {
    if (!nextDirection) {
      return;
    }

    const currentDirection = getDirection();

    if (isSameDirection(currentDirection, nextDirection)) {
      return;
    }

    if (isOppositeDirection(currentDirection, nextDirection)) {
      return;
    }

    pendingTouchDirection = nextDirection;
  }

  /* =========================================================
     TECLADO
     ========================================================= */

  function handleKeyDown(event) {
    const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;

    const nextDirection = keyboardDirections[key];

    if (!nextDirection) {
      return;
    }

    event.preventDefault();

    queueDirection(nextDirection);
  }

  /* =========================================================
     TOUCH — RESET
     ========================================================= */

  function resetTouch() {
    touchStartX = null;
    touchStartY = null;
    touchAxis = null;
  }

  /* =========================================================
     TOUCH — INÍCIO
     ========================================================= */

  function handleTouchStart(event) {
    if (event.touches.length !== 1) {
      resetTouch();

      return;
    }

    const touch = event.touches[0];

    touchStartX = touch.clientX;

    touchStartY = touch.clientY;

    touchAxis = null;
  }

  /* =========================================================
     TOUCH — DIREÇÃO
     ========================================================= */

  function getHorizontalDirection(deltaX) {
    return deltaX > 0 ? RIGHT : LEFT;
  }

  function getVerticalDirection(deltaY) {
    return deltaY > 0 ? DOWN : UP;
  }

  /* =========================================================
     TOUCH — PRIMEIRA INTENÇÃO
     ========================================================= */

  function resolveInitialTouchDirection(deltaX, deltaY) {
    const absoluteX = Math.abs(deltaX);

    const absoluteY = Math.abs(deltaY);

    if (absoluteX < MIN_SWIPE_DISTANCE && absoluteY < MIN_SWIPE_DISTANCE) {
      return null;
    }

    if (absoluteX > absoluteY) {
      return getHorizontalDirection(deltaX);
    }

    return getVerticalDirection(deltaY);
  }

  /* =========================================================
     TOUCH — MUDANÇA DE EIXO
     ========================================================= */

  function resolveAxisChange(deltaX, deltaY) {
    if (touchAxis === "horizontal") {
      if (Math.abs(deltaY) < DIRECTION_CHANGE_DISTANCE) {
        return null;
      }

      if (Math.abs(deltaY) <= Math.abs(deltaX)) {
        return null;
      }

      return getVerticalDirection(deltaY);
    }

    if (touchAxis === "vertical") {
      if (Math.abs(deltaX) < DIRECTION_CHANGE_DISTANCE) {
        return null;
      }

      if (Math.abs(deltaX) <= Math.abs(deltaY)) {
        return null;
      }

      return getHorizontalDirection(deltaX);
    }

    return null;
  }

  /* =========================================================
     TOUCH — MOVIMENTO
     ========================================================= */

  function handleTouchMove(event) {
    if (touchStartX === null || touchStartY === null) {
      return;
    }

    if (event.touches.length !== 1) {
      resetTouch();

      return;
    }

    event.preventDefault();

    const touch = event.touches[0];

    const currentX = touch.clientX;

    const currentY = touch.clientY;

    const deltaX = currentX - touchStartX;

    const deltaY = currentY - touchStartY;

    if (touchAxis === null) {
      const nextDirection = resolveInitialTouchDirection(deltaX, deltaY);

      if (!nextDirection) {
        return;
      }

      touchAxis = getDirectionAxis(nextDirection);

      touchStartX = currentX;
      touchStartY = currentY;

      if (!directionQueued) {
        queueDirection(nextDirection);

        return;
      }

      bufferTouchDirection(nextDirection);

      return;
    }

    const nextDirection = resolveAxisChange(deltaX, deltaY);

    if (!nextDirection) {
      return;
    }

    touchAxis = getDirectionAxis(nextDirection);

    touchStartX = currentX;
    touchStartY = currentY;

    if (!directionQueued) {
      queueDirection(nextDirection);

      return;
    }

    bufferTouchDirection(nextDirection);
  }

  /* =========================================================
     TOUCH — FIM
     ========================================================= */

  function handleTouchEnd() {
    resetTouch();
  }

  /* =========================================================
     TOUCH — CANCELAMENTO
     ========================================================= */

  function handleTouchCancel() {
    resetTouch();

    pendingTouchDirection = null;
  }

  /* =========================================================
     UNLOCK
     ========================================================= */

  function unlock() {
    directionQueued = false;

    if (!pendingTouchDirection) {
      return;
    }

    const nextDirection = pendingTouchDirection;

    pendingTouchDirection = null;

    queueDirection(nextDirection);
  }

  /* =========================================================
     START
     ========================================================= */

  function start() {
    directionQueued = false;
    pendingTouchDirection = null;

    resetTouch();

    window.addEventListener("keydown", handleKeyDown);

    window.addEventListener("touchstart", handleTouchStart, {
      passive: true,
    });

    window.addEventListener("touchmove", handleTouchMove, {
      passive: false,
    });

    window.addEventListener("touchend", handleTouchEnd, {
      passive: true,
    });

    window.addEventListener("touchcancel", handleTouchCancel, {
      passive: true,
    });
  }

  /* =========================================================
     STOP
     ========================================================= */

  function stop() {
    window.removeEventListener("keydown", handleKeyDown);

    window.removeEventListener("touchstart", handleTouchStart);

    window.removeEventListener("touchmove", handleTouchMove);

    window.removeEventListener("touchend", handleTouchEnd);

    window.removeEventListener("touchcancel", handleTouchCancel);

    directionQueued = false;
    pendingTouchDirection = null;

    resetTouch();
  }

  /* =========================================================
     API
     ========================================================= */

  return {
    start,
    stop,
    unlock,
  };
}