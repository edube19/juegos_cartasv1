/*
 * app.js — NAVEGACIÓN
 * Maneja las pantallas: menú principal → partida → mensaje de fin (repetir / volver al menú).
 * No conoce ningún juego en concreto: usa los modos registrados en Modos.lista.
 */
(function () {
  'use strict';

  const $ = (id) => document.getElementById(id);
  const pantallaMenu = $('pantalla-menu');
  const pantallaJuego = $('pantalla-juego');
  const pantallaOpciones = $('pantalla-opciones');
  const listaModos = $('lista-modos');
  const tituloModo = $('titulo-modo');
  const contenedor = $('contenedor-juego');
  const dialogoFin = $('fin-partida');

  let modoActual = null;
  let opcionesActuales = null; // p. ej. { jugadores: 3 } — se reutilizan al Repetir / Reiniciar
  let partida = 0; // cambia en cada partida; sirve para ignorar avisos de partidas abandonadas
  const elecciones = {}; // lo elegido en el menú por cada modo, para no perderlo al volver

  function mostrarPantalla(pantalla) {
    for (const p of [pantallaMenu, pantallaJuego, pantallaOpciones]) p.hidden = p !== pantalla;
  }

  // "Tú, Eduardo y Luz" — usa los nombres de las CPU configurados en ⚙ Opciones
  function textoJugadores(n) {
    if (n === 1) return 'Solo tú';
    const nombres = ['Tú', ...Config.nombresCpu.slice(0, n - 1)];
    while (nombres.length < n) nombres.push(`CPU ${nombres.length}`);
    return nombres.slice(0, -1).join(', ') + ' y ' + nombres[nombres.length - 1];
  }

  // Fila del menú para elegir un número dentro de un rango { min, max, defecto }.
  // Si min === max solo muestra el valor fijo. Llama a alCambiar(n) con cada elección.
  function crearSelector(etiqueta, { min, max, defecto }, textoDetalle, alCambiar) {
    const fila = document.createElement('div');
    fila.className = 'selector';
    fila.innerHTML = '<span class="etiqueta"></span><div class="opciones"></div><small></small>';
    const opciones = fila.querySelector('.opciones');
    const detalle = fila.querySelector('small');

    fila.querySelector('.etiqueta').textContent = min === max ? `${etiqueta}: ${min}` : `${etiqueta}:`;
    if (min !== max) {
      for (let n = min; n <= max; n++) {
        const boton = document.createElement('button');
        boton.className = 'opcion';
        boton.textContent = n;
        boton.addEventListener('click', () => elegir(n));
        opciones.append(boton);
      }
    }

    function elegir(n) {
      opciones.querySelectorAll('.opcion').forEach((b) => b.setAttribute('aria-pressed', Number(b.textContent) === n));
      detalle.textContent = textoDetalle ? textoDetalle(n) : '';
      alCambiar(n);
    }
    elegir(defecto);
    return fila;
  }

  // Tarjeta de un modo en el menú: nombre, descripción, selector de jugadores,
  // un selector por cada ajuste extra del modo y el botón Jugar.
  function crearTarjeta(modo) {
    const anteriores = elecciones[modo.id] || {};
    const elegidos = elecciones[modo.id] = {}; // p. ej. { jugadores: 4, jokers: 2 }
    const conAnterior = (id, rango) => (anteriores[id] === undefined ? rango : { ...rango, defecto: anteriores[id] });

    const tarjeta = document.createElement('article');
    tarjeta.className = 'modo';
    tarjeta.innerHTML = '<h2></h2><p></p><div class="selectores"></div><button class="primario">Jugar</button>';
    tarjeta.querySelector('h2').textContent = modo.nombre;
    tarjeta.querySelector('p').textContent = modo.descripcion;

    const selectores = tarjeta.querySelector('.selectores');
    selectores.append(crearSelector('👥 Jugadores', conAnterior('jugadores', modo.jugadores), textoJugadores, (n) => { elegidos.jugadores = n; }));
    for (const ajuste of modo.ajustes) {
      selectores.append(crearSelector(ajuste.etiqueta, conAnterior(ajuste.id, ajuste), null, (n) => { elegidos[ajuste.id] = n; }));
    }

    // Además de lo elegido, cada modo recibe los nombres de las CPU (opciones.nombresCpu)
    tarjeta.querySelector('.primario').addEventListener('click', () => iniciarModo(modo, { ...elegidos, nombresCpu: Config.nombresCpu }));
    return tarjeta;
  }

  function pintarMenu() {
    listaModos.replaceChildren(...Modos.lista.map(crearTarjeta));
  }

  function iniciarModo(modo, opciones) {
    const id = ++partida;
    modoActual = modo;
    opcionesActuales = opciones;
    tituloModo.textContent = `${modo.nombre} · ${opciones.jugadores} jugador${opciones.jugadores > 1 ? 'es' : ''}`;
    contenedor.replaceChildren();
    mostrarPantalla(pantallaJuego);
    modo.iniciar(contenedor, (fin) => { if (id === partida) mostrarFin(fin); }, opciones);
  }

  function volverAlMenu() {
    partida++;
    contenedor.replaceChildren();
    mostrarPantalla(pantallaMenu);
  }

  function mostrarFin({ resultado, titulo, detalle }) {
    dialogoFin.dataset.resultado = resultado;
    $('fin-titulo').textContent = titulo;
    $('fin-detalle').textContent = detalle;
    dialogoFin.showModal();
  }

  $('fin-repetir').addEventListener('click', () => { dialogoFin.close(); iniciarModo(modoActual, opcionesActuales); });
  $('fin-menu').addEventListener('click', () => { dialogoFin.close(); volverAlMenu(); });
  dialogoFin.addEventListener('cancel', (e) => e.preventDefault()); // Esc no lo cierra: hay que elegir
  $('btn-menu').addEventListener('click', volverAlMenu);
  $('btn-reiniciar').addEventListener('click', () => iniciarModo(modoActual, opcionesActuales));
  $('btn-opciones').addEventListener('click', () => {
    PantallaOpciones.abrir(() => { pintarMenu(); mostrarPantalla(pantallaMenu); }); // al salir se redibuja el menú con los nombres nuevos
    mostrarPantalla(pantallaOpciones);
  });

  pintarMenu();
  mostrarPantalla(pantallaMenu);
})();
