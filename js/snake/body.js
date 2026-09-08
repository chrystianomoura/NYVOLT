/* =========================================================
   JARAKA — SNAKE BODY
   ========================================================= */

/* =========================================================
   CONSTANTES
   ========================================================= */

const CURVE_JOIN_THRESHOLD = 0.002;

/* =========================================================
   RENDERER
   ========================================================= */

export function createSnakeBodyRenderer({
  geometry,
  morphology,
  columns,
  rows,
  bodyWidth,
}) {
  /* =======================================================
     SUPERFÍCIE
     ======================================================= */

  function buildSurfaceSegments(context) {
    const centerPoints = geometry.getCenterPoints();

    const centerPointCount = geometry.getCenterPointCount();

    const boundaryWidths = geometry.getBoundaryWidths();

    const directionXs = geometry.getDirectionXs();

    const directionYs = geometry.getDirectionYs();

    const segmentCount = centerPointCount - 1;

    if (segmentCount <= 0) {
      return;
    }

    context.beginPath();

    for (let index = 0; index < segmentCount; index += 1) {
      const directionX = directionXs[index];

      const directionY = directionYs[index];

      if (directionX === 0 && directionY === 0) {
        continue;
      }

      const start = centerPoints[index];

      const end = centerPoints[index + 1];

      const normalX = -directionY;

      const normalY = directionX;

      const startRadius = boundaryWidths[index] * 0.5;

      const endRadius = boundaryWidths[index + 1] * 0.5;

      const startOffsetX = normalX * startRadius;

      const startOffsetY = normalY * startRadius;

      const endOffsetX = normalX * endRadius;

      const endOffsetY = normalY * endRadius;

      context.moveTo(start.x + startOffsetX, start.y + startOffsetY);

      context.lineTo(end.x + endOffsetX, end.y + endOffsetY);

      context.lineTo(end.x - endOffsetX, end.y - endOffsetY);

      context.lineTo(start.x - startOffsetX, start.y - startOffsetY);

      context.closePath();
    }

    context.fill();
  }

  /* =======================================================
     CURVAS
     ======================================================= */

  function fillCurveJoints(context) {
    const centerPoints = geometry.getCenterPoints();

    const centerPointCount = geometry.getCenterPointCount();

    const boundaryWidths = geometry.getBoundaryWidths();

    const directionXs = geometry.getDirectionXs();

    const directionYs = geometry.getDirectionYs();

    const segmentCount = centerPointCount - 1;

    if (segmentCount <= 1) {
      return;
    }

    context.beginPath();

    let hasJoint = false;

    for (let index = 1; index < segmentCount; index += 1) {
      const previousDirectionX = directionXs[index - 1];

      const previousDirectionY = directionYs[index - 1];

      const nextDirectionX = directionXs[index];

      const nextDirectionY = directionYs[index];

      if (
        (previousDirectionX === 0 && previousDirectionY === 0) ||
        (nextDirectionX === 0 && nextDirectionY === 0)
      ) {
        continue;
      }

      const cross =
        previousDirectionX * nextDirectionY -
        previousDirectionY * nextDirectionX;

      if (Math.abs(cross) <= CURVE_JOIN_THRESHOLD) {
        continue;
      }

      const point = centerPoints[index];

      const radius = boundaryWidths[index] * 0.5;

      context.moveTo(point.x + radius, point.y);

      context.arc(point.x, point.y, radius, 0, Math.PI * 2);

      hasJoint = true;
    }

    if (hasJoint) {
      context.fill();
    }
  }

  /* =======================================================
     EXTREMIDADES
     ======================================================= */

  function fillBodyCaps(context) {
    const centerPoints = geometry.getCenterPoints();

    const centerPointCount = geometry.getCenterPointCount();

    const boundaryWidths = geometry.getBoundaryWidths();

    if (centerPointCount === 0) {
      return;
    }

    const start = centerPoints[0];

    const startRadius = boundaryWidths[0] * 0.5;

    const tipIndex = centerPointCount - 1;

    const tip = centerPoints[tipIndex];

    const tipRadius = boundaryWidths[tipIndex] * 0.5;

    context.beginPath();

    if (start && Number.isFinite(startRadius) && startRadius > 0) {
      context.moveTo(start.x + startRadius, start.y);

      context.arc(start.x, start.y, startRadius, 0, Math.PI * 2);
    }

    if (tip && Number.isFinite(tipRadius) && tipRadius > 0) {
      context.moveTo(tip.x + tipRadius, tip.y);

      context.arc(tip.x, tip.y, tipRadius, 0, Math.PI * 2);
    }

    context.fill();
  }

  /* =======================================================
     LIMITES
     ======================================================= */

  function getBodyBounds() {
    const centerPoints = geometry.getCenterPoints();

    const centerPointCount = geometry.getCenterPointCount();

    if (centerPointCount === 0) {
      return null;
    }

    let minimumX = Infinity;
    let maximumX = -Infinity;

    let minimumY = Infinity;
    let maximumY = -Infinity;

    for (let index = 0; index < centerPointCount; index += 1) {
      const point = centerPoints[index];

      minimumX = Math.min(minimumX, point.x);

      maximumX = Math.max(maximumX, point.x);

      minimumY = Math.min(minimumY, point.y);

      maximumY = Math.max(maximumY, point.y);
    }

    return {
      minimumX,
      maximumX,
      minimumY,
      maximumY,
    };
  }

  /* =======================================================
     WRAP
     ======================================================= */

  function getWrapTileRange({ minimum, maximum, viewportSize }) {
    const minimumTile = Math.ceil((-bodyWidth - maximum) / viewportSize);

    const maximumTile = Math.floor(
      (viewportSize + bodyWidth - minimum) / viewportSize,
    );

    return {
      minimumTile,
      maximumTile,
    };
  }

  function drawProjection(context, offsetX, offsetY) {
    context.save();

    context.translate(offsetX, offsetY);

    buildSurfaceSegments(context);
    fillCurveJoints(context);
    fillBodyCaps(context);

    context.restore();
  }

  function renderWrapped(context) {
    const bounds = getBodyBounds();

    if (!bounds) {
      return;
    }

    const horizontalRange = getWrapTileRange({
      minimum: bounds.minimumX,
      maximum: bounds.maximumX,
      viewportSize: columns,
    });

    const verticalRange = getWrapTileRange({
      minimum: bounds.minimumY,
      maximum: bounds.maximumY,
      viewportSize: rows,
    });

    for (
      let tileY = verticalRange.minimumTile;
      tileY <= verticalRange.maximumTile;
      tileY += 1
    ) {
      for (
        let tileX = horizontalRange.minimumTile;
        tileX <= horizontalRange.maximumTile;
        tileX += 1
      ) {
        drawProjection(context, tileX * columns, tileY * rows);
      }
    }
  }

  /* =======================================================
     RENDERIZAÇÃO
     ======================================================= */

  function render({ context, color, visualGrowth, pathGeometry }) {
    if (!context) {
      return false;
    }

    const totalLength = pathGeometry?.totalLength ?? 0;

    if (!Number.isFinite(totalLength) || totalLength <= 0) {
      return false;
    }

    const minimumVisibleGrowth = morphology.getMinimumVisibleGrowth();

    const tailLength =
      visualGrowth > minimumVisibleGrowth
        ? morphology.getTailLength(totalLength, visualGrowth)
        : 0;

    const tailStart = Math.max(0, totalLength - tailLength);

    const pointCount = geometry.prepare({
      pathGeometry,
      tailStart,
      tailLength,
      visualGrowth,
    });

    if (pointCount < 2) {
      return false;
    }

    context.fillStyle = color;

    renderWrapped(context);

    return true;
  }

  /* =======================================================
     API
     ======================================================= */

  return {
    render,
  };
}