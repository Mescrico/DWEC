// mecanico.js — Un mecánico con un máximo de trabajos a la vez. YA ESTÁ HECHO: no hace falta tocarlo.
//   const m = new Mecanico("Lucía", 2);       // max = 2 si no se dice
//   m.asignar(reparacion);   // la reparación pasa a "en-taller" · ErrorMecanicoLleno si ya tiene 2
//   m.liberar(id);           // la quita de sus trabajos y la devuelve
//   m.trabajos → copia del array · m.libres → huecos que le quedan
import { ErrorEstado, ErrorMecanicoLleno, ErrorTaller } from "./errores.js";

export class Mecanico {
  #trabajos = [];

  constructor(nombre, max = 2) {
    if (typeof nombre !== "string" || nombre.trim() === "") throw new TypeError("El mecánico tiene que tener nombre");
    if (!Number.isInteger(max) || max < 1) throw new RangeError("El máximo tiene que ser un entero mayor que 0");
    this.nombre = nombre.trim();
    this.max = max;
  }

  asignar(reparacion) {
    // Primero el estado y después el hueco, todo antes de cambiar nada
    if (reparacion.estado !== "pendiente") throw new ErrorEstado(reparacion.id, reparacion.estado);
    if (this.#trabajos.length >= this.max) throw new ErrorMecanicoLleno(this.nombre, this.max);
    reparacion.empezar();
    this.#trabajos.push(reparacion);
  }

  liberar(id) {
    const i = this.#trabajos.findIndex((r) => r.id === id);
    if (i === -1) throw new ErrorTaller(`${this.nombre} no tiene la reparación ${id}`, { id });
    return this.#trabajos.splice(i, 1)[0];
  }

  get trabajos() {
    return [...this.#trabajos];
  }

  get libres() {
    return this.max - this.#trabajos.length;
  }
}
