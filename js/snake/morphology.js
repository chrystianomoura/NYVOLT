/* =========================================================
   NYVOLT — SNAKE MORPHOLOGY
   ========================================================= */

/* =========================================================
   CONSTANTES
   ========================================================= */

const TAIL_LENGTH_PER_GROWTH = 1;
const TAIL_WIDTH_LOSS_PER_GROWTH = 0.08;
const MIN_TAIL_END_WIDTH = 0.28;
const MIN_VISIBLE_GROWTH = 0.002;

const MORPHOLOGY_SMOOTHING_MS = 360;
const MORPHOLOGY_FRAME_LIMIT_MS = 50;
const MORPHOLOGY_SNAP_EPSILON = 0.001;

/* =========================================================
   UTILITÁRIOS
   ========================================================= */

function lerp(start, end, progress) {
  return start + (end - start) * progress;
}

function clamp(value, minimum, maximum) {
  return Math.max(minimum, Math.min(value, maximum));
}

/* =========================================================
   MORFOLOGIA
   ========================================================= */

export function createSnakeMorphology({ bodyWidth, initialSnakeLength }) {
  let targetGrowth = 0;
  let morphologyGrowth = 0;
  let lastMorphologyTime = null;

  /* =========================================================
     CRESCIMENTO
     ========================================================= */

  function getGrowthAmount(snakeLength) {
    return Math.max(0, snakeLength - initialSnakeLength);
  }

  function updateGrowth(snakeLength) {
    targetGrowth = getGrowthAmount(snakeLength);

    const now = performance.now();

    if (lastMorphologyTime === null) {
      lastMorphologyTime = now;
      morphologyGrowth = targetGrowth;

      return morphologyGrowth;
    }

    let deltaTime = now - lastMorphologyTime;

    lastMorphologyTime = now;

    deltaTime = Math.min(Math.max(deltaTime, 0), MORPHOLOGY_FRAME_LIMIT_MS);

    const difference = targetGrowth - morphologyGrowth;

    if (Math.abs(difference) <= MORPHOLOGY_SNAP_EPSILON) {
      morphologyGrowth = targetGrowth;

      return morphologyGrowth;
    }

    const smoothing = 1 - Math.exp(-deltaTime / MORPHOLOGY_SMOOTHING_MS);

    morphologyGrowth += difference * smoothing;

    return morphologyGrowth;
  }

  /* =========================================================
     CAUDA
     ========================================================= */

  function getTailLength(totalLength, visualGrowth) {
    return Math.min(totalLength, visualGrowth * TAIL_LENGTH_PER_GROWTH);
  }

  function getTailWidthGrowth(visualGrowth) {
    if (visualGrowth <= 0) {
      return 0;
    }

    return (visualGrowth * visualGrowth) / (visualGrowth + 2);
  }

  function getTailEndWidth(visualGrowth) {
    const widthGrowth = getTailWidthGrowth(visualGrowth);

    return Math.max(
      MIN_TAIL_END_WIDTH,
      bodyWidth - widthGrowth * TAIL_WIDTH_LOSS_PER_GROWTH,
    );
  }

  function getTailWidth(progress, visualGrowth) {
    const normalized = clamp(progress, 0, 1);

    const taperProgress = normalized * normalized * (2 - normalized);

    return lerp(bodyWidth, getTailEndWidth(visualGrowth), taperProgress);
  }

  /* =========================================================
     RESET
     ========================================================= */

  function reset(nextInitialSnakeLength) {
    initialSnakeLength = nextInitialSnakeLength;

    targetGrowth = 0;
    morphologyGrowth = 0;
    lastMorphologyTime = null;
  }

  /* =========================================================
     GETTERS
     ========================================================= */

  function getMinimumVisibleGrowth() {
    return MIN_VISIBLE_GROWTH;
  }

  /* =========================================================
     API
     ========================================================= */

  return {
    updateGrowth,
    getTailLength,
    getTailWidth,
    getMinimumVisibleGrowth,
    reset,
  };
}