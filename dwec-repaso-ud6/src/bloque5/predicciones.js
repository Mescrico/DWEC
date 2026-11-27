// 🔮 PREDICCIONES · ¿Qué da? Cambia cada undefined por tu respuesta.
// Para probar:  docker compose run --rm web npm run probar 'JSON.stringify(new Map([["Lucía", 2]]))'
export const predicciones = {
  p1: undefined, // JSON.stringify(new Map([["Lucía", 2]]))
  p2: undefined, // typeof JSON.parse(JSON.stringify({ entrada: new Date(2026, 11, 1) })).entrada
  p3: undefined, // JSON.stringify({ total: { importe: 50, toJSON() { return "secreto"; } } })
  p4: undefined, // JSON.parse(null)
};
