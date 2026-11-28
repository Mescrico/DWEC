// 🔮 PREDICCIONES · ¿Con qué valor se cumple cada promesa? Cambia cada undefined por tu respuesta.
// Para probar:  docker compose run --rm web npm run probar '(async () => { … })()'
export const predicciones = {
  p1: 0, // (async () => { let suma = 0; [1, 2, 3].forEach(async (n) => { await esperar(10); suma += n; }); return suma; })()
  p2: "[object Promise]5", // (async () => { const precio = (async () => 30)(); return precio + 5; })()
  p3: "se escapa", // (async () => { try { return Promise.reject(new Error("x")); } catch { return "pillado"; } })().then((v) => v, () => "se escapa")
  p4: "pillado", // (async () => { try { return await Promise.reject(new Error("x")); } catch { return "pillado"; } })().then((v) => v, () => "se escapa")
  p5: "+1,+2,-1,-2", // (async () => { const v = []; const tarea = async (n) => { v.push("+" + n); await esperar(10); v.push("-" + n); }; await Promise.all([tarea(1), tarea(2)]); return v.join(","); })()
};
