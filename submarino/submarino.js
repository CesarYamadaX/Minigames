const c = document.getElementById('c'), g = c.getContext('2d');
const W = c.width, H = c.height, CW = 50, SX = 70, R = 11;
const subImg = new Image(); subImg.src = '../assets/submarino.png';
let critters = [], nextCritter = 60;
let sub, cols, bubbles, score, best = loadBest('submarino'), over, overAt, started, frame, spawn, targetY = H / 2;

function setPointer(e) { const r = c.getBoundingClientRect(); targetY = (e.clientY - r.top) / r.height * H; }
c.addEventListener('pointermove', setPointer);
c.addEventListener('pointerdown', e => {
  setPointer(e);
  if (over) { if (performance.now() - overAt > 500) reset(); return; }
  started = true;
});

function reset() {
  sub = { y: H / 2, tilt: 0 };
  cols = []; bubbles = []; score = 0; over = false; started = false; frame = 0; spawn = 0;
  critters = []; nextCritter = 60 + Math.random() * 240;   // el primero, de 1 a 5 s después de llegar a CRITTERS_AT
}

function die() {
  if (over) return;
  over = true; overAt = performance.now();
  if (score > best) { best = score; saveBest('submarino', best); }
}

function update() {
  frame++;
  updateCritters();
  if (over) { sub.y = Math.min(H - R, sub.y + 2); return; }
  // sigue al ratón con velocidad máxima limitada, para que haya que anticiparse
  const dy = Math.max(-8, Math.min(8, (targetY - sub.y) * 0.25));
  sub.y = Math.max(R, Math.min(H - R, sub.y + dy));
  sub.tilt = dy / 16;
  if (frame % 6 === 0) bubbles.push({ x: SX - 18, y: sub.y + 2, r: 2 + Math.random() * 2, life: 60 });
  for (const b of bubbles) { b.x -= 3; b.y -= 0.8; b.life--; }
  bubbles = bubbles.filter(b => b.life > 0);
  if (!started) return;

  // huecos más estrechos con los puntos; desde 5 puntos empiezan a moverse
  const gap = Math.max(110, 150 - score * 2);
  if (spawn++ % 45 === 0) cols.push({
    x: W, top: 60 + Math.random() * (H - gap - 120), gap, passed: false,
    drift: score >= 5 ? (Math.random() < 0.5 ? -1 : 1) * Math.min(3.5, 1 + score * 0.08) : 0,
  });
  for (const p of cols) {
    p.x -= 4.5;
    p.top += p.drift;
    if (p.top < 30 || p.top + p.gap > H - 30) p.drift *= -1;
    if (!p.passed && p.x + CW < SX) { p.passed = true; score++; }
    if (SX + R > p.x && SX - R < p.x + CW && (sub.y - R < p.top || sub.y + R > p.top + p.gap)) die();
  }
  cols = cols.filter(p => p.x > -CW);
}

// Animales marinos que cruzan el fondo de vez en cuando, por detrás de las rocas, desde CRITTERS_AT puntos.
const CRITTERS_AT = 15;
const CRITTERS = [
  { name: 'pez', v: 1.6, bob: 0.4 }, { name: 'tortuga', v: 0.9, bob: 0.5 }, { name: 'medusa', v: 0.45, bob: 1.6 },
  { name: 'pulpo', v: 0.7, bob: 1.0 }, { name: 'mantarraya', v: 1.1, bob: 0.6 }, { name: 'ballena', v: 0.55, bob: 0.3 },
].map(cr => { const i = new Image(); i.src = '../assets/submarino-' + cr.name + '.png'; return { ...cr, img: i }; });
function updateCritters() {
  if (score >= CRITTERS_AT && --nextCritter <= 0 && critters.length < 2) {
    const kind = CRITTERS[Math.floor(Math.random() * CRITTERS.length)];
    const s = kind.name === 'ballena' ? 0.55 : 0.5;
    critters.push({ kind, s, x: W + 20, y: 50 + Math.random() * (H - 220), ph: Math.random() * 6 });
    nextCritter = 240 + Math.random() * 300;   // entre 4 y 9 segundos
  }
  for (const cr of critters) cr.x -= cr.kind.v;
  critters = critters.filter(cr => cr.x > -(cr.kind.img.width || 300) * cr.s - 20);
}
function drawCritters() {
  g.save(); g.globalAlpha = 0.85;
  for (const cr of critters) {
    const img = cr.kind.img;
    if (!img.complete) continue;
    const y = cr.y + Math.sin(frame / 40 + cr.ph) * 6 * cr.kind.bob;
    g.drawImage(img, cr.x, y, img.width * cr.s, img.height * cr.s);
  }
  g.restore();
}

// Fondo marino: luz en la superficie, rayos, arrecife lejano, plancton y fondo con corales y algas.
const rnd = seeded(3);
const plankton = Array.from({ length: 40 }, () => ({ x: rnd() * W, y: rnd() * H, r: 0.6 + rnd() * 1.4, v: 0.1 + rnd() * 0.3, ph: rnd() * 6 }));
const reef = Array.from({ length: 14 }, (_, i) => ({ x: i * 46 + rnd() * 20, kind: Math.floor(rnd() * 3), h: 28 + rnd() * 24, c: ['#e86a8a', '#f2994a', '#9b6fd6'][Math.floor(rnd() * 3)] }));
const REEF_P = 14 * 46;
const kelp = Array.from({ length: 9 }, (_, i) => ({ x: i * 72 + rnd() * 30, h: 70 + rnd() * 90, ph: rnd() * 6 }));
const KELP_P = 9 * 72;

function drawBackground() {
  const sea = g.createLinearGradient(0, 0, 0, H);
  sea.addColorStop(0, '#3ab0e8'); sea.addColorStop(0.35, '#1a6fb8'); sea.addColorStop(0.7, '#0d3f7a'); sea.addColorStop(1, '#061a36');
  g.fillStyle = sea; g.fillRect(0, 0, W, H);
  // superficie: reflejos ondulados
  g.strokeStyle = 'rgba(255,255,255,0.18)'; g.lineWidth = 2;
  for (let k = 0; k < 4; k++) {
    g.beginPath();
    for (let x = 0; x <= W; x += 8) g.lineTo(x, 8 + k * 9 + Math.sin(x / 22 + frame / 30 + k * 2) * 3);
    g.stroke();
  }
  // rayos de luz que se balancean
  for (let i = 0; i < 5; i++) {
    const x0 = i * W / 4 - 30 + Math.sin(frame / 90 + i * 1.7) * 22;
    const ray = g.createLinearGradient(0, 0, 0, H * 0.85);
    ray.addColorStop(0, 'rgba(255,255,255,0.16)'); ray.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = ray;
    g.beginPath(); g.moveTo(x0, 0); g.lineTo(x0 + 30, 0); g.lineTo(x0 + 110, H * 0.85); g.lineTo(x0 + 56, H * 0.85); g.fill();
  }
  // arrecife lejano (silueta)
  g.fillStyle = 'rgba(8,40,84,0.55)'; g.beginPath(); g.moveTo(0, H);
  for (let x = 0; x <= W; x += 6) g.lineTo(x, H - 90 - Math.sin((x + frame * 0.25) / 37) * 16 - Math.sin((x + frame * 0.25) / 13) * 6);
  g.lineTo(W, H); g.fill();
  drawCritters();
  // algas altas que se mecen
  const ko = (frame * 0.5) % KELP_P;
  g.lineCap = 'round';
  for (let k = 0; k < 2; k++) for (const kl of kelp) {
    const x = kl.x - ko + k * KELP_P;
    if (x < -20 || x > W + 20) continue;
    g.strokeStyle = '#1f7a4d'; g.lineWidth = 6; g.beginPath(); g.moveTo(x, H);
    for (let t = 0; t <= 1; t += 0.1) g.lineTo(x + Math.sin(frame / 35 + kl.ph + t * 3) * 10 * t, H - kl.h * t);
    g.stroke();
    g.strokeStyle = '#2ea56a'; g.lineWidth = 2; g.stroke();
  }
  // fondo de arena y corales
  g.fillStyle = '#123e6b'; g.beginPath(); g.moveTo(0, H);
  for (let x = 0; x <= W; x += 6) g.lineTo(x, H - 26 - Math.sin((x + frame * 0.6) / 41) * 6);
  g.lineTo(W, H); g.fill();
  const ro = (frame * 0.6) % REEF_P;
  for (let k = 0; k < 2; k++) for (const rf of reef) {
    const x = rf.x - ro + k * REEF_P, base = H - 22;
    if (x < -30 || x > W + 30) continue;
    g.fillStyle = rf.c; g.strokeStyle = rf.c; g.lineCap = 'round';
    if (rf.kind === 0) {        // coral de ramas
      g.lineWidth = 4;
      g.beginPath(); g.moveTo(x, base); g.lineTo(x, base - rf.h); g.stroke();
      for (const [sy, dx, len] of [[0.35, -1, 0.45], [0.5, 1, 0.5], [0.7, -1, 0.35], [0.8, 1, 0.3]]) {
        const y0 = base - rf.h * sy;
        g.beginPath(); g.moveTo(x, y0); g.quadraticCurveTo(x + dx * rf.h * len * 0.6, y0, x + dx * rf.h * len * 0.7, y0 - rf.h * len * 0.6); g.stroke();
      }
    } else if (rf.kind === 1) { // coral cerebro
      g.beginPath(); g.ellipse(x, base, rf.h * 0.6, rf.h * 0.48, 0, Math.PI, 0); g.fill();
      g.strokeStyle = 'rgba(0,0,0,0.25)'; g.lineWidth = 1.5;
      for (let k = 1; k <= 3; k++) { g.beginPath(); g.ellipse(x, base, rf.h * 0.6 * k / 4, rf.h * 0.48 * k / 4, 0, Math.PI, 0); g.stroke(); }
    } else {                    // anémona
      g.lineWidth = 3;
      for (let t = -3; t <= 3; t++) {
        const tx = x + t * 4 + Math.sin(frame / 20 + t) * 3, ty = base - rf.h * (0.55 + 0.08 * (3 - Math.abs(t)) / 3);
        g.beginPath(); g.moveTo(x + t * 2, base); g.quadraticCurveTo(x + t * 3, base - rf.h * 0.3, tx, ty); g.stroke();
        g.beginPath(); g.arc(tx, ty, 2.5, 0, Math.PI * 2); g.fillStyle = '#ffe1ec'; g.fill();
      }
    }
  }
  // plancton que sube despacio
  for (const p of plankton) {
    const y = ((p.y - frame * p.v) % H + H) % H, x = p.x + Math.sin(frame / 50 + p.ph) * 4;
    g.fillStyle = 'rgba(220,240,255,0.35)'; g.fillRect(x, y, p.r, p.r);
  }
}

// viñeta suave en las orillas
function drawVignette() {
  const v = g.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, H * 0.75);
  v.addColorStop(0, 'rgba(0,10,30,0)'); v.addColorStop(1, 'rgba(0,10,30,0.45)');
  g.fillStyle = v; g.fillRect(0, 0, W, H);
}

// y/h: la roca; algaeY: el borde con algas (abajo en la roca del techo, arriba en la del suelo)
function drawRock(x, y, h, algaeY) {
  const isTop = algaeY === y + h;
  const grad = g.createLinearGradient(x, 0, x + CW, 0);
  grad.addColorStop(0, '#2c4653'); grad.addColorStop(0.5, '#4b6a78'); grad.addColorStop(1, '#233a46');
  g.fillStyle = grad; g.fillRect(x, y, CW, h);
  g.fillStyle = 'rgba(0,0,0,0.18)';
  for (let i = 0; i < 4; i++) g.fillRect(x + 6 + (i * 13) % 34, y + 14 + i * 47 % Math.max(20, h - 20), 6, 3);
  g.fillStyle = 'rgba(255,255,255,0.12)'; g.fillRect(x, y, 3, h);
  // algas
  g.fillStyle = '#43a047'; g.fillRect(x - 3, algaeY - 3, CW + 6, 6);
  g.strokeStyle = '#66bb6a'; g.lineWidth = 3; g.lineCap = 'round';
  const dir = isTop ? 1 : -1;
  for (let i = 0; i < 5; i++) {
    const bx = x + 4 + i * 10, len = 12 + (i % 3) * 5, sway = Math.sin(frame / 14 + i) * 4;
    g.beginPath(); g.moveTo(bx, algaeY); g.quadraticCurveTo(bx + sway, algaeY + dir * len * 0.5, bx - sway, algaeY + dir * len); g.stroke();
  }
}

function drawSub(x, y) {
  g.save();
  g.translate(x, y); g.rotate(sub.tilt);
  if (subImg.complete) g.drawImage(subImg, -26, -22, 52, 45);
  g.restore();
}

function draw() {
  drawBackground();
  g.fillStyle = 'rgba(255,255,255,0.5)';
  for (const b of bubbles) { g.beginPath(); g.arc(b.x, b.y, b.r, 0, Math.PI * 2); g.fill(); }
  for (const p of cols) {
    drawRock(p.x, 0, p.top, p.top);
    drawRock(p.x, p.top + p.gap, H - p.top - p.gap, p.top + p.gap);
  }
  drawSub(SX, sub.y);
  drawVignette();
  g.fillStyle = '#fff'; g.textAlign = 'center'; g.font = 'bold 32px system-ui, sans-serif';
  if (started) g.fillText(score, W / 2, 50);
  g.textAlign = 'right'; g.font = '14px system-ui, sans-serif';
  g.fillText('Récord ' + best, W - 10, 22);
  if (!started) drawMessage(g, 'Submarino', 'Haz clic para empezar');
  if (over) drawMessage(g, '¡Chocaste! ' + score + ' pts', 'Haz clic para jugar otra vez');
}

reset(); startLoop(update, draw);
