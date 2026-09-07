/* =========================================================
   JARAKA — START SCREEN
   Fluxo de configuração da partida

   Etapas:
   1. entrada;
   2. personagem;
   3. modo;
   4. gameplay.
   ========================================================= */

import { setTheme } from "./theme.js";

/* =========================================================
   MODOS
   ========================================================= */

const VALID_MODES = new Set(["classic", "no-wall"]);

/* =========================================================
   FACTORY
   ========================================================= */

export function createStartScreen({ element, onStart }) {
  if (!element) {
    throw new Error("JARAKA — start screen não encontrada.");
  }

  /* =======================================================
     DOM
     ======================================================= */

  const playButton = element.querySelector("#start-play");

  const characterStep = element.querySelector("#character-step");

  const modeStep = element.querySelector("#mode-step");

  const characterButtons = [...element.querySelectorAll("[data-character]")];

  const modeButtons = [...element.querySelectorAll("[data-mode]")];

  /* =======================================================
     ESTADO
     ======================================================= */

  let selectedCharacter = null;

  let selectedMode = null;

  /* =======================================================
     SELEÇÃO EXCLUSIVA
     ======================================================= */

  function selectOnly(buttons, selectedButton) {
    buttons.forEach((button) => {
      button.setAttribute("aria-pressed", String(button === selectedButton));
    });
  }

  /* =======================================================
     ETAPA 1 → PERSONAGENS
     ======================================================= */

  function revealCharacters() {
    playButton.hidden = true;

    characterStep.hidden = false;

    modeStep.hidden = true;

    element.dataset.step = "character";
  }

  /* =======================================================
     ETAPA 2 → MODO
     ======================================================= */

  function selectCharacter(button) {
    const character = button.dataset.character;

    const themeApplied = setTheme(character);

    if (!themeApplied) {
      return;
    }

    selectedCharacter = character;

    selectOnly(characterButtons, button);

    characterStep.hidden = true;

    modeStep.hidden = false;

    element.dataset.step = "mode";
  }

  /* =======================================================
     ETAPA 3 → GAMEPLAY
     ======================================================= */

  function selectMode(button) {
    const mode = button.dataset.mode;

    if (!VALID_MODES.has(mode)) {
      return;
    }

    selectedMode = mode;

    selectOnly(modeButtons, button);

    onStart?.({
      character: selectedCharacter,

      mode: selectedMode,
    });
  }

  /* =======================================================
     EVENTOS
     ======================================================= */

  playButton.addEventListener("click", revealCharacters);

  characterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      selectCharacter(button);
    });
  });

  modeButtons.forEach((button) => {
    button.addEventListener("click", () => {
      selectMode(button);
    });
  });

  /* =======================================================
     API
     ======================================================= */

  return {
    getSelection() {
      return {
        character: selectedCharacter,

        mode: selectedMode,
      };
    },
  };
}