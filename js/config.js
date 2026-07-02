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
    stickSpeedMult: 1.3, // velocidade do analógico do celular (× speed); >1 = mais ágil
    fireCooldown: 9,   // frames entre tiros
    bulletSpeed: 4.2,
    invincibleFrames: 90, // tempo piscando após levar dano
    startLives: 3,
    maxX: 0.55,        // limite horizontal (fração da largura)
  },

  ENEMY: {
    // 'sprite' escolhe o desenho; 'move' o padrão; 'minWave' a fase em que começa a aparecer.
    types: [
      // grunt — voa reto
      { w: 12, h: 10, hp: 1, spd: 1.0, score: 10, move: 'straight', shoot: 0,   sprite: 'grunt',   minWave: 1 },
      // waver — sobe e desce em onda
      { w: 12, h: 10, hp: 1, spd: 1.2, score: 15, move: 'wave',     shoot: 0,   sprite: 'waver',   minWave: 1 },
      // shooter — atira de volta
      { w: 14, h: 12, hp: 2, spd: 0.8, score: 25, move: 'straight', shoot: 90,  sprite: 'shooter', minWave: 2 },
      // diver — desce e sobe em ziguezague largo e rápido
      { w: 12, h: 11, hp: 2, spd: 1.5, score: 30, move: 'dive',     shoot: 0,   sprite: 'diver',   minWave: 2 },
      // zigzag — pequeno e ágil, corta a tela em ângulo fechado
      { w: 11, h: 10, hp: 1, spd: 1.6, score: 25, move: 'zigzag',   shoot: 0,   sprite: 'zigzag',  minWave: 3 },
      // hunter — persegue a altura do player e atira
      { w: 14, h: 12, hp: 3, spd: 0.9, score: 40, move: 'chase',    shoot: 120, sprite: 'hunter',  minWave: 4 },
    ],
    bulletSpeed: 2.6,
    speedPerWave: 0.08,   // inimigos aceleram a cada fase
  },

  // Constantes compartilhadas por todos os chefes.
  BOSS: {
    hpPerWave: 3,         // vida extra por fase (dificuldade progressiva)
    triggerScore: 350,    // pontos (× fase) pra invocar o chefão
  },

  // Um chefe distinto por fase: sprite, movimento, vida e padrão de tiro próprios.
  // pattern: spread3 | aimed | burst | spread5 | altern
  BOSSES: [
    { name: 'SENTINELA',   sprite: 'sentinel', w: 30, h: 46, hp: 28, vy: 1.0, pattern: 'spread3', shootInterval: 70, bulletSpeed: 3.0, score: 150 },
    { name: 'SERPENTE',    sprite: 'serpent',  w: 26, h: 40, hp: 40, vy: 1.9, pattern: 'aimed',   shootInterval: 52, bulletSpeed: 3.2, score: 190 },
    { name: 'TORRE GEMEA', sprite: 'twin',     w: 34, h: 52, hp: 56, vy: 0.8, pattern: 'burst',   shootInterval: 84, bulletSpeed: 3.0, score: 230 },
    { name: 'ENXAME',      sprite: 'swarm',    w: 32, h: 48, hp: 72, vy: 1.3, pattern: 'spread5', shootInterval: 78, bulletSpeed: 2.8, score: 280 },
    { name: 'NUCLEO',      sprite: 'core',     w: 38, h: 58, hp: 96, vy: 1.4, pattern: 'altern',  shootInterval: 48, bulletSpeed: 3.3, score: 420 },
  ],

  WAVES_TO_WIN: 5,
  STAR_COUNT: 30,

  AUDIO: { enabled: true, volume: 0.25 },

  STORAGE_KEY: 'spaceimpact.highscore',
};
