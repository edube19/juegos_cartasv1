/*
 * baraja.js — MODELO DE DATOS
 * Define qué es una carta y qué es una baraja. No sabe nada de reglas ni de pantalla.
 * Funciona en el navegador (expone window.Cartas) y en Node (module.exports) para los tests.
 */
(function (global) {
  'use strict';

  // Palos de la baraja: los 4 del póker + Estrella. Para añadir otro, agrega una línea aquí
  // (y su color en css/estilos.css). El tamaño de la baraja es PALOS.length x 13.
  const PALOS = [
    { id: 'picas',     simbolo: '♠', color: 'negro' },
    { id: 'corazones', simbolo: '♥', color: 'rojo'  },
    { id: 'diamantes', simbolo: '♦', color: 'rojo'  },
    { id: 'treboles',  simbolo: '♣', color: 'negro' },
    { id: 'estrellas',  simbolo: '☆', color: 'naranja' },
  ];

  // Nombre visible de los valores especiales (el resto se muestra como número)
  const NOMBRES = { 1: 'A', 11: 'J', 12: 'Q', 13: 'K' };

  class Carta {
    constructor(valor, palo) {
      this.valor = valor; // número del 1 (As) al 13 (K)
      this.palo = palo;   // uno de los objetos de PALOS
    }
    get etiqueta() { return NOMBRES[this.valor] || String(this.valor); }
    get color() { return this.palo.color; }
    get id() { return this.etiqueta + '-' + this.palo.id; } // único en la baraja
    get esJoker() { return false; }
    toString() { return this.etiqueta + this.palo.simbolo; }
  }

  // Comodín: no pertenece a ningún palo de PALOS y no tiene valor (0).
  // La Baraja normal no lo incluye; cada modo que lo use lo añade (ver modos/P07o-suci0).
  const PALO_JOKER = { id: 'joker', simbolo: '🃏', color: 'joker' };

  class Joker extends Carta {
    constructor(numero = 1) {
      super(0, PALO_JOKER);
      this.numero = numero; // para distinguir varios jokers en la misma partida
    }
    get esJoker() { return true; }
    get etiqueta() { return 'JK'; }
    get id() { return 'JOKER-' + this.numero; }
    toString() { return 'JOKER'; }
  }

  class Baraja {
    constructor() {
      this.reiniciar();
    }

    // Vuelve a crear las 52 cartas ordenadas (4 palos x 13 valores)
    reiniciar() {
      this.cartas = [];
      for (const palo of PALOS) {
        for (let valor = 1; valor <= 13; valor++) {
          this.cartas.push(new Carta(valor, palo));
        }
      }
      return this;
    }

    // Mezcla con el algoritmo Fisher-Yates (uniforme, sin sesgo).
    // `aleatorio` se puede inyectar para tener partidas reproducibles en tests.
    barajar(aleatorio = Math.random) {
      const c = this.cartas;
      for (let i = c.length - 1; i > 0; i--) {
        const j = Math.floor(aleatorio() * (i + 1));
        [c[i], c[j]] = [c[j], c[i]];
      }
      return this;
    }

    // Saca la carta de arriba. Devuelve null si la baraja está vacía.
    robar() {
      return this.cartas.pop() || null;
    }

    // Saca hasta `n` cartas (menos si no quedan suficientes)
    repartir(n) {
      const mano = [];
      for (let i = 0; i < n && this.quedan > 0; i++) mano.push(this.robar());
      return mano;
    }

    get quedan() {
      return this.cartas.length;
    }
  }

  const api = { PALOS, NOMBRES, PALO_JOKER, Carta, Joker, Baraja };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else global.Cartas = api;
})(globalThis);
