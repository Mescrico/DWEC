import { calcularEstado, descuentoVolumen, comprobarStockBajo } from './regla-de-negocios.js';

export function verCatalogo(catalogo) {
    return catalogo.map(({ id, titulo, plataforma, categoria, precioBase, estadoConservacion, stock }) => {
        const precioVenta = calcularEstado(precioBase, estadoConservacion);
        const aviso = comprobarStockBajo(stock);
        return `${id} - Juego: ${titulo} | ${plataforma} | ${categoria} | ${precioVenta.toFixed(2)}€ | Stock: ${stock} ${aviso}`;
    });
};

export function buscarProducto(catalogo, criterioBusqueda) {
    return catalogo.find(criterioBusqueda);
};

export function registrarVenta(catalogo, juego, cantidad) {
    const producto = catalogo.find((articulo) => articulo.id === juego)
    
    
    if(!producto) {
        console.log("No existe esa id");
        return null;
    } 

    const { id, titulo, precioBase, estadoConservacion, stock } = producto;

    if(cantidad > stock) {
        console.log("No hay stock suficiente");
        return null;
    } else if (cantidad <= 0) {
        console.log("Introduce un numero positivo")
        return null;
    };

    
    const precioUnitario = calcularEstado(precioBase, estadoConservacion);
    const precioFinal = descuentoVolumen(precioUnitario, cantidad);

    const catalogoActualizado = catalogo.map((articulo) => 
        articulo.id === id 
         ? { ...articulo, stock: articulo.stock - cantidad} : articulo
    );

    const precioUnitarioFinal = precioFinal / cantidad;
    console.log(`Venta realizada: ${cantidad}x ${titulo} por ${precioFinal.toFixed(2)}€ - Precio Unitario ${precioUnitario}€, tras descuentos cada uno se queda en ${precioUnitarioFinal.toFixed(2)}€`);
    if(stock - cantidad < 3) {
        console.log("⚠ Stock bajo");
    };

    return {
        catalogoActualizado: catalogoActualizado,
        venta: {
            titulo: titulo,
            cantidad: cantidad,
            total: precioFinal
        }
    };
}

export function reponerStock(catalogo, juego, cantidad) {
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

export function informeCaja(catalogo, ...ventas) {
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

    console.log(`Valor del stock actual ${valorStockRestante.toFixed(2)}€`);

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

export function crearGestorVentas() {
    let ventas = [];

    return {
        agregarVenta: (venta) => ventas.push(venta),
        obtenerVentas: () => [...ventas],
        obtenerTotalVentas: () => ventas.length
    };
}