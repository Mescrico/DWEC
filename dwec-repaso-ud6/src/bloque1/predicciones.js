// 🔮 PREDICCIONES · ¿En qué orden salen los console.log? Escribe las letras separadas por comas: "A,B,C".
// Para probar:  docker compose run --rm web npm run probar 'console.log("A"); setTimeout(() => console.log("B"), 0)'
export const predicciones = {
  p1: undefined, // console.log("A"); setTimeout(() => console.log("B"), 0); queueMicrotask(() => console.log("C")); Promise.resolve().then(() => console.log("D")); console.log("E");
  p2: undefined, // new Promise((resolve) => { console.log("A"); resolve("C"); }).then((v) => console.log(v)); console.log("B");
  p3: undefined, // async function f() { console.log("B"); await null; console.log("D"); } console.log("A"); f(); console.log("C");
  p4: undefined, // setTimeout(() => console.log("B"), 20); setTimeout(() => console.log("A"), 0); Promise.resolve().then(() => console.log("C")).then(() => console.log("D"));
};
