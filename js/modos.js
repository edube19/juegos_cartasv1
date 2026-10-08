/*
 * modos.js — REGISTRO DE MODOS DE JUEGO
 * Cada modo se registra con Modos.registrar({...}) y el menú principal
 * muestra automáticamente todos los modos registrados.
 *
 * Lo que debe tener un modo:
 *   id           texto único, p. ej. 'carta-alta'
 *   nombre       título que se ve en el menú
 *   descripcion  resumen corto de las reglas
 *   jugadores    (opcional) { min, max, defecto } — cuántos jugadores admite.
 *                Siempre hay 1 humano y el resto son CPU.
 *                Si min === max el número es fijo y el menú no deja elegir.
 *                Si no se indica, el modo es de 2 jugadores fijos.
 *   ajustes      (opcional) otros números que se eligen en el menú, p. ej.
 *                [{ id: 'jokers', etiqueta: '🃏 Jokers', min: 1, max: 6, defecto: 1 }]
 *   iniciar(contenedor, terminar, opciones)
 *       Dibuja el juego dentro de `contenedor` (un <div> vacío).
 *       `opciones.jugadores` es el número de jugadores elegido en el menú, y cada
 *       ajuste llega con su id (p. ej. `opciones.jokers`).
 *       `opciones.nombresCpu` trae los nombres de las CPU de ⚙ Opciones (CPU 1, CPU 2, ...).
 *       Cuando la partida acaba, llama a terminar({ resultado, titulo, detalle }),
 *       donde resultado es 'victoria', 'derrota' o 'empate'.
 *       La app se encarga del mensaje final y de los botones Repetir / Menú.
 */
(function (global) {
  'use strict';

  const lista = [];

  // Completa `defecto` (= min si falta) y comprueba que 1 ≤ min ≤ defecto ≤ max
  function rango(datos, base, donde) {
    const r = Object.assign({}, base, datos);
    if (r.defecto === undefined) r.defecto = r.min;
    const enteros = [r.min, r.max, r.defecto].every(Number.isInteger);
    if (!(enteros && r.min >= 1 && r.min <= r.defecto && r.defecto <= r.max)) {
      throw new Error(`Rango inválido en ${donde}`);
    }
    return r;
  }

  const Modos = {
    lista,
    registrar(modo) {
      for (const campo of ['id', 'nombre', 'descripcion', 'iniciar']) {
        if (!modo[campo]) throw new Error(`El modo de juego no tiene "${campo}"`);
      }
      if (lista.some((m) => m.id === modo.id)) throw new Error(`Modo repetido: ${modo.id}`);

      modo.jugadores = rango(modo.jugadores, { min: 2, max: 2 }, `los jugadores de "${modo.id}"`);

      modo.ajustes = (modo.ajustes || []).map((a) => {
        if (!a.id || !a.etiqueta) throw new Error(`Un ajuste de "${modo.id}" no tiene id o etiqueta`);
        if (a.id === 'jugadores') throw new Error('"jugadores" no puede ser un ajuste: usa el campo jugadores');
        return rango(a, {}, `el ajuste "${a.id}" de "${modo.id}"`);
      });

      lista.push(modo);
      return modo;
    },
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = Modos;
  else global.Modos = Modos;
})(globalThis);
