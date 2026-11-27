# DWEC · Repaso de la UD6 para el Parcial 2 (asincronía y almacenamiento)

**Opcional** y **no cuenta para la nota**: es para preparar el examen del martes 1 de diciembre. El escenario es el
taller de bicis **«La Cadena»**: el modelo (`src/modelo/`) ya está hecho; tú solo lo usas.

Se trabaja **igual que en la práctica**: todo con `docker compose` (Node y Vite van dentro del contenedor; en tu
ordenador no se instala nada más).

```bash
docker compose run --rm web npm install            # 1 vez, con internet (Vite)
docker compose run --rm web npm run comprobar      # todos los bloques (al principio, 5 de 37 en verde: los ejemplos)
docker compose run --rm web npm run comprobar 3    # solo el bloque 3 (un 💡 en cada ejercicio y el porqué de cada predicción)
docker compose run --rm web npm run probar 'EXPR'  # ejecuta código y enseña lo que da (si es una promesa, espera)
docker compose up                                  # la página en http://localhost:5173 (Ctrl+C para pararla)
```

1. Lee la explicación de cada bloque en la web de DWEC: **Practicar → 🎯 Repaso Parcial 2 → UD6 · Asincronía y almacenamiento**.
2. Haz los ejercicios de `src/bloque1` … `src/bloque6` **por bloques y en el orden que quieras**: cada bloque va por
   su cuenta. Empieza por lo que más te cueste y comprueba solo ese bloque. En cada fichero, el 👀 de arriba ya está
   resuelto: léelo antes de empezar.
3. Los ejercicios **➕ son opcionales**, para ir a por nota: el comprobador los enseña aparte y no cuentan en el total.
4. El bloque 6 es un **simulacro**: un ejercicio grande de 5 puntos (+1 ➕). El comprobador te dice cuántos tienes.
5. Para **ver y depurar** tu código: `docker compose up` y abre **http://localhost:5173**. Trae una API de prueba
   del taller (`/api/…` y los JSON de `public/`), así que ahí los `fetch` y el `localStorage` son de verdad: míralos
   con **F12 → Network** y **F12 → Application**. El comprobador, en cambio, usa un `fetch` y un `localStorage` de
   mentira que se portan como los de verdad.
6. Al terminar, contesta `respuestas.md`.
