/* ===========================================================
   config.js — todas as constantes do jogo em um só lugar.
   Mexa aqui pra balancear dificuldade sem caçar números no código.
   =========================================================== */

window.SI = window.SI || {};

SI.CONFIG = {
  // Tela (resolução interna do canvas; o CSS escala pra caber)
  WIDTH: 280,
  HEIGHT: 200,

  // Paleta LCD do Nokia
  COLORS: {
    bg:      '#9bbc0f',
    light:   '#8bac0f',
    dark:    '#306230',
    darkest: '#0f380f',
  },

  PLAYER: {
    w: 14, h: 9,
    speed: 2.2,
    fireCooldown: 9,   // frames entre tiros
    bulletSpeed: 4.2,
    invincibleFrames: 90, // tempo piscando após levar dano
    startLives: 3,
    maxX: 0.55,        // limite horizontal (fração da largura)
  },

  ENEMY: {
    types: [
      // grunt — voa reto
      { w: 12, h: 10, hp: 1, spd: 1.0, score: 10, move: 'straight', shoot: 0 },
      // waver — sobe e desce em onda
      { w: 12, h: 10, hp: 1, spd: 1.2, score: 15, move: 'wave',     shoot: 0 },
      // shooter — atira de volta
      { w: 14, h: 12, hp: 2, spd: 0.8, score: 25, move: 'straight', shoot: 90 },
    ],
    bulletSpeed: 2.6,
    speedPerWave: 0.08,   // inimigos aceleram a cada fase
  },

  BOSS: {
    w: 30, h: 46,
    baseHp: 30,
    hpPerWave: 5,
    vy: 1.0,
    shootInterval: 70,
    bulletSpeed: 3.0,
    score: 150,
    triggerScore: 200,    // pontos (× fase) pra invocar o chefão
  },

  WAVES_TO_WIN: 5,
  STAR_COUNT: 30,

  AUDIO: { enabled: true, volume: 0.25 },

  STORAGE_KEY: 'spaceimpact.highscore',
};
