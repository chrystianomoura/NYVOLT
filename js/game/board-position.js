/* =========================================================
   JARAKA — BOARD POSITION
   Operações espaciais do grid lógico

   Responsabilidades:
   - identificar posições fora dos limites;
   - normalizar posições para o lado oposto do tabuleiro;
   - identificar por qual borda ocorreu a travessia.

   Este módulo NÃO conhece:
   - CLASSIC;
   - NO WALL;
   - cobra;
   - colisão;
   - renderização.

   Ele trabalha exclusivamente com coordenadas do grid.
   ========================================================= */

import { GRID_COLUMNS, GRID_ROWS } from "./config.js";

/* =========================================================
   LIMITES
   ========================================================= */

export function isOutsideBoard({ x, y }) {
  return x < 0 || x >= GRID_COLUMNS || y < 0 || y >= GRID_ROWS;
}

/* =========================================================
   BORDA ATRAVESSADA
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
   RESOLUÇÃO DA POSIÇÃO

   Mantemos:
   - posição original;
   - posição normalizada;
   - informação de travessia;
   - borda atravessada.

   Isso será útil posteriormente para a camada visual.
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
