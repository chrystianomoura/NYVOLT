/* =========================================================
   JARAKA — THEME
   Identidade da personagem ativa

   Responsabilidades:
   - validar temas;
   - aplicar o tema cromático;
   - manter a personagem ativa;
   - atualizar o nome exibido na arena;
   - notificar módulos interessados quando o tema mudar.
   ========================================================= */

/* =========================================================
   TEMAS
   ========================================================= */

const THEMES = Object.freeze({
  VERDYKA: "verdyka",
  AZULLY: "azully",
  AMARELLOW: "amarellow",
  VERMILLY: "vermilly",
});

/* =========================================================
   PERSONAGENS
   ========================================================= */

const CHARACTERS = Object.freeze({
  [THEMES.VERDYKA]: Object.freeze({
    id: THEMES.VERDYKA,
    name: "VERDYKA",
  }),

  [THEMES.AZULLY]: Object.freeze({
    id: THEMES.AZULLY,
    name: "AZULLY",
  }),

  [THEMES.AMARELLOW]: Object.freeze({
    id: THEMES.AMARELLOW,
    name: "AMARELLOW",
  }),

  [THEMES.VERMILLY]: Object.freeze({
    id: THEMES.VERMILLY,
    name: "VERMILLY",
  }),
});

/* =========================================================
   EVENTOS
   ========================================================= */

export const THEME_CHANGE_EVENT = "jaraka:themechange";

/* =========================================================
   VALIDAÇÃO
   ========================================================= */

const VALID_THEMES = new Set(Object.values(THEMES));

/* =========================================================
   ESTADO
   ========================================================= */

let currentTheme = THEMES.AZULLY;

/* =========================================================
   NORMALIZAÇÃO
   ========================================================= */

function normalizeTheme(theme) {
  if (typeof theme !== "string") {
    return null;
  }

  const normalizedTheme = theme.trim().toLowerCase();

  if (!VALID_THEMES.has(normalizedTheme)) {
    return null;
  }

  return normalizedTheme;
}

/* =========================================================
   DOM — NOME DA PERSONAGEM
   ========================================================= */

function updateCharacterName(theme) {
  const element = document.getElementById("character-name");

  if (!element) {
    return;
  }

  const character = CHARACTERS[theme];

  if (!character) {
    return;
  }

  element.textContent = character.name;
}

/* =========================================================
   EVENTO — ALTERAÇÃO DE TEMA
   ========================================================= */

function dispatchThemeChange(theme) {
  window.dispatchEvent(
    new CustomEvent(THEME_CHANGE_EVENT, {
      detail: {
        theme,
      },
    }),
  );
}

/* =========================================================
   APLICAÇÃO
   ========================================================= */

export function setTheme(theme) {
  const normalizedTheme = normalizeTheme(theme);

  if (!normalizedTheme) {
    return false;
  }

  currentTheme = normalizedTheme;

  document.documentElement.dataset.theme = normalizedTheme;

  updateCharacterName(normalizedTheme);

  dispatchThemeChange(normalizedTheme);

  return true;
}

/* =========================================================
   TEMA ATUAL
   ========================================================= */

export function getTheme() {
  return currentTheme;
}

/* =========================================================
   PERSONAGEM ATUAL
   ========================================================= */

export function getCurrentCharacter() {
  return CHARACTERS[currentTheme];
}

/* =========================================================
   PERSONAGEM POR TEMA
   ========================================================= */

export function getCharacter(theme) {
  const normalizedTheme = normalizeTheme(theme);

  if (!normalizedTheme) {
    return null;
  }

  return CHARACTERS[normalizedTheme];
}

/* =========================================================
   VALIDAÇÃO PÚBLICA
   ========================================================= */

export function isValidTheme(theme) {
  return normalizeTheme(theme) !== null;
}

/* =========================================================
   LISTAGEM
   ========================================================= */

export function getAvailableThemes() {
  return [...VALID_THEMES];
}

export function getAvailableCharacters() {
  return Object.values(CHARACTERS);
}

/* =========================================================
   EXPORTS
   ========================================================= */

export { THEMES, CHARACTERS };