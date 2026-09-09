/* =========================================================
   JARAKA — SNAKE
   ========================================================= */

import { GRID_COLUMNS, GRID_ROWS } from "./game/config.js";

import {
  buildBodyPoints,
  simplifyOrthogonalPoints,
} from "./snake/centerline.js";

import { buildRoundedPathGeometry } from "./snake/rounded-path.js";

import { createSnakeCanvas } from "./snake/canvas.js";

import { createSnakeMorphology } from "./snake/morphology.js";

import { createSnakeGeometry } from "./snake/geometry.js";

import { createSnakeBodyRenderer } from "./snake/body.js";

import { createSnakeEatingController } from "./snake/eating.js";

import { createSnakeDigestionRenderer } from "./snake/digestion.js";

/* =========================================================
   EVENTOS
   ========================================================= */

const THEME_CHANGE_EVENT = "jaraka:themechange";

/* =========================================================
   CORPO
   ========================================================= */

const BODY_WIDTH = 0.92;

/* =========================================================
   RENDERER
   ========================================================= */

export function createSnakeRenderer({ layer }) {
  /* =======================================================
     CANVAS
     ======================================================= */

  const snakeCanvas = createSnakeCanvas({
    layer,

    columns: GRID_COLUMNS,

    rows: GRID_ROWS,
  });

  let context = null;

  let bodyColor = "";

  /* =======================================================
     MORFOLOGIA
     ======================================================= */

  const morphology = createSnakeMorphology({
    bodyWidth: BODY_WIDTH,

    initialSnakeLength: 0,
  });

  /* =======================================================
     GEOMETRIA
     ======================================================= */

  const geometry = createSnakeGeometry({
    bodyWidth: BODY_WIDTH,

    morphology,
  });

  /* =======================================================
     CORPO
     ======================================================= */

  const bodyRenderer = createSnakeBodyRenderer({
    geometry,

    morphology,

    columns: GRID_COLUMNS,

    rows: GRID_ROWS,

    bodyWidth: BODY_WIDTH,
  });

  /* =======================================================
     DIGESTÃO
     ======================================================= */

  const digestionRenderer = createSnakeDigestionRenderer({
    geometry,

    bodyWidth: BODY_WIDTH,
  });

  /* =======================================================
     ALIMENTAÇÃO
     ======================================================= */

  const eatingController = createSnakeEatingController();

  /* =======================================================
     TEMA
     ======================================================= */

  function resolveBodyColor() {
    const styles = getComputedStyle(layer);

    const color = styles.getPropertyValue("--snake-main").trim();

    bodyColor = color || "#39ff6a";
  }

  function handleThemeChange() {
    resolveBodyColor();
  }

  /* =======================================================
     CRIAÇÃO
     ======================================================= */

  function create(snake) {
    snakeCanvas.destroy();

    context = null;

    window.removeEventListener(THEME_CHANGE_EVENT, handleThemeChange);

    window.addEventListener(THEME_CHANGE_EVENT, handleThemeChange);

    layer.replaceChildren();

    morphology.reset(snake.length);

    geometry.reset();

    eatingController.reset();

    digestionRenderer.reset();

    snakeCanvas.create();

    context = snakeCanvas.getContext();

    resolveBodyColor();
  }

  /* =======================================================
     GEOMETRIA
     ======================================================= */

  function buildGeometry(snake, previousSnake, progress) {
    const rawPoints = buildBodyPoints(snake, previousSnake, progress);

    const points = simplifyOrthogonalPoints(rawPoints);

    return buildRoundedPathGeometry(points);
  }

  /* =======================================================
     RENDERIZAÇÃO
     ======================================================= */

  function render(snake, previousSnake, progress) {
    if (!context) {
      return;
    }

    const pathGeometry = buildGeometry(snake, previousSnake, progress);

    const timestamp = performance.now();

    eatingController.update(timestamp);

    digestionRenderer.update(timestamp);

    snakeCanvas.clear();

    const visualGrowth = morphology.updateGrowth(snake.length);

    /*
     * A cobra inteira é uma única forma.
     *
     * O próprio bodyRenderer é responsável
     * pelo início arredondado e pela cauda.
     */
    bodyRenderer.render({
      context,

      color: bodyColor,

      visualGrowth,

      pathGeometry,
    });

    /*
     * Protuberância do rato passando
     * por dentro do corpo.
     */
    digestionRenderer.render({
      context,

      pathGeometry,

      color: bodyColor,
    });
  }

  /* =======================================================
     ALIMENTAÇÃO
     ======================================================= */

  function triggerEatingSequence({ onMouseEnter } = {}) {
    eatingController.start({
      timestamp: performance.now(),

      onMouseEnter: () => {
        digestionRenderer.start(performance.now());

        if (typeof onMouseEnter === "function") {
          onMouseEnter();
        }
      },
    });
  }

  /* =======================================================
     API
     ======================================================= */

  return {
    create,
    render,
    triggerEatingSequence,
  };
}