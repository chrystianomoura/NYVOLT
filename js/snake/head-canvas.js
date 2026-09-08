/* =========================================================
   JARAKA — HEAD CANVAS
   ========================================================= */

/* =========================================================
   CONSTANTES
   ========================================================= */

const HEAD_LENGTH = 0.88;
const HEAD_HALF_LENGTH = HEAD_LENGTH * 0.5;

const NECK_WIDTH = 0.92;
const CHEEK_WIDTH = 0.92;
const FRONT_WIDTH = 0.78;

const CHEEK_POSITION = 0.42;
const FRONT_POSITION = 0.82;

const EYE_FORWARD = 0.56;
const EYE_SIDE = 0.25;

const EYE_RADIUS = 0.082;
const PUPIL_RADIUS = 0.036;
const PUPIL_FORWARD = 0.024;

const MIN_VECTOR_LENGTH = 0.000001;

/* =========================================================
   VETORES
   ========================================================= */

function normalizeVector(x, y) {
  const length = Math.hypot(x, y);

  if (length <= MIN_VECTOR_LENGTH) {
    return null;
  }

  return {
    x: x / length,
    y: y / length,
  };
}

function getFrame(tangent) {
  const forward = normalizeVector(tangent.x, tangent.y);

  if (!forward) {
    return null;
  }

  return {
    forward,

    normal: {
      x: -forward.y,

      y: forward.x,
    },
  };
}

/* =========================================================
   PONTOS
   ========================================================= */

function offsetPoint(origin, forward, normal, forwardDistance, normalDistance) {
  return {
    x: origin.x + forward.x * forwardDistance + normal.x * normalDistance,

    y: origin.y + forward.y * forwardDistance + normal.y * normalDistance,
  };
}

/* =========================================================
   SILHUETA
   ========================================================= */

function drawHeadShape(context, position, forward, normal, color) {
  const halfNeck = NECK_WIDTH * 0.5;

  const halfCheek = CHEEK_WIDTH * 0.5;

  const halfFront = FRONT_WIDTH * 0.5;

  const rearDistance = -HEAD_HALF_LENGTH;

  const cheekDistance = -HEAD_HALF_LENGTH + HEAD_LENGTH * CHEEK_POSITION;

  const frontDistance = -HEAD_HALF_LENGTH + HEAD_LENGTH * FRONT_POSITION;

  const noseDistance = HEAD_HALF_LENGTH;

  const neckLeft = offsetPoint(
    position,
    forward,
    normal,
    rearDistance,
    halfNeck,
  );

  const neckRight = offsetPoint(
    position,
    forward,
    normal,
    rearDistance,
    -halfNeck,
  );

  const cheekLeft = offsetPoint(
    position,
    forward,
    normal,
    cheekDistance,
    halfCheek,
  );

  const cheekRight = offsetPoint(
    position,
    forward,
    normal,
    cheekDistance,
    -halfCheek,
  );

  const frontLeft = offsetPoint(
    position,
    forward,
    normal,
    frontDistance,
    halfFront,
  );

  const frontRight = offsetPoint(
    position,
    forward,
    normal,
    frontDistance,
    -halfFront,
  );

  const nose = offsetPoint(position, forward, normal, noseDistance, 0);

  context.beginPath();

  context.moveTo(neckLeft.x, neckLeft.y);

  context.bezierCurveTo(
    neckLeft.x + forward.x * HEAD_LENGTH * 0.16,

    neckLeft.y + forward.y * HEAD_LENGTH * 0.16,

    cheekLeft.x - forward.x * HEAD_LENGTH * 0.12,

    cheekLeft.y - forward.y * HEAD_LENGTH * 0.12,

    cheekLeft.x,
    cheekLeft.y,
  );

  context.bezierCurveTo(
    cheekLeft.x + forward.x * HEAD_LENGTH * 0.18,

    cheekLeft.y + forward.y * HEAD_LENGTH * 0.18,

    frontLeft.x - forward.x * HEAD_LENGTH * 0.08,

    frontLeft.y - forward.y * HEAD_LENGTH * 0.08,

    frontLeft.x,
    frontLeft.y,
  );

  context.bezierCurveTo(
    frontLeft.x + forward.x * HEAD_LENGTH * 0.08,

    frontLeft.y + forward.y * HEAD_LENGTH * 0.08,

    nose.x + normal.x * FRONT_WIDTH * 0.18 - forward.x * HEAD_LENGTH * 0.04,

    nose.y + normal.y * FRONT_WIDTH * 0.18 - forward.y * HEAD_LENGTH * 0.04,

    nose.x,
    nose.y,
  );

  context.bezierCurveTo(
    nose.x - normal.x * FRONT_WIDTH * 0.18 - forward.x * HEAD_LENGTH * 0.04,

    nose.y - normal.y * FRONT_WIDTH * 0.18 - forward.y * HEAD_LENGTH * 0.04,

    frontRight.x + forward.x * HEAD_LENGTH * 0.08,

    frontRight.y + forward.y * HEAD_LENGTH * 0.08,

    frontRight.x,
    frontRight.y,
  );

  context.bezierCurveTo(
    frontRight.x - forward.x * HEAD_LENGTH * 0.08,

    frontRight.y - forward.y * HEAD_LENGTH * 0.08,

    cheekRight.x + forward.x * HEAD_LENGTH * 0.18,

    cheekRight.y + forward.y * HEAD_LENGTH * 0.18,

    cheekRight.x,
    cheekRight.y,
  );

  context.bezierCurveTo(
    cheekRight.x - forward.x * HEAD_LENGTH * 0.12,

    cheekRight.y - forward.y * HEAD_LENGTH * 0.12,

    neckRight.x + forward.x * HEAD_LENGTH * 0.16,

    neckRight.y + forward.y * HEAD_LENGTH * 0.16,

    neckRight.x,
    neckRight.y,
  );

  context.lineTo(neckLeft.x, neckLeft.y);

  context.closePath();

  context.fillStyle = color;

  context.fill();
}

/* =========================================================
   OLHOS
   ========================================================= */

function drawEye(context, position, forward, normal, side) {
  const eyeDistance = -HEAD_HALF_LENGTH + HEAD_LENGTH * EYE_FORWARD;

  const eye = offsetPoint(
    position,
    forward,
    normal,
    eyeDistance,
    CHEEK_WIDTH * EYE_SIDE * side,
  );

  context.beginPath();

  context.arc(eye.x, eye.y, EYE_RADIUS, 0, Math.PI * 2);

  context.fillStyle = "#f4f4ef";

  context.fill();

  const pupil = offsetPoint(eye, forward, normal, PUPIL_FORWARD, 0);

  context.beginPath();

  context.arc(pupil.x, pupil.y, PUPIL_RADIUS, 0, Math.PI * 2);

  context.fillStyle = "#101414";

  context.fill();
}

function drawEyes(context, position, forward, normal) {
  drawEye(context, position, forward, normal, 1);

  drawEye(context, position, forward, normal, -1);
}

/* =========================================================
   RENDERIZAÇÃO
   ========================================================= */

export function createSnakeHeadCanvasRenderer() {
  function render({ context, position, tangent, color }) {
    if (!context || !position || !tangent) {
      return;
    }

    const frame = getFrame(tangent);

    if (!frame) {
      return;
    }

    drawHeadShape(context, position, frame.forward, frame.normal, color);

    drawEyes(context, position, frame.forward, frame.normal);
  }

  return {
    render,
  };
}