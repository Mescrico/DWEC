import { Tarea } from "./Tarea.js";

export class TareaConMateriales extends Tarea {
    #materiales
    constructor(titulo, prioridad, limite = null, id = null, materiales) {
        this.#materiales = new Map([
            materiales.map((nombre) => {
                nombre,
                0
            })
        ])
        super(titulo, prioridad, limite, id);
    }

    get materiales() {
        const listaMateriales = []        
        for(const material of this.#materiales) {
            diccionarioMaterial = {}
            const { nombre, unidades } = this.#materiales.get(material)
            diccionarioMaterial["nombre"] = nombre
            diccionarioMaterial["unidades"] = unidades
            listaMateriales.push(diccionarioMaterial)
        }
        return [...listaMateriales]
    }

    contar(nombre, unidades) {
        if(!this.#materiales.has(nombre) || unidades < 0) {
            throw new RangeError("Error de rango")
        }

        for(const diccionarioMaterial of this.#materiales) {
            const { nombreMaterial, unidades } = diccionarioMaterial
            if(nombreMaterial === nombre) {
                    this.#materiales[diccionarioMaterial["unidades"]] = unidades
            }
        } 
    }
}