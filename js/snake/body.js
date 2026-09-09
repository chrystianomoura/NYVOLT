/* =========================================================
   NYVOLT — BODY
   ========================================================= */

/* =========================================================
   CONSTANTES
   ========================================================= */

const MIN_VECTOR_LENGTH = 0.000001;
const MITER_LIMIT = 1.35;

/*
 * Intensidade máxima do pulso de brilho.
 *
 * 0.32 = aproxima a cor original em 32%
 * do branco no pico da absorção.
 */
const ENERGY_BRIGHTNESS = 0.32;

/* =========================================================
   UTILITÁRIOS
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

function getNormal(directionX, directionY) {
  return {
    x: -directionY,
    y: directionX,
  };
}

function clamp(value, minimum, maximum) {
  return Math.min(Math.max(value, minimum), maximum);
}

/* =========================================================
   COR
   ========================================================= */

function hexToRgb(color) {
  if (typeof color !== "string" || !color.startsWith("#")) {
    return null;
  }

  const normalized = color.slice(1);

  if (normalized.length !== 6) {
    return null;
  }

  const r = Number.parseInt(normalized.slice(0, 2), 16);

  const g = Number.parseInt(normalized.slice(2, 4), 16);

  const b = Number.parseInt(normalized.slice(4, 6), 16);

  if (!Number.isFinite(r) || !Number.isFinite(g) || !Number.isFinite(b)) {
    return null;
  }

  return {
    r,
    g,
    b,
  };
}

function mixChannel(start, end, amount) {
  return Math.round(start + (end - start) * amount);
}

function rgbToHex(r, g, b) {
  return `#${[r, g, b]
    .map((channel) => clamp(channel, 0, 255).toString(16).padStart(2, "0"))
    .join("")}`;
}

/* =========================================================
   PULSO DE BRILHO INTERNO
   ========================================================= */

function getEnergyColor(color, energyProgress) {
  const energy = clamp(energyProgress, 0, 1);

  if (energy <= 0) {
    return color;
  }

  const rgb = hexToRgb(color);

  if (!rgb) {
    return color;
  }

  const brightness = energy * ENERGY_BRIGHTNESS;

  return rgbToHex(
    mixChannel(rgb.r, 255, brightness),

    mixChannel(rgb.g, 255, brightness),

    mixChannel(rgb.b, 255, brightness),
  );
}

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
     NORMAIS
     ======================================================= */

  function getBoundaryNormal(index) {
    const centerPointCount = geometry.getCenterPointCount();

    const directionXs = geometry.getDirectionXs();

    const directionYs = geometry.getDirectionYs();

    const segmentCount = centerPointCount - 1;

    if (segmentCount <= 0) {
      return null;
    }

    if (index <= 0) {
      return getNormal(directionXs[0], directionYs[0]);
    }

    if (index >= centerPointCount - 1) {
      return getNormal(
        directionXs[segmentCount - 1],
        directionYs[segmentCount - 1],
      );
    }

    const previousDirectionX = directionXs[index - 1];

    const previousDirectionY = directionYs[index - 1];

    const nextDirectionX = directionXs[index];

    const nextDirectionY = directionYs[index];

    const previousValid =
      Math.abs(previousDirectionX) > MIN_VECTOR_LENGTH ||
      Math.abs(previousDirectionY) > MIN_VECTOR_LENGTH;

    const nextValid =
      Math.abs(nextDirectionX) > MIN_VECTOR_LENGTH ||
      Math.abs(nextDirectionY) > MIN_VECTOR_LENGTH;

    if (!previousValid && !nextValid) {
      return null;
    }

    if (!previousValid) {
      return getNormal(nextDirectionX, nextDirectionY);
    }

    if (!nextValid) {
      return getNormal(previousDirectionX, previousDirectionY);
    }

    const previousNormal = getNormal(previousDirectionX, previousDirectionY);

    const nextNormal = getNormal(nextDirectionX, nextDirectionY);

    const averagedNormal = normalizeVector(
      previousNormal.x + nextNormal.x,

      previousNormal.y + nextNormal.y,
    );

    return averagedNormal ?? previousNormal;
  }

  /* =======================================================
     MITER
     ======================================================= */

  function getBoundaryOffset(index, radius) {
    const centerPointCount = geometry.getCenterPointCount();

    const directionXs = geometry.getDirectionXs();

    const directionYs = geometry.getDirectionYs();

    const normal = getBoundaryNormal(index);

    if (!normal) {
      return {
        x: 0,
        y: 0,
      };
    }

    if (index <= 0 || index >= centerPointCount - 1) {
      return {
        x: normal.x * radius,

        y: normal.y * radius,
      };
    }

    const previousDirectionX = directionXs[index - 1];

    const previousDirectionY = directionYs[index - 1];

    const previousValid =
      Math.abs(previousDirectionX) > MIN_VECTOR_LENGTH ||
      Math.abs(previousDirectionY) > MIN_VECTOR_LENGTH;

    if (!previousValid) {
      return {
        x: normal.x * radius,

        y: normal.y * radius,
      };
    }

    const previousNormal = getNormal(previousDirectionX, previousDirectionY);

    const alignment = normal.x * previousNormal.x + normal.y * previousNormal.y;

    if (alignment <= MIN_VECTOR_LENGTH) {
      return {
        x: normal.x * radius,

        y: normal.y * radius,
      };
    }

    const miterScale = Math.min(1 / alignment, MITER_LIMIT);

    return {
      x: normal.x * radius * miterScale,

      y: normal.y * radius * miterScale,
    };
  }

  /* =======================================================
     BORDAS
     ======================================================= */

  function buildBoundaryPoints(widthScale = 1) {
    const centerPoints = geometry.getCenterPoints();

    const centerPointCount = geometry.getCenterPointCount();

    const boundaryWidths = geometry.getBoundaryWidths();

    const leftPoints = new Array(centerPointCount);

    const rightPoints = new Array(centerPointCount);

    for (let index = 0; index < centerPointCount; index += 1) {
      const center = centerPoints[index];

      const radius = boundaryWidths[index] * 0.5 * widthScale;

      const offset = getBoundaryOffset(index, radius);

      leftPoints[index] = {
        x: center.x + offset.x,

        y: center.y + offset.y,
      };

      rightPoints[index] = {
        x: center.x - offset.x,

        y: center.y - offset.y,
      };
    }

    return {
      leftPoints,
      rightPoints,
    };
  }

  /* =======================================================
     SUPERFÍCIE
     ======================================================= */

  function buildBodySurface(context, widthScale = 1) {
    const centerPointCount = geometry.getCenterPointCount();

    if (centerPointCount < 2) {
      return;
    }

    const { leftPoints, rightPoints } = buildBoundaryPoints(widthScale);

    const lastIndex = centerPointCount - 1;

    context.beginPath();

    context.moveTo(leftPoints[0].x, leftPoints[0].y);

    for (let index = 1; index <= lastIndex; index += 1) {
      context.lineTo(leftPoints[index].x, leftPoints[index].y);
    }

    for (let index = lastIndex; index >= 0; index -= 1) {
      context.lineTo(rightPoints[index].x, rightPoints[index].y);
    }

    context.closePath();
    context.fill();
  }

  /* =======================================================
     EXTREMIDADES
     ======================================================= */

  function fillBodyCaps(context, widthScale = 1) {
    const centerPoints = geometry.getCenterPoints();

    const centerPointCount = geometry.getCenterPointCount();

    const boundaryWidths = geometry.getBoundaryWidths();

    if (centerPointCount === 0) {
      return;
    }

    const start = centerPoints[0];

    const startRadius = boundaryWidths[0] * 0.5 * widthScale;

    const tipIndex = centerPointCount - 1;

    const tip = centerPoints[tipIndex];

    const tipRadius = boundaryWidths[tipIndex] * 0.5 * widthScale;

    context.beginPath();

    let hasCap = false;

    if (start && Number.isFinite(startRadius) && startRadius > 0) {
      context.moveTo(start.x + startRadius, start.y);

      context.arc(start.x, start.y, startRadius, 0, Math.PI * 2);

      hasCap = true;
    }

    if (tip && Number.isFinite(tipRadius) && tipRadius > 0) {
      context.moveTo(tip.x + tipRadius, tip.y);

      context.arc(tip.x, tip.y, tipRadius, 0, Math.PI * 2);

      hasCap = true;
    }

    if (hasCap) {
      context.fill();
    }
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

  /* =======================================================
     PROJEÇÃO
     ======================================================= */

  function drawBodyProjection({ context, offsetX, offsetY }) {
    context.save();

    context.translate(offsetX, offsetY);

    buildBodySurface(context, 1);

    fillBodyCaps(context, 1);

    context.restore();
  }

  function renderWrappedBody({ context }) {
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
        drawBodyProjection({
          context,

          offsetX: tileX * columns,

          offsetY: tileY * rows,
        });
      }
    }
  }

  /* =======================================================
     NYVOLT
     ======================================================= */

  function renderBody({ context, color, energyProgress = 0 }) {
    /*
     * O corpo continua sendo desenhado uma única vez.
     *
     * Não há:
     *
     * - alteração de opacidade;
     * - alteração de largura;
     * - segunda camada;
     * - glow;
     * - sombra;
     * - composite "lighter".
     *
     * Somente a própria cor recebe mais luminosidade
     * enquanto energyProgress estiver ativo.
     */
    const energyColor = getEnergyColor(color, energyProgress);

    context.save();

    context.globalAlpha = 1;
    context.fillStyle = energyColor;

    renderWrappedBody({
      context,
    });

    context.restore();
  }

  /* =======================================================
     RENDERIZAÇÃO
     ======================================================= */

  function render({
    context,
    color,
    visualGrowth,
    pathGeometry,
    energyProgress = 0,
  }) {
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

    renderBody({
      context,
      color,
      energyProgress,
    });

    return true;
  }

  /* =======================================================
     API
     ======================================================= */

  return {
    render,
  };
}