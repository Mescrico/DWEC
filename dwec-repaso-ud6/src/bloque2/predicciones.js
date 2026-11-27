// 🔮 PREDICCIONES · ¿Con qué valor se cumple cada promesa? Cambia cada undefined por tu respuesta.
// Para probar:  docker compose run --rm web npm run probar 'Promise.resolve(2).then((x) => x * 10)'
export const predicciones = {
  p1: "undefined", // Promise.resolve(2).then((x) => { x * 10; }).then((x) => String(x))
  p2: "pinchazo!", // Promise.reject(new Error("pinchazo")).then(() => "A").then(() => "B").catch((e) => e.message).then((m) => m + "!")
  p3: "ok", // Promise.resolve("ok").finally(() => "otro")
  p4: "b", // Promise.any([Promise.reject(new Error("a")), esperar(20).then(() => "b"), esperar(50).then(() => "c")])
  p5: "fulfilled,rejected", // Promise.allSettled([Promise.resolve(1), Promise.reject(new Error("x"))]).then((r) => r.map((x) => x.status).join(","))
};
