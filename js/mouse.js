/* =========================================================
   JARAKA — MOUSE
   Estado visual e reação do rato à proximidade da cobra

   Responsabilidades:
   - calcular a distância entre rato e cabeça da Jaraka;
   - controlar as expressões visuais do rato;
   - reagir à aproximação da Jaraka.

   A posição lógica do rato é recebida dinamicamente
   durante cada atualização visual.
   ========================================================= */

const MOUSE_SCARED_DISTANCE = 3;

const EXPRESSION_CLASSES = ["is-normal", "is-angry", "is-scared", "is-happy"];

/* =========================================================
   CONTROLLER
   ========================================================= */

export function createMouseController({ element }) {
  /* =======================================================
     DISTÂNCIA
     ======================================================= */

  function getDistanceFrom(snakeHeadPosition, mousePosition) {
    if (!snakeHeadPosition || !mousePosition) {
      return Infinity;
    }

    const horizontalDistance = Math.abs(snakeHeadPosition.x - mousePosition.x);

    const verticalDistance = Math.abs(snakeHeadPosition.y - mousePosition.y);

    return horizontalDistance + verticalDistance;
  }

  /* =======================================================
     EXPRESSÃO
     ======================================================= */

  function setExpression(expression) {
    if (!element) {
      return;
    }

    element.classList.remove(...EXPRESSION_CLASSES);

    element.classList.add(`is-${expression}`);
  }

  /* =======================================================
     REAÇÃO À COBRA
     ======================================================= */

  function update(snakeHeadPosition, mousePosition) {
    if (!snakeHeadPosition || !mousePosition) {
      setExpression("angry");

      return;
    }

    const distance = getDistanceFrom(snakeHeadPosition, mousePosition);

    if (distance <= MOUSE_SCARED_DISTANCE) {
      setExpression("scared");

      return;
    }

    setExpression("angry");
  }

  return {
    update,
    setExpression,
  };
}
