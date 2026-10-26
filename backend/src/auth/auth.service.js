import jwt from "jsonwebtoken";
import { InvalidCredentialsError } from "../shared/errors.js";

// Usuario fijo para esta etapa del curso
const USER = "admin";
const PASSWORD = "1234";

// Caso de uso: iniciar sesión. Devuelve un JWT o lanza InvalidCredentialsError.
export function login({ username, password }) {
  if (username !== USER || password !== PASSWORD) {
    throw new InvalidCredentialsError();
  }
  return jwt.sign({ username }, process.env.JWT_SECRET, { expiresIn: "1h" });
}

// Caso de uso: comprobar un token. Lanza un error si no es válido.
export function verifyToken(token) {
  return jwt.verify(token, process.env.JWT_SECRET);
}
