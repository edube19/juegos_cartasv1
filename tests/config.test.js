// Pruebas de las opciones generales (js/config.js) y del uso de los nombres en los juegos
const test = require('node:test');
const assert = require('node:assert');
const Config = require('../js/config.js');
const { JuegoCartaAlta } = require('../js/modos/carta-alta/reglas.js');
const { JuegoP07oSuci0 } = require('../js/modos/P07o-suci0/reglas.js');

const POR_DEFECTO = ['Eduardo', 'Luz', 'Franco', 'Cecilia', 'Isabel'];

test('los nombres por defecto de las CPU 1 a 5', () => {
  assert.deepStrictEqual([...Config.POR_DEFECTO.nombresCpu], POR_DEFECTO);
  assert.deepStrictEqual(Config.nombresCpu, POR_DEFECTO);
});

test('guardar limpia los nombres: espacios, largo máximo y vacíos', () => {
  // En Node no hay localStorage: se aplica igual, pero guardar devuelve false
  const guardado = Config.guardar({ nombresCpu: ['  Ana   María ', '', 'UnNombreMuyMuyLargo', null] });
  assert.strictEqual(guardado, false);
  assert.deepStrictEqual(Config.nombresCpu, ['Ana María', 'Luz', 'UnNombreMuyMuy', 'Cecilia', 'Isabel']);
  assert.strictEqual(Config.nombresCpu[2].length, Config.MAX_LARGO_NOMBRE);

  Config.nombresCpu.push('Intruso'); // es una copia: no cambia la configuración
  assert.strictEqual(Config.nombresCpu.length, 5);

  Config.guardar({ nombresCpu: POR_DEFECTO });
  assert.deepStrictEqual(Config.nombresCpu, POR_DEFECTO);
});

test('los juegos usan los nombres recibidos y "CPU n" si faltan', () => {
  const ca = new JuegoCartaAlta(4, Math.random, POR_DEFECTO);
  assert.deepStrictEqual(ca.jugadores.map((j) => j.nombre), ['Tú', 'Eduardo', 'Luz', 'Franco']);

  const ps = new JuegoP07oSuci0({ jugadores: 6, nombresCpu: POR_DEFECTO });
  assert.deepStrictEqual(ps.jugadores.map((j) => j.nombre), ['Tú', 'Eduardo', 'Luz', 'Franco', 'Cecilia', 'Isabel']);

  const parcial = new JuegoP07oSuci0({ jugadores: 3, nombresCpu: ['Solo uno'] });
  assert.deepStrictEqual(parcial.jugadores.map((j) => j.nombre), ['Tú', 'Solo uno', 'CPU 2']);
});
