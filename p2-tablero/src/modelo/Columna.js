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

    //Comparo el tipo de variable de nombre y tambien lo trimeo para ver si lanzo el error
    if(typeof nombre !== "string" || nombre.trim() === "") throw new TypeError();
    //Si limite no es null y limiteWip no es un entero o limite es menor que uno lanzo el error
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
    //Guardo una copia del array de tareas y la returneo
    const copiaTareas = [...this.#tareas];

    return copiaTareas;
  }
  // 4 · añadir(tarea): TypeError si no es instanceof Tarea · Error («… está llena …») si está
  //     llena · si no, la guarda y la devuelve
  añadir(tarea) {
    //Si tarea no es del tipo Tarea da error
    if (!(tarea instanceof Tarea)) throw new TypeError();
    
    //Si la columna esta llena da error
    if (this.llena) throw new Error("Está llena") 
    
    //Guardamos la tarea en el array de tareas  
    this.#tareas.push(tarea);
    return tarea;
  }
  // 5 · quitar(id): la saca del array y la devuelve · Error («… no está …») si no la encuentra
  //     Pista: findIndex + splice
  quitar(id) {

    //Guardamos el indice que es el id de la tarea
    const indice = this.#tareas.findIndex(t => t.id === id);

    //Si el indice es -1 es porque no lo ha encontrado asi que lanzamos error
    if (indice === -1) {
      throw new Error("La tarea no está en la columna");
    }
    
    //Modifico el array usando splice que borra desde el primer parametro y el segundo parametro es la cantidad de elementos a borrar a partir de esa posicion
    //Splice al borrar devuelve un array con los elementos que ha borrado asi que lo guardo en una variable y le pongo [] para que me guarde el objeto tarea y no la lista
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
    //Devuelvo un array nuevo ordenando por prioridad alta y si tiene la misma prioridad por el limite mas cercano
    return [...this.#tareas].sort((a, b) => {
      //Si los pesos son distintos devuelvo la diferencia que hara que se ponga antes a o b
      if(b.peso !== a.peso) {
        return b.peso - a.peso;
      }

      //Si los dos no tienen limite se queda como esta
      if (a.limite === null && b.limite === null) return 0;
      //Si a no tiene limite hace que b vaya antes que a
      if (a.limite === null) return 1;
      //Si b no tiene limite hace que a vaya antes que b
      if (b.limite === null) return -1;

      //Si tienen limite los dos hacemos la diferencia para ver cual va antes
      return a.limite - b.limite;
    });
  }
}

// Comprueba con:  docker compose run --rm web npm test 3-columna
void Tarea; // (borra esta línea cuando uses Tarea)
