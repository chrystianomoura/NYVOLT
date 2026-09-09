/* =========================================================
   JARAKA — SNAKE EATING
   ========================================================= */

/* =========================================================
   TIMELINE
   ========================================================= */

/*
 * O rato desaparece durante a abertura da mordida,
 * antes de a cabeça avançar visualmente sobre ele.
 *
 * A boca ainda está abrindo neste instante,
 * fazendo o desaparecimento parecer parte da mordida.
 */
const MOUSE_ENTER_TIME = 150;

/*
 * Entrada do estado predatório.
 */
const ATTACK_RISE_END = 160;

/*
 * A boca chega à abertura máxima.
 */
const BITE_OPEN_END = 190;

/*
 * A boca permanece totalmente aberta
 * por 160 ms.
 */
const ATTACK_HOLD_END = 350;

/*
 * A boca fecha em 85 ms.
 */
const BITE_CLOSE_END = 435;

/*
 * A expressão predatória continua retornando
 * suavemente ao estado normal.
 */
const ATTACK_END = 750;

/* =========================================================
   CONSTANTES INTERNAS
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
   FACTORY
   ========================================================= */

export function createSnakeEatingController() {
  let active = false;

  let startedAt = 0;

  let elapsed = 0;

  let onMouseEnter = null;

  /* =======================================================
     CALLBACK — RATO
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
     ESTADO VISUAL — EXPRESSÃO
     ======================================================= */

  function getAttackProgress() {
    if (!active) {
      return 0;
    }

    if (elapsed <= ATTACK_RISE_END) {
      return smoothstep(0, ATTACK_RISE_END, elapsed);
    }

    if (elapsed <= ATTACK_HOLD_END) {
      return 1;
    }

    return 1 - smoothstep(ATTACK_HOLD_END, ATTACK_END, elapsed);
  }

  /* =======================================================
     ESTADO VISUAL — BOCA
     ======================================================= */

  function getBiteProgress() {
    if (!active) {
      return 0;
    }

    if (elapsed <= BITE_OPEN_END) {
      return smoothstep(0, BITE_OPEN_END, elapsed);
    }

    if (elapsed <= ATTACK_HOLD_END) {
      return 1;
    }

    if (elapsed <= BITE_CLOSE_END) {
      return 1 - smoothstep(ATTACK_HOLD_END, BITE_CLOSE_END, elapsed);
    }

    return 0;
  }

  /* =======================================================
     ESTADO PÚBLICO
     ======================================================= */

  function getState() {
    return {
      active,

      elapsed,

      attackProgress: getAttackProgress(),

      biteProgress: getBiteProgress(),
    };
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

    elapsed = 0;

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

    elapsed = Math.max(0, timestamp - startedAt);

    if (elapsed >= MOUSE_ENTER_TIME) {
      triggerMouseEnter();
    }

    if (elapsed >= ATTACK_END) {
      active = false;

      elapsed = 0;

      onMouseEnter = null;
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