// pruebas.mjs — Las pruebas de cada bloque del repaso de la UD6. Puedes leerlas: dicen QUÉ se espera, no CÓMO hacerlo.
// No hay servidor ni navegador: el comprobador te pasa un fetch y un localStorage DE MENTIRA que se portan como los de
// verdad (respuestas con su status, errores de red, peticiones que no terminan nunca, solo textos…).
import { inspect } from "node:util";
import vm from "node:vm";

// ───────────────────────── utilidades ─────────────────────────
const muestra = (v) => inspect(v, { depth: 4, breakLength: Infinity, compact: true });
function igual(a, b) {
  if (Object.is(a, b)) return true;
  if (a instanceof Date && b instanceof Date) return a.getTime() === b.getTime();
  if (typeof a !== "object" || typeof b !== "object" || a === null || b === null) return false;
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  const ka = Object.keys(a);
  const kb = Object.keys(b);
  return ka.length === kb.length && ka.every((k) => igual(a[k], b[k]));
}
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
const ahora = () => performance.now();
const esPromesa = (p) => p !== null && typeof p?.then === "function";
// ¿La promesa se rechaza? Devuelve el error, o null si se cumple
async function rechazo(p) {
  try {
    await p;
    return null;
  } catch (e) {
    return e ?? new Error("rechazada sin error");
  }
}
// ¿Cómo va una promesa ahora mismo? "pendiente", "cumplida" o "rechazada" (sin esperarla)
async function comoVa(p) {
  const marca = {};
  try {
    return (await Promise.race([p, Promise.resolve(marca)])) === marca ? "pendiente" : "cumplida";
  } catch {
    return "rechazada";
  }
}
// Mientras dura fn, lo que se escribe con console.log se apunta (y no sale por pantalla)
async function conConsola(fn) {
  const original = console.log;
  const logs = [];
  console.log = (...partes) => logs.push(partes.join(" "));
  try {
    return await fn(logs);
  } finally {
    console.log = original;
  }
}

// Las predicciones se EJECUTAN: el comprobador corre la expresión del comentario de predicciones.js y compara.
//   modo "consola" → lo que sale por console.log, separado por comas · modo "valor" → con qué se cumple
async function ejecutarPrediccion(codigo, modo) {
  const logs = [];
  const contexto = {
    console: { log: (...p) => logs.push(p.join(" ")) },
    setTimeout,
    clearTimeout,
    queueMicrotask,
    Response,
    esperar,
  };
  const valor = await vm.runInNewContext(codigo, contexto);
  if (modo === "consola") {
    await esperar(120);
    return logs.join(",");
  }
  return valor;
}
function predicciones(datos) {
  return async ({ pred }) => {
    const p = pred.predicciones ?? {};
    const claves = Object.keys(datos);
    const sinContestar = claves.filter((k) => p[k] === undefined);
    if (sinContestar.length === claves.length) return "pendiente";
    if (sinContestar.length > 0) return `Te faltan: ${sinContestar.join(", ")}`;
    const reales = {};
    for (const k of claves) reales[k] = await ejecutarPrediccion(datos[k][0], datos[k][3] ?? "valor");
    const falladas = claves.filter((k) => !igual(p[k], reales[k]));
    const info = claves.map((k) => {
      const [, porque, pista] = datos[k];
      return falladas.includes(k)
        ? `✘ ${k} · no es ${muestra(p[k])}. Pista: ${pista}`
        : `✔ ${k} · ${muestra(reales[k])}: ${porque}`;
    });
    if (falladas.length > 0)
      return { mal: `${claves.length - falladas.length}/${claves.length} bien. Revisa: ${falladas.join(", ")} → pruébalas con docker compose run --rm web npm run probar '…' (la expresión está en el comentario)`, info };
    return { bien: true, info };
  };
}

// Un localStorage de mentira: guarda TEXTOS, como el de verdad
class AlmacenFalso {
  #datos = new Map();
  getItem(k) {
    return this.#datos.has(k) ? this.#datos.get(k) : null;
  }
  setItem(k, v) {
    this.#datos.set(k, String(v));
  }
  removeItem(k) {
    this.#datos.delete(k);
  }
  clear() {
    this.#datos.clear();
  }
  get length() {
    return this.#datos.size;
  }
}
// Un fetch de mentira. rutas = { "/url": respuesta }, donde respuesta es:
//   { status, cuerpo, ms }   → responde con ese status y ese cuerpo (en JSON) tras ms milisegundos
//   { texto }                → responde con ese texto tal cual (p. ej. una página HTML), no JSON
//   "red"                    → falla como falla fetch sin red: TypeError("Failed to fetch")
//   "cuelga"                 → no responde nunca (salvo que lo cancelen con un AbortController)
// Lo que no está en rutas da 404. En .peticiones apunta cada llamada: { url, opciones }
function fetchFalso(rutas) {
  const peticiones = [];
  const f = async (url, opciones = {}) => {
    peticiones.push({ url: String(url), opciones });
    const r = rutas[String(url)];
    const { signal } = opciones;
    const cancelable = (ms) =>
      new Promise((resolve, reject) => {
        if (ms !== undefined) setTimeout(resolve, ms);
        signal?.addEventListener("abort", () => reject(signal.reason ?? new DOMException("Aborted", "AbortError")));
      });
    if (r === "red") throw new TypeError("Failed to fetch");
    if (r === "cuelga") await cancelable();
    if (r?.ms) await cancelable(r.ms);
    const status = r?.status ?? (r ? 200 : 404);
    if (r?.texto !== undefined) return new Response(r.texto, { status, headers: { "Content-Type": "text/html" } });
    const cuerpo = r ? JSON.stringify(r.cuerpo ?? null) : JSON.stringify({ error: "No encontrado" });
    return new Response(cuerpo, { status, headers: { "Content-Type": "application/json" } });
  };
  f.peticiones = peticiones;
  return f;
}
// Una función que tarda ms y se cumple con valor (o se rechaza con error)
const tarda = (ms, valor, error) => new Promise((resolve, reject) => setTimeout(() => (error ? reject(error) : resolve(valor)), ms));

const PIEZAS = [
  { ref: "P-1", nombre: "Cadena 11v", precio: 18 },
  { ref: "P-2", nombre: "Cámara 29", precio: 6.5 },
];
const DEL_DIA = [
  { ref: "R-101", cliente: "Ana", bici: "BH Ultimate", horas: 2, urgente: true },
  { ref: "R-102", cliente: "Luis", bici: "Orbea Alma", horas: 1 },
];

// ───────────────────────── bloques ─────────────────────────
export const BLOQUES = [
  {
    id: "1",
    titulo: "Bloque 1 · El event loop y los temporizadores",
    modulos: { m: "src/bloque1/tiempo.js", pred: "src/bloque1/predicciones.js" },
    pruebas: [
      {
        id: "1.p",
        texto: "🔮 Predicciones: el orden de los console.log",
        fn: predicciones({
          p1: [
            `console.log("A"); setTimeout(() => console.log("B"), 0); queueMicrotask(() => console.log("C")); Promise.resolve().then(() => console.log("D")); console.log("E");`,
            "primero el código síncrono (A, E); después TODAS las microtareas, en el orden en que se encargaron (C con queueMicrotask, D con then); y al final la tarea del setTimeout (B)",
            "¿quién va antes: una microtarea (then, queueMicrotask) o un setTimeout de 0 ms? ¿Y el código síncrono?",
            "consola",
          ],
          p2: [
            `new Promise((resolve) => { console.log("A"); resolve("C"); }).then((v) => console.log(v)); console.log("B");`,
            "la función de dentro de new Promise (el ejecutor) se ejecuta ENSEGUIDA; lo que va en then, después del código síncrono",
            "¿cuándo se ejecuta el código de dentro de new Promise: al crearla o después?",
            "consola",
          ],
          p3: [
            `async function f() { console.log("B"); await null; console.log("D"); } console.log("A"); f(); console.log("C");`,
            "una función async se ejecuta de forma síncrona HASTA el primer await; lo que va detrás del await sigue como microtarea",
            "¿se para f() antes de su primer console.log, o después?",
            "consola",
          ],
          p4: [
            `setTimeout(() => console.log("B"), 20); setTimeout(() => console.log("A"), 0); Promise.resolve().then(() => console.log("C")).then(() => console.log("D"));`,
            "las microtareas (C y luego D, que se encarga al terminar C) van antes que cualquier temporizador; entre los temporizadores, primero el que vence antes (A a los 0 ms, B a los 20)",
            "¿un then encadenado sigue siendo microtarea? ¿Qué temporizador vence antes?",
            "consola",
          ],
        }),
      },
      {
        id: "1.E",
        texto: "👀 Ejemplo: esperar(ms)",
        fn: async ({ m }) => {
          const t = ahora();
          await m.esperar(40);
          return ahora() - t >= 35 || "esperar(40) no espera 40 ms";
        },
      },
      {
        id: "1.e1",
        texto: "🪜 avisoDeRecogida: una promesa que se cumple más tarde",
        fn: async ({ m }) => {
          const t = ahora();
          const p = m.avisoDeRecogida({ cliente: "Ana", bici: "BH" }, 40);
          if (!esPromesa(p)) return `devuelve ${muestra(p)}: tiene que devolver una PROMESA (¿usas esperar(ms).then(…)?)`;
          const v = await p;
          if (v !== "Ana: tu BH está lista") return `se cumple con ${muestra(v)} y debería ser "Ana: tu BH está lista"`;
          return ahora() - t >= 35 || `se cumple a los ${Math.round(ahora() - t)} ms: tiene que esperar los 40 ms`;
        },
      },
      {
        id: "1.1",
        texto: "✍️ programarAvisos: cada aviso a su hora, y el orden en que salen",
        fn: ({ m }) =>
          conConsola(async (logs) => {
            const t = ahora();
            const p = m.programarAvisos([
              { ms: 140, texto: "B" },
              { ms: 20, texto: "A" },
              { ms: 80, texto: "C" },
            ]);
            if (logs.length) return `ha escrito ${muestra(logs)} enseguida: cada texto sale a SUS ms, con setTimeout`;
            if (!esPromesa(p)) return "tiene que devolver una promesa que se cumple cuando han salido todos";
            await esperar(50);
            if (!igual(logs, ["A"])) return `a los 50 ms debería haber salido solo "A" y ha salido ${muestra(logs)}`;
            if ((await comoVa(p)) !== "pendiente") return "la promesa se cumple antes de que salgan todos los avisos (¿esperas a TODOS con Promise.all?)";
            const r = await p;
            if (!igual(logs, ["A", "C", "B"])) return `por la consola sale ${muestra(logs)} y debería salir A, C, B`;
            if (igual(r, ["B", "A", "C"])) return `se cumple con ${muestra(r)}: ese es el orden del array, no el orden en que SALEN`;
            if (!igual(r, ["A", "C", "B"])) return `se cumple con ${muestra(r)} y debería ser ["A", "C", "B"]`;
            if (ahora() - t < 130) return "se cumple antes de que salga el último aviso";
            const vacio = await m.programarAvisos([]);
            return igual(vacio, []) || `sin avisos debería cumplirse con [] y da ${muestra(vacio)}`;
          }),
      },
      {
        id: "1.2",
        texto: "✍️ cancelable: clearTimeout y reject",
        fn: async ({ m }) => {
          const a = m.cancelable(30, "ok");
          if (!esPromesa(a?.promesa) || typeof a?.cancelar !== "function") return "tiene que devolver un objeto { promesa, cancelar }";
          if ((await a.promesa) !== "ok") return "sin cancelar, la promesa tiene que cumplirse con el valor";
          a.cancelar(); // ya cumplida: no hace nada
          const original = globalThis.clearTimeout;
          let limpiados = 0;
          globalThis.clearTimeout = (id) => {
            limpiados++;
            return original(id);
          };
          try {
            const b = m.cancelable(200, "tarde");
            await esperar(10);
            const t = ahora();
            b.cancelar();
            const e = await rechazo(b.promesa);
            if (!e) return "después de cancelar(), la promesa tiene que RECHAZARSE (y se ha cumplido)";
            if (e.message !== "Cancelado") return `se rechaza con ${muestra(e.message)} y el mensaje tiene que ser "Cancelado"`;
            if (ahora() - t > 100) return "se rechaza, pero no al momento de cancelar: ¿llamas a reject dentro de cancelar?";
            return limpiados > 0 || "se rechaza, pero el temporizador sigue vivo: ¿lo paras con clearTimeout(id)?";
          } finally {
            globalThis.clearTimeout = original;
          }
        },
      },
    ],
  },
  {
    id: "2",
    titulo: "Bloque 2 · Promesas",
    modulos: { m: "src/bloque2/promesas.js", pred: "src/bloque2/predicciones.js", e: "src/modelo/errores.js" },
    pruebas: [
      {
        id: "2.p",
        texto: "🔮 Predicciones: con qué se cumple cada cadena",
        fn: predicciones({
          p1: [
            `Promise.resolve(2).then((x) => { x * 10; }).then((x) => String(x))`,
            "un then con LLAVES y sin return devuelve undefined: el siguiente recibe undefined, y no hay ningún error",
            "el primer then tiene llaves: ¿qué devuelve?",
          ],
          p2: [
            `Promise.reject(new Error("pinchazo")).then(() => "A").then(() => "B").catch((e) => e.message).then((m) => m + "!")`,
            "un rechazo SALTA todos los then hasta el primer catch; lo que devuelve catch sigue la cadena como un valor normal",
            "¿se ejecutan los then de A y B? ¿Y el último?",
          ],
          p3: [
            `Promise.resolve("ok").finally(() => "otro")`,
            "finally se ejecuta pase lo que pase, pero lo que devuelve NO cambia el valor: la cadena sigue con «ok»",
            "¿finally cambia el valor de la promesa?",
          ],
          p4: [
            `Promise.any([Promise.reject(new Error("a")), esperar(20).then(() => "b"), esperar(50).then(() => "c")])`,
            "any se cumple con la PRIMERA que se cumple; las que fallan no cuentan (solo se rechaza si fallan todas)",
            "¿any se para en la que falla? ¿Cuál se cumple antes, b o c?",
          ],
          p5: [
            `Promise.allSettled([Promise.resolve(1), Promise.reject(new Error("x"))]).then((r) => r.map((x) => x.status).join(","))`,
            "allSettled NUNCA se rechaza: espera a todas y da { status: 'fulfilled', value } o { status: 'rejected', reason } de cada una",
            "¿allSettled se rechaza si una falla? ¿Qué status tiene cada una?",
          ],
        }),
      },
      {
        id: "2.E",
        texto: "👀 Ejemplo: stockDe (promisificar una función con callback)",
        fn: async ({ m }) => {
          const consultar = (pieza, cb) => setTimeout(() => (pieza === "Cadena" ? cb(null, 4) : cb(new Error(`No hay ${pieza}`))), 5);
          return ((await m.stockDe("Cadena", consultar)) === 4 && (await rechazo(m.stockDe("Sillín", consultar)))) ? true : "stockDe no se cumple con 4 o no se rechaza con una pieza que no hay";
        },
      },
      {
        id: "2.e1",
        texto: "🪜 nombreDelMecanico: encadenar promesas",
        fn: async ({ m }) => {
          const buscarReparacion = (id) => tarda(10, { id, mecanico: "m1" });
          const buscarMecanico = (id) => tarda(10, id === "m1" ? { id, nombre: "Lucía" } : null);
          const p = m.nombreDelMecanico(7, buscarReparacion, buscarMecanico);
          if (!esPromesa(p)) return "tiene que devolver una promesa (la que da el último then)";
          let r;
          try {
            r = await p;
          } catch (error) {
            if (error instanceof TypeError && /undefined/.test(error.message)) return `Trampa: un then con llaves y SIN return: el siguiente then recibe undefined (${error.message})`;
            throw error;
          }
          if (r === undefined) return "se cumple con undefined. Trampa: un then con llaves y SIN return (¿devuelves la promesa de buscarMecanico?)";
          if (r !== "Lucía") return `se cumple con ${muestra(r)} y debería ser "Lucía"`;
          const e = await rechazo(m.nombreDelMecanico(7, () => tarda(5, null, new Error("No existe la 7")), buscarMecanico));
          return e?.message === "No existe la 7" || "si buscarReparacion falla, la promesa tiene que rechazarse con ESE error (no lo atrapes)";
        },
      },
      {
        id: "2.1",
        texto: "✍️ promisificar(fn): para cualquier función con callback",
        fn: async ({ m }) => {
          const sumarLento = (a, b, cb) => setTimeout(() => (typeof a === "number" ? cb(null, a + b) : cb(new Error("No es un número"))), 5);
          const sumar = m.promisificar(sumarLento);
          if (typeof sumar !== "function") return "promisificar tiene que devolver una FUNCIÓN";
          const p = sumar(2, 3);
          if (!esPromesa(p)) return "la función que devuelve tiene que dar una promesa";
          const v = await p;
          if (v !== 5) return `promisificar(sumarLento)(2, 3) se cumple con ${muestra(v)} y debería ser 5 (¿le pasas todos los argumentos con ...args?)`;
          const e = await rechazo(sumar("x", 1));
          return e?.message === "No es un número" || "si el callback recibe un error, la promesa tiene que rechazarse con él";
        },
      },
      {
        id: "2.2",
        texto: "✍️ conTiempoLimite: Promise.race con un ErrorTaller",
        fn: async ({ m, e: errores }) => {
          const rapida = await m.conTiempoLimite(tarda(10, "ok"), 300);
          if (rapida !== "ok") return `una promesa de 10 ms con límite de 300 debería dar "ok" y da ${muestra(rapida)}`;
          const t = ahora();
          const e = await rechazo(m.conTiempoLimite(new Promise(() => {}), 40));
          if (!e) return "una promesa que no termina nunca tiene que rechazarse al pasar el límite";
          if (ahora() - t > 300) return "se rechaza, pero tarda mucho más que el límite";
          if (!(e instanceof errores.ErrorTaller)) return `se rechaza con un ${e?.name}: tiene que ser un ErrorTaller`;
          if (e.message !== "Tiempo agotado" || e.datos?.ms !== 40) return `el error tiene message ${muestra(e.message)} y datos ${muestra(e.datos)}; debería ser "Tiempo agotado" y { ms: 40 }`;
          const propio = await rechazo(m.conTiempoLimite(tarda(5, null, new Error("Sin red")), 300));
          return propio?.message === "Sin red" || "si la promesa falla antes del límite, el error tiene que ser el SUYO";
        },
      },
      {
        id: "2.3",
        texto: "✍️ compararProveedores: a la vez, y sin que uno que falla estropee a los demás",
        fn: async ({ m, e: errores }) => {
          const proveedores = {
            "Bicis Sur": () => tarda(60, 12),
            Pedal: () => tarda(20, null, new Error("Pedal no contesta")),
            Rueda: () => tarda(60, 9),
          };
          const t = ahora();
          let r;
          try {
            r = await m.compararProveedores("Cadena", proveedores);
          } catch (error) {
            return `se rechaza (${error.message}). Trampa: Promise.all se rechaza en cuanto UNO falla; aquí toca Promise.allSettled`;
          }
          const esperado = { proveedor: "Rueda", precio: 9, sinRespuesta: ["Pedal"] };
          if (!igual(r, esperado)) return `da ${muestra(r)} y debería dar ${muestra(esperado)}`;
          if (ahora() - t > 125) return `ha tardado ${Math.round(ahora() - t)} ms: va uno detrás de otro. A la vez tardaría lo que el más lento (60)`;
          const e = await rechazo(m.compararProveedores("Cadena", { A: () => tarda(5, null, new Error("no")), B: () => tarda(5, null, new Error("no")) }));
          if (!e) return "si fallan TODOS, tiene que rechazarse";
          return (e instanceof errores.ErrorTaller && e.message === "Ningún proveedor responde") || `si fallan todos, el error tiene que ser ErrorTaller("Ningún proveedor responde"); es ${muestra(e?.message)}`;
        },
      },
    ],
  },
  {
    id: "3",
    titulo: "Bloque 3 · async / await",
    modulos: { m: "src/bloque3/asincrono.js", pred: "src/bloque3/predicciones.js" },
    pruebas: [
      {
        id: "3.p",
        texto: "🔮 Predicciones: las trampas de async/await",
        fn: predicciones({
          p1: [
            `(async () => { let suma = 0; [1, 2, 3].forEach(async (n) => { await esperar(10); suma += n; }); return suma; })()`,
            "forEach NO espera a un callback async: lanza los tres y termina enseguida; el return se ejecuta antes de sumar nada",
            "¿forEach espera a que termine cada await?",
          ],
          p2: [
            `(async () => { const precio = (async () => 30)(); return precio + 5; })()`,
            "sin await, precio es una PROMESA, no 30; una promesa sumada a un número se convierte en el texto «[object Promise]»",
            "¿qué hay en precio si no pones await?",
          ],
          p3: [
            `(async () => { try { return Promise.reject(new Error("x")); } catch { return "pillado"; } })().then((v) => v, () => "se escapa")`,
            "return SIN await devuelve la promesa tal cual: se rechaza FUERA del try, y el catch no se entera",
            "¿el rechazo pasa dentro del try o después de salir de la función?",
          ],
          p4: [
            `(async () => { try { return await Promise.reject(new Error("x")); } catch { return "pillado"; } })().then((v) => v, () => "se escapa")`,
            "con return await, el rechazo pasa DENTRO del try y lo coge el catch",
            "compáralo con p3: ¿qué cambia el await?",
          ],
          p5: [
            `(async () => { const v = []; const tarea = async (n) => { v.push("+" + n); await esperar(10); v.push("-" + n); }; await Promise.all([tarea(1), tarea(2)]); return v.join(","); })()`,
            "con Promise.all las dos tareas EMPIEZAN a la vez (+1, +2) y luego terminan (-1, -2). En serie sería +1,-1,+2,-2",
            "¿empieza la tarea 2 antes de que termine la 1?",
          ],
        }),
      },
      {
        id: "3.E",
        texto: "👀 Ejemplo: horasDe",
        fn: async ({ m }) => (await m.horasDe(7, (id) => tarda(5, { id, horas: 3 }))) === 3 || "horasDe(7) debería dar 3",
      },
      {
        id: "3.e1",
        texto: "🪜 fichaCompleta: de then a await",
        fn: async ({ m }) => {
          const pedirReparacion = (id) => tarda(10, { id, cliente: "c1", bici: "BH" });
          const pedirCliente = (id) => tarda(10, id === "c1" ? { id, telefono: "600111222" } : null);
          const r = await m.fichaCompleta(7, pedirReparacion, pedirCliente);
          const esperado = { id: 7, cliente: "c1", bici: "BH", telefono: "600111222" };
          if (!igual(r, esperado)) return `da ${muestra(r)} y debería dar ${muestra(esperado)}`;
          const codigo = m.fichaCompleta.toString();
          if (/\.then\s*\(/.test(codigo)) return "funciona, pero sigue teniendo .then: el ejercicio es reescribirla SOLO con await";
          return codigo.includes("await") || "funciona, pero no usa await";
        },
      },
      {
        id: "3.1",
        texto: "✍️ cargarEnPantalla: try / catch / finally",
        fn: async ({ m }) => {
          const pantalla = { ocupada: false, error: "viejo" };
          const p = m.cargarEnPantalla(7, (id) => tarda(40, { id }), pantalla);
          if (pantalla.error !== "") return `nada más llamarla, pantalla.error tiene que quedar en "" y es ${muestra(pantalla.error)}`;
          if (pantalla.ocupada !== true) return "nada más llamarla, la pantalla tiene que estar ocupada (true) mientras llega la respuesta. Si la pones a true y aun así sale false → Trampa: return sin await dentro del try (el finally se ejecuta enseguida)";
          const r = await p;
          if (!igual(r, { id: 7 })) return `con una reparación que llega bien devuelve ${muestra(r)}`;
          if (pantalla.ocupada !== false) return "al acabar bien, la pantalla sigue ocupada: ¿pones ocupada = false en el finally?";
          const q = m.cargarEnPantalla(8, () => tarda(40, null, new Error("No existe la 8")), pantalla);
          await esperar(15);
          if (pantalla.ocupada !== true) return "Trampa: la pantalla deja de estar ocupada antes de que llegue la respuesta. ¿return sin await dentro del try? (el finally se ejecuta enseguida)";
          let r2;
          try {
            r2 = await q;
          } catch (error) {
            return `si falla, se rechaza (${error.message}). Trampa: dentro del try, return sin await deja escapar el error; o te falta el catch`;
          }
          if (r2 !== null) return `si falla tiene que devolver null y devuelve ${muestra(r2)}`;
          if (pantalla.error !== "No existe la 8") return `si falla, pantalla.error tiene que ser el mensaje del error y es ${muestra(pantalla.error)}`;
          return pantalla.ocupada === false || "si falla, la pantalla se queda ocupada: el finally se ejecuta vaya bien o mal";
        },
      },
      {
        id: "3.2",
        texto: "✍️ presupuestosDelDia: de verdad en paralelo",
        fn: async ({ m }) => {
          const t = ahora();
          const r = await m.presupuestosDelDia([1, 2, 3, 4], (id) => tarda(60, { id, importe: id * 10 }));
          const ms = ahora() - t;
          if (!Array.isArray(r) || !igual(r.map((p) => p?.id), [1, 2, 3, 4])) return `da ${muestra(r)}: tienen que ser los 4 presupuestos, en el orden de los ids`;
          return ms < 170 || `4 presupuestos de 60 ms han tardado ${Math.round(ms)} ms. Trampa: en SERIE (await dentro del for). A la vez tardarían unos 60: Promise.all`;
        },
      },
      {
        id: "3.3",
        texto: "✍️ enviarEnOrden: de una en una (aquí NO vale en paralelo)",
        fn: async ({ m }) => {
          let activos = 0;
          let maximo = 0;
          const enviadas = [];
          const enviar = (rep) =>
            new Promise((resolve, reject) => {
              activos++;
              maximo = Math.max(maximo, activos);
              setTimeout(() => {
                activos--;
                if (rep.falla) return reject(new Error(`Falla el envío de ${rep.id}`));
                enviadas.push(rep.id);
                resolve();
              }, 20);
            });
          const r = await m.enviarEnOrden([{ id: 1 }, { id: 2 }, { id: 3 }], enviar);
          if (r === 0 && enviadas.length === 0) return "devuelve 0 enseguida, antes de enviar nada. Trampa: await dentro de forEach (forEach no espera); usa for…of";
          if (maximo > 1) return `ha habido ${maximo} envíos a la vez: el programa solo admite uno. ¿Promise.all o forEach? Aquí toca for…of con await`;
          if (!igual(enviadas, [1, 2, 3]) || r !== 3) return `ha enviado ${muestra(enviadas)} y devuelve ${muestra(r)}; debería enviar [1, 2, 3] y devolver 3`;
          enviadas.length = 0;
          const e = await rechazo(m.enviarEnOrden([{ id: 1 }, { id: 2, falla: true }, { id: 3 }], enviar));
          if (!e) return "si un envío falla, enviarEnOrden tiene que rechazarse";
          if (e.message !== "Falla el envío de 2") return `se rechaza con ${muestra(e.message)}: tiene que ser el error del envío que ha fallado`;
          await esperar(40);
          return igual(enviadas, [1]) || `tras fallar el 2, se ha seguido enviando: ${muestra(enviadas)}`;
        },
      },
      {
        id: "3.4",
        opcional: true,
        texto: "➕ reintentar con pausa: return await dentro del try",
        fn: async ({ m }) => {
          const fallaHasta = (n) => {
            let intentos = 0;
            const tarea = async () => {
              intentos++;
              await esperar(5);
              if (intentos < n) throw new Error(`fallo ${intentos}`);
              return `bien al ${intentos}`;
            };
            return { tarea, intentos: () => intentos };
          };
          let f = fallaHasta(1);
          let r = await m.reintentar(f.tarea, 3, 50);
          if (r !== "bien al 1" || f.intentos() !== 1) return `si sale bien a la primera tiene que dar "bien al 1" con 1 intento; da ${muestra(r)} con ${f.intentos()}`;
          f = fallaHasta(3);
          let e;
          try {
            r = await m.reintentar(f.tarea, 3, 30);
          } catch (error) {
            e = error;
          }
          if (e && f.intentos() === 1) return `se rinde al primer fallo (${e.message}). Trampa: «return tarea()» sin await dentro del try: el rechazo sale fuera y el catch no se entera`;
          if (e) return `falla 2 veces y a la 3.ª va bien, pero se rechaza con ${muestra(e.message)} tras ${f.intentos()} intentos`;
          if (r !== "bien al 3") return `falla 2 veces y a la 3.ª va bien: debería dar "bien al 3" y da ${muestra(r)}`;
          f = fallaHasta(9);
          const t = ahora();
          e = await rechazo(m.reintentar(f.tarea, 2, 50));
          const ms = ahora() - t;
          if (!e) return "si fallan todos los intentos, tiene que rechazarse";
          if (f.intentos() !== 2) return `con 2 intentos lo ha intentado ${f.intentos()} veces`;
          if (e.message !== "fallo 2") return `el error tiene que ser el del ÚLTIMO intento ("fallo 2") y es ${muestra(e.message)}`;
          if (ms < 45) return `entre un intento y otro no espera: ha tardado ${Math.round(ms)} ms con una pausa de 50`;
          return ms < 95 || `ha tardado ${Math.round(ms)} ms: después del ÚLTIMO intento no hay que esperar`;
        },
      },
    ],
  },
  {
    id: "4",
    titulo: "Bloque 4 · fetch",
    modulos: { m: "src/bloque4/api.js", pred: "src/bloque4/predicciones.js", e: "src/modelo/errores.js", r: "src/modelo/reparacion.js" },
    pruebas: [
      {
        id: "4.p",
        texto: "🔮 Predicciones: respuestas, cuerpos y JSON",
        fn: predicciones({
          p1: [
            `new Response("[]", { status: 404 }).ok`,
            "ok solo es true con un status de 200 a 299. Y ojo: fetch NO se rechaza con un 404; hay que mirar res.ok",
            "¿qué rango de status cuenta como ok?",
          ],
          p2: [
            `(async () => { const r = new Response("[1]"); await r.json(); try { await r.json(); return "dos veces"; } catch { return "error"; } })()`,
            "el cuerpo de una respuesta solo se puede leer UNA vez: el segundo json() lanza un TypeError",
            "¿se puede leer dos veces el mismo cuerpo?",
          ],
          p3: [
            `String({ cliente: "Ana" })`,
            "es lo que se envía si pones body: objeto sin JSON.stringify: el servidor recibe «[object Object]»",
            "¿cómo se convierte un objeto en texto si no usas JSON.stringify?",
          ],
          p4: [
            `new Response("<h1>Hola</h1>").json().then(() => "json", (e) => e.name)`,
            "si el servidor devuelve HTML (una página de error, una URL mal escrita), res.json() se rechaza con un SyntaxError",
            "¿qué pasa si res.json() recibe algo que no es JSON?",
          ],
        }),
      },
      {
        id: "4.E",
        texto: "👀 Ejemplo: estadoDe",
        fn: async ({ m }) => (await m.estadoDe("/no-existe", fetchFalso({}))) === 404 || "estadoDe de una URL que no existe debería dar 404",
      },
      {
        id: "4.e1",
        texto: "🪜 opcionesPOST: method, Content-Type y body en JSON",
        fn: ({ m }) => {
          const o = m.opcionesPOST({ id: 7, cliente: "Ana" });
          if (o?.method !== "POST") return `method es ${muestra(o?.method)}: tiene que ser "POST" (por defecto fetch hace GET)`;
          if (new Headers(o.headers ?? {}).get("content-type") !== "application/json") return "Trampa: falta la cabecera Content-Type: application/json (el servidor no sabe que le mandas JSON)";
          if (typeof o.body !== "string") return `Trampa: body es ${muestra(o.body)}: tiene que ser un TEXTO, con JSON.stringify (si no, llega «[object Object]»)`;
          return igual(JSON.parse(o.body), { id: 7, cliente: "Ana" }) || `body es ${muestra(o.body)}`;
        },
      },
      {
        id: "4.1",
        texto: "✍️ pedirJSON: res.ok, sin red y errores con el status",
        fn: async ({ m, e: errores }) => {
          const f = fetchFalso({ "/piezas.json": { cuerpo: PIEZAS }, "/caido": { status: 500, cuerpo: {} }, "/sin-red": "red" });
          const r = await m.pedirJSON("/piezas.json", f);
          if (!igual(r, PIEZAS)) return `con un 200 tiene que devolver los datos ya convertidos (res.json()); da ${muestra(r)}`;
          for (const [url, status] of [["/nada", 404], ["/caido", 500]]) {
            const e = await rechazo(m.pedirJSON(url, f));
            if (!e) return `con un ${status} se cumple. Trampa: sin mirar res.ok (fetch NO se rechaza con un ${status})`;
            if (!(e instanceof errores.ErrorTaller)) return `con un ${status} se rechaza con un ${e?.name}: tiene que ser un ErrorTaller`;
            if (e.message !== `HTTP ${status} en ${url}` || e.datos?.status !== status) return `el error de un ${status} es ${muestra(e.message)} con datos ${muestra(e.datos)}; debería ser "HTTP ${status} en ${url}" con { status: ${status}, url }`;
          }
          const sinRed = await rechazo(m.pedirJSON("/sin-red", f));
          if (!(sinRed instanceof errores.ErrorTaller) || sinRed.message !== "Sin conexión con el servidor") return `sin red se rechaza con ${muestra(sinRed?.name)}: ${muestra(sinRed?.message)}. Tiene que ser ErrorTaller("Sin conexión con el servidor") (¿try/catch alrededor del await fetchFn?)`;
          const original = globalThis.fetch;
          globalThis.fetch = fetchFalso({ "/piezas.json": { cuerpo: PIEZAS } });
          try {
            return igual(await m.pedirJSON("/piezas.json"), PIEZAS) || "si no te pasan fetchFn, tiene que usar fetch (fetchFn = fetch en los parámetros)";
          } catch (error) {
            return `sin fetchFn revienta (${error.message}): pon fetchFn = fetch en los parámetros`;
          } finally {
            globalThis.fetch = original;
          }
        },
      },
      {
        id: "4.2",
        texto: "✍️ enviarReparacion: POST de una reparación terminada",
        fn: async ({ m, e: errores, r: modelo }) => {
          const f = fetchFalso({ "/api/facturas": { status: 201, cuerpo: { ticket: "T-7" } }, "/api/roto": { status: 500, cuerpo: {} } });
          const rep = new modelo.Reparacion("Ana", "BH", 2);
          rep.anadirPieza("Cadena", 18);
          const e1 = await rechazo(m.enviarReparacion(rep, "/api/facturas", f));
          if (!(e1 instanceof errores.ErrorEstado)) return `con una reparación "pendiente" tiene que lanzar ErrorEstado; ${e1 ? `lanza ${e1.name}` : "no lanza nada"}`;
          if (f.peticiones.length) return "con una reparación que no está lista NO se hace la petición: comprueba el estado antes de fetchFn";
          rep.empezar();
          rep.terminar();
          const r = await m.enviarReparacion(rep, "/api/facturas", f);
          const { opciones } = f.peticiones[0] ?? {};
          if (opciones?.method !== "POST") return "la petición tiene que ser method: \"POST\" (usa opcionesPOST)";
          if (new Headers(opciones.headers ?? {}).get("content-type") !== "application/json") return "Trampa: falta la cabecera Content-Type: application/json";
          let cuerpo;
          try {
            cuerpo = JSON.parse(opciones.body);
          } catch {
            return `Trampa: el body tiene que ser un texto JSON (JSON.stringify); es ${muestra(opciones.body)}`;
          }
          const esperado = { id: rep.id, cliente: "Ana", bici: "BH", tipo: "normal", total: 68 };
          if (cuerpo.total === undefined && cuerpo.cliente === "Ana") return `el cuerpo es ${muestra(cuerpo)}. Trampa: JSON.stringify(reparacion) no lleva tipo ni total, que son getters: monta tú el objeto`;
          if (!igual(cuerpo, esperado)) return `el cuerpo enviado es ${muestra(cuerpo)} y debería ser ${muestra(esperado)}`;
          if (!igual(r, { ticket: "T-7" })) return `tiene que devolver lo que responde el servidor; da ${muestra(r)}`;
          const e2 = await rechazo(m.enviarReparacion(rep, "/api/roto", f));
          return (e2 instanceof errores.ErrorTaller && e2.message === "HTTP 500 en /api/roto") || `con un 500 tiene que rechazarse con ErrorTaller("HTTP 500 en /api/roto"); ${e2 ? muestra(e2.message) : "se cumple (¿miras res.ok?)"}`;
        },
      },
      {
        id: "4.3",
        texto: "✍️ cargarCatalogo: los cuatro estados",
        fn: async ({ m }) => {
          const f = fetchFalso({ "/piezas.json": { cuerpo: PIEZAS, ms: 10 }, "/vacio.json": { cuerpo: [] }, "/caido": { status: 503, cuerpo: {} } });
          const estados = [];
          const p = m.cargarCatalogo("/piezas.json", (e) => estados.push(e), { fetchFn: f });
          if (!igual(estados, [{ estado: "cargando" }])) return `nada más llamarla tiene que pintar { estado: "cargando" }, antes de esperar a nada; ha pintado ${muestra(estados)}`;
          await p;
          if (!igual(estados, [{ estado: "cargando" }, { estado: "datos", piezas: PIEZAS }])) return `con piezas pinta ${muestra(estados)}`;
          const vacio = [];
          await m.cargarCatalogo("/vacio.json", (e) => vacio.push(e), { fetchFn: f });
          if (!igual(vacio, [{ estado: "cargando" }, { estado: "vacio" }])) return `con [] pinta ${muestra(vacio)} y debería ser cargando y { estado: "vacio" }`;
          const caido = [];
          try {
            await m.cargarCatalogo("/caido", (e) => caido.push(e), { fetchFn: f });
          } catch (error) {
            return `con un 503 se rechaza (${error.message}): el error se coge dentro y se PINTA`;
          }
          return (caido.at(-1)?.estado === "error" && String(caido.at(-1).mensaje).includes("503")) || `con un 503 pinta ${muestra(caido)}: el último tiene que ser { estado: "error", mensaje } con el 503 (¿miras res.ok?)`;
        },
      },
      {
        id: "4.3b",
        opcional: true,
        texto: "➕ cargarCatalogo: cancelar con un AbortController si tarda",
        fn: async ({ m }) => {
          const f = fetchFalso({ "/lento": "cuelga" });
          const lento = [];
          const t = ahora();
          await m.cargarCatalogo("/lento", (e) => lento.push(e), { fetchFn: f, limite: 50 });
          const signal = f.peticiones.at(-1).opciones?.signal;
          if (!(signal instanceof AbortSignal)) return "a fetchFn no le llega ningún signal: crea un AbortController y pasa { signal: controlador.signal }";
          if (ahora() - t > 500) return "con limite 50 tarda demasiado en rendirse: ¿llamas a controlador.abort() con un setTimeout de limite ms?";
          return igual(lento.at(-1), { estado: "error", mensaje: "El proveedor tarda demasiado" }) || `cuando se cancela pinta ${muestra(lento)}; el último debería ser { estado: "error", mensaje: "El proveedor tarda demasiado" } (el error se llama "AbortError")`;
        },
      },
      {
        id: "4.4",
        texto: "✍️ traerReparaciones: del JSON a instancias del modelo",
        fn: async ({ m, r: modelo }) => {
          const datos = [
            { id: 70, cliente: "Ana", bici: "BH", horas: 2, urgente: true, entrada: "2026-12-01T08:30:00.000Z" },
            { id: 71, cliente: "Luis", bici: "Orbea", horas: 1, entrada: "2026-12-01T09:00:00.000Z" },
            { id: 72, cliente: "Eva", bici: "Trek", horas: 0, entrada: "2026-12-01T09:30:00.000Z" },
          ];
          const f = fetchFalso({ "/pendientes.json": { cuerpo: datos } });
          const r = await m.traerReparaciones("/pendientes.json", f);
          if (!Array.isArray(r)) return `tiene que devolver un array; da ${muestra(r)}`;
          if (r.length && !r.every((x) => x instanceof modelo.Reparacion)) return "Trampa: son objetos planos, no instancias. Pásalos por el constructor: new Reparacion(…) / new ReparacionUrgente(…)";
          if (r.length === 3) return "devuelve las 3: la de 0 horas no es válida (el constructor lanza) y hay que saltarla";
          if (r.length !== 2) return `devuelve ${r.length} reparaciones y deberían ser 2`;
          if (!(r[0] instanceof modelo.Reparacion)) return "Trampa: son objetos planos, no instancias. Pásalos por el constructor: new Reparacion(…) / new ReparacionUrgente(…)";
          if (!(r[0] instanceof modelo.ReparacionUrgente) || r[1] instanceof modelo.ReparacionUrgente) return "la primera (urgente: true) tiene que ser ReparacionUrgente y la segunda, Reparacion";
          if (r[0].id !== 70 || r[1].id !== 71) return `los ids son ${r[0].id} y ${r[1].id}: hay que conservar los del servidor ({ id, entrada } en el constructor)`;
          if (!(r[0].entrada instanceof Date) || r[0].entrada.toISOString() !== "2026-12-01T08:30:00.000Z") return `la entrada es ${muestra(r[0].entrada)}: tiene que ser la fecha del servidor, como Date`;
          if (r[0].total !== 65) return `el total de la urgente debería ser 65 (2 h × 25 + 30 %) y es ${r[0].total}`;
          const e = await rechazo(m.traerReparaciones("/nada", f));
          return e ? true : "si la petición da 404, traerReparaciones tiene que rechazarse (¿usas pedirJSON?)";
        },
      },
    ],
  },
  {
    id: "5",
    titulo: "Bloque 5 · JSON y localStorage",
    modulos: { m: "src/bloque5/guardado.js", pred: "src/bloque5/predicciones.js", r: "src/modelo/reparacion.js" },
    pruebas: [
      {
        id: "5.p",
        texto: "🔮 Predicciones: lo que hace JSON con cada cosa",
        fn: predicciones({
          p1: [
            `JSON.stringify(new Map([["Lucía", 2]]))`,
            "un Map no tiene propiedades propias: en JSON sale vacío. Se guarda como array de pares: [...mapa]",
            "¿qué ve JSON.stringify en un Map?",
          ],
          p2: [
            `typeof JSON.parse(JSON.stringify({ entrada: new Date(2026, 11, 1) })).entrada`,
            "JSON no tiene fechas: la Date se guarda como texto ISO y vuelve como TEXTO. Hay que hacer new Date(texto)",
            "¿JSON tiene un tipo fecha?",
          ],
          p3: [
            `JSON.stringify({ total: { importe: 50, toJSON() { return "secreto"; } } })`,
            "si un objeto tiene toJSON(), JSON.stringify guarda lo que DEVUELVE toJSON, no el objeto",
            "¿qué hace JSON.stringify cuando encuentra un toJSON?",
          ],
          p4: [
            `JSON.parse(null)`,
            "parse convierte null en el texto «null», que es JSON válido: da null. Por eso «JSON.parse(getItem(clave)) ?? porDefecto» funciona",
            "¿revienta, o da algo?",
          ],
        }),
      },
      {
        id: "5.E",
        texto: "👀 Ejemplo: guardarJSON",
        fn: ({ m }) => {
          const s = new AlmacenFalso();
          m.guardarJSON(s, "taller:prueba", { horas: 2 });
          return s.getItem("taller:prueba") === '{"horas":2}' || `guarda ${muestra(s.getItem("taller:prueba"))}`;
        },
      },
      {
        id: "5.e1",
        opcional: true,
        texto: "➕ asignacionesATexto / textoAAsignaciones: un Map en JSON",
        fn: ({ m }) => {
          const texto = m.asignacionesATexto(new Map([["Lucía", [1, 2]], ["Pablo", []]]));
          if (texto === "{}") return 'da "{}": un Map en JSON sale vacío. Conviértelo antes en un array de pares: [...mapa]';
          if (texto !== '[["Lucía",[1,2]],["Pablo",[]]]') return `da ${muestra(texto)} y debería ser '[["Lucía",[1,2]],["Pablo",[]]]'`;
          const mapa = m.textoAAsignaciones('[["Lucía",[1,2]]]');
          if (!(mapa instanceof Map)) return `textoAAsignaciones da ${muestra(mapa)}: tiene que ser un Map (new Map(array de pares))`;
          return igual(mapa.get("Lucía"), [1, 2]) || `en el Map, "Lucía" tiene ${muestra(mapa.get("Lucía"))}`;
        },
      },
      {
        id: "5.1",
        texto: "✍️ leerJSON: valor por defecto y desconfiar de lo leído",
        fn: ({ m }) => {
          const s = new AlmacenFalso();
          if (!igual(m.leerJSON(s, "nada", [1]), [1])) return "si la clave no existe, tiene que devolver el valor por defecto";
          s.setItem("ok", '{"n":5}');
          if (!igual(m.leerJSON(s, "ok", null), { n: 5 })) return "con un JSON válido tiene que devolver el valor convertido";
          s.setItem("roto", "{roto");
          let r;
          try {
            r = m.leerJSON(s, "roto", "defecto");
          } catch (e) {
            return `con un JSON roto revienta (${e.name}). Trampa: JSON.parse sin try/catch`;
          }
          if (r !== "defecto") return `con un JSON roto debería dar el valor por defecto y da ${muestra(r)}`;
          s.setItem("nulo", "null");
          if (m.leerJSON(s, "nulo", "defecto") !== "defecto") return 'si lo guardado es "null", tiene que dar el valor por defecto';
          s.setItem("cero", "0");
          return m.leerJSON(s, "cero", 99) === 0 || "un 0 guardado es un valor válido: no lo cambies por el de defecto (¿usas || en vez de ??)";
        },
      },
      {
        id: "5.2",
        texto: "✍️ reparacionAJSON: lo que devolvería un toJSON()",
        fn: ({ m, r: modelo }) => {
          const rep = new modelo.ReparacionUrgente("Ana", "BH", 2, { id: 90, entrada: "2026-12-01T08:30:00.000Z" });
          rep.anadirPieza("Cadena", 18);
          rep.empezar();
          const d = m.reparacionAJSON(rep);
          const esperado = { tipo: "urgente", id: 90, cliente: "Ana", bici: "BH", horas: 2, entrada: "2026-12-01T08:30:00.000Z", estado: "en-taller", piezas: [{ nombre: "Cadena", precio: 18 }] };
          if (d instanceof modelo.Reparacion) return "devuelve la misma reparación: tiene que ser un objeto PLANO nuevo ({ tipo, id, … })";
          if (d?.entrada instanceof Date) return "entrada sigue siendo una Date: pásala a texto con toISOString()";
          if (!igual(d, esperado)) return `da ${muestra(d)} y debería dar ${muestra(esperado)}`;
          return igual(JSON.parse(JSON.stringify(d)), esperado) || "lo que devuelve no sobrevive a JSON.stringify + JSON.parse";
        },
      },
      {
        id: "5.3",
        texto: "✍️ reparacionDesdeJSON: otra vez una instancia, con su id, su fecha y su estado",
        fn: ({ m, r: modelo }) => {
          const datos = { tipo: "urgente", id: 91, cliente: "Eva", bici: "Trek", horas: 1, entrada: "2026-12-01T10:00:00.000Z", estado: "lista", piezas: [{ nombre: "Cámara", precio: 6 }] };
          const r = m.reparacionDesdeJSON(structuredClone(datos));
          if (!(r instanceof modelo.Reparacion)) return "Trampa: perder la clase. Da un objeto plano, sin métodos ni getters: hay que pasar por el constructor";
          if (!(r instanceof modelo.ReparacionUrgente)) return 'con tipo "urgente" tiene que ser una ReparacionUrgente';
          if (r.id !== 91) return `el id es ${muestra(r.id)}: tiene que conservar el 91 (constructor con { id, entrada })`;
          if (!(r.entrada instanceof Date) || r.entrada.toISOString() !== datos.entrada) return `la entrada es ${muestra(r.entrada)}: tiene que ser una Date con la misma fecha`;
          if (!igual(r.piezas, datos.piezas)) return `las piezas son ${muestra(r.piezas)}: vuelve a añadirlas con anadirPieza`;
          if (r.estado !== "lista") return `el estado es ${muestra(r.estado)} y debería ser "lista": recupéralo con empezar() y terminar()`;
          if (r.total !== 40.3) return `el total es ${r.total} y debería ser 40.3`;
          const normal = m.reparacionDesdeJSON({ ...structuredClone(datos), tipo: "normal", id: 92, estado: "pendiente" });
          if (normal instanceof modelo.ReparacionUrgente || normal.estado !== "pendiente") return 'con tipo "normal" y estado "pendiente" tiene que ser una Reparacion pendiente';
          const nueva = new modelo.Reparacion("Otra", "BH", 1);
          return nueva.id > 92 || "una reparación nueva repite un id de las recuperadas: ¿pasas el id al constructor?";
        },
      },
      {
        id: "5.4",
        texto: "✍️ cargarReparaciones: de localStorage a instancias, sin romperse",
        fn: ({ m, r: modelo }) => {
          const s = new AlmacenFalso();
          if (!igual(m.cargarReparaciones(s), [])) return "sin nada guardado tiene que dar []";
          const base = { tipo: "normal", cliente: "Ana", bici: "BH", horas: 2, entrada: "2026-12-01T08:30:00.000Z", estado: "pendiente", piezas: [] };
          s.setItem("taller:reparaciones", JSON.stringify([{ ...base, id: 93 }, { ...base, id: 94, horas: -1 }, { ...base, id: 95, tipo: "urgente" }]));
          const r = m.cargarReparaciones(s);
          if (Array.isArray(r) && r.length && !r.every((x) => x instanceof modelo.Reparacion)) return "Trampa: perder la clase al leer de localStorage. JSON.parse da objetos planos: usa reparacionDesdeJSON";
          if (!Array.isArray(r) || r.length !== 2) return `da ${muestra(r)}: la de -1 horas no se puede reconstruir y se salta; deberían quedar 2`;
          if (!r.every((x) => x instanceof modelo.Reparacion)) return "Trampa: perder la clase al leer de localStorage. JSON.parse da objetos planos: usa reparacionDesdeJSON";
          if (!igual(r.map((x) => x.id), [93, 95]) || !(r[1] instanceof modelo.ReparacionUrgente)) return `los ids son ${muestra(r.map((x) => x.id))}; deberían ser [93, 95] y la segunda, urgente`;
          for (const raro of ["{roto", '{"no":"es un array"}', "null"]) {
            const otro = new AlmacenFalso();
            otro.setItem("taller:reparaciones", raro);
            let x;
            try {
              x = m.cargarReparaciones(otro);
            } catch (e) {
              return `con ${raro} guardado revienta (${e.name}): ¿usas tu leerJSON y compruebas que es un array?`;
            }
            if (!igual(x, [])) return `con ${raro} guardado tiene que dar [] y da ${muestra(x)}`;
          }
          return true;
        },
      },
    ],
  },
  {
    id: "6",
    titulo: "Bloque 6 · Simulacro: recibir las reparaciones del día",
    simulacro: true,
    modulos: { m: "src/bloque6/simulacro.js", e: "src/modelo/errores.js", t: "src/modelo/taller.js", r: "src/modelo/reparacion.js" },
    pruebas: [
      {
        id: "6.1",
        punto: 1,
        texto: "1 · pide la url y crea las reparaciones en el taller",
        fn: async ({ m, t: modelo, r }) => {
          const taller = new modelo.Taller();
          const f = fetchFalso({ "/del-dia.json": { cuerpo: DEL_DIA } });
          const recepcion = m.crearRecepcion(taller, { url: "/del-dia.json", storage: new AlmacenFalso(), fetchFn: f });
          if (typeof recepcion?.recibir !== "function") return "crearRecepcion tiene que devolver un objeto con un método recibir()";
          const res = await recepcion.recibir();
          if (f.peticiones[0]?.url !== "/del-dia.json") return "recibir() tiene que pedir la url que te pasan";
          const lista = taller.reparaciones();
          if (lista.length !== 2) return `en el taller hay ${lista.length} reparaciones y deberían ser 2`;
          if (lista[0].cliente !== "Ana" || !(lista[0] instanceof r.ReparacionUrgente) || lista[1].cliente !== "Luis") return "las reparaciones no son las de la lista (¿pasas urgente a nuevaReparacion?)";
          return igual(res, { nuevas: 2, repetidas: 0, saltadas: 0 }) || `se cumple con ${muestra(res)} y debería ser { nuevas: 2, repetidas: 0, saltadas: 0 }`;
        },
      },
      {
        id: "6.2a",
        punto: 2,
        texto: "2 · las no válidas se saltan sin parar las demás",
        fn: async ({ m, t: modelo }) => {
          const taller = new modelo.Taller();
          const lista = [DEL_DIA[0], { ref: "R-103", cliente: "", bici: "BH", horas: 1 }, { ref: "R-104", cliente: "Eva", bici: "Trek", horas: "dos" }, DEL_DIA[1]];
          const recepcion = m.crearRecepcion(taller, { url: "/del-dia.json", storage: new AlmacenFalso(), fetchFn: fetchFalso({ "/del-dia.json": { cuerpo: lista } }) });
          let res;
          try {
            res = await recepcion.recibir();
          } catch (e) {
            return `con una reparación no válida se rechaza todo (${e.message}): cada una, en su propio try/catch`;
          }
          if (taller.reparaciones().length !== 2) return `en el taller hay ${taller.reparaciones().length} reparaciones: deberían entrar las 2 válidas`;
          return igual(res, { nuevas: 2, repetidas: 0, saltadas: 2 }) || `se cumple con ${muestra(res)} y debería ser { nuevas: 2, repetidas: 0, saltadas: 2 }`;
        },
      },
      {
        id: "6.2b",
        punto: 2,
        texto: "2 · una ref ya recibida no entra otra vez",
        fn: async ({ m, t: modelo }) => {
          const taller = new modelo.Taller();
          const lista = [DEL_DIA[0], DEL_DIA[1], { ...DEL_DIA[0] }];
          const recepcion = m.crearRecepcion(taller, { url: "/del-dia.json", storage: new AlmacenFalso(), fetchFn: fetchFalso({ "/del-dia.json": { cuerpo: lista } }) });
          const res = await recepcion.recibir();
          if (!igual(res, { nuevas: 2, repetidas: 1, saltadas: 0 })) return `con R-101 dos veces en la lista se cumple con ${muestra(res)}; debería ser { nuevas: 2, repetidas: 1, saltadas: 0 }`;
          const otra = await recepcion.recibir();
          if (!igual(otra, { nuevas: 0, repetidas: 3, saltadas: 0 })) return `al volver a recibir la misma lista se cumple con ${muestra(otra)}; debería ser { nuevas: 0, repetidas: 3, saltadas: 0 }`;
          return taller.reparaciones().length === 2 || `en el taller hay ${taller.reparaciones().length} reparaciones y deberían ser 2`;
        },
      },
      {
        id: "6.3",
        punto: 3,
        texto: '3 · guarda las refs recibidas en "taller:recibidas"',
        fn: async ({ m, t: modelo }) => {
          const storage = new AlmacenFalso();
          const lista = [...DEL_DIA, { ref: "R-105", cliente: "", bici: "x", horas: 1 }];
          await m.crearRecepcion(new modelo.Taller(), { url: "/del-dia.json", storage, fetchFn: fetchFalso({ "/del-dia.json": { cuerpo: lista } }) }).recibir();
          const texto = storage.getItem("taller:recibidas");
          if (texto === null) return 'no se ha guardado nada en la clave "taller:recibidas"';
          if (texto === "{}") return 'se guarda "{}". Trampa: un Set (o un Map) en JSON sale vacío; guárdalo como array: [...refs]';
          let guardado;
          try {
            guardado = JSON.parse(texto);
          } catch {
            return `lo guardado no es JSON: ${muestra(texto)} (¿JSON.stringify?)`;
          }
          return igual(guardado, ["R-101", "R-102"]) || `se guarda ${muestra(guardado)} y debería ser ["R-101", "R-102"] (solo las que han entrado)`;
        },
      },
      {
        id: "6.4",
        punto: 4,
        texto: "4 · dos clics seguidos = una sola petición",
        fn: async ({ m, t: modelo }) => {
          const taller = new modelo.Taller();
          const f = fetchFalso({ "/del-dia.json": { cuerpo: DEL_DIA, ms: 40 }, "/caido": { status: 500, cuerpo: {}, ms: 20 } });
          const recepcion = m.crearRecepcion(taller, { url: "/del-dia.json", storage: new AlmacenFalso(), fetchFn: f });
          const [a, b] = [recepcion.recibir(), recepcion.recibir()];
          const [ra, rb] = await Promise.all([a, b]);
          if (f.peticiones.length !== 1) return `dos llamadas seguidas han hecho ${f.peticiones.length} peticiones: la segunda tiene que reutilizar la promesa de la primera, que sigue en marcha`;
          if (!igual(ra, rb) || taller.reparaciones().length !== 2) return `las dos llamadas tienen que cumplirse con lo mismo (${muestra(ra)} y ${muestra(rb)}) y entrar 2 reparaciones`;
          await recepcion.recibir();
          if (f.peticiones.length !== 2) return "cuando la primera ha terminado, una llamada nueva SÍ tiene que pedir otra vez (¿olvidas la promesa en un finally?)";
          const caida = m.crearRecepcion(taller, { url: "/caido", storage: new AlmacenFalso(), fetchFn: f });
          await rechazo(caida.recibir());
          await rechazo(caida.recibir());
          return f.peticiones.length === 4 || "si una llamada falla, la siguiente tiene que volver a pedir: la promesa se olvida también cuando falla (finally)";
        },
      },
      {
        id: "6.5a",
        punto: 5,
        texto: "5 · 404 o sin red: ErrorTaller, taller intacto y nada guardado",
        fn: async ({ m, e: errores, t: modelo }) => {
          for (const [ruta, mensaje] of [["/nada", "HTTP 404 en /nada"], ["/sin-red", "Sin conexión con el servidor"]]) {
            const taller = new modelo.Taller();
            const storage = new AlmacenFalso();
            const f = fetchFalso({ "/sin-red": "red" });
            const e = await rechazo(m.crearRecepcion(taller, { url: ruta, storage, fetchFn: f }).recibir());
            const que = ruta === "/nada" ? "con un 404" : "sin red";
            if (!e) return `${que} se cumple. ${ruta === "/nada" ? "Trampa: sin mirar res.ok" : "Tiene que rechazarse"}`;
            if (!(e instanceof errores.ErrorTaller)) return `${que} se rechaza con un ${e.name} (${e.message}): tiene que ser un ErrorTaller`;
            if (e.message !== mensaje) return `${que} el mensaje es ${muestra(e.message)} y debería ser ${muestra(mensaje)}`;
            if (ruta === "/nada" && e.datos?.status !== 404) return `con un 404, en los datos del error tiene que ir { status: 404 }; van ${muestra(e.datos)}`;
            if (taller.reparaciones().length || storage.length) return `${que} se ha tocado el taller o se ha guardado algo`;
          }
          return true;
        },
      },
      {
        id: "6.5b",
        punto: 5,
        texto: "5 · HTML en vez de JSON, o el servidor no contesta",
        fn: async ({ m, e: errores, t: modelo }) => {
          const storage = new AlmacenFalso();
          const f = fetchFalso({ "/html": { texto: "<h1>Mantenimiento</h1>" }, "/lento": "cuelga" });
          const e1 = await rechazo(m.crearRecepcion(new modelo.Taller(), { url: "/html", storage, fetchFn: f }).recibir());
          if (!(e1 instanceof errores.ErrorTaller) || e1.message !== "La respuesta no es JSON") return `si llega HTML, se rechaza con ${muestra(e1?.name)}: ${muestra(e1?.message)}; debería ser ErrorTaller("La respuesta no es JSON") (¿try/catch alrededor de res.json()?)`;
          const t = ahora();
          const e2 = await rechazo(m.crearRecepcion(new modelo.Taller(), { url: "/lento", storage, fetchFn: f, limite: 50 }).recibir());
          if (ahora() - t > 600) return "con limite 50, se queda esperando: necesitas un tiempo límite (AbortController o Promise.race)";
          if (!(e2 instanceof errores.ErrorTaller) || e2.message !== "Tiempo agotado") return `si no contesta, se rechaza con ${muestra(e2?.name)}: ${muestra(e2?.message)}; debería ser ErrorTaller("Tiempo agotado")`;
          return storage.length === 0 || "si falla, no se guarda nada";
        },
      },
      {
        id: "6.6",
        punto: 6,
        opcional: true,
        texto: "➕ 6 · al recargar no se repite nada, y lo guardado roto no revienta",
        fn: async ({ m, t: modelo }) => {
          const storage = new AlmacenFalso();
          const f = fetchFalso({ "/del-dia.json": { cuerpo: DEL_DIA } });
          await m.crearRecepcion(new modelo.Taller(), { url: "/del-dia.json", storage, fetchFn: f }).recibir();
          const taller = new modelo.Taller();
          const res = await m.crearRecepcion(taller, { url: "/del-dia.json", storage, fetchFn: f }).recibir();
          if (!igual(res, { nuevas: 0, repetidas: 2, saltadas: 0 })) {
            const texto = storage.getItem("taller:recibidas");
            if (texto === "{}") return 'tras recargar se repiten. Trampa: se guardó "{}" porque un Set en JSON sale vacío; guarda [...refs]';
            return `tras recargar (otra crearRecepcion con el mismo storage) se cumple con ${muestra(res)}: las refs ya recibidas se leen de "taller:recibidas"`;
          }
          for (const roto of ["{roto", '{"R-101":true}', "7"]) {
            const s = new AlmacenFalso();
            s.setItem("taller:recibidas", roto);
            let r;
            try {
              r = await m.crearRecepcion(new modelo.Taller(), { url: "/del-dia.json", storage: s, fetchFn: f }).recibir();
            } catch (e) {
              return `con ${roto} en "taller:recibidas" revienta (${e.name}: ${e.message}): si está roto o no es un array, se empieza de cero`;
            }
            if (!igual(r, { nuevas: 2, repetidas: 0, saltadas: 0 })) return `con ${roto} en "taller:recibidas" se cumple con ${muestra(r)}: tiene que empezar de cero`;
          }
          return true;
        },
      },
    ],
  },
];

// 💡 Para empezar: lo que enseña el comprobador junto al ejercicio que toca hacer.
// Más ayuda, paso a paso (idea → ejemplo parecido → esqueleto), en la web: «🆘 ¿Atascado?» de cada bloque.
export const EMPEZAR = {
  "1.p": "En predicciones.js cambia cada undefined por el orden que crees, p. ej. \"A,B,C\". Primero síncrono, luego microtareas, luego tareas.",
  "1.e1": "Usa esperar(ms) (el ejemplo) y, en su then, devuelve el texto con una plantilla `${…}`.",
  "1.1": "Un array vacío para los que salen; por cada aviso, esperar(ms).then(() => { console.log…; push… }). Espera a todas con Promise.all y devuelve el array.",
  "1.2": "Declara id y cancelar FUERA; dentro de new Promise((resolve, reject) => …) guarda el setTimeout en id y define cancelar con clearTimeout + reject.",
  "2.p": "En predicciones.js cambia cada undefined por lo que crees que da. Cuidado con los then con llaves.",
  "2.e1": "return buscarReparacion(id).then((rep) => buscarMecanico(rep.mecanico)).then(…): el segundo then ya recibe el mecánico.",
  "2.1": "return (...args) => new Promise((resolve, reject) => { fn(...args, (error, valor) => …) }): como stockDe, pero con ...args.",
  "2.2": "Una promesa «reloj» que hace reject(new ErrorTaller(\"Tiempo agotado\", { ms })) a los ms, y Promise.race([promesa, reloj]).",
  "2.3": "Object.keys(proveedores) para los nombres; Promise.allSettled(nombres.map(…)).then((resultados) => …): mismo índice = mismo proveedor.",
  "3.p": "En predicciones.js cambia cada undefined por lo que crees que da. Piensa en CUÁNDO se ejecuta cada línea.",
  "3.e1": "async function …: const rep = await pedirReparacion(id); const cliente = await pedirCliente(rep.cliente); return { ...rep, telefono: … }.",
  "3.1": "Las dos propiedades al empezar; luego try { return await … } catch (error) { …; return null; } finally { pantalla.ocupada = false; }",
  "3.2": "Nada de await dentro de un bucle: lánzalos todos con ids.map(…) y espéralos juntos con Promise.all.",
  "3.3": "for (const rep of reparaciones) { await enviar(rep); contador++; }. Sin try/catch: si uno falla, el error sale solo.",
  "3.4": "for de 1 a intentos: try { return await tarea(); } catch (error) { guárdalo; si no es el último, espera: await new Promise((r) => setTimeout(r, pausa)) }. Al salir, throw el último.",
  "4.p": "En predicciones.js cambia cada undefined por lo que crees que da. new Response(…) es una respuesta como las de fetch.",
  "4.e1": "Devuelve un objeto con tres propiedades: method, headers (otro objeto con \"Content-Type\") y body (JSON.stringify(datos)).",
  "4.1": "try { res = await fetchFn(url) } catch { throw ErrorTaller(\"Sin conexión…\") }. Luego: si !res.ok → throw ErrorTaller(`HTTP ${res.status} en ${url}`, …). Al final, return res.json().",
  "4.2": "Primero el estado (antes de fetchFn). Luego const { id, cliente, bici, tipo, total } = reparacion y fetchFn(url, opcionesPOST({ … })).",
  "4.3": "pintar cargando; try { const res = await fetchFn(url); si !res.ok, throw; const piezas = await res.json(); pintar vacio o datos } catch (error) { pintar error con error.message }",
  "4.3b": "const controlador = new AbortController(); setTimeout(() => controlador.abort(), limite); fetchFn(url, { signal: controlador.signal }); en el catch, error.name === \"AbortError\" ? … (y clearTimeout en un finally)",
  "4.4": "const datos = await pedirJSON(url, fetchFn); por cada uno, en un try: new (d.urgente ? ReparacionUrgente : Reparacion)(cliente, bici, horas, { id, entrada }).",
  "5.p": "En predicciones.js cambia cada undefined por lo que crees que da.",
  "5.e1": "JSON.stringify([...mapa]) para guardar; new Map(JSON.parse(texto)) para leer.",
  "5.1": "try { return JSON.parse(storage.getItem(clave)) ?? porDefecto; } catch { return porDefecto; }  (¿por qué ?? y no ||?)",
  "5.2": "Saca las propiedades con desestructuración (también los getters tipo, estado y piezas) y devuelve un objeto nuevo con entrada.toISOString().",
  "5.3": "La clase según datos.tipo; new Clase(cliente, bici, horas, { id, entrada }); un for para anadirPieza; empezar()/terminar() según datos.estado.",
  "5.4": "const datos = leerJSON(storage, \"taller:reparaciones\", []); si no es un array → []. Si lo es, cada uno con reparacionDesdeJSON dentro de un try.",
  "6.1": "Dentro de crearRecepcion, function recibir: const res = await fetchFn(url); const lista = await res.json(); un for…of con taller.nuevaReparacion. return { recibir }.",
  "6.2a": "Cada nuevaReparacion en su propio try/catch: en el catch, saltadas++.",
  "6.2b": "Un Set con las refs recibidas: si ya la tiene → repetidas++ y continue; si entra bien → add(ref).",
  "6.3": "Al terminar: storage.setItem(\"taller:recibidas\", JSON.stringify([...recibidas])). ¿Qué pasa si guardas el Set tal cual?",
  "6.4": "Una variable enCurso fuera de recibir: si hay una promesa en marcha, devuélvela; si no, créala y, en su .finally, enCurso = null.",
  "6.5a": "Como pedirJSON del bloque 4: try/catch alrededor de fetchFn para la red, y res.ok para el status. Todo ANTES de tocar el taller.",
  "6.5b": "try/catch alrededor de res.json() → \"La respuesta no es JSON\". Para el límite: Promise.race con un reloj, como conTiempoLimite del 2.2 (o, si lo has hecho, AbortController).",
  "6.6": "Al empezar cada recibir, lee \"taller:recibidas\" con try/catch: si no es un array, empieza con un Set vacío.",
};
