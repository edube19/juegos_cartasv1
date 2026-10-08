/*
 * dibujo.js — PIEZAS VISUALES COMPARTIDAS
 * Funciones para dibujar cartas que cualquier modo de juego puede reutilizar.
 */
(function (global) {
  'use strict';

  // Carta boca arriba. El color del palo se aplica con la clase CSS (.rojo, .negro, .naranja...)
  function carta(c) {
    const div = document.createElement('div');
    div.className = 'carta ' + c.color;
    div.innerHTML =
      `<span class="esquina sup">${c.etiqueta}<br>${c.palo.simbolo}</span>` +
      `<span class="centro">${c.palo.simbolo}</span>` +
      `<span class="esquina inf">${c.etiqueta}<br>${c.palo.simbolo}</span>`;
    div.title = c.toString();
    return div;
  }

  // Carta boca abajo (reverso)
  function reverso() {
    const div = document.createElement('div');
    div.className = 'carta reverso';
    return div;
  }

  global.Dibujo = { carta, reverso };
})(globalThis);
