// taller.js — El taller entero. YA ESTÁ HECHO: no hace falta tocarlo, solo usarlo.
//   const taller = new Taller();
//   const r = taller.nuevaReparacion({ cliente: "Ana", bici: "BH", horas: 2, urgente: true });
//   taller.contratar("Lucía", 2);
//   taller.asignar(r.id, "Lucía");  taller.terminar(r.id);
//   taller.buscar(id) → la reparación o null · taller.reparaciones() · taller.pendientes()
//   taller.facturacion → la suma del total de las que están "lista"
import { ErrorTaller } from "./errores.js";
import { Mecanico } from "./mecanico.js";
import { Reparacion, ReparacionUrgente } from "./reparacion.js";

export class Taller {
  #reparaciones = [];
  #mecanicos = new Map();

  nuevaReparacion({ cliente, bici, horas, urgente = false }) {
    const r = urgente ? new ReparacionUrgente(cliente, bici, horas) : new Reparacion(cliente, bici, horas);
    this.#reparaciones.push(r);
    return r;
  }

  contratar(nombre, max = 2) {
    if (this.#mecanicos.has(nombre)) throw new ErrorTaller(`Ya hay un mecánico llamado ${nombre}`, { nombre });
    const m = new Mecanico(nombre, max);
    this.#mecanicos.set(m.nombre, m);
    return m;
  }

  asignar(id, nombreMecanico) {
    const r = this.#obligatoria(id);
    const m = this.#mecanicos.get(nombreMecanico);
    if (!m) throw new ErrorTaller(`No hay ningún mecánico llamado ${nombreMecanico}`, { nombre: nombreMecanico });
    m.asignar(r);
    return r;
  }

  terminar(id) {
    const r = this.#obligatoria(id);
    r.terminar();
    for (const m of this.#mecanicos.values()) {
      if (m.trabajos.includes(r)) m.liberar(id);
    }
    return r;
  }

  buscar(id) {
    return this.#reparaciones.find((r) => r.id === id) ?? null;
  }

  reparaciones() {
    return [...this.#reparaciones];
  }

  pendientes() {
    return this.#reparaciones.filter((r) => r.estado === "pendiente");
  }

  get facturacion() {
    return this.#reparaciones.filter((r) => r.estado === "lista").reduce((suma, r) => suma + r.total, 0);
  }

  #obligatoria(id) {
    const r = this.buscar(id);
    if (!r) throw new ErrorTaller(`No existe la reparación ${id}`, { id });
    return r;
  }
}
