const c = document.getElementById('c'), g = c.getContext('2d');
const W = c.width, H = c.height, CW = 54, BX = 70, R = 10;
const batImg = new Image(); batImg.src = '../assets/canon-avioneta.png';
let bgx = 0;
let bat, cols, score, best = loadBest('canon'), over, overAt, started, frame;

function reset() {
  bat = { y: H / 2, v: 0, wing: 0 };
  cols = []; score = 0; over = false; started = false; frame = 0;
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
  if (score > best) { best = score; saveBest('canon', best); }
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

// Fondo: nubes y mesetas lejanas que se desplazan más lento que las columnas.
const rnd = seeded(7);
const clouds = Array.from({ length: 7 }, () => ({ x: rnd() * (W + 120), y: 30 + rnd() * (H - 220), s: 0.6 + rnd() * 0.8 }));
const mesas = []; let mesaEnd = 0;
while (mesaEnd < W * 1.6) { const w = 40 + rnd() * 70; mesas.push({ x: mesaEnd, w, h: 50 + rnd() * 90 }); mesaEnd += w + 10 + rnd() * 30; }

function drawBackground() {
  const sky = g.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, '#2f2160'); sky.addColorStop(0.55, '#d4546f'); sky.addColorStop(1, '#ffb878');
  g.fillStyle = sky; g.fillRect(0, 0, W, H);
  const sun = g.createRadialGradient(W * 0.72, H * 0.62, 6, W * 0.72, H * 0.62, 90);
  sun.addColorStop(0, 'rgba(255,240,200,1)'); sun.addColorStop(0.25, 'rgba(255,214,150,0.9)'); sun.addColorStop(1, 'rgba(255,184,120,0)');
  g.fillStyle = sun; g.fillRect(0, 0, W, H);
  for (const c of clouds) {
    const x = ((c.x - bgx * 0.35 * c.s) % (W + 140) + W + 140) % (W + 140) - 70;
    g.fillStyle = 'rgba(255,255,255,0.28)';
    for (const [dx, dy, r] of [[-16, 2, 11], [0, -4, 15], [17, 1, 12], [32, 4, 8]]) { g.beginPath(); g.arc(x + dx * c.s, c.y + dy * c.s, r * c.s, 0, Math.PI * 2); g.fill(); }
  }
  for (const [layer, f, col] of [[0, 0.18, '#a8465f'], [1, 0.35, '#7a2f4d']]) {
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
  grad.addColorStop(0, '#c4633f'); grad.addColorStop(0.45, '#9a3f2e'); grad.addColorStop(1, '#5a2327');
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
