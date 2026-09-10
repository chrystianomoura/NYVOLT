/* =========================================================
   NYVOLT — MOVEMENT
   ========================================================= */

/* =========================================================
   PRÓXIMA POSIÇÃO
   ========================================================= */

export function getNextHeadPosition(head, direction) {
  return {
    x: head.x + direction.x,
    y: head.y + direction.y,
  };
}

/* =========================================================
   DESLOCAMENTO
   ========================================================= */

export function moveSnakeSegments(snake, newHead) {
  const tailBeforeMove = {
    ...snake[snake.length - 1],
  };

  for (let index = snake.length - 1; index > 0; index -= 1) {
    snake[index] = {
      x: snake[index - 1].x,
      y: snake[index - 1].y,
    };
  }

  snake[0] = {
    x: newHead.x,
    y: newHead.y,
  };

  return tailBeforeMove;
}