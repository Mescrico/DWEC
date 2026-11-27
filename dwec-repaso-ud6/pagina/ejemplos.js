// ejemplos.js — Qué enseña la página en cada bloque. No hace falta tocarlo.
//   html:      la página de prueba del bloque (el «escenario»): la ves y la puedes usar.
//   montar:    cómo se conectan TUS funciones al escenario (botones…). Lo que pasa sale en el registro.
//   ejemplos:  código que la página ejecuta con TUS funciones, uno detrás de otro. Si da una promesa, la página
//              espera y te dice con qué se cumple (o con qué se rechaza) y cuánto ha tardado.
//              «espera» es lo que debería salir; "💥" = lo correcto es que se rechace. «maxMs» = no debe tardar más.
//   probar:    las predicciones, escritas para poder ejecutarlas (botón «Probar»).
// En el código: await se puede usar; la última línea es el resultado. Tienes:
//   pedir(ruta)          → promesa con el JSON de la API de prueba (se rechaza si no es ok)
//   pedirReparacion(id), pedirCliente(id), pedirMecanico(id), pedirPresupuesto(id) → lo mismo, de /api/…
//   esperar(ms), las clases del modelo (Taller, Reparacion, ReparacionUrgente, Mecanico, ErrorTaller…)
//   fetch y localStorage, los de verdad (míralos en F12 → Network y F12 → Application)
//   escenario, $("selector") y anota(...) para el registro
const modulos = import.meta.glob("../src/bloque*/*.js");
const cargarModulo = (ruta) => modulos[`../src/${ruta}`]();

export async function cargarModelo() {
  const partes = await Promise.all([
    import("../src/modelo/errores.js"),
    import("../src/modelo/reparacion.js"),
    import("../src/modelo/mecanico.js"),
    import("../src/modelo/taller.js"),
  ]);
  return Object.assign({}, ...partes);
}

// Pinta un estado de la interfaz en la caja .estado del escenario
const PINTAR = `const pintar = (e) => {
  anota("pintar(", e, ")");
  const caja = $(".estado");
  if (e.estado === "cargando") caja.textContent = "⏳ Cargando…";
  else if (e.estado === "vacio") caja.textContent = "📭 El proveedor no tiene piezas";
  else if (e.estado === "error") caja.textContent = "💥 " + e.mensaje;
  else if (e.estado === "datos") caja.textContent = "🔧 " + e.piezas.map((p) => p.nombre + " (" + p.precio + " €)").join(" · ");
};`;

export const BLOQUES = [
  {
    n: 1,
    titulo: "El event loop y los temporizadores",
    modulos: ["bloque1/tiempo.js"],
    html: `<p><button type="button" id="avisos">programarAvisos(…) con 3 avisos: 1,5 s · 0,5 s · 1 s</button></p>
<p><button type="button" id="pedir">Pedir un presupuesto (cancelable, tarda 3 s)</button> <button type="button" id="cancelar">Cancelar</button></p>
<p><small>Abre F12 → Consola: los avisos salen con console.log, cada uno a su hora.</small></p>`,
    montar: [
      {
        nombre: "el botón llama a programarAvisos",
        codigo: `$("#avisos").addEventListener("click", async () => {
  anota("programarAvisos: encargados (mira la consola)");
  const orden = await programarAvisos([{ ms: 1500, texto: "C · recoger la Orbea" }, { ms: 500, texto: "A · llamar a Ana" }, { ms: 1000, texto: "B · pedir cadenas" }]);
  anota("✔ se cumple con", orden);
});`,
      },
      {
        nombre: "los botones pedir y cancelar usan cancelable",
        codigo: `let actual = null;
$("#pedir").addEventListener("click", async () => {
  actual = cancelable(3000, "presupuesto: 45 €");
  anota("⏳ pidiendo…");
  try { anota("✔", await actual.promesa); } catch (e) { anota("💥 se rechaza con", e); }
});
$("#cancelar").addEventListener("click", () => actual?.cancelar());`,
      },
    ],
    ejemplos: [
      { codigo: "esperar(200)", espera: "undefined", tipo: "👀" },
      { codigo: 'avisoDeRecogida({ cliente: "Ana", bici: "BH" }, 300)', espera: '"Ana: tu BH está lista"' },
      { codigo: 'programarAvisos([{ ms: 300, texto: "B" }, { ms: 100, texto: "A" }, { ms: 200, texto: "C" }])', espera: '["A", "C", "B"]' },
      { codigo: 'const c = cancelable(100, "a tiempo");\nawait c.promesa', espera: '"a tiempo"' },
      { codigo: 'const c = cancelable(1000, "tarde");\nsetTimeout(() => c.cancelar(), 100);\nawait c.promesa', espera: "💥", maxMs: 500, nota: "al cancelar se rechaza enseguida" },
    ],
    probar: {
      p1: 'console.log("A");\nsetTimeout(() => console.log("B"), 0);\nqueueMicrotask(() => console.log("C"));\nPromise.resolve().then(() => console.log("D"));\nconsole.log("E");',
      p2: 'new Promise((resolve) => { console.log("A"); resolve("C"); }).then((v) => console.log(v));\nconsole.log("B");',
      p3: 'async function f() { console.log("B"); await null; console.log("D"); }\nconsole.log("A");\nf();\nconsole.log("C");',
      p4: 'setTimeout(() => console.log("B"), 20);\nsetTimeout(() => console.log("A"), 0);\nPromise.resolve().then(() => console.log("C")).then(() => console.log("D"));',
    },
  },
  {
    n: 2,
    titulo: "Promesas",
    modulos: ["bloque2/promesas.js"],
    html: `<p>
  <button type="button" id="mecanico">nombreDelMecanico(1, …)</button>
  <button type="button" id="proveedores">compararProveedores("Cadena", …)</button>
  <button type="button" id="limite">conTiempoLimite(pedir("/api/lento"), 1000)</button>
</p>
<p><small>Abre F12 → Network: verás cada petición a /api/… y cuánto tarda. En compararProveedores, «Pedal» siempre falla (500).</small></p>`,
    montar: [
      {
        nombre: "los botones llaman a tus funciones",
        codigo: `const probar = async (texto, promesa) => {
  const t = performance.now();
  try { anota(texto, "→ se cumple con", await promesa, \`(\${Math.round(performance.now() - t)} ms)\`); }
  catch (e) { anota(texto, "→ 💥 se rechaza con", e, \`(\${Math.round(performance.now() - t)} ms)\`); }
};
const proveedores = {
  "Bicis Sur": () => pedirPresupuesto(2).then((p) => p.importe),
  Pedal: () => pedir("/api/caido"),
  Rueda: () => pedirPresupuesto(1).then((p) => p.importe),
};
$("#mecanico").addEventListener("click", () => probar("nombreDelMecanico", nombreDelMecanico(1, pedirReparacion, pedirMecanico)));
$("#proveedores").addEventListener("click", () => probar("compararProveedores", compararProveedores("Cadena", proveedores)));
$("#limite").addEventListener("click", () => probar("conTiempoLimite", conTiempoLimite(pedir("/api/lento"), 1000)));`,
      },
    ],
    ejemplos: [
      {
        codigo: 'const consultarStock = (pieza, cb) => setTimeout(() => (pieza === "Cadena" ? cb(null, 4) : cb(new Error("No hay " + pieza))), 200);\nawait stockDe("Cadena", consultarStock)',
        espera: "4",
        tipo: "👀",
      },
      {
        codigo: 'const consultarStock = (pieza, cb) => setTimeout(() => (pieza === "Cadena" ? cb(null, 4) : cb(new Error("No hay " + pieza))), 200);\nawait stockDe("Sillín", consultarStock)',
        espera: "💥",
        tipo: "👀",
      },
      { codigo: "nombreDelMecanico(1, pedirReparacion, pedirMecanico)", espera: '"Lucía"' },
      { codigo: 'const stock = promisificar((pieza, cb) => setTimeout(() => cb(null, pieza.length), 100));\nawait stock("Cadena")', espera: "6" },
      { codigo: "conTiempoLimite(pedirPresupuesto(1), 2000)", espera: "{ id: 1, importe: 15 }" },
      { codigo: 'conTiempoLimite(pedir("/api/lento"), 500)', espera: "💥", maxMs: 1000 },
      {
        codigo: 'const proveedores = {\n  "Bicis Sur": () => pedirPresupuesto(2).then((p) => p.importe),\n  Pedal: () => pedir("/api/caido"),\n  Rueda: () => pedirPresupuesto(1).then((p) => p.importe),\n};\ncompararProveedores("Cadena", proveedores)',
        espera: '{ proveedor: "Rueda", precio: 15, sinRespuesta: ["Pedal"] }',
        maxMs: 800,
        nota: "a la vez: unos 300 ms, no 900",
      },
    ],
    probar: {
      p1: "Promise.resolve(2).then((x) => { x * 10; }).then((x) => String(x))",
      p2: 'Promise.reject(new Error("pinchazo")).then(() => "A").then(() => "B").catch((e) => e.message).then((m) => m + "!")',
      p3: 'Promise.resolve("ok").finally(() => "otro")',
      p4: 'Promise.any([Promise.reject(new Error("a")), esperar(20).then(() => "b"), esperar(50).then(() => "c")])',
      p5: 'Promise.allSettled([Promise.resolve(1), Promise.reject(new Error("x"))]).then((r) => r.map((x) => x.status).join(","))',
    },
  },
  {
    n: 3,
    titulo: "async / await",
    modulos: ["bloque3/asincrono.js"],
    html: `<p>
  <button type="button" id="paralelo">presupuestosDelDia([1, 2, 3, 4, 5, 6], …)</button>
  <button type="button" id="serie">Lo mismo, uno detrás de otro (para comparar)</button>
  <button type="button" id="pantalla">cargarEnPantalla(9, …) (no existe)</button>
</p>
<p class="estado"></p>
<p><small>Abre F12 → Network y pulsa los dos primeros botones: en la columna «Waterfall» se ve si las peticiones van a la vez o en fila.</small></p>`,
    montar: [
      {
        nombre: "los botones: en paralelo (TU función), en serie y la pantalla",
        codigo: `const medir = async (texto, fn) => {
  const t = performance.now();
  try { const r = await fn(); anota(texto, "→", r.map((p) => p.importe), \`· \${Math.round(performance.now() - t)} ms\`); }
  catch (e) { anota(texto, "→ 💥", e); }
};
$("#paralelo").addEventListener("click", () => medir("presupuestosDelDia", () => presupuestosDelDia([1, 2, 3, 4, 5, 6], pedirPresupuesto)));
$("#serie").addEventListener("click", () => medir("en serie", async () => {
  const lista = [];
  for (const id of [1, 2, 3, 4, 5, 6]) lista.push(await pedirPresupuesto(id));
  return lista;
}));
$("#pantalla").addEventListener("click", async () => {
  const pantalla = {};
  const p = cargarEnPantalla(9, pedirReparacion, pantalla);
  anota("nada más llamarla:", { ...pantalla });
  await p;
  anota("al terminar:", pantalla);
});`,
      },
    ],
    ejemplos: [
      { codigo: "horasDe(1, pedirReparacion)", espera: "2", tipo: "👀" },
      { codigo: "fichaCompleta(1, pedirReparacion, pedirCliente)", espera: '{ id: 1, cliente: "c1", bici: "BH Ultimate", horas: 2, mecanico: "m1", telefono: "600111222" }' },
      { codigo: "const pantalla = {};\nawait cargarEnPantalla(9, pedirReparacion, pantalla);\npantalla", espera: '{ ocupada: false, error: "HTTP 404 en /api/reparaciones/9" }' },
      {
        codigo: "presupuestosDelDia([1, 2, 3], pedirPresupuesto)",
        espera: "[{ id: 1, importe: 15 }, { id: 2, importe: 30 }, { id: 3, importe: 45 }]",
        maxMs: 750,
        nota: "a la vez: unos 300 ms, no 900",
      },
      {
        codigo: "const enviadas = [];\nawait enviarEnOrden([{ id: 1 }, { id: 2 }, { id: 3 }], async (r) => { await esperar(100); enviadas.push(r.id); });\nenviadas",
        espera: "[1, 2, 3]",
      },
      {
        codigo: 'let n = 0;\nawait reintentar(async () => { n++; if (n < 3) throw new Error("falla " + n); return "bien al " + n; }, 5, 200)',
        espera: '"bien al 3"',
      },
    ],
    probar: {
      p1: "(async () => { let suma = 0; [1, 2, 3].forEach(async (n) => { await esperar(10); suma += n; }); return suma; })()",
      p2: "(async () => { const precio = (async () => 30)(); return precio + 5; })()",
      p3: '(async () => { try { return Promise.reject(new Error("x")); } catch { return "pillado"; } })().then((v) => v, () => "se escapa")',
      p4: '(async () => { try { return await Promise.reject(new Error("x")); } catch { return "pillado"; } })().then((v) => v, () => "se escapa")',
      p5: '(async () => { const v = []; const tarea = async (n) => { v.push("+" + n); await esperar(10); v.push("-" + n); }; await Promise.all([tarea(1), tarea(2)]); return v.join(","); })()',
    },
  },
  {
    n: 4,
    titulo: "fetch",
    modulos: ["bloque4/api.js"],
    html: `<p>cargarCatalogo(url, pintar, { limite: 2000 }) con:
  <button type="button" data-url="/piezas.json">/piezas.json</button>
  <button type="button" data-url="/vacio.json">/vacio.json</button>
  <button type="button" data-url="/api/caido">/api/caido (500)</button>
  <button type="button" data-url="/api/lento">/api/lento (5 s)</button>
</p>
<div class="estado"><em>Pulsa un botón</em></div>
<p><button type="button" id="enviar">Terminar una reparación y enviarla a /api/facturas</button></p>
<p><small>Mira cada petición en F12 → Network: el código (200, 201, 500…), las cabeceras, lo que se envía (Payload) y la respuesta. La de /api/lento sale «(canceled)».</small></p>`,
    montar: [
      {
        nombre: "los botones llaman a cargarCatalogo",
        codigo: `${PINTAR}
for (const b of escenario.querySelectorAll("[data-url]")) b.addEventListener("click", () => cargarCatalogo(b.dataset.url, pintar, { limite: 2000 }));`,
      },
      {
        nombre: "el botón llama a enviarReparacion",
        codigo: `$("#enviar").addEventListener("click", async () => {
  const r = new ReparacionUrgente("Ana", "BH Ultimate", 2);
  r.anadirPieza("Cadena 11v", 18);
  r.empezar();
  r.terminar();
  try { anota("enviarReparacion →", await enviarReparacion(r, "/api/facturas")); } catch (e) { anota("💥", e); }
});`,
      },
    ],
    ejemplos: [
      { codigo: 'estadoDe("/api/no-existe")', espera: "404", tipo: "👀" },
      { codigo: "opcionesPOST({ id: 7 })", espera: '{ method: "POST", headers: { Content-Type: "application/json" }, body: "{\\"id\\":7}" }' },
      {
        codigo: 'pedirJSON("/piezas.json")',
        espera: '[{ ref: "P-1", nombre: "Cadena 11v", precio: 18 }, { ref: "P-2", nombre: "Cámara 29", precio: 6.5 }, { ref: "P-3", nombre: "Pastillas de freno", precio: 14 }]',
      },
      { codigo: 'pedirJSON("/api/caido")', espera: "💥" },
      { codigo: 'pedirJSON("/api/no-existe")', espera: "💥", nota: "un 404 no rechaza fetch: hay que mirar res.ok" },
      {
        codigo: 'const r = new Reparacion("Ana", "BH", 2);\nr.empezar();\nr.terminar();\nconst respuesta = await enviarReparacion(r, "/api/facturas");\n[respuesta.ticket === "T-" + r.id, respuesta.recibido.total]',
        espera: "[true, 50]",
      },
      { codigo: 'enviarReparacion(new Reparacion("Ana", "BH", 2), "/api/facturas")', espera: "💥", nota: "no está lista" },
      { codigo: 'const estados = [];\nawait cargarCatalogo("/vacio.json", (e) => estados.push(e.estado));\nestados', espera: '["cargando", "vacio"]' },
      {
        codigo: 'const estados = [];\nawait cargarCatalogo("/api/lento", (e) => estados.push(e.estado + (e.mensaje ? ": " + e.mensaje : "")), { limite: 500 });\nestados',
        espera: '["cargando", "error: El proveedor tarda demasiado"]',
        maxMs: 1500,
      },
      { codigo: '(await traerReparaciones("/pendientes.json")).map((r) => [r.id, r.tipo, r.total])', espera: '[[70, "urgente", 65], [71, "normal", 25]]' },
    ],
    probar: {
      p1: 'new Response("[]", { status: 404 }).ok',
      p2: '(async () => { const r = new Response("[1]"); await r.json(); try { await r.json(); return "dos veces"; } catch { return "error"; } })()',
      p3: 'String({ cliente: "Ana" })',
      p4: 'new Response("<h1>Hola</h1>").json().then(() => "json", (e) => e.name)',
    },
  },
  {
    n: 5,
    titulo: "JSON y localStorage",
    modulos: ["bloque5/guardado.js"],
    html: `<p>
  <button type="button" id="guardar">Guardar 2 reparaciones (con reparacionAJSON)</button>
  <button type="button" id="cargar">cargarReparaciones(localStorage)</button>
  <button type="button" id="romper">Romper lo guardado ("{roto")</button>
</p>
<p><small>Míralo en F12 → Application (Aplicación) → Local Storage → http://localhost:5173, clave «taller:reparaciones». Puedes cambiarlo a mano: tu código no puede reventar.</small></p>`,
    montar: [
      {
        nombre: "los botones guardan, cargan y rompen",
        codigo: `$("#guardar").addEventListener("click", () => {
  const a = new Reparacion("Ana", "BH Ultimate", 2);
  a.anadirPieza("Cadena 11v", 18);
  const b = new ReparacionUrgente("Luis", "Orbea Alma", 1);
  b.empezar();
  guardarJSON(localStorage, "taller:reparaciones", [a, b].map(reparacionAJSON));
  anota("guardadas", a.id, "y", b.id);
});
$("#cargar").addEventListener("click", () => {
  const lista = cargarReparaciones(localStorage);
  anota("cargarReparaciones →", lista.map((r) => \`\${r.constructor.name} \${r.id} · \${r.estado} · \${r.total} €\`));
});
$("#romper").addEventListener("click", () => { localStorage.setItem("taller:reparaciones", "{roto"); anota("roto"); });`,
      },
    ],
    ejemplos: [
      { codigo: 'guardarJSON(localStorage, "taller:prueba", { horas: 2 });\nlocalStorage.getItem("taller:prueba")', espera: '"{\\"horas\\":2}"', tipo: "👀" },
      { codigo: 'asignacionesATexto(new Map([["Lucía", [1, 2]]]))', espera: '"[[\\"Lucía\\",[1,2]]]"' },
      { codigo: "textoAAsignaciones('[[\"Lucía\",[1,2]]]')", espera: 'Map(1) { "Lucía" => [1, 2] }' },
      { codigo: 'localStorage.setItem("taller:roto", "{esto no es JSON");\nleerJSON(localStorage, "taller:roto", "por defecto")', espera: '"por defecto"' },
      { codigo: 'guardarJSON(localStorage, "taller:cero", 0);\nleerJSON(localStorage, "taller:cero", 99)', espera: "0" },
      {
        codigo: 'const r = new ReparacionUrgente("Ana", "BH", 2, { id: 50, entrada: "2026-12-01T08:30:00.000Z" });\nr.anadirPieza("Cadena", 18);\nreparacionAJSON(r)',
        espera: '{ tipo: "urgente", id: 50, cliente: "Ana", bici: "BH", horas: 2, entrada: "2026-12-01T08:30:00.000Z", estado: "pendiente", piezas: [{ nombre: "Cadena", precio: 18 }] }',
      },
      {
        codigo: 'const r = new ReparacionUrgente("Eva", "Trek", 1);\nr.empezar();\nr.terminar();\nconst copia = reparacionDesdeJSON(JSON.parse(JSON.stringify(reparacionAJSON(r))));\n[copia instanceof ReparacionUrgente, copia.id === r.id, copia.estado, copia.entrada.getTime() === r.entrada.getTime()]',
        espera: '[true, true, "lista", true]',
      },
      { codigo: 'localStorage.setItem("taller:reparaciones", "{roto");\ncargarReparaciones(localStorage)', espera: "[]" },
    ],
    probar: {
      p1: 'JSON.stringify(new Map([["Lucía", 2]]))',
      p2: "typeof JSON.parse(JSON.stringify({ entrada: new Date(2026, 11, 1) })).entrada",
      p3: 'JSON.stringify({ total: { importe: 50, toJSON() { return "secreto"; } } })',
      p4: "JSON.parse(null)",
    },
  },
  {
    n: 6,
    titulo: "Simulacro: recibir las reparaciones del día",
    modulos: ["bloque6/simulacro.js"],
    html: `<p>
  <button type="button" id="recibir">recibir()</button>
  <button type="button" id="doble">Dos clics seguidos</button>
  <button type="button" id="caido">recibir() de /api/caido</button>
  <button type="button" id="olvidar">Olvidar lo recibido (borra «taller:recibidas»)</button>
</p>
<div class="estado"><em>El taller está vacío</em></div>
<p><small>/api/del-dia trae 4 bicis (una no es válida) y tarda 600 ms. Prueba: «recibir()» → otra vez «recibir()» (no se repite nada) → recarga la página y «recibir()» (tampoco) → «Dos clics seguidos» (en F12 → Network, una sola petición).</small></p>`,
    montar: [
      {
        nombre: "los botones usan TU crearRecepcion",
        codigo: `const taller = new Taller();
const verTaller = () => { $(".estado").textContent = "🚲 En el taller: " + (taller.reparaciones().map((r) => r.cliente + " (" + r.tipo + ")").join(" · ") || "nada"); };
const recepcion = crearRecepcion(taller, { url: "/api/del-dia", storage: localStorage, limite: 2000 });
const recibir = async (r) => {
  try { anota("recibir() →", await r.recibir()); } catch (e) { anota("💥 se rechaza con", e); }
  verTaller();
};
$("#recibir").addEventListener("click", () => recibir(recepcion));
$("#doble").addEventListener("click", () => { recibir(recepcion); recibir(recepcion); });
$("#caido").addEventListener("click", () => recibir(crearRecepcion(taller, { url: "/api/caido", storage: localStorage })));
$("#olvidar").addEventListener("click", () => { localStorage.removeItem("taller:recibidas"); anota('localStorage.removeItem("taller:recibidas")'); });`,
      },
    ],
    ejemplos: [
      {
        codigo: 'localStorage.removeItem("taller:recibidas");\nconst taller = new Taller();\nconst r = await crearRecepcion(taller, { url: "/api/del-dia", storage: localStorage }).recibir();\n[r, taller.reparaciones().length]',
        espera: "[{ nuevas: 3, repetidas: 0, saltadas: 1 }, 3]",
      },
      {
        codigo: 'crearRecepcion(new Taller(), { url: "/api/del-dia", storage: localStorage }).recibir()',
        espera: "{ nuevas: 0, repetidas: 3, saltadas: 1 }",
        nota: "como si recargaras: las refs ya recibidas están en localStorage",
      },
      {
        codigo: 'const recepcion = crearRecepcion(new Taller(), { url: "/api/del-dia", storage: localStorage });\nconst [a, b] = await Promise.all([recepcion.recibir(), recepcion.recibir()]);\na === b',
        espera: "true",
        nota: "la segunda llamada reutiliza la promesa de la primera",
      },
      { codigo: 'crearRecepcion(new Taller(), { url: "/api/caido", storage: localStorage }).recibir()', espera: "💥" },
      { codigo: 'crearRecepcion(new Taller(), { url: "/api/no-json", storage: localStorage }).recibir()', espera: "💥" },
      { codigo: 'crearRecepcion(new Taller(), { url: "/api/lento", storage: localStorage, limite: 500 }).recibir()', espera: "💥", maxMs: 1500 },
    ],
  },
];

export async function cargarBloque(bloque) {
  const cargados = await Promise.all(bloque.modulos.map(cargarModulo));
  return Object.assign({}, ...cargados);
}

// Las predicciones: el texto de predicciones.js (para leer las expresiones) y tus respuestas
const textos = import.meta.glob("../src/bloque*/predicciones.js", { query: "?raw", import: "default" });
export async function cargarPredicciones(n) {
  const ruta = `../src/bloque${n}/predicciones.js`;
  if (!textos[ruta]) return [];
  const [texto, modulo] = await Promise.all([textos[ruta](), modulos[ruta]()]);
  return [...texto.matchAll(/^\s*(p\d+):.*?\/\/\s*(.+)$/gm)].map(([, clave, expresion]) => ({
    clave,
    expresion: expresion.trim(),
    tuya: modulo.predicciones?.[clave],
  }));
}
