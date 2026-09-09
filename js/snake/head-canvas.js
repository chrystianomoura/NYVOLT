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
   BOCA NORMAL
   ========================================================= */

const MOUTH_FORWARD = 0.18;

const MOUTH_HALF_WIDTH = 0.255;

const MOUTH_DEPTH = 0.055;

const MOUTH_CORNER_FORWARD = -0.018;

const MOUTH_CENTER_FORWARD = 0.045;

const MOUTH_LINE_WIDTH = 0.065;

const MOUTH_COLOR = "#101414";

/* =========================================================
   BOCHECHAS
   ========================================================= */

const CHEEK_FORWARD = 0.105;
const CHEEK_SIDE = 0.34;

const CHEEK_RADIUS = 0.04;

const CHEEK_COLOR = "rgba(255, 120, 170, 0.58)";

/* =========================================================
   MORDIDA — CAVIDADE
   ========================================================= */

const BITE_HINGE_FORWARD = 0.065;

const BITE_HALF_WIDTH_CLOSED = 0.18;
const BITE_HALF_WIDTH_OPEN = 0.455;

const BITE_FRONT_CLOSED = 0.215;
const BITE_FRONT_OPEN = 0.475;

const BITE_COLOR = "#080a0a";

/* =========================================================
   PRESAS
   ========================================================= */

const FANG_COLOR = "#f8fff8";

/* =========================================================
   PRESAS SUPERIORES
   ========================================================= */

const UPPER_FANG_LENGTH = 0.235;

const UPPER_FANG_HALF_WIDTH = 0.062;

const UPPER_FANG_SIDE = 0.27;

const UPPER_FANG_INWARD = 0.042;

const UPPER_FANG_ROOT_OVERLAP = 0.028;

/* =========================================================
   PRESAS INFERIORES
   ========================================================= */

const LOWER_FANG_LENGTH = 0.215;

const LOWER_FANG_HALF_WIDTH = 0.057;

const LOWER_FANG_SIDE = 0.115;

const LOWER_FANG_INWARD = 0.026;

const LOWER_FANG_ROOT_OVERLAP = 0.026;

/* =========================================================
   CONSTANTES INTERNAS
   ========================================================= */

const MIN_VECTOR_LENGTH = 0.000001;

/* =========================================================
   UTILITÁRIOS
   ========================================================= */

function clamp(value, minimum, maximum) {
  return Math.min(Math.max(value, minimum), maximum);
}

function lerp(start, end, progress) {
  return start + (end - start) * progress;
}

function smoothstep(progress) {
  const value = clamp(progress, 0, 1);

  return value * value * (3 - 2 * value);
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

/* =========================================================
   ÂNGULO
   ========================================================= */

function getHeadAngle(direction) {
  return Math.atan2(direction.y, direction.x);
}

/* =========================================================
   RETÂNGULO ARREDONDADO
   ========================================================= */

function drawRoundedRectangle(context, x, y, width, height, radius) {
  const safeRadius = Math.min(radius, width * 0.5, height * 0.5);

  const right = x + width;

  const bottom = y + height;

  context.beginPath();

  context.moveTo(x + safeRadius, y);

  context.lineTo(right - safeRadius, y);

  context.quadraticCurveTo(right, y, right, y + safeRadius);

  context.lineTo(right, bottom - safeRadius);

  context.quadraticCurveTo(right, bottom, right - safeRadius, bottom);

  context.lineTo(x + safeRadius, bottom);

  context.quadraticCurveTo(x, bottom, x, bottom - safeRadius);

  context.lineTo(x, y + safeRadius);

  context.quadraticCurveTo(x, y, x + safeRadius, y);

  context.closePath();
}

/* =========================================================
   CABEÇA
   ========================================================= */

function drawHead(context, color) {
  const x = -HEAD_LENGTH * 0.5;

  const y = -HEAD_WIDTH * 0.5;

  drawRoundedRectangle(context, x, y, HEAD_LENGTH, HEAD_WIDTH, HEAD_RADIUS);

  context.fillStyle = color;

  context.fill();
}

/* =========================================================
   OLHO
   ========================================================= */

function drawEye(context, side) {
  const eyeX = EYE_FORWARD;

  const eyeY = EYE_SIDE * side;

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

  context.fillStyle = EYE_WHITE;

  context.fill();

  /* =======================================================
     CLIP INTERNO DO OLHO
     ======================================================= */

  context.save();

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

  context.clip();

  /* =======================================================
     PUPILA
     ======================================================= */

  const pupilX = eyeX + PUPIL_FORWARD;

  const pupilY = eyeY;

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

  context.fillStyle = PUPIL_COLOR;

  context.fill();

  /* =======================================================
     BRILHO
     ======================================================= */

  context.beginPath();

  context.arc(
    pupilX + HIGHLIGHT_FORWARD,
    pupilY + HIGHLIGHT_SIDE * side,
    HIGHLIGHT_RADIUS,
    0,
    Math.PI * 2,
  );

  context.fillStyle = HIGHLIGHT_COLOR;

  context.fill();

  context.restore();
}

/* =========================================================
   OLHOS
   ========================================================= */

function drawEyes(context) {
  drawEye(context, 1);

  drawEye(context, -1);
}

/* =========================================================
   BOCHECHAS
   ========================================================= */

function drawCheeks(context) {
  context.fillStyle = CHEEK_COLOR;

  context.beginPath();

  context.arc(CHEEK_FORWARD, CHEEK_SIDE, CHEEK_RADIUS, 0, Math.PI * 2);

  context.arc(CHEEK_FORWARD, -CHEEK_SIDE, CHEEK_RADIUS, 0, Math.PI * 2);

  context.fill();
}

/* =========================================================
   BOCA NORMAL
   ========================================================= */

function drawNormalMouth(context) {
  const leftCorner = {
    x: MOUTH_FORWARD + MOUTH_CORNER_FORWARD,

    y: MOUTH_HALF_WIDTH,
  };

  const rightCorner = {
    x: MOUTH_FORWARD + MOUTH_CORNER_FORWARD,

    y: -MOUTH_HALF_WIDTH,
  };

  const leftMiddle = {
    x: MOUTH_FORWARD + MOUTH_DEPTH,

    y: MOUTH_HALF_WIDTH * 0.48,
  };

  const rightMiddle = {
    x: MOUTH_FORWARD + MOUTH_DEPTH,

    y: -MOUTH_HALF_WIDTH * 0.48,
  };

  const center = {
    x: MOUTH_FORWARD + MOUTH_CENTER_FORWARD,

    y: 0,
  };

  context.beginPath();

  context.moveTo(leftCorner.x, leftCorner.y);

  context.bezierCurveTo(
    MOUTH_FORWARD + MOUTH_DEPTH * 0.2,

    MOUTH_HALF_WIDTH * 0.86,

    leftMiddle.x,
    leftMiddle.y,

    center.x,
    center.y,
  );

  context.bezierCurveTo(
    rightMiddle.x,
    rightMiddle.y,

    MOUTH_FORWARD + MOUTH_DEPTH * 0.2,

    -MOUTH_HALF_WIDTH * 0.86,

    rightCorner.x,
    rightCorner.y,
  );

  context.strokeStyle = MOUTH_COLOR;

  context.lineWidth = MOUTH_LINE_WIDTH;

  context.lineCap = "round";

  context.lineJoin = "round";

  context.stroke();
}

/* =========================================================
   GEOMETRIA DA MORDIDA
   ========================================================= */

function getBiteGeometry(biteProgress) {
  const progress = smoothstep(biteProgress);

  return {
    progress,

    halfWidth: lerp(BITE_HALF_WIDTH_CLOSED, BITE_HALF_WIDTH_OPEN, progress),

    front: lerp(BITE_FRONT_CLOSED, BITE_FRONT_OPEN, progress),
  };
}

/* =========================================================
   CAMINHO DA CAVIDADE
   ========================================================= */

function buildBiteMouthPath(context, biteGeometry) {
  const { halfWidth, front, progress } = biteGeometry;

  const hinge = BITE_HINGE_FORWARD;

  const middleForward = lerp(hinge + 0.075, front - 0.045, progress);

  context.beginPath();

  context.moveTo(hinge, halfWidth);

  context.bezierCurveTo(
    middleForward,
    halfWidth * 1.015,

    front,
    halfWidth * 0.62,

    front,
    0,
  );

  context.bezierCurveTo(
    front,
    -halfWidth * 0.62,

    middleForward,
    -halfWidth * 1.015,

    hinge,
    -halfWidth,
  );

  context.bezierCurveTo(
    hinge - 0.055,

    -halfWidth * 0.56,

    hinge - 0.055,

    halfWidth * 0.56,

    hinge,
    halfWidth,
  );

  context.closePath();
}

/* =========================================================
   CAVIDADE DA BOCA
   ========================================================= */

function drawBiteMouth(context, biteGeometry) {
  buildBiteMouthPath(context, biteGeometry);

  context.fillStyle = BITE_COLOR;

  context.fill();
}

/* =========================================================
   PRESA
   ========================================================= */

function drawFang(context, { baseX, baseY, tipX, tipY, halfWidth }) {
  context.beginPath();

  context.moveTo(baseX, baseY - halfWidth);

  context.lineTo(tipX, tipY);

  context.lineTo(baseX, baseY + halfWidth);

  context.closePath();

  context.fillStyle = FANG_COLOR;

  context.fill();
}

/* =========================================================
   PRESAS DA MORDIDA
   ========================================================= */

function drawBiteFangs(context, biteGeometry) {
  const { progress, halfWidth, front } = biteGeometry;

  const fangProgress = smoothstep(clamp((progress - 0.06) / 0.94, 0, 1));

  if (fangProgress <= MIN_VECTOR_LENGTH) {
    return;
  }

  /*
   * As presas pertencem à cavidade.
   *
   * Mesmo que a raiz atravesse matematicamente
   * a borda para garantir conexão visual,
   * nada branco pode aparecer fora da boca.
   */

  context.save();

  buildBiteMouthPath(context, biteGeometry);

  context.clip();

  /* =======================================================
     SUPERIORES
     ======================================================= */

  const upperLength = UPPER_FANG_LENGTH * fangProgress;

  const upperHalfWidth = UPPER_FANG_HALF_WIDTH * fangProgress;

  const upperSide = Math.min(
    UPPER_FANG_SIDE * (0.74 + progress * 0.26),

    halfWidth * 0.66,
  );

  const upperBaseX = BITE_HINGE_FORWARD - UPPER_FANG_ROOT_OVERLAP;

  const upperTipX = BITE_HINGE_FORWARD + upperLength;

  drawFang(context, {
    baseX: upperBaseX,

    baseY: upperSide,

    tipX: upperTipX,

    tipY: upperSide - UPPER_FANG_INWARD * fangProgress,

    halfWidth: upperHalfWidth,
  });

  drawFang(context, {
    baseX: upperBaseX,

    baseY: -upperSide,

    tipX: upperTipX,

    tipY: -upperSide + UPPER_FANG_INWARD * fangProgress,

    halfWidth: upperHalfWidth,
  });

  /* =======================================================
     INFERIORES
     ======================================================= */

  const lowerLength = LOWER_FANG_LENGTH * fangProgress;

  const lowerHalfWidth = LOWER_FANG_HALF_WIDTH * fangProgress;

  const lowerSide = Math.min(
    LOWER_FANG_SIDE * (0.72 + progress * 0.28),

    halfWidth * 0.31,
  );

  const lowerBaseX = front + LOWER_FANG_ROOT_OVERLAP;

  const lowerTipX = front - lowerLength;

  drawFang(context, {
    baseX: lowerBaseX,

    baseY: lowerSide,

    tipX: lowerTipX,

    tipY: lowerSide - LOWER_FANG_INWARD * fangProgress,

    halfWidth: lowerHalfWidth,
  });

  drawFang(context, {
    baseX: lowerBaseX,

    baseY: -lowerSide,

    tipX: lowerTipX,

    tipY: -lowerSide + LOWER_FANG_INWARD * fangProgress,

    halfWidth: lowerHalfWidth,
  });

  context.restore();
}

/* =========================================================
   BOCA
   ========================================================= */

function drawMouth(context, biteProgress) {
  if (biteProgress <= MIN_VECTOR_LENGTH) {
    drawNormalMouth(context);

    return;
  }

  const biteGeometry = getBiteGeometry(biteProgress);

  drawBiteMouth(context, biteGeometry);

  drawBiteFangs(context, biteGeometry);
}

/* =========================================================
   ROSTO
   ========================================================= */

function drawFace(context, eatingState) {
  const biteProgress = clamp(
    eatingState?.biteProgress ?? 0,

    0,
    1,
  );

  drawEyes(context);

  drawCheeks(context);

  drawMouth(context, biteProgress);
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
    eatingState,
  }) {
    if (!context || !position || !bodyTangent || !headTangent) {
      return;
    }

    const headForward = normalizeVector(headTangent.x, headTangent.y);

    if (!headForward) {
      return;
    }

    const angle = getHeadAngle(headForward);

    context.save();

    context.translate(position.x, position.y);

    context.rotate(angle);

    drawHead(context, color);

    drawFace(context, eatingState);

    context.restore();
  }

  return {
    render,
  };
}