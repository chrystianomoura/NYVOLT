/* =========================================================
   NYVOLT — GAME OVER
   ========================================================= */

/* =========================================================
   CONSTANTES
   ========================================================= */

const DEATH_ANIMATION_NAME = "nyvolt-death-blink";

const GAME_OVER_SOUND_DELAY = 90;

/* =========================================================
   CONTROLLER
   ========================================================= */

export function createGameOverController({
  gameBoard,
  gameStage,
  overlay,
  replayButton,
  exitButton,
  getGameState,
  getInputController,
  getGameLoop,
  soundController,
  onReplay,
  onExit,
}) {
  const snakeLayer = gameBoard?.querySelector(".snake-layer");

  let waitingForDeathAnimation = false;

  /* =========================================================
     INTERFACE
     ========================================================= */

  function hideInterface() {
    if (overlay) {
      overlay.hidden = true;
    }

    gameStage?.classList.remove("game-stage--game-over");
  }

  function revealInterface() {
    const gameState = getGameState?.();

    if (!gameState?.isGameOver()) {
      return;
    }

    if (!waitingForDeathAnimation) {
      return;
    }

    waitingForDeathAnimation = false;

    gameBoard?.setAttribute("data-game-state", "game-over");

    if (overlay) {
      overlay.hidden = false;
    }

    gameStage?.classList.add("game-stage--game-over");
  }

  /* =========================================================
     ANIMAÇÃO DE MORTE
     ========================================================= */

  function handleDeathAnimationEnd(event) {
    if (!waitingForDeathAnimation) {
      return;
    }

    if (event.animationName !== DEATH_ANIMATION_NAME) {
      return;
    }

    if (event.target !== snakeLayer) {
      return;
    }

    revealInterface();
  }

  /* =========================================================
     RESET
     ========================================================= */

  function reset() {
    waitingForDeathAnimation = false;

    hideInterface();

    gameBoard?.removeAttribute("data-game-state");

    gameBoard?.removeAttribute("data-game-over-reason");
  }

  /* =========================================================
     ENCERRAMENTO
     ========================================================= */

  function end(reason) {
    const gameState = getGameState?.();

    if (!gameState) {
      return false;
    }

    const didEnd = gameState.endGame(reason);

    if (!didEnd) {
      return false;
    }

    soundController?.play("hit");

    window.setTimeout(() => {
      soundController?.play("gameOver");
    }, GAME_OVER_SOUND_DELAY);

    const inputController = getInputController?.();

    const gameLoop = getGameLoop?.();

    inputController?.stop();

    gameLoop?.stop();

    waitingForDeathAnimation = true;

    gameBoard?.setAttribute("data-game-over-reason", reason);

    gameBoard?.setAttribute("data-game-state", "dying");

    console.info(`NYVOLT — Game Over: ${gameState.getGameOverReason()}`);

    return true;
  }

  /* =========================================================
     EVENTOS
     ========================================================= */

  snakeLayer?.addEventListener("animationend", handleDeathAnimationEnd);

  replayButton?.addEventListener("click", () => {
    onReplay?.();
  });

  exitButton?.addEventListener("click", () => {
    onExit?.();
  });

  /* =========================================================
     API
     ========================================================= */

  return {
    end,
    reset,
  };
}