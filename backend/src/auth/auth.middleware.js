import { verifyToken } from "./auth.service.js";

export function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const [type, token] = header.split(" ");

  if (type !== "Bearer" || !token) {
    return res.status(401).json({ error: "Token requerido" });
  }

  try {
    req.user = verifyToken(token);
    next();
  } catch {
    res.status(401).json({ error: "Token inválido o expirado" });
  }
}
