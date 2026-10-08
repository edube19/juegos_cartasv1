# 🃏 Juegos de Cartas

Colección de juegos de cartas para el navegador, hecha en **HTML, CSS y JavaScript puro**: sin librerías, sin instalación y sin servidor.
Juegas tú contra la computadora (CPU) desde un menú principal donde eliges el juego, el número de jugadores y otros ajustes.

## La baraja

Es una baraja de póker ampliada con un quinto palo:

| Palo | Símbolo |
|---|---|
| Picas | ♠ |
| Corazones | ♥ |
| Diamantes | ♦ |
| Tréboles | ♣ |
| **Estrellas** | ☆ |

Cada palo va del **A** al **K** (13 cartas), así que la baraja tiene **65 cartas**. Algunos modos añaden **JOKERS** 🃏.

## Modos de juego

### Carta Alta (de 2 a 4 jugadores)
- Cada jugador recibe 5 cartas.
- En cada ronda todos juegan una carta y **gana la más alta**. El As es la carta más fuerte.
- El ganador de la ronda suma un punto. Si dos o más empatan con la carta más alta, nadie suma.
- Al vaciarse las manos, gana quien tenga más puntos.

### P07o-suci0 (de 2 a 6 jugadores, de 1 a 6 JOKERS)
- Se reparte **todo el mazo más los JOKERS**. Empieza un jugador que tenga un As y lo coloca en el centro.
- Por turnos, cada jugador coloca **la carta siguiente del mismo palo** (A → 2 → 3 … → K). Después del K, toca un As de un palo que aún no haya salido.
- Si no tienes la carta que toca, **la robas a ciegas** a quien la tiene:
  - Si aciertas, la colocas.
  - Si fallas, te quedas la carta robada, y puede ser un JOKER.
- Quien se queda sin cartas sigue jugando. Si después acierta un robo, ya es ganador.
- Al colocar todas las cartas, **quien tenga uno o más JOKERS pierde** y el resto gana.

## Opciones

Desde el botón **⚙ Opciones** del menú puedes cambiar los nombres de las CPU. Por defecto se llaman *Eduardo, Luz, Franco, Cecilia e Isabel*.
Los nombres se guardan en tu navegador.

## Cómo jugar

1. Descarga o clona el repositorio.
2. Abre `index.html` con doble clic en tu navegador.

Si prefieres usar un servidor local (opcional):

```bash
python -m http.server 8080 --bind 127.0.0.1
```

Luego abre http://localhost:8080.

## Tests

Las reglas de cada juego tienen pruebas automáticas. Para ejecutarlas necesitas Node.js 18 o superior:

```bash
npm test
```

## Estructura

```
index.html               Pantallas: menú, opciones, partida y mensaje final
css/estilos.css          Estilos
js/config.js             Opciones generales (nombres de las CPU)
js/baraja.js             Cartas, JOKER y baraja
js/dibujo.js             Dibujo de cartas (compartido por todos los juegos)
js/modos.js              Registro de modos de juego
js/pantalla-opciones.js  Pantalla ⚙ Opciones
js/app.js                Navegación entre pantallas
js/modos/<juego>/        Cada juego: reglas.js (lógica) y vista.js (pantalla)
tests/                   Pruebas automáticas (node --test)
```

Cada juego vive en su propia carpeta dentro de `js/modos/` y se registra en el menú con `Modos.registrar({...})`.
Para añadir uno nuevo, crea su carpeta con `reglas.js` y `vista.js` y añade sus dos `<script>` en `index.html`, antes de `js/app.js`.

## Créditos

Desarrollado por [@edube19](https://github.com/edube19) con ayuda de **Claude Opus 5.5** (`claude-opus-5-5`), el modelo de IA de [Anthropic](https://www.anthropic.com), usado a través de **Claude Code** (aplicación de escritorio).
