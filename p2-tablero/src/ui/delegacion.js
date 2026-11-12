// delegacion.js — Bloque B · ✍️ B3 (delegar).

// ✍️ B3 · delegar(contenedor, tipo, selector, manejador)
//   - UN solo addEventListener, en el contenedor (no en cada botón)
//   - Dentro: el elemento que encaja es evento.target.closest(selector). Si lo hay y está DENTRO
//     del contenedor (contenedor.contains(...)), llama a manejador(elemento, evento)
//   - Devuelve una función que quita el listener (removeEventListener con la MISMA función)
export function delegar(contenedor, tipo, selector, manejador) {
  const listener = (evento) => {
    const boton = evento.target.closest(selector);
    if(!boton) {
      return;
    }
    if(contenedor.contains(boton)) {
      manejador(boton, evento)
    }
  }
  contenedor.addEventListener(tipo, listener)

  return function() {
    contenedor.removeEventListener(tipo, listener)
  }
}
