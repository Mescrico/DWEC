// Tablero.js — Bloque A · ✍️ A3 (el tablero) y A5 (reglas).
// En el bloque C volverás aquí para ✍️ C4 (toJSON y desdeJSON).
// El tablero TIENE tres columnas: es composición, no hereda de nadie.
import { Columna } from "./Columna.js";
import { ColumnaLlenaError, MovimientoNoPermitidoError } from "./errores.js";
import { Tarea } from "./Tarea.js";
import { TareaRecurrente } from "./TareaRecurrente.js";
import { aDatos, desdeDatos } from "./serializar.js";

export class Tablero {
  static COLUMNAS = Object.freeze(["Por hacer", "En curso", "Hecho"]);
  static VERSION_DATOS = 1; // (bloque C) si algún día cambia el formato guardado, se sube
  // Privado: #columnas, un Map nombre → Columna
  #columnas;
  // ✍️ A3 ──────────────────────────────────────────────────────────────────────
  constructor(limiteEnCurso = 3) {
    // Crea las tres columnas; solo «En curso» lleva límite WIP (limiteEnCurso)
    this.#columnas = new Map(
      Tablero.COLUMNAS.map(nombre => [

        //Guardamos nombre como clave de la lista de COLUMNAS y si el nombre es "En curso" le pone de valor limiteEnCurso que es 3 sino undefined
        nombre, 
        new Columna(nombre, nombre === "En curso" ? limiteEnCurso : undefined)
      ])
    );
    
  }

  // static desde(datos, limiteEnCurso): un Tablero con una tarea por cada objeto de datos
  //   (usa crearTarea)
  static desde(datos, limiteEnCurso) {
    const tablero = new Tablero(limiteEnCurso);

    //Para cada dato dentro de datos
    for(const d of datos) {
      //Creo una tarea de ese dato
      const Tarea = tablero.crearTarea(d);

      //Y la añado a la columna "Por hacer"
      tablero.columna("Por hacer").añadir(Tarea);
    }

    return tablero;
  }

  // columna(nombre): la Columna, o un Error si no existe (que el mensaje lleve el nombre)
  columna(nombre) {
    //Si en las columnas hay alguna con el nombre que se busca
    if(this.#columnas.has(nombre)) {
      //La devolvemos
      return this.#columnas.get(nombre)
    } else {
      //Si no lanzamos error
      throw new Error(`No existe la columna ${nombre}`) 
    }
  }
  // get columnas: array con las tres columnas, en orden
  get columnas() {
    return [...this.#columnas.values()]
  }

  // crearTarea(datos): TareaRecurrente si datos trae cadaDias, Tarea si no → a «Por hacer»
  //   y la devuelve. datos es un objeto { titulo, prioridad, limite, cadaDias }: saca cada campo
  //   y pásaselo al constructor, en su orden (new Tarea(datos) NO vale: espera el título)
  crearTarea(datos) {
    //Hago destructuring del objeto datos para guardar sus campos
    const { titulo, prioridad, limite, cadaDias } = datos;

    //Si hay un campo cadaDias dentro de datos
    if('cadaDias' in datos) {
      //Creo una TareaRecurrente y la devolvemos
      return new TareaRecurrente(titulo, prioridad, limite, cadaDias);
    } else {
      //Sino creo una Tarea y la devuelvo
      return new Tarea(titulo, prioridad, limite);
    }
  }

  // buscar(id): la tarea, esté en la columna que esté, o null
  buscar(id) {
    for(const columna of this.#columnas.values()){
      //Si dentro de la columna esta el id
      if(columna.tiene(id)) {
        //Busco y devuelvo la tarea
        return columna.tareas.find(t => t.id === id);
      }
    }

    return null;
  }
  // dondeEsta(id): la Columna donde está, o null
  dondeEsta(id) {
    for(const columna of this.#columnas.values()){
      //Si dentro de la columna esta el id
      if(columna.tiene(id)) {
        //Busco y devuelvo la columna
        return columna;
      }
    }

    return null;
  }

  // mover(id, destino): Error si no existe la tarea · Error si la columna destino está llena
  //   (¡comprueba ANTES de quitarla de su columna, o se perdería!) · la mueve y la devuelve
  mover(id, destino) {
    let encontrado = false;
    let columnaAnterior;
    for(const columna of this.#columnas.values()){
      //Si dentro de la columna esta el id
      if(columna.tiene(id)) {
        encontrado = true;
        //Guardo la columna
        columnaAnterior = columna;
      }
    }
    if (!encontrado) throw new Error(`No existe la tarea ${id}`);

    //Guardo la columna destino
    const columnaDestino = this.columna(destino);

    //Si la columna anterior es "Hecho" lanza error ya que no se puede mover de ahi
    if(columnaAnterior.nombre === "Hecho"){
      throw new MovimientoNoPermitidoError(id, columnaAnterior.nombre, destino);
    }

    //Si la columna anterior es igual a la columna destino lanza error
    if(columnaAnterior.nombre === destino) {
      throw new MovimientoNoPermitidoError(id, columnaAnterior.nombre, destino)
    }

    //Si la columna destino esta llena lanza error
    if(columnaDestino.llena) {
      throw new ColumnaLlenaError(columnaDestino);
    }

    //Guardo la tarea buscandola en todo el tablero para cuando la quite ya tenerla guardada
    const tarea = this.buscar(id);

    //Quito de la columna anterior la tarea usando el id
    columnaAnterior.quitar(id);

    //Añado a la columna destino la tarea
    columnaDestino.añadir(tarea);

    return tarea;
  }
  // completar(id): la mueve a «Hecho» y añade a «Por hacer» lo que devuelva tarea.alCompletar()
  //   ⚠️ Sin preguntar si es recurrente: eso es el polimorfismo
  completar(id) {
    //Guardo la tarea completada usando el metodo mover
    const tareaCompletada = this.mover(id, "Hecho");
    //Guardo las nuevas tareas que haya creado la tarea completada
    const nuevasTareas = tareaCompletada.alCompletar();

    for (const nuevaTarea of nuevasTareas) {
      //Las guardo en la columna "Por Hacer"
      this.columna("Por hacer").añadir(nuevaTarea);
    }
  }
  // resumen(hoy = new Date()): { porHacer, enCurso, hecho, vencidas }
  //   vencidas = las que estaVencida(hoy) y NO están en «Hecho»
  resumen(hoy = new Date()) {
    //Creo cada contador
    let porHacer = 0;
    let enCurso = 0;
    let hecho = 0;
    let vencidas = 0;

    for(const columna of this.#columnas.values()) {
      for(const tarea of columna.tareas) {
        //Si el nombre de la columna es igual aumentamos el contador

        if(columna.nombre === "Por hacer") {
          porHacer++;
        }
        if(columna.nombre === "En curso") {
          enCurso++;
        }
        if(columna.nombre === "Hecho") {
          hecho++;
        }

        //Si la tarea esta vencida de hoy y no esta en la columna hecho aumentamos el contador
        if(tarea.estaVencida(hoy) && columna.nombre !== "Hecho") {
          vencidas++;
        }
      }
    }

    //Devolvemos un objeto con todos los contadores
    return {
      porHacer,
      enCurso,
      hecho,
      vencidas
    };
  }

  // ✍️ A5 · Reglas (vuelves a mover y completar) ─────────────────────────────────
  //   - Columna llena → ColumnaLlenaError (en vez de un Error cualquiera)
  //   - Sacar una tarea de «Hecho», o «moverla» a la columna en la que ya está →
  //     MovimientoNoPermitidoError. Todo se comprueba ANTES de tocar nada.
  //   Pista: mover y completar hacen casi lo mismo. Un método privado #trasladar(id, destino)
  //   con las comprobaciones evita escribirlas dos veces.

  // ✍️ C4 (bloque C) ────────────────────────────────────────────────────────────
  // toJSON(): { version, limiteEnCurso, columnas: { "Por hacer": [datos…], … } }
  //   JSON.stringify(tablero) lo llama solo. Sin él sale "{}": los # no se ven. Usa aDatos.

  /** Lo contrario de toJSON: el MISMO tablero (columnas, ids y límite WIP). Lanza si no encaja. */
  static desdeJSON(datos) {
    throw new Error("Sin hacer");
  }
}

// Comprueba con:  docker compose run --rm web npm test bloque-a
(void Columna,
  ColumnaLlenaError,
  MovimientoNoPermitidoError,
  Tarea,
  TareaRecurrente,
  aDatos,
  desdeDatos); // (borra esta línea cuando los uses)
