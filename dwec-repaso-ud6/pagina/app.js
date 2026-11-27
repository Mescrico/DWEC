// app.js — La página del repaso. No hace falta tocarla: lo tuyo está en src/.
// Monta el escenario del bloque, conecta TUS funciones, deja todo en la consola y ejecuta los ejemplos.
// Aquí casi todo es asíncrono: la página espera a cada promesa y te dice con qué se cumple y cuánto tarda.
// Cada vez que guardas un fichero de src/, Vite recarga la página sola.
import { BLOQUES, cargarBloque, cargarPredicciones, cargarModelo } from "./ejemplos.js";

const n = Number(new URLSearchParams(location.search).get("bloque")) || 1;
const bloque = BLOQUES.find((b) => b.n === n) ?? BLOQUES[0];
const app = document.querySelector("#app");

// ── Mostrar un valor como lo enseñaría la consola (en corto) ──
function mostrar(v, prof = 0) {
  if (v === undefined) return "undefined";
  if (v === null) return "null";
  if (typeof v === "string") return JSON.stringify(v);
  if (typeof v === "function") return /^class\b/.test(Function.prototype.toString.call(v)) ? `class ${v.name}` : `ƒ ${v.name || "(anónima)"}()`;
  if (typeof v !== "object") return String(v);
  if (v instanceof Element) return `<${v.tagName.toLowerCase()}>`;
  if (v instanceof Promise) return "Promise {…}";
  if (v instanceof Response) return `Response { status: ${v.status}, ok: ${v.ok}, url: ${JSON.stringify(v.url)} }`;
  if (v instanceof Date) return Number.isNaN(v.getTime()) ? "Invalid Date" : `Date(${v.toLocaleString("es-ES")})`;
  if (v instanceof Error) return `${v.name}: ${v.message}`;
  if (prof > 3) return "…";
  if (v instanceof Map) return `Map(${v.size}) {${[...v].map(([k, x]) => ` ${mostrar(k, prof + 1)} => ${mostrar(x, prof + 1)}`).join(",")} }`;
  if (Array.isArray(v)) return `[${v.map((x) => mostrar(x, prof + 1)).join(", ")}]`;
  const clase = v.constructor && v.constructor !== Object ? `${v.constructor.name} ` : "";
  const props = Object.entries(v).map(([k, x]) => `${k}: ${mostrar(x, prof + 1)}`);
  return props.length ? `${clase}{ ${props.join(", ")} }` : `${clase}{}`;
}

// ── Ejecutar código como la consola: await se puede usar y el resultado es la última línea ──
// Las funciones del bloque, pedir, esperar, las clases del modelo, escenario, $ y anota están en window: el código las ve por su nombre.
const ejecutarEnGlobal = (codigo) => (0, eval)(codigo); // eval indirecto: cada ejecución con sus propias const

function comoFuncionAsync(codigo) {
  const lineas = codigo.trim().split("\n");
  const ultima = lineas.pop().replace(/;\s*$/, "");
  const conResultado = `(async () => {\n${lineas.join("\n")}\nreturn (${ultima.replace(/^await\s+/, "await ")});\n})()`;
  const sinResultado = `(async () => {\n${codigo}\n})()`;
  try {
    // ¿La última línea es una expresión? Si no (un for, un const…), se ejecuta todo y el resultado es undefined
    new Function(`return async () => {\n${lineas.join("\n")}\nreturn (${ultima});\n}`);
    return conResultado;
  } catch {
    return sinResultado;
  }
}

// Ejecuta, espera si es una promesa y apunta los console.log que salgan mientras tanto (y un poco después)
async function ejecutar(codigo, { capturar = false } = {}) {
  const logs = [];
  const original = console.log;
  if (capturar)
    console.log = (...partes) => {
      logs.push(partes.map((p) => (typeof p === "string" ? p : mostrar(p))).join(" "));
      original(...partes);
    };
  const t = performance.now();
  let r;
  try {
    const valor = ejecutarEnGlobal(comoFuncionAsync(codigo));
    r = { ok: true, valor: await valor };
  } catch (error) {
    r = { ok: false, error };
  }
  r.ms = Math.round(performance.now() - t);
  if (capturar) {
    await new Promise((fin) => setTimeout(fin, 60)); // deja que salgan los setTimeout(…, 0) pendientes
    console.log = original;
  }
  r.logs = logs;
  return r;
}

// ── Pintar ──
const el = (etiqueta, props = {}, ...hijos) => {
  const nodo = Object.assign(document.createElement(etiqueta), props);
  nodo.append(...hijos);
  return nodo;
};

// Un TypeError «x is not a function» casi siempre es que ese método o esa función aún no está escrito
const faltaAlgo = (error) => error instanceof TypeError && / is not a (function|constructor)$/.test(error.message);
// Los errores del programa (no los que se lanzan a propósito con throw new Error o reject)
const errorDePrograma = (error) => [TypeError, ReferenceError, SyntaxError, RangeError].some((C) => error?.constructor === C);

function textoError(error, codigo) {
  if (error?.message === "Sin hacer") return ["pendiente", "⏳ Sin hacer todavía"];
  if (faltaAlgo(error)) {
    console.info(`⏳ ${error.message} (al ejecutar: ${codigo.split("\n").at(-1)})`);
    return ["pendiente", `⏳ Todavía no existe: ${error.message.replace(/ is not a (function|constructor)$/, "")}. ¿Lo has escrito?`];
  }
  // A la consola, con su pila: pinchando en el enlace (src/bloqueN/…:línea) vas directo a la línea que falla
  console.groupCollapsed(`💥 ${error?.name}: ${error?.message} · al ejecutar: ${codigo.split("\n").at(-1)}`);
  console.error(error);
  console.groupEnd();
  return ["mal", `💥 ${error?.name ?? "Error"}: ${error?.message ?? error}   (más detalle en la consola, F12)`];
}

const tiempo = (ms) => (ms >= 20 ? `   · ${ms} ms` : "");

async function filaEjemplo({ codigo, espera, tipo = "✍️", nota, maxMs }, lista) {
  const resultado = el("div", { className: "resultado", textContent: "→ … ejecutando" });
  const fila = el("li", { className: "ejemplo" }, el("span", { className: "tipo", textContent: tipo }), el("pre", { className: "codigo", textContent: codigo }), resultado);
  lista.append(fila);
  const r = await ejecutar(codigo);
  let clase;
  let texto;
  const lento = maxMs && r.ms > maxMs ? `   ✘ tarda demasiado (más de ${maxMs} ms)${nota ? `: ${nota}` : ""}` : "";
  if (espera === "💥") {
    if (r.ok) [clase, texto] = ["mal", `se cumple con ${mostrar(r.valor)}, y debería rechazarse${tiempo(r.ms)}`];
    else if (r.error?.message === "Sin hacer" || errorDePrograma(r.error)) [clase, texto] = textoError(r.error, codigo);
    else [clase, texto] = lento ? ["mal", `💥 se rechaza con ${mostrar(r.error)}${tiempo(r.ms)}${lento}`] : ["bien", `💥 se rechaza con ${mostrar(r.error)}  ✔${tiempo(r.ms)}`];
  } else if (r.ok) {
    const sale = mostrar(r.valor);
    if (sale !== espera) [clase, texto] = ["mal", `${sale}   ✘ se esperaba ${espera}${nota && !maxMs ? ` (${nota})` : ""}${tiempo(r.ms)}`];
    else [clase, texto] = lento ? ["mal", `${sale}${tiempo(r.ms)}${lento}`] : ["bien", `${sale}  ✔${tiempo(r.ms)}`];
  } else {
    [clase, texto] = textoError(r.error, codigo);
  }
  fila.classList.add(clase);
  resultado.textContent = `→ ${texto}`;
}

// El registro: lo que van haciendo tus funciones cuando usas el escenario
const registro = el("ul", { className: "registro" });
function anota(...partes) {
  const texto = partes.map((p) => (typeof p === "string" ? p : mostrar(p))).join(" ");
  registro.prepend(el("li", { textContent: `${new Date().toLocaleTimeString("es-ES")} · ${texto}` }));
  console.info("📝", ...partes);
}

function seccionEscenario() {
  const caja = el("div", { className: "escenario", id: "escenario" });
  caja.innerHTML = bloque.html;
  return [caja, el("div", { className: "panel" }, el("h2", { textContent: "🧩 El escenario" }), el("p", { textContent: "La página de prueba del bloque. Úsala, con F12 abierto (Network, Application). Lo que hacen tus funciones sale en el registro de abajo." }), caja)];
}

async function conectar() {
  const filas = [];
  for (const { nombre, codigo } of bloque.montar ?? []) {
    const r = await ejecutar(codigo);
    const [clase, texto] = r.ok ? ["bien", "✔ conectado"] : textoError(r.error, codigo);
    filas.push(el("li", { className: clase, textContent: `${nombre}  →  ${texto}` }));
  }
  if (filas.length === 0) return "";
  return el("div", { className: "panel" }, el("h2", { textContent: "📝 Lo que pasa en el escenario" }), el("ul", { className: "conexiones" }, ...filas), registro);
}

function seccionPredicciones(predicciones) {
  if (predicciones.length === 0) return "";
  const filas = predicciones.map(({ clave, expresion, tuya }) => {
    const codigo = bloque.probar?.[clave];
    const salida = el("td", { className: "real" });
    const boton = codigo ? el("button", { type: "button", textContent: "Probar", title: codigo }) : el("span", { textContent: "(se piensa)" });
    if (codigo)
      boton.addEventListener("click", async () => {
        salida.textContent = "…";
        const r = await ejecutar(codigo, { capturar: true });
        // Si es una promesa, la página ya ha esperado: lo que sale es el valor con el que se cumple
        const valor = r.ok ? (r.valor === undefined && r.logs.length ? "" : mostrar(r.valor)) : `💥 se rechaza con ${mostrar(r.error)}`;
        const consola = r.logs.length ? `consola: ${r.logs.join(",")}` : "";
        salida.textContent = [consola, valor].filter(Boolean).join(" · ") + tiempo(r.ms);
        console.info(`🔮 ${clave}:\n${codigo}`);
      });
    return el(
      "tr",
      {},
      el("td", { textContent: clave }),
      el("td", {}, el("code", { textContent: expresion })),
      el("td", { textContent: tuya === undefined ? "(sin contestar)" : mostrar(tuya) }),
      el("td", {}, boton),
      salida,
    );
  });
  return el(
    "div",
    { className: "panel" },
    el("h2", { textContent: "🔮 Predicciones" }),
    el("p", { textContent: "Contesta primero en predicciones.js. Después pulsa «Probar»: sale lo que da, lo que escribe en la consola y cuánto tarda. El código exacto, en la consola (F12) y al pasar el ratón por el botón. El PORQUÉ te lo da docker compose run --rm web npm run comprobar." }),
    el(
      "table",
      {},
      el("thead", {}, el("tr", {}, ...["", "Expresión", "Tu respuesta", "", "Lo que da"].map((t) => el("th", { textContent: t })))),
      el("tbody", {}, ...filas),
    ),
  );
}

function seccionProbar() {
  const area = el("textarea", { rows: 5, spellcheck: false, value: bloque.ejemplos.at(-1).codigo });
  const salida = el("pre", { className: "salida" });
  const boton = el("button", { type: "button", textContent: "▶ Ejecutar" });
  boton.addEventListener("click", async () => {
    salida.className = "salida";
    salida.textContent = "… ejecutando";
    const r = await ejecutar(area.value, { capturar: true });
    const consola = r.logs.length ? `\nconsola: ${r.logs.join(" | ")}` : "";
    salida.className = `salida ${r.ok ? "bien" : "mal"}`;
    salida.textContent = (r.ok ? `→ ${mostrar(r.valor)}` : textoError(r.error, area.value)[1]) + tiempo(r.ms) + consola;
  });
  return el(
    "div",
    { className: "panel" },
    el("h2", { textContent: "🧪 Prueba tu código" }),
    el("p", { textContent: "Puedes usar await; se enseña lo que da la última línea, cuánto tarda y lo que sale por console.log. Tienes todo lo del bloque, pedir(ruta), esperar(ms), las clases del modelo (Taller, Reparacion…), fetch y localStorage." }),
    area,
    boton,
    salida,
  );
}

function seccionDepurar(nombres) {
  return el(
    "div",
    { className: "panel depurar" },
    el("h2", { textContent: "🐞 Depurar en el navegador" }),
    el(
      "ol",
      {},
      el("li", { textContent: "F12 → Consola: están tus funciones con su nombre, y pedir, esperar, las clases del modelo, escenario y $. En la consola se puede usar await directamente: " }, el("code", { textContent: nombres.join(", ") })),
      el("li", { textContent: "F12 → Network (Red): cada fetch con su código (200, 404, 500…), sus cabeceras, lo que se envía y lo que responde. En la columna Waterfall ves si las peticiones van a la vez o en fila. Con «No throttling → Offline» simulas que no hay red." }),
      el("li", { textContent: "F12 → Application (Aplicación) → Local Storage: lo que guardan tus funciones. Puedes cambiarlo o borrarlo a mano y recargar." }),
      el("li", { textContent: "Si algo sale 💥, en la consola está el error: pincha en el enlace azul (src/bloque…:línea). Un await sin try/catch que se rechaza sale como «Uncaught (in promise)»." }),
      el("li", { textContent: "Paso a paso: F12 → Sources (Fuentes) → src/bloque… → punto de parada (o debugger; en tu función). Con await, F10 salta a la línea siguiente cuando la promesa termina: así ves el orden real." }),
    ),
  );
}

// ── Arrancar ──
document.querySelector("#bloques").append(
  ...BLOQUES.map((b) => el("a", { href: `?bloque=${b.n}`, className: b.n === bloque.n ? "activo" : "", textContent: `${b.n} · ${b.titulo}` })),
);

let exportado;
try {
  exportado = await cargarBloque(bloque);
} catch (error) {
  console.error(error);
  app.append(
    el("div", { className: "panel mal" }, el("h2", { textContent: "💥 Tu código no se puede cargar" }), el("pre", { textContent: `${error.name}: ${error.message}` }), el("p", { textContent: "Suele ser un error de sintaxis (una llave o un paréntesis de más o de menos). Vite también lo enseña en la terminal. Arréglalo y guarda: la página se recarga sola." })),
  );
}

if (exportado) {
  delete exportado.predicciones;
  const modelo = await cargarModelo();
  const [caja, seccion] = seccionEscenario();
  const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
  // pedir(ruta): los datos de la API de prueba, de verdad (mira F12 → Network). Se rechaza si no es ok
  const pedir = async (ruta) => {
    const res = await fetch(ruta);
    if (!res.ok) throw new Error(`HTTP ${res.status} en ${ruta}`);
    return res.json();
  };
  const pedirReparacion = (id) => pedir(`/api/reparaciones/${id}`);
  const pedirCliente = (id) => pedir(`/api/clientes/${id}`);
  const pedirMecanico = (id) => pedir(`/api/mecanicos/${id}`);
  const pedirPresupuesto = (id) => pedir(`/api/presupuestos/${id}`);
  Object.assign(window, { esperar, pedir, pedirReparacion, pedirCliente, pedirMecanico, pedirPresupuesto }, modelo, exportado, { escenario: caja, $: (selector) => caja.querySelector(selector), anota });
  const nombres = Object.keys(exportado);
  console.info(`Bloque ${bloque.n}: tienes en la consola ${nombres.join(", ")}, pedir, pedirReparacion, pedirCliente, pedirMecanico, pedirPresupuesto, esperar, ${Object.keys(modelo).join(", ")}, escenario y $`);
  app.append(el("h2", { className: "titulo-bloque", textContent: `Bloque ${bloque.n} · ${bloque.titulo}` }), seccion);
  const conexiones = await conectar();
  const anotadoAlMontar = registro.children.length;
  const lista = el("ul", { className: "ejemplos" });
  const predicciones = await cargarPredicciones(bloque.n);
  app.append(
    conexiones,
    el(
      "div",
      { className: "panel" },
      el("h2", { textContent: "▶ Tus funciones, en marcha" }),
      el("p", { textContent: "La página ejecuta estos ejemplos con TU código, uno detrás de otro, cada vez que guardas. 👀 = ejemplo resuelto. docker compose run --rm web npm run comprobar prueba muchos casos más." }),
      lista,
    ),
    seccionPredicciones(predicciones),
    seccionProbar(),
    seccionDepurar(nombres),
  );
  for (const ejemplo of bloque.ejemplos) await filaEjemplo(ejemplo, lista); // en orden: algunos comparten localStorage
  // Lo que hayan anotado los ejemplos no cuenta: en el registro solo queda el montaje y lo que hagas tú
  while (registro.children.length > anotadoAlMontar) registro.firstElementChild.remove();
  document.body.dataset.listo = "si";
}
