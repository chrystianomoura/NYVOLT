/* =========================================================
   JARAKA — SNAKE GEOMETRY
   ========================================================= */

import { sampleRoundedPathAtLength } from "./path.js";

/* =========================================================
   CONSTANTES
   ========================================================= */

const MIN_VECTOR_LENGTH = 0.000001;
const DISTANCE_EPSILON = 0.000001;
const TAIL_LINE_SAMPLE_SPACING = 0.22;

/* =========================================================
   UTILITÁRIOS
   ========================================================= */

function lerp(start, end, progress) {
  return start + (end - start) * progress;
}

function clamp(value, minimum, maximum) {
  return Math.max(minimum, Math.min(value, maximum));
}

function isSamePoint(first, second) {
  if (!first || !second) {
    return false;
  }

  return (
    Math.abs(first.x - second.x) <= DISTANCE_EPSILON &&
    Math.abs(first.y - second.y) <= DISTANCE_EPSILON
  );
}

function getQuadraticPoint(start, control, end, progress) {
  const inverse = 1 - progress;

  return {
    x:
      inverse * inverse * start.x +
      2 * inverse * progress * control.x +
      progress * progress * end.x,

    y:
      inverse * inverse * start.y +
      2 * inverse * progress * control.y +
      progress * progress * end.y,
  };
}

/* =========================================================
   GEOMETRIA
   ========================================================= */

export function createSnakeGeometry({ bodyWidth, morphology }) {
  const centerPoints = [];

  const boundaryWidths = [];

  const directionXs = [];

  const directionYs = [];

  let centerPointCount = 0;

  /* =======================================================
     PONTOS
     ======================================================= */

  function pushCenterPoint(point, distance) {
    if (!point) {
      return;
    }

    const previous =
      centerPointCount > 0 ? centerPoints[centerPointCount - 1] : null;

    if (previous && isSamePoint(previous, point)) {
      previous.distance = Math.max(previous.distance, distance);

      return;
    }

    let target = centerPoints[centerPointCount];

    if (!target) {
      target = {
        x: 0,
        y: 0,
        distance: 0,
      };

      centerPoints.push(target);
    }

    target.x = point.x;
    target.y = point.y;
    target.distance = distance;

    centerPointCount += 1;
  }

  /* =======================================================
     RETAS
     ======================================================= */

  function pushLineTailSamples(segment, tailStart) {
    const startLength = segment.startLength;

    const endLength = segment.endLength;

    if (endLength <= tailStart + DISTANCE_EPSILON) {
      return;
    }

    const firstRelevantDistance = Math.max(tailStart, startLength);

    const firstSampleIndex = Math.max(
      1,
      Math.floor(
        (firstRelevantDistance - startLength) / TAIL_LINE_SAMPLE_SPACING,
      ) + 1,
    );

    const segmentLength = endLength - startLength;

    if (segmentLength <= DISTANCE_EPSILON) {
      return;
    }

    for (let sampleIndex = firstSampleIndex; ; sampleIndex += 1) {
      const localDistance = sampleIndex * TAIL_LINE_SAMPLE_SPACING;

      if (localDistance >= segmentLength - DISTANCE_EPSILON) {
        break;
      }

      const globalDistance = startLength + localDistance;

      if (globalDistance <= tailStart + DISTANCE_EPSILON) {
        continue;
      }

      const progress = localDistance / segmentLength;

      pushCenterPoint(
        {
          x: lerp(segment.start.x, segment.end.x, progress),

          y: lerp(segment.start.y, segment.end.y, progress),
        },

        globalDistance,
      );
    }
  }

  /* =======================================================
     AMOSTRAGEM
     ======================================================= */

  function buildStructuralBodyPoints(pathGeometry, tailStart) {
    centerPointCount = 0;

    const segments = pathGeometry?.segments ?? [];

    if (segments.length === 0) {
      return 0;
    }

    const firstSegment = segments[0];

    pushCenterPoint(firstSegment.start, firstSegment.startLength);

    let tailStartInserted = tailStart <= DISTANCE_EPSILON;

    function insertTailStartBefore(distance) {
      if (tailStartInserted) {
        return;
      }

      if (distance <= tailStart + DISTANCE_EPSILON) {
        return;
      }

      const tailStartPoint = sampleRoundedPathAtLength(pathGeometry, tailStart);

      pushCenterPoint(tailStartPoint, tailStart);

      tailStartInserted = true;
    }

    for (
      let segmentIndex = 0;
      segmentIndex < segments.length;
      segmentIndex += 1
    ) {
      const segment = segments[segmentIndex];

      if (segment.type === "line") {
        if (
          !tailStartInserted &&
          tailStart > segment.startLength + DISTANCE_EPSILON &&
          tailStart < segment.endLength - DISTANCE_EPSILON
        ) {
          const tailStartPoint = sampleRoundedPathAtLength(
            pathGeometry,
            tailStart,
          );

          pushCenterPoint(tailStartPoint, tailStart);

          tailStartInserted = true;
        }

        pushLineTailSamples(segment, tailStart);

        insertTailStartBefore(segment.endLength);

        pushCenterPoint(segment.end, segment.endLength);

        continue;
      }

      if (segment.type === "quadratic") {
        const samples = segment.samples ?? [];

        for (
          let sampleIndex = 1;
          sampleIndex < samples.length;
          sampleIndex += 1
        ) {
          const sample = samples[sampleIndex];

          const globalDistance = segment.startLength + sample.length;

          insertTailStartBefore(globalDistance);

          const point = getQuadraticPoint(
            segment.start,
            segment.control,
            segment.end,
            sample.t,
          );

          pushCenterPoint(point, globalDistance);
        }

        insertTailStartBefore(segment.endLength);

        pushCenterPoint(segment.end, segment.endLength);
      }
    }

    if (!tailStartInserted) {
      const totalLength = pathGeometry?.totalLength ?? 0;

      if (tailStart < totalLength - DISTANCE_EPSILON) {
        const tailStartPoint = sampleRoundedPathAtLength(
          pathGeometry,
          tailStart,
        );

        pushCenterPoint(tailStartPoint, tailStart);
      }
    }

    return centerPointCount;
  }

  /* =======================================================
     LARGURAS
     ======================================================= */

  function prepareWidths(tailStart, tailLength, visualGrowth) {
    boundaryWidths.length = centerPointCount;

    let taperPreviousWidth = bodyWidth;

    for (let index = 0; index < centerPointCount; index += 1) {
      const point = centerPoints[index];

      let width = bodyWidth;

      if (
        visualGrowth > morphology.getMinimumVisibleGrowth() &&
        tailLength > DISTANCE_EPSILON &&
        point.distance > tailStart + DISTANCE_EPSILON
      ) {
        const progress = clamp((point.distance - tailStart) / tailLength, 0, 1);

        width = morphology.getTailWidth(progress, visualGrowth);

        width = Math.min(taperPreviousWidth, width);
      }

      boundaryWidths[index] = width;

      if (point.distance >= tailStart - DISTANCE_EPSILON) {
        taperPreviousWidth = width;
      }
    }
  }

  /* =======================================================
     DIREÇÕES
     ======================================================= */

  function prepareDirections() {
    const segmentCount = Math.max(0, centerPointCount - 1);

    directionXs.length = segmentCount;

    directionYs.length = segmentCount;

    for (let index = 0; index < segmentCount; index += 1) {
      const start = centerPoints[index];

      const end = centerPoints[index + 1];

      const dx = end.x - start.x;

      const dy = end.y - start.y;

      const length = Math.hypot(dx, dy);

      if (length <= MIN_VECTOR_LENGTH) {
        directionXs[index] = 0;
        directionYs[index] = 0;

        continue;
      }

      const inverseLength = 1 / length;

      directionXs[index] = dx * inverseLength;

      directionYs[index] = dy * inverseLength;
    }
  }

  /* =======================================================
     PREPARAÇÃO
     ======================================================= */

  function prepare({ pathGeometry, tailStart, tailLength, visualGrowth }) {
    buildStructuralBodyPoints(pathGeometry, tailStart);

    prepareWidths(tailStart, tailLength, visualGrowth);

    prepareDirections();

    return centerPointCount;
  }

  /* =======================================================
     RESET
     ======================================================= */

  function reset() {
    centerPointCount = 0;

    boundaryWidths.length = 0;
    directionXs.length = 0;
    directionYs.length = 0;
  }

  /* =======================================================
     GETTERS
     ======================================================= */

  function getCenterPoints() {
    return centerPoints;
  }

  function getCenterPointCount() {
    return centerPointCount;
  }

  function getBoundaryWidths() {
    return boundaryWidths;
  }

  function getDirectionXs() {
    return directionXs;
  }

  function getDirectionYs() {
    return directionYs;
  }

  /* =======================================================
     API
     ======================================================= */

  return {
    prepare,
    reset,
    getCenterPoints,
    getCenterPointCount,
    getBoundaryWidths,
    getDirectionXs,
    getDirectionYs,
  };
}