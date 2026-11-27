# Explícalo con tus palabras

Cuando tengas el comprobador en verde, contesta aquí sin mirar los apuntes (2–4 líneas cada una).

1. En la predicción p3 del bloque 1, ¿por qué el `console.log("B")` de dentro de `f()` sale antes que el `"C"` de
   fuera, y el `"D"` sale después?

2. En `compararProveedores` (bloque 2), ¿qué pasaría si usaras `Promise.all` en vez de `Promise.allSettled`? ¿Y en qué
   caso SÍ elegirías `Promise.all`?

3. `presupuestosDelDia` va en paralelo y `enviarEnOrden` va en serie (bloque 3). ¿Por qué cada uno? ¿Por qué
   `forEach` con un callback `async` no sirve para ninguno de los dos?

4. ➕ (si has hecho el opcional del bloque 3) En `reintentar`, ¿qué cambia entre `return tarea()` y
   `return await tarea()` dentro del `try`?

5. En el simulacro (bloque 6), ¿por qué no basta con guardar el `Set` de refs con `JSON.stringify(refs)`? ¿Qué
   verías al recargar la página?
