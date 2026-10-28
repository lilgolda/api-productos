import express from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import { createProxyMiddleware } from "http-proxy-middleware";
import { logger } from "./logger.js";

const startsWithSegment = (prefix) => (pathname) => pathname === prefix || pathname.startsWith(`${prefix}/`);

export function createApp({ authUrl, catalogUrl }) {
  const app = express();
  app.use(pinoHttp({ logger, autoLogging: { ignore: (req) => req.url === "/health" } }));
  app.use(cors());

  app.get("/health", (req, res) => res.json({ status: "ok", service: "gateway" }));

  const onProxyError = (err, req, res) => {
    req.log?.error({ err }, "Servicio no disponible");
    if (!res.headersSent && typeof res.status === "function") {
      res.status(502).json({ error: "Servicio no disponible" });
    }
  };

  app.use(
    createProxyMiddleware({
      pathFilter: startsWithSegment("/auth"),
      target: authUrl,
      changeOrigin: true,
      pathRewrite: { "^/auth": "" },
      on: { error: onProxyError },
    })
  );

  app.use(
    createProxyMiddleware({
      pathFilter: startsWithSegment("/products"),
      target: catalogUrl,
      changeOrigin: true,
      on: { error: onProxyError },
    })
  );

  app.use((req, res) => res.status(404).json({ error: "Ruta no encontrada" }));

  return app;
}
