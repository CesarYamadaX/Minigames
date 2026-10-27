# Minigames

Colección de minijuegos de navegador en HTML, CSS y JavaScript puros (sin dependencias ni build).

- **Vuelo en la Cueva**: clic o toque para aletear entre estalactitas; el hueco se cierra con los puntos.
- **Pong**: un jugador; mueve la pala con el ratón o el dedo y devuelve la pelota contra el techo y las paredes. Cada golpe suma un punto y la acelera.
- **Zorro Veloz**: clic o toque para saltar rocas y troncos; mantén pulsado para saltar más alto y haz clic en el aire para doble salto.

Cada juego guarda tu récord en el navegador y corre a la misma velocidad en cualquier monitor.

## Cómo jugar

Abre `index.html` en tu navegador y elige un juego. En cada uno, el enlace "← Menú" regresa al inicio.

## Archivos

| Archivo | Qué contiene |
|---|---|
| `index.html` | Menú principal con los récords |
| `cueva.html` / `cueva.js` | Página y código de Vuelo en la Cueva |
| `zorro.html` / `zorro.js` | Página y código de Zorro Veloz |
| `pong.html` / `pong.js` | Página y código de Pong |
| `common.js` | Código compartido: bucle de juego, récords y mensajes en pantalla |
| `style.css` | Estilos de todas las páginas |

Para cambiar un juego, edita su `.js` y recarga la página en el navegador. Las constantes al inicio de cada archivo (tamaños, posiciones) y los números dentro de `update()` (gravedad, velocidad, fuerza del salto) son lo más fácil de ajustar.
