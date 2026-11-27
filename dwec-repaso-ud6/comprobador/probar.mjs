// probar.mjs — docker compose run --rm web npm run probar "código": ejecuta el código y enseña lo que da la última sentencia.
// Si lo que da es una promesa, espera a que termine y te dice con qué valor se cumple (o por qué se rechaza).
// Tienes setTimeout, setInterval, queueMicrotask, console.log, esperar(ms) y new Response(…), para probar las predicciones.
import vm from "node:vm";
import { inspect } from "node:util";

const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
const contexto = { console, setTimeout, setInterval, clearTimeout, clearInterval, queueMicrotask, esperar, structuredClone, URLSearchParams, URL, Response, AbortController };
const codigo = process.argv[2];
const t = performance.now();
let r;
try {
  // Como la consola: da el valor de la última sentencia (await no se puede usar aquí: usa then)
  r = vm.runInNewContext(codigo, contexto);
} catch (e) {
  console.log("💥", e.message);
  process.exit(1);
}
try {
  const v = await r;
  const ms = Math.round(performance.now() - t);
  // Deja que terminen los setTimeout pendientes, para ver todos los console.log
  await esperar(50);
  // setTimeout devuelve un id (en el navegador, un número): no merece la pena enseñarlo entero
  const texto = v?.constructor?.name === "Timeout" ? "(el id de un temporizador)" : inspect(v);
  console.log("→", texto, ms >= 20 ? `   (ha tardado ${ms} ms)` : "");
} catch (e) {
  await esperar(50);
  console.log("→ se rechaza con:", e?.message ?? e);
}
