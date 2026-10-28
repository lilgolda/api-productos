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

export class ConflictError extends Error {
  constructor(message = "Conflicto") {
    super(message);
    this.name = "ConflictError";
  }
}
