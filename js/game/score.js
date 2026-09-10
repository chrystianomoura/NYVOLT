/* =========================================================
   NYVOLT — SCORE
   ========================================================= */

/* =========================================================
   MODOS
   ========================================================= */

const MODES = Object.freeze({
  CLASSIC: "classic",
  NO_WALL: "no-wall",
});

/* =========================================================
   PERSISTÊNCIA
   ========================================================= */

const STORAGE_KEYS = Object.freeze({
  [MODES.CLASSIC]: "nyvolt-high-score-classic",
  [MODES.NO_WALL]: "nyvolt-high-score-no-wall",
});

const ROUND_KEYS = Object.freeze({
  [MODES.CLASSIC]: "nyvolt-round-started-classic",
  [MODES.NO_WALL]: "nyvolt-round-started-no-wall",
});

const LEGACY_STORAGE_KEYS = Object.freeze({
  [MODES.CLASSIC]: "jaraka-high-score-classic",
  [MODES.NO_WALL]: "jaraka-high-score-no-wall",
});

/* =========================================================
   FORMATAÇÃO
   ========================================================= */

function formatScore(value) {
  return String(value).padStart(3, "0");
}

/* =========================================================
   STORAGE
   ========================================================= */

function readStorage(key) {
  if (!key) {
    return null;
  }

  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStorage(key, value) {
  if (!key) {
    return false;
  }

  try {
    window.localStorage.setItem(key, String(value));

    return true;
  } catch {
    return false;
  }
}

function removeStorage(key) {
  if (!key) {
    return;
  }

  try {
    window.localStorage.removeItem(key);
  } catch {
    return;
  }
}

/* =========================================================
   MIGRAÇÃO
   ========================================================= */

function migrateLegacyHighScore(mode) {
  const storageKey = STORAGE_KEYS[mode];
  const legacyKey = LEGACY_STORAGE_KEYS[mode];

  if (!storageKey || !legacyKey) {
    return;
  }

  if (readStorage(storageKey) !== null) {
    return;
  }

  const legacyValue = readStorage(legacyKey);

  if (legacyValue === null) {
    return;
  }

  const parsedValue = Number.parseInt(legacyValue, 10);

  if (!Number.isFinite(parsedValue) || parsedValue < 0) {
    return;
  }

  if (writeStorage(storageKey, parsedValue)) {
    writeStorage(ROUND_KEYS[mode], "1");

    removeStorage(legacyKey);
  }
}

/* =========================================================
   HIGH SCORE
   ========================================================= */

function readStoredHighScore(mode) {
  migrateLegacyHighScore(mode);

  const storedValue = readStorage(STORAGE_KEYS[mode]);

  if (storedValue === null) {
    return 0;
  }

  const parsedValue = Number.parseInt(storedValue, 10);

  if (!Number.isFinite(parsedValue) || parsedValue < 0) {
    return 0;
  }

  return parsedValue;
}

function writeStoredHighScore(mode, value) {
  return writeStorage(STORAGE_KEYS[mode], value);
}

/* =========================================================
   HISTÓRICO DE PARTIDAS
   ========================================================= */

function hasPreviousRound(mode) {
  migrateLegacyHighScore(mode);

  return readStorage(ROUND_KEYS[mode]) === "1";
}

function registerRound(mode) {
  return writeStorage(ROUND_KEYS[mode], "1");
}

/* =========================================================
   CONTROLLER
   ========================================================= */

export function createScoreController({
  scoreElement,
  highScoreElement,
  onHighScore,
}) {
  let score = 0;
  let highScore = 0;
  let previousHighScore = 0;

  let currentMode = null;

  let highScoreSoundEnabled = false;
  let highScoreTriggered = false;

  /* =========================================================
     RENDER
     ========================================================= */

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

  /* =========================================================
     NOVA PARTIDA
     ========================================================= */

  function startRound(mode) {
    if (!STORAGE_KEYS[mode]) {
      return false;
    }

    currentMode = mode;

    score = 0;

    highScore = readStoredHighScore(mode);
    previousHighScore = highScore;

    highScoreSoundEnabled = hasPreviousRound(mode);
    highScoreTriggered = false;

    registerRound(mode);

    render();

    return true;
  }

  /* =========================================================
     NOVO RECORDE
     ========================================================= */

  function triggerHighScore() {
    if (!highScoreSoundEnabled || highScoreTriggered) {
      return;
    }

    if (score <= previousHighScore) {
      return;
    }

    highScoreTriggered = true;

    if (typeof onHighScore === "function") {
      onHighScore({
        mode: currentMode,
        score,
        previousHighScore,
      });
    }
  }

  /* =========================================================
     PONTUAÇÃO
     ========================================================= */

  function increment() {
    if (!currentMode) {
      return score;
    }

    score += 1;

    triggerHighScore();

    if (score > highScore) {
      highScore = score;

      writeStoredHighScore(currentMode, highScore);
    }

    render();

    return score;
  }

  /* =========================================================
     LEITURA
     ========================================================= */

  function getScore() {
    return score;
  }

  function getHighScore() {
    return highScore;
  }

  function getMode() {
    return currentMode;
  }

  /* =========================================================
     ESTADO INICIAL
     ========================================================= */

  render();

  /* =========================================================
     API
     ========================================================= */

  return {
    startRound,
    increment,

    getScore,
    getHighScore,
    getMode,
  };
}