// Bloque 3 · async / await
// Explicación: web de DWEC → Practicar → UD 6.2 · Repaso para el Parcial 2 → Bloque 3 (y el apartado 4 de la UD6).
// Comprueba con:  docker compose run --rm web npm run comprobar 3
// Aquí las funciones que «piden» cosas (pedirReparacion, pedir, enviar, tarea…) te llegan como parámetro y devuelven
// PROMESAS. El comprobador te pasa unas de mentira que tardan unos milisegundos (o fallan).

// 👀 EJEMPLO RESUELTO ─────────────────────────────────────────────────────────
// Con await, la promesa se lee de arriba abajo: la función se pausa hasta tener la reparación.
export async function horasDe(id, pedirReparacion) {
  const reparacion = await pedirReparacion(id);
  return reparacion.horas;
}

// 🪜 ESCALERA ──────────────────────────────────────────────────────────────────
// 🪜 1 · Reescribe esta función con async/await, SIN ningún .then:
//
//        function fichaCompleta(id, pedirReparacion, pedirCliente) {
//          return pedirReparacion(id).then((rep) =>
//            pedirCliente(rep.cliente).then((cliente) => ({ ...rep, telefono: cliente.telefono })),
//          );
//        }
export async function fichaCompleta(id, pedirReparacion, pedirCliente) {
  const rep = await pedirReparacion(id);
  const cliente = await pedirCliente(rep.cliente);
  return { ...rep, "telefono": cliente.telefono}
}

// ✍️ TU TURNO ─────────────────────────────────────────────────────────────────
// ✍️ 1 · try / catch / finally. Pide la reparación y la devuelve. Mientras tanto, la pantalla está ocupada:
//        - al empezar: pantalla.ocupada = true y pantalla.error = "";
//        - si falla: pantalla.error = el mensaje del error, y devuelve null (no se rechaza);
//        - al acabar, VAYA BIEN O MAL: pantalla.ocupada = false.
export async function cargarEnPantalla(id, pedirReparacion, pantalla) {
  pantalla.ocupada = true;
  pantalla.error = "";
  try {
    const rep = await pedirReparacion(id);
    return rep;
  } catch (error) {
    pantalla.error = `${error.message}`;
    return null;
  } finally {
    pantalla.ocupada = false;
  }
}

// ✍️ 2 · Los presupuestos del día, A LA VEZ: pedir(id) da una promesa con el presupuesto. Devuelve un array con todos,
//        en el mismo orden que los ids. Son independientes: no esperes a uno para pedir el siguiente.
export async function presupuestosDelDia(ids, pedir) {
  const lista = await Promise.all(ids.map((id) => pedir(id)));
  return lista;

}

// ✍️ 3 · Enviar las reparaciones terminadas al programa de facturas, DE UNA EN UNA y en orden: el programa no admite
//        dos envíos a la vez. enviar(reparacion) da una promesa. Devuelve cuántas se han enviado.
//        Si un envío falla, se para ahí (las siguientes no se envían) y se rechaza con ese error.
//        (cuidado: forEach no espera a un callback async)
export async function enviarEnOrden(reparaciones, enviar) {
  const promesas = []
  for(const reparacion of reparaciones) {
    promesas.push(await enviar(reparacion))
  }
  return promesas.length
}

// ➕ 4 · OPCIONAL, para ir a por nota (no cuenta en el total).
//        Reintentar una tarea que a veces falla. tarea() da una promesa. Se intenta hasta `intentos` veces y, entre un
//        intento fallido y el siguiente, se espera `pausa` ms (después del último, no). Se cumple con lo que dé la
//        primera vez que vaya bien; si fallan todas, se rechaza con el error del ÚLTIMO intento.
//        (cuidado: dentro del try, «return tarea()» NO es lo mismo que «return await tarea()»)
export async function reintentar(tarea, intentos, pausa) {
  let ultimo;
  for (let i = 1; i <= intentos; i++) {
    try {
      return await tarea();
    } catch (error) {
      ultimo = error;
      if( i < intentos) await new Promise((resolve) => setTimeout(resolve, pausa))
    }
  }
  throw ultimo;
}
