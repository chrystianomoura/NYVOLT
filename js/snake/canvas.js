/* =========================================================
   JARAKA — SNAKE CANVAS
   ========================================================= */

/* =========================================================
   UTILITÁRIOS
   ========================================================= */

function isPositiveNumber(value) {
  return Number.isFinite(value) && value > 0;
}

/* =========================================================
   CANVAS
   ========================================================= */

export function createSnakeCanvas({
  layer,
  columns,
  rows,
  className = "snake-body-canvas",
}) {
  if (!layer) {
    throw new Error("JARAKA Canvas: layer não informado.");
  }

  if (!isPositiveNumber(columns) || !isPositiveNumber(rows)) {
    throw new Error("JARAKA Canvas: grid inválido.");
  }

  /* =======================================================
     ESTADO
     ======================================================= */

  let canvas = null;
  let context = null;
  let resizeObserver = null;

  let ready = false;

  let width = 0;
  let height = 0;
  let pixelRatio = 1;

  /* =======================================================
     PIXEL RATIO
     ======================================================= */

  function resolvePixelRatio() {
    const ratio = window.devicePixelRatio || 1;

    if (!Number.isFinite(ratio) || ratio <= 0) {
      return 1;
    }

    return Math.max(1, ratio);
  }

  /* =======================================================
     TRANSFORMAÇÃO
     ======================================================= */

  function applyGridTransform() {
    if (!context || width <= 0 || height <= 0) {
      return;
    }

    context.setTransform(width / columns, 0, 0, height / rows, 0, 0);
  }

  /* =======================================================
     RESIZE
     ======================================================= */

  function resize() {
    if (!canvas || !context) {
      ready = false;

      return false;
    }

    const rect = layer.getBoundingClientRect();

    if (rect.width <= 0 || rect.height <= 0) {
      ready = false;

      return false;
    }

    pixelRatio = resolvePixelRatio();

    const nextWidth = Math.max(1, Math.round(rect.width * pixelRatio));

    const nextHeight = Math.max(1, Math.round(rect.height * pixelRatio));

    const sizeChanged =
      canvas.width !== nextWidth || canvas.height !== nextHeight;

    if (sizeChanged) {
      canvas.width = nextWidth;
      canvas.height = nextHeight;
    }

    width = nextWidth;
    height = nextHeight;

    applyGridTransform();

    ready = true;

    return sizeChanged;
  }

  /* =======================================================
     OBSERVER
     ======================================================= */

  function stopResizeObserver() {
    if (!resizeObserver) {
      return;
    }

    resizeObserver.disconnect();

    resizeObserver = null;
  }

  function startResizeObserver() {
    stopResizeObserver();

    if (typeof ResizeObserver === "undefined") {
      return;
    }

    resizeObserver = new ResizeObserver(() => {
      resize();
    });

    resizeObserver.observe(layer);
  }

  /* =======================================================
     CRIAÇÃO
     ======================================================= */

  function create() {
    destroy();

    canvas = document.createElement("canvas");

    canvas.classList.add(className);
    canvas.setAttribute("aria-hidden", "true");

    context = canvas.getContext("2d", {
      alpha: true,
    });

    if (!context) {
      canvas = null;

      throw new Error("JARAKA Canvas: contexto 2D indisponível.");
    }

    layer.appendChild(canvas);

    resize();
    startResizeObserver();

    return canvas;
  }

  /* =======================================================
     FRAME
     ======================================================= */

  function clear() {
    if (!context || !ready) {
      return;
    }

    context.clearRect(0, 0, columns, rows);
  }

  /* =======================================================
     CICLO DE VIDA
     ======================================================= */

  function destroy() {
    stopResizeObserver();

    if (canvas) {
      canvas.remove();
    }

    canvas = null;
    context = null;

    ready = false;

    width = 0;
    height = 0;
    pixelRatio = 1;
  }

  /* =======================================================
     GETTERS
     ======================================================= */

  function getCanvas() {
    return canvas;
  }

  function getContext() {
    return context;
  }

  function getMetrics() {
    return {
      width,
      height,
      pixelRatio,
      columns,
      rows,
    };
  }

  function isReady() {
    return ready;
  }

  /* =======================================================
     API
     ======================================================= */

  return {
    create,
    resize,
    clear,
    destroy,
    getCanvas,
    getContext,
    getMetrics,
    isReady,
  };
}