/* =========================================================
   JARAKA — SNAKE HEAD
   Cabeça, rosto, direção, animação de curva e cópias visuais

   Responsabilidades:
   - criação da cabeça principal;
   - criação do rosto;
   - criação de cópias visuais para wrap;
   - sincronização visual das cópias;
   - direção visual dos olhos;
   - formato horizontal/vertical;
   - animação visual durante curvas.

   Este módulo não controla:
   - geometria do corpo;
   - alimentação;
   - SVG do corpo;
   - regras de CLASSIC / NO WALL.
   ========================================================= */

/* =========================================================
   DIREÇÃO
   ========================================================= */

function getDirectionName(direction) {
  if (direction.x === 1) {
    return "right";
  }

  if (direction.x === -1) {
    return "left";
  }

  if (direction.y === -1) {
    return "up";
  }

  return "down";
}

/* =========================================================
   ROSTO
   ========================================================= */

function createFace() {
  const face = document.createElement("div");

  face.className = "snake-face";

  const leftEye = document.createElement("span");

  leftEye.className = "snake-eye snake-eye--left";

  const rightEye = document.createElement("span");

  rightEye.className = "snake-eye snake-eye--right";

  const mouth = document.createElement("span");

  mouth.className = "snake-mouth";

  face.append(leftEye, rightEye, mouth);

  return face;
}

/* =========================================================
   ESTRUTURA DA CABEÇA
   ========================================================= */

function createHeadStructure() {
  const element = document.createElement("div");

  element.className = "snake-part snake-head";

  const core = document.createElement("div");

  core.className = "snake-core";

  core.appendChild(createFace());

  element.appendChild(core);

  return {
    element,
    core,
  };
}

/* =========================================================
   CRIAÇÃO DA CABEÇA PRINCIPAL
   ========================================================= */

export function createHead(layer) {
  const head = createHeadStructure();

  layer.appendChild(head.element);

  return head;
}

/* =========================================================
   CRIAÇÃO DE CÓPIA VISUAL

   As cópias são usadas apenas quando a cabeça cruza uma
   borda no NO WALL.

   Elas não possuem lógica própria.

   O renderer posiciona:
   - cabeça principal;
   - cópia equivalente na borda oposta.

   Ambas compartilham exatamente o mesmo HTML visual.
   ========================================================= */

export function createHeadClone(layer) {
  const head = createHeadStructure();

  head.element.classList.add("snake-head--clone");

  head.element.setAttribute("aria-hidden", "true");

  head.element.style.visibility = "hidden";

  head.element.style.pointerEvents = "none";

  layer.appendChild(head.element);

  return head;
}

/* =========================================================
   SINCRONIZAÇÃO DA CÓPIA

   Mantemos na cópia somente os estados visuais relevantes
   da cabeça principal.

   Isso permite que:
   - direção;
   - formato;
   - curva;
   - mordida;
   - mastigação;

   apareçam iguais dos dois lados durante o wrap.
   ========================================================= */

export function syncHeadClone(
  sourceElement,
  sourceCore,
  cloneElement,
  cloneCore,
) {
  if (!sourceElement || !sourceCore || !cloneElement || !cloneCore) {
    return;
  }

  /*
   * Classes do elemento externo.
   */

  cloneElement.className = sourceElement.className;

  cloneElement.classList.add("snake-head--clone");

  /*
   * Dataset externo.
   */

  const cloneDataKeys = Object.keys(cloneElement.dataset);

  for (const key of cloneDataKeys) {
    delete cloneElement.dataset[key];
  }

  for (const [key, value] of Object.entries(sourceElement.dataset)) {
    cloneElement.dataset[key] = value;
  }

  /*
   * Classes do núcleo.
   */

  cloneCore.className = sourceCore.className;

  /*
   * Estados das partes internas.
   *
   * eating.js pode alterar classes da face, olhos ou boca.
   * Copiamos apenas className para manter a mesma estrutura
   * visual sem duplicar a lógica de alimentação.
   */

  const sourceChildren = sourceElement.querySelectorAll("*");

  const cloneChildren = cloneElement.querySelectorAll("*");

  const count = Math.min(sourceChildren.length, cloneChildren.length);

  for (let index = 0; index < count; index += 1) {
    cloneChildren[index].className = sourceChildren[index].className;
  }
}

/* =========================================================
   VISIBILIDADE DA CÓPIA
   ========================================================= */

export function showHeadClone(headElement) {
  if (!headElement) {
    return;
  }

  headElement.style.visibility = "visible";
}

export function hideHeadClone(headElement) {
  if (!headElement) {
    return;
  }

  headElement.style.visibility = "hidden";
}

/* =========================================================
   POSIÇÃO
   ========================================================= */

export function setHeadPosition(headElement, position) {
  if (!headElement || !position) {
    return;
  }

  headElement.style.setProperty("--visual-x", position.x);

  headElement.style.setProperty("--visual-y", position.y);
}

/* =========================================================
   FORMATO
   ========================================================= */

export function updateHeadShape(headCore, direction) {
  if (!headCore) {
    return;
  }

  headCore.classList.remove(
    "is-horizontal",
    "is-vertical",
    "is-corner",
    "corner-up-right",
    "corner-right-down",
    "corner-down-left",
    "corner-left-up",
  );

  headCore.classList.add(direction.x !== 0 ? "is-horizontal" : "is-vertical");
}

/* =========================================================
   DIREÇÃO VISUAL
   ========================================================= */

export function updateHeadDirection(headElement, direction) {
  if (!headElement) {
    return;
  }

  headElement.dataset.direction = getDirectionName(direction);
}

/* =========================================================
   ANIMAÇÃO DE CURVA
   ========================================================= */

export function triggerHeadTurn(headElement, headCore, turnSide) {
  if (!headElement || !headCore) {
    return;
  }

  headElement.dataset.turn = turnSide;

  headCore.classList.remove("is-turning");

  void headCore.offsetWidth;

  headCore.classList.add("is-turning");

  window.setTimeout(() => {
    if (!headElement || !headCore) {
      return;
    }

    headCore.classList.remove("is-turning");

    delete headElement.dataset.turn;
  }, 130);
}