/* =========================================================
   NYVOLT — SNAKE WRAP
   ========================================================= */

import { GRID_COLUMNS, GRID_ROWS } from "../game/config.js";

/* =========================================================
   DISTÂNCIAS
   ========================================================= */

function getDelta(from, to) {
  return {
    x: to.x - from.x,
    y: to.y - from.y,
  };
}

/* =========================================================
   DETECÇÃO
   ========================================================= */

function getWrapTransition(from, to) {
  const delta = getDelta(from, to);

  if (Math.abs(delta.x) > GRID_COLUMNS / 2) {
    return {
      crossed: true,
      axis: "x",

      boundary: delta.x < 0 ? "right" : "left",
    };
  }

  if (Math.abs(delta.y) > GRID_ROWS / 2) {
    return {
      crossed: true,
      axis: "y",

      boundary: delta.y < 0 ? "bottom" : "top",
    };
  }

  return {
    crossed: false,
    axis: null,
    boundary: null,
  };
}

/* =========================================================
   POSIÇÃO VIRTUAL
   ========================================================= */

export function getVirtualPosition(from, to) {
  const transition = getWrapTransition(from, to);

  if (!transition.crossed) {
    return {
      x: to.x,
      y: to.y,
    };
  }

  if (transition.axis === "x") {
    if (transition.boundary === "right") {
      return {
        x: to.x + GRID_COLUMNS,

        y: to.y,
      };
    }

    return {
      x: to.x - GRID_COLUMNS,

      y: to.y,
    };
  }

  if (transition.boundary === "bottom") {
    return {
      x: to.x,

      y: to.y + GRID_ROWS,
    };
  }

  return {
    x: to.x,

    y: to.y - GRID_ROWS,
  };
}