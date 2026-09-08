/* =========================================================
   JARAKA — SNAKE
   ========================================================= */

import { GRID_COLUMNS, GRID_ROWS } from "./game/config.js";

import { getVisualHead } from "./snake/head-position.js";

import {
  buildBodyPoints,
  simplifyOrthogonalPoints,
} from "./snake/centerline.js";

import { buildRoundedPathGeometry } from "./snake/rounded-path.js";

import { sampleRoundedPathAtLength } from "./snake/path-sampling.js";

import { createSnakeCanvas } from "./snake/canvas.js";
import { createSnakeMorphology } from "./snake/morphology.js";
import { createSnakeGeometry } from "./snake/geometry.js";
import { createSnakeBodyRenderer } from "./snake/body.js";

import {
  createHead,
  createHeadClone,
  syncHeadClone,
  showHeadClone,
  hideHeadClone,
  setHeadPosition,
  updateHeadShape,
  updateHeadDirection as updateHeadDirectionModule,
  triggerHeadTurn as triggerHeadTurnModule,
} from "./snake/head.js";

import { resolveWrapTransition } from "./snake/wrap.js";

import {
  triggerBite as triggerBiteModule,
  triggerBiteClose as triggerBiteCloseModule,
  triggerChew as triggerChewModule,
  finishChew as finishChewModule,
  finishBite as finishBiteModule,
  triggerSwallowSegment as triggerSwallowSegmentModule,
  triggerSwallowWave as triggerSwallowWaveModule,
  triggerGrowthArrival as triggerGrowthArrivalModule,
  triggerEatingSequence as triggerEatingSequenceModule,
} from "./snake/eating.js";

const SVG_NAMESPACE = "http://www.w3.org/2000/svg";

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

  let bodyContext = null;
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
     SVG
     ======================================================= */

  let bodySvg = null;
  let bodyPath = null;

  let latestBodyLength = 0;
  let latestPathGeometry = null;

  /* =======================================================
     CABEÇA
     ======================================================= */

  let headElement = null;
  let headCore = null;

  let headCloneElement = null;
  let headCloneCore = null;

  /* =======================================================
     ESTADO
     ======================================================= */

  let latestSnakeLength = 0;

  /* =======================================================
     SVG
     ======================================================= */

  function createBodyPath(className) {
    const path = document.createElementNS(SVG_NAMESPACE, "path");

    path.classList.add(className);
    path.setAttribute("fill", "none");

    return path;
  }

  function createBodySvg() {
    const svg = document.createElementNS(SVG_NAMESPACE, "svg");

    svg.classList.add("snake-body-svg");

    svg.setAttribute("viewBox", `0 0 ${GRID_COLUMNS} ${GRID_ROWS}`);

    svg.setAttribute("preserveAspectRatio", "none");

    svg.setAttribute("aria-hidden", "true");

    const geometryPath = createBodyPath("snake-body-path");

    geometryPath.style.opacity = "0";
    geometryPath.style.pointerEvents = "none";

    svg.appendChild(geometryPath);
    layer.appendChild(svg);

    bodySvg = svg;
    bodyPath = geometryPath;
  }

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

  function create(snake, direction) {
    snakeCanvas.destroy();

    bodyContext = null;

    window.removeEventListener(THEME_CHANGE_EVENT, handleThemeChange);

    window.addEventListener(THEME_CHANGE_EVENT, handleThemeChange);

    layer.replaceChildren();

    latestSnakeLength = snake.length;

    latestBodyLength = 0;
    latestPathGeometry = null;

    morphology.reset(snake.length);

    geometry.reset();

    snakeCanvas.create();

    bodyContext = snakeCanvas.getContext();

    resolveBodyColor();

    createBodySvg();

    const head = createHead(layer);

    headElement = head.element;

    headCore = head.core;

    const headClone = createHeadClone(layer);

    headCloneElement = headClone.element;

    headCloneCore = headClone.core;

    hideHeadClone(headCloneElement);

    updateSegmentShapes(snake, direction);

    updateHeadDirection(direction);
  }

  /* =======================================================
     FORMATO
     ======================================================= */

  function updateSegmentShapes(snake, direction) {
    latestSnakeLength = snake.length;

    updateHeadShape(headCore, direction);

    updateHeadShape(headCloneCore, direction);
  }

  /* =======================================================
     UTILITÁRIOS
     ======================================================= */

  function clamp(value, minimum, maximum) {
    return Math.max(minimum, Math.min(value, maximum));
  }

  /* =======================================================
     CABEÇA
     ======================================================= */

  function renderHead(snake, previousSnake, progress) {
    const visualHead = getVisualHead(snake, previousSnake, progress);

    const currentHead = snake[0];

    const previousHead = previousSnake?.[0] ?? currentHead;

    const transition = resolveWrapTransition(previousHead, currentHead);

    if (transition.crossed) {
      setHeadPosition(headElement, visualHead);

      const clonePosition = {
        x: visualHead.x + transition.oppositeOffset.x,

        y: visualHead.y + transition.oppositeOffset.y,
      };

      syncHeadClone(headElement, headCore, headCloneElement, headCloneCore);

      setHeadPosition(headCloneElement, clonePosition);

      showHeadClone(headCloneElement);

      return;
    }

    const projectedHead = {
      x: ((visualHead.x % GRID_COLUMNS) + GRID_COLUMNS) % GRID_COLUMNS,

      y: ((visualHead.y % GRID_ROWS) + GRID_ROWS) % GRID_ROWS,
    };

    setHeadPosition(headElement, projectedHead);

    hideHeadClone(headCloneElement);
  }

  /* =======================================================
     RENDERIZAÇÃO
     ======================================================= */

  function render(snake, previousSnake, progress) {
    if (!headElement || !bodyPath) {
      return;
    }

    latestSnakeLength = snake.length;

    renderHead(snake, previousSnake, progress);

    const rawPoints = buildBodyPoints(snake, previousSnake, progress);

    const points = simplifyOrthogonalPoints(rawPoints);

    const pathGeometry = buildRoundedPathGeometry(points);

    latestPathGeometry = pathGeometry;

    latestBodyLength = pathGeometry?.totalLength ?? 0;

    bodyPath.setAttribute("d", pathGeometry.pathData);

    snakeCanvas.clear();

    const visualGrowth = morphology.updateGrowth(snake.length);

    bodyRenderer.render({
      context: bodyContext,
      color: bodyColor,
      visualGrowth,
      pathGeometry,
    });
  }

  /* =======================================================
     CACHE
     ======================================================= */

  function getCachedBodyLength() {
    return latestBodyLength;
  }

  function getCachedBodyPointAtRatio(ratio) {
    if (!latestPathGeometry) {
      return null;
    }

    const totalLength = latestPathGeometry.totalLength;

    if (!Number.isFinite(totalLength) || totalLength <= 0) {
      return null;
    }

    const safeRatio = clamp(ratio, 0, 1);

    const distance = totalLength * safeRatio;

    const point = sampleRoundedPathAtLength(latestPathGeometry, distance);

    if (!point || !Number.isFinite(point.x) || !Number.isFinite(point.y)) {
      return null;
    }

    return {
      x: point.x,
      y: point.y,
    };
  }

  /* =======================================================
     DIREÇÃO
     ======================================================= */

  function updateHeadDirection(direction) {
    updateHeadDirectionModule(headElement, direction);

    updateHeadDirectionModule(headCloneElement, direction);
  }

  function triggerHeadTurn(turnSide) {
    triggerHeadTurnModule(headElement, headCore, turnSide);

    triggerHeadTurnModule(headCloneElement, headCloneCore, turnSide);
  }

  /* =======================================================
     ALIMENTAÇÃO
     ======================================================= */

  function triggerBite() {
    triggerBiteModule(headElement);
  }

  function triggerBiteClose() {
    triggerBiteCloseModule(headElement);
  }

  function triggerChew() {
    triggerChewModule(headElement);
  }

  function finishChew() {
    finishChewModule(headElement);
  }

  function finishBite() {
    finishBiteModule(headElement);
  }

  function triggerSwallowSegment(index) {
    triggerSwallowSegmentModule({
      bodySvg,
      bodyPath,
      latestSnakeLength,
      index,

      getBodyLength: getCachedBodyLength,

      getBodyPointAtRatio: getCachedBodyPointAtRatio,
    });
  }

  function triggerSwallowWave({ segmentDelay = 92, onComplete } = {}) {
    triggerSwallowWaveModule({
      bodySvg,
      bodyPath,
      latestSnakeLength,
      segmentDelay,

      getBodyLength: getCachedBodyLength,

      getBodyPointAtRatio: getCachedBodyPointAtRatio,

      onComplete,
    });
  }

  function triggerGrowthArrival() {
    triggerGrowthArrivalModule({
      bodySvg,
      bodyPath,
    });
  }

  function triggerEatingSequence({ onMouseEnter, onSwallowComplete } = {}) {
    triggerEatingSequenceModule({
      headElement,
      bodySvg,
      bodyPath,
      latestSnakeLength,

      getBodyLength: getCachedBodyLength,

      getBodyPointAtRatio: getCachedBodyPointAtRatio,

      onMouseEnter,
      onSwallowComplete,
    });
  }

  /* =======================================================
     API
     ======================================================= */

  return {
    create,
    render,
    updateSegmentShapes,
    updateHeadDirection,
    triggerHeadTurn,
    triggerBite,
    triggerBiteClose,
    triggerChew,
    finishChew,
    finishBite,
    triggerSwallowSegment,
    triggerSwallowWave,
    triggerGrowthArrival,
    triggerEatingSequence,
  };
}