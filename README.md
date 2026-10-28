# Minigames

Colección de minijuegos de navegador en HTML, CSS y JavaScript puros (sin dependencias ni build).

- **Vuelo en el Cañón**: clic o toque para subir la avioneta entre columnas de roca; el hueco se cierra con los puntos. El cielo es de mañana hasta los 20 puntos, de atardecer hasta los 70 y de noche desde ahí. Desde el atardecer pasan nubes por delante que tapan cada vez más la pantalla (para ver una sola fase: `canon/canon.html?fase=manana`, `atardecer` o `noche`).
- **Pong**: un jugador; mueve la pala con el ratón o el dedo y devuelve la pelota contra el techo y las paredes. Cada golpe suma un punto y la acelera.
- **Submarino**: mueve el ratón o el dedo arriba y abajo para pasar entre rocas; desde 5 puntos los huecos se mueven. El mar tiene algas que se mecen, corales y plancton, y a partir de 15 puntos cruzan por el fondo, al azar, un pez, una tortuga, una medusa, un pulpo, una mantarraya o una ballena.
- **Robot Veloz**: clic o toque para saltar las vallas en la pista; mantén pulsado para saltar más alto y haz clic en el aire para doble salto. El estadio pasa por mañana, mediodía y noche cada 2000 puntos, y el público en las gradas crece con cada día completo, al volver a la mañana: mínimas, pocas, intermedias y todas. Para fijar una variante: `robot/robot.html?fase=manana|mediodia|noche&luces=minimas|pocas|intermedias|todas`.

Cada juego guarda tu récord en el navegador y corre a la misma velocidad en cualquier monitor.

## Cómo jugar

Abre `index.html` en tu navegador y elige un juego. En cada uno, el enlace "← Menú" regresa al inicio.

## Archivos

| Archivo | Qué contiene |
|---|---|
| `index.html` | Menú principal con los récords |
| `canon/` | Página (`canon.html`) y código (`canon.js`) de Vuelo en el Cañón |
| `pong/` | Página (`pong.html`) y código (`pong.js`) de Pong |
| `submarino/` | Página (`submarino.html`) y código (`submarino.js`) de Submarino |
| `robot/` | Página (`robot.html`) y código (`robot.js`) de Robot Veloz |
| `common.js` | Código compartido: bucle de juego, récords y mensajes en pantalla |
| `style.css` | Estilos de todas las páginas |
| `assets/` | Sprites de los personajes (robot, avioneta, celular, submarino), nubes de Vuelo en el Cañón y animales marinos de Submarino |

Para cambiar un juego, edita el `.js` de su carpeta y recarga la página en el navegador. Las constantes al inicio de cada archivo (tamaños, posiciones) y los números dentro de `update()` (gravedad, velocidad, fuerza del salto) son lo más fácil de ajustar.
