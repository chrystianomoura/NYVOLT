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
   DOM — COUNTDOWN
   ========================================================= */

const countdownElement = document.getElementById("game-countdown");

const countdownValue = document.getElementById("game-countdown-value");

/* =========================================================
   DOM — GAMEPLAY
   ========================================================= */

const gameBoard = document.querySelector(".game-board");

const snakeLayer = document.querySelector(".snake-layer");

const mouseFood = document.querySelector(".mouse-food");

const mouseActor = mouseFood?.querySelector(".mouse-actor");

/* =========================================================
   CONFIGURAÇÃO INICIAL

   10 colunas × 22 linhas.

   A Jaraka começa verticalmente,
   aproximadamente no centro da arena,
   apontando para baixo.
   ========================================================= */

const initialSnake = [
  { x: 5, y: 11 },
  { x: 5, y: 10 },
  { x: 5, y: 9 },
  { x: 5, y: 8 },
  { x: 5, y: 7 },
  { x: 5, y: 6 },
];

/* =========================================================
   ESTADO
   ========================================================= */

const gameState = createGameState({
  initialSnake,
});

/* =========================================================
   POSIÇÃO COMPARTILHADA DO RATO
   ========================================================= */

const mousePosition = {
  x: 0,
  y: 0,
};

/* =========================================================
   CONTROLLERS
   ========================================================= */

const snakeRenderer = createSnakeRenderer({
  layer: snakeLayer,
});

const mouseController = createMouseController({
  element: mouseFood,

  position: mousePosition,
});

const growthController = createGrowthController();

const directionController = createDirectionController({
  x: 0,
  y: 1,
});

const foodController = createFoodController({
  element: mouseFood,

  actor: mouseActor,

  position: mousePosition,

  mouseController,

  getSnake: () => gameState.getSnake(),

  isGameOver: () => gameState.isGameOver(),
});

/* =========================================================
   REFERÊNCIAS TARDIAS
   ========================================================= */

let inputController = null;

let gameLoop = null;

/* =========================================================
   GAME OVER
   ========================================================= */

const gameOverController = createGameOverController({
  gameBoard,

  gameState,

  getInputController: () => inputController,

  getGameLoop: () => gameLoop,
});

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

  /* -------------------------------------------------------
     ALIMENTAÇÃO
     ------------------------------------------------------- */

  const willEatMouse = isSamePosition(newHead, foodController.getPosition());

  /* -------------------------------------------------------
     COLISÃO COM PAREDE
     ------------------------------------------------------- */

  if (willHitWall(newHead)) {
    gameOverController.end("wall");

    return;
  }

  /* -------------------------------------------------------
     COLISÃO COM O CORPO
     ------------------------------------------------------- */

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

  /* -------------------------------------------------------
     CRESCIMENTO
     ------------------------------------------------------- */

  if (willEatMouse) {
    growthController.queue();
  }

  /* -------------------------------------------------------
     SNAPSHOT VISUAL
     ------------------------------------------------------- */

  gameState.snapshotRenderSnake();

  /* -------------------------------------------------------
     MOVIMENTO
     ------------------------------------------------------- */

  const tailBeforeMove = moveSnakeSegments(snake, newHead);

  /* -------------------------------------------------------
     CRESCIMENTO LÓGICO
     ------------------------------------------------------- */

  const didGrow = growthController.applyPendingGrowth(snake, tailBeforeMove);

  /* -------------------------------------------------------
     CRESCIMENTO VISUAL
     ------------------------------------------------------- */

  const renderSnake = growthController.updateVisualGrowth(snake, didGrow);

  gameState.setRenderSnake(renderSnake);

  /* -------------------------------------------------------
     RENDERER
     ------------------------------------------------------- */

  snakeRenderer.updateSegmentShapes(snake, direction);

  snakeRenderer.updateHeadDirection(direction);

  mouseController.update(snake[0]);

  /* -------------------------------------------------------
     ALIMENTAÇÃO VISUAL
     ------------------------------------------------------- */

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
   PREPARAÇÃO DA PARTIDA

   A cobra e o rato são preparados internamente
   antes da contagem, garantindo que possam surgir
   instantaneamente quando GO terminar.

   Durante o countdown, porém, o CSS mantém
   ambos invisíveis.
   ========================================================= */

const initialDirection = directionController.getDirection();

snakeRenderer.create(gameState.getSnake(), initialDirection);

foodController.spawnInitial();

snakeRenderer.render(
  gameState.getRenderSnake(),

  gameState.getPreviousRenderSnake(),

  0,
);

/* =========================================================
   UTILITÁRIO DE TEMPO
   ========================================================= */

function wait(duration) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, duration);
  });
}

/* =========================================================
   COUNTDOWN — RENDER
   ========================================================= */

function renderCountdownValue(value, state = "number") {
  if (!countdownElement || !countdownValue) {
    return;
  }

  countdownElement.dataset.state = state;

  countdownValue.textContent = value;

  /*
   * Reinicia a animação de entrada
   * em cada número.
   */

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

  /* -------------------------------------------------------
     3
     ------------------------------------------------------- */

  renderCountdownValue("3");

  await wait(750);

  /* -------------------------------------------------------
     2
     ------------------------------------------------------- */

  renderCountdownValue("2");

  await wait(750);

  /* -------------------------------------------------------
     1
     ------------------------------------------------------- */

  renderCountdownValue("1");

  await wait(750);

  /* -------------------------------------------------------
     GO
     ------------------------------------------------------- */

  renderCountdownValue("GO!", "go");

  await wait(550);

  /* -------------------------------------------------------
     FIM
     ------------------------------------------------------- */

  countdownElement.hidden = true;

  countdownElement.removeAttribute("data-state");
}

/* =========================================================
   REVELAÇÃO DOS ATORES
   ========================================================= */

function revealActors() {
  /*
   * Remover esta classe faz cobra e rato
   * aparecerem juntos no mesmo frame.
   */

  gameStage.classList.remove("game-stage--countdown");
}

/* =========================================================
   INÍCIO REAL
   ========================================================= */

async function startGameplay(mode) {
  /* -------------------------------------------------------
     HUD
     ------------------------------------------------------- */

  if (gameModeValue) {
    gameModeValue.textContent = mode === "classic" ? "CLASSIC" : "NO WALL";
  }

  /* -------------------------------------------------------
     PREPARA ESTADO DE COUNTDOWN
     ------------------------------------------------------- */

  gameStage.classList.add("game-stage--countdown");

  /* -------------------------------------------------------
     TROCA DE TELA
     ------------------------------------------------------- */

  startScreenElement.hidden = true;

  gameStage.classList.remove("game-stage--waiting");

  gameStage.setAttribute("aria-hidden", "false");

  /*
   * Esperamos dois frames para garantir
   * que arena e countdown sejam pintados
   * antes de iniciar a sequência.
   */

  await new Promise((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(resolve);
    });
  });

  /* -------------------------------------------------------
     COUNTDOWN

     Cobra e rato continuam invisíveis.
     Input e loop continuam desligados.
     ------------------------------------------------------- */

  await runCountdown();

  /* -------------------------------------------------------
     GO TERMINOU

     Cobra e rato aparecem simultaneamente.
     ------------------------------------------------------- */

  revealActors();

  /*
   * Um frame garante que os dois atores
   * sejam pintados juntos antes do primeiro
   * avanço lógico da cobra.
   */

  await new Promise((resolve) => {
    requestAnimationFrame(resolve);
  });

  /* -------------------------------------------------------
     PARTIDA
     ------------------------------------------------------- */

  inputController.start();

  gameLoop.start();
}

/* =========================================================
   START SCREEN
   ========================================================= */

createStartScreen({
  element: startScreenElement,

  onStart: ({ mode }) => {
    startGameplay(mode);
  },
});