import { Tarea } from "./Tarea.js";

export class TareaConMateriales extends Tarea {
    #materiales
    constructor(titulo, prioridad, limite = null, id = null, materiales) {
        super(titulo, prioridad, limite, id);
        this.#materiales = materiales.map((nombre) => ({ nombre, unidades: 0 }));
    }
    
    get materiales() {
        return this.#materiales.map((material) => ({ ...material }));
    }

    contar(nombre, unidades) {
        const m = this.#materiales.find((material) => material.nombre === nombre)
        if(m === undefined) {
            throw new RangeError("Error de rango")
        }
        if(!Number.isInteger(unidades) || unidades < 0) {
            throw new RangeError("Error de rango")
        }
        m.unidades = unidades;
    }
    
    comprobarPaso(desde) {
        const faltan = this.#materiales.filter((m) => m.unidades === 0).map((m) => m.nombre);
        if (desde === "Por hacer" && faltan.length > 0) throw new FaltaMaterialError(faltan);
    }
}