/* =========================================================
   JARAKA — PATH SAMPLING
   ========================================================= */

import { EPSILON } from "../game/config.js";

/* =========================================================
   INTERPOLAÇÃO
   ========================================================= */

function lerp(start, end, progress) {
  return start + (end - start) * progress;
}

function interpolatePoint(start, end, progress) {
  return {
    x: lerp(start.x, end.x, progress),

    y: lerp(start.y, end.y, progress),
  };
}

/* =========================================================
   CURVA QUADRÁTICA
   ========================================================= */

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
   AMOSTRAGEM DA CURVA
   ========================================================= */

function sampleQuadraticSegmentAtLength(segment, localLength) {
  if (segment.length <= EPSILON) {
    return {
      x: segment.end.x,
      y: segment.end.y,
    };
  }

  const targetLength = Math.max(0, Math.min(localLength, segment.length));

  const samples = segment.samples;

  for (let index = 1; index < samples.length; index += 1) {
    const current = samples[index];

    if (targetLength > current.length) {
      continue;
    }

    const previous = samples[index - 1];

    const intervalLength = current.length - previous.length;

    const intervalProgress =
      intervalLength <= EPSILON
        ? 0
        : (targetLength - previous.length) / intervalLength;

    const t = lerp(previous.t, current.t, intervalProgress);

    return getQuadraticPoint(segment.start, segment.control, segment.end, t);
  }

  return {
    x: segment.end.x,
    y: segment.end.y,
  };
}

/* =========================================================
   AMOSTRAGEM DO PATH
   ========================================================= */

export function sampleRoundedPathAtLength(pathGeometry, distance) {
  const segments = pathGeometry?.segments ?? [];

  if (segments.length === 0) {
    return null;
  }

  const totalLength = pathGeometry.totalLength;

  const targetLength = Math.max(0, Math.min(distance, totalLength));

  for (let index = 0; index < segments.length; index += 1) {
    const segment = segments[index];

    if (targetLength > segment.endLength && index < segments.length - 1) {
      continue;
    }

    const localLength = targetLength - segment.startLength;

    if (segment.type === "quadratic") {
      return sampleQuadraticSegmentAtLength(segment, localLength);
    }

    if (segment.length <= EPSILON) {
      return {
        x: segment.end.x,
        y: segment.end.y,
      };
    }

    const progress = Math.max(0, Math.min(localLength / segment.length, 1));

    return interpolatePoint(segment.start, segment.end, progress);
  }

  const lastSegment = segments[segments.length - 1];

  return {
    x: lastSegment.end.x,
    y: lastSegment.end.y,
  };
}