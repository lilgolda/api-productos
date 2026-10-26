import { NotFoundError } from "./errors.js";

export function errorHandler(err, req, res, next) {
  if (err instanceof NotFoundError) {
    return res.status(404).json({ error: err.message });
  }
  next(err);
}
