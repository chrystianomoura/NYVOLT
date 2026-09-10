/* =========================================================
   NYVOLT — ROUNDED PATH
   ========================================================= */

import { EPSILON } from "../game/config.js";

/* =========================================================
   CONSTANTES
   ========================================================= */

const CORNER_RADIUS = 0.18;
const CORNER_SEGMENT_RATIO = 0.32;
const CORNER_SATURATION_START = 0.72;

const QUADRATIC_LENGTH_STEPS = 8;

const QUADRATIC_UNIT_SAMPLE_LENGTHS = [
  0, 0.2348952559120767, 0.4433587569140507, 0.6321563502514659,
  0.8103087604232062, 0.9884611705949465, 1.1772587639323617,
  1.3857222649343357, 1.6206175208464124,
];

const QUADRATIC_UNIT_LENGTH =
  QUADRATIC_UNIT_SAMPLE_LENGTHS[QUADRATIC_UNIT_SAMPLE_LENGTHS.length - 1];

/* =========================================================
   UTILITÁRIOS
   ========================================================= */

function isSamePoint(first, second) {
  return (
    Math.abs(first.x - second.x) < EPSILON &&
    Math.abs(first.y - second.y) < EPSILON
  );
}

function getManhattanDistance(first, second) {
  return Math.abs(second.x - first.x) + Math.abs(second.y - first.y);
}

/* =========================================================
   SATURAÇÃO
   ========================================================= */

function getSaturatedCornerRadius(availableRadius) {
  if (availableRadius <= EPSILON) {
    return 0;
  }

  if (availableRadius >= CORNER_RADIUS) {
    return CORNER_RADIUS;
  }

  const saturationStart = CORNER_RADIUS * CORNER_SATURATION_START;

  if (availableRadius <= saturationStart) {
    return availableRadius;
  }

  const progress =
    (availableRadius - saturationStart) / (CORNER_RADIUS - saturationStart);

  const smoothedProgress =
    progress * progress * progress * (progress * (progress * 6 - 15) + 10);

  return saturationStart + (CORNER_RADIUS - saturationStart) * smoothedProgress;
}

/* =========================================================
   CURVAS
   ========================================================= */

function getCornerGeometry(previous, current, next) {
  const incomingLength = getManhattanDistance(previous, current);

  const outgoingLength = getManhattanDistance(current, next);

  if (incomingLength <= EPSILON || outgoingLength <= EPSILON) {
    return null;
  }

  const availableIncomingRadius = incomingLength * CORNER_SEGMENT_RATIO;

  const availableOutgoingRadius = outgoingLength * CORNER_SEGMENT_RATIO;

  const availableRadius = Math.min(
    availableIncomingRadius,
    availableOutgoingRadius,
  );

  const radius = getSaturatedCornerRadius(availableRadius);

  if (radius <= EPSILON) {
    return null;
  }

  const incomingX = current.x - previous.x;

  const incomingY = current.y - previous.y;

  const outgoingX = next.x - current.x;

  const outgoingY = next.y - current.y;

  const incomingUnitX = incomingX === 0 ? 0 : Math.sign(incomingX);

  const incomingUnitY = incomingY === 0 ? 0 : Math.sign(incomingY);

  const outgoingUnitX = outgoingX === 0 ? 0 : Math.sign(outgoingX);

  const outgoingUnitY = outgoingY === 0 ? 0 : Math.sign(outgoingY);

  return {
    radius,

    entry: {
      x: current.x - incomingUnitX * radius,

      y: current.y - incomingUnitY * radius,
    },

    corner: {
      x: current.x,
      y: current.y,
    },

    exit: {
      x: current.x + outgoingUnitX * radius,

      y: current.y + outgoingUnitY * radius,
    },
  };
}

/* =========================================================
   SEGMENTOS
   ========================================================= */

function createLineSegment(start, end, startLength) {
  const length = getManhattanDistance(start, end);

  return {
    type: "line",
    start,
    end,
    length,
    startLength,
    endLength: startLength + length,
  };
}

function createQuadraticSegment(start, control, end, startLength, radius) {
  const samples = new Array(QUADRATIC_LENGTH_STEPS + 1);

  for (let index = 0; index <= QUADRATIC_LENGTH_STEPS; index += 1) {
    samples[index] = {
      t: index / QUADRATIC_LENGTH_STEPS,

      length: QUADRATIC_UNIT_SAMPLE_LENGTHS[index] * radius,
    };
  }

  const length = QUADRATIC_UNIT_LENGTH * radius;

  return {
    type: "quadratic",
    start,
    control,
    end,
    radius,
    samples,
    length,
    startLength,
    endLength: startLength + length,
  };
}

/* =========================================================
   CONSTRUÇÃO
   ========================================================= */

export function buildRoundedPathGeometry(points) {
  if (points.length === 0) {
    return {
      pathData: "",
      segments: [],
      totalLength: 0,
    };
  }

  if (points.length === 1) {
    return {
      pathData: `M ${points[0].x} ` + `${points[0].y}`,

      segments: [],
      totalLength: 0,
    };
  }

  const segments = [];

  let totalLength = 0;

  let cursor = {
    x: points[0].x,
    y: points[0].y,
  };

  let pathData = `M ${cursor.x} ` + `${cursor.y}`;

  function appendLine(target) {
    if (!isSamePoint(cursor, target)) {
      const segment = createLineSegment(cursor, target, totalLength);

      segments.push(segment);

      totalLength = segment.endLength;
    }

    pathData += ` L ${target.x} ` + `${target.y}`;

    cursor = target;
  }

  function appendQuadratic(control, target, radius) {
    const segment = createQuadraticSegment(
      cursor,
      control,
      target,
      totalLength,
      radius,
    );

    if (segment.length > EPSILON) {
      segments.push(segment);

      totalLength = segment.endLength;
    }

    pathData +=
      ` Q ${control.x} ` + `${control.y} ` + `${target.x} ` + `${target.y}`;

    cursor = target;
  }

  for (let index = 1; index < points.length - 1; index += 1) {
    const previous = points[index - 1];

    const current = points[index];

    const next = points[index + 1];

    const incomingHorizontal = Math.abs(previous.y - current.y) < EPSILON;

    const outgoingHorizontal = Math.abs(current.y - next.y) < EPSILON;

    if (incomingHorizontal === outgoingHorizontal) {
      appendLine(current);

      continue;
    }

    const geometry = getCornerGeometry(previous, current, next);

    if (!geometry) {
      appendLine(current);

      continue;
    }

    appendLine(geometry.entry);

    appendQuadratic(geometry.corner, geometry.exit, geometry.radius);
  }

  appendLine(points[points.length - 1]);

  return {
    pathData,
    segments,
    totalLength,
  };
}

/* =========================================================
   PATH DATA
   ========================================================= */

export function buildRoundedPathData(points) {
  return buildRoundedPathGeometry(points).pathData;
}