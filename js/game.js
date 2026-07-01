/* ===========================================================
   game.js — orquestra tudo: estados (menu/jogo/pausa/fim),
   loop de atualização, colisões, telas e efeitos (tremor, flash).
   =========================================================== */

window.SI = window.SI || {};

SI.STATE = { MENU: 'menu', PLAY: 'play', PAUSE: 'pause', OVER: 'over', WIN: 'win' };

SI.Game = class {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.W = SI.CONFIG.WIDTH;
    this.H = SI.CONFIG.HEIGHT;

    this.audio = new SI.Audio();
    this.input = new SI.Input(canvas);
    this.stars = new SI.StarField();
    this.highScore = SI.utils.loadHighScore();

    this.state = SI.STATE.MENU;
    this.frame = 0;
    this.shake = 0;
    this.flash = 0;

    this.input.onPress(key => this._handlePress(key));
    this._resetRun();
  }

  // Zera tudo pra uma nova partida.
  _resetRun() {
    this.player = new SI.Player();
    this.bullets = [];
    this.eBullets = [];
    this.enemies = [];
    this.particles = [];
    this.boss = null;
    this.score = 0;
    this.lives = SI.CONFIG.PLAYER.startLives;
    this.wave = 1;
    this.spawnTimer = 0;
  }

  _handlePress(key) {
    if (key === 'Enter') {
      if (this.state === SI.STATE.MENU || this.state === SI.STATE.OVER || this.state === SI.STATE.WIN) {
        this._resetRun();
        this.state = SI.STATE.PLAY;
        this.audio.select();
      } else if (this.state === SI.STATE.PAUSE) {
        this.state = SI.STATE.PLAY;
      }
    }
    if ((key === 'p' || key === 'P') && (this.state === SI.STATE.PLAY || this.state === SI.STATE.PAUSE)) {
      this.state = this.state === SI.STATE.PLAY ? SI.STATE.PAUSE : SI.STATE.PLAY;
      this.audio.select();
    }
    if (key === 'm' || key === 'M') {
      this.audio.toggle();
      this.audio.select();
    }
  }

  // ---- explosão de partículas ----
  _explode(x, y, n) {
    for (let i = 0; i < n; i++) this.particles.push(new SI.Particle(x, y));
  }

  _damagePlayer(x, y) {
    this.lives--;
    this.flash = 6;
    this.shake = 8;
    this._explode(x, y, 16);
    this.player.hurt();
    this.audio.damage();
    if (this.lives <= 0) this._endRun(SI.STATE.OVER);
  }

  _endRun(state) {
    this.state = state;
    if (this.score > this.highScore) {
      this.highScore = this.score;
      SI.utils.saveHighScore(this.score);
    }
  }

  // =========================================================
  //  UPDATE
  // =========================================================
  update() {
    this.frame++;
    this.stars.update();
    if (this.flash > 0) this.flash--;
    if (this.shake > 0) this.shake--;

    if (this.state !== SI.STATE.PLAY) return;

    const onPlayerShoot = b => { this.bullets.push(b); this.audio.shoot(); };
    const onEnemyShoot  = b => this.eBullets.push(b);

    this.player.update(this.input, this.frame, onPlayerShoot);

    // bullets do player
    for (const b of this.bullets) b.update();

    // spawns — inimigos só surgem enquanto não há chefe em cena
    if (!this.boss) {
      if (--this.spawnTimer <= 0) {
        const pool = SI.CONFIG.ENEMY.types.filter(t => this.wave >= (t.minWave || 1));
        const type = SI.utils.pick(pool);
        this.enemies.push(new SI.Enemy(type, this.wave));
        this.spawnTimer = Math.max(28, 70 - this.wave * 4);
      }
      // ao atingir a pontuação, o chefe entra sozinho: a tela é limpa dos inimigos
      if (this.score >= this.wave * SI.CONFIG.BOSS.triggerScore) {
        this.boss = new SI.Boss(this.wave);
        this.enemies.length = 0;
        this.eBullets.length = 0;
        this.audio.wave();
      }
    }

    // inimigos
    for (const e of this.enemies) {
      e.update(this.frame, onEnemyShoot, this.player);
      // tiro do player x inimigo
      for (const b of this.bullets) {
        if (b.dead) continue;
        if (SI.utils.aabb(b, e, -2)) {
          b.dead = true;
          e.hp--;
          this._explode(b.x, b.y, 4);
          this.audio.hit();
          if (e.hp <= 0) {
            e.dead = true;
            this.score += e.score;
            this._explode(e.x, e.y, 12);
            this.audio.explosion();
          }
          break;
        }
      }
      if (!e.dead && this.player.inv === 0 && SI.utils.aabb(this.player, e, 2)) {
        this._damagePlayer(e.x, e.y);
      }
    }

    // tiros inimigos
    for (const b of this.eBullets) {
      b.update();
      if (!b.dead && this.player.inv === 0 &&
          Math.abs(b.x - this.player.x) < 7 && Math.abs(b.y - this.player.y) < 6) {
        b.dead = true;
        this._damagePlayer(b.x, b.y);
      }
    }

    // chefão
    if (this.boss) {
      this.boss.update(onEnemyShoot, this.player);
      for (const b of this.bullets) {
        if (b.dead) continue;
        if (b.x > this.boss.x - this.boss.w / 2 && Math.abs(b.y - this.boss.y) < this.boss.h / 2) {
          b.dead = true;
          this.boss.hp--;
          this._explode(b.x, b.y, 4);
          this.audio.hit();
          if (this.boss.hp <= 0) {
            this._explode(this.boss.x, this.boss.y, 40);
            this.audio.explosion();
            this.score += this.boss.score;
            this.boss = null;
            this.shake = 12;
            this.flash = 8;
            this.wave++;
            this.eBullets.length = 0;
            if (this.wave > SI.CONFIG.WAVES_TO_WIN) this._endRun(SI.STATE.WIN);
            this.audio.wave();
            break;
          }
        }
      }
      if (this.boss && this.player.inv === 0 &&
          Math.abs(this.player.x - this.boss.x) < this.boss.w / 2 + 6 &&
          Math.abs(this.player.y - this.boss.y) < this.boss.h / 2 + 4) {
        this._damagePlayer(this.player.x, this.player.y);
      }
    }

    // partículas
    for (const p of this.particles) p.update();

    // limpeza dos "mortos" (uma passada por lista)
    this.bullets   = this.bullets.filter(b => !b.dead);
    this.eBullets  = this.eBullets.filter(b => !b.dead);
    this.enemies   = this.enemies.filter(e => !e.dead);
    this.particles = this.particles.filter(p => !p.dead);
  }

  // =========================================================
  //  RENDER
  // =========================================================
  render() {
    const ctx = this.ctx;
    const C = SI.CONFIG.COLORS;

    ctx.save();
    // tremor de tela
    if (this.shake > 0) {
      ctx.translate(SI.utils.rand(-this.shake, this.shake) * 0.4,
                    SI.utils.rand(-this.shake, this.shake) * 0.4);
    }

    // fundo (flash branco ao levar/dar dano forte)
    ctx.fillStyle = this.flash > 0 ? C.light : C.bg;
    ctx.fillRect(-10, -10, this.W + 20, this.H + 20);
    this.stars.draw(ctx);

    switch (this.state) {
      case SI.STATE.MENU:  this._drawMenu(ctx); break;
      case SI.STATE.PAUSE: this._drawScene(ctx); this._overlay(ctx, 'PAUSA', 'ENTER p/ continuar'); break;
      case SI.STATE.OVER:  this._drawScene(ctx); this._overlay(ctx, 'GAME OVER', 'ENTER p/ recomeçar'); break;
      case SI.STATE.WIN:   this._drawScene(ctx); this._overlay(ctx, 'VOCÊ VENCEU!', 'ENTER p/ jogar de novo'); break;
      default:             this._drawScene(ctx);
    }
    ctx.restore();
  }

  _text(str, x, y, size, color, align = 'left') {
    const ctx = this.ctx;
    ctx.fillStyle = color || SI.CONFIG.COLORS.darkest;
    ctx.font = `bold ${size}px 'Courier New', monospace`;
    ctx.textAlign = align;
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(str, x, y);
  }

  _drawScene(ctx) {
    for (const p of this.particles) p.draw(ctx);
    for (const b of this.bullets)   b.draw(ctx);
    for (const b of this.eBullets)  b.draw(ctx);
    for (const e of this.enemies)   e.draw(ctx);
    if (this.boss) this.boss.draw(ctx);
    this.player.draw(ctx, this.frame);

    const C = SI.CONFIG.COLORS;
    this._text('PTS ' + String(this.score).padStart(4, '0'), 4, 12, 9, C.darkest);
    for (let i = 0; i < this.lives; i++) SI.px(ctx, this.W - 10 - i * 9, 5, 6, 5, C.darkest);
    this._text('F' + this.wave, this.W / 2, 12, 9, C.dark, 'center');
  }

  _drawMenu(ctx) {
    const C = SI.CONFIG.COLORS;
    this._text('SPACE IMPACT', this.W / 2, 62, 18, C.darkest, 'center');
    this._text('a navezinha do tijolão', this.W / 2, 80, 9, C.dark, 'center');

    // navezinha decorativa
    const demo = new SI.Player();
    demo.x = this.W / 2 - 52; demo.y = 104;
    demo.draw(ctx, this.frame);

    if (Math.floor(this.frame / 20) % 2)
      this._text('ENTER / TOQUE p/ jogar', this.W / 2, 134, 10, C.darkest, 'center');
    this._text('RECORDE: ' + String(this.highScore).padStart(4, '0'), this.W / 2, 158, 9, C.dark, 'center');
    this._text((this.audio.enabled ? '♪ som on' : '× som off') + '  (M)', this.W / 2, 174, 8, C.dark, 'center');
  }

  _overlay(ctx, title, sub) {
    const C = SI.CONFIG.COLORS;
    ctx.fillStyle = 'rgba(15,56,15,0.28)';
    ctx.fillRect(0, 0, this.W, this.H);
    this._text(title, this.W / 2, 86, 16, C.darkest, 'center');
    if (this.state === SI.STATE.OVER || this.state === SI.STATE.WIN) {
      this._text('Pontos: ' + this.score, this.W / 2, 108, 11, C.darkest, 'center');
      this._text('Recorde: ' + this.highScore, this.W / 2, 124, 9, C.dark, 'center');
    }
    if (Math.floor(this.frame / 20) % 2)
      this._text(sub, this.W / 2, 150, 9, C.dark, 'center');
  }

  // =========================================================
  start() {
    const loop = () => { this.update(); this.render(); requestAnimationFrame(loop); };
    loop();
  }
};
