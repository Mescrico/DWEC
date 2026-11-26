import { obtenerJSON } from "./red.js";
import { guardarTablero } from "./persistencia.js";

const PRIORIDAD = {
    "critica": "alta",
    "leve": "baja",
    "seria": "media"
}

function aDatos(elemento) {
    if(!elemento["asunto"] || elemento["asunto"] === null || elemento["asunto"].trim() === "") { 
        throw new Error("Error el asunto no es valido")
    }
    const prioridad = PRIORIDAD[elemento.gravedad];
    if(prioridad === undefined) {
        throw new Error("La prioridad no esta en la tabla")
    }
    const { dia, mes, año } = elemento["plazo"].split("/");

    const limite = `${año}-${mes}-${dia}`
    const titulo = `${elemento["asunto"]} (${elemento["ticket"]})`
    return { titulo, prioridad, limite };
}

export async function traerIncidencias(tablero, { url, fetchFn, storage }) {
    const lista = await obtenerJSON(url, fetchFn);   // si la descarga falla, lanza: NO lo captures aquí
    let nuevas = 0, repetidas = 0, noValidas = 0;

    for (const elemento of lista) {
        try {
        const datos = aDatos(elemento);
        // TU TURNO: si en CUALQUIER columna ya hay una tarea con datos.titulo → repetidas++ y continue
        tablero.crearTarea(datos);   // si la fecha no existe (31/02…), parsearFecha lanza aquí
        nuevas++;
        } catch {
        noValidas++;                  // cualquier cosa que haya lanzado: este elemento no vale
        }
    }

    guardarTablero(tablero, storage); // alCambiar no se entera de esto: guarda tú
    return { nuevas, repetidas, noValidas };
}