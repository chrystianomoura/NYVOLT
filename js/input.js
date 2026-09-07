/* =========================================================
   JARAKA — INPUT
   Controle de entrada do jogador

   Suporta:
   - teclado por setas;
   - teclado por WASD;
   - swipe responsivo por touch;
   - quatro direções;
   - bloqueio de reversão de 180°;
   - uma mudança efetiva de direção por tick;
   - reconhecimento durante o movimento do dedo;
   - controle contínuo sem levantar o dedo;
   - buffer de intenção;
   - trava de eixo para evitar movimento em escadinha.
   ========================================================= */

export function createInputController({ getDirection, onDirectionChange }) {
  /* =======================================================
     ESTADO
     ======================================================= */

  let directionQueued = false;

  let touchStartX = null;
  let touchStartY = null;

  /*
   * Eixo atualmente reconhecido durante o contato:
   *
   * null         → nenhuma direção reconhecida ainda
   * "horizontal" → gesto horizontal
   * "vertical"   → gesto vertical
   */

  let touchAxis = null;

  /*
   * Última intenção válida realizada enquanto uma
   * mudança anterior ainda aguarda o próximo tick.
   */

  let pendingTouchDirection = null;

  /* =======================================================
     SENSIBILIDADE

     Primeiro comando:
     12 px → resposta rápida.

     Mudança de eixo durante o mesmo contato:
     24 px → exige intenção mais clara.

     Isso reduz falsos comandos causados por pequenas
     diagonais naturais do dedo.
     ======================================================= */

  const MIN_SWIPE_DISTANCE = 12;

  const DIRECTION_CHANGE_DISTANCE = 24;

  /* =======================================================
     DIREÇÕES
     ======================================================= */

  const UP = {
    x: 0,
    y: -1,
    name: "up",
  };

  const DOWN = {
    x: 0,
    y: 1,
    name: "down",
  };

  const LEFT = {
    x: -1,
    y: 0,
    name: "left",
  };

  const RIGHT = {
    x: 1,
    y: 0,
    name: "right",
  };

  /* =======================================================
     MAPA DE TECLADO

     Setas:
     ↑ ↓ ← →

     WASD:
     W → cima
     A → esquerda
     S → baixo
     D → direita

     As letras são normalizadas para minúsculas,
     portanto funcionam também com Shift / Caps Lock.
     ======================================================= */

  const keyboardDirections = {
    ArrowUp: UP,
    ArrowDown: DOWN,
    ArrowLeft: LEFT,
    ArrowRight: RIGHT,

    w: UP,
    s: DOWN,
    a: LEFT,
    d: RIGHT,
  };

  /* =======================================================
     COMPARAÇÃO
     ======================================================= */

  function isSameDirection(firstDirection, secondDirection) {
    if (!firstDirection || !secondDirection) {
      return false;
    }

    return (
      firstDirection.x === secondDirection.x &&
      firstDirection.y === secondDirection.y
    );
  }

  function isOppositeDirection(currentDirection, nextDirection) {
    return (
      currentDirection.x + nextDirection.x === 0 &&
      currentDirection.y + nextDirection.y === 0
    );
  }

  function getDirectionAxis(direction) {
    if (!direction) {
      return null;
    }

    return direction.x !== 0 ? "horizontal" : "vertical";
  }

  /* =======================================================
     VALIDAÇÃO
     ======================================================= */

  function canQueueDirection(nextDirection) {
    if (!nextDirection) {
      return false;
    }

    const currentDirection = getDirection();

    if (!currentDirection) {
      return false;
    }

    if (isSameDirection(currentDirection, nextDirection)) {
      return false;
    }

    if (isOppositeDirection(currentDirection, nextDirection)) {
      return false;
    }

    return true;
  }

  /* =======================================================
     ENVIO DE DIREÇÃO
     ======================================================= */

  function queueDirection(nextDirection) {
    if (directionQueued) {
      return false;
    }

    if (!canQueueDirection(nextDirection)) {
      return false;
    }

    directionQueued = true;

    onDirectionChange(nextDirection);

    return true;
  }

  /* =======================================================
     BUFFER TOUCH
     ======================================================= */

  function bufferTouchDirection(nextDirection) {
    if (!nextDirection) {
      return;
    }

    /*
     * Não armazenamos uma direção igual à direção
     * lógica atual.
     */

    const currentDirection = getDirection();

    if (isSameDirection(currentDirection, nextDirection)) {
      return;
    }

    /*
     * Também não armazenamos uma reversão direta.
     */

    if (isOppositeDirection(currentDirection, nextDirection)) {
      return;
    }

    pendingTouchDirection = nextDirection;
  }

  /* =======================================================
     TECLADO

     Suporta:
     - ArrowUp / W
     - ArrowDown / S
     - ArrowLeft / A
     - ArrowRight / D
     ======================================================= */

  function handleKeyDown(event) {
    const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;

    const nextDirection = keyboardDirections[key];

    if (!nextDirection) {
      return;
    }

    /*
     * Impede:
     * - scroll pelas setas;
     * - comportamentos nativos associados às teclas
       enquanto elas controlam a JARAKA.
     */

    event.preventDefault();

    queueDirection(nextDirection);
  }

  /* =======================================================
     TOUCH — RESET
     ======================================================= */

  function resetTouch() {
    touchStartX = null;
    touchStartY = null;

    touchAxis = null;
  }

  /* =======================================================
     TOUCH — INÍCIO
     ======================================================= */

  function handleTouchStart(event) {
    if (event.touches.length !== 1) {
      resetTouch();

      return;
    }

    const touch = event.touches[0];

    touchStartX = touch.clientX;
    touchStartY = touch.clientY;

    touchAxis = null;
  }

  /* =======================================================
     TOUCH — DIREÇÃO
     ======================================================= */

  function getHorizontalDirection(deltaX) {
    return deltaX > 0 ? RIGHT : LEFT;
  }

  function getVerticalDirection(deltaY) {
    return deltaY > 0 ? DOWN : UP;
  }

  /* =======================================================
     TOUCH — PRIMEIRA INTENÇÃO

     O primeiro gesto do contato usa 12 px.

     O eixo dominante define a direção inicial.
     ======================================================= */

  function resolveInitialTouchDirection(deltaX, deltaY) {
    const absoluteX = Math.abs(deltaX);
    const absoluteY = Math.abs(deltaY);

    if (absoluteX < MIN_SWIPE_DISTANCE && absoluteY < MIN_SWIPE_DISTANCE) {
      return null;
    }

    if (absoluteX > absoluteY) {
      return getHorizontalDirection(deltaX);
    }

    return getVerticalDirection(deltaY);
  }

  /* =======================================================
     TOUCH — MUDANÇA DE EIXO

     Depois que o gesto já possui um eixo, uma mudança
     perpendicular exige 24 px.

     Exemplo:

       gesto horizontal
            ↓
       pequenas oscilações verticais
            ↓
          IGNORADAS

       movimento vertical >= 24 px
            ↓
       mudança intencional de eixo
     ======================================================= */

  function resolveAxisChange(deltaX, deltaY) {
    if (touchAxis === "horizontal") {
      if (Math.abs(deltaY) < DIRECTION_CHANGE_DISTANCE) {
        return null;
      }

      /*
       * Para considerar uma curva vertical, o movimento
       * vertical também precisa dominar o deslocamento
       * horizontal acumulado desde a última origem.
       */

      if (Math.abs(deltaY) <= Math.abs(deltaX)) {
        return null;
      }

      return getVerticalDirection(deltaY);
    }

    if (touchAxis === "vertical") {
      if (Math.abs(deltaX) < DIRECTION_CHANGE_DISTANCE) {
        return null;
      }

      /*
       * Mesma regra no sentido inverso.
       */

      if (Math.abs(deltaX) <= Math.abs(deltaY)) {
        return null;
      }

      return getHorizontalDirection(deltaX);
    }

    return null;
  }

  /* =======================================================
     TOUCH — MOVIMENTO

     Existem dois estados:

     1. nenhum eixo reconhecido
        → 12 px identificam rapidamente a primeira intenção;

     2. eixo já reconhecido
        → somente uma mudança perpendicular clara de 24 px
          gera uma nova intenção.

     O mesmo swipe não é reinterpretado continuamente
     como várias direções.
     ======================================================= */

  function handleTouchMove(event) {
    if (touchStartX === null || touchStartY === null) {
      return;
    }

    if (event.touches.length !== 1) {
      resetTouch();

      return;
    }

    event.preventDefault();

    const touch = event.touches[0];

    const currentX = touch.clientX;
    const currentY = touch.clientY;

    const deltaX = currentX - touchStartX;

    const deltaY = currentY - touchStartY;

    /* =====================================================
       PRIMEIRA DIREÇÃO DO CONTATO
       ===================================================== */

    if (touchAxis === null) {
      const nextDirection = resolveInitialTouchDirection(deltaX, deltaY);

      if (!nextDirection) {
        return;
      }

      touchAxis = getDirectionAxis(nextDirection);

      /*
       * A partir daqui começamos a medir uma possível
       * mudança de eixo a partir do ponto atual.
       */

      touchStartX = currentX;
      touchStartY = currentY;

      if (!directionQueued) {
        queueDirection(nextDirection);

        return;
      }

      bufferTouchDirection(nextDirection);

      return;
    }

    /* =====================================================
       MUDANÇA DE EIXO
       ===================================================== */

    const nextDirection = resolveAxisChange(deltaX, deltaY);

    if (!nextDirection) {
      return;
    }

    /*
     * Uma mudança perpendicular real foi reconhecida.
     */

    touchAxis = getDirectionAxis(nextDirection);

    /*
     * Reposicionamos a origem somente após uma mudança
     * válida de eixo.

     * Pequenos desvios não deslocam a referência.
     */

    touchStartX = currentX;
    touchStartY = currentY;

    if (!directionQueued) {
      queueDirection(nextDirection);

      return;
    }

    bufferTouchDirection(nextDirection);
  }

  /* =======================================================
     TOUCH — FIM

     Ao retirar o dedo:
     - encerramos a geometria do gesto;
     - a intenção já validada no buffer permanece.

     Isso é importante porque o jogador pode terminar
     fisicamente o swipe alguns milissegundos antes
     de o próximo tick consumi-lo.
     ======================================================= */

  function handleTouchEnd() {
    resetTouch();
  }

  /* =======================================================
     TOUCH — CANCELAMENTO
     ======================================================= */

  function handleTouchCancel() {
    resetTouch();

    pendingTouchDirection = null;
  }

  /* =======================================================
     UNLOCK

     Chamado quando o movimento anterior da cobra
     foi consumido.

     Se houver uma intenção touch válida aguardando,
     ela é preparada imediatamente para o próximo tick.
     ======================================================= */

  function unlock() {
    directionQueued = false;

    if (!pendingTouchDirection) {
      return;
    }

    const nextDirection = pendingTouchDirection;

    pendingTouchDirection = null;

    queueDirection(nextDirection);
  }

  /* =======================================================
     START
     ======================================================= */

  function start() {
    directionQueued = false;

    pendingTouchDirection = null;

    resetTouch();

    window.addEventListener("keydown", handleKeyDown);

    window.addEventListener("touchstart", handleTouchStart, {
      passive: true,
    });

    window.addEventListener("touchmove", handleTouchMove, {
      passive: false,
    });

    window.addEventListener("touchend", handleTouchEnd, {
      passive: true,
    });

    window.addEventListener("touchcancel", handleTouchCancel, {
      passive: true,
    });
  }

  /* =======================================================
     STOP
     ======================================================= */

  function stop() {
    window.removeEventListener("keydown", handleKeyDown);

    window.removeEventListener("touchstart", handleTouchStart);

    window.removeEventListener("touchmove", handleTouchMove);

    window.removeEventListener("touchend", handleTouchEnd);

    window.removeEventListener("touchcancel", handleTouchCancel);

    directionQueued = false;

    pendingTouchDirection = null;

    resetTouch();
  }

  /* =======================================================
     API
     ======================================================= */

  return {
    start,
    stop,
    unlock,
  };
}