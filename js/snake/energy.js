/* =========================================================
   NYVOLT — ENERGY ABSORPTION
   ========================================================= */

/* =========================================================
   TIMELINE
   ========================================================= */

const ENERGY_RISE_END = 90;
const ENERGY_HOLD_END = 150;
const ENERGY_END = 480;

/* =========================================================
   CONSTANTES
   ========================================================= */

const MIN_VALUE = 0.000001;

/* =========================================================
   UTILITÁRIOS
   ========================================================= */

function clamp(value, minimum, maximum) {
  return Math.min(Math.max(value, minimum), maximum);
}

function smoothstep(start, end, value) {
  if (Math.abs(end - start) <= MIN_VALUE) {
    return value < start ? 0 : 1;
  }

  const progress = clamp((value - start) / (end - start), 0, 1);

  return progress * progress * (3 - 2 * progress);
}

/* =========================================================
   CONTROLLER
   ========================================================= */

export function createEnergyController() {
  let active = false;
  let startedAt = 0;
  let elapsed = 0;

  /* =========================================================
     COLETA
     ========================================================= */

  function triggerCollection(callback) {
    if (typeof callback !== "function") {
      return;
    }

    callback();
  }

  /* =========================================================
     PROGRESSO
     ========================================================= */

  function getEnergyProgress() {
    if (!active) {
      return 0;
    }

    if (elapsed <= ENERGY_RISE_END) {
      return smoothstep(0, ENERGY_RISE_END, elapsed);
    }

    if (elapsed <= ENERGY_HOLD_END) {
      return 1;
    }

    return 1 - smoothstep(ENERGY_HOLD_END, ENERGY_END, elapsed);
  }

  /* =========================================================
     ESTADO
     ========================================================= */

  function getState() {
    return {
      active,
      elapsed,
      energyProgress: getEnergyProgress(),
    };
  }

  /* =========================================================
     START
     ========================================================= */

  function start({ timestamp = performance.now(), onCollect } = {}) {
    active = true;
    startedAt = timestamp;
    elapsed = 0;

    triggerCollection(onCollect);
  }

  /* =========================================================
     UPDATE
     ========================================================= */

  function update(timestamp = performance.now()) {
    if (!active) {
      return;
    }

    elapsed = Math.max(0, timestamp - startedAt);

    if (elapsed >= ENERGY_END) {
      active = false;
      elapsed = 0;
    }
  }

  /* =========================================================
     RESET
     ========================================================= */

  function reset() {
    active = false;
    startedAt = 0;
    elapsed = 0;
  }

  /* =========================================================
     API
     ========================================================= */

  return {
    start,
    update,
    reset,
    getState,
  };
}