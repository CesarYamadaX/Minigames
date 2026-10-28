const c = document.getElementById('c'), g = c.getContext('2d');
const W = c.width, H = c.height, CW = 54, BX = 70, R = 10;
const batImg = new Image(); batImg.src = '../assets/cueva-avioneta.png';
let bgx = 0;
let bat, cols, score, best = loadBest('cueva'), over, overAt, started, frame;

function reset() {
  bat = { y: H / 2, v: 0, wing: 0 };
  cols = []; score = 0; over = false; started = false; frame = 0; bgx = 0;
}

function flap() {
  if (over) { if (performance.now() - overAt > 500) reset(); return; }
  started = true;
  bat.v = -6;
}

c.addEventListener('pointerdown', flap);

function die() {
  if (over) return;
  over = true; overAt = performance.now();
  if (score > best) { best = score; saveBest('cueva', best); }
}

function update() {
  bgx += over ? 0 : (started ? 2 : 0.4);
  bat.wing += bat.v < 0 ? 0.5 : 0.15;
  if (!started) { bat.y = H / 2 + Math.sin(frame++ / 20) * 6; return; }
  if (over) { bat.v += 0.35; bat.y = Math.min(H - R, bat.y + bat.v); return; }
  bat.v = Math.min(9, bat.v + 0.35);
  bat.y += bat.v;
  // el hueco se cierra poco a poco con los puntos
  const gap = Math.max(100, 140 - score * 2);
  if (frame++ % 90 === 0) cols.push({ x: W, top: 50 + Math.random() * (H - gap - 100), gap, passed: false });
  for (const p of cols) {
    p.x -= 2;
    if (!p.passed && p.x + CW < BX) { p.passed = true; score++; }
    // 4 px de margen porque las puntas de roca no llenan el rectángulo
    if (BX + R > p.x && BX - R < p.x + CW && (bat.y - R < p.top - 4 || bat.y + R > p.top + p.gap + 4)) die();
  }
  cols = cols.filter(p => p.x > -CW);
  if (bat.y - R < 0 || bat.y + R > H) die();
}

// Fases del día: mañana → mediodía → noche → mañana, según la distancia recorrida (cada fase dura
// 10 columnas y la transición las 2 últimas). Para ver una sola fase: cueva.html?fase=manana | mediodia | noche
const PHASES = {
  manana: { skyTop: '#6f8fd0', skyMid: '#f2a7a0', skyBot: '#ffd9a8', mesaFar: '#c47a86', mesaNear: '#9a5470',
    rockLight: '#d0703f', rock: '#a6482f', rockShadow: '#62292a', sunX: W * 0.25, sunY: H * 0.72, sunR: 24, sunIn: '#fff1c4', sunOut: '#ffb067', sunA: 1, cloudA: 0.95, night: 0 },
  mediodia: { skyTop: '#3f9de6', skyMid: '#7cc4f2', skyBot: '#cfeeff', mesaFar: '#d7956c', mesaNear: '#b56c4a',
    rockLight: '#d47a48', rock: '#ad5434', rockShadow: '#6b2e25', sunX: W * 0.72, sunY: 80, sunR: 16, sunIn: '#ffffff', sunOut: '#fff3b0', sunA: 1, cloudA: 1, night: 0 },
  noche: { skyTop: '#050819', skyMid: '#121b42', skyBot: '#26315f', mesaFar: '#2a2f55', mesaNear: '#1c1f3d',
    rockLight: '#5e3f45', rock: '#46303a', rockShadow: '#24182a', sunX: W * 1.1, sunY: H * 0.72, sunR: 24, sunIn: '#ffd9a0', sunOut: '#ff8a50', sunA: 0, cloudA: 0.28, night: 1 },
};
const ORDER = ['manana', 'mediodia', 'noche'], PHASE_LEN = 1800, FADE = 360;
const FORCED = (location.search.match(/[?&]fase=(manana|mediodia|noche)\b/) || [])[1];
function mix(c1, c2, k) {
  const p = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
  const A = p(c1), B = p(c2);
  return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * k).toString(16).padStart(2, '0')).join('');
}
function currentPhase() {
  if (FORCED) return PHASES[FORCED];
  const c = bgx % (PHASE_LEN * 3), i = Math.floor(c / PHASE_LEN), within = c - i * PHASE_LEN;
  const k = within < PHASE_LEN - FADE ? 0 : (v => v * v * (3 - 2 * v))((within - PHASE_LEN + FADE) / FADE);
  const A = PHASES[ORDER[i]], B = PHASES[ORDER[(i + 1) % 3]], o = {};
  for (const key in A) o[key] = typeof A[key] === 'number' ? A[key] + (B[key] - A[key]) * k : mix(A[key], B[key], k);
  return o;
}

// Fondo: nubes (imágenes) y mesetas lejanas que se desplazan más lento que las columnas.
const cloudImgs = [1, 2, 3, 4].map(n => { const i = new Image(); i.src = '../assets/cueva-nube-' + n + '.png'; return i; });
const rnd = seeded(7);
const clouds = Array.from({ length: 6 }, (_, i) => ({ img: i % 4, x: rnd() * (W + 160), y: 24 + rnd() * (H - 240), s: 0.55 + rnd() * 0.45 }));
const stars = Array.from({ length: 45 }, () => ({ x: rnd() * W, y: rnd() * H * 0.7, s: 0.6 + rnd() * 1.3, p: rnd() * 6 }));
const mesas = []; let mesaEnd = 0;
while (mesaEnd < W * 1.6) { const w = 40 + rnd() * 70; mesas.push({ x: mesaEnd, w, h: 50 + rnd() * 90 }); mesaEnd += w + 10 + rnd() * 30; }
let P = PHASES.manana;

function drawBackground() {
  P = currentPhase();
  const sky = g.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, P.skyTop); sky.addColorStop(0.55, P.skyMid); sky.addColorStop(1, P.skyBot);
  g.fillStyle = sky; g.fillRect(0, 0, W, H);
  if (P.night > 0) {
    for (const st of stars) { g.fillStyle = 'rgba(255,255,255,' + (P.night * (0.5 + 0.4 * Math.sin(frame / 25 + st.p))) + ')'; g.fillRect(st.x, st.y, st.s, st.s); }
    g.save(); g.globalAlpha = P.night;
    g.shadowColor = '#fff6d8'; g.shadowBlur = 20; g.fillStyle = '#fff6d8';
    g.beginPath(); g.arc(W * 0.7, 90, 16, 0, Math.PI * 2); g.fill();
    g.shadowBlur = 0; g.fillStyle = P.skyTop;
    g.beginPath(); g.arc(W * 0.7 + 7, 85, 13, 0, Math.PI * 2); g.fill();
    g.restore();
  }
  if (P.sunA > 0.01) {
    g.save(); g.globalAlpha = P.sunA * 0.5;
    const halo = g.createRadialGradient(P.sunX, P.sunY, P.sunR * 0.5, P.sunX, P.sunY, P.sunR * 4.5);
    halo.addColorStop(0, P.sunOut); halo.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = halo; g.fillRect(P.sunX - P.sunR * 5, P.sunY - P.sunR * 5, P.sunR * 10, P.sunR * 10);
    g.globalAlpha = P.sunA;
    const disc = g.createRadialGradient(P.sunX, P.sunY, 1, P.sunX, P.sunY, P.sunR);
    disc.addColorStop(0, P.sunIn); disc.addColorStop(1, P.sunOut);
    g.fillStyle = disc; g.beginPath(); g.arc(P.sunX, P.sunY, P.sunR, 0, Math.PI * 2); g.fill();
    g.restore();
  }
  g.save(); g.globalAlpha = P.cloudA;
  for (const cl of clouds) {
    const img = cloudImgs[cl.img];
    if (!img.complete) continue;
    const w = img.width / 2 * cl.s, h = img.height / 2 * cl.s;
    const x = ((cl.x - bgx * 0.35 * cl.s) % (W + 160) + W + 160) % (W + 160) - 80;
    g.drawImage(img, x - w / 2, cl.y, w, h);
  }
  g.restore();
  for (const [layer, f, col] of [[0, 0.18, P.mesaFar], [1, 0.35, P.mesaNear]]) {
    const off = -((bgx * f + layer * 90) % mesaEnd);
    g.fillStyle = col;
    for (let k = 0; k < 2; k++) for (const m of mesas) {
      const x = m.x + off + k * mesaEnd, h = m.h * (layer ? 0.7 : 1);
      if (x > W || x + m.w < 0) continue;
      g.beginPath(); g.moveTo(x, H); g.lineTo(x + 5, H - h); g.lineTo(x + m.w - 5, H - h); g.lineTo(x + m.w, H); g.fill();
    }
  }
}

// dir -1: columna que cuelga del techo; dir 1: columna que sale del suelo
function drawRock(x, edge, dir) {
  const far = dir < 0 ? 0 : H, t = 14;
  const grad = g.createLinearGradient(x, 0, x + CW, 0);
  grad.addColorStop(0, P.rockLight); grad.addColorStop(0.45, P.rock); grad.addColorStop(1, P.rockShadow);
  g.fillStyle = grad;
  g.beginPath();
  g.moveTo(x, far);
  g.lineTo(x, edge + dir * t);
  g.lineTo(x + CW * 0.25, edge);
  g.lineTo(x + CW * 0.5, edge + dir * t * 0.6);
  g.lineTo(x + CW * 0.75, edge);
  g.lineTo(x + CW, edge + dir * t);
  g.lineTo(x + CW, far);
  g.fill();
  g.save(); g.clip();
  g.strokeStyle = 'rgba(55,18,24,0.35)'; g.lineWidth = 2;
  for (let y = 10; y < H; y += 22) { g.beginPath(); g.moveTo(x, y); g.lineTo(x + CW, y + 4); g.stroke(); }
  g.fillStyle = 'rgba(255,205,160,0.28)';
  g.fillRect(x, Math.min(far, edge), 4, H);
  g.restore();
}

function drawBat(x, y) {
  // avioneta; se inclina según suba o baje
  if (!batImg.complete) return;
  g.save();
  g.translate(x, y); g.rotate(Math.max(-0.4, Math.min(0.5, bat.v * 0.06)));
  g.drawImage(batImg, -27, -22, 54, 44);
  g.restore();
}

function draw() {
  drawBackground();
  for (const p of cols) { drawRock(p.x, p.top, -1); drawRock(p.x, p.top + p.gap, 1); }
  drawBat(BX, bat.y);
  g.fillStyle = '#fff'; g.textAlign = 'center'; g.font = 'bold 32px system-ui, sans-serif';
  if (started) g.fillText(score, W / 2, 50);
  g.textAlign = 'right'; g.font = '14px system-ui, sans-serif';
  g.fillText('Récord ' + best, W - 10, 22);
  if (!started) drawMessage(g, 'Vuelo en el Cañón', 'Haz clic para empezar');
  if (over) drawMessage(g, '¡Chocaste! ' + score + ' pts', 'Haz clic para jugar otra vez');
}

reset(); startLoop(update, draw);
