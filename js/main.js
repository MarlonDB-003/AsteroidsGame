/* ===========================================================
   main.js — ponto de entrada. Espera o DOM, cria o jogo e roda.
   =========================================================== */

(() => {
  function boot() {
    const canvas = document.getElementById('game');
    if (!canvas) { console.error('Canvas #game não encontrado.'); return; }
    const game = new SI.Game(canvas);
    game.start();
    // exposto pra debugar no console do navegador, se quiser:
    window.__game = game;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
