/* =========================================================
   JARAKA — SNAKE HEAD CANVAS
   ========================================================= */

/* =========================================================
   CONSTANTES
   ========================================================= */

const HEAD_LENGTH = 0.78;
const HEAD_WIDTH = 1.08;

const NECK_WIDTH_FACTOR = 0.92;

const MIN_VECTOR_LENGTH = 0.000001;

/* =========================================================
   UTILITÁRIOS
   ========================================================= */

function normalizeVector(x, y) {
  const length = Math.hypot(x, y);

  if (length <= MIN_VECTOR_LENGTH) {
    return {
      x: 0,
      y: 1,
    };
  }

  return {
    x: x / length,
    y: y / length,
  };
}

/* =========================================================
   RENDERER
   ========================================================= */

export function createSnakeHeadCanvasRenderer({ bodyWidth }) {
  /* =======================================================
     GEOMETRIA
     ======================================================= */

  function buildHeadGeometry({ position, tangent }) {
    const direction = normalizeVector(tangent.x, tangent.y);

    const normal = {
      x: -direction.y,
      y: direction.x,
    };

    const neckRadius = bodyWidth * NECK_WIDTH_FACTOR * 0.5;

    const headRadius = HEAD_WIDTH * 0.5;

    const frontCenter = {
      x: position.x + direction.x * HEAD_LENGTH,

      y: position.y + direction.y * HEAD_LENGTH,
    };

    const neckLeft = {
      x: position.x + normal.x * neckRadius,

      y: position.y + normal.y * neckRadius,
    };

    const neckRight = {
      x: position.x - normal.x * neckRadius,

      y: position.y - normal.y * neckRadius,
    };

    const frontLeft = {
      x: frontCenter.x + normal.x * headRadius,

      y: frontCenter.y + normal.y * headRadius,
    };

    const frontRight = {
      x: frontCenter.x - normal.x * headRadius,

      y: frontCenter.y - normal.y * headRadius,
    };

    return {
      direction,
      normal,
      frontCenter,
      neckLeft,
      neckRight,
      frontLeft,
      frontRight,
      headRadius,
    };
  }

  /* =======================================================
     DESENHO
     ======================================================= */

  function drawHeadShape(context, geometry) {
    const {
      direction,
      normal,
      frontCenter,
      neckLeft,
      neckRight,
      frontLeft,
      frontRight,
      headRadius,
    } = geometry;

    const curvePull = HEAD_LENGTH * 0.42;

    const leftControl = {
      x: neckLeft.x + direction.x * curvePull,

      y: neckLeft.y + direction.y * curvePull,
    };

    const rightControl = {
      x: neckRight.x + direction.x * curvePull,

      y: neckRight.y + direction.y * curvePull,
    };

    context.beginPath();

    context.moveTo(neckLeft.x, neckLeft.y);

    context.quadraticCurveTo(
      leftControl.x,
      leftControl.y,
      frontLeft.x,
      frontLeft.y,
    );

    context.arc(
      frontCenter.x,
      frontCenter.y,
      headRadius,
      Math.atan2(frontLeft.y - frontCenter.y, frontLeft.x - frontCenter.x),
      Math.atan2(frontRight.y - frontCenter.y, frontRight.x - frontCenter.x),
      false,
    );

    context.quadraticCurveTo(
      rightControl.x,
      rightControl.y,
      neckRight.x,
      neckRight.y,
    );

    context.closePath();
    context.fill();
  }

  /* =======================================================
     RENDERIZAÇÃO
     ======================================================= */

  function render({ context, position, tangent, color }) {
    if (!context || !position || !tangent) {
      return;
    }

    const geometry = buildHeadGeometry({
      position,
      tangent,
    });

    context.save();

    context.fillStyle = color;

    drawHeadShape(context, geometry);

    context.restore();
  }

  /* =======================================================
     API
     ======================================================= */

  return {
    render,
  };
}