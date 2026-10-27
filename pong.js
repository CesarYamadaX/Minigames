const c = document.getElementById('c'), g = c.getContext('2d');
const W = c.width, H = c.height, PH = 70, PWd = 10, B = 5, WIN = 7;
let py, ay, ball, ps, as, wait, over, overAt, pointerY = null, aiErr = 0, wins = loadBest('pong');

function setPointer(e) { const r = c.getBoundingClientRect(); pointerY = (e.clientY - r.top) / r.height * H; }
c.addEventListener('pointermove', setPointer);
c.addEventListener('pointerdown', e => { setPointer(e); restart(); });

function newGame() {
  ps = as = 0; over = false;
  py = ay = H / 2 - PH / 2;
  serve(Math.random() < 0.5 ? 1 : -1);
}
function restart() { if (over && performance.now() - overAt > 500) newGame(); }

function serve(dir) {
  ball = { x: W / 2, y: H / 2, vx: 4 * dir, vy: (Math.random() - 0.5) * 4 };
  wait = 60;
}

// rebote: el ángulo depende de dónde pega en la pala; velocidad máxima limitada
function hit(paddleY, x, dir) {
  ball.x = x;
  ball.vx = Math.min(12, Math.abs(ball.vx) * 1.06) * dir;
  ball.vy = (ball.y - (paddleY + PH / 2)) / (PH / 2) * 6;
  if (dir > 0) aiErr = (Math.random() - 0.5) * 100;
}

function point(dir) {
  if (ps === WIN || as === WIN) {
    over = true; overAt = performance.now();
    if (ps === WIN) saveBest('pong', ++wins);
  } else serve(dir);
}

function update() {
  if (over) return;
  if (pointerY !== null) py += Math.max(-9, Math.min(9, pointerY - PH / 2 - py));
  py = Math.max(0, Math.min(H - PH, py));
  // IA: sigue la pelota con un pequeño error cuando viene hacia ella; si no, vuelve al centro
  const target = ball.vx > 0 ? ball.y - PH / 2 + aiErr : H / 2 - PH / 2;
  ay += Math.max(-4, Math.min(4, target - ay));
  ay = Math.max(0, Math.min(H - PH, ay));

  if (wait > 0) { wait--; return; }
  const px = ball.x;
  ball.x += ball.vx; ball.y += ball.vy;
  if (ball.y < B) { ball.y = B; ball.vy *= -1; }
  if (ball.y > H - B) { ball.y = H - B; ball.vy *= -1; }
  // se comprueba si la pelota cruzó la cara de la pala en este paso, para que no la atraviese a alta velocidad
  const pf = 10 + PWd, af = W - 10 - PWd;
  if (ball.vx < 0 && px - B >= pf && ball.x - B < pf && ball.y + B > py && ball.y - B < py + PH) hit(py, pf + B, 1);
  if (ball.vx > 0 && px + B <= af && ball.x + B > af && ball.y + B > ay && ball.y - B < ay + PH) hit(ay, af - B, -1);
  if (ball.x < -B) { as++; point(-1); }
  if (ball.x > W + B) { ps++; point(1); }
}

function draw() {
  g.fillStyle = '#111'; g.fillRect(0, 0, W, H);
  g.fillStyle = '#444';
  for (let y = 10; y < H; y += 30) g.fillRect(W / 2 - 1, y, 2, 15);
  g.fillStyle = '#fff';
  g.fillRect(10, py, PWd, PH);
  g.fillRect(W - 10 - PWd, ay, PWd, PH);
  if (wait % 20 < 10) g.fillRect(ball.x - B, ball.y - B, B * 2, B * 2);
  g.font = 'bold 40px system-ui, sans-serif'; g.textAlign = 'center';
  g.fillText(ps, W / 2 - 50, 50);
  g.fillText(as, W / 2 + 50, 50);
  g.font = '14px system-ui, sans-serif'; g.fillStyle = '#888';
  g.fillText('Victorias: ' + wins, W / 2, H - 12);
  if (over) drawMessage(g, ps === WIN ? '¡Ganaste!' : 'Perdiste', 'Clic o toque para jugar otra vez');
}

newGame(); startLoop(update, draw);
