/* =========================================================
   NYVOLT — COLLISION
   ========================================================= */

/* =========================================================
   POSIÇÕES
   ========================================================= */

export function isSamePosition(first, second) {
  return first.x === second.x && first.y === second.y;
}

/* =========================================================
   AUTOCOLISÃO
   ========================================================= */

export function willHitSelf({
  position,
  snake,
  pendingGrowth = 0,
  willGrow = false,
}) {
  const body =
    pendingGrowth > 0 || willGrow ? snake.slice(1) : snake.slice(1, -1);

  return body.some((segment) => isSamePosition(segment, position));
}