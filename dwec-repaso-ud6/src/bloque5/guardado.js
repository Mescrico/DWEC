// Bloque 5 · JSON y localStorage
// Explicación: web de DWEC → Practicar → UD 6.2 · Repaso para el Parcial 2 → Bloque 5 (y los apartados 5.2 y 7 de la UD6).
// Comprueba con:  docker compose run --rm web npm run comprobar 5
// Las funciones reciben `storage` y lo usan igual que localStorage (getItem, setItem, removeItem). En la página les
// pasarías localStorage; el comprobador les pasa uno de mentira que, como el de verdad, solo guarda TEXTOS.
import { Reparacion, ReparacionUrgente } from "../modelo/reparacion.js";

// 👀 EJEMPLO RESUELTO ─────────────────────────────────────────────────────────
// localStorage solo guarda textos: el valor se pasa a JSON antes de guardarlo.
export function guardarJSON(storage, clave, valor) {
  storage.setItem(clave, JSON.stringify(valor));
}

// ➕ PARA IR A POR NOTA (opcional) ──────────────────────────────────────────────────
// ➕ 1 · OPCIONAL, para ir a por nota (no cuenta en el total).
//        Un Map en JSON sale "{}". Guárdalo como un array de pares y reconstrúyelo al leer:
//        asignacionesATexto(new Map([["Lucía", [1, 2]]])) → '[["Lucía",[1,2]]]'
//        textoAAsignaciones('[["Lucía",[1,2]]]')          → Map(1) { "Lucía" => [1, 2] }
export function asignacionesATexto(mapa) {
  throw new Error("Sin hacer");
}

export function textoAAsignaciones(texto) {
  throw new Error("Sin hacer");
}

// ✍️ TU TURNO ─────────────────────────────────────────────────────────────────
// ✍️ 1 · Lee una clave y devuelve el valor ya convertido. Devuelve `porDefecto` si:
//        - la clave no existe (getItem da null), o lo guardado es "null";
//        - lo guardado no es JSON válido (alguien lo ha tocado desde las DevTools): ¡que no reviente!
//        Un 0, un "" o un false guardados SÍ son valores válidos.
export function leerJSON(storage, clave, porDefecto) {
  throw new Error("Sin hacer");
}

// ✍️ 2 · Lo que devolvería un toJSON() de Reparacion: un objeto PLANO con todo lo necesario para reconstruirla.
//        { tipo, id, cliente, bici, horas, entrada: la fecha en texto ISO (toISOString), estado, piezas }
//        (JSON.stringify(reparacion) solo ve las propiedades públicas: sin estado, ni piezas, ni tipo)
export function reparacionAJSON(reparacion) {
  throw new Error("Sin hacer");
}

// ✍️ 3 · La fábrica inversa (el «static desde(datos)» de la UD6): de esos datos planos, otra vez una instancia.
//        - ReparacionUrgente si tipo es "urgente"; si no, Reparacion;
//        - conserva el id y la fecha de entrada (el constructor admite { id, entrada });
//        - vuelve a añadir sus piezas, y recupera el estado con empezar() / terminar() (estado no se puede asignar).
export function reparacionDesdeJSON(datos) {
  throw new Error("Sin hacer");
}

// ✍️ 4 · Las reparaciones guardadas en la clave "taller:reparaciones" (un array de datos planos), como INSTANCIAS.
//        Si no hay nada, está roto o no es un array: []. Las que no se pueden reconstruir se saltan.
export function cargarReparaciones(storage) {
  throw new Error("Sin hacer");
}
