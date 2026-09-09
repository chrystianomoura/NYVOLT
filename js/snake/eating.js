/* =========================================================
   JARAKA — SNAKE EATING
   ========================================================= */

/* =========================================================
   TIMELINE
   ========================================================= */

const BITE_OPEN_END = 115;

const BITE_CLOSE_START = 115;
const BITE_CLOSE_END = 300;

const CHEW_START = 320;
const CHEW_END = 660;

const SWALLOW_START = 360;
const SWALLOW_END = 1120;

const SEQUENCE_END = SWALLOW_END;

/* =========================================================
   UTILITÁRIOS
   ========================================================= */

function clamp(value, minimum, maximum) {
  return Math.max(minimum, Math.min(value, maximum));
}

function getWindowProgress(elapsed, start, end) {
  if (end <= start) {
    return elapsed >= end ? 1 : 0;
  }

  return clamp((elapsed - start) / (end - start), 0, 1);
}

/* =========================================================
   FACTORY
   ========================================================= */

export function createSnakeEatingController() {
  let active = false;

  let startedAt = 0;

  let elapsed = 0;

  let onMouseEnter = null;

  let onSwallowComplete = null;

  /* =======================================================
     CALLBACKS
     ======================================================= */

  function triggerMouseEnter() {
    if (!onMouseEnter) {
      return;
    }

    const callback = onMouseEnter;

    onMouseEnter = null;

    callback();
  }

  function triggerSwallowComplete() {
    if (!onSwallowComplete) {
      return;
    }

    const callback = onSwallowComplete;

    onSwallowComplete = null;

    callback();
  }

  /* =======================================================
     START
     ======================================================= */

  function start({
    timestamp = performance.now(),
    onMouseEnter: mouseEnterCallback,
    onSwallowComplete: swallowCompleteCallback,
  } = {}) {
    active = true;

    startedAt = timestamp;

    elapsed = 0;

    onMouseEnter =
      typeof mouseEnterCallback === "function" ? mouseEnterCallback : null;

    onSwallowComplete =
      typeof swallowCompleteCallback === "function"
        ? swallowCompleteCallback
        : null;
  }

  /* =======================================================
     UPDATE
     ======================================================= */

  function update(timestamp = performance.now()) {
    if (!active) {
      return;
    }

    elapsed = Math.max(0, timestamp - startedAt);

    if (elapsed >= BITE_OPEN_END) {
      triggerMouseEnter();
    }

    if (elapsed >= SWALLOW_END) {
      triggerSwallowComplete();
    }

    if (elapsed >= SEQUENCE_END) {
      active = false;

      elapsed = SEQUENCE_END;
    }
  }

  /* =======================================================
     RESET
     ======================================================= */

  function reset() {
    active = false;

    startedAt = 0;

    elapsed = 0;

    onMouseEnter = null;

    onSwallowComplete = null;
  }

  /* =======================================================
     ESTADO
     ======================================================= */

  function getState() {
    if (!active) {
      return {
        active: false,

        sequenceProgress: 0,

        biteOpenProgress: 0,

        biteCloseProgress: 0,

        chewProgress: 0,

        swallowProgress: 0,
      };
    }

    return {
      active: true,

      sequenceProgress: getWindowProgress(elapsed, 0, SEQUENCE_END),

      biteOpenProgress: getWindowProgress(elapsed, 0, BITE_OPEN_END),

      biteCloseProgress: getWindowProgress(
        elapsed,
        BITE_CLOSE_START,
        BITE_CLOSE_END,
      ),

      chewProgress: getWindowProgress(elapsed, CHEW_START, CHEW_END),

      swallowProgress: getWindowProgress(elapsed, SWALLOW_START, SWALLOW_END),
    };
  }

  /* =======================================================
     API
     ======================================================= */

  return {
    start,
    update,
    reset,
    getState,
  };
}