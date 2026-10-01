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

let ventasSesion = [];

function verCatalogo(catalogo) {
    return catalogo.map((articulo) => {
        const precioVenta = calcularEstado(articulo.precioBase, articulo.estadoConservacion);
        const aviso = comprobarStockBajo(articulo.stock);
        return `${articulo.id} - Juego: ${articulo.titulo} | ${articulo.plataforma} | ${articulo.categoria} | ${precioVenta.toFixed(2)}€ | Stock: ${articulo.stock} ${aviso}` 
    });
};

function buscarProducto(catalogo, texto) {
    if(!texto) {
        return null;
    }

    const buscar = texto.trim().toLowerCase();

    return catalogo.find((articulo) => {
        const encontrarID = articulo.id.toString() === buscar;
        const encontrarTitulo = articulo.titulo.toLowerCase().includes(buscar);

        return encontrarID || encontrarTitulo;
    });
};

function registrarVenta(catalogo, juego, cantidad) {
    const producto = catalogo.find((articulo) => articulo.id === juego)
    
    if(!producto) {
        console.log("No existe esa id");
        return null;
    } else if(cantidad > producto.stock) {
        console.log("No hay stock suficiente");
        return null;
    } else if (cantidad <= 0) {
        console.log("Introduce un numero positivo")
        return null;
    };

    const precioUnitario = calcularEstado(producto.precioBase, producto.estadoConservacion);
    const precioFinal = descuentoVolumen(precioUnitario, cantidad);

    const catalogoActualizado = catalogo.map((articulo) => 
        articulo.id === producto.id 
         ? { ...articulo, stock: articulo.stock - cantidad} : articulo
    );

    console.log(`Venta realizada: ${cantidad}x ${producto.titulo} por ${precioFinal.toFixed(2)}€ - Precio Unitario ${precioUnitario}€`);
    if(producto.stock - cantidad < 3) {
        console.log("⚠ Stock bajo");
    };

    return {
        catalogoActualizado: catalogoActualizado,
        venta: {
            titulo: producto.titulo,
            cantidad: cantidad,
            total: precioFinal
        }
    };
}

function reponerStock(catalogo, juego, cantidad) {
    const producto = catalogo.find((articulo) => articulo.id === juego);

    if(!producto) {
        console.log("No existe esa id");
        return null;
    } else if (cantidad <= 0) {
        console.log("No se puede reponer ese numero de articulos");
        return null;
    }

    const catalogoActualizado = catalogo.map((articulo) =>
        articulo.id === producto.id
        ? { ...articulo, stock: articulo.stock + cantidad} : articulo
    );

    console.log(`+${cantidad} unidades añadidas a "${producto.titulo}" - Stock total: ${(producto.stock + cantidad)}`);
    return {
        catalogoActualizado: catalogoActualizado
    };
}

function informeCaja(catalogo, ventas) {
    const totalFacturado = ventas.reduce((acc, venta) => acc + venta.total, 0);
    
    console.log(`Total facturado ${totalFacturado.toFixed(2)}€`);

    const unidadesVendidasPorJuego = ventas.reduce((acc2, venta) => {
        acc2[venta.titulo] = (acc2[venta.titulo] || 0) + venta.cantidad;
        return acc2;
    }, {});

    const nombresJuegos = Object.keys(unidadesVendidasPorJuego);
    const juegoMasVendido = nombresJuegos.reduce((ganador, juegoActual) => {
        if (!ganador || unidadesVendidasPorJuego[juegoActual] > unidadesVendidasPorJuego[ganador]) {
            return juegoActual;
        }
        return ganador;
    }, "");

    if(juegoMasVendido) {
        const unidades = unidadesVendidasPorJuego[juegoMasVendido];
        console.log(`El juego mas vendido es ${juegoMasVendido} con ${unidades}`);
    } else {
        console.log(`No hay ninguna venta todavia para saber el juego mas vendido`);
    }

    const valorStockRestante = catalogo.reduce((acc3, articulo) => {
        const precioUnitario = calcularEstado(articulo.precioBase, articulo.estadoConservacion);
        return acc3 + (precioUnitario * articulo.stock);
    }, 0);

    console.log(`Valor del stock actual ${valorStockRestante.toFixed(2)}`);

    const stockBajo = catalogo.filter((articulo) => articulo.stock < 3);
    if(stockBajo.length > 0) {
        console.log(`Hay ${stockBajo.length} productos con bajo stock`);
        stockBajo.forEach((articulo) => {
            console.log(`${articulo.titulo} le quedan ${articulo.stock} de stock`);
        });
    } else {
        console.log("Todos los productos tienen stock suficiente");
    };
}



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