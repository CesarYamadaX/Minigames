const c = document.getElementById('c'), g = c.getContext('2d');
const W = c.width, H = c.height, GROUND = 150, FX = 50, FW = 34, FH = 46;
const foxImg = new Image(); foxImg.src = '../assets/zorro-robot.png';
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
  // robot corredor; en el suelo rebota un poco al correr
  const bob = fox.y === 0 && started && !over ? Math.abs(Math.sin(t * 0.5)) * -2 : 0;
  if (foxImg.complete) g.drawImage(foxImg, x - 2, base - FH + bob, 38, 47);
}

// Estadio: gradas con público y torres de luz (lentas), vallas publicitarias y pista (a la velocidad del suelo).
const PS = 720;   // periodo del fondo, múltiplo de 6
const rndS = seeded(5);
const crowdColors = ['#f4c542', '#e5252a', '#ffffff', '#3da5ff', '#ff9a4a', '#8bd17c'];
const crowd = Array.from({ length: PS / 6 * 7 }, () => crowdColors[Math.floor(rndS() * crowdColors.length)]);
const FEET = GROUND + 12;   // los pies se dibujan dentro del carril; la colisión usa GROUND
const STAND_TOP = GROUND - 74, STAND_BOT = GROUND - 18;

function wrap(v, p) { return ((v % p) + p) % p; }

function drawStadium() {
  const sky = g.createLinearGradient(0, 0, 0, GROUND);
  sky.addColorStop(0, '#5fb6ee'); sky.addColorStop(1, '#d6f0ff');
  g.fillStyle = sky; g.fillRect(0, 0, W, GROUND);
  // nubes lentas
  g.fillStyle = 'rgba(255,255,255,0.7)';
  for (let i = 0; i < 4; i++) {
    const x = wrap(i * 190 - scroll * 0.05 - t * 0.05, W + 120) - 60, y = 22 + (i % 2) * 22;
    for (const [dx, dy, r] of [[-14, 3, 9], [0, -3, 13], [15, 2, 10]]) { g.beginPath(); g.arc(x + dx, y + dy, r, 0, Math.PI * 2); g.fill(); }
  }
  const off = -wrap(scroll * 0.25, PS);
  // torres de luz
  for (let k = 0; k < 3; k++) for (const tx of [90, 450]) {
    const x = tx + off + k * PS;
    if (x < -30 || x > W + 30) continue;
    g.fillStyle = '#7d8aa6'; g.fillRect(x - 2, 20, 4, STAND_TOP - 20);
    g.fillStyle = '#e8edf7'; g.fillRect(x - 15, 12, 30, 12);
    g.fillStyle = '#fff6c2'; for (let i = 0; i < 4; i++) g.fillRect(x - 13 + i * 7, 14, 5, 8);
  }
  // gradas
  g.fillStyle = '#3b4660'; g.fillRect(0, STAND_TOP, W, STAND_BOT - STAND_TOP);
  g.fillStyle = '#8b97b3'; g.fillRect(0, STAND_TOP - 4, W, 4);
  const c0 = Math.floor(-off / 6);
  for (let col = c0; col <= c0 + W / 6 + 1; col++) {
    const x = col * 6 + off + 3;
    for (let row = 0; row < 7; row++) {
      g.fillStyle = crowd[wrap(col, PS / 6) * 7 + row];
      g.beginPath(); g.arc(x, STAND_TOP + 5 + row * 7, 2.2, 0, Math.PI * 2); g.fill();
    }
  }
  g.fillStyle = 'rgba(0,0,0,0.25)';
  for (let row = 1; row < 7; row++) g.fillRect(0, STAND_TOP + row * 7 + 1, W, 1);
}

function drawTrack() {
  // vallas publicitarias
  const bo = -wrap(scroll, 160);
  for (let x = bo - 160; x < W + 160; x += 80) {
    const red = Math.round((x - bo) / 80) % 2 === 0;
    g.fillStyle = red ? '#e5252a' : '#f2f3f7'; g.fillRect(x, GROUND - 16, 80, 15);
    g.fillStyle = red ? '#f2f3f7' : '#e5252a'; g.fillRect(x + 10, GROUND - 11, 60, 5);
  }
  g.fillStyle = '#1b1c26'; g.fillRect(0, GROUND - 1, W, 1);
  // pista
  const tr = g.createLinearGradient(0, GROUND, 0, H);
  tr.addColorStop(0, '#b8402a'); tr.addColorStop(1, '#d4593a');
  g.fillStyle = tr; g.fillRect(0, GROUND, W, H - GROUND);
  g.fillStyle = 'rgba(0,0,0,0.12)';
  for (let i = 0; i < 40; i++) g.fillRect(wrap(i * 53 - scroll, W + 20) - 10, GROUND + 6 + (i * 7) % (H - GROUND - 8), 3, 1.5);
  // líneas de carril
  g.fillStyle = '#f2f3f7';
  for (const y of [GROUND + 2, GROUND + 18, GROUND + 34, H - 3]) if (y < H) g.fillRect(0, y, W, 2);
  // marcas de distancia en la pista
  for (let k = 0; k < 6; k++) {
    const x = wrap(k * 160 - scroll, W + 160) - 80;
    g.beginPath(); g.moveTo(x, GROUND + 20); g.lineTo(x + 4, GROUND + 20); g.lineTo(x + 1, GROUND + 33); g.lineTo(x - 3, GROUND + 33); g.fill();
  }
}

function drawObstacle(o) {
  // valla: dos postes y barras rojas y blancas; la alta lleva una segunda barra
  const x = o.x, y = FEET - o.h;
  g.fillStyle = '#e8edf7';
  g.fillRect(x + 1, y, 3, o.h); g.fillRect(x + o.w - 4, y, 3, o.h);
  g.fillStyle = '#1b1c26'; g.fillRect(x - 1, FEET - 3, 7, 3); g.fillRect(x + o.w - 6, FEET - 3, 7, 3);
  for (const by of o.kind === 'roca' ? [y] : [y, y + o.h * 0.5]) {
    for (let sx = 0; sx < o.w; sx += 8) {
      g.fillStyle = (sx / 8) % 2 === 0 ? '#e5252a' : '#f2f3f7';
      g.fillRect(x + sx, by, Math.min(8, o.w - sx), 7);
    }
    g.strokeStyle = '#1b1c26'; g.lineWidth = 1; g.strokeRect(x + 0.5, by + 0.5, o.w - 1, 6);
  }
}

function draw() {
  drawStadium();
  drawTrack();
  for (const o of obs) drawObstacle(o);
  drawFox(FX, FEET - fox.y);

  g.fillStyle = '#1b2a3a'; g.font = '16px monospace'; g.textAlign = 'right';
  g.fillText('REC ' + String(best).padStart(5, '0') + '   ' + String(Math.floor(score)).padStart(5, '0'), W - 10, 24);
  if (!started) drawMessage(g, 'Robot Veloz', 'Haz clic para empezar');
  if (over) drawMessage(g, '¡Tropezaste! ' + Math.floor(score) + ' pts', 'Haz clic para jugar otra vez');
}

reset(); startLoop(update, draw);
