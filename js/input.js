/* ===========================================================
   input.js — teclado, toque e botões na tela em uma só camada.
   Expõe um mapa `keys` e um alvo de toque `pointer`.
   =========================================================== */

window.SI = window.SI || {};

SI.Input = class {
  constructor(canvas) {
    this.canvas = canvas;
    this.keys = {};
    this.pointer = { active: false, x: null, y: null };
    this._onPress = null; // callback p/ teclas "de ação" (Enter, P, M)

    this._bindKeyboard();
    this._bindTouch();
    this._bindButtons();
  }

  // Registra um callback chamado quando uma tecla de ação é pressionada.
  onPress(cb) { this._onPress = cb; }

  _fireAction(key) { if (this._onPress) this._onPress(key); }

  _bindKeyboard() {
    const PREVENT = [' ', 'Spacebar', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];
    window.addEventListener('keydown', e => {
      if (e.repeat) { if (PREVENT.includes(e.key)) e.preventDefault(); return; }
      this.keys[e.key] = true;
      if (PREVENT.includes(e.key)) e.preventDefault();
      this._fireAction(e.key);
    });
    window.addEventListener('keyup', e => { this.keys[e.key] = false; });
  }

  _canvasPos(touch) {
    const r = this.canvas.getBoundingClientRect();
    return {
      x: (touch.clientX - r.left) * (SI.CONFIG.WIDTH / r.width),
      y: (touch.clientY - r.top) * (SI.CONFIG.HEIGHT / r.height),
    };
  }

  _bindTouch() {
    const c = this.canvas;
    c.addEventListener('touchstart', e => {
      e.preventDefault();
      const p = this._canvasPos(e.touches[0]);
      this.pointer.active = true;
      this.pointer.x = p.x; this.pointer.y = p.y;
      this.keys[' '] = true;          // tocar na tela = mover + atirar
      this._fireAction('Enter');      // e também serve de "começar"
    }, { passive: false });

    c.addEventListener('touchmove', e => {
      e.preventDefault();
      const p = this._canvasPos(e.touches[0]);
      this.pointer.x = p.x; this.pointer.y = p.y;
    }, { passive: false });

    const end = e => {
      e.preventDefault();
      this.pointer.active = false;
      this.pointer.x = this.pointer.y = null;
      this.keys[' '] = false;
    };
    c.addEventListener('touchend', end, { passive: false });
    c.addEventListener('touchcancel', end, { passive: false });
  }

  // Botões em HTML (D-pad + FOGO). Funcionam com toque e mouse.
  _bindButtons() {
    document.querySelectorAll('.key[data-key]').forEach(btn => {
      const key = btn.getAttribute('data-key');
      const press = e => {
        e.preventDefault();
        this.keys[key] = true;
        this._fireAction(key);
      };
      const release = e => { e.preventDefault(); this.keys[key] = false; };

      btn.addEventListener('touchstart', press, { passive: false });
      btn.addEventListener('touchend', release, { passive: false });
      btn.addEventListener('mousedown', press);
      btn.addEventListener('mouseup', release);
      btn.addEventListener('mouseleave', release);
    });
  }
};
