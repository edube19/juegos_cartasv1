/*
 * vista.js — PANTALLA DEL MODO "P07o-suci0"
 * Dibuja la partida, recibe tus clics (colocar o robar) y hace jugar a las CPU con una pausa.
 * No contiene reglas (están en reglas.js) ni maneja menús (eso lo hace js/app.js).
 *
 * Privacidad: solo ves tu mano. Si una CPU roba una carta equivocada a otra CPU,
 * no se muestra cuál era (igual que en la vida real). Sí ves lo que te roban a ti y lo que robas tú.
 */
(function () {
  'use strict';

  const { JuegoP07oSuci0, MIN_JUGADORES, MAX_JUGADORES, MIN_JOKERS, MAX_JOKERS } = P07oSuci0;
  const { PALOS, Carta } = Cartas;

  const PLANTILLA = `
    <div class="ps">
      <div class="ps-tablero">
        <div class="ps-estado">
          <div class="buscada" data-ref="buscada"></div>
          <p class="mensaje" data-ref="mensaje"></p>
          <button class="secundario" data-ref="velocidad"></button>
        </div>
        <section class="pilas" data-ref="pilas"></section>
        <div class="rivales" data-ref="rivales"></div>
        <section>
          <h2 data-ref="tituloMano"></h2>
          <div class="mano" data-ref="manoHumano"></div>
        </section>
      </div>
      <aside class="historial">
        <h2>Jugadas</h2>
        <ol data-ref="historial"></ol>
      </aside>
    </div>`;

  const PAUSAS_CPU_MS = { normal: 700, rapida: 150 }; // tiempo entre jugadas de las CPU
  const PAUSA_FINAL_MS = 900;
  const ORDEN_PALO = Object.fromEntries(PALOS.map((p, i) => [p.id, i]));

  const plural = (n, uno, varios) => (n === 1 ? uno : varios);
  const unir = (nombres) => (nombres.length > 1 ? nombres.slice(0, -1).join(', ') + ' y ' + nombres[nombres.length - 1] : nombres[0] || '');

  function iniciar(contenedor, terminar, opciones) {
    const juego = new JuegoP07oSuci0({ jugadores: opciones.jugadores, jokers: opciones.jokers, nombresCpu: opciones.nombresCpu });
    let velocidad = 'normal';

    contenedor.innerHTML = PLANTILLA;
    const raiz = contenedor.firstElementChild;
    const el = {};
    contenedor.querySelectorAll('[data-ref]').forEach((n) => { el[n.dataset.ref] = n; });

    el.velocidad.addEventListener('click', () => {
      velocidad = velocidad === 'normal' ? 'rapida' : 'normal';
      render();
    });

    function crear(etiqueta, clase, texto) {
      const n = document.createElement(etiqueta);
      if (clase) n.className = clase;
      if (texto !== undefined) n.textContent = texto;
      return n;
    }

    const nombre = (i) => juego.jugadores[i].nombre;
    const esHumano = (i) => juego.jugadores[i].esHumano;

    function textoBuscada() {
      const b = juego.cartaBuscada;
      return b.palo ? new Carta(b.valor, b.palo).toString() : 'un As de un palo nuevo';
    }

    // ---- Texto de cada jugada (respeta lo que el humano puede saber) ----
    function textoEvento(e) {
      const n = nombre(e.jugador);
      if (e.tipo === 'colocar') return esHumano(e.jugador) ? `Colocaste ${e.carta}` : `${n} coloca ${e.carta}`;

      let t;
      const v = nombre(e.victima);
      if (e.acierto) {
        if (esHumano(e.jugador)) t = `Le robaste ${e.carta} a ${v} y lo colocaste`;
        else if (esHumano(e.victima)) t = `${n} te robó ${e.carta} y lo colocó`;
        else t = `${n} le robó ${e.carta} a ${v} y lo colocó`;
      } else if (esHumano(e.jugador)) {
        t = e.carta.esJoker ? `¡Le robaste un JOKER 🃏 a ${v}!` : `Le robaste ${e.carta} a ${v}: no era. Se queda en tu mano`;
      } else if (esHumano(e.victima)) {
        t = e.carta.esJoker ? `${n} te robó un JOKER 🃏 ¡Te libraste de él!` : `${n} te robó ${e.carta}, pero no era la correcta`;
      } else {
        t = `${n} le robó una carta a ${v}, pero no era la correcta`;
      }
      if (e.retirado) t += esHumano(e.jugador) ? '. ¡Sin cartas y acertaste: ya ganaste! 🏆' : `. ${n} se quedó sin cartas: ¡ya ganó! 🏆`;
      return t;
    }

    function claseEvento(e) {
      if (e.tipo === 'robo' && !e.acierto) return e.carta.esJoker && (esHumano(e.jugador) || esHumano(e.victima)) ? 'joker' : 'fallo';
      return esHumano(e.jugador) ? 'jugador' : '';
    }

    // ---- Final ----
    function resumenFinal() {
      const misJokers = juego.jokersDe(juego.humano);
      const perdedores = juego.perdedores.map((j) => `${j.nombre} (${juego.jokersDe(j)} 🃏)`);
      const ganadores = juego.ganadores.map((j) => j.nombre);
      const detalle = `Pierden: ${unir(perdedores)}.` + (ganadores.length ? ` Ganan: ${unir(ganadores)}.` : '');
      if (misJokers === 0) return { resultado: 'victoria', titulo: '🏆 ¡Ganaste! Terminaste sin JOKER', detalle };
      return {
        resultado: 'derrota',
        titulo: misJokers === 1 ? '🃏 Perdiste: te quedaste con el JOKER' : `🃏 Perdiste: te quedaste con ${misJokers} JOKERS`,
        detalle,
      };
    }

    // ---- Turnos ----
    function despuesDeJugar() {
      render();
      if (juego.terminado) {
        setTimeout(() => { if (raiz.isConnected) terminar(resumenFinal()); }, PAUSA_FINAL_MS);
      } else if (!juego.jugadorActual.esHumano) {
        setTimeout(turnoCpu, PAUSAS_CPU_MS[velocidad]);
      }
    }

    function turnoCpu() {
      if (!raiz.isConnected) return; // la partida se abandonó (volviste al menú o reiniciaste)
      juego.jugarTurnoCpu();
      despuesDeJugar();
    }

    const turnoHumano = () => !juego.terminado && juego.jugadorActual.esHumano;

    // ---- Dibujo ----
    function render() {
      const humano = juego.humano;
      const miTurno = turnoHumano();
      const victimas = miTurno && juego.debeRobar ? juego.victimas() : [];

      // Carta buscada
      el.buscada.replaceChildren(crear('h2', '', juego.terminado ? 'Partida terminada' : 'Se busca'));
      if (!juego.terminado) {
        const b = juego.cartaBuscada;
        if (b.palo) {
          el.buscada.append(Dibujo.carta(new Carta(b.valor, b.palo)));
        } else {
          const ases = crear('div', 'ases-pendientes');
          ases.append(...juego.palosPendientes.map((p) => Dibujo.carta(new Carta(1, p))));
          el.buscada.append(crear('div', 'texto-as', 'Un As de:'), ases);
        }
      }

      // Mensaje principal
      let mensaje;
      if (juego.terminado) mensaje = resumenFinal().titulo;
      else if (humano.retirado) mensaje = '🏆 ¡Ya ganaste! Mira cómo termina la partida…';
      else if (!miTurno) mensaje = `Turno de ${juego.jugadorActual.nombre}…`;
      else if (!juego.debeRobar) mensaje = 'Te toca: coloca una de tus cartas resaltadas';
      else if (humano.mano.length === 0) mensaje = `No tienes cartas: roba a ciegas a ${unir(victimas.map((j) => j.nombre))}. ¡Si aciertas, ganas!`;
      else mensaje = `No tienes ${textoBuscada()}. Roba una carta boca abajo a ${unir(victimas.map((j) => j.nombre))}`;
      el.mensaje.textContent = mensaje;
      el.mensaje.classList.toggle('accion', miTurno);

      el.velocidad.textContent = velocidad === 'normal' ? '⏩ CPU rápida' : '▶ CPU normal';

      // Pilas: una por palo, con la última carta colocada
      el.pilas.replaceChildren(...PALOS.map((p) => {
        const pila = crear('div', 'pila');
        if (juego.paloActual && juego.paloActual.id === p.id && !juego.buscaAs) pila.classList.add('activa');
        const ultima = juego.pilas[p.id];
        const hueco = crear('div', 'hueco');
        if (ultima) hueco.append(Dibujo.carta(ultima));
        else hueco.append(crear('span', 'palo-vacio ' + p.color, p.simbolo));
        pila.append(hueco, crear('small', '', ultima ? `${ultima.valor}/13` : '0/13'));
        return pila;
      }));

      // Rivales: cartas boca abajo; si te toca robar, las de las víctimas se pueden clicar
      el.rivales.replaceChildren(...juego.jugadores.filter((j) => !j.esHumano).map((j) => {
        const div = crear('div', 'rival');
        if (!juego.terminado && juego.jugadorActual === j) div.classList.add('turno');
        if (j.retirado) div.classList.add('retirado');
        const esVictima = victimas.includes(j);
        if (esVictima) div.classList.add('victima');

        const cabecera = `${j.nombre} · ${j.mano.length} ${plural(j.mano.length, 'carta', 'cartas')}` + (j.retirado ? ' · 🏆 ganó' : '');
        div.append(crear('h2', '', cabecera));

        const mano = crear('div', 'mano mini abanico');
        if (juego.terminado) {
          mano.append(...j.mano.map(Dibujo.carta)); // al final se muestran (solo quedan jokers)
        } else {
          mano.append(...j.mano.map((_, posicion) => {
            const reverso = Dibujo.reverso();
            if (esVictima) {
              reverso.classList.add('robable');
              reverso.title = `Robar esta carta a ${j.nombre}`;
              reverso.addEventListener('click', () => { juego.robar(j.indice, posicion); despuesDeJugar(); });
            }
            return reverso;
          }));
        }
        div.append(mano);
        return div;
      }));

      // Tu mano (ordenada por palo y valor; los jokers al final)
      const jokers = juego.jokersDe(humano);
      el.tituloMano.textContent = `Tu mano · ${humano.mano.length} ${plural(humano.mano.length, 'carta', 'cartas')}` +
        (jokers ? ` · ${jokers} 🃏` : '') + (humano.retirado ? ' · 🏆 ganaste' : '');

      const ordenadas = humano.mano.map((carta, indice) => ({ carta, indice })).sort((a, b) => {
        if (a.carta.esJoker !== b.carta.esJoker) return a.carta.esJoker ? 1 : -1;
        if (a.carta.esJoker) return 0;
        return ORDEN_PALO[a.carta.palo.id] - ORDEN_PALO[b.carta.palo.id] || a.carta.valor - b.carta.valor;
      });
      el.manoHumano.replaceChildren(...ordenadas.map(({ carta, indice }) => {
        const div = Dibujo.carta(carta);
        if (miTurno && juego.esValida(carta)) {
          div.classList.add('jugable', 'valida');
          div.addEventListener('click', () => { juego.colocar(indice); despuesDeJugar(); });
        } else if (miTurno) {
          div.classList.add('apagada');
        }
        return div;
      }));

      // Historial (más reciente arriba)
      el.historial.replaceChildren(...juego.historial.slice().reverse().map((e) => crear('li', claseEvento(e), textoEvento(e))));
    }

    despuesDeJugar(); // dibuja y, si empieza una CPU, la pone a jugar
  }

  Modos.registrar({
    id: 'p07o-suci0',
    nombre: 'P07o-suci0',
    descripcion: 'Se reparte todo el mazo con JOKERS. Completen cada palo del A al K; si no tienes la carta que toca, róbala a ciegas. Quien termine con un JOKER pierde.',
    jugadores: { min: MIN_JUGADORES, max: MAX_JUGADORES, defecto: 4 },
    ajustes: [{ id: 'jokers', etiqueta: '🃏 Jokers', min: MIN_JOKERS, max: MAX_JOKERS, defecto: 1 }],
    iniciar,
  });
})();
