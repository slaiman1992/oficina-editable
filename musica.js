// ============================================================
//  MÚSICA GENERADA — sin derechos de autor, sin archivos, sin internet
//  El juego compone y toca la música en vivo con sintetizadores:
//   · 'enfoque'   → electrónica ambiental para concentrarse (oficina)
//   · 'synthwave' → synthwave estilo 80s (Gaming Room)
//  Cada pista nace de una "semilla": nunca suena exactamente igual.
// ============================================================
(function () {
  const leerL = (k, d) => { try { const v = localStorage.getItem('oficina.musica.' + k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } };
  const guardarL = (k, v) => { try { localStorage.setItem('oficina.musica.' + k, JSON.stringify(v)); } catch (e) {} };

  const M = { sonando: false, estilo: 'enfoque', pista: null, volumen: leerL('volumen', 0.7), atenuada: false, alCambiar: () => {}, aviso: () => {} };
  let ctx = null, master, bus, envio, eco, ruido, medidor, salida, timer = null, paso = 0, proximo = 0, P = null, azar = Math.random;

  // ---------- utilidades musicales ----------
  const hz = m => 440 * Math.pow(2, (m - 69) / 12);
  const ESCALA_MENOR = [0, 2, 3, 5, 7, 8, 10];
  const grado = (raiz, g, oct) => raiz + ESCALA_MENOR[((g % 7) + 7) % 7] + 12 * (Math.floor(g / 7) + (oct || 0));
  const acorde = (raiz, g, extras) => [0, 2, 4].concat(extras || []).map(i => grado(raiz, g + i));
  function semilla(n) { return function () { n |= 0; n = n + 0x6D2B79F5 | 0; let t = Math.imul(n ^ n >>> 15, 1 | n); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  const elegir = a => a[Math.floor(azar() * a.length)];

  // ---------- audio ----------
  function iniciarAudio() {
    if (ctx) return;
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -18; comp.ratio.value = 3;
    master = ctx.createGain(); master.gain.value = 0;
    salida = ctx.createGain(); salida.gain.value = 2.3; // ganancia final (después del compresor)
    master.connect(comp); comp.connect(salida); salida.connect(ctx.destination);
    medidor = ctx.createAnalyser(); medidor.fftSize = 2048; salida.connect(medidor); // para medir el nivel (pruebas)
    bus = ctx.createGain(); bus.connect(master);
    // eco con retroalimentación (más liviano que una reverberación real)
    eco = ctx.createDelay(2); const fb = ctx.createGain(), tono = ctx.createBiquadFilter();
    fb.gain.value = 0.38; tono.type = 'lowpass'; tono.frequency.value = 2600;
    eco.connect(tono); tono.connect(fb); fb.connect(eco); tono.connect(master);
    envio = ctx.createGain(); envio.gain.value = 0.5; envio.connect(eco);
    const largo = ctx.sampleRate * 1; ruido = ctx.createBuffer(1, largo, ctx.sampleRate);
    const d = ruido.getChannelData(0); for (let i = 0; i < largo; i++) d[i] = Math.random() * 2 - 1;
  }
  function env(g, t, ataque, dur, rel, vol) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + ataque);
    g.gain.setValueAtTime(vol, t + Math.max(ataque, dur));
    g.gain.exponentialRampToValueAtTime(0.0001, t + Math.max(ataque, dur) + rel);
  }
  // Nota sintetizada: osciladores → filtro → volumen → mezcla (+ eco)
  function nota(m, t, dur, o) {
    o = o || {};
    const g = ctx.createGain(), f = ctx.createBiquadFilter();
    f.type = 'lowpass'; f.frequency.setValueAtTime(o.corte || 2000, t); f.Q.value = o.q || 0.7;
    if (o.barrido) { f.frequency.setValueAtTime(o.corte * 2.5, t); f.frequency.exponentialRampToValueAtTime(o.corte, t + o.barrido); }
    const fin = t + Math.max(o.ataque || 0.01, dur) + (o.rel || 0.2) + 0.05;
    (o.desafino || [0]).forEach(det => {
      const osc = ctx.createOscillator(); osc.type = o.onda || 'sawtooth'; osc.frequency.value = hz(m); osc.detune.value = det;
      osc.connect(f); osc.start(t); osc.stop(fin);
    });
    f.connect(g); g.connect(bus);
    if (o.eco) { const s = ctx.createGain(); s.gain.value = o.eco; g.connect(s); s.connect(envio); }
    env(g, t, o.ataque || 0.01, dur, o.rel || 0.2, o.vol || 0.05);
  }
  function bombo(t, vol) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = 'sine'; o.frequency.setValueAtTime(140, t); o.frequency.exponentialRampToValueAtTime(42, t + 0.14);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.38);
    o.connect(g); g.connect(bus); o.start(t); o.stop(t + 0.4);
  }
  function ruidoFiltrado(t, dur, tipo, frec, vol, ecoVol) {
    const s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    s.buffer = ruido; f.type = tipo; f.frequency.value = frec;
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f); f.connect(g); g.connect(bus);
    if (ecoVol) { const e = ctx.createGain(); e.gain.value = ecoVol; g.connect(e); e.connect(envio); }
    s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.02);
  }
  function caja(t, vol) { ruidoFiltrado(t, 0.22, 'bandpass', 1900, vol, 0.45); nota(55, t, 0.05, { onda: 'triangle', vol: vol * 0.6, rel: 0.08, corte: 900 }); }
  const platillo = (t, vol, abierto) => ruidoFiltrado(t, abierto ? 0.28 : 0.045, 'highpass', 7500, vol);

  // ---------- compositor: cada pista sale de una semilla ----------
  const NOMBRES = {
    enfoque: ['Foco profundo', 'Brisa del Malecón', 'Café de las nueve', 'Nube de ideas', 'Brief en calma', 'Pantalla limpia', 'Píxel verde', 'Flujo creativo', 'Lluvia en la Zona Colonial', 'Mesa de luz'],
    synthwave: ['Neón Caribe', 'Malecón 1986', 'Autopista de noche', 'Cinta VHS', 'Arcade Tropical', 'Láser Lima', 'Atardecer en 8 bits', 'Turbo Caribe', 'Persecución en Bávaro', 'Palmeras de neón']
  };
  const NOTAS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  function nuevaPista(estilo) {
    const s = Math.floor(Math.random() * 1e9); azar = semilla(s);
    const p = { estilo, semilla: s };
    if (estilo === 'enfoque') {
      p.bpm = 76 + Math.floor(azar() * 14);
      p.raiz = elegir([57, 60, 62, 64, 55, 59]);
      p.prog = elegir([[0, 5, 2, 6], [0, 3, 5, 4], [5, 3, 0, 6], [0, 6, 5, 6], [3, 4, 0, 0]]);
      p.compasesAcorde = 2;
      p.densidadArpegio = 0.35 + azar() * 0.3;
      p.secciones = [['intro', 8], ['ritmo', 16], ['respiro', 8], ['ritmo', 16], ['cierre', 4]];
      p.corte = 700 + azar() * 600;
    } else {
      p.bpm = 96 + Math.floor(azar() * 16);
      p.raiz = elegir([57, 52, 55, 50, 53]);
      p.prog = elegir([[0, 5, 2, 6], [0, 6, 5, 6], [5, 6, 0, 0], [0, 3, 5, 6], [0, 5, 3, 4]]);
      p.compasesAcorde = 1;
      p.secciones = [['intro', 4], ['verso', 8], ['coro', 8], ['respiro', 4], ['coro', 8], ['cierre', 4]];
      // motivo de melodía de 2 compases (posiciones en semicorcheas y grados de la escala)
      p.motivo = []; let pos = 0;
      while (pos < 32) { const largo = elegir([2, 2, 4, 4, 6]); p.motivo.push({ pos, largo, g: elegir([0, 2, 4, 4, 5, 7, 6, 9]) }); pos += largo + elegir([0, 0, 2]); }
    }
    p.total = p.secciones.reduce((n, s) => n + s[1], 0);
    p.nombre = elegir(NOMBRES[estilo]) + ' · ' + NOTAS[p.raiz % 12] + 'm · ' + p.bpm + ' bpm';
    return p;
  }
  function seccionDe(compas) {
    let n = 0;
    for (const s of P.secciones) { if (compas < n + s[1]) return { nombre: s[0], local: compas - n, largo: s[1] }; n += s[1]; }
    return null;
  }

  // ---------- un paso (semicorchea) de cada estilo ----------
  function pasoEnfoque(i, t) {
    const compas = Math.floor(i / 16), s16 = i % 16, sec = seccionDe(compas); if (!sec) return 'fin';
    const negra = 60 / P.bpm, acordeG = P.prog[Math.floor(compas / P.compasesAcorde) % P.prog.length];
    const ac = acorde(P.raiz, acordeG, [6, 8]);
    const suave = sec.nombre === 'intro' || sec.nombre === 'respiro' || sec.nombre === 'cierre';
    if (s16 === 0 && compas % P.compasesAcorde === 0) {
      ac.slice(0, 4).forEach(m => nota(m - 12, t, negra * 4 * P.compasesAcorde - 0.3, { onda: 'sawtooth', desafino: [-7, 7], corte: P.corte, ataque: 1.4, rel: 1.8, vol: 0.034, eco: 0.25 }));
    }
    if (!suave && (s16 === 0 || s16 === 8)) nota(grado(P.raiz, acordeG, -2), t, negra * 1.8, { onda: 'sine', vol: 0.085, ataque: 0.03, rel: 0.3, corte: 400 });
    if (s16 % 2 === 0 && azar() < P.densidadArpegio * (suave ? 0.6 : 1)) {
      const m = elegir(ac) + elegir([0, 12, 12]);
      nota(m, t, negra * 0.25, { onda: 'triangle', vol: 0.06, rel: 0.5, corte: 3200, eco: 0.55 });
    }
    if (!suave) {
      if (s16 === 0 || s16 === 8 || (s16 === 10 && azar() < 0.3)) bombo(t, 0.17);
      if (s16 % 4 === 2) platillo(t, 0.022);
      if (s16 === 12) ruidoFiltrado(t, 0.08, 'bandpass', 2500, 0.03, 0.4);
    }
  }
  function pasoSynthwave(i, t) {
    const compas = Math.floor(i / 16), s16 = i % 16, sec = seccionDe(compas); if (!sec) return 'fin';
    const negra = 60 / P.bpm, acordeG = P.prog[compas % P.prog.length];
    const ac = acorde(P.raiz, acordeG, [7]);
    const con = n => sec.nombre === n, ritmo = !con('intro') && !con('respiro') && !con('cierre');
    if (s16 === 0) ac.slice(0, 3).forEach(m => nota(m, t, negra * 4 - 0.1, { onda: 'sawtooth', desafino: [-9, 9], corte: con('coro') ? 2200 : 1400, ataque: 0.06, rel: 0.5, vol: 0.02, eco: 0.2 }));
    // arpegio de semicorcheas (sube y baja por el acorde)
    const orden = [0, 1, 2, 3, 2, 1];
    if (!con('cierre') || sec.local < 2) nota(ac[orden[s16 % orden.length]] + 12, t, negra * 0.22, { onda: 'square', vol: con('intro') ? 0.018 : 0.026, corte: con('intro') ? 1200 + sec.local * 500 : 2600, rel: 0.08, eco: 0.35 });
    if (ritmo) {
      if (s16 % 2 === 0) { const r = grado(P.raiz, acordeG, -2) + (s16 % 4 === 2 ? 12 : 0); nota(r, t, negra * 0.42, { onda: 'sawtooth', vol: 0.07, corte: 520, barrido: 0.12, q: 4, rel: 0.06 }); }
      if (s16 % 4 === 0) bombo(t, 0.45);
      if (s16 === 4 || s16 === 12) caja(t, 0.09);
      if (s16 % 2 === 0) platillo(t, s16 % 4 === 2 ? 0.035 : 0.02, s16 === 14 && compas % 2 === 1);
    } else if (con('respiro') && s16 % 8 === 0) bombo(t, 0.25);
    if (con('coro')) {
      const enMotivo = (compas % 2) * 16 + s16;
      P.motivo.forEach(n => { if (n.pos === enMotivo) nota(grado(P.raiz, n.g, 1) + (compas % 4 >= 2 && n.g < 3 ? 12 : 0), t, negra * n.largo / 4, { onda: 'square', desafino: [0, 6], vol: 0.032, corte: 3400, ataque: 0.02, rel: 0.25, eco: 0.5 }); });
    }
  }

  // ---------- reloj de la música (programa un poquito adelantado) ----------
  function programar() {
    if (!ctx || !P) return;
    const semi = 60 / P.bpm / 4;
    while (proximo < ctx.currentTime + 0.15) {
      const r = (P.estilo === 'enfoque' ? pasoEnfoque : pasoSynthwave)(paso, proximo);
      if (r === 'fin') { arrancarPista(P.estilo, proximo + 0.6); return; }
      proximo += semi; paso++;
    }
  }
  function arrancarPista(estilo, desde) {
    P = nuevaPista(estilo); M.pista = P.nombre; M.estilo = estilo;
    eco.delayTime.setValueAtTime(60 / P.bpm * 0.75, ctx.currentTime);
    paso = 0; proximo = Math.max(desde || 0, ctx.currentTime + 0.1);
    M.alCambiar();
  }
  function volumenObjetivo() { return M.sonando ? M.volumen * (M.atenuada ? 0.35 : 1) : 0; }
  function aplicarVolumen(seg) {
    if (!ctx) return;
    const t = ctx.currentTime; master.gain.cancelScheduledValues(t);
    master.gain.setValueAtTime(master.gain.value, t); master.gain.linearRampToValueAtTime(volumenObjetivo(), t + (seg || 0.6));
  }
  async function despertar() {
    iniciarAudio();
    if (ctx.state !== 'running') { try { await Promise.race([ctx.resume(), new Promise(r => setTimeout(r, 400))]); } catch (e) {} }
    if (ctx.state !== 'running') {
      M.aviso('👆 Toca la pantalla una vez para que suene la música.', true);
      const una = () => { ctx.resume(); document.removeEventListener('pointerdown', una); };
      document.addEventListener('pointerdown', una);
    }
  }

  async function reproducir(estilo) {
    await despertar();
    if (!P || P.estilo !== estilo) arrancarPista(estilo);
    M.sonando = true; guardarL('encendida', true);
    clearInterval(timer); timer = setInterval(programar, 30);
    aplicarVolumen(1.2); M.alCambiar();
  }
  function pausar() {
    M.sonando = false; guardarL('encendida', false); aplicarVolumen(0.5);
    setTimeout(() => { if (!M.sonando) clearInterval(timer); }, 600);
    M.alCambiar();
  }
  function alternar(estilo) { return M.sonando ? pausar() : reproducir(estilo); }
  function siguiente(estilo) {
    if (!ctx) return reproducir(estilo);
    master.gain.setTargetAtTime(0, ctx.currentTime, 0.15);
    setTimeout(() => { arrancarPista(estilo || M.estilo); aplicarVolumen(1); }, 500);
    if (!M.sonando) reproducir(estilo);
  }
  // Al cambiar de lugar: cambia de estilo con un fundido (si la música está encendida)
  function lugar(estilo) {
    if (!M.sonando || (P && P.estilo === estilo)) { M.estilo = estilo; return; }
    master.gain.setTargetAtTime(0, ctx.currentTime, 0.2);
    setTimeout(() => { arrancarPista(estilo); aplicarVolumen(1.5); }, 700);
  }
  function atenuar(si) { M.atenuada = !!si; aplicarVolumen(0.4); }
  function cambiarVolumen() {
    const pasos = [0.35, 0.7, 1];
    M.volumen = pasos[(pasos.indexOf(M.volumen) + 1) % pasos.length] || 0.7;
    guardarL('volumen', M.volumen); aplicarVolumen(0.3); M.alCambiar();
    return M.volumen;
  }
  // Si la pestaña se oculta, la música se pausa sola y vuelve al regresar
  document.addEventListener('visibilitychange', () => { if (!ctx) return; if (document.hidden) ctx.suspend(); else if (M.sonando) ctx.resume(); });

  // Nivel de sonido actual (0 = silencio). Sirve para comprobar que la música suena.
  function nivel() { if (!medidor) return 0; const d = new Float32Array(medidor.fftSize); medidor.getFloatTimeDomainData(d); let s = 0, pico = 0; d.forEach(v => { s += v * v; pico = Math.max(pico, Math.abs(v)); }); return { rms: +Math.sqrt(s / d.length).toFixed(3), pico: +pico.toFixed(3), estado: ctx.state }; }
  // Para grabar una muestra (pruebas): devuelve el audio de salida como un stream
  function _stream() { const d = ctx.createMediaStreamDestination(); salida.connect(d); return d.stream; }
  Object.assign(M, { _stream, nivel, reproducir, pausar, alternar, siguiente, lugar, atenuar, cambiarVolumen, quiereSonar: () => leerL('encendida', false) });
  window.MUSICA = M;
})();
