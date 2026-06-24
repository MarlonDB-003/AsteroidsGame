/* ===========================================================
   utils.js — funções auxiliares puras (sem estado de jogo).
   =========================================================== */

window.SI = window.SI || {};

SI.utils = {
  clamp(v, min, max) {
    return v < min ? min : v > max ? max : v;
  },

  rand(min, max) {
    return min + Math.random() * (max - min);
  },

  randInt(min, max) {
    return Math.floor(SI.utils.rand(min, max + 1));
  },

  pick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  },

  // Colisão de caixas centradas (AABB). a e b têm {x, y, w, h}.
  aabb(a, b, pad = 0) {
    return Math.abs(a.x - b.x) < (a.w / 2 + b.w / 2 - pad) &&
           Math.abs(a.y - b.y) < (a.h / 2 + b.h / 2 - pad);
  },

  // Persistência simples do recorde (tolerante a navegador sem localStorage)
  loadHighScore() {
    try { return parseInt(localStorage.getItem(SI.CONFIG.STORAGE_KEY), 10) || 0; }
    catch (e) { return 0; }
  },

  saveHighScore(score) {
    try { localStorage.setItem(SI.CONFIG.STORAGE_KEY, String(score)); }
    catch (e) { /* modo privado / bloqueado — ignora */ }
  },
};
