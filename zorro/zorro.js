const c = document.getElementById('c'), g = c.getContext('2d');
const W = c.width, H = c.height, GROUND = 170, FX = 50, FW = 34, FH = 46;
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

// Ciudad futurista: dos capas de edificios que se desplazan a distinta velocidad.
function makeCity(seed, minH, maxH) {
  const r = seeded(seed), b = []; let x = 0;
  while (x < W + 200) {
    const w = 24 + r() * 34, h = minH + r() * (maxH - minH);
    b.push({ x, w, h, win: Array.from({ length: 9 }, r) });
    x += w + r() * 6;
  }
  return { b, P: x };
}
const cityFar = makeCity(11, 34, 90), cityNear = makeCity(23, 30, 64);
const stars = Array.from({ length: 28 }, ((r) => () => ({ x: r() * W, y: r() * 70, s: 0.5 + r() * 1.2 }))(seeded(5)));

function drawCity(city, factor, color, windows) {
  const off = -((scroll * factor) % city.P);
  g.fillStyle = color;
  for (let k = 0; k < 2; k++) for (const b of city.b) {
    const bx = b.x + off + k * city.P;
    if (bx > W || bx + b.w < 0) continue;
    g.fillRect(bx, GROUND - b.h, b.w, b.h);
    if (!windows) continue;
    g.fillStyle = 'rgba(255,207,106,0.85)';
    for (let i = 0; i < 9; i++) if (b.win[i] > 0.55) g.fillRect(bx + 5 + (i % 3) * ((b.w - 12) / 3), GROUND - b.h + 6 + Math.floor(i / 3) * 10, 3, 4);
    g.fillStyle = color;
  }
}

function drawFloor() {
  g.fillStyle = '#171722'; g.fillRect(0, GROUND, W, H - GROUND);
  g.save(); g.shadowColor = '#e5252a'; g.shadowBlur = 10;
  g.fillStyle = '#e5252a'; g.fillRect(0, GROUND, W, 3);
  g.restore();
  g.fillStyle = 'rgba(255,255,255,0.45)';
  for (let i = 0; i < 12; i++) g.fillRect(((i * 60 - scroll) % (W + 60) + W + 60) % (W + 60) - 30, GROUND + 18, 28, 3);
}

function drawObstacle(o) {
  const x = o.x, y = GROUND - o.h;
  if (o.kind === 'roca') {
    // barrera con franjas de peligro
    g.fillStyle = '#2b2f40';
    g.beginPath(); g.moveTo(x, GROUND); g.lineTo(x + 3, y); g.lineTo(x + o.w - 3, y); g.lineTo(x + o.w, GROUND); g.fill();
    g.save(); g.beginPath(); g.rect(x + 3, y + 5, o.w - 6, Math.min(8, o.h - 8)); g.clip();
    g.fillStyle = '#ffc928'; g.fillRect(x, y, o.w, o.h);
    g.fillStyle = '#1b1c26';
    for (let i = -2; i < o.w / 8 + 2; i++) { g.beginPath(); g.moveTo(x + i * 10, y + 14); g.lineTo(x + i * 10 + 5, y + 14); g.lineTo(x + i * 10 + 13, y); g.lineTo(x + i * 10 + 8, y); g.fill(); }
    g.restore();
    g.fillStyle = '#4a5068'; g.fillRect(x + 3, y, o.w - 6, 2);
  } else {
    // torre con luz roja intermitente
    g.fillStyle = '#2b2f40'; g.fillRect(x, y, o.w, o.h);
    g.fillStyle = '#3d4258'; g.fillRect(x, y, 3, o.h);
    g.fillStyle = '#1b1c26';
    for (let yy = y + 10; yy < GROUND - 4; yy += 10) g.fillRect(x + 4, yy, o.w - 8, 2);
    const on = Math.floor(t / 20) % 2 === 0;
    g.save(); if (on) { g.shadowColor = '#e5252a'; g.shadowBlur = 12; }
    g.fillStyle = on ? '#ff4b4f' : '#7a2326'; g.beginPath(); g.arc(x + o.w / 2, y - 3, 4, 0, Math.PI * 2); g.fill();
    g.restore();
  }
}

function draw() {
  const sky = g.createLinearGradient(0, 0, 0, GROUND);
  sky.addColorStop(0, '#150d33'); sky.addColorStop(0.55, '#6a1f5c'); sky.addColorStop(1, '#ff6a3d');
  g.fillStyle = sky; g.fillRect(0, 0, W, GROUND);
  g.fillStyle = 'rgba(255,255,255,0.7)';
  for (const s of stars) g.fillRect(s.x, s.y, s.s, s.s);
  const sun = g.createRadialGradient(470, GROUND - 34, 4, 470, GROUND - 34, 44);
  sun.addColorStop(0, '#ffe08a'); sun.addColorStop(1, '#ff7a45');
  g.save(); g.beginPath(); g.rect(0, 0, W, GROUND); g.clip();
  g.fillStyle = sun; g.beginPath(); g.arc(470, GROUND - 34, 44, 0, Math.PI * 2); g.fill();
  g.restore();
  drawCity(cityFar, 0.12, '#3a1650', false);
  drawCity(cityNear, 0.3, '#201233', true);
  drawFloor();
  for (const o of obs) drawObstacle(o);
  drawFox(FX, GROUND - fox.y);

  g.fillStyle = '#fff'; g.font = '16px monospace'; g.textAlign = 'right';
  g.fillText('REC ' + String(best).padStart(5, '0') + '   ' + String(Math.floor(score)).padStart(5, '0'), W - 10, 24);
  if (!started) drawMessage(g, 'Robot Veloz', 'Haz clic para empezar');
  if (over) drawMessage(g, '¡Tropezaste! ' + Math.floor(score) + ' pts', 'Haz clic para jugar otra vez');
}

reset(); startLoop(update, draw);
