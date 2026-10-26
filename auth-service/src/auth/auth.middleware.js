export function createRequireAuth(service) {
  return function requireAuth(req, res, next) {
    const header = req.headers.authorization || "";
    const [type, token] = header.split(" ");

    if (type !== "Bearer" || !token) {
      return res.status(401).json({ error: "Token requerido" });
    }

    try {
      req.user = service.verifyToken(token);
      next();
    } catch {
      res.status(401).json({ error: "Token inválido o expirado" });
    }
  };
}
