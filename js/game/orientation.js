/* =========================================================
   JARAKA — ORIENTATION
   Controle de orientação

   Objetivo:
   - tentar manter o jogo em portrait em dispositivos touch;
   - não interferir em desktop;
   - aproveitar fullscreen quando disponível;
   - falhar silenciosamente quando o navegador não permitir.
   ========================================================= */

function isTouchDevice() {
  return navigator.maxTouchPoints > 0 || "ontouchstart" in window;
}

function canLockOrientation() {
  return Boolean(
    screen.orientation && typeof screen.orientation.lock === "function",
  );
}

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
    /*
     * Navegadores podem negar orientation.lock()
     * quando a página não está em fullscreen ou instalada
     * como PWA.
     *
     * Falhamos silenciosamente porque isso não deve
     * interromper o jogo.
     */
  }
}

export function initOrientationLock() {
  if (!isTouchDevice()) {
    return;
  }

  /*
   * Tentativa inicial.
   */

  tryLockPortrait();

  /*
   * Alguns navegadores passam a permitir o lock
   * quando o documento entra em fullscreen.
   */

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

  /*
   * Se a orientação mudar, tentamos reafirmar portrait.
   */

  screen.orientation?.addEventListener("change", () => {
    tryLockPortrait();
  });

  /*
   * Reexecutamos quando a aba volta ao foco.
   */

  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) {
      tryLockPortrait();
    }
  });
}