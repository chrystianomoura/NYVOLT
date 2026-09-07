/* =========================================================
   JARAKA — GAME OVER
   Encerramento e apresentação do fim da partida

   Sequência:
   1. registra o fim lógico;
   2. toca o impacto da colisão;
   3. inicia o lamento do Game Over após 90 ms;
   4. interrompe input e loop imediatamente;
   5. preserva a posição final da cobra e do rato;
   6. executa três piscadas fluidas;
   7. animationend confirma o término exato;
   8. cobra e rato desaparecem;
   9. GAME / OVER entra no mesmo instante.

   Não existe timer para sincronizar a transição visual.
   A própria animação CSS determina seu término.

   O único timer existente pertence à composição sonora
   da morte: HIT → GAME OVER.
   ========================================================= */

/* =========================================================
   CONSTANTES
   ========================================================= */

const DEATH_ANIMATION_NAME = "jaraka-death-blink";

const GAME_OVER_SOUND_DELAY = 90;

/* =========================================================
   FACTORY
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

  /* =======================================================
     INTERFACE
     ======================================================= */

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

    /*
     * Atores desaparecem imediatamente pela regra CSS:
     *
     * [data-game-state="game-over"]
     *
     * Não existe animação intermediária.
     */

    gameBoard?.setAttribute("data-game-state", "game-over");

    /*
     * O menu entra no mesmo ciclo da conclusão
     * da terceira piscada.
     */

    if (overlay) {
      overlay.hidden = false;
    }

    /*
     * A classe também dispara o pulso cromático
     * de SCORE e HIGH SCORE.
     */

    gameStage?.classList.add("game-stage--game-over");
  }

  /* =======================================================
     FIM DA ANIMAÇÃO DE MORTE
     ======================================================= */

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

  /* =======================================================
     RESET VISUAL
     ======================================================= */

  function reset() {
    waitingForDeathAnimation = false;

    hideInterface();

    gameBoard?.removeAttribute("data-game-state");

    gameBoard?.removeAttribute("data-game-over-reason");
  }

  /* =======================================================
     ENCERRAMENTO
     ======================================================= */

  function end(reason) {
    const gameState = getGameState?.();

    if (!gameState) {
      return false;
    }

    const didEnd = gameState.endGame(reason);

    if (!didEnd) {
      return false;
    }

    /*
     * O estado lógico já confirmou que esta é uma morte
     * válida.
     *
     * Primeiro ouvimos o impacto físico da colisão.
     */

    soundController?.play("hit");

    /*
     * Pequeno intervalo para o cérebro separar:
     *
     * 1. colisão;
     * 2. derrota.
     *
     * O lamento começa 90 ms depois.
     */

    window.setTimeout(() => {
      soundController?.play("gameOver");
    }, GAME_OVER_SOUND_DELAY);

    const inputController = getInputController?.();

    const gameLoop = getGameLoop?.();

    /*
     * Congela a rodada imediatamente.
     */

    inputController?.stop();

    gameLoop?.stop();

    /*
     * A partir daqui aguardamos exclusivamente
     * o animationend da sequência visual de morte.
     */

    waitingForDeathAnimation = true;

    gameBoard?.setAttribute("data-game-over-reason", reason);

    gameBoard?.setAttribute("data-game-state", "dying");

    console.info(`JARAKA — Game Over: ${gameState.getGameOverReason()}`);

    return true;
  }

  /* =======================================================
     EVENTOS — ANIMAÇÃO
     ======================================================= */

  snakeLayer?.addEventListener("animationend", handleDeathAnimationEnd);

  /* =======================================================
     EVENTOS — BOTÕES
     ======================================================= */

  replayButton?.addEventListener("click", () => {
    onReplay?.();
  });

  exitButton?.addEventListener("click", () => {
    onExit?.();
  });

  /* =======================================================
     API
     ======================================================= */

  return {
    end,
    reset,
  };
}