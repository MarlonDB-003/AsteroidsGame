/* ===========================================================
   entities.js — objetos do jogo. Cada classe sabe se atualizar
   (update) e se desenhar (draw). O desenho é "pixel a pixel"
   pra manter a cara de LCD do Nokia.
   =========================================================== */

window.SI = window.SI || {};

(() => {
  const { COLORS } = SI.CONFIG;

  // Helper de desenho de retângulo "pixelado".
  function px(ctx, x, y, w, h, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x | 0, y | 0, w, h);
  }
  SI.px = px;

  // ---------------------------------------------------------
  SI.Bullet = class {
    constructor(x, y, vx, enemy = false) {
      this.x = x; this.y = y; this.vx = vx;
      this.w = enemy ? 3 : 4; this.h = 2;
      this.enemy = enemy;
      this.dead = false;
    }
    update() {
      this.x += this.vx;
      if (this.x < -6 || this.x > SI.CONFIG.WIDTH + 6) this.dead = true;
    }
    draw(ctx) {
      px(ctx, this.x - 1, this.y - 1, this.w, this.h, this.enemy ? COLORS.dark : COLORS.darkest);
    }
  };

  // ---------------------------------------------------------
  SI.Particle = class {
    constructor(x, y) {
      const a = Math.random() * Math.PI * 2;
      const s = SI.utils.rand(0.5, 2.5);
      this.x = x; this.y = y;
      this.vx = Math.cos(a) * s; this.vy = Math.sin(a) * s;
      this.life = SI.utils.rand(18, 30);
      this.dead = false;
    }
    update() {
      this.x += this.vx; this.y += this.vy;
      if (--this.life <= 0) this.dead = true;
    }
    draw(ctx) { px(ctx, this.x, this.y, 2, 2, COLORS.darkest); }
  };

  // ---------------------------------------------------------
  SI.Player = class {
    constructor() {
      const cfg = SI.CONFIG.PLAYER;
      this.w = cfg.w; this.h = cfg.h;
      this.reset();
    }
    reset() {
      this.x = 26; this.y = SI.CONFIG.HEIGHT / 2;
      this.cooldown = 0; this.inv = 0;
    }
    update(input, frame, onShoot) {
      const cfg = SI.CONFIG.PLAYER;
      const sp = cfg.speed;
      if (input.keys['ArrowUp'])    this.y -= sp;
      if (input.keys['ArrowDown'])  this.y += sp;
      if (input.keys['ArrowLeft'])  this.x -= sp;
      if (input.keys['ArrowRight']) this.x += sp;

      // toque: a nave persegue suavemente o dedo
      if (input.pointer.x !== null) {
        this.x += (input.pointer.x - this.x) * 0.25;
        this.y += (input.pointer.y - this.y) * 0.25;
      }

      this.x = SI.utils.clamp(this.x, 6, SI.CONFIG.WIDTH * cfg.maxX);
      this.y = SI.utils.clamp(this.y, 6, SI.CONFIG.HEIGHT - 6);

      if (this.inv > 0) this.inv--;
      if (this.cooldown > 0) this.cooldown--;

      if (input.keys[' '] && this.cooldown === 0) {
        onShoot(new SI.Bullet(this.x + 9, this.y, cfg.bulletSpeed));
        this.cooldown = cfg.fireCooldown;
        this.frame = frame;
      }
    }
    hurt() {
      this.inv = SI.CONFIG.PLAYER.invincibleFrames;
      this.x = 26; this.y = SI.CONFIG.HEIGHT / 2;
    }
    draw(ctx, frame) {
      if (this.inv > 0 && Math.floor(frame / 4) % 2) return; // pisca
      const c = COLORS.darkest;
      const { x, y } = this;
      px(ctx, x - 7, y - 2, 9, 4, c);
      px(ctx, x + 1, y - 1, 5, 2, c);   // bico
      px(ctx, x - 7, y - 4, 3, 2, c);   // asa de cima
      px(ctx, x - 7, y + 2, 3, 2, c);   // asa de baixo
      px(ctx, x + 5, y - 1, 3, 2, COLORS.dark); // canhão
      if (Math.floor(frame / 3) % 2) px(ctx, x - 10, y - 1, 3, 2, COLORS.dark); // propulsor
    }
  };

  // ---------------------------------------------------------
  SI.Enemy = class {
    constructor(type, wave) {
      this.w = type.w; this.h = type.h; this.hp = type.hp;
      this.spd = type.spd + wave * SI.CONFIG.ENEMY.speedPerWave;
      this.score = type.score;
      this.move = type.move;
      this.shoot = type.shoot;
      this.shootTimer = SI.utils.randInt(0, 60);
      this.phase = Math.random() * Math.PI * 2;
      this.x = SI.CONFIG.WIDTH + 10;
      this.y = this.baseY = SI.utils.rand(20, SI.CONFIG.HEIGHT - 20);
      this.dead = false;
    }
    update(frame, onShoot) {
      this.x -= this.spd;
      if (this.move === 'wave') this.y = this.baseY + Math.sin(frame * 0.05 + this.phase) * 22;
      this.y = SI.utils.clamp(this.y, 6, SI.CONFIG.HEIGHT - 6);

      if (this.shoot && --this.shootTimer <= 0) {
        onShoot(new SI.Bullet(this.x - 6, this.y, -SI.CONFIG.ENEMY.bulletSpeed, true));
        this.shootTimer = this.shoot;
      }
      if (this.x < -14) this.dead = true;
    }
    draw(ctx) {
      const c = COLORS.darkest;
      px(ctx, this.x - this.w / 2, this.y - this.h / 2, this.w, this.h, c);
      px(ctx, this.x - this.w / 2 + 1, this.y - 1, 2, 2, COLORS.bg); // olho
      px(ctx, this.x - this.w / 2 - 2, this.y - this.h / 2, 2, 3, c); // garras
      px(ctx, this.x - this.w / 2 - 2, this.y + this.h / 2 - 3, 2, 3, c);
    }
  };

  // ---------------------------------------------------------
  SI.Boss = class {
    constructor(wave) {
      const cfg = SI.CONFIG.BOSS;
      this.w = cfg.w; this.h = cfg.h;
      this.maxHp = this.hp = cfg.baseHp + wave * cfg.hpPerWave;
      this.vy = cfg.vy;
      this.shootTimer = 0;
      this.x = SI.CONFIG.WIDTH - 6;
      this.enterX = SI.CONFIG.WIDTH - 50;
      this.y = SI.CONFIG.HEIGHT / 2;
      this.dead = false;
    }
    update(onShoot) {
      const cfg = SI.CONFIG.BOSS;
      if (this.x > this.enterX) this.x -= 0.8;
      this.y += this.vy;
      if (this.y < 28 || this.y > SI.CONFIG.HEIGHT - 28) this.vy *= -1;

      if (--this.shootTimer <= 0) {
        onShoot(new SI.Bullet(this.x - 14, this.y - 10, -(cfg.bulletSpeed - 0.2), true));
        onShoot(new SI.Bullet(this.x - 14, this.y,      -cfg.bulletSpeed,        true));
        onShoot(new SI.Bullet(this.x - 14, this.y + 10, -(cfg.bulletSpeed - 0.2), true));
        this.shootTimer = cfg.shootInterval;
      }
    }
    draw(ctx) {
      const c = COLORS.darkest;
      px(ctx, this.x - this.w / 2, this.y - this.h / 2, this.w, this.h, c);
      px(ctx, this.x - this.w / 2 - 4, this.y - this.h / 2 + 4, 4, 8, c);
      px(ctx, this.x - this.w / 2 - 4, this.y + this.h / 2 - 12, 4, 8, c);
      px(ctx, this.x - 4, this.y - 4, 8, 8, COLORS.bg);  // núcleo
      px(ctx, this.x - 2, this.y - 2, 4, 4, COLORS.dark);
      // barra de vida no topo da tela
      const W = SI.CONFIG.WIDTH;
      px(ctx, 40, 4, W - 80, 4, COLORS.dark);
      px(ctx, 40, 4, ((W - 80) * this.hp / this.maxHp) | 0, 4, COLORS.darkest);
    }
  };

  // ---------------------------------------------------------
  SI.StarField = class {
    constructor() {
      this.stars = [];
      for (let i = 0; i < SI.CONFIG.STAR_COUNT; i++) {
        this.stars.push({
          x: Math.random() * SI.CONFIG.WIDTH,
          y: Math.random() * SI.CONFIG.HEIGHT,
          s: Math.random() < 0.3 ? 2 : 1,
          spd: SI.utils.rand(0.3, 1.1),
        });
      }
    }
    update() {
      for (const st of this.stars) {
        st.x -= st.spd;
        if (st.x < 0) { st.x = SI.CONFIG.WIDTH; st.y = Math.random() * SI.CONFIG.HEIGHT; }
      }
    }
    draw(ctx) {
      for (const st of this.stars) px(ctx, st.x, st.y, st.s, st.s, COLORS.dark);
    }
  };
})();
