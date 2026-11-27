// errores.js — Los errores propios del taller «La Cadena». YA ESTÁ HECHO: no hace falta tocarlo, solo usarlo.
//   throw new ErrorTaller("No existe la reparación 7", { id: 7 });
//   error instanceof ErrorTaller → true · error.name → "ErrorTaller" · error.datos → { id: 7 }

export class ErrorTaller extends Error {
  constructor(mensaje, datos = {}) {
    super(mensaje);
    this.name = "ErrorTaller";
    this.datos = datos;
  }
}

export class ErrorMecanicoLleno extends ErrorTaller {
  constructor(mecanico, max) {
    super(`${mecanico} ya tiene ${max} trabajos`, { mecanico, max });
    this.name = "ErrorMecanicoLleno";
  }
}

export class ErrorEstado extends ErrorTaller {
  constructor(id, estado) {
    super(`La reparación ${id} está «${estado}»: no se puede hacer eso`, { id, estado });
    this.name = "ErrorEstado";
  }
}
