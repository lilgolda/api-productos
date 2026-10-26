import { NotFoundError, InvalidCredentialsError } from "./errors.js";

export function errorHandler(err, req, res, next) {
  if (err instanceof NotFoundError) {
    return res.status(404).json({ error: err.message });
  }
  if (err instanceof InvalidCredentialsError) {
    return res.status(401).json({ error: err.message });
  }
  next(err);
}
