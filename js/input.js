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
    // analógico virtual do D-pad: vetor de -1 a 1 em cada eixo
    this.stick = { active: false, dx: 0, dy: 0 };
    this._stickId = null;
    this._onPress = null; // callback p/ teclas "de ação" (Enter, P, M)

    this._bindKeyboard();
    this._bindTouch();
    this._bindButtons();
    this._bindJoystick();
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
      const isArrow = key.startsWith('Arrow');
      const press = e => {
        e.preventDefault();
        this.keys[key] = true;
        this._fireAction(key);
      };
      const release = e => { e.preventDefault(); this.keys[key] = false; };

      // No toque, as setas viram analógico (ver _bindJoystick); só OK/FOGO
      // continuam como botões. No desktop (mouse), tudo funciona como botão.
      if (!isArrow) {
        btn.addEventListener('touchstart', press, { passive: false });
        btn.addEventListener('touchend', release, { passive: false });
      }
      btn.addEventListener('mousedown', press);
      btn.addEventListener('mouseup', release);
      btn.addEventListener('mouseleave', release);
    });
  }

  // Analógico virtual: o D-pad inteiro vira um "stick". A direção e a
  // intensidade vêm do deslocamento do dedo em relação ao centro do D-pad.
  _bindJoystick() {
    const dpad = document.querySelector('.dpad');
    if (!dpad) return;

    const DEAD_ZONE = 0.15; // ignora micro-movimentos perto do centro
    const setVec = touch => {
      const r = dpad.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      const radius = r.width / 2;
      let dx = (touch.clientX - cx) / radius;
      let dy = (touch.clientY - cy) / radius;
      const m = Math.hypot(dx, dy);
      if (m > 1) { dx /= m; dy /= m; }         // limita ao círculo unitário
      if (Math.hypot(dx, dy) < DEAD_ZONE) { dx = 0; dy = 0; }
      this.stick.dx = dx; this.stick.dy = dy;
    };

    dpad.addEventListener('touchstart', e => {
      e.preventDefault();
      const t = e.changedTouches[0];
      this._stickId = t.identifier;
      this.stick.active = true;
      setVec(t);
    }, { passive: false });

    dpad.addEventListener('touchmove', e => {
      e.preventDefault();
      for (const t of e.changedTouches) {
        if (t.identifier === this._stickId) { setVec(t); break; }
      }
    }, { passive: false });

    const end = e => {
      for (const t of e.changedTouches) {
        if (t.identifier === this._stickId) {
          e.preventDefault();
          this.stick.active = false;
          this.stick.dx = this.stick.dy = 0;
          this._stickId = null;
          break;
        }
      }
    };
    dpad.addEventListener('touchend', end, { passive: false });
    dpad.addEventListener('touchcancel', end, { passive: false });
  }
};
