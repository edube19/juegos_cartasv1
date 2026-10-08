/*
 * reglas.js — REGLAS DEL MODO "P07o-suci0" (de 2 a 6 jugadores, de 1 a 6 JOKERS)
 * Usa la Baraja pero no toca la pantalla: solo guarda el estado y aplica las reglas.
 *
 * Reglas:
 *  1. Se reparte TODO el mazo (todos los palos + los JOKERS) entre los jugadores.
 *     Cada uno solo ve su mano.
 *  2. Empieza un jugador (al azar) que tenga un As y lo coloca en el centro.
 *     El siguiente jugador debe colocar la carta que sigue (2, 3, ... K) del MISMO palo.
 *     Si no la tiene, debe robársela A CIEGAS a un jugador que sí la tiene:
 *       a) Si roba la carta correcta, la coloca y pasa el turno.
 *       b) Si roba otra (un número o un JOKER), se la queda y pasa el turno.
 *  3. Después del K, el siguiente debe colocar un As de un palo que aún no se haya jugado
 *     (si no tiene, lo roba a ciegas a alguien que tenga uno, igual que en el punto 2).
 *  4. Se juega hasta colocar todas las cartas menos los JOKERS.
 *     Quien termina con uno o más JOKERS en la mano pierde; el resto gana.
 *  Nota: quien se queda sin cartas sigue jugando y en su turno tiene que robar.
 *        Si acierta, coloca la carta y ya es ganador (deja de jugar). Si falla, sigue en el juego.
 */
(function (global) {
  'use strict';

  const { Baraja, Joker, PALOS } = (typeof module !== 'undefined' && module.exports)
    ? require('../../baraja.js')
    : global.Cartas;

  const MIN_JUGADORES = 2;
  const MAX_JUGADORES = 6;
  const MIN_JOKERS = 1;
  const MAX_JOKERS = 6;
  const VALOR_K = 13;

  function comprobarRango(nombre, valor, min, max) {
    if (!Number.isInteger(valor) || valor < min || valor > max) {
      throw new Error(`P07o-suci0: ${nombre} debe estar entre ${min} y ${max}`);
    }
  }

  class JuegoP07oSuci0 {
    // nombresCpu: nombres para CPU 1, CPU 2... (si falta alguno se usa "CPU n")
    constructor({ jugadores = 4, jokers = 1, aleatorio = Math.random, nombresCpu = [] } = {}) {
      comprobarRango('jugadores', jugadores, MIN_JUGADORES, MAX_JUGADORES);
      comprobarRango('jokers', jokers, MIN_JOKERS, MAX_JOKERS);
      this.numJugadores = jugadores;
      this.numJokers = jokers;
      this.aleatorio = aleatorio;
      this.nombresCpu = nombresCpu;
      this.nuevaPartida();
    }

    nuevaPartida() {
      const baraja = new Baraja();
      for (let i = 1; i <= this.numJokers; i++) baraja.cartas.push(new Joker(i));
      baraja.barajar(this.aleatorio);

      // El jugador 0 es el humano; el resto, CPU.
      // `retirado` = se quedó sin cartas y acertó un robo: ya ganó y no juega más turnos.
      this.jugadores = Array.from({ length: this.numJugadores }, (_, i) => ({
        indice: i,
        nombre: i === 0 ? 'Tú' : (this.nombresCpu[i - 1] || `CPU ${i}`),
        esHumano: i === 0,
        mano: [],
        retirado: false,
      }));

      // Se reparte todo el mazo, una carta a cada uno por vuelta (algunos pueden tener una más)
      for (let i = 0; baraja.quedan > 0; i++) this.jugadores[i % this.numJugadores].mano.push(baraja.robar());

      this.totalAColocar = PALOS.length * 13; // todas menos los jokers
      this.mesa = [];          // cartas colocadas, en orden
      this.pilas = {};         // id del palo → última carta colocada de ese palo
      this.paloActual = null;  // palo en curso (null al inicio)
      this.valorActual = 0;    // valor de la última carta colocada
      this.historial = [];     // eventos: colocar / robo

      // Empieza, al azar, alguien que tenga un As
      const conAs = this.jugadores.filter((j) => j.mano.some((c) => c.valor === 1));
      this.turno = conAs[Math.floor(this.aleatorio() * conAs.length)].indice;
    }

    // ---- Consultas ----

    get humano() { return this.jugadores[0]; }
    get jugadorActual() { return this.jugadores[this.turno]; }
    get terminado() { return this.mesa.length === this.totalAColocar; }

    // ¿Toca poner un As de un palo nuevo? (al empezar o después de un K)
    get buscaAs() { return this.paloActual === null || this.valorActual === VALOR_K; }

    // Palos cuyo As aún no se jugó
    get palosPendientes() { return PALOS.filter((p) => !this.pilas[p.id]); }

    // Lo que toca colocar: { valor, palo }. Si toca un As de palo nuevo, palo es null.
    get cartaBuscada() {
      return this.buscaAs ? { valor: 1, palo: null } : { valor: this.valorActual + 1, palo: this.paloActual };
    }

    // ¿Esta carta se puede colocar ahora?
    esValida(carta) {
      if (carta.esJoker) return false;
      if (this.buscaAs) return carta.valor === 1 && !this.pilas[carta.palo.id];
      return carta.palo.id === this.paloActual.id && carta.valor === this.valorActual + 1;
    }

    // Índices de las cartas válidas en la mano de un jugador
    cartasValidas(jugador = this.jugadorActual) {
      return jugador.mano.flatMap((c, i) => (this.esValida(c) ? [i] : []));
    }

    // El jugador del turno debe robar si no tiene ninguna carta válida (o no tiene cartas)
    get debeRobar() { return this.cartasValidas().length === 0; }

    // A quién se puede robar: otros jugadores que SÍ tienen una carta válida
    victimas() {
      return this.jugadores.filter((j) => j !== this.jugadorActual && this.cartasValidas(j).length > 0);
    }

    jokersDe(jugador) { return jugador.mano.filter((c) => c.esJoker).length; }

    // Al terminar: pierden quienes tienen algún JOKER; ganan los demás
    get perdedores() { return this.terminado ? this.jugadores.filter((j) => this.jokersDe(j) > 0) : null; }
    get ganadores() { return this.terminado ? this.jugadores.filter((j) => this.jokersDe(j) === 0) : null; }

    // ---- Acciones del jugador del turno ----

    // Coloca una carta propia (debe ser válida)
    colocar(indice) {
      this.comprobarEnJuego();
      const jugador = this.jugadorActual;
      const carta = jugador.mano[indice];
      if (!carta || !this.esValida(carta)) throw new Error('Esa carta no se puede colocar ahora');
      jugador.mano.splice(indice, 1);
      this.ponerEnMesa(carta);
      return this.cerrarTurno({ tipo: 'colocar', jugador: jugador.indice, carta });
    }

    // Roba a ciegas la carta en `posicion` de la mano de `indiceVictima`
    robar(indiceVictima, posicion) {
      this.comprobarEnJuego();
      const ladron = this.jugadorActual;
      if (!this.debeRobar) throw new Error('Tienes una carta válida: debes colocarla');
      const victima = this.jugadores[indiceVictima];
      if (!this.victimas().includes(victima)) throw new Error('Solo puedes robar a quien tiene una carta válida');
      if (!Number.isInteger(posicion) || posicion < 0 || posicion >= victima.mano.length) throw new Error('Posición inválida');

      const estabaSinCartas = ladron.mano.length === 0;
      const carta = victima.mano.splice(posicion, 1)[0];
      const acierto = this.esValida(carta);

      if (acierto) {
        this.ponerEnMesa(carta);
        if (estabaSinCartas) ladron.retirado = true; // nota de las reglas: ya es ganador
      } else {
        // Se guarda en una posición al azar para que robarle siga siendo a ciegas
        ladron.mano.splice(Math.floor(this.aleatorio() * (ladron.mano.length + 1)), 0, carta);
      }

      return this.cerrarTurno({
        tipo: 'robo', jugador: ladron.indice, victima: victima.indice, carta, acierto,
        retirado: acierto && estabaSinCartas,
      });
    }

    // "Inteligencia" de una CPU: coloca una carta válida si tiene; si no, roba a ciegas
    // a una víctima al azar. Aquí puedes mejorar la IA.
    jugarTurnoCpu() {
      const validas = this.cartasValidas();
      if (validas.length > 0) return this.colocar(validas[Math.floor(this.aleatorio() * validas.length)]);
      const victimas = this.victimas();
      const victima = victimas[Math.floor(this.aleatorio() * victimas.length)];
      return this.robar(victima.indice, Math.floor(this.aleatorio() * victima.mano.length));
    }

    // ---- Internos ----

    comprobarEnJuego() {
      if (this.terminado) throw new Error('La partida ya terminó');
    }

    ponerEnMesa(carta) {
      this.mesa.push(carta);
      this.pilas[carta.palo.id] = carta;
      this.paloActual = carta.palo;
      this.valorActual = carta.valor;
    }

    cerrarTurno(evento) {
      evento.numero = this.historial.length + 1;
      this.historial.push(evento);
      if (!this.terminado) this.pasarTurno();
      return evento;
    }

    // Pasa al siguiente jugador que no se haya retirado
    pasarTurno() {
      for (let paso = 1; paso <= this.numJugadores; paso++) {
        const siguiente = (this.turno + paso) % this.numJugadores;
        if (!this.jugadores[siguiente].retirado) { this.turno = siguiente; return; }
      }
      throw new Error('No queda ningún jugador activo');
    }
  }

  const api = { JuegoP07oSuci0, MIN_JUGADORES, MAX_JUGADORES, MIN_JOKERS, MAX_JOKERS };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else global.P07oSuci0 = api;
})(globalThis);
