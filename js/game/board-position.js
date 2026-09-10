/* =========================================================
   NYVOLT — BOARD POSITION
   ========================================================= */

import { GRID_COLUMNS, GRID_ROWS } from "./config.js";

/* =========================================================
   LIMITES
   ========================================================= */

export function isOutsideBoard({ x, y }) {
  return x < 0 || x >= GRID_COLUMNS || y < 0 || y >= GRID_ROWS;
}

/* =========================================================
   BORDA
   ========================================================= */

export function getCrossedBoundary({ x, y }) {
  if (x < 0) {
    return "left";
  }

  if (x >= GRID_COLUMNS) {
    return "right";
  }

  if (y < 0) {
    return "top";
  }

  if (y >= GRID_ROWS) {
    return "bottom";
  }

  return null;
}

/* =========================================================
   NORMALIZAÇÃO
   ========================================================= */

function wrapCoordinate(value, size) {
  return ((value % size) + size) % size;
}

/* =========================================================
   WRAP
   ========================================================= */

export function wrapPosition({ x, y }) {
  return {
    x: wrapCoordinate(x, GRID_COLUMNS),
    y: wrapCoordinate(y, GRID_ROWS),
  };
}

/* =========================================================
   RESOLUÇÃO
   ========================================================= */

export function resolveBoardPosition(position) {
  const crossedBoundary = getCrossedBoundary(position);

  if (!crossedBoundary) {
    return {
      position: {
        x: position.x,
        y: position.y,
      },

      crossed: false,
      boundary: null,
    };
  }

  return {
    position: wrapPosition(position),

    crossed: true,
    boundary: crossedBoundary,
  };
}