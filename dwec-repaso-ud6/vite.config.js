// vite.config.js — Vite sirve la página del repaso en http://localhost:5173 (dentro de Docker) y, además, una API de
// prueba del taller para hacer fetch de verdad (mírala en F12 → Network). No hace falta tocarlo.
//
// Lo que hay en public/ se sirve tal cual: /piezas.json, /del-dia.json, /pendientes.json, /vacio.json
// Y la API (todas tardan 300 ms, para que se vea en Network; con ?retardo=ms, lo que digas):
//   GET  /api/reparaciones/1      → { id, cliente, bici, horas, mecanico } · 404 si no existe (hay de la 1 a la 4)
//   GET  /api/clientes/c1         → { id, telefono } · GET /api/mecanicos/m1 → { id, nombre }
//   GET  /api/presupuestos/1      → { id, importe } (de la 1 a la 6)
//   GET  /api/del-dia             → lo mismo que /del-dia.json, pero tarda 600 ms (para los dos clics seguidos)
//   POST /api/facturas            → 201 y { ticket } · 400 si no llega JSON con id
//   GET  /api/caido               → 500 (el servidor falla)
//   GET  /api/lento               → las piezas, pero tarda 5 segundos
//   GET  /api/no-json             → una página HTML, no JSON
const REPARACIONES = {
  1: { id: 1, cliente: "c1", bici: "BH Ultimate", horas: 2, mecanico: "m1" },
  2: { id: 2, cliente: "c2", bici: "Orbea Alma", horas: 1, mecanico: "m2" },
  3: { id: 3, cliente: "c1", bici: "Trek Marlin", horas: 3, mecanico: "m1" },
  4: { id: 4, cliente: "c3", bici: "Brompton", horas: 0.5, mecanico: "m2" },
};
const CLIENTES = { c1: { id: "c1", telefono: "600111222" }, c2: { id: "c2", telefono: "600333444" }, c3: { id: "c3", telefono: "600555666" } };
const MECANICOS = { m1: { id: "m1", nombre: "Lucía" }, m2: { id: "m2", nombre: "Pablo" } };
const PIEZAS = [
  { ref: "P-1", nombre: "Cadena 11v", precio: 18 },
  { ref: "P-2", nombre: "Cámara 29", precio: 6.5 },
  { ref: "P-3", nombre: "Pastillas de freno", precio: 14 },
];
const DEL_DIA = [
  { ref: "R-101", cliente: "Ana", bici: "BH Ultimate", horas: 2, urgente: true },
  { ref: "R-102", cliente: "Luis", bici: "Orbea Alma", horas: 1 },
  { ref: "R-103", cliente: "", bici: "Trek", horas: 1 },
  { ref: "R-104", cliente: "Eva", bici: "Brompton", horas: 0.5 },
];

function apiDePrueba() {
  return {
    name: "api-de-prueba",
    configureServer(servidor) {
      servidor.middlewares.use("/api", async (req, res) => {
        const url = new URL(req.url, "http://localhost");
        const ruta = url.pathname;
        const responder = (status, cuerpo, tipo = "application/json; charset=utf-8") => {
          res.statusCode = status;
          res.setHeader("Content-Type", tipo);
          res.end(tipo.startsWith("application/json") ? JSON.stringify(cuerpo) : cuerpo);
        };
        let cuerpo = "";
        for await (const trozo of req) cuerpo += trozo;
        const porDefecto = ruta === "/lento" ? 5000 : ruta === "/del-dia" ? 600 : 300;
        await new Promise((r) => setTimeout(r, Number(url.searchParams.get("retardo") ?? porDefecto)));

        if (ruta === "/facturas" && req.method === "POST") {
          let datos;
          try {
            datos = JSON.parse(cuerpo);
          } catch {
            return responder(400, { error: `El cuerpo no es JSON: llega ${JSON.stringify(cuerpo)}` });
          }
          if (!String(req.headers["content-type"]).includes("application/json")) return responder(400, { error: "Falta Content-Type: application/json" });
          if (datos?.id === undefined) return responder(400, { error: "Falta el id de la reparación" });
          return responder(201, { ticket: `T-${datos.id}`, recibido: datos });
        }
        const [, recurso, id] = ruta.split("/");
        const tablas = { reparaciones: REPARACIONES, clientes: CLIENTES, mecanicos: MECANICOS };
        if (tablas[recurso] && id) return tablas[recurso][id] ? responder(200, tablas[recurso][id]) : responder(404, { error: `No existe ${ruta}` });
        if (recurso === "presupuestos" && Number(id) >= 1 && Number(id) <= 6) return responder(200, { id: Number(id), importe: Number(id) * 15 });
        if (ruta === "/del-dia") return responder(200, DEL_DIA);
        if (ruta === "/lento") return responder(200, PIEZAS);
        if (ruta === "/caido") return responder(500, { error: "El servidor ha fallado" });
        if (ruta === "/no-json") return responder(200, "<h1>Estamos de mantenimiento</h1>", "text/html; charset=utf-8");
        responder(404, { error: `No existe ${ruta}` });
      });
    },
  };
}

export default {
  plugins: [apiDePrueba()],
  server: {
    host: "0.0.0.0", // para poder abrirla desde tu navegador, fuera del contenedor
    port: 5173,
    strictPort: true,
    // En Windows y Mac, Docker no siempre avisa de que has guardado: así Vite lo mira él mismo
    watch: { usePolling: true, interval: 300 },
  },
};
