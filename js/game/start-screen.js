/* =========================================================
   NYVOLT — START SCREEN
   ========================================================= */

import { setTheme } from "./theme.js";

/* =========================================================
   MODOS
   ========================================================= */

const VALID_MODES = new Set(["classic", "no-wall"]);

/* =========================================================
   CONTROLLER
   ========================================================= */

export function createStartScreen({ element, soundController, onStart }) {
  if (!element) {
    throw new Error("NYVOLT — start screen não encontrada.");
  }

  /* =========================================================
     DOM
     ========================================================= */

  const playButton = element.querySelector("#start-play");

  const characterStep = element.querySelector("#character-step");

  const modeStep = element.querySelector("#mode-step");

  const characterButtons = [...element.querySelectorAll("[data-character]")];

  const modeButtons = [...element.querySelectorAll("[data-mode]")];

  /* =========================================================
     ESTADO
     ========================================================= */

  let selectedCharacter = null;

  let selectedMode = null;

  /* =========================================================
     SOM
     ========================================================= */

  function playMenuSound() {
    soundController?.play("menu");
  }

  /* =========================================================
     SELEÇÃO
     ========================================================= */

  function selectOnly(buttons, selectedButton) {
    buttons.forEach((button) => {
      button.setAttribute("aria-pressed", String(button === selectedButton));
    });
  }

  /* =========================================================
     RESET
     ========================================================= */

  function reset() {
    selectedCharacter = null;
    selectedMode = null;

    characterButtons.forEach((button) => {
      button.setAttribute("aria-pressed", "false");
    });

    modeButtons.forEach((button) => {
      button.setAttribute("aria-pressed", "false");
    });

    playButton.hidden = false;
    characterStep.hidden = true;
    modeStep.hidden = true;

    element.removeAttribute("data-step");
  }

  /* =========================================================
     PERSONAGENS
     ========================================================= */

  function revealCharacters() {
    playMenuSound();

    playButton.hidden = true;
    characterStep.hidden = false;
    modeStep.hidden = true;

    element.dataset.step = "character";
  }

  /* =========================================================
     PERSONAGEM
     ========================================================= */

  function selectCharacter(button) {
    const character = button.dataset.character;

    const themeApplied = setTheme(character);

    if (!themeApplied) {
      return;
    }

    selectedCharacter = character;

    selectOnly(characterButtons, button);

    playMenuSound();

    characterStep.hidden = true;
    modeStep.hidden = false;

    element.dataset.step = "mode";
  }

  /* =========================================================
     MODO
     ========================================================= */

  function selectMode(button) {
    const mode = button.dataset.mode;

    if (!VALID_MODES.has(mode)) {
      return;
    }

    selectedMode = mode;

    selectOnly(modeButtons, button);

    playMenuSound();

    onStart?.({
      character: selectedCharacter,
      mode: selectedMode,
    });
  }

  /* =========================================================
     EVENTOS
     ========================================================= */

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

  /* =========================================================
     API
     ========================================================= */

  return {
    reset,

    getSelection() {
      return {
        character: selectedCharacter,

        mode: selectedMode,
      };
    },
  };
}