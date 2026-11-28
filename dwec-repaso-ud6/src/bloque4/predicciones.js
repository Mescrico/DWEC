// 🔮 PREDICCIONES · ¿Qué da? Cambia cada undefined por tu respuesta. new Response(cuerpo, { status }) fabrica una
// respuesta como la que te da fetch: así se puede probar sin servidor.
// Para probar:  docker compose run --rm web npm run probar 'new Response("[]", { status: 404 }).ok'
export const predicciones = {
  p1: false, // new Response("[]", { status: 404 }).ok
  p2: "error", // (async () => { const r = new Response("[1]"); await r.json(); try { await r.json(); return "dos veces"; } catch { return "error"; } })()
  p3: "[object Object]", // String({ cliente: "Ana" })
  p4: "SyntaxError", // new Response("<h1>Hola</h1>").json().then(() => "json", (e) => e.name)
};
