/* =========================================================
   JARAKA — SNAKE WRAP
   Geometria auxiliar para travessias de borda

   Responsabilidades:
   - identificar transições entre lados opostos do grid;
   - determinar o eixo da travessia;
   - calcular uma posição virtual contínua;
   - fornecer os dados necessários para o renderer tratar
     o wrap sem interpolar através do tabuleiro inteiro.

   Este módulo NÃO conhece:
   - CLASSIC;
   - NO WALL;
   - DOM;
   - Canvas;
   - estado da partida.

   Ele trabalha apenas com geometria.
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
   DETECÇÃO DE WRAP

   Em movimentos normais da cobra, a diferença entre duas
   posições consecutivas nunca ultrapassa uma célula.

   Portanto:

   x: 9 -> 0
   x: 0 -> 9
   y: 21 -> 0
   y: 0 -> 21

   são reconhecidos como travessias.
   ========================================================= */

export function getWrapTransition(from, to) {
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

   O estado lógico permanece normalizado dentro do grid.

   Exemplo:

   posição anterior:
   x = 9

   posição atual:
   x = 0

   Para interpolação visual isso não deve ser:

   9 -> 0

   mas:

   9 -> 10

   Da mesma forma:

   0 -> 9

   torna-se:

   0 -> -1

   O mesmo princípio vale verticalmente.
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

/* =========================================================
   OFFSET OPOSTO

   Depois de criar uma posição virtual fora do grid,
   o renderer poderá desenhar uma cópia equivalente no lado
   oposto.

   Exemplo horizontal:

   posição virtual:
   x = 9.5

   cópia:
   x = -0.5

   Isso permite que metade da cobra saia por uma borda
   enquanto a outra metade já aparece na borda oposta.
   ========================================================= */

export function getWrapOffset(transition) {
  if (!transition?.crossed) {
    return {
      x: 0,
      y: 0,
    };
  }

  switch (transition.boundary) {
    case "right":
      return {
        x: -GRID_COLUMNS,
        y: 0,
      };

    case "left":
      return {
        x: GRID_COLUMNS,
        y: 0,
      };

    case "bottom":
      return {
        x: 0,
        y: -GRID_ROWS,
      };

    case "top":
      return {
        x: 0,
        y: GRID_ROWS,
      };

    default:
      return {
        x: 0,
        y: 0,
      };
  }
}

/* =========================================================
   RESOLUÇÃO COMPLETA

   Conveniência para o renderer.

   Recebe:

   from -> posição anterior
   to   -> posição atual normalizada

   Retorna:

   - se houve wrap;
   - eixo;
   - borda;
   - posição visual contínua;
   - deslocamento da cópia oposta.
   ========================================================= */

export function resolveWrapTransition(from, to) {
  const transition = getWrapTransition(from, to);

  if (!transition.crossed) {
    return {
      crossed: false,
      axis: null,
      boundary: null,

      virtualPosition: {
        x: to.x,
        y: to.y,
      },

      oppositeOffset: {
        x: 0,
        y: 0,
      },
    };
  }

  return {
    ...transition,

    virtualPosition: getVirtualPosition(from, to),

    oppositeOffset: getWrapOffset(transition),
  };
}