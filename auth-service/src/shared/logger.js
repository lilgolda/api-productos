import pino from "pino";

// Logging estructurado: cada línea es un JSON con fecha, nivel, servicio y datos.
// Nivel configurable con LOG_LEVEL (info por defecto; "silent" en los tests).
export const logger = pino({
  level: process.env.LOG_LEVEL || "info",
  base: { service: "auth-service" },
  timestamp: pino.stdTimeFunctions.isoTime,
  // Nunca se registran credenciales
  redact: ["req.headers.authorization", "req.headers.cookie"],
});
