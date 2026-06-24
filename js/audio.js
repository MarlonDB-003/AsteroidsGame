/* ===========================================================
   audio.js — efeitos sonoros estilo "bip" do Nokia, gerados
   na hora com a Web Audio API (sem arquivos .mp3/.wav).
   =========================================================== */

window.SI = window.SI || {};

SI.Audio = class {
  constructor() {
    this.ctx = null;
    this.enabled = SI.CONFIG.AUDIO.enabled;
    this.volume = SI.CONFIG.AUDIO.volume;
  }

  // O navegador só libera áudio após uma interação do usuário,
  // então criamos o contexto preguiçosamente no primeiro som.
  _ensure() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) this.ctx = new AC();
    }
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
    return this.ctx;
  }

  // Toca uma nota quadrada simples (cara de console 8-bit).
  _beep({ freq = 440, dur = 0.08, type = 'square', vol = 1, slideTo = null }) {
    if (!this.enabled) return;
    const ctx = this._ensure();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const t = ctx.currentTime;

    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t + dur);

    gain.gain.setValueAtTime(this.volume * vol, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);

    osc.connect(gain).connect(ctx.destination);
    osc.start(t);
    osc.stop(t + dur);
  }

  shoot()    { this._beep({ freq: 880, slideTo: 440, dur: 0.06, vol: 0.5 }); }
  hit()      { this._beep({ freq: 220, slideTo: 110, dur: 0.10, type: 'sawtooth' }); }
  explosion(){ this._beep({ freq: 140, slideTo: 40,  dur: 0.22, type: 'sawtooth', vol: 1.2 }); }
  damage()   { this._beep({ freq: 300, slideTo: 80,  dur: 0.30, type: 'square', vol: 1.2 }); }
  wave()     { this._beep({ freq: 523, slideTo: 1046, dur: 0.18, vol: 0.9 }); }
  select()   { this._beep({ freq: 660, dur: 0.05, vol: 0.6 }); }

  toggle() { this.enabled = !this.enabled; return this.enabled; }
};
