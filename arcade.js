// ============================================================
//  GAMING ROOM — 5 juegos arcade originales estilo retro
//  Se juegan en pantalla completa con los Joy-Con (o el teclado).
//  − Salir a la sala · + Pausa · A acción principal
// ============================================================
(function () {
  const W = 480, H = 270, TOPE = 26; // TOPE = alto de la barra superior
  const C = { fondo: '#02261e', fondo2: '#06362c', lima: '#dafc92', turq: '#89c9c9', hueso: '#f2f7f9', rojo: '#ff5a52', ambar: '#f5b84a', negro: '#010d0a', lila: '#b9a6ff' };
  let ctx = null, op = null, juego = null, s = null, fase = 'inicio', pausa = false, nuevoRecord = false, tiempo = 0;

  // ---------- utilidades ----------
  const rnd = (a, b) => a + Math.random() * (b - a);
  const lim = (v, a, b) => Math.max(a, Math.min(b, v));
  const choca = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  function record(id) { try { return +(localStorage.getItem('oficina.record.' + id) || 0); } catch (e) { return 0; } }
  function guardarRecord(id, v) { try { localStorage.setItem('oficina.record.' + id, String(v)); } catch (e) {} }
  let audio = null;
  function bip(f, dur, tipo, vol) {
    try {
      if (!audio) audio = new (window.AudioContext || window.webkitAudioContext)();
      if (audio.state === 'suspended') audio.resume();
      const o = audio.createOscillator(), g = audio.createGain(), t = audio.currentTime;
      o.type = tipo || 'square'; o.frequency.value = f;
      g.gain.setValueAtTime(vol || 0.04, t); g.gain.exponentialRampToValueAtTime(0.0001, t + (dur || 0.08));
      o.connect(g).connect(audio.destination); o.start(t); o.stop(t + (dur || 0.08) + 0.02);
    } catch (e) {}
  }
  function texto(x, t, px, py, tam, col, al) {
    x.font = '700 ' + tam + 'px "Roboto Mono", monospace'; x.fillStyle = col; x.textAlign = al || 'center'; x.textBaseline = 'middle';
    x.fillText(t, px, py);
  }
  function fondo(x, col) {
    x.fillStyle = col || C.fondo; x.fillRect(0, 0, W, H);
    x.fillStyle = 'rgba(137,201,201,.05)'; for (let y = 0; y < H; y += 3) x.fillRect(0, y, W, 1); // líneas de pantalla CRT
  }
  // Direcciones recién presionadas (cruceta o palanca)
  const dir = p => p.has('ARRIBA') ? [0, -1] : p.has('ABAJO') ? [0, 1] : p.has('IZQ') ? [-1, 0] : p.has('DER') ? [1, 0] : null;

  // ============================================================
  //  1. ROMPEBLOQUES
  // ============================================================
  const bloques = {
    id: 'bloques', nombre: 'Rompebloques', icono: '🧱', colorCss: '#dafc92', cuerpo: 0x0d3b30, acento: 0xdafc92,
    descripcion: 'Rompe todos los bloques', controles: '◀ ▶ mover · A lanzar',
    nuevo() {
      const s = { pal: { x: W / 2 - 32, y: H - 18, w: 64, h: 7 }, bola: { x: 0, y: 0, vx: 0, vy: 0, r: 4, pegada: true }, vidas: 3, puntos: 0, nivel: 1, vel: 210 };
      this.muro(s); return s;
    },
    muro(s) {
      s.ladr = []; const cols = 12, filas = 6, bw = 36, bh = 11, x0 = (W - cols * (bw + 2)) / 2 + 1;
      const colores = [C.rojo, C.ambar, C.lima, C.turq, C.lila, C.hueso];
      for (let f = 0; f < filas; f++) for (let c = 0; c < cols; c++) s.ladr.push({ x: x0 + c * (bw + 2), y: TOPE + 22 + f * (bh + 3), w: bw, h: bh, col: colores[f], pts: (filas - f) * 10 });
    },
    paso(s, dt, e) {
      const p = s.pal, b = s.bola;
      p.x = lim(p.x + e.x * 380 * dt, 2, W - p.w - 2);
      if (b.pegada) { b.x = p.x + p.w / 2; b.y = p.y - b.r - 1; if (e.pres.has('A')) { b.pegada = false; const a = rnd(-0.5, 0.5); b.vx = Math.sin(a) * s.vel; b.vy = -Math.cos(a) * s.vel; bip(660); } return; }
      b.x += b.vx * dt; b.y += b.vy * dt;
      if (b.x < b.r) { b.x = b.r; b.vx *= -1; bip(330, .03); }
      if (b.x > W - b.r) { b.x = W - b.r; b.vx *= -1; bip(330, .03); }
      if (b.y < TOPE + b.r) { b.y = TOPE + b.r; b.vy *= -1; bip(330, .03); }
      if (b.vy > 0 && b.y + b.r >= p.y && b.y < p.y + p.h && b.x > p.x - b.r && b.x < p.x + p.w + b.r) {
        const rel = lim((b.x - (p.x + p.w / 2)) / (p.w / 2), -1, 1), a = rel * 1.05, v = Math.hypot(b.vx, b.vy);
        b.vx = Math.sin(a) * v; b.vy = -Math.abs(Math.cos(a) * v); b.y = p.y - b.r; bip(520, .05);
      }
      const caja = { x: b.x - b.r, y: b.y - b.r, w: b.r * 2, h: b.r * 2 };
      for (let i = 0; i < s.ladr.length; i++) {
        const l = s.ladr[i];
        if (!choca(caja, l)) continue;
        const dx = Math.min(caja.x + caja.w - l.x, l.x + l.w - caja.x), dy = Math.min(caja.y + caja.h - l.y, l.y + l.h - caja.y);
        if (dx < dy) b.vx *= -1; else b.vy *= -1;
        s.puntos += l.pts; s.ladr.splice(i, 1); bip(880 - l.pts * 4, .05); break;
      }
      if (!s.ladr.length) { s.nivel++; s.vel *= 1.1; this.muro(s); b.pegada = true; bip(990, .2, 'triangle'); }
      if (b.y > H + 10) { s.vidas--; b.pegada = true; bip(160, .3, 'sawtooth'); if (s.vidas <= 0) s.fin = true; }
    },
    dibujar(x, s) {
      fondo(x);
      s.ladr.forEach(l => { x.fillStyle = l.col; x.fillRect(l.x, l.y, l.w, l.h); x.fillStyle = 'rgba(255,255,255,.25)'; x.fillRect(l.x, l.y, l.w, 2); });
      x.fillStyle = C.lima; x.fillRect(s.pal.x, s.pal.y, s.pal.w, s.pal.h);
      x.fillStyle = C.hueso; x.beginPath(); x.arc(s.bola.x, s.bola.y, s.bola.r, 0, Math.PI * 2); x.fill();
      if (s.bola.pegada) texto(x, 'A para lanzar', W / 2, H - 46, 11, C.turq);
      return 'Vidas ' + '♥'.repeat(Math.max(0, s.vidas)) + ' · Nivel ' + s.nivel;
    },
    portada(x, w, h) {
      x.fillStyle = C.fondo; x.fillRect(0, 0, w, h);
      const cols = [C.rojo, C.ambar, C.lima, C.turq];
      for (let f = 0; f < 4; f++) for (let c = 0; c < 8; c++) { x.fillStyle = cols[f]; x.fillRect(12 + c * 37, 40 + f * 18, 33, 13); }
      x.fillStyle = C.lima; x.fillRect(120, 210, 80, 9); x.fillStyle = C.hueso; x.beginPath(); x.arc(170, 170, 7, 0, Math.PI * 2); x.fill();
      texto(x, 'ROMPEBLOQUES', w / 2, 22, 22, C.lima);
    }
  };

  // ============================================================
  //  2. LA SERPIENTE
  // ============================================================
  const CEL = 15, COLS = Math.floor(W / CEL), FILAS = Math.floor((H - TOPE) / CEL);
  const serpiente = {
    id: 'serpiente', nombre: 'La Serpiente', icono: '🐍', colorCss: '#89c9c9', cuerpo: 0x0b2f3a, acento: 0x89c9c9,
    descripcion: 'Come y crece sin chocar', controles: '▲▼◀▶ girar',
    nuevo() {
      const s = { cuerpo: [{ x: 8, y: 8 }, { x: 7, y: 8 }, { x: 6, y: 8 }], dir: [1, 0], cola: [], t: 0, int: 0.13, puntos: 0 };
      this.comida(s); return s;
    },
    comida(s) {
      do { s.com = { x: Math.floor(rnd(0, COLS)), y: Math.floor(rnd(0, FILAS)) }; } while (s.cuerpo.some(c => c.x === s.com.x && c.y === s.com.y));
    },
    paso(s, dt, e) {
      const d = dir(e.pres);
      if (d) {
        const ult = s.cola.length ? s.cola[s.cola.length - 1] : s.dir;
        if (d[0] !== -ult[0] || d[1] !== -ult[1]) { if (s.cola.length < 3) s.cola.push(d); }
      }
      s.t += dt;
      if (s.t < s.int) return;
      s.t = 0;
      if (s.cola.length) s.dir = s.cola.shift();
      const cab = { x: s.cuerpo[0].x + s.dir[0], y: s.cuerpo[0].y + s.dir[1] };
      if (cab.x < 0 || cab.y < 0 || cab.x >= COLS || cab.y >= FILAS || s.cuerpo.some(c => c.x === cab.x && c.y === cab.y)) { s.fin = true; bip(140, .4, 'sawtooth'); return; }
      s.cuerpo.unshift(cab);
      if (cab.x === s.com.x && cab.y === s.com.y) { s.puntos += 10; s.int = Math.max(0.055, s.int - 0.004); this.comida(s); bip(760, .06); }
      else s.cuerpo.pop();
    },
    dibujar(x, s) {
      fondo(x);
      x.strokeStyle = 'rgba(137,201,201,.25)'; x.strokeRect(0.5, TOPE + 0.5, COLS * CEL - 1, FILAS * CEL - 1);
      x.fillStyle = C.rojo; x.fillRect(s.com.x * CEL + 3, TOPE + s.com.y * CEL + 3, CEL - 6, CEL - 6);
      s.cuerpo.forEach((c, i) => { x.fillStyle = i ? (i % 2 ? C.turq : '#74b8b8') : C.lima; x.fillRect(c.x * CEL + 1, TOPE + c.y * CEL + 1, CEL - 2, CEL - 2); });
      return 'Largo ' + s.cuerpo.length;
    },
    portada(x, w, h) {
      x.fillStyle = C.fondo; x.fillRect(0, 0, w, h);
      const ps = [[4, 8], [5, 8], [6, 8], [7, 8], [7, 7], [7, 6], [8, 6], [9, 6], [10, 6], [11, 6], [11, 7], [11, 8], [12, 8]];
      ps.forEach(([cx, cy], i) => { x.fillStyle = i === ps.length - 1 ? C.lima : C.turq; x.fillRect(cx * 20, cy * 20, 18, 18); });
      x.fillStyle = C.rojo; x.fillRect(15 * 20 - 10, 8 * 20 + 2, 14, 14);
      texto(x, 'LA SERPIENTE', w / 2, 30, 24, C.turq);
    }
  };

  // ============================================================
  //  3. METEOROS
  // ============================================================
  function roca(x, y, tam) {
    const r = [0, 9, 16, 26][tam], ang = rnd(0, Math.PI * 2), v = rnd(18, 46) * (4 - tam) * 0.7;
    const forma = []; for (let i = 0; i < 10; i++) forma.push(rnd(0.75, 1.15));
    return { x, y, vx: Math.cos(ang) * v, vy: Math.sin(ang) * v, r, tam, forma, rot: rnd(-1, 1), a: 0 };
  }
  const envolver = o => { if (o.x < 0) o.x += W; if (o.x > W) o.x -= W; if (o.y < TOPE) o.y += H - TOPE; if (o.y > H) o.y -= H - TOPE; };
  const meteoros = {
    id: 'meteoros', nombre: 'Meteoros', icono: '☄️', colorCss: '#f5b84a', cuerpo: 0x2a2310, acento: 0xf5b84a,
    descripcion: 'Destruye las rocas espaciales', controles: '◀ ▶ girar · ▲ o B impulso · A disparar',
    nuevo() { const s = { nave: { x: W / 2, y: (H + TOPE) / 2, a: -Math.PI / 2, vx: 0, vy: 0, inv: 2 }, balas: [], rocas: [], vidas: 3, puntos: 0, oleada: 0, cad: 0 }; this.oleada(s); return s; },
    oleada(s) {
      s.oleada++;
      for (let i = 0; i < 2 + s.oleada; i++) { let x, y; do { x = rnd(0, W); y = rnd(TOPE, H); } while (Math.hypot(x - s.nave.x, y - s.nave.y) < 90); s.rocas.push(roca(x, y, 3)); }
    },
    paso(s, dt, e) {
      const n = s.nave;
      n.a += e.x * 4.2 * dt;
      if (e.y < -0.5 || e.B) { n.vx += Math.cos(n.a) * 190 * dt; n.vy += Math.sin(n.a) * 190 * dt; s.motor = true; } else s.motor = false;
      n.vx *= Math.pow(0.55, dt); n.vy *= Math.pow(0.55, dt);
      n.x += n.vx * dt; n.y += n.vy * dt; envolver(n); n.inv = Math.max(0, n.inv - dt);
      s.cad -= dt;
      if ((e.pres.has('A') || (e.A && s.cad <= -0.1)) && s.balas.length < 6 && s.cad <= 0) {
        s.balas.push({ x: n.x + Math.cos(n.a) * 10, y: n.y + Math.sin(n.a) * 10, vx: Math.cos(n.a) * 330 + n.vx, vy: Math.sin(n.a) * 330 + n.vy, t: 0.9 });
        s.cad = 0.18; bip(900, .04);
      }
      s.balas.forEach(b => { b.x += b.vx * dt; b.y += b.vy * dt; b.t -= dt; envolver(b); });
      s.balas = s.balas.filter(b => b.t > 0);
      s.rocas.forEach(r => { r.x += r.vx * dt; r.y += r.vy * dt; r.a += r.rot * dt; envolver(r); });
      for (const b of s.balas) for (let i = 0; i < s.rocas.length; i++) {
        const r = s.rocas[i];
        if (Math.hypot(b.x - r.x, b.y - r.y) < r.r) {
          b.t = 0; s.rocas.splice(i, 1); s.puntos += [0, 100, 50, 20][r.tam]; bip(200 + r.tam * 60, .12, 'triangle');
          if (r.tam > 1) { s.rocas.push(roca(r.x, r.y, r.tam - 1), roca(r.x, r.y, r.tam - 1)); }
          break;
        }
      }
      if (n.inv <= 0 && s.rocas.some(r => Math.hypot(n.x - r.x, n.y - r.y) < r.r + 6)) {
        s.vidas--; bip(120, .5, 'sawtooth');
        if (s.vidas <= 0) { s.fin = true; return; }
        Object.assign(n, { x: W / 2, y: (H + TOPE) / 2, vx: 0, vy: 0, inv: 2.5 });
      }
      if (!s.rocas.length) this.oleada(s);
    },
    dibujar(x, s) {
      fondo(x, '#030f0c');
      x.fillStyle = 'rgba(242,247,249,.5)'; for (let i = 0; i < 40; i++) x.fillRect((i * 97) % W, TOPE + (i * 53) % (H - TOPE), 1, 1);
      x.strokeStyle = C.ambar; x.lineWidth = 1.5;
      s.rocas.forEach(r => { x.beginPath(); r.forma.forEach((k, i) => { const a = r.a + i / r.forma.length * Math.PI * 2; const px = r.x + Math.cos(a) * r.r * k, py = r.y + Math.sin(a) * r.r * k; i ? x.lineTo(px, py) : x.moveTo(px, py); }); x.closePath(); x.stroke(); });
      x.fillStyle = C.hueso; s.balas.forEach(b => x.fillRect(b.x - 1, b.y - 1, 3, 3));
      const n = s.nave;
      if (!(n.inv > 0 && Math.floor(n.inv * 10) % 2)) {
        x.strokeStyle = C.lima; x.lineWidth = 2; x.beginPath();
        x.moveTo(n.x + Math.cos(n.a) * 11, n.y + Math.sin(n.a) * 11);
        x.lineTo(n.x + Math.cos(n.a + 2.5) * 9, n.y + Math.sin(n.a + 2.5) * 9);
        x.lineTo(n.x + Math.cos(n.a + Math.PI) * 4, n.y + Math.sin(n.a + Math.PI) * 4);
        x.lineTo(n.x + Math.cos(n.a - 2.5) * 9, n.y + Math.sin(n.a - 2.5) * 9);
        x.closePath(); x.stroke();
        if (s.motor && Math.random() > 0.3) { x.strokeStyle = C.rojo; x.beginPath(); x.moveTo(n.x + Math.cos(n.a + Math.PI) * 5, n.y + Math.sin(n.a + Math.PI) * 5); x.lineTo(n.x + Math.cos(n.a + Math.PI) * 13, n.y + Math.sin(n.a + Math.PI) * 13); x.stroke(); }
      }
      return 'Vidas ' + '♥'.repeat(Math.max(0, s.vidas)) + ' · Oleada ' + s.oleada;
    },
    portada(x, w, h) {
      x.fillStyle = '#030f0c'; x.fillRect(0, 0, w, h);
      x.fillStyle = 'rgba(242,247,249,.6)'; for (let i = 0; i < 50; i++) x.fillRect((i * 67) % w, (i * 41) % h, 1, 1);
      x.strokeStyle = C.ambar; x.lineWidth = 2;
      [[70, 90, 34], [240, 150, 26], [200, 60, 14], [90, 190, 18]].forEach(([cx, cy, r]) => { x.beginPath(); for (let i = 0; i < 9; i++) { const a = i / 9 * Math.PI * 2, k = 0.8 + (i % 3) * 0.12; i ? x.lineTo(cx + Math.cos(a) * r * k, cy + Math.sin(a) * r * k) : x.moveTo(cx + r * k, cy); } x.closePath(); x.stroke(); });
      x.strokeStyle = C.lima; x.beginPath(); x.moveTo(160, 115); x.lineTo(150, 140); x.lineTo(160, 133); x.lineTo(170, 140); x.closePath(); x.stroke();
      texto(x, 'METEOROS', w / 2, 24, 24, C.ambar);
    }
  };

  // ============================================================
  //  4. INVASIÓN (criaturas "glitch" originales)
  // ============================================================
  // Bichos originales: una bolita con púas y un insecto con alas (dos cuadros de animación cada uno)
  const SPRITES = [
    ['00100100', '01111110', '11011011', '11111111', '01111110', '00100100'],
    ['10011001', '01111110', '11011011', '11111111', '01111110', '10011001'],
    ['01100110', '11111111', '10111101', '11111111', '01100110', '11000011'],
    ['11000011', '11111111', '10111101', '11111111', '01100110', '01100110']
  ];
  function sprite(x, mapa, px, py, k, col) { x.fillStyle = col; mapa.forEach((f, j) => { for (let i = 0; i < f.length; i++) if (f[i] === '1') x.fillRect(px + i * k, py + j * k, k, k); }); }
  const invasion = {
    id: 'invasion', nombre: 'Invasión', icono: '👾', colorCss: '#ff5a52', cuerpo: 0x3a1512, acento: 0xff5a52,
    descripcion: 'Detén la invasión de bichos', controles: '◀ ▶ mover · A disparar',
    nuevo() { const s = { x: W / 2 - 10, balas: [], enemBalas: [], vidas: 3, puntos: 0, oleada: 0, inv: 0 }; this.oleada(s); return s; },
    oleada(s) {
      s.oleada++; s.enem = []; s.dx = 1; s.paso = 0; s.anim = 0;
      for (let f = 0; f < 5; f++) for (let c = 0; c < 9; c++) s.enem.push({ x: 60 + c * 34, y: TOPE + 18 + f * 22 + Math.min(40, (s.oleada - 1) * 8), w: 24, h: 18, tipo: f < 2 ? 2 : 0, pts: f < 2 ? 30 : f < 4 ? 20 : 10 });
    },
    paso(s, dt, e) {
      s.x = lim(s.x + e.x * 230 * dt, 4, W - 26);
      s.inv = Math.max(0, s.inv - dt);
      if (e.pres.has('A') && s.balas.length < 2) { s.balas.push({ x: s.x + 10, y: H - 30, w: 2, h: 7 }); bip(840, .04); }
      s.balas.forEach(b => b.y -= 300 * dt); s.balas = s.balas.filter(b => b.y > TOPE);
      const vel = (14 + (45 - s.enem.length) * 2.2 + s.oleada * 6);
      let borde = false;
      s.enem.forEach(m => { m.x += s.dx * vel * dt; if (m.x < 6 || m.x + m.w > W - 6) borde = true; });
      if (borde) { s.dx *= -1; s.enem.forEach(m => { m.y += 10; m.x += s.dx * 2; }); bip(110, .05); }
      s.anim += dt;
      for (const b of s.balas) for (let i = 0; i < s.enem.length; i++) if (choca(b, s.enem[i])) { s.puntos += s.enem[i].pts; s.enem.splice(i, 1); b.y = -99; bip(300, .08, 'triangle'); break; }
      if (Math.random() < dt * (0.8 + s.oleada * 0.3) && s.enem.length) {
        const m = s.enem[Math.floor(Math.random() * s.enem.length)];
        s.enemBalas.push({ x: m.x + m.w / 2, y: m.y + m.h, w: 3, h: 7 });
      }
      s.enemBalas.forEach(b => b.y += 140 * dt); s.enemBalas = s.enemBalas.filter(b => b.y < H);
      const yo = { x: s.x, y: H - 22, w: 22, h: 12 };
      if (s.inv <= 0 && s.enemBalas.some(b => choca(b, yo))) { s.vidas--; s.inv = 1.5; s.enemBalas = []; bip(120, .5, 'sawtooth'); if (s.vidas <= 0) s.fin = true; }
      if (s.enem.some(m => m.y + m.h >= H - 26)) { s.fin = true; bip(100, .6, 'sawtooth'); }
      if (!s.enem.length) { this.oleada(s); bip(990, .2, 'triangle'); }
    },
    dibujar(x, s) {
      fondo(x, '#050f0d');
      const fr = Math.floor(s.anim * 2.5) % 2;
      s.enem.forEach(m => sprite(x, SPRITES[m.tipo + fr], m.x, m.y, 3, m.tipo ? C.lila : (m.pts === 20 ? C.turq : C.lima)));
      x.fillStyle = C.hueso; s.balas.forEach(b => x.fillRect(b.x, b.y, b.w, b.h));
      x.fillStyle = C.rojo; s.enemBalas.forEach(b => x.fillRect(b.x, b.y, b.w, b.h));
      if (!(s.inv > 0 && Math.floor(s.inv * 10) % 2)) { x.fillStyle = C.lima; x.fillRect(s.x, H - 16, 22, 6); x.fillRect(s.x + 8, H - 22, 6, 6); }
      x.fillStyle = 'rgba(218,252,146,.3)'; x.fillRect(0, H - 8, W, 1);
      return 'Vidas ' + '♥'.repeat(Math.max(0, s.vidas)) + ' · Oleada ' + s.oleada;
    },
    portada(x, w, h) {
      x.fillStyle = '#050f0d'; x.fillRect(0, 0, w, h);
      for (let f = 0; f < 3; f++) for (let c = 0; c < 6; c++) sprite(x, SPRITES[f ? 0 : 2], 34 + c * 44, 50 + f * 34, 4, f ? (f === 1 ? C.turq : C.lima) : C.lila);
      x.fillStyle = C.lima; x.fillRect(146, 210, 28, 8); x.fillRect(156, 202, 8, 8);
      texto(x, 'INVASIÓN', w / 2, 24, 24, C.rojo);
    }
  };

  // ============================================================
  //  5. PING (1 jugador contra la máquina, o 2 con dos mandos)
  // ============================================================
  const ping = {
    id: 'ping', nombre: 'Ping', icono: '🏓', colorCss: '#f2f7f9', cuerpo: 0x1c2b28, acento: 0xf2f7f9,
    descripcion: 'Gana el partido a 7', controles: '▲▼ mover · A sacar · 2 mandos = 2 jugadores',
    nuevo() { const s = { p1: (H + TOPE) / 2 - 22, p2: (H + TOPE) / 2 - 22, alto: 44, b: null, g1: 0, g2: 0, golpes: 0, puntos: 0, saca: 1 }; this.saque(s); return s; },
    saque(s) { s.b = { x: W / 2, y: (H + TOPE) / 2, vx: 0, vy: 0, espera: true }; },
    paso(s, dt, e) {
      const dos = e.pads && e.pads.length >= 2;
      const y1 = dos ? e.pads[0].y : e.y;
      s.p1 = lim(s.p1 + y1 * 260 * dt, TOPE + 2, H - s.alto - 2);
      if (dos) s.p2 = lim(s.p2 + e.pads[1].y * 260 * dt, TOPE + 2, H - s.alto - 2);
      else { const obj = s.b.y - s.alto / 2, dif = obj - s.p2; s.p2 = lim(s.p2 + lim(dif, -1, 1) * Math.min(Math.abs(dif) * 6, 175 + s.golpes * 2) * dt, TOPE + 2, H - s.alto - 2); }
      const b = s.b;
      if (b.espera) { if (e.pres.has('A') || (dos && e.pads[1].A)) { b.espera = false; b.vx = 190 * s.saca; b.vy = rnd(-80, 80); bip(600); } return; }
      b.x += b.vx * dt; b.y += b.vy * dt;
      if (b.y < TOPE + 3 || b.y > H - 3) { b.vy *= -1; b.y = lim(b.y, TOPE + 3, H - 3); bip(300, .03); }
      const golpe = (px, py) => { if (b.y > py - 3 && b.y < py + s.alto + 3) { const rel = (b.y - (py + s.alto / 2)) / (s.alto / 2); const v = Math.min(520, Math.hypot(b.vx, b.vy) * 1.06); b.vx = -Math.sign(b.vx) * v * Math.cos(rel * 0.9); b.vy = v * Math.sin(rel * 0.9); b.x = px; s.golpes++; bip(520, .05); return true; } return false; };
      if (b.vx < 0 && b.x <= 18 && b.x > 8) golpe(18, s.p1);
      if (b.vx > 0 && b.x >= W - 18 && b.x < W - 8) golpe(W - 18, s.p2);
      if (b.x < 0) { s.g2++; s.saca = 1; bip(160, .3, 'sawtooth'); this.saque(s); }
      if (b.x > W) { s.g1++; s.saca = -1; bip(990, .2, 'triangle'); this.saque(s); }
      s.puntos = s.g1 * 100 + s.golpes;
      if (s.g1 >= 7 || s.g2 >= 7) { s.fin = true; s.mensaje = s.g1 >= 7 ? (dos ? '¡Ganó el jugador 1!' : '¡Le ganaste a la máquina!') : (dos ? '¡Ganó el jugador 2!' : 'La máquina ganó esta vez'); }
    },
    dibujar(x, s) {
      fondo(x, '#04221b');
      x.fillStyle = 'rgba(242,247,249,.25)'; for (let y = TOPE + 4; y < H; y += 14) x.fillRect(W / 2 - 1, y, 2, 8);
      texto(x, String(s.g1), W / 2 - 40, TOPE + 26, 30, C.lima); texto(x, String(s.g2), W / 2 + 40, TOPE + 26, 30, C.turq);
      x.fillStyle = C.lima; x.fillRect(10, s.p1, 6, s.alto);
      x.fillStyle = C.turq; x.fillRect(W - 16, s.p2, 6, s.alto);
      x.fillStyle = C.hueso; x.fillRect(s.b.x - 3, s.b.y - 3, 6, 6);
      if (s.b.espera) texto(x, 'A para sacar', W / 2, H - 20, 11, C.turq);
      return 'A 7 puntos';
    },
    portada(x, w, h) {
      x.fillStyle = '#04221b'; x.fillRect(0, 0, w, h);
      x.fillStyle = 'rgba(242,247,249,.3)'; for (let y = 50; y < h; y += 16) x.fillRect(w / 2 - 1, y, 2, 9);
      x.fillStyle = C.lima; x.fillRect(18, 90, 8, 54); x.fillStyle = C.turq; x.fillRect(w - 26, 130, 8, 54);
      x.fillStyle = C.hueso; x.fillRect(200, 120, 9, 9);
      texto(x, '3', w / 2 - 36, 64, 26, C.lima); texto(x, '5', w / 2 + 36, 64, 26, C.turq);
      texto(x, 'PING', w / 2, 24, 24, C.hueso);
    }
  };

  const JUEGOS = [bloques, serpiente, meteoros, invasion, ping];

  // ============================================================
  //  MARCO: inicio, pausa, fin y récords
  // ============================================================
  function abrir(id, opciones) {
    op = opciones; juego = JUEGOS.find(j => j.id === id); ctx = op.lienzo.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    fase = 'inicio'; pausa = false; s = null; nuevoRecord = false; tiempo = 0;
    dibujar();
  }
  function salir() { const f = op && op.alSalir; juego = null; s = null; if (f) f(); }
  function tick(dt, e, nuevas) {
    if (!juego) return;
    tiempo += dt;
    const pres = new Set(nuevas);
    if (pres.has('MENOS')) { bip(300, .08); return salir(); }
    if (fase === 'inicio') { if (pres.has('A')) { s = juego.nuevo(); fase = 'jugando'; bip(660, .1); } return dibujar(); }
    if (fase === 'fin') { if (pres.has('A')) { s = juego.nuevo(); fase = 'jugando'; nuevoRecord = false; bip(660, .1); } return dibujar(); }
    if (pres.has('MAS')) { pausa = !pausa; bip(pausa ? 400 : 700, .06); }
    if (!pausa) {
      const ent = { x: e.x || 0, y: e.y || 0, A: !!e.A, B: !!e.B, pres: pres, pads: e.pads || [] };
      // pasos pequeños: la física es igual de estable a 30 o a 60 cuadros por segundo
      let resto = Math.min(dt, 0.05);
      while (resto > 0 && !s.fin) { const h = Math.min(resto, 1 / 120); juego.paso(s, h, ent); ent.pres = new Set(); resto -= h; }
      if (s.fin) {
        fase = 'fin';
        if (s.puntos > record(juego.id)) { guardarRecord(juego.id, s.puntos); nuevoRecord = true; bip(1040, .3, 'triangle'); }
      }
    }
    dibujar();
  }
  function dibujar() {
    const x = ctx;
    if (fase === 'inicio') {
      x.fillStyle = C.fondo; x.fillRect(0, 0, W, H);
      if (!juego._portada) { const tmp = document.createElement('canvas'); tmp.width = 320; tmp.height = 240; juego.portada(tmp.getContext('2d'), 320, 240); juego._portada = tmp; }
      x.globalAlpha = 0.3; x.drawImage(juego._portada, 0, 44, 320, 196, 80, 60, 320, 196); x.globalAlpha = 1; // sin el título de la portada
      texto(x, juego.nombre.toUpperCase(), W / 2, 70, 34, juego.colorCss);
      texto(x, juego.descripcion, W / 2, 104, 13, C.hueso);
      texto(x, juego.controles, W / 2, 132, 11, C.turq);
      texto(x, 'Récord: ' + record(juego.id), W / 2, 160, 12, C.ambar);
      if (Math.floor(tiempo * 2) % 2 === 0) texto(x, 'Presiona A para jugar', W / 2, 200, 16, C.lima);
      texto(x, '− salir a la sala', W / 2, 236, 10, 'rgba(242,247,249,.5)');
      return;
    }
    const info = juego.dibujar(x, s) || '';
    // barra superior
    x.fillStyle = 'rgba(1,13,10,.92)'; x.fillRect(0, 0, W, TOPE - 4);
    texto(x, juego.nombre.toUpperCase(), 8, 11, 11, juego.colorCss, 'left');
    texto(x, String(s.puntos), W / 2, 11, 14, C.hueso);
    texto(x, info + '  ·  Récord ' + Math.max(record(juego.id), s.puntos), W - 8, 11, 9, C.turq, 'right');
    if (pausa || fase === 'fin') {
      x.fillStyle = 'rgba(1,13,10,.78)'; x.fillRect(0, 0, W, H);
      if (pausa) { texto(x, 'PAUSA', W / 2, H / 2 - 14, 30, C.lima); texto(x, '+ seguir · − salir a la sala', W / 2, H / 2 + 20, 11, C.turq); }
      else {
        texto(x, s.mensaje || 'FIN DEL JUEGO', W / 2, H / 2 - 46, s.mensaje ? 20 : 28, C.lima);
        texto(x, 'Puntos: ' + s.puntos, W / 2, H / 2 - 10, 16, C.hueso);
        texto(x, nuevoRecord ? '¡NUEVO RÉCORD!' : 'Récord: ' + record(juego.id), W / 2, H / 2 + 16, 13, nuevoRecord ? C.ambar : C.turq);
        texto(x, 'A jugar otra vez · − salir a la sala', W / 2, H / 2 + 52, 11, 'rgba(242,247,249,.75)');
      }
    }
  }

  window.ARCADE = { juegos: JUEGOS, abrir, tick, record };
})();
