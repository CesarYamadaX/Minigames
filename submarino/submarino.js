const c = document.getElementById('c'), g = c.getContext('2d');
const W = c.width, H = c.height, CW = 50, SX = 70, R = 11;
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

function drawRock(x, y, h, algaeY) {
  g.fillStyle = '#37474f'; g.fillRect(x, y, CW, h);
  g.fillStyle = '#66bb6a'; g.fillRect(x - 3, algaeY - 3, CW + 6, 6);
}

function drawSub(x, y) {
  g.save();
  g.translate(x, y); g.rotate(sub.tilt);
  g.fillStyle = '#ffca28';
  g.beginPath(); g.ellipse(0, 0, 17, 9, 0, 0, Math.PI * 2); g.fill();
  g.fillRect(-4, -15, 9, 8);                 // torre
  g.fillRect(2, -21, 2, 7);                  // periscopio
  g.fillRect(2, -21, 6, 2);
  g.fillStyle = '#ff8f00'; g.fillRect(-21, -5, 4, 10);   // hélice
  g.fillStyle = '#81d4fa';
  g.beginPath(); g.arc(7, -1, 4, 0, Math.PI * 2); g.fill();
  g.restore();
}

function draw() {
  const sea = g.createLinearGradient(0, 0, 0, H);
  sea.addColorStop(0, '#1565c0'); sea.addColorStop(1, '#0d2a5c');
  g.fillStyle = sea; g.fillRect(0, 0, W, H);
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
