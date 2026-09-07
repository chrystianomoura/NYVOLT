/* =========================================================
   JARAKA — SNAKE PATH
   Geometria e interpolação da movimentação contínua

   Responsabilidades:
   - interpolação entre ticks;
   - posição visual da cabeça;
   - continuidade geométrica através das bordas;
   - posição visual da cauda;
   - travessia ortogonal da cauda em curvas;
   - construção dos pontos do corpo;
   - simplificação de retas;
   - arredondamento das curvas;
   - geração do path SVG;
   - geometria amostrável sem consultas ao DOM.
   ========================================================= */

import { EPSILON, GRID_COLUMNS, GRID_ROWS } from "../game/config.js";

const CORNER_RADIUS = 0.18;

const QUADRATIC_LENGTH_STEPS = 8;

/*
 * Todas as curvas produzidas por este módulo
 * são quadráticas ortogonais de 90°.
 *
 * A forma normalizada é sempre a mesma.
 * Somente o raio muda.
 *
 * Portanto não precisamos recalcular,
 * em todo frame e para toda curva,
 * os oito comprimentos intermediários.
 */

const QUADRATIC_UNIT_SAMPLE_LENGTHS = [
  0, 0.2348952559120767, 0.4433587569140507, 0.6321563502514659,
  0.8103087604232062, 0.9884611705949465, 1.1772587639323617,
  1.3857222649343357, 1.6206175208464124,
];

const QUADRATIC_UNIT_LENGTH =
  QUADRATIC_UNIT_SAMPLE_LENGTHS[QUADRATIC_UNIT_SAMPLE_LENGTHS.length - 1];

/* =========================================================
   INTERPOLAÇÃO
   ========================================================= */

function lerp(start, end, progress) {
  return start + (end - start) * progress;
}

function interpolatePoint(start, end, progress) {
  return {
    x: lerp(start.x, end.x, progress),

    y: lerp(start.y, end.y, progress),
  };
}

/* =========================================================
   UTILITÁRIOS DE GEOMETRIA
   ========================================================= */

function isSamePoint(first, second) {
  return (
    Math.abs(first.x - second.x) < EPSILON &&
    Math.abs(first.y - second.y) < EPSILON
  );
}

function isHorizontal(first, second) {
  return Math.abs(first.y - second.y) < EPSILON;
}

function isVertical(first, second) {
  return Math.abs(first.x - second.x) < EPSILON;
}

function isOrthogonal(first, second) {
  return isHorizontal(first, second) || isVertical(first, second);
}

function toCenter(position) {
  return {
    x: position.x + 0.5,

    y: position.y + 0.5,
  };
}

function getDistance(first, second) {
  return Math.hypot(
    second.x - first.x,

    second.y - first.y,
  );
}

function getManhattanDistance(first, second) {
  return Math.abs(second.x - first.x) + Math.abs(second.y - first.y);
}

/* =========================================================
   GEOMETRIA CONTÍNUA DO WRAP

   O estado lógico da cobra permanece sempre normalizado
   dentro de 10 × 22.

   O renderer, porém, trabalha em um plano virtual infinito.

   Exemplo horizontal:

   estado lógico:
   8 -> 9 -> 0 -> 1

   plano virtual:
   8 -> 9 -> 10 -> 11

   Depois de várias voltas, coordenadas como:

   x = 27
   x = -13
   y = 45
   y = -24

   são perfeitamente válidas no espaço visual.

   O tabuleiro real funciona apenas como uma janela sobre
   esse plano.

   Isso permite:
   - múltiplas travessias pelo mesmo lado;
   - travessias horizontais e verticais combinadas;
   - corpo ocupando os quatro lados simultaneamente;
   - cobras longas atravessando vários tiles virtuais.
   ========================================================= */

/*
 * Continuidade temporal da cabeça.
 *
 * Não basta reconstruir cada tick isoladamente.
 *
 * Se fizéssemos isso:
 *
 * tick A:
 * 9 -> 0  =  9 -> 10
 *
 * tick B:
 * 0 -> 1  =  0 -> 1
 *
 * o plano virtual saltaria de 10 para 1.
 *
 * Em vez disso acumulamos a posição virtual da cabeça:
 *
 * 9 -> 10 -> 11 -> 12...
 *
 * A posição lógica continua normalizada.
 */

let continuityInitialized = false;

let lastLogicalHead = null;

let lastVirtualHead = null;

let cachedSnakeReference = null;

let cachedPreviousSnakeReference = null;

let cachedContinuousState = null;

/* =========================================================
   NORMALIZAÇÃO TOROIDAL
   ========================================================= */

function wrapCoordinate(value, size) {
  return ((value % size) + size) % size;
}

/*
 * Recebe uma coordenada lógica ou virtual e devolve
 * a representação equivalente mais próxima de reference.
 *
 * Exemplo:
 *
 * reference = 9
 * value     = 0
 *
 * resultado = 10
 *
 * Mas também funciona depois de várias voltas:
 *
 * reference = 29
 * value     = 0
 *
 * resultado = 30
 */

function liftCoordinateNear(reference, value, size) {
  const normalized = wrapCoordinate(value, size);

  const tile = Math.round((reference - normalized) / size);

  return normalized + tile * size;
}

function liftPositionNear(reference, position) {
  return {
    x: liftCoordinateNear(reference.x, position.x, GRID_COLUMNS),

    y: liftCoordinateNear(reference.y, position.y, GRID_ROWS),
  };
}

/* =========================================================
   COMPARAÇÃO LÓGICA
   ========================================================= */

function isSameLogicalPosition(first, second) {
  if (!first || !second) {
    return false;
  }

  return (
    Math.abs(first.x - second.x) < EPSILON &&
    Math.abs(first.y - second.y) < EPSILON
  );
}

/* =========================================================
   RESET AUTOMÁTICO DE CONTINUIDADE
   ========================================================= */

/*
 * Uma nova rodada começa renderizando current e previous
 * com a mesma cabeça.
 *
 * Esse estado é um ponto seguro para reiniciar o plano
 * virtual na posição lógica normalizada.
 *
 * Também reiniciamos se a cadeia temporal for quebrada,
 * por exemplo após recriação completa do estado.
 */

function shouldResetContinuity(currentHead, previousHead) {
  if (!continuityInitialized) {
    return true;
  }

  if (isSameLogicalPosition(currentHead, previousHead)) {
    return true;
  }

  if (!isSameLogicalPosition(lastLogicalHead, previousHead)) {
    return true;
  }

  return false;
}

/* =========================================================
   ÂNCORAS VIRTUAIS DA CABEÇA
   ========================================================= */

function resolveHeadAnchors(snake, previousSnake) {
  /*
   * getVisualHead() e buildBodyPoints() são chamados no
   * mesmo frame com os mesmos arrays.
   *
   * O cache impede que o acumulador avance duas vezes.
   */

  if (
    cachedContinuousState &&
    cachedSnakeReference === snake &&
    cachedPreviousSnakeReference === previousSnake
  ) {
    return cachedContinuousState;
  }

  const currentHead = snake[0];

  const previousHead = previousSnake?.[0] ?? currentHead;

  let previousVirtualHead;

  if (shouldResetContinuity(currentHead, previousHead)) {
    previousVirtualHead = {
      x: previousHead.x,

      y: previousHead.y,
    };
  } else {
    previousVirtualHead = {
      x: lastVirtualHead.x,

      y: lastVirtualHead.y,
    };
  }

  const currentVirtualHead = liftPositionNear(previousVirtualHead, currentHead);

  continuityInitialized = true;

  lastLogicalHead = {
    x: currentHead.x,

    y: currentHead.y,
  };

  lastVirtualHead = {
    x: currentVirtualHead.x,

    y: currentVirtualHead.y,
  };

  cachedSnakeReference = snake;

  cachedPreviousSnakeReference = previousSnake;

  cachedContinuousState = {
    currentHead: currentVirtualHead,

    previousHead: previousVirtualHead,
  };

  return cachedContinuousState;
}

/* =========================================================
   RECONSTRUÇÃO CONTÍNUA DO CORPO
   ========================================================= */

/*
 * A cabeça define a âncora do tile virtual.
 *
 * A partir dela cada segmento é levantado para a cópia
 * toroidal equivalente mais próxima do segmento anterior.
 *
 * Como segmentos consecutivos da Snake são vizinhos no
 * grid lógico, essa operação reconstrói a centerline
 * completa sem limite de quantidade de wraps.
 */

function unwrapSnake(snake, headAnchor) {
  if (!Array.isArray(snake) || snake.length === 0) {
    return [];
  }

  const unwrapped = [
    {
      x: headAnchor.x,

      y: headAnchor.y,
    },
  ];

  for (let index = 1; index < snake.length; index += 1) {
    const previous = unwrapped[unwrapped.length - 1];

    const segment = snake[index];

    const virtualPosition = liftPositionNear(previous, segment);

    unwrapped.push(virtualPosition);
  }

  return unwrapped;
}

/* =========================================================
   ESTADOS CONTÍNUOS

   Current e previous precisam existir no MESMO plano
   virtual durante todo o tick.

   Esse é o ponto que permite combinar:

   lateral -> topo
   topo -> lateral
   direita -> esquerda -> direita
   múltiplas voltas em ambos os eixos
   ========================================================= */

function getContinuousSnakeStates(snake, previousSnake) {
  if (!Array.isArray(snake) || snake.length === 0) {
    return {
      current: [],
      previous: [],
    };
  }

  const previousSource =
    Array.isArray(previousSnake) && previousSnake.length > 0
      ? previousSnake
      : snake;

  const anchors = resolveHeadAnchors(snake, previousSource);

  const current = unwrapSnake(snake, anchors.currentHead);

  const previous = unwrapSnake(previousSource, anchors.previousHead);

  return {
    current,
    previous,
  };
}

/* =========================================================
   CABEÇA
   ========================================================= */

export function getVisualHead(snake, previousSnake, progress) {
  if (!Array.isArray(snake) || snake.length === 0) {
    return {
      x: 0,
      y: 0,
    };
  }

  const previousSource =
    Array.isArray(previousSnake) && previousSnake.length > 0
      ? previousSnake
      : snake;

  const anchors = resolveHeadAnchors(snake, previousSource);

  return {
    x: lerp(anchors.previousHead.x, anchors.currentHead.x, progress),

    y: lerp(anchors.previousHead.y, anchors.currentHead.y, progress),
  };
}

/* =========================================================
   CAUDA — DETECÇÃO DE CURVA
   ========================================================= */

function findTailCorner(snake, previousSnake, previousTail, currentTail) {
  if (isOrthogonal(previousTail, currentTail)) {
    return null;
  }

  const previousBeforeTail = previousSnake[previousSnake.length - 2];

  const currentBeforeTail = snake[snake.length - 2];

  let bestCandidate = null;

  let bestDistance = Infinity;

  /*
   * No máximo existem dois candidatos.
   *
   * Evitamos criar array + filter
   * a cada frame.
   */

  if (
    previousBeforeTail &&
    isOrthogonal(previousTail, previousBeforeTail) &&
    isOrthogonal(previousBeforeTail, currentTail)
  ) {
    const distance =
      getManhattanDistance(previousTail, previousBeforeTail) +
      getManhattanDistance(previousBeforeTail, currentTail);

    bestCandidate = previousBeforeTail;

    bestDistance = distance;
  }

  if (
    currentBeforeTail &&
    isOrthogonal(previousTail, currentBeforeTail) &&
    isOrthogonal(currentBeforeTail, currentTail)
  ) {
    const distance =
      getManhattanDistance(previousTail, currentBeforeTail) +
      getManhattanDistance(currentBeforeTail, currentTail);

    if (distance < bestDistance) {
      bestCandidate = currentBeforeTail;
    }
  }

  if (!bestCandidate) {
    return null;
  }

  return {
    x: bestCandidate.x,

    y: bestCandidate.y,
  };
}

/* =========================================================
   CAUDA — INTERPOLAÇÃO ORTOGONAL
   ========================================================= */

function getVisualTailState(snake, previousSnake, progress) {
  const currentTail = snake[snake.length - 1];

  const previousTail = previousSnake[previousSnake.length - 1] ?? currentTail;

  if (isOrthogonal(previousTail, currentTail)) {
    return {
      point: interpolatePoint(previousTail, currentTail, progress),

      corner: null,

      beforeCorner: false,
    };
  }

  const corner = findTailCorner(
    snake,
    previousSnake,
    previousTail,
    currentTail,
  );

  if (!corner) {
    return {
      point: interpolatePoint(previousTail, currentTail, progress),

      corner: null,

      beforeCorner: false,
    };
  }

  const firstLength = getManhattanDistance(previousTail, corner);

  const secondLength = getManhattanDistance(corner, currentTail);

  const totalLength = firstLength + secondLength;

  if (totalLength <= EPSILON) {
    return {
      point: {
        x: currentTail.x,

        y: currentTail.y,
      },

      corner: null,

      beforeCorner: false,
    };
  }

  const traveledDistance = totalLength * progress;

  if (traveledDistance <= firstLength && firstLength > EPSILON) {
    const localProgress = traveledDistance / firstLength;

    return {
      point: interpolatePoint(previousTail, corner, localProgress),

      corner,

      beforeCorner: true,
    };
  }

  if (secondLength <= EPSILON) {
    return {
      point: {
        x: currentTail.x,

        y: currentTail.y,
      },

      corner: null,

      beforeCorner: false,
    };
  }

  const secondDistance = Math.max(0, traveledDistance - firstLength);

  const localProgress = Math.min(secondDistance / secondLength, 1);

  return {
    point: interpolatePoint(corner, currentTail, localProgress),

    corner,

    beforeCorner: false,
  };
}

/* =========================================================
   CONSTRUÇÃO DOS PONTOS DO CORPO
   ========================================================= */

export function buildBodyPoints(snake, previousSnake, progress) {
  if (snake.length === 0) {
    return [];
  }

  /*
   * Antes de construir o path, transformamos as posições
   * normalizadas da cobra em uma centerline contínua.
   *
   * Em movimentos sem wrap os valores permanecem iguais.
   *
   * Portanto todo o restante da geometria continua usando
   * exatamente o mesmo pipeline.
   */

  const continuous = getContinuousSnakeStates(snake, previousSnake);

  const currentSnake = continuous.current;

  const previousContinuousSnake = continuous.previous;

  const points = [];

  const currentHead = currentSnake[0];

  const previousHead = previousContinuousSnake[0] ?? currentHead;

  const visualHead = interpolatePoint(previousHead, currentHead, progress);

  /*
   * Primeiro ponto:
   * cabeça visual centralizada.
   */

  points.push(toCenter(visualHead));

  /*
   * Corpo lógico transformado para o espaço contínuo.
   *
   * Uma cobra atravessando uma borda pode possuir pontos
   * virtuais como:
   *
   * 1, 0, -1, -2
   *
   * em vez de:
   *
   * 1, 0, 9, 8
   *
   * Isso impede linhas atravessando o centro da arena.
   */

  for (let index = 1; index < currentSnake.length; index += 1) {
    const segment = currentSnake[index];

    const point = toCenter(segment);

    const previous = points[points.length - 1];

    if (!previous || !isSamePoint(previous, point)) {
      points.push(point);
    }
  }

  if (currentSnake.length > 1) {
    const tailState = getVisualTailState(
      currentSnake,
      previousContinuousSnake,
      progress,
    );

    if (tailState.corner && tailState.beforeCorner) {
      const cornerPoint = toCenter(tailState.corner);

      const previous = points[points.length - 1];

      if (!previous || !isSamePoint(previous, cornerPoint)) {
        points.push(cornerPoint);
      }
    }

    const tailPoint = toCenter(tailState.point);

    const previous = points[points.length - 1];

    if (!previous || !isSamePoint(previous, tailPoint)) {
      points.push(tailPoint);
    }
  }

  return points;
}

/* =========================================================
   SIMPLIFICAÇÃO ORTOGONAL
   ========================================================= */

export function simplifyOrthogonalPoints(points) {
  if (points.length <= 2) {
    return points;
  }

  const simplified = [points[0]];

  for (let index = 1; index < points.length - 1; index += 1) {
    const previous = simplified[simplified.length - 1];

    const current = points[index];

    const next = points[index + 1];

    const sameHorizontal =
      Math.abs(previous.y - current.y) < EPSILON &&
      Math.abs(current.y - next.y) < EPSILON;

    const sameVertical =
      Math.abs(previous.x - current.x) < EPSILON &&
      Math.abs(current.x - next.x) < EPSILON;

    if (!sameHorizontal && !sameVertical) {
      simplified.push(current);
    }
  }

  simplified.push(points[points.length - 1]);

  return simplified;
}

/* =========================================================
   GEOMETRIA DA CURVA
   ========================================================= */

function getCornerGeometry(previous, current, next) {
  /*
   * Como os pontos são ortogonais,
   * os comprimentos são simplesmente
   * a diferença no eixo correspondente.
   *
   * Evitamos Math.hypot aqui.
   */

  const incomingLength =
    Math.abs(current.x - previous.x) + Math.abs(current.y - previous.y);

  const outgoingLength =
    Math.abs(next.x - current.x) + Math.abs(next.y - current.y);

  const radius = Math.min(
    CORNER_RADIUS,
    incomingLength * 0.32,
    outgoingLength * 0.32,
  );

  if (incomingLength <= EPSILON || outgoingLength <= EPSILON) {
    return null;
  }

  const incomingX = current.x - previous.x;

  const incomingY = current.y - previous.y;

  const outgoingX = next.x - current.x;

  const outgoingY = next.y - current.y;

  /*
   * Os vetores são ortogonais.
   *
   * Portanto cada componente unitário
   * é somente -1, 0 ou 1.
   */

  const incomingUnitX = incomingX === 0 ? 0 : Math.sign(incomingX);

  const incomingUnitY = incomingY === 0 ? 0 : Math.sign(incomingY);

  const outgoingUnitX = outgoingX === 0 ? 0 : Math.sign(outgoingX);

  const outgoingUnitY = outgoingY === 0 ? 0 : Math.sign(outgoingY);

  return {
    radius,

    entry: {
      x: current.x - incomingUnitX * radius,

      y: current.y - incomingUnitY * radius,
    },

    corner: {
      x: current.x,

      y: current.y,
    },

    exit: {
      x: current.x + outgoingUnitX * radius,

      y: current.y + outgoingUnitY * radius,
    },
  };
}

/* =========================================================
   SEGMENTOS MATEMÁTICOS DA CENTERLINE
   ========================================================= */

function createLineSegment(start, end, startLength) {
  /*
   * As linhas geradas aqui continuam
   * ortogonais.
   */

  const length = Math.abs(end.x - start.x) + Math.abs(end.y - start.y);

  return {
    type: "line",

    start,

    end,

    length,

    startLength,

    endLength: startLength + length,
  };
}

function getQuadraticPoint(start, control, end, progress) {
  const inverse = 1 - progress;

  return {
    x:
      inverse * inverse * start.x +
      2 * inverse * progress * control.x +
      progress * progress * end.x,

    y:
      inverse * inverse * start.y +
      2 * inverse * progress * control.y +
      progress * progress * end.y,
  };
}

function createQuadraticSegment(start, control, end, startLength, radius) {
  /*
   * Antes:
   *
   * - 8 chamadas de getQuadraticPoint()
   * - 8 chamadas de Math.hypot()
   * - reconstrução integral do
   *   comprimento da curva
   *
   * para cada curva e a cada frame.
   *
   * Agora:
   *
   * o perfil normalizado já está
   * pré-calculado e só é escalado
   * pelo raio.
   */

  const samples = new Array(QUADRATIC_LENGTH_STEPS + 1);

  for (let index = 0; index <= QUADRATIC_LENGTH_STEPS; index += 1) {
    samples[index] = {
      t: index / QUADRATIC_LENGTH_STEPS,

      length: QUADRATIC_UNIT_SAMPLE_LENGTHS[index] * radius,
    };
  }

  const length = QUADRATIC_UNIT_LENGTH * radius;

  return {
    type: "quadratic",

    start,

    control,

    end,

    samples,

    length,

    startLength,

    endLength: startLength + length,
  };
}

/* =========================================================
   GEOMETRIA COMPLETA DO PATH
   ========================================================= */

export function buildRoundedPathGeometry(points) {
  if (points.length === 0) {
    return {
      pathData: "",

      segments: [],

      totalLength: 0,
    };
  }

  if (points.length === 1) {
    return {
      pathData: `M ${points[0].x} ` + `${points[0].y}`,

      segments: [],

      totalLength: 0,
    };
  }

  const segments = [];

  let totalLength = 0;

  let cursorX = points[0].x;

  let cursorY = points[0].y;

  let cursor = {
    x: cursorX,

    y: cursorY,
  };

  let pathData = `M ${cursorX} ` + `${cursorY}`;

  function appendLine(target) {
    if (!isSamePoint(cursor, target)) {
      const segment = createLineSegment(cursor, target, totalLength);

      segments.push(segment);

      totalLength = segment.endLength;
    }

    pathData += ` L ${target.x} ` + `${target.y}`;

    cursorX = target.x;

    cursorY = target.y;

    cursor = target;
  }

  function appendQuadratic(control, target, radius) {
    const segment = createQuadraticSegment(
      cursor,
      control,
      target,
      totalLength,
      radius,
    );

    if (segment.length > EPSILON) {
      segments.push(segment);

      totalLength = segment.endLength;
    }

    pathData +=
      ` Q ${control.x} ` + `${control.y} ` + `${target.x} ` + `${target.y}`;

    cursorX = target.x;

    cursorY = target.y;

    cursor = target;
  }

  for (let index = 1; index < points.length - 1; index += 1) {
    const previous = points[index - 1];

    const current = points[index];

    const next = points[index + 1];

    const incomingHorizontal = Math.abs(previous.y - current.y) < EPSILON;

    const outgoingHorizontal = Math.abs(current.y - next.y) < EPSILON;

    if (incomingHorizontal === outgoingHorizontal) {
      appendLine(current);

      continue;
    }

    const geometry = getCornerGeometry(previous, current, next);

    if (!geometry) {
      appendLine(current);

      continue;
    }

    appendLine(geometry.entry);

    appendQuadratic(geometry.corner, geometry.exit, geometry.radius);
  }

  appendLine(points[points.length - 1]);

  return {
    pathData,
    segments,
    totalLength,
  };
}

/* =========================================================
   AMOSTRAGEM MATEMÁTICA
   ========================================================= */

function sampleQuadraticSegmentAtLength(segment, localLength) {
  if (segment.length <= EPSILON) {
    return {
      x: segment.end.x,

      y: segment.end.y,
    };
  }

  const targetLength = Math.max(0, Math.min(localLength, segment.length));

  const samples = segment.samples;

  for (let index = 1; index < samples.length; index += 1) {
    const current = samples[index];

    if (targetLength > current.length) {
      continue;
    }

    const previous = samples[index - 1];

    const intervalLength = current.length - previous.length;

    const intervalProgress =
      intervalLength <= EPSILON
        ? 0
        : (targetLength - previous.length) / intervalLength;

    const t = lerp(previous.t, current.t, intervalProgress);

    return getQuadraticPoint(segment.start, segment.control, segment.end, t);
  }

  return {
    x: segment.end.x,

    y: segment.end.y,
  };
}

export function sampleRoundedPathAtLength(pathGeometry, distance) {
  const segments = pathGeometry?.segments ?? [];

  if (segments.length === 0) {
    return null;
  }

  const totalLength = pathGeometry.totalLength;

  const targetLength = Math.max(0, Math.min(distance, totalLength));

  for (let index = 0; index < segments.length; index += 1) {
    const segment = segments[index];

    if (targetLength > segment.endLength && index < segments.length - 1) {
      continue;
    }

    const localLength = targetLength - segment.startLength;

    if (segment.type === "quadratic") {
      return sampleQuadraticSegmentAtLength(segment, localLength);
    }

    if (segment.length <= EPSILON) {
      return {
        x: segment.end.x,

        y: segment.end.y,
      };
    }

    const progress = Math.max(0, Math.min(localLength / segment.length, 1));

    return interpolatePoint(segment.start, segment.end, progress);
  }

  const lastSegment = segments[segments.length - 1];

  return {
    x: lastSegment.end.x,

    y: lastSegment.end.y,
  };
}

/* =========================================================
   CONSTRUÇÃO DO PATH SVG
   ========================================================= */

export function buildRoundedPathData(points) {
  return buildRoundedPathGeometry(points).pathData;
}
