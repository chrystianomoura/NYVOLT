/* =========================================================
   JARAKA — SCORE
   Pontuação e recordes

   Responsabilidades:
   - manter a pontuação da partida atual;
   - manter recordes independentes por modo;
   - persistir os recordes no localStorage;
   - atualizar SCORE e HIGH SCORE no HUD.

   A formatação usa no mínimo 3 dígitos:
   0   → 000
   7   → 007
   42  → 042
   100 → 100
   1000 → 1000
   ========================================================= */

/* =========================================================
   MODOS
   ========================================================= */

const MODES = {
  CLASSIC: "classic",
  NO_WALL: "no-wall",
};

/* =========================================================
   CHAVES DE PERSISTÊNCIA
   ========================================================= */

const STORAGE_KEYS = {
  [MODES.CLASSIC]: "jaraka-high-score-classic",

  [MODES.NO_WALL]: "jaraka-high-score-no-wall",
};

/* =========================================================
   FORMATAÇÃO
   ========================================================= */

function formatScore(value) {
  return String(value).padStart(3, "0");
}

/* =========================================================
   LEITURA SEGURA
   ========================================================= */

function readStoredHighScore(mode) {
  const storageKey = STORAGE_KEYS[mode];

  if (!storageKey) {
    return 0;
  }

  try {
    const storedValue = window.localStorage.getItem(storageKey);

    if (storedValue === null) {
      return 0;
    }

    const parsedValue = Number.parseInt(storedValue, 10);

    if (!Number.isFinite(parsedValue) || parsedValue < 0) {
      return 0;
    }

    return parsedValue;
  } catch {
    return 0;
  }
}

/* =========================================================
   ESCRITA SEGURA
   ========================================================= */

function writeStoredHighScore(mode, value) {
  const storageKey = STORAGE_KEYS[mode];

  if (!storageKey) {
    return false;
  }

  try {
    window.localStorage.setItem(storageKey, String(value));

    return true;
  } catch {
    return false;
  }
}

/* =========================================================
   CONTROLLER
   ========================================================= */

export function createScoreController({ scoreElement, highScoreElement }) {
  let score = 0;

  let highScore = 0;

  let currentMode = null;

  /* =======================================================
     RENDER
     ======================================================= */

  function renderScore() {
    if (!scoreElement) {
      return;
    }

    scoreElement.textContent = formatScore(score);
  }

  function renderHighScore() {
    if (!highScoreElement) {
      return;
    }

    highScoreElement.textContent = formatScore(highScore);
  }

  function render() {
    renderScore();

    renderHighScore();
  }

  /* =======================================================
     NOVA PARTIDA
     ======================================================= */

  function startRound(mode) {
    if (!STORAGE_KEYS[mode]) {
      return false;
    }

    currentMode = mode;

    score = 0;

    highScore = readStoredHighScore(mode);

    render();

    return true;
  }

  /* =======================================================
     PONTUAÇÃO
     ======================================================= */

  function increment() {
    if (!currentMode) {
      return score;
    }

    score += 1;

    if (score > highScore) {
      highScore = score;

      writeStoredHighScore(currentMode, highScore);
    }

    render();

    return score;
  }

  /* =======================================================
     LEITURA
     ======================================================= */

  function getScore() {
    return score;
  }

  function getHighScore() {
    return highScore;
  }

  function getMode() {
    return currentMode;
  }

  /* =======================================================
     ESTADO INICIAL
     ======================================================= */

  render();

  /* =======================================================
     API
     ======================================================= */

  return {
    startRound,
    increment,

    getScore,
    getHighScore,
    getMode,
  };
}