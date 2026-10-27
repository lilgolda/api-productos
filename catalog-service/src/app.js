import express from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import { createProductRouter } from "./products/product.routes.js";
import { errorHandler } from "./shared/error-handler.js";
import { logger } from "./shared/logger.js";

// Arma la aplicación Express sin levantar el servidor ni conectar a ninguna base de datos.
// Así se puede probar con Supertest pasando un servicio de prueba.
export function createApp({ productService }) {
  const app = express();
  // Un log por petición (el /health no se registra para no llenar de ruido)
  app.use(pinoHttp({ logger, autoLogging: { ignore: (req) => req.url === "/health" } }));
  app.use(cors());
  app.use(express.json());
  app.get("/health", (req, res) => res.json({ status: "ok", service: "catalog-service" }));
  app.use("/products", createProductRouter(productService));
  app.use(errorHandler);
  return app;
}
