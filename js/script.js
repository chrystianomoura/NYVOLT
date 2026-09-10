/* =========================================================
   NYVOLT — SCRIPT
   ========================================================= */

import { createSoundController } from "./audio/sound.js";

import { createInputController } from "./input.js";

import { createOrbController } from "./orb.js";

import { createSnakeRenderer } from "./snake.js";

import { isSamePosition, willHitSelf } from "./game/collision.js";

import { createDirectionController } from "./game/direction.js";

import { createOrbSpawnController } from "./game/orb-spawn.js";

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
   TEMA
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

const orbElement = gameBoard?.querySelector(".energy-orb");

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
   ESTADO INICIAL
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
   ORBE
   ========================================================= */

const orbPosition = {
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
   CONTROLADORES
   ========================================================= */

const soundController = createSoundController();

const snakeRenderer = createSnakeRenderer({
  board: gameBoard,
  layer: snakeLayer,
});

const orbController = createOrbController({
  element: orbElement,
});

const scoreController = createScoreController({
  scoreElement,
  highScoreElement,

  onHighScore: () => {
    soundController.play("highScore");
  },
});

let inputController = null;
let gameLoop = null;
let gameOverController = null;
let startScreenController = null;

/* =========================================================
   ORBE DE ENERGIA
   ========================================================= */

const orbSpawnController = createOrbSpawnController({
  element: orbElement,

  position: orbPosition,

  orbController,

  getSnake: () => gameState.getSnake(),

  isGameOver: () => gameState.isGameOver(),
});

/* =========================================================
   ESPERA
   ========================================================= */

function wait(milliseconds) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, milliseconds);
  });
}

function waitForNextFrame() {
  return new Promise((resolve) => {
    window.requestAnimationFrame(() => {
      resolve();
    });
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
   ABSORÇÃO DE ENERGIA
   ========================================================= */

function startEnergyAbsorption() {
  if (gameState.isGameOver()) {
    return;
  }

  snakeRenderer.triggerEnergyAbsorption({
    onCollect: () => {
      if (gameState.isGameOver()) {
        return;
      }

      orbSpawnController.consumeVisually();
    },
  });
}

/* =========================================================
   INPUT
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

  if (result.turnSide) {
    soundController.play("turn");
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

  const direction = directionController.applyQueuedDirection();

  inputController?.unlock();

  const head = snake[0];

  const rawNextHead = getNextHeadPosition(head, direction);

  const movement = resolveModePosition({
    position: rawNextHead,
    mode: currentMode,
  });

  if (movement.hitWall) {
    gameOverController.end("wall");

    return;
  }

  const newHead = movement.position;

  const willCollectOrb = isSamePosition(
    newHead,
    orbSpawnController.getPosition(),
  );

  if (
    willHitSelf({
      position: newHead,

      snake,

      pendingGrowth: growthController.getPendingGrowth(),

      willGrow: willCollectOrb,
    })
  ) {
    gameOverController.end("self");

    return;
  }

  if (willCollectOrb) {
    growthController.queue();

    scoreController.increment();

    soundController.play("eat");
  }

  gameState.snapshotRenderSnake();

  const tailBeforeMove = moveSnakeSegments(snake, newHead);

  const didGrow = growthController.applyPendingGrowth(snake, tailBeforeMove);

  const renderSnake = growthController.updateVisualGrowth(snake, didGrow);

  gameState.setRenderSnake(renderSnake);

  orbController.update();

  if (willCollectOrb) {
    startEnergyAbsorption();
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

  orbSpawnController.resetVisualState();

  snakeRenderer.create(gameState.getSnake());

  snakeRenderer.render(
    gameState.getRenderSnake(),
    gameState.getPreviousRenderSnake(),
    0,
  );

  orbSpawnController.spawnInitial();

  orbController.update();

  scoreController.startRound(mode);

  if (gameModeValue) {
    gameModeValue.textContent =
      mode === GAME_MODES.CLASSIC ? "CLASSIC" : "NO WALL";
  }
}

/* =========================================================
   INÍCIO
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

  await waitForNextFrame();

  orbController.update();

  await runCountdown();

  gameStage.classList.remove("game-stage--countdown");

  inputController = createInputController({
    getDirection: () => directionController.getDirection(),

    onDirectionChange: handleDirectionChange,
  });

  gameLoop = createGameLoop({
    onMove: moveSnake,

    onRender: (progress) => {
      snakeRenderer.render(
        gameState.getRenderSnake(),
        gameState.getPreviousRenderSnake(),
        progress,
      );

      orbController.update();
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