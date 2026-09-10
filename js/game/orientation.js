/* =========================================================
   NYVOLT — ORIENTATION
   ========================================================= */

/* =========================================================
   DETECÇÃO
   ========================================================= */

function isTouchDevice() {
  return navigator.maxTouchPoints > 0 || "ontouchstart" in window;
}

function canLockOrientation() {
  return Boolean(
    screen.orientation && typeof screen.orientation.lock === "function",
  );
}

/* =========================================================
   BLOQUEIO
   ========================================================= */

async function tryLockPortrait() {
  if (!isTouchDevice()) {
    return;
  }

  if (!canLockOrientation()) {
    return;
  }

  try {
    await screen.orientation.lock("portrait");
  } catch {
    return;
  }
}

/* =========================================================
   INICIALIZAÇÃO
   ========================================================= */

export function initOrientationLock() {
  if (!isTouchDevice()) {
    return;
  }

  tryLockPortrait();

  document.addEventListener("fullscreenchange", () => {
    if (document.fullscreenElement) {
      tryLockPortrait();
    }
  });

  document.addEventListener("webkitfullscreenchange", () => {
    if (document.webkitFullscreenElement) {
      tryLockPortrait();
    }
  });

  screen.orientation?.addEventListener("change", () => {
    tryLockPortrait();
  });

  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) {
      tryLockPortrait();
    }
  });
}