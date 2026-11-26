// app.js — Bloque B · ✍️ B4, B5 y B6. Conecta el modelo (el tablero) con la página: pinta, escucha y avisa.
// Usa tus piezas: crearTarjeta/pintarLista, leerFormulario/mostrarErrores y delegar.
// La estructura de la página (ids, data-*) está en index.html y NO se cambia: la usan los tests.
import { ErrorTablero } from "../modelo/errores.js";
import { delegar } from "./delegacion.js";
import { leerFormulario, mostrarErrores } from "./formulario.js";
import { pintarLista } from "./tarjeta.js";

/** Botones de cada tarjeta según su columna: [texto, data-accion] */
const ACCIONES = {
  "Por hacer": [["Empezar →", "empezar"]],
  "En curso": [
    ["← Volver", "volver"],
    ["✓ Completar", "completar"],
  ],
  Hecho: [],
};

// ✍️ B6 · validar(datos) → { campo: "mensaje" } con los errores (objeto vacío si todo está bien)
//   - titulo: obligatorio y como mucho 80 caracteres
//   - cadaDias (si viene): entero mayor que 0. Si es correcto pero no hay limite, el error va
//     en «limite»: una tarea que se repite necesita fecha límite
export function validar(datos) {
  const errores = {};
  if (!datos.titulo || datos.titulo.length > 80) {
    errores["titulo"] = "No se puede dejar el titulo vacio ni ser mayor de 80 caracteres";
  }
  if (datos.cadaDias !== undefined && datos.cadaDias !== null) {
    if (Number.isInteger(datos.cadaDias) && datos.cadaDias > 0) {
      if (!datos.limite) {
        errores["limite"] = "Una tarea que se repite necesita fecha límite";
      }
    } else if (!Number.isInteger(datos.cadaDias) || datos.cadaDias <= 0) {
      errores["cadaDias"] = "Tiene que ser un numero entero mayor que 0";
    }
  }
  return errores;
}

/**
 * Arranca la interfaz dentro de raiz (el <main id="app">). Los listeners se ponen UNA vez aquí;
 * pintar() solo cambia nodos, así que repintar no los duplica.
 * opciones.hoy: fecha fija para los tests · opciones.alCambiar(tablero): tras cada cambio (UD6)
 */
export function iniciarApp(raiz, tablero, { hoy = null, alCambiar = () => {} } = {}) {
  const form = raiz.querySelector("#form-alta");
  const aviso = raiz.querySelector("#aviso");
  const columnas = raiz.querySelector("#columnas");
  const resumen = raiz.querySelector("#resumen");

  // ✍️ B4 · pintar(): deja la página igual que el modelo cada vez que se llama, y NO pone listeners
  //   - cada columna ([data-columna="…"]): sus tareas en el orden de ordenadas(), con pintarLista en su
  //     .lista, y en cada .tarjeta sus botones según ACCIONES: <button type="button" data-accion="…">
  //   - el .contador de cada columna: (n), o (n/límite) en la que tiene límite WIP
  //   - [data-dato="progreso"]: hechas ÷ total en %, redondeado (con el tablero vacío, 0 %)
  //   - [data-dato="vencidas"]: las vencidas de tablero.resumen(ahora)
  //   La fecha de hoy: const ahora = hoy ?? new Date();  (los tests pasan una fija)
  function pintar() {
    const ahora = hoy ?? new Date();
    const listaColumnas = columnas.querySelectorAll("[data-columna]");

    for (const columna of listaColumnas) {
      const nombre = columna.dataset.columna;
      const contenedorLista = columna.querySelector(".lista");
      const columnaObjeto = tablero.columna(nombre);
      const tareasOrdenadas = columnaObjeto.ordenadas();

      pintarLista(contenedorLista, tareasOrdenadas, ahora);

      const contadorElemento = columna.querySelector(".contador");
      const n = tareasOrdenadas.length;
      if (columnaObjeto.limiteWip) {
        contadorElemento.textContent = `(${n}/${columnaObjeto.limiteWip})`;
      } else {
        contadorElemento.textContent = `(${n})`;
      }

      const contenedorTarjetas = contenedorLista.querySelectorAll(".tarjeta");
      const accionesPermitidas = ACCIONES[nombre];

      for (const tarjeta of contenedorTarjetas) {
        for (const [texto, accion] of accionesPermitidas) {
          const boton = document.createElement("button");
          boton.type = "button";
          boton.dataset.accion = accion;
          boton.textContent = texto;
          tarjeta.append(boton);
        }
        if (nombre === "Por hacer" && tablero.buscar(Number(tarjeta.dataset.id)).limite) tarjeta.append(crearBoton("Renombrar y empezar", "renombrar"));
      }
    }
    const resumen = tablero.resumen(ahora);
    const total = resumen.porHacer + resumen.enCurso + resumen.hecho;
    const hechas = resumen.hecho;
    let porcentaje = 0;
    if (total > 0) {
      porcentaje = Math.round((hechas / total) * 100, 2);
    }

    const progresoElemento = raiz.querySelector('[data-dato="progreso"]');
    const vencidasElemento = raiz.querySelector('[data-dato="vencidas"]');

    progresoElemento.textContent = `${porcentaje} %`;
    vencidasElemento.textContent = `${resumen.vencidas}`;
  }

  // 👀 Resuelto: avisar("texto") enseña el aviso; avisar("") lo esconde
  function avisar(mensaje) {
    aviso.textContent = mensaje;
    aviso.hidden = mensaje === "";
  }

  // ✍️ B5 · UN listener, puesto UNA vez aquí (nunca dentro de pintar): clic en los botones de las
  //   tarjetas, con delegar sobre `columnas`. empezar → «En curso», volver → «Por hacer», completar.
  //   Tras cada cambio que sale bien: avisar(""), pintar() y alCambiar(tablero).
  //   Si el tablero lanza un ErrorTablero → avisar(error.message) y no se repinta.
  //   Cualquier otro error → se relanza (es un fallo del programa).
  //   Pista: una función cambiar(accion) con el try/catch te sirve también para el B6.
  delegar(columnas, "click", "button", (boton) => {
    const accion = boton.dataset.accion;
    const tarjeta = boton.closest(".tarjeta");
    const idTarjeta = Number(tarjeta.dataset.id);

    cambiar(accion, idTarjeta);
  });

  delegar(columnas, "submit", "form", (formulario, evento) => {
    evento.preventDefault();
    const tarea = tablero.buscar(Number(formulario.closest(".tarjeta").dataset.id));
    const accion = formulario.closest("button").dataset.accion
    const valor = formulario.elements.titulo.value.trim();
    const mensaje = revisar(valor, tarea, tablero, hoy ?? new Date());
    mostrarErrores(formulario, { titulo: mensaje });
    if (mensaje === "") {
      cambiar(accion, aplicar(tablero, tarea, valor) );
    }
  });

  function cambiar(accion, idTarjeta) {
    try {
      if (accion === "empezar") {
        tablero.mover(idTarjeta, "En curso");
      } else if (accion === "volver") {
        tablero.mover(idTarjeta, "Por hacer");
      } else if (accion === "completar") {
        tablero.completar(idTarjeta);
      } else if (accion === "renombrar") {
        columnas.querySelector("form")?.remove()
        const tarea = tablero.buscar(idTarjeta);
        crearFormulario(tarea)
      } else if (accion === "cancelar") {
        return columnas.querySelector("form")?.remove();
      }
      
      avisar("");
      pintar();
      alCambiar(tablero);
    } catch (error) {
      if (error instanceof ErrorTablero) {
        avisar(error.message);
      } else {
        throw error;
      }
    }
  }
  // ✍️ B6 · submit de `form`: preventDefault, leerFormulario, validar y mostrarErrores. Si hay errores,
  //   no se crea nada. Si no, tablero.crearTarea(datos) (como un cambio más) y form.reset().
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const datos = leerFormulario(form);
    const errores = validar(datos);
    mostrarErrores(form, errores);
    if (Object.keys(errores).length === 0) {
      tablero.columna("Por hacer").añadir(tablero.crearTarea(datos));
      form.reset();
    }
    avisar("");
    pintar();
    alCambiar(tablero);
  });
  pintar();
  return { pintar };
}

function revisar(valor, tarea, tablero, hoy) {
  if(valor === null || valor > 80) {
    return "Escribe un titulo de 1 a 80 caracteres"
  }
  for(const columna of tablero.COLUMNAS) {
    const tareas = tablero.columna(columna).tareas
    for(const tareaDe of tareas) {
      if(tareaDe.titulo === tarea.titulo) {
        return "Ya hay una tarea con ese titulo"
      }
    }
  }
  if(tablero.columna("En curso").llena()) {
    avisar("'En curso' está llena")
  }
  return "";
}

function aplicar(tablero, tarea, valor) {
  tablero.mover(tarea.id, "En curso");
  tarea.titulo = valor;

  return tarea.id
}
function crearBoton(texto, accion) {
    const boton = document.createElement("button");
    boton.type = "button";
    boton.dataset.accion = accion;
    boton.textContent = texto;

    return boton;
}

const crear = (etiqueta, datos) => Object.assign(document.createElement(etiqueta), datos);

function crearFormulario(tarea) {
  const form = crear("form", { noValidate: true });
  form.dataset.form = "renombrar";
  const etiqueta = crear("label", { textContent: `Título nuevo de «${tarea.titulo}»` });
  etiqueta.append(crear("input", { name: "titulo", type: "text", value: tarea.titulo }));
  const error = crear("p", { className: "error" });
  error.dataset.errorDe = "titulo";
  const enviar = crear("button", { type: "submit", textContent: "Guardar" });
  form.append(etiqueta, error, enviar, crearBoton("Cancelar", "cancelar"));
  return form;
}

(void ACCIONES, ErrorTablero, delegar, leerFormulario, mostrarErrores, pintarLista); // (borra esta línea cuando los uses)
