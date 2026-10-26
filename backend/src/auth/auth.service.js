import jwt from "jsonwebtoken";
import { InvalidCredentialsError } from "../shared/errors.js";

const USER = "admin";
const PASSWORD = "1234";

export function login({ username, password }) {
  if (username !== USER || password !== PASSWORD) {
    throw new InvalidCredentialsError();
  }
  return jwt.sign({ username }, process.env.JWT_SECRET, { expiresIn: "1h" });
}

export function verifyToken(token) {
  return jwt.verify(token, process.env.JWT_SECRET);
}
