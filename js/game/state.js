/* =========================================================
   NYVOLT — GAME STATE
   ========================================================= */

/* =========================================================
   UTILITÁRIOS
   ========================================================= */

function cloneSnake(source) {
  return source.map((segment) => ({
    ...segment,
  }));
}

/* =========================================================
   CONTROLLER
   ========================================================= */

export function createGameState({ initialSnake }) {
  const snake = cloneSnake(initialSnake);

  let renderSnake = cloneSnake(snake);

  let previousRenderSnake = cloneSnake(renderSnake);

  let gameOver = false;

  let gameOverReason = null;

  /* =========================================================
     ESTADO LÓGICO
     ========================================================= */

  function getSnake() {
    return snake;
  }

  /* =========================================================
     ESTADO VISUAL
     ========================================================= */

  function getRenderSnake() {
    return renderSnake;
  }

  function getPreviousRenderSnake() {
    return previousRenderSnake;
  }

  function snapshotRenderSnake() {
    previousRenderSnake = cloneSnake(renderSnake);
  }

  function setRenderSnake(nextSnake) {
    renderSnake = nextSnake;
  }

  /* =========================================================
     GAME OVER
     ========================================================= */

  function isGameOver() {
    return gameOver;
  }

  function getGameOverReason() {
    return gameOverReason;
  }

  function endGame(reason) {
    if (gameOver) {
      return false;
    }

    gameOver = true;
    gameOverReason = reason;

    return true;
  }

  /* =========================================================
     API
     ========================================================= */

  return {
    getSnake,

    getRenderSnake,
    getPreviousRenderSnake,
    snapshotRenderSnake,
    setRenderSnake,

    isGameOver,
    getGameOverReason,
    endGame,
  };
}