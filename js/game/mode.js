/* =========================================================
   JARAKA — MODE
   Regras específicas dos modos de jogo

   Responsabilidades:
   - interpretar a posição seguinte conforme o modo;
   - decidir se a parede é fatal;
   - aplicar wrap no modo NO WALL;
   - devolver metadados da travessia.

   Este módulo NÃO conhece:
   - DOM;
   - renderização;
   - cobra;
   - rato;
   - score;
   - game over.
   ========================================================= */

import { isOutsideBoard, resolveBoardPosition } from "./board-position.js";

/* =========================================================
   MODOS
   ========================================================= */

export const GAME_MODES = Object.freeze({
  CLASSIC: "classic",
  NO_WALL: "no-wall",
});

/* =========================================================
   VALIDAÇÃO
   ========================================================= */

export function isValidGameMode(mode) {
  return mode === GAME_MODES.CLASSIC || mode === GAME_MODES.NO_WALL;
}

/* =========================================================
   CLASSIC
   ========================================================= */

function resolveClassicPosition(position) {
  const outsideBoard = isOutsideBoard(position);

  return {
    position: {
      x: position.x,
      y: position.y,
    },

    crossed: false,

    boundary: null,

    hitWall: outsideBoard,
  };
}

/* =========================================================
   NO WALL
   ========================================================= */

function resolveNoWallPosition(position) {
  const resolved = resolveBoardPosition(position);

  return {
    position: resolved.position,

    crossed: resolved.crossed,

    boundary: resolved.boundary,

    hitWall: false,
  };
}

/* =========================================================
   RESOLUÇÃO DO MOVIMENTO

   Retorno padronizado:

   {
     position: { x, y },
     crossed: boolean,
     boundary: string | null,
     hitWall: boolean
   }
   ========================================================= */

export function resolveModePosition({ position, mode }) {
  if (mode === GAME_MODES.NO_WALL) {
    return resolveNoWallPosition(position);
  }

  return resolveClassicPosition(position);
}