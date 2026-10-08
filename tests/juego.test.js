// Ejecutar con: npm test   (o: node --test tests/*.test.js)
const test = require('node:test');
const assert = require('node:assert');
const { Baraja, Carta, PALOS } = require('../js/baraja.js');
const { JuegoCartaAlta, TAMANO_MANO, MIN_JUGADORES, MAX_JUGADORES } = require('../js/modos/carta-alta/reglas.js');

const TOTAL = PALOS.length * 13; // 65 con 5 palos
const carta = (valor, palo = 0) => new Carta(valor, PALOS[palo]);

// ---- Baraja ----

test('la baraja tiene 13 cartas únicas por palo (incluida Estrella)', () => {
  const b = new Baraja();
  assert.ok(PALOS.some((p) => p.id === 'estrellas'));
  assert.strictEqual(b.quedan, TOTAL);
  assert.strictEqual(new Set(b.cartas.map((c) => c.id)).size, TOTAL);
  for (const palo of PALOS) {
    const valores = b.cartas.filter((c) => c.palo === palo).map((c) => c.valor);
    assert.deepStrictEqual(valores, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13]);
  }
});

test('barajar cambia el orden pero conserva las mismas cartas', () => {
  const ordenada = new Baraja().cartas.map((c) => c.id);
  const mezclada = new Baraja().barajar().cartas.map((c) => c.id);
  assert.notDeepStrictEqual(mezclada, ordenada);
  assert.deepStrictEqual([...mezclada].sort(), [...ordenada].sort());
});

test('robar y repartir sacan cartas del mazo', () => {
  const b = new Baraja();
  b.robar();
  assert.strictEqual(b.repartir(5).length, 5);
  assert.strictEqual(b.quedan, TOTAL - 6);
  assert.strictEqual(new Baraja().repartir(1000).length, TOTAL);
});

// ---- Carta Alta ----

test('Carta Alta admite de 2 a 4 jugadores (1 humano + CPU)', () => {
  assert.strictEqual(MIN_JUGADORES, 2);
  assert.strictEqual(MAX_JUGADORES, 4);
  for (const n of [0, 1, 5, 2.5]) assert.throws(() => new JuegoCartaAlta(n));
  const juego = new JuegoCartaAlta(4);
  assert.deepStrictEqual(juego.jugadores.map((j) => j.nombre), ['Tú', 'CPU 1', 'CPU 2', 'CPU 3']);
  assert.deepStrictEqual(juego.jugadores.map((j) => j.esHumano), [true, false, false, false]);
  assert.ok(juego.jugadores.every((j) => j.mano.length === TAMANO_MANO));
  assert.strictEqual(juego.mazo.quedan, TOTAL - 4 * TAMANO_MANO);
});

for (const n of [2, 3, 4]) {
  test(`partida completa con ${n} jugadores termina sin errores`, () => {
    const juego = new JuegoCartaAlta(n);
    while (!juego.terminado) {
      const tamanos = juego.jugadores.map((j) => j.mano.length);
      assert.ok(tamanos.every((t) => t === tamanos[0]), 'las manos deben tener el mismo tamaño');
      juego.jugarCarta(0);
    }
    const rondas = Math.floor(TOTAL / n); // 2 → 32, 3 → 21, 4 → 16
    assert.strictEqual(juego.ronda, rondas);
    assert.strictEqual(juego.descarte.length, rondas * n);
    assert.strictEqual(juego.mazo.quedan, TOTAL % n);
    assert.ok(juego.jugadores.every((j) => j.mano.length === 0));
    const empates = juego.historial.filter((r) => r.ganador === null).length;
    const puntos = juego.jugadores.reduce((s, j) => s + j.puntos, 0);
    assert.strictEqual(puntos + empates, rondas);
    assert.ok(juego.ganadoresFinales.length >= 1);
    assert.throws(() => juego.jugarCarta(0));
  });
}

test('gana la carta más alta y el As es la más fuerte', () => {
  const juego = new JuegoCartaAlta();
  assert.ok(juego.compararCartas(carta(13), carta(2)) > 0);
  assert.ok(juego.compararCartas(carta(2), carta(13)) < 0);
  assert.ok(juego.compararCartas(carta(1), carta(13)) > 0);
  assert.strictEqual(juego.compararCartas(carta(1), carta(1, 4)), 0); // el palo no importa
});

test('el ganador de la ronda suma punto; si empatan en la más alta nadie suma', () => {
  const juego = new JuegoCartaAlta(3);
  const jugada = (valores) => valores.map((v, i) => ({ jugador: i, carta: carta(v, i) }));
  assert.strictEqual(juego.ganadorDeRonda(jugada([5, 1, 13])), 1);  // As de CPU 1
  assert.strictEqual(juego.ganadorDeRonda(jugada([12, 12, 3])), null); // empate arriba
  assert.strictEqual(juego.ganadorDeRonda(jugada([2, 2, 9])), 2);   // empate abajo no importa

  // Ronda real con manos preparadas: el humano juega un K, las CPU tienen cartas bajas
  juego.jugadores[0].mano = [carta(13)];
  juego.jugadores[1].mano = [carta(2)];
  juego.jugadores[2].mano = [carta(3)];
  juego.mazo.cartas = []; // sin robo: la partida acaba en esta ronda
  const r = juego.jugarCarta(0);
  assert.strictEqual(r.ganador, 0);
  assert.strictEqual(juego.humano.puntos, 1);
  assert.deepStrictEqual(juego.ganadoresFinales, [juego.humano]);
});
