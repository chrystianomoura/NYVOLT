/* =========================================================
   JARAKA — ROUNDED PATH
   ========================================================= */

import { EPSILON } from "../game/config.js";

import { sampleRoundedPathAtLength } from "./path-sampling.js";

/* =========================================================
   CONSTANTES
   ========================================================= */

const CORNER_RADIUS = 0.18;

const FRONT_CORNER_RADIUS = 0.42;
const FRONT_CORNER_SEGMENT_RATIO = 0.48;

const FRONT_CORNER_FULL_INFLUENCE = 0.85;
const FRONT_CORNER_END_INFLUENCE = 1.65;

const FRONT_FRAME_WINDOW = 0.42;
const FRONT_FRAME_SAMPLE_COUNT = 24;
const FRONT_FRAME_DERIVATIVE_DELTA = 0.015;
const FRONT_FRAME_WEIGHT_FALLOFF = 2.6;

const FRONT_TURN_DISTANCE = 1.35;

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

function normalizeVector(x, y) {
  const length = Math.hypot(x, y);

  if (length <= EPSILON) {
    return null;
  }

  return {
    x: x / length,
    y: y / length,
  };
}

function clamp(value, minimum, maximum) {
  return Math.min(Math.max(value, minimum), maximum);
}

function lerp(start, end, progress) {
  return start + (end - start) * progress;
}

function smoothstep(start, end, value) {
  if (Math.abs(end - start) <= EPSILON) {
    return value < start ? 0 : 1;
  }

  const progress = clamp((value - start) / (end - start), 0, 1);

  return progress * progress * (3 - 2 * progress);
}

function smootherstep(start, end, value) {
  if (Math.abs(end - start) <= EPSILON) {
    return value < start ? 0 : 1;
  }

  const progress = clamp((value - start) / (end - start), 0, 1);

  return progress * progress * progress * (progress * (progress * 6 - 15) + 10);
}

function getManhattanDistance(first, second) {
  return Math.abs(second.x - first.x) + Math.abs(second.y - first.y);
}

/* =========================================================
   CURVA FRONTAL
   ========================================================= */

function getFrontCornerInfluence(distanceFromFront) {
  const release = smoothstep(
    FRONT_CORNER_FULL_INFLUENCE,
    FRONT_CORNER_END_INFLUENCE,
    distanceFromFront,
  );

  return 1 - release;
}

function getCornerProfile(distanceFromFront) {
  const influence = getFrontCornerInfluence(distanceFromFront);

  return {
    radius: lerp(CORNER_RADIUS, FRONT_CORNER_RADIUS, influence),

    segmentRatio: lerp(0.32, FRONT_CORNER_SEGMENT_RATIO, influence),
  };
}

/* =========================================================
   CURVAS
   ========================================================= */

function getCornerGeometry(previous, current, next, distanceFromFront) {
  const incomingLength = getManhattanDistance(previous, current);

  const outgoingLength = getManhattanDistance(current, next);

  if (incomingLength <= EPSILON || outgoingLength <= EPSILON) {
    return null;
  }

  const profile = getCornerProfile(distanceFromFront);

  const radius = Math.min(
    profile.radius,
    incomingLength * profile.segmentRatio,
    outgoingLength * profile.segmentRatio,
  );

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

  let distanceFromFront = 0;

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

    distanceFromFront += getManhattanDistance(previous, current);

    const incomingHorizontal = Math.abs(previous.y - current.y) < EPSILON;

    const outgoingHorizontal = Math.abs(current.y - next.y) < EPSILON;

    if (incomingHorizontal === outgoingHorizontal) {
      appendLine(current);

      continue;
    }

    const geometry = getCornerGeometry(
      previous,
      current,
      next,
      distanceFromFront,
    );

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
   TANGENTE LOCAL
   ========================================================= */

function getLocalPathTangent(pathGeometry, distance) {
  const totalLength = pathGeometry?.totalLength ?? 0;

  if (totalLength <= EPSILON) {
    return null;
  }

  const beforeDistance = clamp(
    distance - FRONT_FRAME_DERIVATIVE_DELTA,
    0,
    totalLength,
  );

  const afterDistance = clamp(
    distance + FRONT_FRAME_DERIVATIVE_DELTA,
    0,
    totalLength,
  );

  if (afterDistance - beforeDistance <= EPSILON) {
    return null;
  }

  const beforePoint = sampleRoundedPathAtLength(pathGeometry, beforeDistance);

  const afterPoint = sampleRoundedPathAtLength(pathGeometry, afterDistance);

  if (!beforePoint || !afterPoint) {
    return null;
  }

  return normalizeVector(
    beforePoint.x - afterPoint.x,
    beforePoint.y - afterPoint.y,
  );
}

/* =========================================================
   TANGENTE INTEGRADA
   ========================================================= */

function getFrontFrameWeight(distance, windowLength) {
  if (windowLength <= EPSILON) {
    return 1;
  }

  const normalizedDistance = clamp(distance / windowLength, 0, 1);

  const falloff = 1 - normalizedDistance;

  return Math.pow(falloff, FRONT_FRAME_WEIGHT_FALLOFF);
}

function getIntegratedFrontTangent(pathGeometry) {
  const totalLength = pathGeometry?.totalLength ?? 0;

  const windowLength = Math.min(FRONT_FRAME_WINDOW, totalLength);

  if (windowLength <= EPSILON) {
    return null;
  }

  let integratedX = 0;
  let integratedY = 0;
  let integratedWeight = 0;

  for (let index = 0; index < FRONT_FRAME_SAMPLE_COUNT; index += 1) {
    const progress =
      FRONT_FRAME_SAMPLE_COUNT === 1
        ? 0
        : index / (FRONT_FRAME_SAMPLE_COUNT - 1);

    const distance = windowLength * progress;

    const tangent = getLocalPathTangent(pathGeometry, distance);

    if (!tangent) {
      continue;
    }

    const weight = getFrontFrameWeight(distance, windowLength);

    if (weight <= EPSILON) {
      continue;
    }

    integratedX += tangent.x * weight;

    integratedY += tangent.y * weight;

    integratedWeight += weight;
  }

  if (integratedWeight <= EPSILON) {
    return null;
  }

  return normalizeVector(
    integratedX / integratedWeight,

    integratedY / integratedWeight,
  );
}

/* =========================================================
   INTERPOLAÇÃO ANGULAR
   ========================================================= */

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

/* =========================================================
   VIRADA
   ========================================================= */

function getFrontTurnTangent(pathGeometry, position) {
  const segments = pathGeometry?.segments ?? [];

  const cornerSegment = segments.find(
    (segment) => segment.type === "quadratic",
  );

  if (!cornerSegment) {
    return null;
  }

  const distanceToCorner = getManhattanDistance(
    position,
    cornerSegment.control,
  );

  if (distanceToCorner > FRONT_TURN_DISTANCE + EPSILON) {
    return null;
  }

  const newDirection = normalizeVector(
    cornerSegment.start.x - cornerSegment.control.x,

    cornerSegment.start.y - cornerSegment.control.y,
  );

  const previousDirection = normalizeVector(
    cornerSegment.control.x - cornerSegment.end.x,

    cornerSegment.control.y - cornerSegment.end.y,
  );

  if (!newDirection || !previousDirection) {
    return null;
  }

  const turnProgress = smootherstep(0, FRONT_TURN_DISTANCE, distanceToCorner);

  return interpolateDirection(previousDirection, newDirection, turnProgress);
}

/* =========================================================
   FRAME FRONTAL
   ========================================================= */

function getFallbackFrontFrame(pathGeometry) {
  const segments = pathGeometry?.segments ?? [];

  if (segments.length === 0) {
    return null;
  }

  const segment = segments[0];

  const position = {
    x: segment.start.x,
    y: segment.start.y,
  };

  let tangentX = 0;
  let tangentY = 0;

  if (segment.type === "line") {
    tangentX = segment.start.x - segment.end.x;

    tangentY = segment.start.y - segment.end.y;
  }

  if (segment.type === "quadratic") {
    tangentX = segment.start.x - segment.control.x;

    tangentY = segment.start.y - segment.control.y;
  }

  const tangent = normalizeVector(tangentX, tangentY);

  if (!tangent) {
    return null;
  }

  return {
    position,
    tangent,
  };
}

export function getRoundedPathFrontFrame(pathGeometry) {
  const segments = pathGeometry?.segments ?? [];

  if (segments.length === 0) {
    return null;
  }

  const position = {
    x: segments[0].start.x,
    y: segments[0].start.y,
  };

  const turnTangent = getFrontTurnTangent(pathGeometry, position);

  const integratedTangent = getIntegratedFrontTangent(pathGeometry);

  const tangent = turnTangent ?? integratedTangent;

  if (!tangent) {
    return getFallbackFrontFrame(pathGeometry);
  }

  return {
    position,
    tangent,
  };
}

/* =========================================================
   PATH DATA
   ========================================================= */

export function buildRoundedPathData(points) {
  return buildRoundedPathGeometry(points).pathData;
}
