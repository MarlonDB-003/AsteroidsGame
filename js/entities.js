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
    constructor(x, y, vx, enemy = false, vy = 0) {
      this.x = x; this.y = y; this.vx = vx; this.vy = vy;
      this.w = enemy ? 5 : 4; this.h = enemy ? 5 : 2;
      this.enemy = enemy;
      this.dead = false;
    }
    update() {
      this.x += this.vx; this.y += this.vy;
      if (this.x < -6 || this.x > SI.CONFIG.WIDTH + 6 ||
          this.y < -6 || this.y > SI.CONFIG.HEIGHT + 6) this.dead = true;
    }
    draw(ctx) {
      if (this.enemy) {
        // orbe grande e escuro com miolo claro — bem visível no meio da tela
        px(ctx, this.x - 2, this.y - 2, 5, 5, COLORS.darkest);
        px(ctx, this.x - 1, this.y - 1, 2, 2, COLORS.bg);
      } else {
        px(ctx, this.x - 1, this.y - 1, this.w, this.h, COLORS.darkest);
      }
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
      this.sprite = type.sprite;
      this.shoot = type.shoot;
      this.shootTimer = SI.utils.randInt(0, 60);
      this.phase = Math.random() * Math.PI * 2;
      // velocidade vertical p/ os padrões 'dive' e 'zigzag'
      this.vy = (Math.random() < 0.5 ? -1 : 1) * (type.move === 'zigzag' ? 2.2 : 1.5);
      this.x = SI.CONFIG.WIDTH + 10;
      this.y = this.baseY = SI.utils.rand(20, SI.CONFIG.HEIGHT - 20);
      this.dead = false;
    }
    update(frame, onShoot, player) {
      const H = SI.CONFIG.HEIGHT;
      this.x -= this.spd;

      switch (this.move) {
        case 'wave':
          this.y = this.baseY + Math.sin(frame * 0.05 + this.phase) * 22;
          break;
        case 'dive':
          this.y += this.vy;
          if (this.y < 12 || this.y > H - 12) this.vy *= -1;
          break;
        case 'zigzag':
          this.y += this.vy;
          if (this.y < 16 || this.y > H - 16) this.vy *= -1;
          break;
        case 'chase':
          if (player) this.y += SI.utils.clamp((player.y - this.y) * 0.05, -1.4, 1.4);
          break;
        // 'straight' não mexe no y
      }
      this.y = SI.utils.clamp(this.y, 6, H - 6);

      if (this.shoot && --this.shootTimer <= 0) {
        onShoot(new SI.Bullet(this.x - 6, this.y, -SI.CONFIG.ENEMY.bulletSpeed, true));
        this.shootTimer = this.shoot;
      }
      if (this.x < -14) this.dead = true;
    }
    draw(ctx) {
      const c = COLORS.darkest, a = COLORS.dark, eye = COLORS.bg;
      const { x, y, w, h } = this;
      const L = x - w / 2, T = y - h / 2;
      switch (this.sprite) {
        case 'waver': // corpo em losango com barbatanas
          px(ctx, L + 2, T, w - 4, h, c);
          px(ctx, L, y - 1, w, 2, c);
          px(ctx, L + w - 4, y - 1, 2, 2, eye);
          break;
        case 'shooter': // canhão saliente na frente (esquerda)
          px(ctx, L + 2, T, w - 2, h, c);
          px(ctx, L - 2, y - 2, 4, 4, c);        // cano
          px(ctx, L + w - 4, y - 2, 2, 2, eye);
          px(ctx, L + w - 2, T + 1, 2, h - 2, a); // motor traseiro
          break;
        case 'diver': // nariz apontado, formato de gota
          px(ctx, L + 2, T + 1, w - 4, h - 2, c);
          px(ctx, L, y - 2, 3, 4, c);            // ponta
          px(ctx, L + w - 4, y - 3, 2, 6, a);
          px(ctx, L + 3, y - 1, 2, 2, eye);
          break;
        case 'zigzag': // pequena, formato de flecha
          px(ctx, L + 1, y - 1, w - 2, 2, c);
          px(ctx, L + 3, T, w - 6, h, c);
          px(ctx, L, T + 1, 2, 2, c);
          px(ctx, L, T + h - 3, 2, 2, c);
          break;
        case 'hunter': // maior, com "chifres" e olho vermelho
          px(ctx, L + 2, T + 1, w - 4, h - 2, c);
          px(ctx, L - 2, T, 3, 3, c);            // garra sup.
          px(ctx, L - 2, T + h - 3, 3, 3, c);    // garra inf.
          px(ctx, L + w - 5, y - 2, 3, 4, eye);  // olho
          px(ctx, L + w - 2, y - 1, 2, 2, a);
          break;
        default: // grunt (padrão original)
          px(ctx, L, T, w, h, c);
          px(ctx, L + 1, y - 1, 2, 2, eye);
          px(ctx, L - 2, T, 2, 3, c);
          px(ctx, L - 2, y + h / 2 - 3, 2, 3, c);
      }
    }
  };

  // ---------------------------------------------------------
  // Velocidade de um tiro apontado do ponto (fx,fy) até (tx,ty).
  function aimVel(fx, fy, tx, ty, speed) {
    const dx = tx - fx, dy = ty - fy;
    const d = Math.hypot(dx, dy) || 1;
    return { vx: dx / d * speed, vy: dy / d * speed };
  }

  SI.Boss = class {
    constructor(wave) {
      const list = SI.CONFIG.BOSSES;
      this.def = list[Math.min(wave, list.length) - 1];
      this.w = this.def.w; this.h = this.def.h;
      this.maxHp = this.hp = this.def.hp + (wave - 1) * SI.CONFIG.BOSS.hpPerWave;
      this.score = this.def.score;
      this.vy = this.def.vy;
      this.shootTimer = 40;
      this.shotCount = 0;
      this.x = SI.CONFIG.WIDTH - 6;
      this.enterX = SI.CONFIG.WIDTH - 50;
      this.y = SI.CONFIG.HEIGHT / 2;
      this.dead = false;
    }
    update(onShoot, player) {
      if (this.x > this.enterX) this.x -= 0.8;
      this.y += this.vy;
      if (this.y < 28 || this.y > SI.CONFIG.HEIGHT - 28) this.vy *= -1;

      if (--this.shootTimer <= 0) {
        this._fire(onShoot, player);
        this.shootTimer = this.def.shootInterval;
        this.shotCount++;
      }
    }
    _fire(onShoot, player) {
      const spd = this.def.bulletSpeed;
      const bx = this.x - this.w / 2 - 2, by = this.y;
      const shoot = (vx, vy, oy = 0) => onShoot(new SI.Bullet(bx, by + oy, vx, true, vy));
      switch (this.def.pattern) {
        case 'aimed': {
          const v = aimVel(bx, by, player.x, player.y, spd);
          shoot(v.vx, v.vy);
          break;
        }
        case 'burst': { // dois tiros mirados, um acima e um abaixo
          const v = aimVel(bx, by, player.x, player.y, spd);
          shoot(v.vx, v.vy, -6);
          shoot(v.vx, v.vy, 6);
          break;
        }
        case 'spread5':
          for (let i = -2; i <= 2; i++) shoot(-spd, i * 0.6);
          break;
        case 'altern': // alterna leque largo e rajada mirada
          if (this.shotCount % 2 === 0) {
            for (let i = -2; i <= 2; i++) shoot(-spd, i * 0.7);
          } else {
            const v = aimVel(bx, by, player.x, player.y, spd + 0.4);
            shoot(v.vx, v.vy, -5);
            shoot(v.vx, v.vy, 5);
          }
          break;
        default: // spread3
          shoot(-spd, -0.7);
          shoot(-spd, 0);
          shoot(-spd, 0.7);
      }
    }
    draw(ctx) {
      const c = COLORS.darkest, a = COLORS.dark, core = COLORS.bg;
      const { x, y, w, h } = this;
      const L = x - w / 2, T = y - h / 2;
      switch (this.def.sprite) {
        case 'serpent': // corpo estreito e alongado, com "cabeça"
          px(ctx, L + 2, T, w - 4, h, c);
          px(ctx, L - 2, y - 6, 4, 12, c);        // cabeça
          px(ctx, L, y - 2, 3, 4, core);          // olho
          px(ctx, L + w - 3, T + 2, 3, h - 4, a); // cauda
          break;
        case 'twin': // dois canhões separados por um eixo
          px(ctx, L, T, w, 14, c);                // torre sup.
          px(ctx, L, T + h - 14, w, 14, c);        // torre inf.
          px(ctx, x - 3, T + 10, 6, h - 20, a);    // eixo
          px(ctx, L - 3, T + 4, 3, 5, core);
          px(ctx, L - 3, T + h - 9, 3, 5, core);
          break;
        case 'swarm': // blocos irregulares, aparência de colmeia
          px(ctx, L + 2, T, w - 4, h, c);
          px(ctx, L - 2, T + 6, 4, 6, c);
          px(ctx, L - 2, T + h - 12, 4, 6, c);
          for (let i = 0; i < 3; i++) px(ctx, x - 4, T + 8 + i * 12, 8, 6, core);
          break;
        case 'core': // fortaleza grande com núcleo pulsante
          px(ctx, L + 3, T, w - 6, h, c);
          px(ctx, L - 3, T + 6, 5, 12, c);
          px(ctx, L - 3, T + h - 18, 5, 12, c);
          px(ctx, L + w - 4, T + 8, 4, h - 16, a);
          px(ctx, x - 6, y - 6, 12, 12, core);     // núcleo
          px(ctx, x - 3, y - 3, 6, 6, a);
          break;
        default: // sentinel (o clássico da fase 1)
          px(ctx, L, T, w, h, c);
          px(ctx, L - 4, T + 4, 4, 8, c);
          px(ctx, L - 4, y + h / 2 - 12, 4, 8, c);
          px(ctx, x - 4, y - 4, 8, 8, core);
          px(ctx, x - 2, y - 2, 4, 4, a);
      }
      // barra de vida (topo) + nome do chefe (rodapé)
      const W = SI.CONFIG.WIDTH;
      px(ctx, 40, 4, W - 80, 4, a);
      px(ctx, 40, 4, ((W - 80) * this.hp / this.maxHp) | 0, 4, c);
      ctx.fillStyle = c;
      ctx.font = "bold 8px 'Courier New', monospace";
      ctx.textAlign = 'center';
      ctx.textBaseline = 'alphabetic';
      ctx.fillText(this.def.name, W / 2, SI.CONFIG.HEIGHT - 5);
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
