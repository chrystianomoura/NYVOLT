/* =========================================================
   NYVOLT — ORB SPAWN
   ========================================================= */

import { GRID_COLUMNS, GRID_ROWS } from "./config.js";

import { isSamePosition } from "./collision.js";

/* =========================================================
   CONTROLLER
   ========================================================= */

export function createOrbSpawnController({
  element,
  position,
  orbController,
  getSnake,
  isGameOver,
}) {
  /* =========================================================
     POSIÇÃO
     ========================================================= */

  function getPosition() {
    return position;
  }

  function updatePosition() {
    if (!element) {
      return;
    }

    element.style.setProperty("--orb-x", position.x);

    element.style.setProperty("--orb-y", position.y);
  }

  /* =========================================================
     OCUPAÇÃO
     ========================================================= */

  function isNyvoltPosition(candidate) {
    const snake = getSnake();

    return snake.some((segment) => isSamePosition(segment, candidate));
  }

  /* =========================================================
     CÉLULAS LIVRES
     ========================================================= */

  function getFreeCells() {
    const freeCells = [];

    for (let y = 0; y < GRID_ROWS; y += 1) {
      for (let x = 0; x < GRID_COLUMNS; x += 1) {
        const candidate = {
          x,
          y,
        };

        if (isNyvoltPosition(candidate)) {
          continue;
        }

        freeCells.push(candidate);
      }
    }

    return freeCells;
  }

  /* =========================================================
     POSIÇÃO ALEATÓRIA
     ========================================================= */

  function moveToRandomCell() {
    const freeCells = getFreeCells();

    if (freeCells.length === 0) {
      return false;
    }

    const randomIndex = Math.floor(Math.random() * freeCells.length);

    const nextPosition = freeCells[randomIndex];

    position.x = nextPosition.x;

    position.y = nextPosition.y;

    updatePosition();

    return true;
  }

  /* =========================================================
     ATUALIZAÇÃO VISUAL
     ========================================================= */

  function updateOrb() {
    orbController?.update();
  }

  /* =========================================================
     SPAWN
     ========================================================= */

  function respawn() {
    if (isGameOver()) {
      return false;
    }

    const spawned = moveToRandomCell();

    if (!spawned) {
      return false;
    }

    updateOrb();

    return true;
  }

  function spawnInitial() {
    return respawn();
  }

  /* =========================================================
     LIMPEZA
     ========================================================= */

  function resetVisualState() {
    if (!element) {
      return;
    }

    element.style.opacity = "";
    element.style.scale = "";
    element.style.visibility = "";

    element.style.removeProperty("transform-origin");

    updateOrb();
  }

  /* =========================================================
     COLETA
     ========================================================= */

  function consumeVisually() {
    return respawn();
  }

  /* =========================================================
     API
     ========================================================= */

  return {
    getPosition,
    spawnInitial,
    updatePosition,
    consumeVisually,
    resetVisualState,
  };
}