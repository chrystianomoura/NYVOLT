/* =========================================================
   JARAKA — SNAKE EATING
   ========================================================= */

/* =========================================================
   TIMELINE
   ========================================================= */

const MOUSE_ENTER_TIME = 115;

/* =========================================================
   FACTORY
   ========================================================= */

export function createSnakeEatingController() {
  let active = false;

  let startedAt = 0;

  let onMouseEnter = null;

  /* =======================================================
     CALLBACK
     ======================================================= */

  function triggerMouseEnter() {
    if (!onMouseEnter) {
      return;
    }

    const callback = onMouseEnter;

    onMouseEnter = null;

    callback();
  }

  /* =======================================================
     START
     ======================================================= */

  function start({
    timestamp = performance.now(),
    onMouseEnter: mouseEnterCallback,
  } = {}) {
    active = true;

    startedAt = timestamp;

    onMouseEnter =
      typeof mouseEnterCallback === "function" ? mouseEnterCallback : null;
  }

  /* =======================================================
     UPDATE
     ======================================================= */

  function update(timestamp = performance.now()) {
    if (!active) {
      return;
    }

    const elapsed = Math.max(0, timestamp - startedAt);

    if (elapsed < MOUSE_ENTER_TIME) {
      return;
    }

    triggerMouseEnter();

    active = false;
  }

  /* =======================================================
     RESET
     ======================================================= */

  function reset() {
    active = false;

    startedAt = 0;

    onMouseEnter = null;
  }

  /* =======================================================
     API
     ======================================================= */

  return {
    start,
    update,
    reset,
  };
}
