import catalogoOriginal from './json/productos.json';
import { verCatalogo, buscarProducto, registrarVenta, reponerStock, informeCaja } from './js/funciones-menu';

function cargarCatalogo() {
    return structuredClone(catalogoOriginal);
}

let catalogo = cargarCatalogo();

let ventasSesion = [];

let salir = false;
do {
    let opcion = prompt(
        "Menu de opciones:\n" +
        "1. Ver catálogo\n" +
        "2. Buscar producto\n" +
        "3. Registrar una Venta\n" +
        "4. Reponer Stock\n" +
        "5. Informe de Caja\n" +
        "6. Salir\n\n" +
        "Introduce una opción:"
    );

    switch (opcion) {
        case "1":
            console.log("Catálogo:")
            const lineas = verCatalogo(catalogo);
            lineas.forEach((linea) => console.log(linea));
            break;
        case "2":
            const texto = prompt("Introduce el ID o el nombre del juego");
            if(texto === null) {
                console.log("Escribe el ID o el nombre del juego");
            }
            const productoEncontrado = buscarProducto(catalogo, texto);

            if(productoEncontrado) {
               console.log("Juego Encontrado");
               console.log(verCatalogo([productoEncontrado])); 
            } else {
                console.log("No hay ningun juego con esa id o con ese titulo");
            };
            break;
        case "3":
            const idVenta = parseInt(prompt("Introduce el ID del juego a vender:"));
            const cantVenta = parseInt(prompt("Introduce la cantidad a vender:"));

            const resultadoVender = registrarVenta(catalogo, idVenta, cantVenta);

            if(resultadoVender !== null) {
                catalogo = resultadoVender.catalogoActualizado;
                ventasSesion.push(resultadoVender.venta)
            };
            break;
        case "4":
            const idReponer = parseInt(prompt("Introduce el ID del juego a reponer:"))
            const cantReponer = parseInt(prompt("Introduce la cantidad a reponer:"))

            const resultadoReponer = reponerStock(catalogo, idReponer, cantReponer);
            
            if(resultadoReponer !== null) {
                catalogo = resultadoReponer.catalogoActualizado;
            };
            break;
        case "5":
            informeCaja(catalogo, ventasSesion);
            break;
        case "6":
            informeCaja(catalogo, ventasSesion);
            console.log("Saliendo");
            salir = true;
            break;
        default:
            console.log("Opcion no valida");
            break;
    };

} while(!salir);