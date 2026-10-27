import { NotFoundError, InvalidCredentialsError } from "./errors.js";

// Traduce los errores de negocio a respuestas HTTP (única capa que conoce los códigos)
export function errorHandler(err, req, res, next) {
  if (err instanceof NotFoundError) {
    return res.status(404).json({ error: err.message });
  }
  if (err instanceof InvalidCredentialsError) {
    return res.status(401).json({ error: err.message });
  }
  // Error inesperado: se registra con su detalle y sigue el camino normal de Express (500)
  req.log?.error({ err }, "Error no controlado");
  next(err);
}
