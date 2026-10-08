// Pruebas del registro de modos de juego (js/modos.js)
const test = require('node:test');
const assert = require('node:assert');
const Modos = require('../js/modos.js');

const base = (extra) => Object.assign({ nombre: 'Prueba', descripcion: '...', iniciar() {} }, extra);

test('un modo sin "jugadores" queda fijo en 2', () => {
  const m = Modos.registrar(base({ id: 'fijo-2' }));
  assert.deepStrictEqual(m.jugadores, { min: 2, max: 2, defecto: 2 });
});

test('un modo con rango usa "min" como valor por defecto si no se indica', () => {
  const m = Modos.registrar(base({ id: 'rango', jugadores: { min: 1, max: 4 } }));
  assert.deepStrictEqual(m.jugadores, { min: 1, max: 4, defecto: 1 });
});

test('los ajustes extra (p. ej. jokers) se validan y completan', () => {
  const m = Modos.registrar(base({ id: 'con-ajustes', ajustes: [{ id: 'jokers', etiqueta: 'Jokers', min: 1, max: 6 }] }));
  assert.deepStrictEqual(m.ajustes, [{ id: 'jokers', etiqueta: 'Jokers', min: 1, max: 6, defecto: 1 }]);
  assert.deepStrictEqual(Modos.registrar(base({ id: 'sin-ajustes' })).ajustes, []);
  assert.throws(() => Modos.registrar(base({ id: 'a1', ajustes: [{ etiqueta: 'Sin id', min: 1, max: 2 }] })));
  assert.throws(() => Modos.registrar(base({ id: 'a2', ajustes: [{ id: 'jugadores', etiqueta: 'x', min: 1, max: 2 }] })));
  assert.throws(() => Modos.registrar(base({ id: 'a3', ajustes: [{ id: 'j', etiqueta: 'x', min: 4, max: 2 }] })));
});

test('rangos inválidos, campos faltantes e ids repetidos se rechazan', () => {
  assert.throws(() => Modos.registrar(base({ id: 'x1', jugadores: { min: 0, max: 2 } })));
  assert.throws(() => Modos.registrar(base({ id: 'x2', jugadores: { min: 3, max: 2 } })));
  assert.throws(() => Modos.registrar(base({ id: 'x3', jugadores: { min: 2, max: 4, defecto: 5 } })));
  assert.throws(() => Modos.registrar({ id: 'x4', nombre: 'Sin iniciar', descripcion: '...' }));
  assert.throws(() => Modos.registrar(base({ id: 'fijo-2' })));
});
