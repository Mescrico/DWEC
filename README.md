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