// reparacion.js — Una reparación del taller. YA ESTÁ HECHO: no hace falta tocarlo, solo usarlo.
//   const r = new Reparacion("Ana", "BH Ultimate", 2);          // id automático, entrada = ahora, estado "pendiente"
//   const v = new Reparacion("Ana", "BH", 2, { id: 7, entrada: "2026-12-01T09:00:00.000Z" });   // conserva id y fecha
//   r.anadirPieza("Cadena", 18);  r.total → 2 × 25 + 18 = 68
//   r.empezar();  r.terminar();   r.estado → "pendiente" → "en-taller" → "lista"
import { ErrorEstado } from "./errores.js";

export const PRECIO_HORA = 25;

export class Reparacion {
  static #siguienteId = 1;
  #piezas = [];
  #estado = "pendiente";

  constructor(cliente, bici, horas, { id, entrada } = {}) {
    if (typeof cliente !== "string" || cliente.trim() === "") throw new TypeError("El cliente tiene que ser un texto");
    if (typeof bici !== "string" || bici.trim() === "") throw new TypeError("La bici tiene que ser un texto");
    if (typeof horas !== "number" || !(horas > 0)) throw new RangeError("Las horas tienen que ser un número mayor que 0");
    if (id === undefined) {
      id = Reparacion.#siguienteId;
    }
    // Si llega un id (al recuperar una guardada), los siguientes no lo repiten
    if (Number.isInteger(id)) Reparacion.#siguienteId = Math.max(Reparacion.#siguienteId, id + 1);
    this.id = id;
    this.cliente = cliente.trim();
    this.bici = bici.trim();
    this.horas = horas;
    this.entrada = entrada === undefined ? new Date() : new Date(entrada);
    if (Number.isNaN(this.entrada.getTime())) throw new RangeError("La fecha de entrada no es válida");
  }

  get estado() {
    return this.#estado;
  }

  anadirPieza(nombre, precio) {
    if (typeof nombre !== "string" || nombre.trim() === "") throw new TypeError("La pieza tiene que tener nombre");
    if (typeof precio !== "number" || precio < 0) throw new RangeError("El precio no puede ser negativo");
    this.#piezas.push({ nombre: nombre.trim(), precio });
  }

  get piezas() {
    return this.#piezas.map((p) => ({ ...p }));
  }

  get total() {
    return this.horas * PRECIO_HORA + this.#piezas.reduce((suma, p) => suma + p.precio, 0);
  }

  get tipo() {
    return "normal";
  }

  empezar() {
    if (this.#estado !== "pendiente") throw new ErrorEstado(this.id, this.#estado);
    this.#estado = "en-taller";
  }

  terminar() {
    if (this.#estado !== "en-taller") throw new ErrorEstado(this.id, this.#estado);
    this.#estado = "lista";
  }
}

export class ReparacionUrgente extends Reparacion {
  get total() {
    return Math.round(super.total * 1.3 * 100) / 100;
  }

  get tipo() {
    return "urgente";
  }
}
