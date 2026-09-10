/* =========================================================
   NYVOLT — SOUND SYSTEM
   ========================================================= */

/* =========================================================
   CONFIGURAÇÃO
   ========================================================= */

const MASTER_VOLUME = 0.34;

const DEFAULT_ATTACK = 0.004;
const DEFAULT_RELEASE = 0.08;

/* =========================================================
   PALETA MUSICAL
   ========================================================= */

const NOTES = Object.freeze({
  A2: 110.0,
  C3: 130.81,
  D3: 146.83,
  E3: 164.81,
  G3: 196.0,

  A3: 220.0,
  C4: 261.63,
  D4: 293.66,
  E4: 329.63,
  G4: 392.0,

  A4: 440.0,
  C5: 523.25,
  D5: 587.33,
  E5: 659.25,
  G5: 783.99,

  A5: 880.0,
});

/* =========================================================
   ESTADO
   ========================================================= */

let audioContext = null;
let masterGain = null;
let isMuted = false;

const activeTurnSources = new Set();

/* =========================================================
   AUDIO CONTEXT
   ========================================================= */

function getAudioContext() {
  if (audioContext) {
    return audioContext;
  }

  const AudioContextClass = window.AudioContext || window.webkitAudioContext;

  if (!AudioContextClass) {
    return null;
  }

  audioContext = new AudioContextClass();

  masterGain = audioContext.createGain();
  masterGain.gain.value = isMuted ? 0 : MASTER_VOLUME;
  masterGain.connect(audioContext.destination);

  return audioContext;
}

/* =========================================================
   DESBLOQUEIO
   ========================================================= */

async function ensureAudioReady() {
  const context = getAudioContext();

  if (!context) {
    return null;
  }

  if (context.state === "suspended") {
    try {
      await context.resume();
    } catch {
      return null;
    }
  }

  return context;
}

/* =========================================================
   ENVELOPE
   ========================================================= */

function createGainEnvelope({
  context,
  startTime,
  duration,
  volume,
  attack = DEFAULT_ATTACK,
  release = DEFAULT_RELEASE,
}) {
  const gain = context.createGain();

  const safeAttack = Math.min(attack, duration * 0.45);

  const releaseStart = Math.max(
    startTime + safeAttack,
    startTime + duration - release,
  );

  gain.gain.setValueAtTime(0.0001, startTime);

  gain.gain.exponentialRampToValueAtTime(
    Math.max(0.0001, volume),
    startTime + safeAttack,
  );

  gain.gain.setValueAtTime(Math.max(0.0001, volume), releaseStart);

  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

  gain.connect(masterGain);

  return gain;
}

/* =========================================================
   TOM
   ========================================================= */

function playTone({
  context,
  frequency,
  startTime,
  duration,
  type = "triangle",
  volume = 0.25,
  attack,
  release,
  detune = 0,
}) {
  if (!context) {
    return null;
  }

  const oscillator = context.createOscillator();

  oscillator.type = type;

  oscillator.frequency.setValueAtTime(frequency, startTime);

  oscillator.detune.setValueAtTime(detune, startTime);

  const gain = createGainEnvelope({
    context,
    startTime,
    duration,
    volume,
    attack,
    release,
  });

  oscillator.connect(gain);

  oscillator.start(startTime);
  oscillator.stop(startTime + duration + 0.02);

  return oscillator;
}

/* =========================================================
   SWEEP
   ========================================================= */

function playSweep({
  context,
  startFrequency,
  endFrequency,
  startTime,
  duration,
  type = "triangle",
  volume = 0.25,
  attack,
  release,
}) {
  if (!context) {
    return null;
  }

  const oscillator = context.createOscillator();

  oscillator.type = type;

  oscillator.frequency.setValueAtTime(startFrequency, startTime);

  oscillator.frequency.exponentialRampToValueAtTime(
    Math.max(1, endFrequency),
    startTime + duration,
  );

  const gain = createGainEnvelope({
    context,
    startTime,
    duration,
    volume,
    attack,
    release,
  });

  oscillator.connect(gain);

  oscillator.start(startTime);
  oscillator.stop(startTime + duration + 0.02);

  return oscillator;
}

/* =========================================================
   RUÍDO
   ========================================================= */

function playNoise({
  context,
  startTime,
  duration,
  volume = 0.05,
  highpass = 1200,
}) {
  if (!context) {
    return null;
  }

  const frameCount = Math.max(1, Math.floor(context.sampleRate * duration));

  const buffer = context.createBuffer(1, frameCount, context.sampleRate);

  const channel = buffer.getChannelData(0);

  for (let index = 0; index < frameCount; index += 1) {
    channel[index] = Math.random() * 2 - 1;
  }

  const source = context.createBufferSource();

  source.buffer = buffer;

  const filter = context.createBiquadFilter();

  filter.type = "highpass";
  filter.frequency.setValueAtTime(highpass, startTime);

  const gain = createGainEnvelope({
    context,
    startTime,
    duration,
    volume,
    attack: 0.002,
    release: duration * 0.8,
  });

  source.connect(filter);
  filter.connect(gain);

  source.start(startTime);
  source.stop(startTime + duration + 0.02);

  return source;
}

/* =========================================================
   TURN — FONTES
   ========================================================= */

function removeTurnSource(source) {
  activeTurnSources.delete(source);
}

function registerTurnSource(source) {
  if (!source) {
    return;
  }

  activeTurnSources.add(source);

  source.addEventListener(
    "ended",
    () => {
      removeTurnSource(source);
    },
    {
      once: true,
    },
  );
}

function stopActiveTurn() {
  if (activeTurnSources.size === 0) {
    return;
  }

  for (const source of activeTurnSources) {
    try {
      source.stop();
    } catch {
      continue;
    }
  }

  activeTurnSources.clear();
}

/* =========================================================
   TURN
   ========================================================= */

function playTurnSound(context) {
  stopActiveTurn();

  const now = context.currentTime;

  const primaryTone = playTone({
    context,
    frequency: NOTES.E5,
    startTime: now,
    duration: 0.045,
    type: "triangle",
    volume: 0.13,
    attack: 0.002,
    release: 0.035,
  });

  const accentTone = playTone({
    context,
    frequency: NOTES.A5,
    startTime: now,
    duration: 0.028,
    type: "square",
    volume: 0.035,
    attack: 0.001,
    release: 0.02,
  });

  registerTurnSource(primaryTone);
  registerTurnSource(accentTone);
}

/* =========================================================
   MENU
   ========================================================= */

function playMenuSound(context) {
  const now = context.currentTime;

  playTone({
    context,
    frequency: NOTES.C5,
    startTime: now,
    duration: 0.075,
    type: "triangle",
    volume: 0.17,
    attack: 0.003,
    release: 0.05,
  });

  playTone({
    context,
    frequency: NOTES.E5,
    startTime: now + 0.035,
    duration: 0.075,
    type: "triangle",
    volume: 0.14,
    attack: 0.003,
    release: 0.05,
  });
}

/* =========================================================
   EAT
   ========================================================= */

function playEatSound(context) {
  stopActiveTurn();

  const now = context.currentTime;

  playSweep({
    context,
    startFrequency: NOTES.A4,
    endFrequency: NOTES.E5,
    startTime: now,
    duration: 0.09,
    type: "triangle",
    volume: 0.21,
    attack: 0.002,
    release: 0.055,
  });

  playTone({
    context,
    frequency: NOTES.G5,
    startTime: now + 0.065,
    duration: 0.085,
    type: "triangle",
    volume: 0.14,
    attack: 0.002,
    release: 0.06,
  });

  playNoise({
    context,
    startTime: now,
    duration: 0.045,
    volume: 0.018,
    highpass: 2600,
  });
}

/* =========================================================
   HIGH SCORE
   ========================================================= */

function playHighScoreSound(context) {
  stopActiveTurn();

  const now = context.currentTime;

  const sequence = [
    {
      frequency: NOTES.A4,
      offset: 0,
      volume: 0.16,
    },
    {
      frequency: NOTES.C5,
      offset: 0.07,
      volume: 0.17,
    },
    {
      frequency: NOTES.E5,
      offset: 0.14,
      volume: 0.18,
    },
    {
      frequency: NOTES.A5,
      offset: 0.22,
      volume: 0.21,
    },
  ];

  for (const note of sequence) {
    playTone({
      context,
      frequency: note.frequency,
      startTime: now + note.offset,
      duration: 0.14,
      type: "triangle",
      volume: note.volume,
      attack: 0.003,
      release: 0.1,
    });
  }

  playTone({
    context,
    frequency: NOTES.A5,
    startTime: now + 0.23,
    duration: 0.2,
    type: "sine",
    volume: 0.1,
    attack: 0.006,
    release: 0.16,
    detune: 7,
  });

  playNoise({
    context,
    startTime: now + 0.2,
    duration: 0.08,
    volume: 0.012,
    highpass: 3200,
  });
}

/* =========================================================
   HIT
   ========================================================= */

function playHitSound(context) {
  stopActiveTurn();

  const now = context.currentTime;

  playSweep({
    context,
    startFrequency: NOTES.C4,
    endFrequency: NOTES.A2,
    startTime: now,
    duration: 0.07,
    type: "triangle",
    volume: 0.24,
    attack: 0.002,
    release: 0.05,
  });

  playTone({
    context,
    frequency: NOTES.A2,
    startTime: now,
    duration: 0.045,
    type: "square",
    volume: 0.05,
    attack: 0.001,
    release: 0.03,
  });
}

/* =========================================================
   RESTART
   ========================================================= */

function playRestartSound(context) {
  stopActiveTurn();

  const now = context.currentTime;

  const sequence = [
    {
      frequency: NOTES.A3,
      offset: 0,
    },
    {
      frequency: NOTES.C4,
      offset: 0.065,
    },
    {
      frequency: NOTES.E4,
      offset: 0.13,
    },
    {
      frequency: NOTES.A4,
      offset: 0.195,
    },
  ];

  for (const note of sequence) {
    playTone({
      context,
      frequency: note.frequency,
      startTime: now + note.offset,
      duration: 0.105,
      type: "triangle",
      volume: 0.18,
      attack: 0.003,
      release: 0.075,
    });
  }

  playTone({
    context,
    frequency: NOTES.E5,
    startTime: now + 0.205,
    duration: 0.09,
    type: "square",
    volume: 0.035,
    attack: 0.002,
    release: 0.07,
  });
}

/* =========================================================
   EXIT
   ========================================================= */

function playExitSound(context) {
  stopActiveTurn();

  const now = context.currentTime;

  const sequence = [
    {
      frequency: NOTES.A4,
      offset: 0,
    },
    {
      frequency: NOTES.E4,
      offset: 0.06,
    },
    {
      frequency: NOTES.C4,
      offset: 0.12,
    },
    {
      frequency: NOTES.A3,
      offset: 0.18,
    },
  ];

  for (const note of sequence) {
    playTone({
      context,
      frequency: note.frequency,
      startTime: now + note.offset,
      duration: 0.095,
      type: "triangle",
      volume: 0.16,
      attack: 0.003,
      release: 0.07,
    });
  }
}

/* =========================================================
   GAME OVER
   ========================================================= */

function playGameOverSound(context) {
  stopActiveTurn();

  const now = context.currentTime;

  playTone({
    context,
    frequency: NOTES.E4,
    startTime: now,
    duration: 0.22,
    type: "triangle",
    volume: 0.18,
    attack: 0.008,
    release: 0.15,
  });

  playTone({
    context,
    frequency: NOTES.D4,
    startTime: now + 0.16,
    duration: 0.24,
    type: "triangle",
    volume: 0.18,
    attack: 0.008,
    release: 0.17,
  });

  playTone({
    context,
    frequency: NOTES.C4,
    startTime: now + 0.34,
    duration: 0.28,
    type: "triangle",
    volume: 0.19,
    attack: 0.008,
    release: 0.2,
  });

  playTone({
    context,
    frequency: NOTES.A3,
    startTime: now + 0.55,
    duration: 0.52,
    type: "triangle",
    volume: 0.2,
    attack: 0.01,
    release: 0.4,
  });
}

/* =========================================================
   EFEITOS
   ========================================================= */

const SOUND_PLAYERS = Object.freeze({
  turn: playTurnSound,
  menu: playMenuSound,
  eat: playEatSound,
  highScore: playHighScoreSound,
  hit: playHitSound,
  restart: playRestartSound,
  exit: playExitSound,
  gameOver: playGameOverSound,
});

/* =========================================================
   CONTROLLER
   ========================================================= */

export function createSoundController() {
  function executeSound(soundName, context) {
    if (!context || context.state !== "running") {
      return false;
    }

    const soundPlayer = SOUND_PLAYERS[soundName];

    if (!soundPlayer) {
      return false;
    }

    soundPlayer(context);

    return true;
  }

  async function playAfterReady(soundName) {
    const context = await ensureAudioReady();

    if (!context || isMuted) {
      return;
    }

    executeSound(soundName, context);
  }

  function play(soundName) {
    if (isMuted) {
      return;
    }

    if (!SOUND_PLAYERS[soundName]) {
      return;
    }

    if (audioContext && audioContext.state === "running") {
      executeSound(soundName, audioContext);

      return;
    }

    void playAfterReady(soundName);
  }

  function mute() {
    isMuted = true;

    stopActiveTurn();

    if (!masterGain) {
      return;
    }

    masterGain.gain.setValueAtTime(0, audioContext.currentTime);
  }

  function unmute() {
    isMuted = false;

    if (!masterGain) {
      return;
    }

    masterGain.gain.setValueAtTime(MASTER_VOLUME, audioContext.currentTime);
  }

  function toggleMute() {
    if (isMuted) {
      unmute();
    } else {
      mute();
    }

    return isMuted;
  }

  function getMuted() {
    return isMuted;
  }

  return {
    play,
    mute,
    unmute,
    toggleMute,
    getMuted,
  };
}