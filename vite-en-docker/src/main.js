import catalogoOriginal from './json/productos.json';

function calcularEstado(precioBase, estado) {
    if(estado === "nuevo-precintado") {
        precioBase = precioBase * 1.25;
    }
    if(estado === "usado-como-nuevo") {
        precioBase = precioBase * 1;
    }
    if(estado === "usado-caja-danada") {
        precioBase = precioBase * 0.85;
    }
    if(estado === "solo-cartucho") {
        precioBase = precioBase * 0.7;
    }

    return precioBase;
}

function descuentoVolumen(precioNormal, cantidad) {
    let total = precioNormal * cantidad;

    if(cantidad === 2 || cantidad === 3) {
        total = total * 0.95;
    }
    if(cantidad >= 4) {
        total = total * 0.9;
    }

    return total;
}

function comprobarStockBajo(stock) {
    if(stock < 3) {
        return "⚠ Stock bajo"
    }

    return "";
}

function cargarCatalogo() {
    return structuredClone(catalogoOriginal);
}

let catalogo = cargarCatalogo();

function verCatalogo(catalogo) {
    return catalogo.map((articulo) => {
        const precioVenta = calcularEstado(articulo.precioBase, articulo.estadoConservacion);
        const aviso = comprobarStockBajo(articulo.stock);
        return `Juego: ${articulo.titulo} | ${articulo.plataforma} | ${articulo.categoria} | ${precioVenta.toFixed(2)}€ | Stock: ${articulo.stock} ${aviso}` 
    });
};

console.log("CATÁLOGO ACTUAL");

const lineas = verCatalogo(catalogo);

lineas.forEach((linea) => console.log(linea));
