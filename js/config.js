/*
 * config.js — OPCIONES GENERALES DEL JUEGO
 * Guarda los parámetros que se cambian en la pantalla "⚙ Opciones" y los recuerda en este
 * navegador (localStorage). Si el navegador no deja guardar, se usan los valores por defecto
 * y los cambios duran mientras la página esté abierta.
 *
 * Para añadir una opción nueva: agrégala en POR_DEFECTO, límpiala en `normalizar`
 * y añade su campo en js/pantalla-opciones.js.
 */
(function (global) {
  'use strict';

  const CLAVE = 'juegos-de-cartas:opciones';
  const MAX_LARGO_NOMBRE = 14;

  const POR_DEFECTO = Object.freeze({
    // Nombres de los rivales: CPU 1, CPU 2, ... CPU 5
    nombresCpu: Object.freeze(['Eduardo', 'Luz', 'Franco', 'Cecilia', 'Isabel']),
  });

  // Sin espacios sobrantes y con largo máximo. Si queda vacío, se usa el nombre por defecto.
  function limpiarNombre(nombre, i) {
    const limpio = String(nombre == null ? '' : nombre).trim().replace(/\s+/g, ' ').slice(0, MAX_LARGO_NOMBRE);
    return limpio || POR_DEFECTO.nombresCpu[i];
  }

  // Convierte cualquier dato (guardado o del formulario) en opciones válidas
  function normalizar(datos) {
    const nombres = (datos && Array.isArray(datos.nombresCpu)) ? datos.nombresCpu : [];
    return { nombresCpu: POR_DEFECTO.nombresCpu.map((_, i) => limpiarNombre(nombres[i], i)) };
  }

  function leerGuardado() {
    try { return JSON.parse(global.localStorage.getItem(CLAVE)); } catch (e) { return null; }
  }

  function escribir(datos) {
    try { global.localStorage.setItem(CLAVE, JSON.stringify(datos)); return true; } catch (e) { return false; }
  }

  let actual = normalizar(leerGuardado());

  const Config = {
    POR_DEFECTO,
    MAX_LARGO_NOMBRE,
    // Copia de los nombres actuales (así nadie los cambia sin pasar por guardar)
    get nombresCpu() { return actual.nombresCpu.slice(); },
    // Aplica y guarda. Devuelve true si se pudo guardar en el navegador.
    guardar(datos) {
      actual = normalizar(datos);
      return escribir(actual);
    },
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = Config;
  else global.Config = Config;
})(globalThis);
