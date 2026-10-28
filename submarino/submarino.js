const c = document.getElementById('c'), g = c.getContext('2d');
const W = c.width, H = c.height, CW = 50, SX = 70, R = 11;
const subImg = new Image(); subImg.src = '../assets/submarino.png';
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
}

function die() {
  if (over) return;
  over = true; overAt = performance.now();
  if (score > best) { best = score; saveBest('submarino', best); }
}

function update() {
  frame++;
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

// Fondo marino: peces y relieve lejano que se mueven más lento que las rocas.
const rnd = seeded(3);
const fish = Array.from({ length: 6 }, () => ({ y: 60 + rnd() * (H - 160), s: 0.4 + rnd() * 0.6, sz: 5 + rnd() * 4, ph: rnd() * (W + 80) }));

function drawBackground() {
  const sea = g.createLinearGradient(0, 0, 0, H);
  sea.addColorStop(0, '#2a8fd6'); sea.addColorStop(0.5, '#145a9e'); sea.addColorStop(1, '#07203f');
  g.fillStyle = sea; g.fillRect(0, 0, W, H);
  // rayos de luz que se balancean
  for (let i = 0; i < 4; i++) {
    const x0 = i * W / 3 - 20 + Math.sin(frame / 90 + i * 1.7) * 22;
    const ray = g.createLinearGradient(0, 0, 0, H * 0.8);
    ray.addColorStop(0, 'rgba(255,255,255,0.13)'); ray.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = ray;
    g.beginPath(); g.moveTo(x0, 0); g.lineTo(x0 + 34, 0); g.lineTo(x0 + 120, H * 0.8); g.lineTo(x0 + 60, H * 0.8); g.fill();
  }
  // lomas del fondo
  g.fillStyle = '#0a2c52'; g.beginPath(); g.moveTo(0, H);
  for (let x = 0; x <= W; x += 8) g.lineTo(x, H - 34 - Math.sin((x + frame * 0.6) / 41) * 10 - Math.sin((x + frame * 0.6) / 97) * 14);
  g.lineTo(W, H); g.fill();
  // peces lejanos
  g.fillStyle = 'rgba(180,225,255,0.35)';
  for (const f of fish) {
    const x = ((f.ph - frame * (0.5 + f.s)) % (W + 80) + W + 80) % (W + 80) - 40;
    g.beginPath(); g.ellipse(x, f.y, f.sz * 1.6, f.sz, 0, 0, Math.PI * 2); g.fill();
    g.beginPath(); g.moveTo(x + f.sz * 1.4, f.y); g.lineTo(x + f.sz * 2.6, f.y - f.sz * 0.8); g.lineTo(x + f.sz * 2.6, f.y + f.sz * 0.8); g.fill();
  }
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
  g.fillStyle = '#fff'; g.textAlign = 'center'; g.font = 'bold 32px system-ui, sans-serif';
  if (started) g.fillText(score, W / 2, 50);
  g.textAlign = 'right'; g.font = '14px system-ui, sans-serif';
  g.fillText('Récord ' + best, W - 10, 22);
  if (!started) drawMessage(g, 'Submarino', 'Haz clic para empezar');
  if (over) drawMessage(g, '¡Chocaste! ' + score + ' pts', 'Haz clic para jugar otra vez');
}

reset(); startLoop(update, draw);
