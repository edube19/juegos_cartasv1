/*
 * vista.js — PANTALLA DEL MODO "Carta Alta" (de 2 a 4 jugadores)
 * Dibuja la partida dentro del contenedor que le da la app y avisa cuando termina.
 * No contiene reglas (están en reglas.js) ni maneja menús (eso lo hace js/app.js).
 */
(function () {
  'use strict';

  const { JuegoCartaAlta, MIN_JUGADORES, MAX_JUGADORES } = CartaAlta;

  const PLANTILLA = `
    <div class="ca">
      <div class="ca-tablero">
        <div class="marcador" data-ref="marcador"></div>
        <div class="rivales" data-ref="rivales"></div>
        <section class="mesa" data-ref="mesa"></section>
        <p class="mensaje" data-ref="mensaje"></p>
        <section>
          <h2>Tu mano (haz clic para jugar)</h2>
          <div class="mano" data-ref="manoHumano"></div>
        </section>
      </div>
      <aside class="historial">
        <h2>Historial</h2>
        <ol data-ref="historial"></ol>
      </aside>
    </div>`;

  const PAUSA_FINAL_MS = 800; // tiempo para ver la última jugada antes del mensaje final

  // "Tú, CPU 1 y CPU 2"
  function unirNombres(jugadores) {
    const n = jugadores.map((j) => j.nombre);
    return n.length > 1 ? n.slice(0, -1).join(', ') + ' y ' + n[n.length - 1] : n[0];
  }

  function iniciar(contenedor, terminar, opciones) {
    const juego = new JuegoCartaAlta(opciones.jugadores, Math.random, opciones.nombresCpu);

    contenedor.innerHTML = PLANTILLA;
    const el = {};
    contenedor.querySelectorAll('[data-ref]').forEach((n) => { el[n.dataset.ref] = n; });

    function crear(etiqueta, clase, texto) {
      const n = document.createElement(etiqueta);
      if (clase) n.className = clase;
      if (texto !== undefined) n.textContent = texto;
      return n;
    }

    function textoRonda(r) {
      if (r.ganador === null) return 'Empate en la carta más alta: nadie suma';
      const g = juego.jugadores[r.ganador];
      const carta = r.jugadas[r.ganador].carta;
      return g.esHumano ? `¡Ganaste la ronda con ${carta}!` : `${g.nombre} gana la ronda con ${carta}`;
    }

    function resumenFinal() {
      const ganadores = juego.ganadoresFinales;
      const humanoGana = ganadores.includes(juego.humano);
      let resultado, titulo;
      if (humanoGana && ganadores.length === 1) {
        resultado = 'victoria'; titulo = '🏆 ¡Ganaste la partida!';
      } else if (humanoGana) {
        resultado = 'empate'; titulo = `🤝 Empate entre ${unirNombres(ganadores)}`;
      } else {
        resultado = 'derrota';
        titulo = ganadores.length === 1 ? `💻 ${ganadores[0].nombre} gana la partida` : `💻 Empate entre ${unirNombres(ganadores)}`;
      }
      const puntos = juego.jugadores.map((j) => `${j.nombre} ${j.puntos}`).join(' · ');
      return { resultado, titulo, detalle: `Puntos: ${puntos} (${juego.ronda} rondas)` };
    }

    function jugar(indice) {
      juego.jugarCarta(indice);
      render();
      if (juego.terminado) setTimeout(() => terminar(resumenFinal()), PAUSA_FINAL_MS);
    }

    function render() {
      const r = juego.ultimaRonda;

      // Marcador: puntos de cada jugador + ronda + mazo
      el.marcador.replaceChildren(
        ...juego.jugadores.map((j) => {
          const s = crear('span', j.esHumano ? 'yo' : '', `${j.nombre}: `);
          s.append(crear('b', '', j.puntos));
          return s;
        }),
        crear('span', 'info', `Ronda ${juego.ronda} · Mazo ${juego.mazo.quedan}`),
      );

      // Rivales: nombre y cartas boca abajo
      el.rivales.replaceChildren(...juego.jugadores.filter((j) => !j.esHumano).map((j) => {
        const div = crear('div', 'rival');
        div.append(crear('h2', '', j.nombre));
        const mano = crear('div', 'mano mini');
        mano.append(...j.mano.map(Dibujo.reverso));
        div.append(mano);
        return div;
      }));

      // Mesa: un hueco por jugador con la carta que jugó en la última ronda
      el.mesa.replaceChildren(...juego.jugadores.map((j) => {
        const puesto = crear('div', 'puesto');
        puesto.append(crear('h2', '', j.nombre));
        const hueco = crear('div', 'hueco');
        if (r) {
          const carta = Dibujo.carta(r.jugadas[j.indice].carta);
          if (r.ganador === j.indice) carta.classList.add('ganadora');
          hueco.append(carta);
        }
        puesto.append(hueco);
        return puesto;
      }));

      if (juego.terminado) el.mensaje.textContent = resumenFinal().titulo;
      else el.mensaje.textContent = r ? textoRonda(r) : 'Elige una carta de tu mano';

      // Mano del humano: cartas clicables
      el.manoHumano.replaceChildren(...juego.humano.mano.map((carta, i) => {
        const div = Dibujo.carta(carta);
        div.classList.add('jugable');
        div.addEventListener('click', () => jugar(i));
        return div;
      }));

      // Historial (más reciente arriba)
      el.historial.replaceChildren(...juego.historial.slice().reverse().map((h) => {
        const cartas = h.jugadas.map((x) => `${juego.jugadores[x.jugador].nombre} ${x.carta}`).join(' · ');
        const quien = h.ganador === null ? 'empate' : juego.jugadores[h.ganador].nombre;
        return crear('li', h.ganador === null ? 'empate' : h.ganador === 0 ? 'jugador' : 'cpu', `R${h.ronda}: ${cartas} → ${quien}`);
      }));
    }

    render();
  }

  Modos.registrar({
    id: 'carta-alta',
    nombre: 'Carta Alta',
    descripcion: 'Todos juegan una carta por ronda y gana la más alta. El As es la carta más fuerte.',
    jugadores: { min: MIN_JUGADORES, max: MAX_JUGADORES, defecto: 2 },
    iniciar,
  });
})();
