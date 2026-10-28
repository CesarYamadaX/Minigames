# Minigames

Colección de minijuegos de navegador en HTML, CSS y JavaScript puros (sin dependencias ni build).

- **Vuelo en el Cañón**: clic o toque para subir la avioneta entre columnas de roca; el hueco se cierra con los puntos.
- **Pong**: un jugador; mueve la pala con el ratón o el dedo y devuelve la pelota contra el techo y las paredes. Cada golpe suma un punto y la acelera.
- **Submarino**: mueve el ratón o el dedo arriba y abajo para pasar entre rocas; desde 5 puntos los huecos se mueven.
- **Robot Veloz**: clic o toque para saltar las vallas en la pista; mantén pulsado para saltar más alto y haz clic en el aire para doble salto. El estadio pasa por mañana, mediodía y noche conforme sumas puntos (para ver una sola fase: `zorro.html?fase=manana`, `mediodia` o `noche`).

Cada juego guarda tu récord en el navegador y corre a la misma velocidad en cualquier monitor.

## Cómo jugar

Abre `index.html` en tu navegador y elige un juego. En cada uno, el enlace "← Menú" regresa al inicio.

## Archivos

| Archivo | Qué contiene |
|---|---|
| `index.html` | Menú principal con los récords |
| `cueva/` | Página (`cueva.html`) y código (`cueva.js`) de Vuelo en el Cañón |
| `pong/` | Página (`pong.html`) y código (`pong.js`) de Pong |
| `submarino/` | Página (`submarino.html`) y código (`submarino.js`) de Submarino |
| `zorro/` | Página (`zorro.html`) y código (`zorro.js`) de Robot Veloz |
| `common.js` | Código compartido: bucle de juego, récords y mensajes en pantalla |
| `style.css` | Estilos de todas las páginas |
| `assets/` | Sprites de los personajes (robot, avioneta, celular, submarino) |

Para cambiar un juego, edita el `.js` de su carpeta y recarga la página en el navegador. Las constantes al inicio de cada archivo (tamaños, posiciones) y los números dentro de `update()` (gravedad, velocidad, fuerza del salto) son lo más fácil de ajustar.
