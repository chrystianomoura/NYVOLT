/* =========================================================
   NYVOLT — PATH SAMPLING
   ========================================================= */

import { EPSILON } from "../game/config.js";

/* =========================================================
   UTILITÁRIOS
   ========================================================= */

function lerp(start, end, progress) {
  return start + (end - start) * progress;
}

function clamp(value, minimum, maximum) {
  return Math.min(Math.max(value, minimum), maximum);
}

function interpolatePoint(start, end, progress) {
  return {
    x: lerp(start.x, end.x, progress),

    y: lerp(start.y, end.y, progress),
  };
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
   QUADRÁTICA
   ========================================================= */

function sampleQuadraticSegmentAtLength(segment, localLength) {
  if (segment.length <= EPSILON) {
    return {
      x: segment.end.x,
      y: segment.end.y,
    };
  }

  const targetLength = clamp(localLength, 0, segment.length);

  const samples = segment.samples ?? [];

  if (samples.length === 0) {
    return {
      x: segment.end.x,
      y: segment.end.y,
    };
  }

  let lower = samples[0];

  let upper = samples[samples.length - 1];

  for (let index = 1; index < samples.length; index += 1) {
    if (samples[index].length >= targetLength) {
      lower = samples[index - 1];

      upper = samples[index];

      break;
    }
  }

  const intervalLength = upper.length - lower.length;

  const intervalProgress =
    intervalLength <= EPSILON
      ? 0
      : (targetLength - lower.length) / intervalLength;

  const progress = lerp(lower.t, upper.t, intervalProgress);

  return getQuadraticPoint(
    segment.start,
    segment.control,
    segment.end,
    progress,
  );
}

/* =========================================================
   AMOSTRAGEM
   ========================================================= */

export function sampleRoundedPathAtLength(pathGeometry, distance) {
  const segments = pathGeometry?.segments ?? [];

  if (segments.length === 0) {
    return null;
  }

  const totalLength = pathGeometry.totalLength ?? 0;

  const targetDistance = clamp(distance, 0, totalLength);

  for (let index = 0; index < segments.length; index += 1) {
    const segment = segments[index];

    if (
      targetDistance > segment.endLength + EPSILON &&
      index < segments.length - 1
    ) {
      continue;
    }

    const localLength = targetDistance - segment.startLength;

    if (segment.type === "quadratic") {
      return sampleQuadraticSegmentAtLength(segment, localLength);
    }

    if (segment.length <= EPSILON) {
      return {
        x: segment.end.x,
        y: segment.end.y,
      };
    }

    const progress = clamp(localLength / segment.length, 0, 1);

    return interpolatePoint(segment.start, segment.end, progress);
  }

  const lastSegment = segments[segments.length - 1];

  return {
    x: lastSegment.end.x,
    y: lastSegment.end.y,
  };
}