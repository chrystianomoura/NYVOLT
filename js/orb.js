/* =========================================================
   NYVOLT — ENERGY ORB
   ========================================================= */

/* =========================================================
   CONSTANTES
   ========================================================= */

const MIN_SIZE = 1;

const ORB_RADIUS_SCALE = 0.39;
const INNER_RING_RADIUS_SCALE = 0.68;
const CORE_RADIUS_SCALE = 0.34;

const PARTICLE_COUNT = 5;

const PULSE_SPEED = 0.0042;
const ROTATION_SPEED = 0.0018;

/* =========================================================
   UTILITÁRIOS
   ========================================================= */

function clamp(value, minimum, maximum) {
  return Math.min(Math.max(value, minimum), maximum);
}

function lerp(start, end, progress) {
  return start + (end - start) * progress;
}

function getPixelRatio() {
  return Math.max(1, window.devicePixelRatio || 1);
}

/* =========================================================
   CONTROLLER
   ========================================================= */

export function createOrbController({ element }) {
  /* =========================================================
     CANVAS
     ========================================================= */

  const canvas = document.createElement("canvas");

  canvas.className = "energy-orb__canvas";

  canvas.setAttribute("aria-hidden", "true");

  canvas.style.display = "block";

  canvas.style.width = "100%";

  canvas.style.height = "100%";

  canvas.style.pointerEvents = "none";

  if (element) {
    element.replaceChildren(canvas);
  }

  const context = canvas.getContext("2d");

  let canvasWidth = 0;
  let canvasHeight = 0;
  let pixelRatio = 1;

  /* =========================================================
     CORES
     ========================================================= */

  let mainColor = "#27c8ff";
  let highlightColor = "#8be9ff";

  function resolveColors() {
    const styles = getComputedStyle(document.documentElement);

    const nextMainColor = styles.getPropertyValue("--snake-main").trim();

    const nextHighlightColor = styles
      .getPropertyValue("--snake-highlight")
      .trim();

    mainColor = nextMainColor || "#27c8ff";

    highlightColor = nextHighlightColor || mainColor;
  }

  /* =========================================================
     TAMANHO
     ========================================================= */

  function resizeCanvas() {
    if (!element || !context) {
      return false;
    }

    const rect = element.getBoundingClientRect();

    const width = Math.max(MIN_SIZE, rect.width);

    const height = Math.max(MIN_SIZE, rect.height);

    const nextPixelRatio = getPixelRatio();

    const requiredWidth = Math.round(width * nextPixelRatio);

    const requiredHeight = Math.round(height * nextPixelRatio);

    if (canvas.width === requiredWidth && canvas.height === requiredHeight) {
      canvasWidth = width;
      canvasHeight = height;
      pixelRatio = nextPixelRatio;

      return false;
    }

    canvas.width = requiredWidth;

    canvas.height = requiredHeight;

    canvasWidth = width;
    canvasHeight = height;
    pixelRatio = nextPixelRatio;

    return true;
  }

  /* =========================================================
     CORPO
     ========================================================= */

  function drawOrbBody({ centerX, centerY, radius, pulse }) {
    const gradient = context.createRadialGradient(
      centerX,
      centerY,
      0,
      centerX,
      centerY,
      radius,
    );

    gradient.addColorStop(0, highlightColor);

    gradient.addColorStop(0.28, highlightColor);

    gradient.addColorStop(0.62, mainColor);

    gradient.addColorStop(1, mainColor);

    context.save();

    context.globalAlpha = lerp(0.82, 1, pulse);

    context.fillStyle = gradient;

    context.beginPath();

    context.arc(centerX, centerY, radius, 0, Math.PI * 2);

    context.fill();

    context.restore();
  }

  /* =========================================================
     ANEL INTERNO
     ========================================================= */

  function drawInnerRing({ centerX, centerY, radius, rotation, pulse }) {
    const ringRadius = radius * INNER_RING_RADIUS_SCALE;

    context.save();

    context.beginPath();

    context.arc(centerX, centerY, radius, 0, Math.PI * 2);

    context.clip();

    context.translate(centerX, centerY);

    context.rotate(rotation);

    context.strokeStyle = highlightColor;

    context.globalAlpha = lerp(0.42, 0.76, pulse);

    context.lineWidth = Math.max(1, radius * 0.1);

    context.beginPath();

    context.arc(0, 0, ringRadius, Math.PI * 0.12, Math.PI * 1.1);

    context.stroke();

    context.beginPath();

    context.arc(0, 0, ringRadius, Math.PI * 1.3, Math.PI * 1.78);

    context.stroke();

    context.restore();
  }

  /* =========================================================
     PARTÍCULAS
     ========================================================= */

  function drawParticles({ centerX, centerY, radius, rotation, pulse }) {
    context.save();

    context.beginPath();

    context.arc(centerX, centerY, radius, 0, Math.PI * 2);

    context.clip();

    for (let index = 0; index < PARTICLE_COUNT; index += 1) {
      const progress = index / PARTICLE_COUNT;

      const direction = index % 2 === 0 ? 1 : -0.72;

      const angle = rotation * direction + progress * Math.PI * 2;

      const orbitRadius = radius * lerp(0.3, 0.72, progress);

      const x = centerX + Math.cos(angle) * orbitRadius;

      const y = centerY + Math.sin(angle) * orbitRadius;

      const particleRadius = Math.max(0.6, radius * lerp(0.035, 0.07, pulse));

      context.globalAlpha = lerp(0.42, 0.85, pulse);

      context.fillStyle = highlightColor;

      context.beginPath();

      context.arc(x, y, particleRadius, 0, Math.PI * 2);

      context.fill();
    }

    context.restore();
  }

  /* =========================================================
     NÚCLEO
     ========================================================= */

  function drawCore({ centerX, centerY, radius, pulse }) {
    const coreRadius =
      radius * lerp(CORE_RADIUS_SCALE, CORE_RADIUS_SCALE + 0.08, pulse);

    const gradient = context.createRadialGradient(
      centerX,
      centerY,
      0,
      centerX,
      centerY,
      coreRadius,
    );

    gradient.addColorStop(0, "#ffffff");

    gradient.addColorStop(0.35, "#ffffff");

    gradient.addColorStop(1, highlightColor);

    context.save();

    context.globalAlpha = lerp(0.88, 1, pulse);

    context.fillStyle = gradient;

    context.beginPath();

    context.arc(centerX, centerY, coreRadius, 0, Math.PI * 2);

    context.fill();

    context.restore();
  }

  /* =========================================================
     CONTORNO
     ========================================================= */

  function drawBoundary({ centerX, centerY, radius, pulse }) {
    const lineWidth = Math.max(1, radius * 0.055);

    const boundaryRadius = Math.max(0, radius - lineWidth * 0.5);

    context.save();

    context.strokeStyle = highlightColor;

    context.globalAlpha = lerp(0.42, 0.72, pulse);

    context.lineWidth = lineWidth;

    context.beginPath();

    context.arc(centerX, centerY, boundaryRadius, 0, Math.PI * 2);

    context.stroke();

    context.restore();
  }

  /* =========================================================
     RENDER
     ========================================================= */

  function render(timestamp = performance.now()) {
    if (!context || !element) {
      return;
    }

    resizeCanvas();

    if (canvasWidth <= 0 || canvasHeight <= 0) {
      return;
    }

    resolveColors();

    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

    context.clearRect(0, 0, canvasWidth, canvasHeight);

    const centerX = canvasWidth * 0.5;

    const centerY = canvasHeight * 0.5;

    const baseSize = Math.min(canvasWidth, canvasHeight);

    const pulseWave = Math.sin(timestamp * PULSE_SPEED);

    const pulse = clamp((pulseWave + 1) * 0.5, 0, 1);

    const radius = baseSize * ORB_RADIUS_SCALE * lerp(0.94, 1, pulse);

    const rotation = timestamp * ROTATION_SPEED;

    drawOrbBody({
      centerX,
      centerY,
      radius,
      pulse,
    });

    drawParticles({
      centerX,
      centerY,
      radius,
      rotation,
      pulse,
    });

    drawInnerRing({
      centerX,
      centerY,
      radius,
      rotation,
      pulse,
    });

    drawCore({
      centerX,
      centerY,
      radius,
      pulse,
    });

    drawBoundary({
      centerX,
      centerY,
      radius,
      pulse,
    });
  }

  /* =========================================================
     UPDATE
     ========================================================= */

  function update() {
    render(performance.now());
  }

  /* =========================================================
     INICIALIZAÇÃO
     ========================================================= */

  resizeCanvas();
  resolveColors();
  render();

  /* =========================================================
     API
     ========================================================= */

  return {
    update,
  };
}