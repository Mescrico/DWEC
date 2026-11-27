// Bloque 4 · fetch
// Explicación: web de DWEC → Practicar → UD 6.2 · Repaso para el Parcial 2 → Bloque 4 (y los apartados 5 y 6 de la UD6).
// Comprueba con:  docker compose run --rm web npm run comprobar 4
// Cada función recibe `fetchFn` y la usa igual que fetch: fetchFn(url, opciones). Por defecto es el fetch de verdad
// (en la página); el comprobador te pasa uno de mentira que responde 200, 404, 500, se queda sin red o no contesta.
import { ErrorEstado, ErrorTaller } from "../modelo/errores.js";
import { Reparacion, ReparacionUrgente } from "../modelo/reparacion.js";

// 👀 EJEMPLO RESUELTO ─────────────────────────────────────────────────────────
// El código de estado de una URL. fetch se cumple en cuanto llegan las cabeceras: aquí no hace falta leer el cuerpo.
export async function estadoDe(url, fetchFn = fetch) {
  const res = await fetchFn(url);
  return res.status;
}

// 🪜 ESCALERA ──────────────────────────────────────────────────────────────────
// 🪜 1 · Las opciones de fetch para ENVIAR `datos` en JSON con un POST:
//        opcionesPOST({ id: 7 }) → { method: "POST", headers: { "Content-Type": "application/json" }, body: '{"id":7}' }
export function opcionesPOST(datos) {
  throw new Error("Sin hacer");
}

// ✍️ TU TURNO ─────────────────────────────────────────────────────────────────
// ✍️ 1 · Pide la URL y devuelve los datos ya convertidos (res.json()). Dos errores distintos, los dos ErrorTaller:
//        - la respuesta llega pero NO es ok (404, 500…): new ErrorTaller(`HTTP ${status} en ${url}`, { status, url });
//        - fetch se rechaza (sin red): new ErrorTaller("Sin conexión con el servidor", { url }).
export async function pedirJSON(url, fetchFn = fetch) {
  throw new Error("Sin hacer");
}

// ✍️ 2 · Envía una reparación TERMINADA al programa de facturas con un POST (usa opcionesPOST).
//        - Si no está "lista", lanza new ErrorEstado(reparacion.id, reparacion.estado) SIN hacer la petición.
//        - El cuerpo es { id, cliente, bici, tipo, total } (ojo: tipo y total son getters).
//        - Si la respuesta no es ok: new ErrorTaller(`HTTP ${status} en ${url}`, { status, url }).
//        - Devuelve lo que responde el servidor (en JSON), p. ej. { ticket: "T-7" }.
export async function enviarReparacion(reparacion, url, fetchFn = fetch) {
  throw new Error("Sin hacer");
}

// ✍️ 3 · Los cuatro estados. Llama a pintar(estado):
//        1. { estado: "cargando" }, nada más empezar;
//        2. si llega un array vacío: { estado: "vacio" }; si trae piezas: { estado: "datos", piezas };
//        3. si algo falla: { estado: "error", mensaje: el mensaje del error } (nunca se rechaza);
//        ➕ 4. OPCIONAL, para ir a por nota (no cuenta en el total): si tarda más de `limite` ms, se CANCELA la
//           petición con un AbortController (signal en las opciones de fetch) y se pinta
//           { estado: "error", mensaje: "El proveedor tarda demasiado" }.
//        Si haces el ➕ 4, pedirJSON no te vale (no deja pasar el signal): llama a fetchFn tú mismo.
export async function cargarCatalogo(url, pintar, { fetchFn = fetch, limite = 3000 } = {}) {
  throw new Error("Sin hacer");
}

// ✍️ 4 · Del JSON a instancias del modelo. La URL devuelve un array de objetos planos:
//        { id: 7, cliente: "Ana", bici: "BH", horas: 2, urgente: true, entrada: "2026-12-01T09:00:00.000Z" }
//        Devuelve un array de Reparacion (o ReparacionUrgente si urgente es true) que CONSERVAN id y entrada.
//        Los que no son válidos (el constructor lanza) se saltan sin parar los demás.
//        Si la petición falla, se rechaza (usa tu pedirJSON).
export async function traerReparaciones(url, fetchFn = fetch) {
  throw new Error("Sin hacer");
}
