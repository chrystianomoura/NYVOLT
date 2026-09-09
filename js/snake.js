/* =========================================================
   NYVOLT — SNAKE
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

import { createEnergyController } from "./snake/energy.js";

/* =========================================================
   EVENTOS
   ========================================================= */

const THEME_CHANGE_EVENT = "nyvolt:themechange";

/* =========================================================
   CORPO
   ========================================================= */

const BODY_WIDTH = 0.92;

/* =========================================================
   CONTATO COM O ORBE
   ========================================================= */

/*
 * A colisão lógica acontece no início do novo tick,
 * antes de a NYVOLT terminar visualmente o movimento
 * até a nova célula.
 *
 * Este valor determina aproximadamente o instante
 * da interpolação em que a frente da NYVOLT toca
 * visualmente o orbe.
 *
 * 0 = início do movimento
 * 1 = fim do movimento
 */
const ENERGY_CONTACT_PROGRESS = 0.12;

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

  let highlightColor = "";

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
     ENERGIA
     ======================================================= */

  const energyController = createEnergyController();

  /*
   * A coleta lógica pode ser detectada antes
   * do contato visual entre a NYVOLT e o orbe.
   *
   * Enquanto houver uma absorção pendente,
   * o orbe permanece visível.
   */
  let pendingEnergyCollection = null;

  /* =======================================================
     TEMA
     ======================================================= */

  function resolveBodyColors() {
    const styles = getComputedStyle(layer);

    const main = styles.getPropertyValue("--snake-main").trim();

    const highlight = styles.getPropertyValue("--snake-highlight").trim();

    bodyColor = main || "#39ff6a";

    highlightColor = highlight || bodyColor;
  }

  function handleThemeChange() {
    resolveBodyColors();
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

    energyController.reset();

    pendingEnergyCollection = null;

    snakeCanvas.create();

    context = snakeCanvas.getContext();

    resolveBodyColors();
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
     CONTATO VISUAL COM O ORBE
     ======================================================= */

  function updatePendingEnergyCollection(progress, timestamp) {
    if (!pendingEnergyCollection) {
      return;
    }

    if (progress < ENERGY_CONTACT_PROGRESS) {
      return;
    }

    const onCollect = pendingEnergyCollection;

    /*
     * Limpamos antes de executar o callback
     * para impedir qualquer disparo duplicado.
     */
    pendingEnergyCollection = null;

    /*
     * A partir deste instante:
     *
     * 1. o orbe é coletado;
     * 2. o orbe reaparece em outra célula;
     * 3. o pulso interno da NYVOLT começa.
     */
    energyController.start({
      timestamp,

      onCollect,
    });
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

    /*
     * Primeiro verificamos se a NYVOLT já alcançou
     * visualmente o ponto de contato com o orbe.
     */
    updatePendingEnergyCollection(progress, timestamp);

    /*
     * Depois atualizamos o pulso de energia.
     *
     * Caso ele tenha acabado de iniciar acima,
     * elapsed começa corretamente em zero.
     */
    energyController.update(timestamp);

    const energyState = energyController.getState();

    snakeCanvas.clear();

    const visualGrowth = morphology.updateGrowth(snake.length);

    bodyRenderer.render({
      context,

      color: bodyColor,

      highlightColor,

      visualGrowth,

      pathGeometry,

      energyProgress: energyState.energyProgress,
    });
  }

  /* =======================================================
     ABSORÇÃO DE ENERGIA
     ======================================================= */

  function triggerEnergyAbsorption({ onCollect } = {}) {
    /*
     * Não coletamos o orbe imediatamente.
     *
     * A colisão já foi confirmada pela lógica do jogo,
     * mas esperamos a interpolação alcançar o ponto
     * em que a NYVOLT encosta visualmente nele.
     */
    pendingEnergyCollection =
      typeof onCollect === "function" ? onCollect : null;
  }

  /* =======================================================
     API
     ======================================================= */

  return {
    create,

    render,

    triggerEnergyAbsorption,
  };
}