import "dotenv/config";
import { createApp } from "./app.js";
import { logger } from "./logger.js";

const PORT = process.env.PORT || 8080;
const authUrl = process.env.AUTH_SERVICE_URL;
const catalogUrl = process.env.CATALOG_SERVICE_URL;

if (!authUrl || !catalogUrl) {
  logger.error("Faltan AUTH_SERVICE_URL y/o CATALOG_SERVICE_URL");
  process.exit(1);
}

createApp({ authUrl, catalogUrl }).listen(PORT, () =>
  logger.info({ port: Number(PORT), authUrl, catalogUrl }, "gateway escuchando")
);
