// Bucle a 60 actualizaciones por segundo, igual en monitores de 60, 120 o 144 Hz.
function startLoop(update, draw) {
  const STEP = 1000 / 60;
  let last = performance.now(), acc = 0;
  function frame(t) {
    acc += Math.min(250, t - last); last = t;
    while (acc >= STEP) { update(); acc -= STEP; }
    draw();
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

// Récord guardado en el navegador; si el almacenamiento no está disponible, no se guarda.
function loadBest(key) { try { return Number(localStorage.getItem(key)) || 0; } catch { return 0; } }
function saveBest(key, value) { try { localStorage.setItem(key, value); } catch {} }

// Banda semitransparente con título y subtítulo centrados en el canvas.
function drawMessage(g, title, sub) {
  const W = g.canvas.width, H = g.canvas.height;
  g.fillStyle = 'rgba(0,0,0,0.55)';
  g.fillRect(0, H / 2 - 45, W, 80);
  g.fillStyle = '#fff'; g.textAlign = 'center';
  g.font = 'bold 26px system-ui, sans-serif';
  g.fillText(title, W / 2, H / 2 - 10);
  g.font = '15px system-ui, sans-serif';
  g.fillText(sub, W / 2, H / 2 + 20);
}
