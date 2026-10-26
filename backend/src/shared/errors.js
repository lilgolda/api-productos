// Errores de negocio: no saben nada de HTTP ni de la base de datos.
export class NotFoundError extends Error {
  constructor(message = "No encontrado") {
    super(message);
    this.name = "NotFoundError";
  }
}

export class InvalidCredentialsError extends Error {
  constructor() {
    super("Credenciales inválidas");
    this.name = "InvalidCredentialsError";
  }
}
