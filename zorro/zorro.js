const c = document.getElementById('c'), g = c.getContext('2d');
const W = c.width, H = c.height, GROUND = 150, FX = 50, FW = 34, FH = 46;
const foxImgs = ['zorro-robot', 'zorro-robot-2', 'zorro-robot-3', 'zorro-robot-4'].map(n => '../assets/' + n + '.png').map(src => { const i = new Image(); i.src = src; return i; });
let fox, obs, speed, score, best = loadBest('zorro'), over, overAt, started, held = false, nextGap, scroll, t = 0;

function reset() {
  fox = { y: 0, v: 0, jumps: 0 };   // y = altura sobre el suelo
  obs = []; speed = 5; score = 0; over = false; started = false; nextGap = 0; scroll = 0;
  pickLights();
}

function press() {
  held = true;
  if (over) { if (performance.now() - overAt > 500) reset(); return; }
  started = true;
  if (fox.jumps < 2) { fox.v = fox.jumps ? 9 : 10; fox.jumps++; }
}
function release() { held = false; }

c.addEventListener('pointerdown', press);
addEventListener('pointerup', release);
addEventListener('pointercancel', release);

function spawn() {
  obs.push(Math.random() < 0.5
    ? { kind: 'roca', x: W, w: 30 + Math.random() * 16, h: 18 + Math.random() * 10 }
    : { kind: 'tronco', x: W, w: 18, h: 36 + Math.random() * 14 });
  // separación mínima proporcional a la velocidad para que siempre se pueda pasar
  nextGap = speed * 45 + Math.random() * speed * 50;
}

function update() {
  t++;
  if (!started || over) return;
  // gravedad menor mientras se mantiene el botón y el zorro sube
  fox.v -= held && fox.v > 0 ? 0.45 : 0.9;
  fox.y += fox.v;
  if (fox.y <= 0) { fox.y = 0; fox.v = 0; fox.jumps = 0; }

  const last = obs[obs.length - 1];
  if (!last || W - last.x > nextGap) spawn();
  for (const o of obs) {
    o.x -= speed;
    if (FX + FW - 4 > o.x + 3 && FX + 4 < o.x + o.w - 3 && fox.y < o.h - 3) {
      over = true; overAt = performance.now();
      if (Math.floor(score) > best) { best = Math.floor(score); saveBest('zorro', best); }
    }
  }
  obs = obs.filter(o => o.x > -o.w);
  scroll += speed;
  speed = Math.min(13, speed + 0.003);
  score += speed / 30;
}

function drawFox(x, base) {
  // robot corredor: ciclo de 4 cuadros que avanza con la distancia recorrida; en el aire o parado, una sola pose
  const running = fox.y === 0 && started && !over;
  const img = foxImgs[running ? Math.floor(scroll / 24) % 4 : 0];
  if (img.complete) g.drawImage(img, x - 1, base - FH, 38, 47);
}

// Estadio: gradas con público y torres de luz (lentas), vallas publicitarias y pista (a la velocidad del suelo).
const PS = 720;   // periodo del fondo, múltiplo de 6
const rndS = seeded(5);
const crowdColors = ['#f4c542', '#e5252a', '#ffffff', '#3da5ff', '#ff9a4a', '#8bd17c'];
const crowd = Array.from({ length: PS / 6 * 7 }, () => ({ c: crowdColors[Math.floor(rndS() * crowdColors.length)], r: rndS() }));
const FEET = GROUND + 12;   // los pies se dibujan dentro del carril; la colisión usa GROUND
const STAND_TOP = GROUND - 74, STAND_BOT = GROUND - 18;

function wrap(v, p) { return ((v % p) + p) % p; }

// Fases del día: mañana → mediodía → noche → mañana, según los puntos (cada fase dura 200 pts y
// la transición los últimos 40). Para ver una sola fase: zorro.html?fase=manana | mediodia | noche
const SUN_LOW = STAND_TOP - 2;
const PHASES = {
  manana: { skyTop: '#6f8fd0', skyBot: '#ffc9a0', pole: '#8a8fa8', head: '#e8e2e0', lamp: '#fff6c2', stand: '#4a4560', roof: '#a397b0',
    trackTop: '#c0472e', trackBot: '#d8603e', lane: '#fbf3ea', cloud: '#ffe3d6', cloudA: 0.75, dim: 0.12, night: 0, beam: 0.4,
    sunX: 130, sunY: SUN_LOW, sunR: 22, sunIn: '#fff1c4', sunOut: '#ffb067', sunA: 1 },
  mediodia: { skyTop: '#5fb6ee', skyBot: '#d6f0ff', pole: '#7d8aa6', head: '#e8edf7', lamp: '#fff6c2', stand: '#3b4660', roof: '#8b97b3',
    trackTop: '#b8402a', trackBot: '#d4593a', lane: '#f2f3f7', cloud: '#ffffff', cloudA: 0.7, dim: 0, night: 0, beam: 0,
    sunX: 250, sunY: 30, sunR: 13, sunIn: '#ffffff', sunOut: '#fff3b0', sunA: 1 },
  noche: { skyTop: '#070b22', skyBot: '#1d2b5a', pole: '#3a4460', head: '#9aa6c4', lamp: '#ffffff', stand: '#1a2034', roof: '#3a4460',
    trackTop: '#5a2420', trackBot: '#6e2c22', lane: '#b9bfd0', cloud: '#c8d0e8', cloudA: 0.15, dim: 0.5, night: 1, beam: 1,
    sunX: 600, sunY: SUN_LOW, sunR: 22, sunIn: '#ffd9a0', sunOut: '#ff8a50', sunA: 0 },
};
const ORDER = ['manana', 'mediodia', 'noche'];
const FORCED = (location.search.match(/[?&]fase=(manana|mediodia|noche)\b/) || [])[1] || (/[?&]noche\b/.test(location.search) ? 'noche' : null);

function mix(c1, c2, k) {
  const p = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
  const A = p(c1), B = p(c2);
  return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * k).toString(16).padStart(2, '0')).join('');
}
function blend(A, B, k) {
  const o = {};
  for (const key in A) o[key] = typeof A[key] === 'number' ? A[key] + (B[key] - A[key]) * k : mix(A[key], B[key], k);
  return o;
}
function currentPhase() {
  if (FORCED) return PHASES[FORCED];
  const c = score % 600, i = Math.floor(c / 200), within = c - i * 200;
  const k = within < 160 ? 0 : (v => v * v * (3 - 2 * v))((within - 160) / 40);
  return blend(PHASES[ORDER[i]], PHASES[ORDER[(i + 1) % 3]], k);
}
const nightStars = Array.from({ length: 40 }, ((r) => () => ({ x: r() * W, y: r() * (STAND_TOP - 10), s: 0.6 + r() * 1.2, p: r() * 6 }))(seeded(17)));
const towerX = [90, 450];

// Puntos de colores en las gradas: cuántos lugares se ven ocupados.
// Cada partida elige un nivel al azar; para fijarlo: zorro.html?luces=minimas | pocas | intermedias | todas
const CROWD_LEVELS = { minimas: 0.08, pocas: 0.25, intermedias: 0.6, todas: 1 };
const FORCED_LIGHTS = (location.search.match(/[?&]luces=(minimas|pocas|intermedias|todas)\b/) || [])[1];
let crowdFrac;
function pickLights() {
  const names = Object.keys(CROWD_LEVELS);
  crowdFrac = CROWD_LEVELS[FORCED_LIGHTS || names[Math.floor(Math.random() * names.length)]];
}

function drawStadium(P) {
  const n = P.night;
  const sky = g.createLinearGradient(0, 0, 0, GROUND);
  sky.addColorStop(0, P.skyTop); sky.addColorStop(1, P.skyBot);
  g.fillStyle = sky; g.fillRect(0, 0, W, GROUND);
  if (n > 0) {
    for (const st of nightStars) { g.fillStyle = 'rgba(255,255,255,' + (n * (0.5 + 0.4 * Math.sin(t / 25 + st.p))) + ')'; g.fillRect(st.x, st.y, st.s, st.s); }
    g.save(); g.globalAlpha = n;
    g.shadowColor = '#fff6d8'; g.shadowBlur = 18; g.fillStyle = '#fff6d8';
    g.beginPath(); g.arc(380, 34, 13, 0, Math.PI * 2); g.fill();
    g.shadowBlur = 0; g.fillStyle = P.skyTop;
    g.beginPath(); g.arc(386, 30, 11, 0, Math.PI * 2); g.fill();
    g.restore();
  }
  // sol con halo (bajo y anaranjado en la mañana, alto y blanco al mediodía)
  if (P.sunA > 0.01) {
    g.save(); g.globalAlpha = P.sunA;
    const halo = g.createRadialGradient(P.sunX, P.sunY, P.sunR * 0.5, P.sunX, P.sunY, P.sunR * 4);
    halo.addColorStop(0, P.sunOut); halo.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = halo; g.globalAlpha = P.sunA * 0.45; g.fillRect(P.sunX - P.sunR * 4, P.sunY - P.sunR * 4, P.sunR * 8, P.sunR * 8);
    const disc = g.createRadialGradient(P.sunX, P.sunY, 1, P.sunX, P.sunY, P.sunR);
    disc.addColorStop(0, P.sunIn); disc.addColorStop(1, P.sunOut);
    g.globalAlpha = P.sunA; g.fillStyle = disc;
    g.beginPath(); g.arc(P.sunX, P.sunY, P.sunR, 0, Math.PI * 2); g.fill();
    g.restore();
  }
  // nubes lentas
  g.save(); g.globalAlpha = P.cloudA; g.fillStyle = P.cloud;
  for (let i = 0; i < 4; i++) {
    const x = wrap(i * 190 - scroll * 0.05 - t * 0.05, W + 120) - 60, y = 22 + (i % 2) * 22;
    for (const [dx, dy, r] of [[-14, 3, 9], [0, -3, 13], [15, 2, 10]]) { g.beginPath(); g.arc(x + dx, y + dy, r, 0, Math.PI * 2); g.fill(); }
  }
  g.restore();
  const off = -wrap(scroll * 0.25, PS);
  // torres de luz
  for (let k = 0; k < 3; k++) towerX.forEach((tx, j) => {
    const x = tx + off + k * PS;
    if (x < -30 || x > W + 30) return;
    g.fillStyle = P.pole; g.fillRect(x - 2, 20, 4, STAND_TOP - 20);
    g.fillStyle = P.head; g.fillRect(x - 15, 12, 30, 12);
    g.save();
    if (P.beam > 0) { g.shadowColor = '#fffbe0'; g.shadowBlur = 22 * P.beam; }
    g.fillStyle = P.lamp; for (let i = 0; i < 4; i++) g.fillRect(x - 13 + i * 7, 14, 5, 8);
    g.restore();
  });
  // gradas
  g.fillStyle = P.stand; g.fillRect(0, STAND_TOP, W, STAND_BOT - STAND_TOP);
  g.fillStyle = P.roof; g.fillRect(0, STAND_TOP - 4, W, 4);
  const c0 = Math.floor(-off / 6);
  for (let col = c0; col <= c0 + W / 6 + 1; col++) {
    const x = col * 6 + off + 3;
    for (let row = 0; row < 7; row++) {
      const seat = crowd[wrap(col, PS / 6) * 7 + row];
      if (seat.r >= crowdFrac) continue;
      g.fillStyle = seat.c;
      g.beginPath(); g.arc(x, STAND_TOP + 5 + row * 7, 2.2, 0, Math.PI * 2); g.fill();
    }
  }
  g.fillStyle = 'rgba(0,0,0,0.25)';
  for (let row = 1; row < 7; row++) g.fillRect(0, STAND_TOP + row * 7 + 1, W, 1);
  if (P.dim > 0) { g.fillStyle = 'rgba(6,10,30,' + P.dim + ')'; g.fillRect(0, STAND_TOP, W, STAND_BOT - STAND_TOP); }
  if (n > 0) {
    // flashes de cámaras en el público
    for (let i = 0; i < Math.round(5 * crowdFrac); i++) {
      const h = Math.sin((Math.floor(t / 4) + i * 37) * 12.9898) * 43758.5453, r = h - Math.floor(h);
      if (r > 0.55) continue;
      const fx = wrap(r * 1777 + off, W), fy = STAND_TOP + 4 + Math.floor(r * 97) % 7 * 7;
      g.save(); g.globalAlpha = n; g.shadowColor = '#fff'; g.shadowBlur = 8; g.fillStyle = '#fff';
      g.beginPath(); g.arc(fx, fy, 2, 0, Math.PI * 2); g.fill(); g.restore();
    }
  }
}

function drawTrack(P) {
  const n = P.night;
  // vallas publicitarias (de noche son pantallas encendidas)
  const bo = -wrap(scroll, 160);
  g.save();
  if (n > 0) { g.shadowColor = '#e5252a'; g.shadowBlur = 10 * n; }
  for (let x = bo - 160; x < W + 160; x += 80) {
    const red = Math.round((x - bo) / 80) % 2 === 0;
    g.fillStyle = red ? '#e5252a' : '#f2f3f7'; g.fillRect(x, GROUND - 16, 80, 15);
    g.fillStyle = red ? '#f2f3f7' : '#e5252a'; g.fillRect(x + 10, GROUND - 11, 60, 5);
  }
  g.restore();
  g.fillStyle = '#1b1c26'; g.fillRect(0, GROUND - 1, W, 1);
  // pista
  const tr = g.createLinearGradient(0, GROUND, 0, H);
  tr.addColorStop(0, P.trackTop); tr.addColorStop(1, P.trackBot);
  g.fillStyle = tr; g.fillRect(0, GROUND, W, H - GROUND);
  g.fillStyle = 'rgba(0,0,0,0.12)';
  for (let i = 0; i < 40; i++) g.fillRect(wrap(i * 53 - scroll, W + 20) - 10, GROUND + 6 + (i * 7) % (H - GROUND - 8), 3, 1.5);
  // líneas de carril
  g.fillStyle = P.lane;
  for (const y of [GROUND + 2, GROUND + 18, GROUND + 34, H - 3]) if (y < H) g.fillRect(0, y, W, 2);
  // marcas de distancia en la pista
  for (let k = 0; k < 6; k++) {
    const x = wrap(k * 160 - scroll, W + 160) - 80;
    g.beginPath(); g.moveTo(x, GROUND + 20); g.lineTo(x + 4, GROUND + 20); g.lineTo(x + 1, GROUND + 33); g.lineTo(x - 3, GROUND + 33); g.fill();
  }
}

// De noche, haces de luz de las torres sobre la pista.
function drawFloodlight(n) {
  if (n <= 0) return;
  const off = -wrap(scroll * 0.25, PS);
  g.save(); g.globalCompositeOperation = 'lighter';
  for (let k = 0; k < 3; k++) towerX.forEach((tx, j) => {
    const x = tx + off + k * PS;
    if (x < -160 || x > W + 160) return;
    const beam = g.createLinearGradient(0, 18, 0, H);
    beam.addColorStop(0, 'rgba(255,248,220,' + 0.22 * n + ')'); beam.addColorStop(1, 'rgba(255,248,220,' + 0.06 * n + ')');
    g.fillStyle = beam;
    g.beginPath(); g.moveTo(x - 12, 22); g.lineTo(x + 12, 22); g.lineTo(x + 120, H); g.lineTo(x - 30, H); g.fill();
  });
  g.restore();
}

function drawObstacle(o) {
  // valla blanca con contorno oscuro, para que se distinga sobre los paneles rojos y blancos; la alta lleva una segunda barra
  const x = o.x, y = FEET - o.h;
  const bars = o.kind === 'roca' ? [y] : [y, y + o.h * 0.5];
  // sombra sobre la pista
  g.fillStyle = 'rgba(0,0,0,0.25)';
  g.beginPath(); g.ellipse(x + o.w / 2, FEET, o.w / 2 + 3, 3, 0, 0, Math.PI * 2); g.fill();
  const parts = [[x + 1, y, 4, o.h], [x + o.w - 5, y, 4, o.h], ...bars.map(by => [x, by, o.w, 7])];
  g.fillStyle = '#1b1c26';
  for (const [px, py, pw, ph] of parts) g.fillRect(px - 1.5, py - 1.5, pw + 3, ph + 3);
  g.fillStyle = '#ffffff';
  for (const [px, py, pw, ph] of parts) g.fillRect(px, py, pw, ph);
  // bases
  g.fillStyle = '#1b1c26'; g.fillRect(x - 2, FEET - 3, 8, 3); g.fillRect(x + o.w - 6, FEET - 3, 8, 3);
}

function draw() {
  const P = currentPhase();
  drawStadium(P);
  drawTrack(P);
  for (const o of obs) drawObstacle(o);
  drawFox(FX, FEET - fox.y);
  drawFloodlight(P.beam);

  // marcador sobre una píldora oscura para que se lea en cualquier fase
  g.fillStyle = 'rgba(10,12,24,0.45)';
  g.beginPath(); g.roundRect(W - 214, 8, 206, 24, 12); g.fill();
  g.fillStyle = '#fff'; g.font = '16px monospace'; g.textAlign = 'right';
  g.fillText('REC ' + String(best).padStart(5, '0') + '   ' + String(Math.floor(score)).padStart(5, '0'), W - 18, 25);
  if (!started) drawMessage(g, 'Robot Veloz', 'Haz clic para empezar');
  if (over) drawMessage(g, '¡Tropezaste! ' + Math.floor(score) + ' pts', 'Haz clic para jugar otra vez');
}

reset(); startLoop(update, draw);
