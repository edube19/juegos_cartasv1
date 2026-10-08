/*
 * reglas.js — REGLAS DEL MODO "Carta Alta" (de 2 a 4 jugadores)
 * Usa la Baraja pero no toca la pantalla: solo guarda el estado y aplica las reglas.
 *
 * Reglas:
 *  - Juegan de 2 a 4: tú (jugador 0) y el resto CPU. Cada uno recibe 5 cartas.
 *  - En cada ronda todos juegan una carta: tú eliges la tuya y cada CPU elige la suya.
 *  - Gana la carta más fuerte; el As es la más alta (A > K > Q > J > 10 ... > 2).
 *    El ganador suma 1 punto. Si dos o más empatan con la carta más alta, nadie suma.
 *  - Tras la ronda, todos roban 1 carta, pero solo si alcanza para todos
 *    (así las manos siempre tienen el mismo tamaño).
 *  - La partida termina cuando las manos quedan vacías.
 *    Rondas = cartas ÷ jugadores (sin decimales). Con 65 cartas:
 *    2 jugadores → 32 rondas, 3 → 21, 4 → 16. Las cartas que sobran quedan en el mazo.
 */
(function (global) {
  'use strict';

  const { Baraja } = (typeof module !== 'undefined' && module.exports)
    ? require('../../baraja.js')
    : global.Cartas;

  const TAMANO_MANO = 5;
  const MIN_JUGADORES = 2;
  const MAX_JUGADORES = 4;

  class JuegoCartaAlta {
    // nombresCpu: nombres para CPU 1, CPU 2... (si falta alguno se usa "CPU n")
    constructor(numJugadores = 2, aleatorio = Math.random, nombresCpu = []) {
      if (!Number.isInteger(numJugadores) || numJugadores < MIN_JUGADORES || numJugadores > MAX_JUGADORES) {
        throw new Error(`Carta Alta admite de ${MIN_JUGADORES} a ${MAX_JUGADORES} jugadores`);
      }
      this.numJugadores = numJugadores;
      this.aleatorio = aleatorio;
      this.nombresCpu = nombresCpu;
      this.nuevaPartida();
    }

    nuevaPartida() {
      this.mazo = new Baraja().barajar(this.aleatorio);
      // El jugador 0 es el humano; el resto son CPU
      this.jugadores = Array.from({ length: this.numJugadores }, (_, i) => ({
        indice: i,
        nombre: i === 0 ? 'Tú' : (this.nombresCpu[i - 1] || `CPU ${i}`),
        esHumano: i === 0,
        mano: this.mazo.repartir(TAMANO_MANO),
        puntos: 0,
      }));
      this.descarte = [];   // cartas ya jugadas
      this.historial = [];  // resultado de cada ronda
      this.ronda = 0;
    }

    get humano() {
      return this.jugadores[0];
    }

    // Termina cuando alguien ya no tiene cartas (las manos se vacían a la vez)
    get terminado() {
      return this.jugadores.some((j) => j.mano.length === 0);
    }

    // Último resultado (o null si aún no se jugó ninguna ronda)
    get ultimaRonda() {
      return this.historial[this.historial.length - 1] || null;
    }

    // Jugadores con más puntos al terminar (si hay más de uno, es empate). null si no terminó.
    get ganadoresFinales() {
      if (!this.terminado) return null;
      const maximo = Math.max(...this.jugadores.map((j) => j.puntos));
      return this.jugadores.filter((j) => j.puntos === maximo);
    }

    // Fuerza de una carta: el As (1) cuenta como 14 para ser la más alta.
    fuerza(carta) {
      return carta.valor === 1 ? 14 : carta.valor;
    }

    // Regla central: > 0 si gana `a`, < 0 si gana `b`, 0 si empatan.
    // Cambia esto (o `fuerza`) para crear variantes del juego.
    compararCartas(a, b) {
      return this.fuerza(a) - this.fuerza(b);
    }

    // "Inteligencia" de una CPU: por ahora juega una carta al azar.
    // Devuelve el índice de la carta en su mano. Aquí puedes mejorar la IA.
    elegirCartaCpu(jugador) {
      return Math.floor(this.aleatorio() * jugador.mano.length);
    }

    // El humano juega la carta en la posición `indice` de su mano y cada CPU elige la suya.
    // Devuelve { ronda, jugadas: [{ jugador, carta }], ganador } — ganador es un índice o null (empate).
    jugarCarta(indice) {
      if (this.terminado) throw new Error('La partida ya terminó');
      if (indice < 0 || indice >= this.humano.mano.length) throw new Error('Índice de carta inválido');

      const jugadas = this.jugadores.map((j) => {
        const i = j.esHumano ? indice : this.elegirCartaCpu(j);
        return { jugador: j.indice, carta: j.mano.splice(i, 1)[0] };
      });

      const ganador = this.ganadorDeRonda(jugadas);
      if (ganador !== null) this.jugadores[ganador].puntos++;

      this.descarte.push(...jugadas.map((x) => x.carta));
      this.robarCartas();

      this.ronda++;
      const resultado = { ronda: this.ronda, jugadas, ganador };
      this.historial.push(resultado);
      return resultado;
    }

    // Índice del jugador con la carta más fuerte, o null si varios empatan con ella
    ganadorDeRonda(jugadas) {
      const mejor = jugadas.reduce((a, b) => (this.compararCartas(b.carta, a.carta) > 0 ? b : a));
      const empatados = jugadas.filter((x) => this.compararCartas(x.carta, mejor.carta) === 0);
      return empatados.length > 1 ? null : mejor.jugador;
    }

    // Todos reponen una carta, solo si alcanza para todos.
    robarCartas() {
      if (this.mazo.quedan < this.numJugadores) return;
      for (const j of this.jugadores) j.mano.push(this.mazo.robar());
    }
  }

  const api = { JuegoCartaAlta, TAMANO_MANO, MIN_JUGADORES, MAX_JUGADORES };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else global.CartaAlta = api;
})(globalThis);
