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

const SPINE_SAMPLE_COUNT = 12;

const MIN_VECTOR_LENGTH = 0.000001;

/* =========================================================
   UTILITÁRIOS
   ========================================================= */

function clamp(value, minimum, maximum) {
  return Math.min(Math.max(value, minimum), maximum);
}

function smoothstep(start, end, value) {
  if (Math.abs(end - start) <= MIN_VECTOR_LENGTH) {
    return value < start ? 0 : 1;
  }

  const progress = clamp((value - start) / (end - start), 0, 1);

  return progress * progress * (3 - 2 * progress);
}

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

function interpolateDirection(from, to, progress) {
  const fromAngle = Math.atan2(from.y, from.x);

  const toAngle = Math.atan2(to.y, to.x);

  let delta = toAngle - fromAngle;

  while (delta > Math.PI) {
    delta -= Math.PI * 2;
  }

  while (delta < -Math.PI) {
    delta += Math.PI * 2;
  }

  const angle = fromAngle + delta * progress;

  return {
    x: Math.cos(angle),
    y: Math.sin(angle),
  };
}

function getDirectionAt(bodyForward, headForward, progress) {
  const bendProgress = smoothstep(0, 1, progress);

  return interpolateDirection(bodyForward, headForward, bendProgress);
}

function getNormal(direction) {
  return {
    x: -direction.y,
    y: direction.x,
  };
}

/* =========================================================
   ESPINHA
   ========================================================= */

function integrateSpine(
  position,
  bodyForward,
  headForward,
  startProgress,
  endProgress,
) {
  if (Math.abs(endProgress - startProgress) <= MIN_VECTOR_LENGTH) {
    return {
      x: position.x,
      y: position.y,
    };
  }

  const directionSign = endProgress > startProgress ? 1 : -1;

  const distance = Math.abs(endProgress - startProgress) * HEAD_LENGTH;

  const steps = Math.max(
    1,
    Math.ceil(SPINE_SAMPLE_COUNT * Math.abs(endProgress - startProgress)),
  );

  const stepDistance = distance / steps;

  let x = position.x;
  let y = position.y;

  for (let index = 0; index < steps; index += 1) {
    const localProgress = (index + 0.5) / steps;

    const progress =
      startProgress + (endProgress - startProgress) * localProgress;

    const direction = getDirectionAt(bodyForward, headForward, progress);

    x += direction.x * stepDistance * directionSign;

    y += direction.y * stepDistance * directionSign;
  }

  return {
    x,
    y,
  };
}

function getSpinePoint(position, bodyForward, headForward, progress) {
  return integrateSpine(position, bodyForward, headForward, 0.5, progress);
}

/* =========================================================
   SEÇÃO
   ========================================================= */

function getSection(position, bodyForward, headForward, progress, width) {
  const center = getSpinePoint(position, bodyForward, headForward, progress);

  const direction = getDirectionAt(bodyForward, headForward, progress);

  const normal = getNormal(direction);

  const halfWidth = width * 0.5;

  return {
    center,
    direction,
    normal,

    left: {
      x: center.x + normal.x * halfWidth,

      y: center.y + normal.y * halfWidth,
    },

    right: {
      x: center.x - normal.x * halfWidth,

      y: center.y - normal.y * halfWidth,
    },
  };
}

/* =========================================================
   SILHUETA
   ========================================================= */

function drawHeadShape(context, position, bodyForward, headForward, color) {
  const neck = getSection(position, bodyForward, headForward, 0, NECK_WIDTH);

  const cheek = getSection(
    position,
    bodyForward,
    headForward,
    CHEEK_POSITION,
    CHEEK_WIDTH,
  );

  const front = getSection(
    position,
    bodyForward,
    headForward,
    FRONT_POSITION,
    FRONT_WIDTH,
  );

  const nose = getSpinePoint(position, bodyForward, headForward, 1);

  context.beginPath();

  context.moveTo(neck.left.x, neck.left.y);

  context.bezierCurveTo(
    neck.left.x + neck.direction.x * HEAD_LENGTH * 0.16,

    neck.left.y + neck.direction.y * HEAD_LENGTH * 0.16,

    cheek.left.x - cheek.direction.x * HEAD_LENGTH * 0.12,

    cheek.left.y - cheek.direction.y * HEAD_LENGTH * 0.12,

    cheek.left.x,
    cheek.left.y,
  );

  context.bezierCurveTo(
    cheek.left.x + cheek.direction.x * HEAD_LENGTH * 0.18,

    cheek.left.y + cheek.direction.y * HEAD_LENGTH * 0.18,

    front.left.x - front.direction.x * HEAD_LENGTH * 0.08,

    front.left.y - front.direction.y * HEAD_LENGTH * 0.08,

    front.left.x,
    front.left.y,
  );

  context.bezierCurveTo(
    front.left.x + front.direction.x * HEAD_LENGTH * 0.08,

    front.left.y + front.direction.y * HEAD_LENGTH * 0.08,

    nose.x +
      front.normal.x * FRONT_WIDTH * 0.18 -
      headForward.x * HEAD_LENGTH * 0.04,

    nose.y +
      front.normal.y * FRONT_WIDTH * 0.18 -
      headForward.y * HEAD_LENGTH * 0.04,

    nose.x,
    nose.y,
  );

  context.bezierCurveTo(
    nose.x -
      front.normal.x * FRONT_WIDTH * 0.18 -
      headForward.x * HEAD_LENGTH * 0.04,

    nose.y -
      front.normal.y * FRONT_WIDTH * 0.18 -
      headForward.y * HEAD_LENGTH * 0.04,

    front.right.x + front.direction.x * HEAD_LENGTH * 0.08,

    front.right.y + front.direction.y * HEAD_LENGTH * 0.08,

    front.right.x,
    front.right.y,
  );

  context.bezierCurveTo(
    front.right.x - front.direction.x * HEAD_LENGTH * 0.08,

    front.right.y - front.direction.y * HEAD_LENGTH * 0.08,

    cheek.right.x + cheek.direction.x * HEAD_LENGTH * 0.18,

    cheek.right.y + cheek.direction.y * HEAD_LENGTH * 0.18,

    cheek.right.x,
    cheek.right.y,
  );

  context.bezierCurveTo(
    cheek.right.x - cheek.direction.x * HEAD_LENGTH * 0.12,

    cheek.right.y - cheek.direction.y * HEAD_LENGTH * 0.12,

    neck.right.x + neck.direction.x * HEAD_LENGTH * 0.16,

    neck.right.y + neck.direction.y * HEAD_LENGTH * 0.16,

    neck.right.x,
    neck.right.y,
  );

  context.lineTo(neck.left.x, neck.left.y);

  context.closePath();

  context.fillStyle = color;

  context.fill();
}

/* =========================================================
   OLHOS
   ========================================================= */

function drawEye(context, position, bodyForward, headForward, side) {
  const section = getSection(
    position,
    bodyForward,
    headForward,
    EYE_FORWARD,
    CHEEK_WIDTH,
  );

  const eye = {
    x: section.center.x + section.normal.x * CHEEK_WIDTH * EYE_SIDE * side,

    y: section.center.y + section.normal.y * CHEEK_WIDTH * EYE_SIDE * side,
  };

  context.beginPath();

  context.arc(eye.x, eye.y, EYE_RADIUS, 0, Math.PI * 2);

  context.fillStyle = "#f4f4ef";

  context.fill();

  const pupil = {
    x: eye.x + section.direction.x * PUPIL_FORWARD,

    y: eye.y + section.direction.y * PUPIL_FORWARD,
  };

  context.beginPath();

  context.arc(pupil.x, pupil.y, PUPIL_RADIUS, 0, Math.PI * 2);

  context.fillStyle = "#101414";

  context.fill();
}

function drawEyes(context, position, bodyForward, headForward) {
  drawEye(context, position, bodyForward, headForward, 1);

  drawEye(context, position, bodyForward, headForward, -1);
}

/* =========================================================
   RENDERIZAÇÃO
   ========================================================= */

export function createSnakeHeadCanvasRenderer() {
  function render({ context, position, bodyTangent, headTangent, color }) {
    if (!context || !position || !bodyTangent || !headTangent) {
      return;
    }

    const bodyForward = normalizeVector(bodyTangent.x, bodyTangent.y);

    const headForward = normalizeVector(headTangent.x, headTangent.y);

    if (!bodyForward || !headForward) {
      return;
    }

    drawHeadShape(context, position, bodyForward, headForward, color);

    drawEyes(context, position, bodyForward, headForward);
  }

  return {
    render,
  };
}