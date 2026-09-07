/* =========================================================
   JARAKA — SCRIPT
   Orquestração principal do jogo
   ========================================================= */

import { createSoundController } from "./audio/sound.js";

import { createInputController } from "./input.js";

import { createMouseController } from "./mouse.js";

import { createSnakeRenderer } from "./snake.js";

import { isSamePosition, willHitSelf } from "./game/collision.js";

import { createDirectionController } from "./game/direction.js";

import { createFoodController } from "./game/food.js";

import { createGameOverController } from "./game/game-over.js";

import { createGrowthController } from "./game/growth.js";

import { createGameLoop } from "./game/loop.js";

import { getNextHeadPosition, moveSnakeSegments } from "./game/movement.js";

import { initOrientationLock } from "./game/orientation.js";

import { createScoreController } from "./game/score.js";

import { createStartScreen } from "./game/start-screen.js";

import { createGameState } from "./game/state.js";

import { setTheme, THEMES } from "./game/theme.js";

import { GAME_MODES, resolveModePosition } from "./game/mode.js";

/* =========================================================
   TEMA PADRÃO
   ========================================================= */

setTheme(THEMES.AZULLY);

/* =========================================================
   ORIENTAÇÃO
   ========================================================= */

initOrientationLock();

/* =========================================================
   DOM — START
   ========================================================= */

const startScreenElement = document.querySelector("#start-screen");

/* =========================================================
   DOM — GAME
   ========================================================= */

const gameStage = document.querySelector(".game-stage");

const gameBoard = document.querySelector(".game-board");

const snakeLayer = gameBoard?.querySelector(".snake-layer");

const mouseElement = gameBoard?.querySelector(".mouse-food");

const mouseActor = mouseElement?.querySelector(".mouse-actor");

/* =========================================================
   DOM — HUD
   ========================================================= */

const gameModeValue = document.querySelector("#game-mode");

const scoreElement = document.querySelector("#score");

const highScoreElement = document.querySelector("#high-score");

/* =========================================================
   DOM — COUNTDOWN
   ========================================================= */

const countdownElement = document.querySelector("#game-countdown");

const countdownValueElement = document.querySelector("#game-countdown-value");

/* =========================================================
   DOM — GAME OVER
   ========================================================= */

const gameOverElement = document.querySelector("#game-over");

const gameOverReplayButton = document.querySelector("#game-over-replay");

const gameOverExitButton = document.querySelector("#game-over-exit");

/* =========================================================
   ESTADO INICIAL DA COBRA
   ========================================================= */

const initialSnake = [
  { x: 5, y: 11 },
  { x: 5, y: 10 },
  { x: 5, y: 9 },
  { x: 5, y: 8 },
  { x: 5, y: 7 },
  { x: 5, y: 6 },
];

const initialDirection = {
  x: 0,
  y: 1,
};

/* =========================================================
   POSIÇÃO DO RATO
   ========================================================= */

const mousePosition = {
  x: 0,
  y: 0,
};

/* =========================================================
   ESTADO DA RODADA
   ========================================================= */

let currentMode = null;

let roundTransitioning = false;

let gameState = createGameState({
  initialSnake,
});

let growthController = createGrowthController();

let directionController = createDirectionController(initialDirection);

/* =========================================================
   CONTROLADORES FIXOS
   ========================================================= */

const soundController = createSoundController();

const snakeRenderer = createSnakeRenderer({
  board: gameBoard,
  layer: snakeLayer,
});

const mouseController = createMouseController({
  element: mouseElement,
});

const scoreController = createScoreController({
  scoreElement,
  highScoreElement,
});

/* =========================================================
   CONTROLADORES MUTÁVEIS
   ========================================================= */

let inputController = null;

let gameLoop = null;

let gameOverController = null;

let startScreenController = null;

/* =========================================================
   FOOD
   ========================================================= */

const foodController = createFoodController({
  element: mouseElement,

  actor: mouseActor,

  position: mousePosition,

  mouseController,

  getSnake: () => gameState.getSnake(),

  isGameOver: () => gameState.isGameOver(),
});

/* =========================================================
   UTILITÁRIO — ESPERA
   ========================================================= */

function wait(milliseconds) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, milliseconds);
  });
}

/* =========================================================
   COUNTDOWN
   ========================================================= */

async function runCountdown() {
  if (!countdownElement || !countdownValueElement) {
    return;
  }

  countdownElement.hidden = false;

  const steps = [
    {
      value: "3",
      state: "number",
      duration: 700,
    },
    {
      value: "2",
      state: "number",
      duration: 700,
    },
    {
      value: "1",
      state: "number",
      duration: 700,
    },
    {
      value: "GO!",
      state: "go",
      duration: 620,
    },
  ];

  for (const step of steps) {
    countdownElement.setAttribute("data-state", step.state);

    countdownValueElement.textContent = step.value;

    countdownValueElement.style.animation = "none";

    void countdownValueElement.offsetWidth;

    countdownValueElement.style.animation = "";

    await wait(step.duration);
  }

  countdownElement.hidden = true;

  countdownElement.removeAttribute("data-state");
}

/* =========================================================
   ALIMENTAÇÃO
   ========================================================= */

function startEatingSequence() {
  if (gameState.isGameOver()) {
    return;
  }

  snakeRenderer.triggerEatingSequence({
    onMouseEnter: () => {
      if (gameState.isGameOver()) {
        return;
      }

      foodController.consumeVisually();
    },

    onSwallowComplete: () => {
      if (gameState.isGameOver()) {
        return;
      }

      /*
       * O crescimento lógico já foi aplicado
       * pelo growthController.
       *
       * Aqui termina apenas a sequência visual.
       */
    },
  });
}

/* =========================================================
   INPUT — TROCA DE DIREÇÃO
   ========================================================= */

function handleDirectionChange(candidate) {
  if (gameState.isGameOver()) {
    inputController?.unlock();

    return;
  }

  const result = directionController.queue(candidate);

  if (!result.accepted) {
    inputController?.unlock();

    return;
  }

  /*
   * A direção lógica só será aplicada
   * no próximo tick.
   *
   * A cabeça pode antecipar visualmente
   * a intenção aceita.
   */

  snakeRenderer.updateHeadDirection(candidate);

  if (result.turnSide) {
    soundController.play("turn");

    snakeRenderer.triggerHeadTurn(result.turnSide);
  }
}

/* =========================================================
   MOVIMENTO
   ========================================================= */

function moveSnake() {
  if (gameState.isGameOver()) {
    return;
  }

  const snake = gameState.getSnake();

  /*
   * A direção que estava aguardando na fila
   * passa a ser a direção lógica deste tick.
   */

  const direction = directionController.applyQueuedDirection();

  /*
   * Agora uma nova entrada pode ser aceita.
   */

  inputController?.unlock();

  const head = snake[0];

  /* =======================================================
     PRÓXIMA POSIÇÃO BRUTA
     ======================================================= */

  const rawNextHead = getNextHeadPosition(head, direction);

  /* =======================================================
     REGRA DO MODO
     ======================================================= */

  const movement = resolveModePosition({
    position: rawNextHead,

    mode: currentMode,
  });

  /* =======================================================
     PAREDE — CLASSIC
     ======================================================= */

  if (movement.hitWall) {
    gameOverController.end("wall");

    return;
  }

  /*
   * CLASSIC:
   * posição normal.
   *
   * NO WALL:
   * posição normalizada no lado oposto.
   */

  const newHead = movement.position;

  /* =======================================================
     ALIMENTAÇÃO
     ======================================================= */

  const willEatMouse = isSamePosition(newHead, foodController.getPosition());

  /* =======================================================
     COLISÃO COM O PRÓPRIO CORPO
     ======================================================= */

  if (
    willHitSelf({
      position: newHead,

      snake,

      pendingGrowth: growthController.getPendingGrowth(),

      willGrow: willEatMouse,
    })
  ) {
    gameOverController.end("self");

    return;
  }

  /* =======================================================
     FILA DE CRESCIMENTO + SCORE
     ======================================================= */

  if (willEatMouse) {
    growthController.queue();

    scoreController.increment();

    soundController.play("eat");
  }

  /* =======================================================
     SNAPSHOT VISUAL
     ======================================================= */

  gameState.snapshotRenderSnake();

  /* =======================================================
     MOVIMENTO DOS SEGMENTOS
     ======================================================= */

  const tailBeforeMove = moveSnakeSegments(snake, newHead);

  /* =======================================================
     CRESCIMENTO LÓGICO
     ======================================================= */

  const didGrow = growthController.applyPendingGrowth(snake, tailBeforeMove);

  /* =======================================================
     CRESCIMENTO VISUAL
     ======================================================= */

  const renderSnake = growthController.updateVisualGrowth(snake, didGrow);

  gameState.setRenderSnake(renderSnake);

  /* =======================================================
     RENDERER
     ======================================================= */

  snakeRenderer.updateSegmentShapes(snake, direction);

  snakeRenderer.updateHeadDirection(direction);

  /* =======================================================
     RATO — EXPRESSÃO
     ======================================================= */

  mouseController.update(newHead, mousePosition);

  /* =======================================================
     ALIMENTAÇÃO — VISUAL
     ======================================================= */

  if (willEatMouse) {
    startEatingSequence();
  }
}

/* =========================================================
   PREPARAÇÃO DA RODADA
   ========================================================= */

function prepareRound(mode) {
  gameStage.classList.add("game-stage--countdown");

  gameOverController.reset();

  gameState = createGameState({
    initialSnake,
  });

  growthController = createGrowthController();

  directionController = createDirectionController(initialDirection);

  inputController?.unlock();

  foodController.resetVisualState();

  const direction = directionController.getDirection();

  snakeRenderer.create(gameState.getSnake(), direction);

  snakeRenderer.render(
    gameState.getRenderSnake(),
    gameState.getPreviousRenderSnake(),
    0,
  );

  foodController.spawnInitial();

  mouseController.update(gameState.getSnake()[0], mousePosition);

  scoreController.startRound(mode);

  if (gameModeValue) {
    gameModeValue.textContent =
      mode === GAME_MODES.CLASSIC ? "CLASSIC" : "NO WALL";
  }
}

/* =========================================================
   INÍCIO DA PARTIDA
   ========================================================= */

async function startGameplay(mode) {
  if (roundTransitioning) {
    return;
  }

  roundTransitioning = true;

  currentMode = mode;

  inputController?.stop();

  gameLoop?.stop();

  prepareRound(mode);

  startScreenElement.hidden = true;

  gameStage.classList.remove("game-stage--waiting");

  await runCountdown();

  gameStage.classList.remove("game-stage--countdown");

  /* =======================================================
     INPUT
     ======================================================= */

  inputController = createInputController({
    getDirection: () => directionController.getDirection(),

    onDirectionChange: handleDirectionChange,
  });

  /* =======================================================
     LOOP
     ======================================================= */

  gameLoop = createGameLoop({
    onMove: moveSnake,

    onRender: (progress) => {
      snakeRenderer.render(
        gameState.getRenderSnake(),
        gameState.getPreviousRenderSnake(),
        progress,
      );
    },

    isGameOver: () => gameState.isGameOver(),
  });

  inputController.start();

  gameLoop.start();

  roundTransitioning = false;
}

/* =========================================================
   REPLAY
   ========================================================= */

function replayGame() {
  if (!currentMode || roundTransitioning) {
    return;
  }

  soundController.play("restart");

  startGameplay(currentMode);
}

/* =========================================================
   SAIR
   ========================================================= */

function exitToStartScreen() {
  soundController.play("exit");

  inputController?.stop();

  gameLoop?.stop();

  roundTransitioning = false;

  gameOverController.reset();

  gameStage.classList.add("game-stage--waiting");

  startScreenController.reset();

  startScreenElement.hidden = false;

  currentMode = null;
}

/* =========================================================
   GAME OVER
   ========================================================= */

gameOverController = createGameOverController({
  gameBoard,
  gameStage,

  overlay: gameOverElement,

  replayButton: gameOverReplayButton,

  exitButton: gameOverExitButton,

  getGameState: () => gameState,

  getInputController: () => inputController,

  getGameLoop: () => gameLoop,

  soundController,

  onReplay: replayGame,

  onExit: exitToStartScreen,
});

/* =========================================================
   START SCREEN
   ========================================================= */

startScreenController = createStartScreen({
  element: startScreenElement,

  soundController,

  onStart: ({ mode }) => {
    startGameplay(mode);
  },
});