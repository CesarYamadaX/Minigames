const c = document.getElementById('c'), g = c.getContext('2d');
const W = c.width, H = c.height, GROUND = 170, FX = 50, FW = 34, FH = 26;
let fox, obs, speed, score, best = loadBest('zorro'), over, overAt, started, held = false, nextGap, scroll, t = 0;

function reset() {
  fox = { y: 0, v: 0, jumps: 0 };   // y = altura sobre el suelo
  obs = []; speed = 5; score = 0; over = false; started = false; nextGap = 0; scroll = 0;
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
  const leg = fox.y === 0 && started && !over ? Math.sin(t * 0.5) * 4 : 0;
  g.fillStyle = '#e65100';
  g.beginPath(); g.ellipse(x + 2, base - 15, 10, 5, -0.5, 0, Math.PI * 2); g.fill();   // cola
  g.fillRect(x + 6, base - 20, 20, 12);                                                 // cuerpo
  g.fillRect(x + 22, base - FH, 9, 12);                                                 // cabeza
  g.beginPath(); g.moveTo(x + 31, base - FH + 4); g.lineTo(x + FW, base - 18); g.lineTo(x + 31, base - 15); g.fill();
  g.beginPath(); g.moveTo(x + 22, base - FH); g.lineTo(x + 24, base - FH - 7); g.lineTo(x + 27, base - FH); g.fill();
  g.fillRect(x + 9 + leg, base - 8, 4, 8);
  g.fillRect(x + 20 - leg, base - 8, 4, 8);
  g.fillStyle = '#fff';
  g.beginPath(); g.ellipse(x - 6, base - 11, 4, 3, -0.5, 0, Math.PI * 2); g.fill();     // punta de la cola
  g.fillStyle = '#222'; g.fillRect(x + 27, base - FH + 3, 2, 2);
}

function draw() {
  const sky = g.createLinearGradient(0, 0, 0, GROUND);
  sky.addColorStop(0, '#ff9a76'); sky.addColorStop(1, '#ffe2b8');
  g.fillStyle = sky; g.fillRect(0, 0, W, GROUND);
  g.fillStyle = '#fff3c4'; g.beginPath(); g.arc(470, 70, 26, 0, Math.PI * 2); g.fill();
  // colinas al fondo, se mueven más lento que el suelo
  const hx = scroll * 0.2;
  g.fillStyle = '#d9876a'; g.beginPath(); g.moveTo(0, GROUND);
  for (let x = 0; x <= W; x += 10) g.lineTo(x, GROUND - 30 - Math.sin((x + hx) / 60) * 12 - Math.sin((x + hx) / 23) * 5);
  g.lineTo(W, GROUND); g.fill();
  g.fillStyle = '#8d6e63'; g.fillRect(0, GROUND, W, H - GROUND);
  g.fillStyle = '#6d4c41';
  for (let i = 0; i < 16; i++) g.fillRect(((i * 40 - scroll) % W + W) % W, GROUND + 8 + (i % 3) * 6, 10, 2);

  for (const o of obs) {
    if (o.kind === 'roca') {
      g.fillStyle = '#78909c';
      g.beginPath(); g.ellipse(o.x + o.w / 2, GROUND, o.w / 2, o.h, 0, Math.PI, 0); g.fill();
    } else {
      g.fillStyle = '#5d4037'; g.fillRect(o.x, GROUND - o.h, o.w, o.h);
      g.fillStyle = '#a1887f'; g.fillRect(o.x + 3, GROUND - o.h, o.w - 6, 4);
    }
  }
  drawFox(FX, GROUND - fox.y);

  g.fillStyle = '#4e342e'; g.font = '16px monospace'; g.textAlign = 'right';
  g.fillText('REC ' + String(best).padStart(5, '0') + '   ' + String(Math.floor(score)).padStart(5, '0'), W - 10, 24);
  if (!started) drawMessage(g, 'Zorro Veloz', 'Haz clic para empezar');
  if (over) drawMessage(g, '¡Tropezaste! ' + Math.floor(score) + ' pts', 'Haz clic para jugar otra vez');
}

reset(); startLoop(update, draw);
