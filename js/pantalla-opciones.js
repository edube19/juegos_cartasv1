/*
 * pantalla-opciones.js — PANTALLA "⚙ Opciones"
 * Muestra el formulario con las opciones generales (js/config.js) y las guarda.
 * La app la abre con PantallaOpciones.abrir(alSalir); alSalir() vuelve al menú.
 */
(function (global) {
  'use strict';

  const $ = (id) => document.getElementById(id);
  const formulario = $('form-opciones');
  const estado = $('opciones-estado');
  let alSalir = () => {};

  function campos() {
    return [...formulario.querySelectorAll('input[name^="cpu"]')];
  }

  // Un campo de texto por CPU, con el valor actual y el nombre por defecto como pista
  function pintarCampos(nombres) {
    $('campos-nombres').replaceChildren(...nombres.map((nombre, i) => {
      const campo = document.createElement('label');
      campo.className = 'campo';
      campo.innerHTML = '<span></span><input type="text" autocomplete="off">';
      campo.querySelector('span').textContent = `CPU ${i + 1}`;
      const input = campo.querySelector('input');
      input.name = `cpu${i + 1}`;
      input.value = nombre;
      input.maxLength = Config.MAX_LARGO_NOMBRE;
      input.placeholder = Config.POR_DEFECTO.nombresCpu[i];
      return campo;
    }));
  }

  function abrir(funcionSalir) {
    alSalir = funcionSalir;
    estado.textContent = '';
    pintarCampos(Config.nombresCpu);
  }

  // Guardar: aplica los cambios y vuelve al menú
  formulario.addEventListener('submit', (e) => {
    e.preventDefault();
    const guardado = Config.guardar({ nombresCpu: campos().map((input) => input.value) });
    if (guardado) {
      alSalir();
    } else {
      pintarCampos(Config.nombresCpu);
      estado.textContent = 'Este navegador no permite guardar: los nombres se usarán solo mientras la página esté abierta.';
    }
  });

  // Restaurar: rellena con los valores por defecto (se aplican al pulsar Guardar)
  $('opciones-restaurar').addEventListener('click', () => {
    pintarCampos(Config.POR_DEFECTO.nombresCpu);
    estado.textContent = 'Valores por defecto cargados. Pulsa Guardar para aplicarlos.';
  });

  // Volver sin guardar
  $('opciones-volver').addEventListener('click', () => alSalir());

  global.PantallaOpciones = { abrir };
})(globalThis);
