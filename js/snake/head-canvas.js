/* =========================================================
   JARAKA — HEAD CANVAS
   ========================================================= */

/* =========================================================
   CABEÇA
   ========================================================= */

const HEAD_LENGTH = 0.975;
const HEAD_WIDTH = 0.975;

const HEAD_RADIUS = 0.42;

/* =========================================================
   OLHOS
   ========================================================= */

const EYE_FORWARD = -0.205;

const EYE_SIDE = 0.245;

const EYE_RADIUS_FORWARD = 0.175;
const EYE_RADIUS_SIDE = 0.145;

const EYE_WHITE = "#f7ffff";

/* =========================================================
   PUPILAS
   ========================================================= */

const PUPIL_RADIUS_FORWARD = 0.115;
const PUPIL_RADIUS_SIDE = 0.105;

const PUPIL_FORWARD = 0.035;

const PUPIL_COLOR = "#101414";

/* =========================================================
   BRILHO
   ========================================================= */

const HIGHLIGHT_RADIUS = 0.027;

const HIGHLIGHT_FORWARD = 0.035;
const HIGHLIGHT_SIDE = -0.026;

const HIGHLIGHT_COLOR = "#ffffff";

/* =========================================================
   BOCA
   ========================================================= */

/*
 * Mais afastada da borda frontal.
 */
const MOUTH_FORWARD = 0.18;

/*
 * Sorriso mais largo.
 */
const MOUTH_HALF_WIDTH = 0.255;

/*
 * Profundidade menor:
 * claramente uma boca fechada.
 */
const MOUTH_DEPTH = 0.055;

/*
 * Cantos levemente elevados.
 */
const MOUTH_CORNER_FORWARD = -0.018;

/*
 * Pequena elevação central para evitar
 * um U genérico demais.
 */
const MOUTH_CENTER_FORWARD = 0.045;

/*
 * Espessura continua alta para manter
 * leitura no tamanho real.
 */
const MOUTH_LINE_WIDTH = 0.065;

const MOUTH_COLOR = "#101414";

/* =========================================================
   BOCHECHAS
   ========================================================= */

const CHEEK_FORWARD = 0.105;
const CHEEK_SIDE = 0.34;

const CHEEK_RADIUS = 0.04;

const CHEEK_COLOR =
  "rgba(255, 120, 170, 0.58)";

/* =========================================================
   CONSTANTES INTERNAS
   ========================================================= */

const MIN_VECTOR_LENGTH = 0.000001;

/* =========================================================
   VETORES
   ========================================================= */

function normalizeVector(x, y) {
  const length = Math.hypot(
    x,
    y,
  );

  if (
    length <=
    MIN_VECTOR_LENGTH
  ) {
    return null;
  }

  return {
    x: x / length,
    y: y / length,
  };
}

/* =========================================================
   ÂNGULO
   ========================================================= */

function getHeadAngle(direction) {
  return Math.atan2(
    direction.y,
    direction.x,
  );
}

/* =========================================================
   RETÂNGULO ARREDONDADO
   ========================================================= */

function drawRoundedRectangle(
  context,
  x,
  y,
  width,
  height,
  radius,
) {
  const safeRadius = Math.min(
    radius,
    width * 0.5,
    height * 0.5,
  );

  const right = x + width;
  const bottom = y + height;

  context.beginPath();

  context.moveTo(
    x + safeRadius,
    y,
  );

  context.lineTo(
    right - safeRadius,
    y,
  );

  context.quadraticCurveTo(
    right,
    y,
    right,
    y + safeRadius,
  );

  context.lineTo(
    right,
    bottom - safeRadius,
  );

  context.quadraticCurveTo(
    right,
    bottom,
    right - safeRadius,
    bottom,
  );

  context.lineTo(
    x + safeRadius,
    bottom,
  );

  context.quadraticCurveTo(
    x,
    bottom,
    x,
    bottom - safeRadius,
  );

  context.lineTo(
    x,
    y + safeRadius,
  );

  context.quadraticCurveTo(
    x,
    y,
    x + safeRadius,
    y,
  );

  context.closePath();
}

/* =========================================================
   CABEÇA
   ========================================================= */

function drawHead(
  context,
  color,
) {
  const x =
    -HEAD_LENGTH * 0.5;

  const y =
    -HEAD_WIDTH * 0.5;

  drawRoundedRectangle(
    context,
    x,
    y,
    HEAD_LENGTH,
    HEAD_WIDTH,
    HEAD_RADIUS,
  );

  context.fillStyle =
    color;

  context.fill();
}

/* =========================================================
   OLHO
   ========================================================= */

function drawEye(
  context,
  side,
) {
  const eyeX =
    EYE_FORWARD;

  const eyeY =
    EYE_SIDE * side;

  /* =======================================================
     BRANCO DO OLHO
     ======================================================= */

  context.beginPath();

  context.ellipse(
    eyeX,
    eyeY,
    EYE_RADIUS_FORWARD,
    EYE_RADIUS_SIDE,
    0,
    0,
    Math.PI * 2,
  );

  context.fillStyle =
    EYE_WHITE;

  context.fill();

  /* =======================================================
     PUPILA
     ======================================================= */

  const pupilX =
    eyeX +
    PUPIL_FORWARD;

  const pupilY =
    eyeY;

  context.beginPath();

  context.ellipse(
    pupilX,
    pupilY,
    PUPIL_RADIUS_FORWARD,
    PUPIL_RADIUS_SIDE,
    0,
    0,
    Math.PI * 2,
  );

  context.fillStyle =
    PUPIL_COLOR;

  context.fill();

  /* =======================================================
     BRILHO
     ======================================================= */

  context.beginPath();

  context.arc(
    pupilX +
      HIGHLIGHT_FORWARD,

    pupilY +
      HIGHLIGHT_SIDE *
        side,

    HIGHLIGHT_RADIUS,

    0,
    Math.PI * 2,
  );

  context.fillStyle =
    HIGHLIGHT_COLOR;

  context.fill();
}

/* =========================================================
   OLHOS
   ========================================================= */

function drawEyes(context) {
  drawEye(
    context,
    1,
  );

  drawEye(
    context,
    -1,
  );
}

/* =========================================================
   BOCHECHAS
   ========================================================= */

function drawCheeks(context) {
  context.fillStyle =
    CHEEK_COLOR;

  context.beginPath();

  context.arc(
    CHEEK_FORWARD,
    CHEEK_SIDE,
    CHEEK_RADIUS,
    0,
    Math.PI * 2,
  );

  context.arc(
    CHEEK_FORWARD,
    -CHEEK_SIDE,
    CHEEK_RADIUS,
    0,
    Math.PI * 2,
  );

  context.fill();
}

/* =========================================================
   BOCA FECHADA — SORRISO
   ========================================================= */

function drawMouth(context) {
  /*
   * A boca agora tem 5 pontos principais:
   *
   * canto esquerdo
   * curva esquerda
   * centro
   * curva direita
   * canto direito
   *
   * Isso dá mais personalidade do que
   * simplesmente um arco em U.
   */

  const leftCorner = {
    x:
      MOUTH_FORWARD +
      MOUTH_CORNER_FORWARD,

    y:
      MOUTH_HALF_WIDTH,
  };

  const rightCorner = {
    x:
      MOUTH_FORWARD +
      MOUTH_CORNER_FORWARD,

    y:
      -MOUTH_HALF_WIDTH,
  };

  const leftMiddle = {
    x:
      MOUTH_FORWARD +
      MOUTH_DEPTH,

    y:
      MOUTH_HALF_WIDTH * 0.48,
  };

  const rightMiddle = {
    x:
      MOUTH_FORWARD +
      MOUTH_DEPTH,

    y:
      -MOUTH_HALF_WIDTH * 0.48,
  };

  const center = {
    x:
      MOUTH_FORWARD +
      MOUTH_CENTER_FORWARD,

    y: 0,
  };

  /* =======================================================
     LADO ESQUERDO
     ======================================================= */

  context.beginPath();

  context.moveTo(
    leftCorner.x,
    leftCorner.y,
  );

  context.bezierCurveTo(
    MOUTH_FORWARD +
      MOUTH_DEPTH * 0.2,

    MOUTH_HALF_WIDTH * 0.86,

    leftMiddle.x,
    leftMiddle.y,

    center.x,
    center.y,
  );

  /* =======================================================
     LADO DIREITO
     ======================================================= */

  context.bezierCurveTo(
    rightMiddle.x,
    rightMiddle.y,

    MOUTH_FORWARD +
      MOUTH_DEPTH * 0.2,

    -MOUTH_HALF_WIDTH * 0.86,

    rightCorner.x,
    rightCorner.y,
  );

  context.strokeStyle =
    MOUTH_COLOR;

  context.lineWidth =
    MOUTH_LINE_WIDTH;

  context.lineCap =
    "round";

  context.lineJoin =
    "round";

  context.stroke();
}

/* =========================================================
   ROSTO
   ========================================================= */

function drawFace(context) {
  drawEyes(
    context,
  );

  drawCheeks(
    context,
  );

  drawMouth(
    context,
  );
}

/* =========================================================
   RENDERIZAÇÃO
   ========================================================= */

export function createSnakeHeadCanvasRenderer() {
  function render({
    context,
    position,
    bodyTangent,
    headTangent,
    color,
  }) {
    if (
      !context ||
      !position ||
      !bodyTangent ||
      !headTangent
    ) {
      return;
    }

    const headForward =
      normalizeVector(
        headTangent.x,
        headTangent.y,
      );

    if (!headForward) {
      return;
    }

    const angle =
      getHeadAngle(
        headForward,
      );

    context.save();

    context.translate(
      position.x,
      position.y,
    );

    context.rotate(
      angle,
    );

    drawHead(
      context,
      color,
    );

    drawFace(
      context,
    );

    context.restore();
  }

  return {
    render,
  };
}