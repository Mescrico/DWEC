// Bloque 2 · Promesas
// Explicación: web de DWEC → Practicar → UD 6.2 · Repaso para el Parcial 2 → Bloque 2 (y el apartado 3 de la UD6).
// Comprueba con:  docker compose run --rm web npm run comprobar 2
// En este bloque, NADA de async/await: todo con new Promise, then, catch, finally y los Promise.xxx.
import { ErrorTaller } from "../modelo/errores.js";

// 👀 EJEMPLO RESUELTO ─────────────────────────────────────────────────────────
// consultarStock(pieza, callback) es una función ANTIGUA, con callback: cuando termina llama a callback(error, unidades).
// La «promisificamos»: la llamamos dentro de new Promise y, en su callback, decidimos entre reject y resolve.
export function stockDe(pieza, consultarStock) {
  return new Promise((resolve, reject) => {
    consultarStock(pieza, (error, unidades) => {
      if (error) reject(error);
      else resolve(unidades);
    });
  });
}

// 🪜 ESCALERA ──────────────────────────────────────────────────────────────────
// 🪜 1 · Encadenar. buscarReparacion(id) da una promesa con { id, mecanico: "m1", … }, y buscarMecanico(idMecanico)
//        otra promesa con { id: "m1", nombre: "Lucía" }. Devuelve una promesa con el NOMBRE del mecánico de esa reparación.
//        (pista: si un then devuelve una promesa, el siguiente then recibe su valor; y con llaves, hace falta return)
export function nombreDelMecanico(id, buscarReparacion, buscarMecanico) {
  throw new Error("Sin hacer");
}

// ✍️ TU TURNO ─────────────────────────────────────────────────────────────────
// ✍️ 1 · Como el ejemplo, pero para CUALQUIER función con callback: promisificar(fn) devuelve una función nueva que
//        recibe los mismos argumentos (sin el callback) y devuelve una promesa.
//        const stock = promisificar(consultarStock);   stock("Cadena") → promesa con las unidades
//        (pista: (...args) => new Promise(…) y, dentro, fn(...args, (error, valor) => …))
export function promisificar(fn) {
  throw new Error("Sin hacer");
}

// ✍️ 2 · Una promesa que hace lo mismo que `promesa`, pero si tarda más de `ms`, se rechaza con
//        new ErrorTaller("Tiempo agotado", { ms }). Si `promesa` falla antes, el error es el SUYO.
//        (pista: Promise.race entre la promesa y otra que se rechaza a los ms milisegundos)
export function conTiempoLimite(promesa, ms) {
  throw new Error("Sin hacer");
}

// ✍️ 3 · Pedir el precio de una pieza a varios proveedores A LA VEZ y quedarse con el más barato.
//        proveedores = { "Bicis Sur": fn, "Pedal": fn, … }; cada fn(pieza) da una promesa con el precio (o se rechaza).
//        Se cumple con { proveedor, precio, sinRespuesta: [los nombres de los que han fallado] }.
//        Si fallan TODOS, se rechaza con new ErrorTaller("Ningún proveedor responde", { pieza }).
//        Un proveedor que falla NO estropea a los demás: ¿Promise.all o Promise.allSettled?
export function compararProveedores(pieza, proveedores) {
  throw new Error("Sin hacer");
}
