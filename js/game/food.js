/* =========================================================
   NYVOLT — ENERGY ORB
   Gerenciamento do orbe de energia durante a partida

   Responsabilidades:
   - manter a posição lógica do orbe;
   - encontrar células livres;
   - escolher uma nova posição;
   - atualizar a posição visual;
   - controlar o primeiro spawn;
   - controlar coleta e respawn.

   O controlador lógico e o renderer do orbe
   compartilham o mesmo objeto de posição.
   ========================================================= */

import { GRID_COLUMNS, GRID_ROWS } from "./config.js";

import { isSamePosition } from "./collision.js";

/* =========================================================
   CONTROLLER
   ========================================================= */

export function createFoodController({
  element,

  position,

  orbController,

  getSnake,

  isGameOver,
}) {
  /* =======================================================
     POSIÇÃO
     ======================================================= */

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

  /* =======================================================
     NYVOLT
     ======================================================= */

  function isNyvoltPosition(candidate) {
    const snake = getSnake();

    return snake.some((segment) => isSamePosition(segment, candidate));
  }

  /* =======================================================
     CÉLULAS LIVRES
     ======================================================= */

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

  /* =======================================================
     POSIÇÃO ALEATÓRIA
     ======================================================= */

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

  /* =======================================================
     ATUALIZAÇÃO VISUAL
     ======================================================= */

  function updateOrb() {
    orbController?.update();
  }

  /* =======================================================
     PRIMEIRO SPAWN
     ======================================================= */

  function spawnInitial() {
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

  /* =======================================================
     LIMPEZA ENTRE RODADAS
     ======================================================= */

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

  /* =======================================================
     RESPAWN
     ======================================================= */

  function respawnInstantly() {
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

  /* =======================================================
     COLETA
     ======================================================= */

  function consumeVisually() {
    if (isGameOver()) {
      return false;
    }

    /*
     * O orbe é absorvido imediatamente
     * e reaparece em uma nova célula livre.
     *
     * A resposta visual da coleta acontece
     * no núcleo interno da própria NYVOLT.
     */
    return respawnInstantly();
  }

  /* =======================================================
     API
     ======================================================= */

  return {
    getPosition,

    spawnInitial,

    updatePosition,

    consumeVisually,

    resetVisualState,
  };
}