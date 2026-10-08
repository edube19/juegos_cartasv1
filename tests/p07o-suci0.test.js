// Pruebas del modo P07o-suci0 (js/modos/P07o-suci0/reglas.js)
const test = require('node:test');
const assert = require('node:assert');
const { Carta, Joker, PALOS } = require('../js/baraja.js');
const { JuegoP07oSuci0, MIN_JUGADORES, MAX_JUGADORES, MIN_JOKERS, MAX_JOKERS } = require('../js/modos/P07o-suci0/reglas.js');

const NORMALES = PALOS.length * 13; // 65
const palo = (id) => PALOS.find((p) => p.id === id);
const c = (valor, idPalo) => new Carta(valor, palo(idPalo));

// Prepara una partida con manos a medida. `manos` es una lista de listas de cartas.
function partidaPreparada(manos, { turno = 0, pilas = [] } = {}) {
  const juego = new JuegoP07oSuci0({ jugadores: manos.length, jokers: 1 });
  juego.jugadores.forEach((j, i) => { j.mano = manos[i]; j.retirado = false; });
  juego.mesa = []; juego.pilas = {}; juego.paloActual = null; juego.valorActual = 0; juego.historial = [];
  for (const carta of pilas) juego.ponerEnMesa(carta);
  juego.totalAColocar = juego.mesa.length + manos.flat().filter((x) => !x.esJoker).length;
  juego.turno = turno;
  return juego;
}

test('admite de 2 a 6 jugadores y de 1 a 6 jokers', () => {
  assert.deepStrictEqual([MIN_JUGADORES, MAX_JUGADORES, MIN_JOKERS, MAX_JOKERS], [2, 6, 1, 6]);
  for (const jugadores of [1, 7]) assert.throws(() => new JuegoP07oSuci0({ jugadores }));
  for (const jokers of [0, 7]) assert.throws(() => new JuegoP07oSuci0({ jokers }));
});

test('se reparte todo el mazo con los jokers y empieza alguien con un As', () => {
  for (let jugadores = 2; jugadores <= 6; jugadores++) {
    const juego = new JuegoP07oSuci0({ jugadores, jokers: 3 });
    const todas = juego.jugadores.flatMap((j) => j.mano);
    assert.strictEqual(todas.length, NORMALES + 3);
    assert.strictEqual(new Set(todas.map((x) => x.id)).size, NORMALES + 3);
    assert.strictEqual(todas.filter((x) => x.esJoker).length, 3);
    const tamanos = juego.jugadores.map((j) => j.mano.length);
    assert.ok(Math.max(...tamanos) - Math.min(...tamanos) <= 1, 'reparto parejo');
    assert.ok(juego.jugadorActual.mano.some((x) => x.valor === 1), 'empieza alguien con un As');
    assert.ok(juego.buscaAs);
  }
});

test('se sigue el mismo palo y después del K toca un As de palo nuevo', () => {
  const juego = partidaPreparada([[c(2, 'corazones'), c(1, 'picas')], [c(1, 'corazones'), c(5, 'picas')]], { turno: 1 });
  assert.throws(() => juego.colocar(1)); // el 5♠ no vale
  juego.colocar(0); // CPU 1: A♥
  assert.deepStrictEqual(juego.cartaBuscada, { valor: 2, palo: palo('corazones') });
  assert.strictEqual(juego.turno, 0);
  assert.ok(!juego.esValida(c(2, 'picas')));
  assert.ok(juego.esValida(c(2, 'corazones')));

  const trasK = partidaPreparada([[c(1, 'corazones'), c(1, 'picas')], [c(3, 'treboles')]], { pilas: [c(1, 'picas'), c(13, 'picas')] });
  assert.ok(trasK.buscaAs);
  assert.ok(!trasK.esValida(c(1, 'picas')), 'el As de un palo ya jugado no vale');
  assert.ok(trasK.esValida(c(1, 'corazones')));
  assert.ok(!trasK.esValida(new Joker()));
});

test('sin la carta hay que robar a quien la tiene: acierto se coloca, fallo se queda en la mano', () => {
  // Turno de Tú (0), toca el 2♥, lo tiene CPU 2 junto con un JOKER
  const manos = [[c(9, 'picas')], [c(4, 'diamantes')], [new Joker(1), c(2, 'corazones')], [c(3, 'corazones')]];
  const juego = partidaPreparada(manos, { pilas: [c(1, 'corazones')] });
  assert.ok(juego.debeRobar);
  assert.throws(() => juego.colocar(0));
  assert.deepStrictEqual(juego.victimas().map((j) => j.indice), [2]);
  assert.throws(() => juego.robar(1, 0), 'no se puede robar a quien no tiene la carta');

  const fallo = juego.robar(2, 0); // roba el JOKER
  assert.strictEqual(fallo.acierto, false);
  assert.strictEqual(juego.jokersDe(juego.humano), 1);
  assert.strictEqual(juego.turno, 1);
  assert.deepStrictEqual(juego.cartaBuscada.valor, 2); // sigue buscándose el 2♥

  juego.robar(2, 0); // CPU 1 roba la única carta que le queda a CPU 2: el 2♥
  assert.strictEqual(juego.historial[1].acierto, true);
  assert.strictEqual(juego.mesa.length, 2);
  assert.strictEqual(juego.turno, 2);
});

test('quien se queda sin cartas sigue jugando y, si acierta un robo, ya es ganador', () => {
  // CPU 1 no tiene cartas; toca el 2♥, que tiene Tú
  const juego = partidaPreparada([[c(2, 'corazones'), new Joker(1)], [], [c(3, 'corazones')]], { turno: 1, pilas: [c(1, 'corazones')] });
  assert.ok(juego.debeRobar);
  const r = juego.robar(0, 0);
  assert.ok(r.acierto && r.retirado);
  assert.ok(juego.jugadores[1].retirado);
  juego.colocar(0); // CPU 2 coloca el 3♥ y la partida termina
  assert.ok(juego.terminado);
  assert.deepStrictEqual(juego.perdedores.map((j) => j.nombre), ['Tú']);
  assert.deepStrictEqual(juego.ganadores.map((j) => j.nombre), ['CPU 1', 'CPU 2']);
});

test('el turno se salta a los retirados', () => {
  const juego = partidaPreparada([[c(5, 'picas')], [], [c(2, 'corazones')]], { pilas: [c(1, 'corazones')] });
  juego.jugadores[1].retirado = true;
  juego.robar(2, 0);
  assert.strictEqual(juego.turno, 2); // CPU 1 está retirado: se salta
});

for (let jugadores = MIN_JUGADORES; jugadores <= MAX_JUGADORES; jugadores++) {
  test(`partida completa automática con ${jugadores} jugadores`, () => {
    for (const jokers of [1, 6]) {
      const juego = new JuegoP07oSuci0({ jugadores, jokers });
      let pasos = 0;
      while (!juego.terminado) {
        juego.jugarTurnoCpu(); // todos juegan como CPU
        assert.ok(++pasos < 100000, 'la partida debe terminar');
      }
      assert.strictEqual(juego.mesa.length, NORMALES);
      assert.ok(juego.jugadores.every((j) => j.mano.every((x) => x.esJoker)), 'al final solo quedan jokers');
      const jokersEnMano = juego.jugadores.reduce((s, j) => s + juego.jokersDe(j), 0);
      assert.strictEqual(jokersEnMano, jokers);
      assert.ok(juego.perdedores.length >= 1 && juego.perdedores.length <= jokers);
      assert.strictEqual(juego.perdedores.length + juego.ganadores.length, jugadores);
      // Cada palo se completó del As al K en orden
      for (const p of PALOS) {
        const valores = juego.mesa.filter((x) => x.palo.id === p.id).map((x) => x.valor);
        assert.deepStrictEqual(valores, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13]);
      }
      assert.throws(() => juego.jugarTurnoCpu());
    }
  });
}
