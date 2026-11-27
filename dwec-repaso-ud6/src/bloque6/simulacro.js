// Bloque 6 · Simulacro: recibir las reparaciones del día
// Explicación: web de DWEC → Practicar → UD 6.2 · Repaso para el Parcial 2 → Bloque 6.
// Comprueba con:  docker compose run --rm web npm run comprobar 6   → te dice cuántos de los 5 puntos tienes (y si has hecho el 6).
//
// Cada mañana, la tienda de «La Cadena» deja en el servidor la lista de bicis que han entrado. La URL devuelve:
//   [{ "ref": "R-101", "cliente": "Ana", "bici": "BH Ultimate", "horas": 2, "urgente": true }, …]
// Escribe crearRecepcion(taller, { url, storage, fetchFn, limite }), que devuelve un objeto con un método recibir().
// Es AUTOCONTENIDO: lo que necesites de otros bloques, escríbelo aquí (puedes copiarlo de los tuyos).
// Hazlo punto a punto, en orden; cada punto tiene sus pruebas:
//
//   1. recibir() pide la url y, por cada elemento, crea la reparación en el taller con
//      taller.nuevaReparacion({ cliente, bici, horas, urgente }). Se cumple con { nuevas, repetidas, saltadas }.
//   2. Las que no son válidas (nuevaReparacion lanza) se saltan sin parar las demás y cuentan en `saltadas`.
//      Una ref que ya se ha recibido antes (en esta lista o en una llamada anterior) no entra otra vez: `repetidas`.
//   3. Al terminar, guarda en storage, con la clave "taller:recibidas", la lista de refs recibidas (en JSON).
//   4. Si se llama a recibir() otra vez mientras la primera no ha terminado (dos clics seguidos), NO se hace otra
//      petición: las dos llamadas se cumplen con lo mismo. Cuando termina (bien o mal), la siguiente llamada ya pide.
//   5. Si falla, se rechaza con un ErrorTaller con un mensaje claro, y ni se toca el taller ni se guarda nada:
//      - respuesta no ok:     `HTTP ${status} en ${url}`  (y en datos, { status })
//      - sin red:             "Sin conexión con el servidor"
//      - no es JSON:          "La respuesta no es JSON"
//      - tarda más de limite: "Tiempo agotado"
//   ➕ 6. OPCIONAL, para ir a por nota (no cuenta en los 5 puntos).
//      Al recargar la página (otra crearRecepcion con el MISMO storage) las refs ya recibidas no se repiten.
//      Si lo guardado en "taller:recibidas" está roto o no es un array, se empieza de cero sin reventar.
import { ErrorTaller } from "../modelo/errores.js";

export function crearRecepcion(taller, { url, storage, fetchFn = fetch, limite = 3000 }) {
  throw new Error("Sin hacer");
}
