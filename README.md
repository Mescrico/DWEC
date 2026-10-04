# RetroStock — Gestor de Inventario y Ventas

## BLOQUE 2 (Modelo de Datos)

Para la gestión de los artículos de la tienda, se ha diseñado un modelo de datos estructurado en formato objeto (almacenado inicialmente en `src/data/productos.json`).

Con este diseño se facilita la hora de guardar los datos, tenerlos ordenados y poder buscar a los objetos con mayor facilidad

---

### 1. Estructura y Tipado del Objeto Producto

Cada elemento del catálogo responde al siguiente esquema:

```javascript
{                       
  id: number;                       //Identificador único del juego
  titulo: string;                   //Nombre del juego
  plataforma: string;               //Plataforma del juego
  categoria: string[];              //Lista de categorías del juego
  precioBase: number;               //Precio base del juego
  estadoConservacion: string        //Estado de conservación del juego
  stock: number;                    //Stock del juego
}
```

## BLOQUE 7 (Depuración Guiada)

* **Descripción del bug:** 
  Cuando hacía la opción `1. Ver catálogo` en el menú, la consola no mostraba ningún producto, no se imprimía nada

* **Punto de ruptura (Breakpoint):**
  Usé un breakpoint en la DevTools del navegador en la segunda línea de la función `verCatalogo` dentro de `js/funciones-menu.js`:
  ```javascript
  export function verCatalogo(catalogo) { 
      return catalogo.map(({ id, ... // <-- Breakpoint aquí
  ```
* **Identificación del error**
  Al ver las variables que le llegaban a la funcion, vi que la variable catalogo estaba vacío, y me di cuenta que era porque puse mal la ruta de donde le llegaban los datos 
  ```javascript 
  import catalogoOriginal from './productos.json' en lugar de './json/productos.json'
  ```
  Para arreglarlo simplemente corregí la ruta y ya me mostraba los productos
  