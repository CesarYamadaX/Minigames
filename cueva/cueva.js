const c = document.getElementById('c'), g = c.getContext('2d');
const W = c.width, H = c.height, CW = 54, BX = 70, R = 10;
const batImg = new Image(); batImg.src = '../assets/cueva-avioneta.png';
let bat, cols, score, best = loadBest('cueva'), over, overAt, started, frame;

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
  if (score > best) { best = score; saveBest('cueva', best); }
}

function update() {
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

// dir -1: estalactita (cuelga del techo); dir 1: estalagmita (sale del suelo)
function drawRock(x, edge, dir) {
  const far = dir < 0 ? 0 : H, t = 14;
  g.fillStyle = '#4a3f5c';
  g.beginPath();
  g.moveTo(x, far);
  g.lineTo(x, edge + dir * t);
  g.lineTo(x + CW * 0.25, edge);
  g.lineTo(x + CW * 0.5, edge + dir * t * 0.6);
  g.lineTo(x + CW * 0.75, edge);
  g.lineTo(x + CW, edge + dir * t);
  g.lineTo(x + CW, far);
  g.fill();
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
  g.fillStyle = '#1b1530'; g.fillRect(0, 0, W, H);
  for (const p of cols) { drawRock(p.x, p.top, -1); drawRock(p.x, p.top + p.gap, 1); }
  drawBat(BX, bat.y);
  g.fillStyle = '#fff'; g.textAlign = 'center'; g.font = 'bold 32px system-ui, sans-serif';
  if (started) g.fillText(score, W / 2, 50);
  g.textAlign = 'right'; g.font = '14px system-ui, sans-serif';
  g.fillText('Récord ' + best, W - 10, 22);
  if (!started) drawMessage(g, 'Vuelo en la Cueva', 'Haz clic para empezar');
  if (over) drawMessage(g, '¡Chocaste! ' + score + ' pts', 'Haz clic para jugar otra vez');
}

reset(); startLoop(update, draw);
