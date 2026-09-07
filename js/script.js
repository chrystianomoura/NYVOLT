"use strict";

import { createInputController } from "./input.js";

import { createMouseController } from "./mouse.js";

import { createSnakeRenderer } from "./snake.js";

import { isSamePosition, willHitSelf, willHitWall } from "./game/collision.js";

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

/* =========================================================
   THEME
   ========================================================= */

setTheme(THEMES.AZULLY);

/* =========================================================
   ORIENTATION
   ========================================================= */

initOrientationLock();

/* =========================================================
   DOM — TELAS
   ========================================================= */

const startScreenElement = document.getElementById("start-screen");

const gameStage = document.getElementById("game-stage");

const gameModeValue = document.getElementById("game-mode");

/* =========================================================
   DOM — SCORE
   ========================================================= */

const scoreElement = document.getElementById("score");

const highScoreElement = document.getElementById("high-score");

/* =========================================================
   DOM — COUNTDOWN
   ========================================================= */

const countdownElement = document.getElementById("game-countdown");

const countdownValue = document.getElementById("game-countdown-value");

/* =========================================================
   DOM — GAME OVER
   ========================================================= */

const gameOverElement = document.getElementById("game-over");

const gameOverReplayButton = document.getElementById("game-over-replay");

const gameOverExitButton = document.getElementById("game-over-exit");

/* =========================================================
   DOM — GAMEPLAY
   ========================================================= */

const gameBoard = document.querySelector(".game-board");

const snakeLayer = document.querySelector(".snake-layer");

const mouseFood = document.querySelector(".mouse-food");

const mouseActor = mouseFood?.querySelector(".mouse-actor");

/* =========================================================
   CONFIGURAÇÃO INICIAL
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
   ESTADO DA SESSÃO
   ========================================================= */

let currentMode = null;

let roundTransitioning = false;

/* =========================================================
   ESTADO DA RODADA
   ========================================================= */

let gameState = createGameState({
  initialSnake,
});

let growthController = createGrowthController();

let directionController = createDirectionController(initialDirection);

/* =========================================================
   POSIÇÃO COMPARTILHADA DO RATO
   ========================================================= */

const mousePosition = {
  x: 0,
  y: 0,
};

/* =========================================================
   RENDERERS / CONTROLLERS PERSISTENTES
   ========================================================= */

const snakeRenderer = createSnakeRenderer({
  layer: snakeLayer,
});

const mouseController = createMouseController({
  element: mouseFood,

  position: mousePosition,
});

const foodController = createFoodController({
  element: mouseFood,

  actor: mouseActor,

  position: mousePosition,

  mouseController,

  getSnake: () => gameState.getSnake(),

  isGameOver: () => gameState.isGameOver(),
});

const scoreController = createScoreController({
  scoreElement,

  highScoreElement,
});

/* =========================================================
   REFERÊNCIAS TARDIAS
   ========================================================= */

let inputController = null;

let gameLoop = null;

let startScreenController = null;

let gameOverController = null;

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
    },
  });
}

/* =========================================================
   MOVIMENTO LÓGICO
   ========================================================= */

function moveSnake() {
  if (gameState.isGameOver()) {
    return;
  }

  const snake = gameState.getSnake();

  const direction = directionController.applyQueuedDirection();

  inputController?.unlock();

  const head = snake[0];

  const newHead = getNextHeadPosition(head, direction);

  const willEatMouse = isSamePosition(newHead, foodController.getPosition());

  if (willHitWall(newHead)) {
    gameOverController.end("wall");

    return;
  }

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

  if (willEatMouse) {
    growthController.queue();

    scoreController.increment();
  }

  gameState.snapshotRenderSnake();

  const tailBeforeMove = moveSnakeSegments(snake, newHead);

  const didGrow = growthController.applyPendingGrowth(snake, tailBeforeMove);

  const renderSnake = growthController.updateVisualGrowth(snake, didGrow);

  gameState.setRenderSnake(renderSnake);

  snakeRenderer.updateSegmentShapes(snake, direction);

  snakeRenderer.updateHeadDirection(direction);

  mouseController.update(snake[0]);

  if (willEatMouse) {
    startEatingSequence();
  }
}

/* =========================================================
   RENDERIZAÇÃO
   ========================================================= */

function renderGame(progress) {
  snakeRenderer.render(
    gameState.getRenderSnake(),

    gameState.getPreviousRenderSnake(),

    progress,
  );
}

/* =========================================================
   FILA DE DIREÇÃO
   ========================================================= */

function queueDirection(candidate) {
  if (gameState.isGameOver()) {
    return false;
  }

  const result = directionController.queue(candidate);

  if (!result.accepted) {
    return false;
  }

  snakeRenderer.updateHeadDirection(candidate);

  snakeRenderer.triggerHeadTurn(result.turnSide);

  return true;
}

/* =========================================================
   INPUT
   ========================================================= */

function handleDirectionChange(candidate) {
  const accepted = queueDirection(candidate);

  if (!accepted && !gameState.isGameOver()) {
    inputController?.unlock();
  }
}

inputController = createInputController({
  getDirection: () => directionController.getDirection(),

  onDirectionChange: handleDirectionChange,
});

/* =========================================================
   LOOP
   ========================================================= */

gameLoop = createGameLoop({
  onMove: moveSnake,

  onRender: renderGame,

  isGameOver: () => gameState.isGameOver(),
});

/* =========================================================
   TEMPO
   ========================================================= */

function wait(duration) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, duration);
  });
}

/* =========================================================
   COUNTDOWN — VALOR
   ========================================================= */

function renderCountdownValue(value, state = "number") {
  if (!countdownElement || !countdownValue) {
    return;
  }

  countdownElement.dataset.state = state;

  countdownValue.textContent = value;

  countdownValue.style.animation = "none";

  void countdownValue.offsetWidth;

  countdownValue.style.animation = "";
}

/* =========================================================
   COUNTDOWN
   ========================================================= */

async function runCountdown() {
  if (!countdownElement) {
    return;
  }

  countdownElement.hidden = false;

  renderCountdownValue("3");

  await wait(750);

  renderCountdownValue("2");

  await wait(750);

  renderCountdownValue("1");

  await wait(750);

  renderCountdownValue("GO!", "go");

  await wait(550);

  countdownElement.hidden = true;

  countdownElement.removeAttribute("data-state");
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

  scoreController.startRound(mode);

  if (gameModeValue) {
    gameModeValue.textContent = mode === "classic" ? "CLASSIC" : "NO WALL";
  }
}

/* =========================================================
   REVELAÇÃO DOS ATORES
   ========================================================= */

function revealActors() {
  gameStage.classList.remove("game-stage--countdown");
}

/* =========================================================
   INÍCIO / REINÍCIO
   ========================================================= */

async function startGameplay(mode) {
  if (roundTransitioning || !mode) {
    return;
  }

  roundTransitioning = true;

  currentMode = mode;

  inputController.stop();

  gameLoop.stop();

  prepareRound(mode);

  startScreenElement.hidden = true;

  gameStage.classList.remove("game-stage--waiting");

  gameStage.setAttribute("aria-hidden", "false");

  await new Promise((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(resolve);
    });
  });

  await runCountdown();

  revealActors();

  await new Promise((resolve) => {
    requestAnimationFrame(resolve);
  });

  inputController.start();

  gameLoop.start();

  roundTransitioning = false;
}

/* =========================================================
   JOGAR NOVAMENTE
   ========================================================= */

function replayGame() {
  if (!currentMode) {
    return;
  }

  startGameplay(currentMode);
}

/* =========================================================
   SAIR
   ========================================================= */

function exitToStartScreen() {
  if (roundTransitioning) {
    return;
  }

  inputController.stop();

  gameLoop.stop();

  gameStage.classList.add("game-stage--waiting");

  gameStage.classList.remove("game-stage--countdown");

  gameStage.setAttribute("aria-hidden", "true");

  gameOverController.reset();

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

  onReplay: replayGame,

  onExit: exitToStartScreen,
});

/* =========================================================
   START SCREEN
   ========================================================= */

startScreenController = createStartScreen({
  element: startScreenElement,

  onStart: ({ mode }) => {
    startGameplay(mode);
  },
});