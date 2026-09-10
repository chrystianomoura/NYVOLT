/* =========================================================
   NYVOLT — MODE
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
   RESOLUÇÃO
   ========================================================= */

export function resolveModePosition({ position, mode }) {
  if (mode === GAME_MODES.NO_WALL) {
    return resolveNoWallPosition(position);
  }

  return resolveClassicPosition(position);
}