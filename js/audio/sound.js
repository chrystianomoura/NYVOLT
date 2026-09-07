/* =========================================================
   JARAKA — SOUND SYSTEM
   Sistema sonoro sintetizado com Web Audio API

   Sons:
   - turn
   - menu
   - eat
   - hit
   - restart
   - exit
   - gameOver
   ========================================================= */

/* =========================================================
   CONFIGURAÇÃO GERAL
   ========================================================= */

const MASTER_VOLUME = 0.34;

const DEFAULT_ATTACK = 0.004;

const DEFAULT_RELEASE = 0.08;

/* =========================================================
   PALETA MUSICAL

   Base pentatônica menor:

   A
   C
   D
   E
   G

   Todos os efeitos utilizam a mesma família tonal para
   manter uma identidade sonora consistente.
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
   ESTADO INTERNO
   ========================================================= */

let audioContext = null;

let masterGain = null;

let isMuted = false;

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
   ENVELOPE DE VOLUME
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
   TOM SIMPLES
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
    return;
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
    return;
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
    return;
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
}

/* =========================================================
   TURN

   Micro efeito curto usado quando a cobra realmente
   executa uma mudança de direção.
   ========================================================= */

function playTurnSound(context) {
  const now = context.currentTime;

  playTone({
    context,
    frequency: NOTES.E5,
    startTime: now,
    duration: 0.045,
    type: "triangle",
    volume: 0.13,
    attack: 0.002,
    release: 0.035,
  });

  playTone({
    context,
    frequency: NOTES.A5,
    startTime: now,
    duration: 0.028,
    type: "square",
    volume: 0.035,
    attack: 0.001,
    release: 0.02,
  });
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

   Pequena assinatura ascendente de recompensa.
   ========================================================= */

function playEatSound(context) {
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
   HIT

   Impacto da cobra contra parede ou contra o próprio corpo.

   Características:
   - curto;
   - grave;
   - seco;
   - eletrônico;
   - sem explosão;
   - sem prolongamento.

   Funciona como ponto inicial da sequência de morte.
   ========================================================= */

function playHitSound(context) {
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

   Pequena frase ascendente.
   ========================================================= */

function playRestartSound(context) {
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

   Frase descendente relacionada ao RESTART.
   ========================================================= */

function playExitSound(context) {
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

   Lamento eletrônico após a colisão.

   Não possui impacto próprio porque o efeito HIT já
   representa o choque.

   A sequência apenas lamenta a derrota.
   ========================================================= */

function playGameOverSound(context) {
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
   MAPA DE EFEITOS
   ========================================================= */

const SOUND_PLAYERS = Object.freeze({
  turn: playTurnSound,
  menu: playMenuSound,
  eat: playEatSound,
  hit: playHitSound,
  restart: playRestartSound,
  exit: playExitSound,
  gameOver: playGameOverSound,
});

/* =========================================================
   CONTROLLER
   ========================================================= */

export function createSoundController() {
  /* =======================================================
     PLAY
     ======================================================= */

  async function play(soundName) {
    if (isMuted) {
      return;
    }

    const soundPlayer = SOUND_PLAYERS[soundName];

    if (!soundPlayer) {
      return;
    }

    const context = await ensureAudioReady();

    if (!context) {
      return;
    }

    soundPlayer(context);
  }

  /* =======================================================
     MUTE
     ======================================================= */

  function mute() {
    isMuted = true;

    if (!masterGain) {
      return;
    }

    masterGain.gain.setValueAtTime(0, audioContext.currentTime);
  }

  /* =======================================================
     UNMUTE
     ======================================================= */

  function unmute() {
    isMuted = false;

    if (!masterGain) {
      return;
    }

    masterGain.gain.setValueAtTime(MASTER_VOLUME, audioContext.currentTime);
  }

  /* =======================================================
     TOGGLE MUTE
     ======================================================= */

  function toggleMute() {
    if (isMuted) {
      unmute();
    } else {
      mute();
    }

    return isMuted;
  }

  /* =======================================================
     ESTADO
     ======================================================= */

  function getMuted() {
    return isMuted;
  }

  /* =======================================================
     API
     ======================================================= */

  return {
    play,
    mute,
    unmute,
    toggleMute,
    getMuted,
  };
}
