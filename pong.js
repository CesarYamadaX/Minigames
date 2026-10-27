const c = document.getElementById('c'), g = c.getContext('2d');
const W = c.width, H = c.height, PW = 80, PH = 10, PY = H - 30, B = 6, WALL = 10;
let px, ball, score, best = loadBest('pong'), wait, over, overAt, pointerX = null;

function setPointer(e) { const r = c.getBoundingClientRect(); pointerX = (e.clientX - r.left) / r.width * W; }
c.addEventListener('pointermove', setPointer);
c.addEventListener('pointerdown', e => { setPointer(e); if (over && performance.now() - overAt > 500) reset(); });

function reset() {
  px = W / 2 - PW / 2; score = 0; over = false;
  ball = { x: W / 2, y: H / 3, vx: (Math.random() < 0.5 ? -1 : 1) * 2.5, vy: 4 };
  wait = 60;
}

function update() {
  if (pointerX !== null) px += Math.max(-12, Math.min(12, pointerX - PW / 2 - px));
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
    const speed = Math.min(13, Math.hypot(ball.vx, ball.vy) * 1.04);
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
  g.fillStyle = '#111'; g.fillRect(0, 0, W, H);
  g.fillStyle = '#555';
  g.fillRect(0, 0, W, WALL);
  g.fillRect(0, 0, WALL, H);
  g.fillRect(W - WALL, 0, WALL, H);
  g.fillStyle = '#fff';
  g.fillRect(px, PY, PW, PH);
  if (wait % 20 < 10) g.fillRect(ball.x - B, ball.y - B, B * 2, B * 2);
  g.font = 'bold 40px system-ui, sans-serif'; g.textAlign = 'center';
  g.fillText(score, W / 2, 70);
  g.font = '14px system-ui, sans-serif'; g.fillStyle = '#888';
  g.fillText('Récord: ' + best, W / 2, 95);
  if (over) drawMessage(g, '¡Se escapó! ' + score + ' golpes', 'Clic o toque para jugar otra vez');
}

reset(); startLoop(update, draw);
