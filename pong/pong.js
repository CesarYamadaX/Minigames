const c = document.getElementById('c'), g = c.getContext('2d');
const W = c.width, H = c.height, PW = 80, PH = 10, PY = H - 30, B = 6, WALL = 10;
const padImg = new Image(); padImg.src = '../assets/pong-celular.png';
const logoImg = new Image(); logoImg.src = '../assets/pong-logo-honor.png';
let px, ball, score, best = loadBest('pong'), wait, over, overAt, pointerX = null;

function setPointer(e) { const r = c.getBoundingClientRect(); pointerX = (e.clientX - r.left) / r.width * W; }
c.addEventListener('pointermove', setPointer);
c.addEventListener('pointerdown', e => { setPointer(e); if (over && performance.now() - overAt > 500) reset(); });

function reset() {
  px = W / 2 - PW / 2; score = 0; over = false;
  ball = { x: W / 2, y: H / 3, vx: (Math.random() < 0.5 ? -1 : 1) * 3.5, vy: 6 };
  wait = 40;
}

function update() {
  if (pointerX !== null) px += Math.max(-22, Math.min(22, pointerX - PW / 2 - px));
  px = Math.max(WALL, Math.min(W - WALL - PW, px));
  if (over) return;
  if (wait > 0) { wait--; return; }

  const prevY = ball.y;
  ball.x += ball.vx; ball.y += ball.vy;
  // paredes laterales y techo
  if (ball.x - B < WALL) { ball.x = WALL + B; ball.vx *= -1; }
  if (ball.x + B > W - WALL) { ball.x = W - WALL - B; ball.vx *= -1; }
  if (ball.y - B < WALL) { ball.y = WALL + B; ball.vy *= -1; }
  // se comprueba si cruzó la cara de la pala en este paso, para que no la atraviese a alta velocidad
  if (ball.vy > 0 && prevY + B <= PY && ball.y + B > PY && ball.x + B > px && ball.x - B < px + PW) {
    ball.y = PY - B;
    // el ángulo depende de dónde pega en la pala (hasta ~60° desde la vertical); acelera en cada golpe
    const speed = Math.min(18, Math.hypot(ball.vx, ball.vy) * 1.06);
    const a = Math.max(-1, Math.min(1, (ball.x - (px + PW / 2)) / (PW / 2))) * 1.05;
    ball.vx = speed * Math.sin(a); ball.vy = -speed * Math.cos(a);
    score++;
  }
  if (ball.y - B > H) {
    over = true; overAt = performance.now();
    if (score > best) { best = score; saveBest('pong', best); }
  }
}

function draw() {
  const bg = g.createRadialGradient(W / 2, H * 0.4, 40, W / 2, H * 0.4, H * 0.85);
  bg.addColorStop(0, '#1d1e28'); bg.addColorStop(1, '#09090e');
  g.fillStyle = bg; g.fillRect(0, 0, W, H);
  // cuadrícula tenue, círculo central y línea de media cancha
  g.strokeStyle = 'rgba(255,255,255,0.045)'; g.lineWidth = 1;
  for (let x = WALL + 30; x < W - WALL; x += 30) { g.beginPath(); g.moveTo(x, WALL); g.lineTo(x, H); g.stroke(); }
  for (let y = WALL + 30; y < H; y += 30) { g.beginPath(); g.moveTo(WALL, y); g.lineTo(W - WALL, y); g.stroke(); }
  g.strokeStyle = 'rgba(229,37,42,0.28)'; g.lineWidth = 2;
  g.beginPath(); g.arc(W / 2, H / 2, 60, 0, Math.PI * 2); g.stroke();
  g.setLineDash([10, 10]); g.beginPath(); g.moveTo(WALL, H / 2); g.lineTo(W - WALL, H / 2); g.stroke(); g.setLineDash([]);
  // logo de HONOR en el centro de la cancha, tenue para no distraer de la pelota
  if (logoImg.complete) {
    const lh = 104, lw = lh * logoImg.width / logoImg.height;
    g.save(); g.globalAlpha = 0.22; g.drawImage(logoImg, W / 2 - lw / 2, H / 2 - lh / 2, lw, lh); g.restore();
  }
  // paredes rojas con brillo
  g.save(); g.shadowColor = '#e5252a'; g.shadowBlur = 14; g.fillStyle = '#e5252a';
  g.fillRect(0, 0, W, WALL); g.fillRect(0, 0, WALL, H); g.fillRect(W - WALL, 0, WALL, H);
  g.restore();
  g.fillStyle = 'rgba(255,255,255,0.35)';
  g.fillRect(0, WALL - 2, W, 2); g.fillRect(WALL - 2, 0, 2, H); g.fillRect(W - WALL, 0, 2, H);
  // pala (celular) y pelota
  g.save(); g.shadowColor = 'rgba(229,37,42,0.7)'; g.shadowBlur = 16;
  if (padImg.complete) g.drawImage(padImg, px, PY - 4, PW, 28); else { g.fillStyle = '#fff'; g.fillRect(px, PY, PW, PH); }
  g.restore();
  if (wait % 20 < 10) {
    g.save(); g.shadowColor = '#fff'; g.shadowBlur = 14; g.fillStyle = '#fff';
    g.beginPath(); g.arc(ball.x, ball.y, B, 0, Math.PI * 2); g.fill(); g.restore();
  }
  g.fillStyle = '#fff'; g.font = 'bold 40px system-ui, sans-serif'; g.textAlign = 'center';
  g.fillText(score, W / 2, 70);
  g.font = '15px system-ui, sans-serif'; g.fillStyle = '#aab';
  g.fillText('Récord: ' + best, W / 2, 95);
  if (over) drawMessage(g, '¡Se escapó! ' + score + ' golpes', 'Haz clic para jugar otra vez');
}

reset(); startLoop(update, draw);
