// Columna.js — Bloque A · ✍️ A2: una columna del tablero («Por hacer», «En curso», «Hecho»).
// En kanban, una columna puede tener un límite WIP (Work In Progress): «En curso» no admite más
// de 3 tareas a la vez, para no empezar mil cosas y no acabar ninguna.
import { Tarea } from "./Tarea.js";

export class Columna {
  // Privado: #tareas, un array
  #tareas = [];

  constructor(nombre, limiteWip = null) {
    // 1 · nombre: texto no vacío (sin espacios a los lados) → si no, TypeError
    //     limiteWip: null (sin límite) o un entero ≥ 1 → si no, RangeError
    if(typeof nombre !== "string" || nombre.trim() === "") throw new TypeError();
    if(limiteWip !== null && (!Number.isInteger(limiteWip) || limiteWip < 1)) throw new RangeError();

    this.nombre = nombre.trim();
    this.limiteWip = limiteWip;
  }

  // 2 · get llena: true si hay límite y ya hay tantas tareas como el límite
  get llena() {
    return this.limiteWip !== null && this.#tareas.length >= this.limiteWip;
  }
  // 3 · get tareas: una COPIA del array (que nadie pueda tocar el tuyo desde fuera)
  get tareas() {
    const copiaTareas = [...this.#tareas];

    return copiaTareas;
  }
  // 4 · añadir(tarea): TypeError si no es instanceof Tarea · Error («… está llena …») si está
  //     llena · si no, la guarda y la devuelve
  añadir(tarea) {
    if (!(tarea instanceof Tarea)) throw new TypeError();
    
    if (this.llena) throw new Error("Está llena") 
    
    this.#tareas.push(tarea);
    return tarea;
  }
  // 5 · quitar(id): la saca del array y la devuelve · Error («… no está …») si no la encuentra
  //     Pista: findIndex + splice
  quitar(id) {
    const indice = this.#tareas.findIndex(t => t.id === id);

    if (indice === -1) {
      throw new Error("La tarea no está en la columna");
    }

    const [tareaEliminada] = this.#tareas.splice(indice, 1);
    return tareaEliminada;
    
  }
  // 6 · tiene(id): true / false. Pista: some
  tiene(id) {
    return this.#tareas.some(t => t.id === id);
  }
  // 7 · ordenadas(): un array NUEVO ordenado: primero prioridad alta (usa t.peso), y a igual
  //     prioridad, el límite más cercano; las que no tienen límite, al final.
  //     Pista: [...this.#tareas].sort((a, b) => …) — ¿por qué la copia?
  ordenadas(){
    return [...this.#tareas].sort((a, b) => {
      if(b.peso !== a.peso) {
        return b.peso - a.peso;
      }

      if (a.limite === null && b.limite === null) return 0;
      if (a.limite === null) return 1;
      if (b.limite === null) return -1;

      return a.limite - b.limite;
    });
  }
}

// Comprueba con:  docker compose run --rm web npm test 3-columna
void Tarea; // (borra esta línea cuando uses Tarea)
